const COURTPRIME_CACHE = 'courtprime-shell-v1';
const SHELL_ASSETS = [
    '/',
    '/manifest.webmanifest',
    '/cp.png',
    '/cp3.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(COURTPRIME_CACHE)
            .then((cache) => cache.addAll(SHELL_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== COURTPRIME_CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const copy = response.clone();
                caches.open(COURTPRIME_CACHE).then((cache) => cache.put(event.request, copy));
                return response;
            })
            .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
    );
});
