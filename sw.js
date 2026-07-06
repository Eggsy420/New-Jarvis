// JARVIS service worker — network-first so new versions always win,
// cache fallback so the app still opens offline.
var CACHE = 'jarvis-v4-1';

self.addEventListener('install', function (e) {
  self.skipWaiting(); // new SW takes over immediately
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  // Only handle same-origin GETs (the app shell). Let API/proxy calls pass through untouched.
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request).then(function (res) {
      // Fresh from network — update cache copy
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return res;
    }).catch(function () {
      // Offline — serve last cached version
      return caches.match(e.request);
    })
  );
});
