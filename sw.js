const CACHE_NAME = 'estaco-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/home.html',
  '/profile.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.js',
  // Add other static assets (CSS, JS, images) you want to cache
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
