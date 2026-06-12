// OceanChat Service Worker
// Salvează aplicația local — funcționează fără GitHub după prima încărcare

const CACHE_NAME = 'oceanchat-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// Instalare — salvează fișierele de bază
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activare — șterge cache-urile vechi
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch — strategie: cache-first pentru fișiere locale,
// network-first pentru Supabase / scripturi externe (mereu proaspete)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Pentru Supabase și module externe (esm.sh, fonts) — încearcă rețeaua,
  // dar dacă nu există internet, folosește cache dacă există
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // salvează o copie pentru offline
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Pentru fișierele proprii (HTML, manifest, icons) — cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
