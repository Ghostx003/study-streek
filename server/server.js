import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { getNetworkAddresses } from './networkUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const DIST_DIR = path.resolve(__dirname, '../dist');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory state with persistence
let db = {
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

function persistStore() {
  try {
    const tempFile = `${STORE_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify({ syncStores: db.syncStores }, null, 2), 'utf-8');
    fs.renameSync(tempFile, STORE_FILE);
  } catch (err) {
    console.error('Error saving store.json:', err.message);
  }
}

// Clean up expired pairing sessions every minute
setInterval(() => {
  const now = Date.now();
  for (const token of Object.keys(db.pairingSessions)) {
    if (db.pairingSessions[token].expiresAt < now) {
      delete db.pairingSessions[token];
    }
  }
}, 60000);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${Date.now() - start}ms)`);
    }
  });
  next();
});

// Network information
app.get('/api/network-info', (req, res) => {
  const addrs = getNetworkAddresses();
  res.json({
    ...addrs,
    frontendPort: 5180,
    backendPort: 3001,
    serverTime: Date.now()
  });
});

// Create a new pairing session (Called by Desktop)
app.post('/api/pair/create', (req, res) => {
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

  if (clientOrigin) {
    try {
      const parsed = new URL(clientOrigin);
      if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
        targetHost = parsed.hostname;
      }
      if (parsed.port) {
        targetPort = parsed.port;
      }
    } catch {}
  }

  const qrUrl = `http://${targetHost}:${targetPort}/?pairToken=${token}&syncId=${syncId}&code=${code}`;

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
app.get('/api/pair/poll', (req, res) => {
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

  res.json({ status: 'pending' });
});

// Mobile claims pairing by scanning QR code or entering 6-digit code
app.post('/api/pair/claim', (req, res) => {
  const { token, code, mobileState } = req.body || {};
  let session = null;

  if (token && db.pairingSessions[token]) {
    session = db.pairingSessions[token];
  } else if (code) {
    session = Object.values(db.pairingSessions).find(s => s.code === code.trim());
  }

  if (!session) {
    return res.status(404).json({ error: 'Invalid or expired pairing code/token' });
  }

  if (session.expiresAt < Date.now()) {
    delete db.pairingSessions[session.token];
    return res.status(410).json({ error: 'Pairing session has expired' });
  }

  const syncId = session.syncId;
  const desktopState = session.desktopState;

  // Synchronization logic: "The most recently updated device must win."
  let winnerState = null;
  const desktopTime = (desktopState && desktopState.lastModified) || 0;
  const mobileTime = (mobileState && mobileState.lastModified) || 0;

  if (desktopTime >= mobileTime && desktopState) {
    winnerState = desktopState;
  } else if (mobileState) {
    winnerState = mobileState;
  } else {
    winnerState = desktopState || mobileState || null;
  }

  if (winnerState) {
    winnerState.syncId = syncId;
    winnerState.lastSyncedAt = Date.now();
  }

  // Save to syncStores
  db.syncStores[syncId] = {
    state: winnerState,
    lastModified: winnerState ? winnerState.lastModified : Date.now(),
    updatedAt: Date.now()
  };
  persistStore();

  // Mark session as paired
  session.status = 'paired';
  session.syncedState = winnerState;

  res.json({
    success: true,
    syncId,
    state: winnerState
  });
});

// Regular sync endpoint (Used after initial pairing whenever data changes)
app.post('/api/sync', (req, res) => {
  const { syncId, state, lastModified } = req.body || {};
  if (!syncId) {
    return res.status(400).json({ error: 'syncId is required' });
  }

  const existing = db.syncStores[syncId];
  const incomingTime = lastModified || (state && state.lastModified) || 0;

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
app.get('/api/sync/:syncId', (req, res) => {
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

// Serve frontend build if available
if (fs.existsSync(DIST_DIR)) {
  // Stale asset fallback middleware: if an older cached HTML requests an old hash that was rebuilt, serve latest bundle
  app.use((req, res, next) => {
    if (req.path.startsWith('/assets/index-') && req.path.endsWith('.js')) {
      const distAssetsDir = path.join(DIST_DIR, 'assets');
      if (fs.existsSync(distAssetsDir)) {
        const files = fs.readdirSync(distAssetsDir);
        const exactFile = path.basename(req.path);
        if (files.includes(exactFile)) {
          return res.sendFile(path.join(distAssetsDir, exactFile));
        }
        const jsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
        if (jsFile) {
          return res.sendFile(path.join(distAssetsDir, jsFile));
        }
      }
      return res.type('application/javascript').send('window.location.reload();');
    }

    if (req.path.startsWith('/assets/index-') && req.path.endsWith('.css')) {
      const distAssetsDir = path.join(DIST_DIR, 'assets');
      if (fs.existsSync(distAssetsDir)) {
        const files = fs.readdirSync(distAssetsDir);
        const exactFile = path.basename(req.path);
        if (files.includes(exactFile)) {
          return res.sendFile(path.join(distAssetsDir, exactFile));
        }
        const cssFile = files.find(f => f.startsWith('index-') && f.endsWith('.css'));
        if (cssFile) {
          return res.sendFile(path.join(distAssetsDir, cssFile));
        }
      }
      return res.type('text/css').send('');
    }

    next();
  });

  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  const addrs = getNetworkAddresses();
  console.log(`[StudyStreak Backend] Listening on port ${PORT} (dual-stack IPv4/IPv6)`);
  console.log(`  - Local:     http://localhost:${PORT}`);
  console.log(`  - LAN:       http://${addrs.lanIp}:${PORT}`);
  console.log(`  - Tailscale: http://${addrs.tailscaleIp}:${PORT}`);
});
