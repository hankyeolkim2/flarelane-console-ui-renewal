import type { ReactNode } from 'react';
import styled from '@emotion/styled';
import Sidebar from './Sidebar';
import { color } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 페이지 = 사이드바 + 본문(최대 1200 가운데 정렬, 좌우 32 · 위 32).
const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${color('bg-secondary')};
`;

const Main = styled.main`
  flex: 1;
  min-width: 0;
  padding: 32px;
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
  padding: 4px 4px 4px 0;
  display: flex;
  gap: 4px;
`;

export default function AppLayout({ children, layout = 'default' }: { children: ReactNode; layout?: 'default' | 'editor' }) {
  return (
    <Shell>
      <Sidebar defaultCollapsed={layout === 'editor'} />
      {layout === 'editor' ? (
        <EditorMain>{children}</EditorMain>
      ) : (
        <Main>
          <Body>{children}</Body>
        </Main>
      )}
    </Shell>
  );
}
