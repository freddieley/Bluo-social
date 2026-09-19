// Bluo no longer uses a service-worker cache for application assets.
// This worker exists only to clean up workers/caches installed by older
// versions of Bluo. It deliberately has no fetch handler, so every request
// goes to the current Vercel deployment and Next.js assets cannot become stale.

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
  );
});

self.addEventListener('push', event => {
  let data = { title: 'Bluo', body: 'Something new is happening.' };
  try { data = { ...data, ...event.data.json() }; } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      data: data.url || '/',
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const w = list[0];
      if (w) {
        w.focus();
        return w.navigate(event.notification.data || '/');
      }
      return clients.openWindow(event.notification.data || '/');
    })
  );
});
