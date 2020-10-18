self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('dynamic').then((cache) => {
            return cache.addAll([
                './build/bundle.js',
                './index.html',
                './global.css',
                './feed.webmanifest',
                'https://apis.google.com/js/api:client.js',
                'https://unpkg.com/ical.js@1.4.0/build/ical.js',
            ]);
        })
    );
});

/* This is the Firefox boilerplate. */
// self.addEventListener('fetch', e => {
//     console.log(e.request.url);
//     e.respondWith(
//         caches.match(e.request).then(function (response) {
//             return response || fetch(e.request);
//         })
//     );
// });

/* Much better version: https://jakearchibald.com/2014/offline-cookbook/#stale-while-revalidate */

self.addEventListener('fetch', (event) => {
    event.respondWith(async function () {
        const cache = await caches.open('dynamic');
        const cachedResponse = await cache.match(event.request);
        const networkResponsePromise = fetch(event.request);

        event.waitUntil(async function () {
            const networkResponse = await networkResponsePromise;
            await cache.put(event.request, networkResponse.clone());
        }());

        // Returned the cached response if we have one, otherwise return the network response.
        return cachedResponse || networkResponsePromise;
    }());
});