import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Service worker registration
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // In dev mode, unregister any service workers to ensure live HMR and prevent stale asset caching
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const key of keys) caches.delete(key);
      });
    }
  } else {
    // In production, register the service worker for offline PWA
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}
