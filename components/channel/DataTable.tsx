import type { ReactNode } from 'react';
import styled from '@emotion/styled';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma 표(Panel) — 머리 40(xs SemiBold text-quaternary) · 행 64 · 아래 테두리. 누르면 열리는 표만 행 Hover(bg-secondary).
const Wrap = styled.div<{ $card: boolean }>`
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  box-shadow: ${(p) => (p.$card ? shadow.xs : 'none')};
  overflow: hidden;
`;

const Row = styled.div<{ cols: string; $click: boolean; $sub: boolean }>`
  display: grid;
  grid-template-columns: ${(p) => p.cols};
  border-bottom: 1px solid ${color('border-secondary')};
  background: ${(p) => (p.$sub ? color('bg-secondary') : 'transparent')};
  cursor: ${(p) => (p.$click ? 'pointer' : 'default')};
  transition: background-color 0.1s linear;
  &:last-of-type { border-bottom: 0; }
  ${(p) => (p.$click ? `&:hover { background: ${color('bg-secondary')}; }` : '')}
  > div { display: flex; align-items: center; gap: 12px; min-width: 0; height: 63px; padding: 0 20px; ${text('text-sm', 'medium')}; color: ${color('text-primary')}; }
`;

const Head = styled.div<{ cols: string }>`
  display: grid;
  grid-template-columns: ${(p) => p.cols};
  border-bottom: 1px solid ${color('border-secondary')};
  > div { display: flex; align-items: center; height: 39px; padding: 0 20px; ${text('text-xs', 'semibold')}; color: ${color('text-quaternary')}; }
`;

export type Column = { label: string; width: string };
export type TableRow = { key: string; cells: ReactNode[]; onClick?: () => void; sub?: boolean };

export default function DataTable({ columns, rows, card = false, empty }: { columns: Column[]; rows: TableRow[]; card?: boolean; empty?: ReactNode }) {
  const cols = columns.map((c) => c.width).join(' ');
  return (
    <Wrap $card={card}>
      <Head cols={cols}>
        {columns.map((c, i) => (
          <div key={i}>{c.label}</div>
        ))}
      </Head>
      {rows.length === 0 && empty}
      {rows.map((r) => (
        <Row key={r.key} cols={cols} $click={!!r.onClick} $sub={!!r.sub} role={r.onClick ? 'link' : undefined} onClick={r.onClick}>
          {r.cells.map((c, i) => (
            <div key={i}>{c}</div>
          ))}
        </Row>
      ))}
    </Wrap>
  );
}

export const Sub = styled.span`
  display: block;
  ${text('text-sm', 'regular')};
  color: ${color('text-tertiary')};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Dot = styled.i<{ tone: 'success' | 'error' | 'gray' | 'warning' }>`
  display: inline-block;
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => (p.tone === 'success' ? color('fg-success-secondary') : p.tone === 'error' ? color('fg-error-secondary') : p.tone === 'warning' ? color('fg-warning-secondary') : color('fg-quaternary'))};
`;
