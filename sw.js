// Service Worker for Habit Tracker app
// Handles background notifications and scheduled reminders

const CACHE_NAME = 'habit-tracker-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/script.js',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache).catch(() => {
                // Fail silently, service worker will still work
            });
        })
    );
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                return response;
            }
            return fetch(event.request).then(response => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            }).catch(() => {
                return caches.match('/index.html');
            });
        })
    );
});

// Message event for notifications
self.addEventListener('message', event => {
    if (event.data.type === 'SEND_NOTIFICATION') {
        self.registration.showNotification(event.data.title, event.data.options);
    } else if (event.data.type === 'SCHEDULE_NOTIFICATION') {
        const timeStr = event.data.time;
        scheduleNotificationDaily(timeStr);
    }
});

// Periodic background sync for daily reminders
self.addEventListener('sync', event => {
    if (event.tag === 'daily-reminder') {
        event.waitUntil(sendDailyNotification());
    }
});

async function sendDailyNotification() {
    try {
        self.registration.showNotification('⏰ Habit Reminder', {
            body: 'Time to work on your daily habits!',
            icon: 'icon-192.png',
            badge: 'icon-192.png',
            tag: 'daily-reminder',
            requireInteraction: true
        });
    } catch (error) {
        console.log('Notification error:', error);
    }
}

function scheduleNotificationDaily(timeStr) {
    // Schedule using periodic background sync
    if ('periodicSync' in self.registration) {
        self.registration.periodicSync.register('daily-reminder', {
            minInterval: 24 * 60 * 60 * 1000 // 24 hours
        }).catch(err => console.log('Periodic sync registration failed'));
    } else {
        // Fallback: check time periodically
        setInterval(() => {
            const now = new Date();
            const currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
            if (currentTime === timeStr) {
                sendDailyNotification();
            }
        }, 60000); // Check every minute
    }
}

// Notification click event
self.addEventListener('click', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            for (let i = 0; i < clientList.length; i++) {
                if (clientList[i].url === '/' && 'focus' in clientList[i]) {
                    return clientList[i].focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
