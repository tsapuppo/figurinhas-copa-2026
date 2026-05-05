// Service Worker minimalista — só cacheia assets estáticos
const CACHE = 'figurinhas-copa-2026-v3';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // NUNCA interceptar chamadas ao Supabase ou APIs externas
  if (e.request.url.includes('supabase.co')) return;
  if (e.request.url.includes('fonts.googleapis.com')) return;
  if (e.request.url.includes('fonts.gstatic.com')) return;
  // Só GET de assets locais
  if (e.request.method !== 'GET') return;
  if (!e.request.url.includes('github.io')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // sempre busca versão nova, usa cache só se offline
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
