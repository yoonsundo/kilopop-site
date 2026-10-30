/*
 * kilopop.thundo.kr에 남은 킬로팝 앱 서비스 워커를 지우는 파일.
 * 이 주소는 소개 페이지가 됐고, 앱은 https://app.kilopop.thundo.kr 로 옮겼다.
 * 앱을 열었던 기기의 브라우저가 옛 워커를 갱신하려고 이 파일을 받으면,
 * 새 워커가 바로 켜져 앱이 만든 캐시를 지우고 스스로 해제한 뒤 열린 화면을 새로 고친다.
 * 소개 페이지는 이 파일을 등록하지 않는다. 언제 들를지 모르는 기기를 위해 계속 둔다.
 */
const APP_CACHE_PREFIXES = ['kilopop-', 'kilroy-', 'runshot-'];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => APP_CACHE_PREFIXES.some((p) => k.startsWith(p))).map((k) => caches.delete(k)),
      );
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: 'window' });
      await Promise.all(windows.map((client) => client.navigate(client.url).catch(() => undefined)));
    })(),
  );
});
