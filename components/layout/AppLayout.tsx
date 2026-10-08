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

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Shell>
      <Sidebar />
      <Main>
        <Body>{children}</Body>
      </Main>
    </Shell>
  );
}
