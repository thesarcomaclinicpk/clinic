/* The Sarcoma Clinic PK — offline service worker.
   Drop this file next to your app (same folder) when you host it (e.g. GitHub Pages),
   and rename the app to index.html. The app registers it automatically over https.
   It caches the app shell so the clinic keeps opening even with no internet. */
const CACHE = 'sarcoma-clinic-v1';
const SHELL = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                 // never cache API writes
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;  // let Supabase / CDN go to network
  // network-first for the page, fall back to cache when offline
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
      return res;
    }).catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
  );
});
