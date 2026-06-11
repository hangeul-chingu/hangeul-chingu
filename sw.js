// ✅ V351: 한글 친구 서비스워커 — 캐시 미사용, 항상 네트워크 우선
// 한글 친구는 AI·Firebase·STT 등 모든 기능이 인터넷 필수이므로
// 오프라인 캐시가 불필요 → 캐시 완전 미사용으로 흰 화면 문제 근본 해결

self.addEventListener('install', () => {
  self.skipWaiting(); // 즉시 활성화
});

self.addEventListener('activate', (e) => {
  // 기존 캐시 전체 삭제
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 캐시 완전 미사용 — 항상 네트워크에서 최신 파일 로드
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request));
});
