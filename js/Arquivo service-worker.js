// service-worker.js
const CACHE_NAME = 'teclado-v4.0.0';
const ASSETS = [
  '/',
  '/index.html',
  '/css/reset.css',
  '/css/estilos.css',
  '/js/main.js',
  '/js/contadorVisitas.js',
  '/sounds-memes/among-sound.mp3',
  // ... outros arquivos
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});