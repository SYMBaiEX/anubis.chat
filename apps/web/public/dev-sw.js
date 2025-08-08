// Development service worker placeholder
// This file prevents 404 errors in development mode
// The actual PWA service worker is generated at build time

self.addEventListener('install', () => {
  console.log('[DEV-SW] Installing development service worker...');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('[DEV-SW] Development service worker activated');
});