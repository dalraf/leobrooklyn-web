const CACHE_NAME = 'leo-brooklyn-cache-v1';
const urlsToCache = [
  '/leobrooklyn-web/',
  '/leobrooklyn-web/index.html',
  '/leobrooklyn-web/js/main.js',
  '/leobrooklyn-web/js/modules/config.js',
  '/leobrooklyn-web/js/scenes/preload.js',
  '/leobrooklyn-web/js/scenes/game.js',
  '/leobrooklyn-web/js/scenes/ui.js',
  '/leobrooklyn-web/js/sprites/player.js',
  '/leobrooklyn-web/js/sprites/enemy.js',
  '/leobrooklyn-web/js/sprites/objects.js',
  '/leobrooklyn-web/images/bg.png',
  '/leobrooklyn-web/images/band_aid.png',
  '/leobrooklyn-web/images/pedra.png',
  // Adicionar todas as imagens de sprites aqui
  // Player
  '/leobrooklyn-web/images/Player-1-Stop-1.png',
  '/leobrooklyn-web/images/Player-1-Stop-2.png',
  '/leobrooklyn-web/images/Player-1-Stop-3.png',
  '/leobrooklyn-web/images/Player-1-Stop-4.png',
  '/leobrooklyn-web/images/Player-1-Walk-1.png',
  '/leobrooklyn-web/images/Player-1-Walk-2.png',
  '/leobrooklyn-web/images/Player-1-Walk-3.png',
  '/leobrooklyn-web/images/Player-1-Walk-4.png',
  '/leobrooklyn-web/images/Player-1-Attack-1.png',
  '/leobrooklyn-web/images/Player-1-Attack-2.png',
  '/leobrooklyn-web/images/Player-1-Attack-3.png',
  '/leobrooklyn-web/images/Player-1-Attack-4.png',
  '/leobrooklyn-web/images/Player-1-Attack-5.png',
  '/leobrooklyn-web/images/Player-1-Atirar-1.png',
  '/leobrooklyn-web/images/Player-1-Atirar-2.png',
  '/leobrooklyn-web/images/Player-1-Atirar-3.png',
  '/leobrooklyn-web/images/Player-1-Atirar-4.png',
  '/leobrooklyn-web/images/Player-1-Atirar-5.png',
  '/leobrooklyn-web/images/Player-1-Hit-1.png',
  '/leobrooklyn-web/images/Player-1-Hit-2.png',
  '/leobrooklyn-web/images/Player-1-Hit-3.png',
  '/leobrooklyn-web/images/Player-1-Hit-4.png',
  // Enemy 1
  '/leobrooklyn-web/images/Enemy-1-Walk-1.png',
  '/leobrooklyn-web/images/Enemy-1-Walk-2.png',
  '/leobrooklyn-web/images/Enemy-1-Walk-3.png',
  '/leobrooklyn-web/images/Enemy-1-Walk-4.png',
  '/leobrooklyn-web/images/Enemy-1-Walk-5.png',
  '/leobrooklyn-web/images/Enemy-1-Attack-1.png',
  '/leobrooklyn-web/images/Enemy-1-Attack-2.png',
  '/leobrooklyn-web/images/Enemy-1-Attack-3.png',
  '/leobrooklyn-web/images/Enemy-1-Attack-4.png',
  '/leobrooklyn-web/images/Enemy-1-Attack-5.png',
  '/leobrooklyn-web/images/Enemy-1-Attack-6.png',
  '/leobrooklyn-web/images/Enemy-1-Hit-1.png',
  '/leobrooklyn-web/images/Enemy-1-Hit-2.png',
  '/leobrooklyn-web/images/Enemy-1-Hit-3.png',
  // Enemy 2
  '/leobrooklyn-web/images/Enemy-2-Walk-1.png',
  '/leobrooklyn-web/images/Enemy-2-Walk-2.png',
  '/leobrooklyn-web/images/Enemy-2-Walk-3.png',
  '/leobrooklyn-web/images/Enemy-2-Walk-4.png',
  '/leobrooklyn-web/images/Enemy-2-Walk-5.png',
  '/leobrooklyn-web/images/Enemy-2-Walk-6.png',
  '/leobrooklyn-web/images/Enemy-2-Attack-1.png',
  '/leobrooklyn-web/images/Enemy-2-Attack-2.png',
  '/leobrooklyn-web/images/Enemy-2-Attack-3.png',
  '/leobrooklyn-web/images/Enemy-2-Attack-4.png',
  '/leobrooklyn-web/images/Enemy-2-Attack-5.png',
  '/leobrooklyn-web/images/Enemy-2-Attack-6.png',
  '/leobrooklyn-web/images/Enemy-2-Hit-1.png',
  '/leobrooklyn-web/images/Enemy-2-Hit-2.png',
  '/leobrooklyn-web/images/Enemy-2-Hit-3.png',
  // Icons
  '/leobrooklyn-web/icons/icon.svg',
  '/leobrooklyn-web/icons/icon-192x192.png',
  '/leobrooklyn-web/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});