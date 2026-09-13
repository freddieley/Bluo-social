const CACHE='bluo-shell-v1';
const SHELL=['/','/manifest.webmanifest','/icons/icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{const copy=r.clone();if(new URL(e.request.url).origin===location.origin)caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>cached)));});
self.addEventListener('push',e=>{let data={title:'Bluo',body:'Something new is happening.'};try{data={...data,...e.data.json()}}catch{}e.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:'/icons/icon.svg',badge:'/icons/icon.svg',data:data.url||'/'}));});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{const w=list[0];if(w){w.focus();return w.navigate(e.notification.data||'/')}return clients.openWindow(e.notification.data||'/')}));});