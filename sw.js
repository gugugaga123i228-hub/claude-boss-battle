/* Claude Boss Battle — service worker.
   The page is kept in a cache so the game starts at once and works with no
   internet. The game itself looks for a newer version and reloads with ?v=,
   and that reload goes to the network and refreshes the cache. */
const C='cbb';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
 const r=e.request;
 if(r.method!=='GET')return;
 let u;try{u=new URL(r.url)}catch(err){return}
 if(u.origin!==location.origin)return;        // firebase and everything else: straight to the net
 if(r.headers.has('range'))return;            // the version probe reads 400 bytes: never cache it
 const key=u.origin+u.pathname;               // ?v=6.2 and the plain address are the same file
 if(r.mode==='navigate'){
  const fresh=u.searchParams.has('v');
  e.respondWith((async()=>{
   const c=await caches.open(C);
   if(!fresh){const hit=await c.match(key);if(hit)return hit}
   try{
    const res=await fetch(u.href,{cache:'reload'});
    if(res&&res.status===200)await c.put(key,res.clone());
    return res}
   catch(err){
    const hit=await c.match(key);
    if(hit)return hit;
    return new Response('<h1 style="font:700 20px system-ui;padding:40px;text-align:center">'
     +'Нет интернета, и игра ещё не сохранена.</h1>',{headers:{'Content-Type':'text/html;charset=utf-8'}})}
  })());
  return}
 e.respondWith((async()=>{
  const c=await caches.open(C);
  const hit=await c.match(r);
  if(hit)return hit;
  const res=await fetch(r);
  if(res&&res.status===200)await c.put(r,res.clone());
  return res})().catch(()=>fetch(r)));
});
