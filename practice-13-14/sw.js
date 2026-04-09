const CACHE_NAME = 'app-shell-v7';
const DYNAMIC_CACHE = 'dynamic-v7';
const ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    '/content/home.html',
    '/content/about.html',
    '/icons/favicon-16x16.png',
    '/icons/favicon-32x32.png',
    '/icons/favicon-128x128.png',
    '/icons/favicon-512x512.png',
    '/icons/apple-touch-icon.png',
    '/icons/favicon.ico'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(k => k !== CACHE_NAME && k !== DYNAMIC_CACHE)
                    .map(k => caches.delete(k))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (url.origin !== location.origin) return;

    if (url.pathname.startsWith('/content/')) {
        event.respondWith(
            fetch(event.request)
                .then(networkRes => {
                    const clone = networkRes.clone();
                    caches.open(DYNAMIC_CACHE).then(cache => {
                        cache.put(event.request, clone);
                    });
                    return networkRes;
                })
                .catch(() => {
                    return caches.match(event.request)
                        .then(cached => cached || caches.match('/content/home.html'));
                })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cached => cached || fetch(event.request))
    );
});

self.addEventListener('push', (event) => {
    console.log('[SW] Получено push-сообщение');
    
    let data = { 
        title: '📝 Новое уведомление', 
        body: '',
        reminderId: null
    };
    
    if (event.data) {
        try {
            data = event.data.json();
            console.log('[SW] Данные:', data);
        } catch(e) {
            data.body = event.data.text();
        }
    }
    
    const options = {
        body: data.body,
        icon: '/icons/favicon-128x128.png',
        badge: '/icons/favicon-32x32.png',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        data: {
            reminderId: data.reminderId,
            url: '/'
        }
    };
    
    if (data.reminderId) {
        options.actions = [
            {
                action: 'snooze',
                title: '⏰ Отложить на 1 минуту'
            }
        ];
    }
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Клик, action:', event.action);
    
    const notification = event.notification;
    const action = event.action;
    const reminderId = notification.data?.reminderId;
    
    notification.close();
    
    if (action === 'snooze') {
        console.log('[SW] Откладывание:', reminderId);
        
        event.waitUntil(
            fetch(`/snooze?reminderId=${reminderId}`, { method: 'POST' })
                .then(response => {
                    if (response.ok) {
                        return self.registration.showNotification('✅ Отложено', {
                            body: 'Напоминание через 1 минуту',
                            icon: '/icons/favicon-128x128.png'
                        });
                    }
                })
                .catch(err => console.error('[SW] Ошибка:', err))
        );
    } else {
        // Обычный клик — отправляем dismiss и открываем приложение
        if (reminderId) {
            fetch(`/dismiss?reminderId=${reminderId}`, { method: 'POST' }).catch(console.error);
        }
        event.waitUntil(clients.openWindow('/'));
    }
});

// Если уведомление закрыто без действия (крестик) — удаляем напоминание
self.addEventListener('notificationclose', (event) => {
    const reminderId = event.notification.data?.reminderId;
    if (reminderId) {
        console.log('[SW] Уведомление закрыто, удаляем напоминание:', reminderId);
        fetch(`/dismiss?reminderId=${reminderId}`, { method: 'POST' }).catch(console.error);
    }
});