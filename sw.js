const CACHE_NAME = 'estaco-v5'; // Increment version on every update
const urlsToCache = [
  '/',
  '/index.html',
  '/home.html',
  '/profile.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.js',
];

// Install: Cache all files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch: Serve from cache, but update cache in the background
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if available, otherwise fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate: Delete old caches and claim clients
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Force the new service worker to take control immediately
  return self.clients.claim();
});
