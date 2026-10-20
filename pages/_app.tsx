import type { AppProps } from 'next/app';
import Head from 'next/head';
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
  /* Figma _Scroll bar(1665:32428) — 막대 = 완전 둥글게 · 검정 20% · 바깥 1px 흰 선(20%) · 트랙 없음 · 사방 여백 2.
     기본 = sm(칸 8 · 막대 4: 표 가로 · 입력 · 카드 안 목록) / 페이지(html) = md(칸 10 · 막대 6) / 팝오버 메뉴 안 = Menu(위 · 아래 4 · 흰 선 없음) */
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  html::-webkit-scrollbar, body::-webkit-scrollbar { width: 10px; } /* 크롬은 창 스크롤바 모양을 body 규칙에서 먼저 가져옴 */
  ::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: transparent; }
  ::-webkit-scrollbar-thumb {
    border: 2px solid transparent;
    border-radius: 9999px;
    background: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)) padding-box,
      linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2)) center / calc(100% - 2px) calc(100% - 2px) no-repeat border-box;
  }
  ::-webkit-scrollbar-thumb:vertical { min-height: 40px; }
  ::-webkit-scrollbar-thumb:horizontal { min-width: 40px; }
  [data-floating] ::-webkit-scrollbar-track:vertical { margin-block: 2px; }
  [data-floating] ::-webkit-scrollbar-thumb { background: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)) padding-box; }
  @supports not selector(::-webkit-scrollbar) { * { scrollbar-width: thin; scrollbar-color: rgba(0, 0, 0, 0.2) transparent; } }
  /* 모달 · 서랍 · 전체 화면 편집기(data-cover)가 열려 있는 동안 페이지 스크롤 잠금 — 스크롤바 자리 처리는 AppLayout */
  html:has([data-cover]) { overflow: hidden; }
`;

type PageWithLayout = AppProps['Component'] & { layout?: 'default' | 'editor' | 'full' };

export default function App({ Component, pageProps }: AppProps) {
  const layout = (Component as PageWithLayout).layout ?? 'default';
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
