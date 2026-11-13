// High-reliability API client with automatic direct-port fallback
// Supports both cloud deployments (Vercel) and local network/Tailscale environments

export async function apiRequest(endpoint, options = {}) {
  const timeoutMs = options.timeoutMs || 4000;
  const isBrowser = typeof window !== 'undefined';
  const hostname = isBrowser ? window.location.hostname : 'localhost';
  const isLocalOrLan =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.') ||
    hostname.startsWith('100.'); // Tailscale

  // Primary candidate: relative URL (works on Vercel serverless and Vite dev proxy)
  const candidates = [endpoint];

  // Direct port 3001 fallback ONLY for local/LAN/Tailscale environments
  if (isBrowser && isLocalOrLan && window.location.port !== '3001') {
    candidates.push(`http://${hostname}:3001${endpoint}`);
    if (hostname === 'localhost') {
      candidates.push(`http://127.0.0.1:3001${endpoint}`);
    }
  }

  let lastError = null;

  for (let i = 0; i < candidates.length; i++) {
    const url = candidates[i];
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timer);

      // Success
      if (res.ok) {
        return res;
      }

      // If client error other than 404, or if this is the last candidate, return the response
      if ((res.status >= 400 && res.status < 500 && res.status !== 404) || i === candidates.length - 1) {
        return res;
      }
    } catch (err) {
      lastError = err;
      // Try next candidate
    }
  }

  throw lastError || new Error(`Network request to ${endpoint} failed`);
}
