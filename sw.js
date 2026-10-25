/* Hilvanta · trabajador sin conexión (app instalable). La página se pide primero a la red y, sin señal, se usa la
   última guardada; las bibliotecas y fuentes se guardan al primer uso. Los datos (Supabase) nunca se guardan aquí:
   los maneja la app (js/sinsenal.js). */
const CACHE = 'hilvanta-v2';
const BASE = ['./', 'index.html', 'manifest.webmanifest', 'icono-192.png', 'icono-512.png', 'icono.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || /supabase\.co$/.test(u.hostname) || u.hostname === 'mindicador.cl' || /open-meteo\.com$/.test(u.hostname)) return;   // datos en vivo: siempre a la red
  if (r.mode === 'navigate' || u.origin === location.origin) {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(k => k.put(r, c)); return res; })
      .catch(() => caches.match(r).then(x => x || caches.match('index.html'))));
    return;
  }
  // Bibliotecas y fuentes (jsdelivr, Google Fonts): lo guardado primero, y se actualiza por detrás
  e.respondWith(caches.match(r).then(x => { const red = fetch(r).then(res => { if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(CACHE).then(k => k.put(r, c)); } return res; }).catch(() => x); return x || red; }));
});
// Avisos (push sin contenido, 25-10-2026): el servidor solo despierta a este trabajador; el texto se ve en la app.
self.addEventListener('push', e => {
  e.waitUntil(self.registration.showNotification('Hilvanta', { body: 'Tienes avisos nuevos. Toca para verlos.', icon: 'icono-192.png', badge: 'icono-192.png', tag: 'hilvanta-avisos', renotify: true }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    const c = cs.find(x => x.url.startsWith(self.registration.scope));
    if (c) { c.postMessage('hilvanta-avisos'); return c.focus(); }
    return self.clients.openWindow('./');
  }));
});
