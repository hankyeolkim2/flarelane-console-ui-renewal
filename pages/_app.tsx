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
  /* Figma _Scroll bar (control fill with bottom padding) — 레일 18 · 배경 없음, 손잡이 6 · 안쪽 6 · 둥글게 · 검정 15% */
  ::-webkit-scrollbar { width: 18px; height: 18px; }
  ::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: transparent; }
  ::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.15); border: 6px solid transparent; border-radius: 9999px; background-clip: padding-box; min-height: 40px; }
  @supports not selector(::-webkit-scrollbar) { * { scrollbar-width: thin; scrollbar-color: rgba(0, 0, 0, 0.15) transparent; } }
`;

type PageWithLayout = AppProps['Component'] & { layout?: 'default' | 'editor' };

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
