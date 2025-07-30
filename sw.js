// Cambia el número de versión cada vez que actualices los archivos de la app
const CACHE_VERSION = 'v1.1';
const CACHE_NAME = `inventario-respirall-cache-${CACHE_VERSION}`;

const urlsToCache = [
  '/', // Importante para la ruta raíz
  'index.html',
  'style.css',
  'script.js',
  'auth.js',
  'manifest.json',
];

// Instala el Service Worker: abre la caché y guarda todos los archivos de la app.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierta. Guardando archivos de la aplicación...');
        return cache.addAll(urlsToCache);
      }).catch(error => {
        console.error('Fallo al guardar en caché durante la instalación:', error);
      })
  );
});

// Activa el Service Worker: limpia las cachés antiguas que no se estén usando.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercepta las peticiones de red: sirve desde la caché primero, si no, va a la red.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
