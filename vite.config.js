import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'stale-asset-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/assets/index-') && req.url.endsWith('.js')) {
            const distAssetsDir = path.resolve(__dirname, 'dist/assets');
            if (fs.existsSync(distAssetsDir)) {
              const files = fs.readdirSync(distAssetsDir);
              const jsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
              if (jsFile) {
                res.setHeader('Content-Type', 'application/javascript');
                return res.end(fs.readFileSync(path.join(distAssetsDir, jsFile)));
              }
            }
            res.setHeader('Content-Type', 'application/javascript');
            return res.end("console.warn('Stale asset detected, refreshing page...'); window.location.reload();");
          }
          if (req.url && req.url.startsWith('/assets/index-') && req.url.endsWith('.css')) {
            const distAssetsDir = path.resolve(__dirname, 'dist/assets');
            if (fs.existsSync(distAssetsDir)) {
              const files = fs.readdirSync(distAssetsDir);
              const cssFile = files.find(f => f.startsWith('index-') && f.endsWith('.css'));
              if (cssFile) {
                res.setHeader('Content-Type', 'text/css');
                return res.end(fs.readFileSync(path.join(distAssetsDir, cssFile)));
              }
            }
            res.setHeader('Content-Type', 'text/css');
            return res.end('');
          }
          next();
        });
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 5180,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  }
});
