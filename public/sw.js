// Minimal service worker for PWA
// LINE notifications are sent via push messages to the LINE app
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', () => {
    self.clients.claim();
});
