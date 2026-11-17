/* Static offline editor only. Never cache credentials, auth pages, APIs, /app HTML or downloads. */
const CACHE = 'bros-sell-offline-editor-v1';
const STATIC = ['/offline.html', '/offline-store.js', '/offline-app.js'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(names.filter(name =>
    name.startsWith('bros-sell-offline-editor-') && name !== CACHE).map(name => caches.delete(name))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (STATIC.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(url.pathname))
      .then(cached => cached || fetch(request)));
    return;
  }
  // Offline navigation fallback; never intercept APIs, /login, /activate,
  // protected files, credential operations or successful online server responses.
  if (request.mode === 'navigate' && (url.pathname === '/app' || url.pathname.startsWith('/app/'))) {
    event.respondWith(fetch(request).catch(async () => {
      const cached = await caches.match('/offline.html');
      return cached || Response.error();
    }));
  }
});