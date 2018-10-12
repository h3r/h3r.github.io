//Offline workers

self.addEventListener('install', function(e) {
    e.waitUntil(caches.open('airhorner').then(function(cache) {
        return cache.addAll(['/', '/index.html', '/projects/index.html', '/teaching/index.html', '/css/style.css', '/js/app.js', '/js/auditpass.js', '/js/cache-polyfill.js', '/assets/bg.jpg', '/assets/bar3.png', '/assets/card-flip.mp3', '/assets/card-flip-out.mp3', '/assets/card.png', '/assets/icon.png', '/assets/fonts/MAGIC.TTF', '/assets/fonts/JaceBeleren-Bold.ttf', '/assets/fonts/2009\ GLC\ Plantin-Normal.otf']);
    }));
});

self.addEventListener('fetch', function(event) {

    console.log(event.request.url);

    event.respondWith(
    caches.match(event.request).then(function(response) {
        return response || fetch(event.request);
    })
    );

});

var onTouchStart = function(o) {}
document.addEventListener('touchstart', onTouchStart, {
    passive: true
});

// if('serviceWorker' in navigator) {
//     navigator.serviceWorker
//             .register('/js/app.js')
//             .then(function() { console.log("Service Worker Registered"); });
// }
