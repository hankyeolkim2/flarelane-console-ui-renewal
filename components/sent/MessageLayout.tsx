import styled from '@emotion/styled';
import { color } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 보낸 메시지 상세 「메시지」 카드 틀 — 왼쪽 key-value + 오른쪽 미리보기 320(Figma 보낸 · 예약 · 반복 상세 공통).
export const MsgCols = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 32px;
  align-items: start;
`;

export const Sub = styled.h3`
  margin: 24px 0 12px;
  ${text('text-md', 'semibold')};
  color: ${color('text-primary')};
`;

export const PreviewCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  > small { ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
`;

