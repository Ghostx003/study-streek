// High-reliability API client with automatic direct-port fallback
// Prevents Vite proxy socket stalls or IPv6/IPv4 lookup delays

export async function apiRequest(endpoint, options = {}) {
  const timeoutMs = options.timeoutMs || 2500;
  const isBrowser = typeof window !== 'undefined';
  const hostname = isBrowser ? window.location.hostname : 'localhost';

  // Priority candidates:
  // 1. Relative URL (uses Vite proxy or direct Express if served on 3001)
  // 2. Direct port 3001 on current hostname (bypasses Vite proxy if stalled)
  // 3. Direct 127.0.0.1:3001 if on localhost
  const candidates = [endpoint];

  if (isBrowser && window.location.port !== '3001') {
    candidates.push(`http://${hostname}:3001${endpoint}`);
    if (hostname === 'localhost') {
      candidates.push(`http://127.0.0.1:3001${endpoint}`);
    }
  }

  let lastError = null;

  for (const url of candidates) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timer);

      // Return valid responses (including 400s with error messages)
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        return res;
      }
    } catch (err) {
      lastError = err;
      // Try next candidate
    }
  }

  throw lastError || new Error(`Network request to ${endpoint} failed`);
}
