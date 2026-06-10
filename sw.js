// ✅ V349: 한글 친구 서비스워커 — 동적 캐시 버스팅
// ⚠️ 이 파일은 수정 불필요 — App_V***.jsx가 버전을 자동 전달함
 
let CACHE_NAME = 'hc-cache-v1'; // App에서 SET_VERSION 메시지로 덮어씀
 
// App으로부터 버전 수신 → 캐시 이름 업데이트 + 이전 캐시 삭제
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SET_VERSION') {
    const newCache = 'hc-cache-v' + e.data.version;
    if (newCache !== CACHE_NAME) {
      const oldCache = CACHE_NAME;
      CACHE_NAME = newCache;
      // 이전 캐시 삭제
      caches.delete(oldCache).then(() => {
        console.log('[SW] 이전 캐시 삭제:', oldCache, '→ 새 캐시:', newCache);
      });
    }
    CACHE_NAME = newCache;
  }
});
 
// 설치 시 — 즉시 활성화
self.addEventListener('install', () => {
  self.skipWaiting();
});
 
// 활성화 시 — 모든 탭에 즉시 적용
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => {
            console.log('[SW] 구버전 캐시 정리:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});
 
// fetch — network-first (항상 최신 파일 우선)
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
 
