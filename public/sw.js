const CACHE='bluo-shell-v4';
const SHELL=['/','/manifest.webmanifest','/icons/icon.svg'];

self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())
));

self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(
    keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))
  )).then(()=>self.clients.claim())
));

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin) return;

  // Never cache Next.js chunks or other generated assets. A stale JS chunk can
  // otherwise be returned as an HTML error page after a deployment, producing
  // the browser's strict MIME-type module error.
  if(url.pathname.startsWith('/_next/')) return;

  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request).then(response=>{
        if(response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put('/',copy)).catch(()=>{});
        }
        return response;
      }).catch(()=>caches.match('/'))
    );
    return;
  }

  // Only the explicit app shell is cached. Other resources stay network-first
  // so deployments cannot leave stale application assets behind.
  if(SHELL.includes(url.pathname)){
    event.respondWith(
      fetch(event.request).then(response=>{
        if(response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(url.pathname,copy)).catch(()=>{});
        }
        return response;
      }).catch(()=>caches.match(url.pathname))
    );
  }
});

self.addEventListener('push',event=>{
  let data={title:'Bluo',body:'Something new is happening.'};
  try{data={...data,...event.data.json()}}catch{}
  event.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:'/icons/icon.svg',badge:'/icons/icon.svg',data:data.url||'/'}));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    const w=list[0];
    if(w){w.focus();return w.navigate(event.notification.data||'/');}
    return clients.openWindow(event.notification.data||'/');
  }));
});
