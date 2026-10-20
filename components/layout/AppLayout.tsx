import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/react';
import Sidebar from './Sidebar';
import ChatRoot, { PANEL_W } from '@/components/labs/Chat';
import { setChat, useChat } from '@/lib/chat';
import { color } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 기본 화면은 문서가 스크롤됨 — 오른쪽 스크롤바(18) 자리를 늘 비워 둬서 스크롤이 생기고 없어져도 본문 위치 · 폭이 그대로(10-20 사용자).
// 꽉 찬 화면(캘린더 · 편집)은 문서가 스크롤되지 않으므로 자리를 비우지 않음.
const stableGutter = css`
  html { scrollbar-gutter: stable; }
`;

// 페이지 = 사이드바 + 본문(최대 1200 가운데 정렬, 좌우 32 · 위 32).
const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${color('bg-secondary')};
`;

const Main = styled.main<{ $chat: boolean }>`
  flex: 1;
  min-width: 0;
  padding: 32px;
  margin-right: ${(p) => (p.$chat ? PANEL_W + 4 : 0)}px;
`;

// 꽉 찬 화면(캘린더) — 여백 없이 높이 100vh
const FullMain = styled.main<{ $chat: boolean }>`
  flex: 1;
  min-width: 0;
  height: 100vh;
  padding: 4px;
  margin-right: ${(p) => (p.$chat ? PANEL_W + 4 : 0)}px;
`;

const Body = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const PageTitle = styled.h1`
  margin: 0;
  ${text('display-xs', 'semibold')};
  color: ${color('text-primary')};
`;

// 편집 화면(통계 편집) = 사이드바 접힘 + 본문 여백 4 · 높이 꽉 참 (Figma 「인사이트 편집」 Main p4 g4)
const EditorMain = styled.main`
  flex: 1;
  min-width: 0;
  height: 100vh;
  padding: 4px;
  display: flex;
  gap: 4px;
`;

export default function AppLayout({ children, layout = 'default' }: { children: ReactNode; layout?: 'default' | 'editor' | 'full' }) {
  const c = useChat();
  const router = useRouter();
  // 다른 페이지로 가면 전체 화면 채팅은 도킹으로 돌아옴(docs labs 2-3)
  useEffect(() => {
    const done = () => c.exp && setChat({ exp: false });
    router.events.on('routeChangeComplete', done);
    return () => router.events.off('routeChangeComplete', done);
  }, [router, c]);
  const docked = c.launcher && c.open && !c.exp;
  return (
    <Shell>
      <Sidebar defaultCollapsed={layout === 'editor' || (c.launcher && c.open && c.exp)} />
      {layout === 'editor' ? (
        <EditorMain>{children}</EditorMain>
      ) : layout === 'full' ? (
        <FullMain $chat={docked}>{children}</FullMain>
      ) : (
        <Main $chat={docked}>
          <Global styles={stableGutter} />
          <Body>{children}</Body>
        </Main>
      )}
      <ChatRoot />
    </Shell>
  );
}
