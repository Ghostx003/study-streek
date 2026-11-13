// Device detection for Desktop vs Mobile behavior

export function detectIsMobile() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // Check userAgent
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isMobileUA = mobileRegex.test(ua);

  // Check touch points and screen width
  const hasTouchScreen = (
    navigator.maxTouchPoints > 1 ||
    'ontouchstart' in window
  );

  const isNarrowScreen = window.innerWidth <= 768;

  return isMobileUA || (hasTouchScreen && isNarrowScreen);
}

export function detectIsDesktop() {
  return !detectIsMobile();
}
