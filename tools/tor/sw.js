// Service Worker des Passwort-Tors [W45]: liefert die entschlüsselten Spieldateien aus dem Cache "amt-spiel".
// Fehlt das Spiel im Cache (kein Passwort, Cache gelöscht), geht es zurück zum Tor (index.html).
const CACHE = 'amt-spiel';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const hit = await (await caches.open(CACHE)).match(url.origin + url.pathname);
    if (hit) return hit;
    if (url.pathname.endsWith('/spiel.html')) return Response.redirect(new URL('index.html', self.registration.scope).href, 302);
    return fetch(e.request);
  })());
});
