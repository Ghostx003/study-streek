import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import app from './app.js';
import { getNetworkAddresses } from './networkUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

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
    if (req.path.startsWith('/api') || req.path.startsWith('/pair') || req.path.startsWith('/sync')) {
      return next();
    }
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
