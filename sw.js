const CACHE = "grimorio-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/ficha.js",
  "./data/magias.js",
  "./data/classes.js",
  "./data/talentos.js",
  "./favicon.svg",
  "./manifest.json",
  "./img/icon-192.png",
  "./img/icon-512.png",
  "./img/icon-512-maskable.png",
  "./img/apple-touch-icon.png"
];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

// stale-while-revalidate: responde do cache na hora (offline garantido),
// mas busca na rede em paralelo pra manter o cache atualizado quando houver internet.
self.addEventListener("fetch", e=>{
  if(e.request.method!=="GET") return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin) return;
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const network=fetch(e.request).then(res=>{
        if(res && res.status===200){
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put(e.request, copy));
        }
        return res;
      }).catch(()=>cached);
      return cached || network;
    })
  );
});
