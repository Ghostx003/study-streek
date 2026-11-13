import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { getNetworkAddresses } from './networkUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// On Vercel / serverless, filesystem outside /tmp is read-only
const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? '/tmp' : path.resolve(__dirname, '../data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch {
  // Ignore filesystem permission errors in serverless
}

// In-memory state with persistence
export const db = {
  syncStores: {}, // syncId -> { state, lastModified, updatedAt }
  pairingSessions: {} // token -> { token, code, status: 'pending'|'paired', syncId, desktopState, syncedState, createdAt, expiresAt }
};

// Load database if exists
if (fs.existsSync(STORE_FILE)) {
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.syncStores) db.syncStores = parsed.syncStores;
  } catch (err) {
    console.error('Failed to load store.json, starting fresh:', err.message);
  }
}

export function persistStore() {
  try {
    const tempFile = `${STORE_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify({ syncStores: db.syncStores }, null, 2), 'utf-8');
    fs.renameSync(tempFile, STORE_FILE);
  } catch (err) {
    // In serverless environments, file writing may be restricted; in-memory db continues
  }
}

// Clean up expired pairing sessions every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const token of Object.keys(db.pairingSessions)) {
    if (db.pairingSessions[token]?.expiresAt < now) {
      delete db.pairingSessions[token];
    }
  }
}, 120000);

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.includes('/api/') || req.path.includes('/pair') || req.path.includes('/sync')) {
      console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${Date.now() - start}ms)`);
    }
  });
  next();
});

// Router for API endpoints (mounted on both /api and root / to support any rewrite pattern)
const router = express.Router();

// Network information
router.get('/network-info', (req, res) => {
  const addrs = getNetworkAddresses();
  res.json({
    ...addrs,
    frontendPort: 5180,
    backendPort: 3001,
    serverTime: Date.now()
  });
});

// Create a new pairing session (Called by Desktop)
router.post('/pair/create', (req, res) => {
  const { token: clientToken, code: clientCode, desktopState, syncId: existingSyncId, clientOrigin } = req.body || {};
  const token = clientToken || crypto.randomBytes(16).toString('hex');
  const code = clientCode || Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code e.g. 583921
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  // Existing or new syncId
  const syncId = existingSyncId || `sync_${crypto.randomBytes(8).toString('hex')}`;

  db.pairingSessions[token] = {
    token,
    code,
    syncId,
    status: 'pending',
    desktopState: desktopState || null,
    syncedState: null,
    createdAt: Date.now(),
    expiresAt
  };

  const addrs = getNetworkAddresses();
  let targetHost = addrs.tailscaleIp || addrs.lanIp || '100.83.20.17';
  let targetPort = 5180;
  let qrBase = `http://${targetHost}:${targetPort}`;

  if (clientOrigin) {
    try {
      const parsed = new URL(clientOrigin);
      if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
        // Production or cloud hosted domain e.g. study-streek.vercel.app
        qrBase = parsed.origin;
      } else {
        qrBase = `http://${targetHost}:${parsed.port || targetPort}`;
      }
    } catch {}
  }

  const qrUrl = `${qrBase}/?pairToken=${token}&syncId=${syncId}&code=${code}`;

  res.json({
    success: true,
    token,
    code,
    syncId,
    expiresAt,
    qrUrl
  });
});

// Desktop polls to see if mobile has paired
router.get('/pair/poll', (req, res) => {
  const { token } = req.query;
  if (!token || !db.pairingSessions[token]) {
    return res.status(404).json({ error: 'Pairing session not found or expired' });
  }

  const session = db.pairingSessions[token];
  if (session.expiresAt < Date.now()) {
    delete db.pairingSessions[token];
    return res.status(410).json({ error: 'Pairing session expired' });
  }

  if (session.status === 'paired') {
    return res.json({
      status: 'paired',
      syncId: session.syncId,
      state: session.syncedState
    });
  }

  return res.json({
    status: 'pending',
    code: session.code,
    syncId: session.syncId
  });
});

// Mobile claims pairing via token or 6-digit code
router.post('/pair/claim', (req, res) => {
  const { token, code, mobileState } = req.body || {};

  let session = null;
  let sessionToken = null;

  if (token && db.pairingSessions[token]) {
    session = db.pairingSessions[token];
    sessionToken = token;
  } else if (code) {
    for (const [t, s] of Object.entries(db.pairingSessions)) {
      if (s.code === String(code).trim() && s.expiresAt > Date.now()) {
        session = s;
        sessionToken = t;
        break;
      }
    }
  }

  if (!session) {
    return res.status(404).json({ error: 'Invalid or expired pairing code/token' });
  }

  const syncId = session.syncId;

  // Merge states (desktop and mobile)
  let existingStore = db.syncStores[syncId] ? db.syncStores[syncId].state : null;
  let baseState = existingStore || session.desktopState || {};
  let incoming = mobileState || {};

  const mergedHistory = {
    ...(baseState.history || {}),
    ...(incoming.history || {})
  };

  const baseTodayTime = baseState.today?.lastModified || 0;
  const mobileTodayTime = incoming.today?.lastModified || 0;
  const chosenToday = mobileTodayTime >= baseTodayTime ? (incoming.today || baseState.today) : (baseState.today || incoming.today);

  const mergedState = {
    today: chosenToday,
    history: mergedHistory,
    preferences: incoming.preferences || baseState.preferences || { theme: 'dark' },
    lastModified: Date.now()
  };

  // Update store
  db.syncStores[syncId] = {
    state: mergedState,
    lastModified: Date.now(),
    updatedAt: Date.now()
  };
  persistStore();

  // Mark session as paired so desktop poll detects it immediately
  session.status = 'paired';
  session.syncedState = mergedState;

  res.json({
    success: true,
    syncId,
    state: mergedState
  });
});

// Save or sync state
router.post('/sync', (req, res) => {
  const { syncId, state, lastModified } = req.body || {};

  if (!syncId || !state) {
    return res.status(400).json({ error: 'syncId and state are required' });
  }

  const incomingTime = lastModified || state.lastModified || Date.now();
  const existing = db.syncStores[syncId];

  if (!existing) {
    db.syncStores[syncId] = {
      state,
      lastModified: incomingTime,
      updatedAt: Date.now()
    };
    persistStore();
    return res.json({ success: true, state, updated: true });
  }

  const existingTime = existing.lastModified || 0;

  if (incomingTime >= existingTime) {
    db.syncStores[syncId] = {
      state,
      lastModified: incomingTime,
      updatedAt: Date.now()
    };
    persistStore();
    return res.json({ success: true, state, updated: true });
  } else {
    // Existing is newer, return existing to client
    return res.json({ success: true, state: existing.state, updated: false });
  }
});

// Fetch latest sync state
router.get('/sync/:syncId', (req, res) => {
  const { syncId } = req.params;
  const existing = db.syncStores[syncId];
  if (!existing) {
    return res.status(404).json({ error: 'Sync record not found' });
  }
  res.json({
    success: true,
    state: existing.state,
    lastModified: existing.lastModified,
    updatedAt: existing.updatedAt
  });
});

// Mount router on both '/api' and '/' to ensure 100% route match with any rewrite config
app.use('/api', router);
app.use(router);

export default app;
