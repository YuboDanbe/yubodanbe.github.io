// Service worker de Musigatari.
// Estrategia: cache-first total. Todo lo que la app necesita para
// funcionar (páginas, JS, CSS con las fuentes ya embebidas, config,
// iconos) se descarga una sola vez al instalar y desde ahí se sirve
// siempre desde el cache, sin depender de la red.
//
// IMPORTANTE: cada vez que edites/agregues un archivo, sube CACHE_VERSION
// para forzar que los teléfonos que ya instalaron la app descarguen la
// versión nueva la próxima vez que abran con conexión.
const CACHE_VERSION = 'musigatari-v2';

// Lista de archivos a precachear. Según avancemos de etapa, se van
// agregando aquí los nuevos .html/.js de cada sección — el resto del
// service worker no necesita tocarse.
const PRECACHE_URLS = [
  './',
  './index.html',
  './inicio.html',
  './inicio.js',
  './manifest.json',
  './shared/fonts.css',
  './shared/styles.css',
  './shared/react.js',
  './shared/react-dom.js',
  './shared/jszip.js',
  './shared/data.js',
  './shared/components.js',
  './shared/storage.js',
  './shared/page-shell.js',
  './config/config.js',
  './config/icon.svg',
  './config/qr.svg',
  './config/explicacion.html',

  // Páginas de las siguientes etapas — si todavía no existen no rompen
  // la instalación (cada una se agrega con su propio try/catch abajo).
  './canciones.html', './canciones.js',
  './agregar.html', './agregar.js',
  './mascanciones.html', './mascanciones.js',
  './listas.html', './listas.js',
  './crearlista.html', './crearlista.js',
  './maslistas.html', './maslistas.js',
  './herramientas.html', './herramientas.js',
  './cancion.html', './cancion.js',
  './lista.html', './lista.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    // cache.addAll aborta todo si UN solo archivo falla (404, etc).
    // Como este proyecto se construye por etapas, algunos archivos de
    // la lista aún no existen — los cacheamos uno por uno para que la
    // falta de un archivo futuro no impida instalar lo que sí existe.
    await Promise.all(PRECACHE_URLS.map(async url => {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res && res.ok) await cache.put(url, res);
      } catch (e) {
        // Archivo de una etapa futura: se cacheará en cuanto exista y
        // se vuelva a instalar el service worker.
      }
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(event.request, { ignoreSearch: true });
    if (cached) return cached;

    try {
      const fresh = await fetch(event.request);
      // Guarda en cache cualquier cosa nueva que se visite estando en
      // línea (por ejemplo, una página agregada en una etapa futura),
      // así la próxima vez ya está disponible sin conexión.
      if (fresh && fresh.ok && event.request.url.startsWith(self.location.origin)) {
        cache.put(event.request, fresh.clone());
      }
      return fresh;
    } catch (err) {
      // Sin red y sin cache: si pedían una página, regresa inicio.html
      // como último recurso en vez de una pantalla en blanco.
      if (event.request.mode === 'navigate') {
        const fallback = await cache.match('./inicio.html');
        if (fallback) return fallback;
      }
      throw err;
    }
  })());
});
