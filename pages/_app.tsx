import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Global, css } from '@emotion/react';
import AppLayout from '@/components/layout/AppLayout';
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
`;

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>FlareLane 콘솔 프로토타입</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Global styles={globalStyles} />
      <AppLayout>
        <Component {...pageProps} />
      </AppLayout>
    </>
  );
}
