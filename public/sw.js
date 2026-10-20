const CACHE='scentory-2.0.0-r2-20261020';
const SHELL=['/','/index.html','/styles.css','/app.js','/core.mjs','/catalog.json','/assets/icon.svg','/icons/180.png','/icons/192.png','/icons/512.png','/manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('scentory-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('message',e=>{if(e.data?.type==='ACTIVATE')self.skipWaiting();});
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 // Private account responses and external photos are deliberately not cached.
 if(e.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.startsWith('/api/'))return;
 if(e.request.mode==='navigate'){
  e.respondWith(fetch(e.request).then(r=>{if(r.ok&&r.url===e.request.url){const copy=r.clone();caches.open(CACHE).then(c=>c.put('/',copy));}return r;}).catch(()=>caches.match('/')));return;
 }
 if(SHELL.includes(u.pathname))e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request)));
});
