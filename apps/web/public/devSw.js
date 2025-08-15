// Development Service Worker
// Minimal service worker for development mode

self.addEventListener('install', (_event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim all clients to become active immediately
  event.waitUntil(self.clients.claim());
});

// In development, we don't need sophisticated caching
// Just let all requests pass through to the network
self.addEventListener('fetch', (_event) => {
  // Let all requests go through normally in development
  return;
});
