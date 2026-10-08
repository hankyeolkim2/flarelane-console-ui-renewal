import type { NextRouter } from 'next/router';

// [실험] 보드 카드 → 통계 편집 이동을 View Transitions API 로 이어서 보여줌.
// 카드와 편집 화면 결과 카드에 같은 view-transition-name 을 주면 브라우저가 위치 · 크기를 이어 붙인다.
// 지원하지 않는 브라우저는 그냥 이동.
type DocWithVT = Document & { startViewTransition?: (cb: () => Promise<void>) => unknown };

export function pushWithTransition(router: NextRouter, url: string) {
  const doc = document as DocWithVT;
  if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    router.push(url);
    return;
  }
  doc.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        const done = () => {
          router.events.off('routeChangeComplete', done);
          router.events.off('routeChangeError', done);
          resolve(); // 전환 준비 중엔 화면 그리기가 멈춰 rAF 가 안 옴 → 바로 끝냄
        };
        router.events.on('routeChangeComplete', done);
        router.events.on('routeChangeError', done);
        router.push(url);
      }),
  );
}

export const reportVT = (id: string) => `report-${id}`;

// 브라우저 뒤로 · 앞으로도 같은 전환 — 보드 ↔ 통계 편집 사이일 때만
const isAnalytics = (u: string) => /^\/analytics-boards\/[^/]+(\/reports\/[^/?]+)?(\?|$)/.test(u);
export function installPopTransition(router: NextRouter) {
  router.beforePopState(({ as }) => {
    const doc = document as DocWithVT;
    if (!doc.startViewTransition || !isAnalytics(as) || !isAnalytics(router.asPath)) return true;
    doc.startViewTransition(
      () =>
        new Promise<void>((resolve) => {
          const done = () => {
            router.events.off('routeChangeComplete', done);
            router.events.off('routeChangeError', done);
            resolve(); // 전환 준비 중엔 화면 그리기가 멈춰 rAF 가 안 옴 → 바로 끝냄
          };
          router.events.on('routeChangeComplete', done);
          router.events.on('routeChangeError', done);
          router.replace(as, undefined, { scroll: false });
        }),
    );
    return false;
  });
}
