// Offline support: precache the app, serve from cache, refresh app files in the background.
const CACHE = 'scanner-v1';
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'icons/icon-180.png',
  'icons/icon-512.png',
  'js/app.js',
  'js/camera.js',
  'js/cv.js',
  'js/detect.js',
  'js/enhance.js',
  'js/geometry.js',
  'js/pages.js',
  'js/pdf.js',
  'js/review.js',
  'js/store.js',
  'js/ui.js',
  'vendor/opencv.js',
  'vendor/jspdf.umd.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('scanner-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = req.mode === 'navigate' ? 'index.html' : req;
    const cached = await cache.match(key, { ignoreSearch: true });
    const network = fetch(req).then((res) => {
      if (res.ok && !req.url.includes('/vendor/')) cache.put(key, res.clone());
      return res;
    });
    if (cached) {
      event.waitUntil(network.catch(() => {}));
      return cached;
    }
    return network;
  })());
});
