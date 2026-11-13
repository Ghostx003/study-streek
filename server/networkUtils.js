import os from 'os';

export function getNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  let tailscaleIp = null;
  let lanIp = null;

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        if (name.toLowerCase().includes('tailscale') || addr.address.startsWith('100.')) {
          tailscaleIp = addr.address;
        } else if (!lanIp && (addr.address.startsWith('192.168.') || addr.address.startsWith('10.') || addr.address.startsWith('172.'))) {
          lanIp = addr.address;
        }
      }
    }
  }

  return {
    tailscaleIp: tailscaleIp || '100.83.20.17',
    lanIp: lanIp || '127.0.0.1',
    localhost: '127.0.0.1'
  };
}
