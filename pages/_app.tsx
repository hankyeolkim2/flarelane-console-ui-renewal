import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { installPopTransition } from '@/lib/viewTransition';
import { Global, css } from '@emotion/react';
import AppLayout from '@/components/layout/AppLayout';
import Toasts from '@/components/ui/Toasts';
import { StoreProvider } from '@/lib/store';
import { color, cssVariables } from '@/styles/tokens';

const globalStyles = css`
  ${cssVariables}
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    font-size: 14px;
    color: ${color('text-primary')};
    background: ${color('bg-secondary')};
    -webkit-font-smoothing: antialiased;
  }
  button, input, select, textarea { font-family: inherit; }
  a { color: inherit; }
  /* Figma _Scroll bar (control fill with bottom padding) — 레일 18 · 배경 없음, 손잡이 6 · 안쪽 6 · 둥글게 · 검정 15% */
  ::-webkit-scrollbar { width: 18px; height: 18px; }
  ::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: transparent; }
  ::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.15); border: 6px solid transparent; border-radius: 9999px; background-clip: padding-box; min-height: 40px; }
  /* [실험] 카드 → 통계 편집 View Transition: 카드가 커지며 결과 카드로, 조건 패널은 오른쪽에서 들어옴 */
  ::view-transition-group(*) { animation-duration: 0.42s; animation-timing-function: cubic-bezier(0.2, 0, 0, 1); }
  ::view-transition-old(root), ::view-transition-new(root) { animation-duration: 0.25s; }
  /* 캡처를 늘리지 않음 — 박스만 커지고(줄고) 안쪽은 왼쪽 위 기준으로 서로 페이드 */
  ::view-transition-old(sidebar), ::view-transition-new(sidebar),
  ::view-transition-old(*.report-card), ::view-transition-new(*.report-card) { height: 100%; width: auto; object-fit: none; object-position: left top; overflow: clip; }
  ::view-transition-group(*.report-card) { overflow: clip; border-radius: 12px; }
  ::view-transition-new(query-panel) { animation: vt-slide-in 0.42s cubic-bezier(0.2, 0, 0, 1) both; }
  ::view-transition-old(query-panel) { animation: vt-fade-out 0.2s ease both; }
  @keyframes vt-slide-in { from { transform: translateX(48px); opacity: 0; } to { transform: none; opacity: 1; } }
  @keyframes vt-fade-out { to { opacity: 0; } }
    @supports not selector(::-webkit-scrollbar) { * { scrollbar-width: thin; scrollbar-color: rgba(0, 0, 0, 0.15) transparent; } }
`;

type PageWithLayout = AppProps['Component'] & { layout?: 'default' | 'editor' };

export default function App({ Component, pageProps }: AppProps) {
  const layout = (Component as PageWithLayout).layout ?? 'default';
  const router = useRouter();
  useEffect(() => installPopTransition(router), [router]);
  return (
    <>
      <Head>
        <title>FlareLane 콘솔 프로토타입</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Global styles={globalStyles} />
      <StoreProvider>
        <AppLayout layout={layout}>
          <Component {...pageProps} />
        </AppLayout>
        <Toasts />
      </StoreProvider>
    </>
  );
}
