self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('v1').then((cache) => {
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

self.addEventListener('fetch', function (e) {
    console.log(e.request.url);
    e.respondWith(
        caches.match(e.request).then(function (response) {
            return response || fetch(e.request);
        })
    );
});