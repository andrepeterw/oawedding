/* Offline support for the private planner only (scope: /planner/).
   Plain service worker, no libraries. Online it always asks the network first,
   so you get the newest version after a deploy. Offline it falls back to the
   copy saved on your last visit, so the planner opens without a connection.
   Fonts from Google Fonts are not cached, the page falls back to system fonts
   offline. Your planner data is not here, it lives in localStorage. */
const CACHE = 'kp-planner-v1';
const FILES = [
  '/planner/',
  '/planner/planner.css',
  '/planner/planner.js',
  '/planner/tasks.js',
  '/css/tokens.css',
  '/js/main.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(FILES.map(url => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // leave fonts and other sites alone
  const wanted = FILES.includes(url.pathname) || url.pathname === '/planner' || url.pathname === '/planner/index.html';
  if (!wanted) return;
  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          const key = (url.pathname === '/planner' || url.pathname === '/planner/index.html') ? '/planner/' : req;
          caches.open(CACHE).then(cache => cache.put(key, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('/planner/')))
  );
});
