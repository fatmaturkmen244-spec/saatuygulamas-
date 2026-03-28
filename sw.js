// FocusFlow Service Worker v3.0
// Hem çevrimdışı cache hem de arka plan Web Push bildirimleri
const CACHE_NAME = 'focusflow-v3';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// ─── Install — cache static assets ─────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// ─── Activate — clean old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// ─── Fetch — network first, fallback to cache ────────────────────────────────
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('/socket.io/')) return;
    if (event.request.url.includes('/auth/')) return;
    if (event.request.url.includes('/api/')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});

// ─── Push — Arka Planda Bildirim Alma ────────────────────────────────────────
// Uygulama kapalı/sekme arka planda olsa bile bu event tetiklenir.
self.addEventListener('push', (event) => {
    let data = {
        title: 'FocusFlow',
        body: 'Yeni bildirim!',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        url: '/',
        tag: 'focusflow-notification'
    };

    try {
        if (event.data) {
            data = { ...data, ...event.data.json() };
        }
    } catch (e) {
        console.warn('[SW] Push verisi ayrıştırılamadı:', e);
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        tag: data.tag,
        data: { url: data.url },
        requireInteraction: false,
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ─── Notification Click — Bildirime Tıklanınca Uygulamayı Aç ─────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Eğer uygulama zaten açıksa o sekmeye odaklan
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Değilse yeni sekme aç
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
