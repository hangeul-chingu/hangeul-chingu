// ✅ V351: 한글 친구 서비스워커 — 캐시 버스팅 개선
// ⚠️ 이 파일은 수정 불필요 — App_V***.jsx가 버전을 자동 전달함

let CACHE_NAME = 'hc-cache-v1';

// App으로부터 버전 수신 → 캐시 이름 업데이트 + 이전 캐시 삭제
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SET_VERSION') {
    const newCache = 'hc-cache-v' + e.data.version;
    if (newCache !== CACHE_NAME) {
      const oldCache = CACHE_NAME;
      CACHE_NAME = newCache;
      caches.delete(oldCache).then(() => {
        console.log('[SW] 이전 캐시 삭제:', oldCache, '→', newCache);
      });
      // 모든 클라이언트에게 새로고침 요청
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
      });
    }
  }
});

// 설치 시 — 즉시 활성화 (대기 없이)
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// 활성화 시 — 이전 캐시 전체 삭제 + 모든 탭 즉시 제어
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        console.log('[SW] 캐시 삭제:', k);
        return caches.delete(k); // 활성화 시 모든 캐시 초기화
      }))
    ).then(() => self.clients.claim())
  );
});

// fetch — navigate는 항상 네트워크 우선 + 캐시 저장
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // navigate 요청도 캐시에 저장
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  // 나머지 — network-first
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
