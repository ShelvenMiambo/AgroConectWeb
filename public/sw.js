/**
 * Service Worker — AgroConecta
 * Estratégia:
 *  - Navegações (HTML): network-first, fallback ao index.html em cache (SPA + offline).
 *  - Assets estáticos do próprio site (/assets/*, hasheados): cache-first.
 *  - NUNCA cacheia Firebase, Google APIs, Storage nem /api/* (sempre rede).
 * Para forçar atualização, incrementar CACHE_VERSION.
 */
const CACHE_VERSION = 'agroconecta-v1';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Só gere pedidos do próprio site. Firebase/Google/Storage e /api/* vão sempre à rede.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Navegação (SPA): tenta a rede; se falhar (offline), serve o index.html em cache.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Assets estáticos: cache-first com preenchimento em runtime.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
