import type { ReactNode } from 'react';
import styled from '@emotion/styled';
import Badge from '@/components/ui/Badge';
import { HoverTip } from '@/components/ui/Tooltip';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 대상 화면 공용 — 정보 칩(Gray 배지 + 마우스 올리면 내용) · 상자형 key-value(라벨 칸 140 bg-secondary · r8) · JSON 상자.
export function InfoChip({ label, tip, onClick }: { label: string; tip?: ReactNode; onClick?: () => void }) {
  const chip = (
    <span
      role={onClick ? 'button' : undefined}
      style={{ display: 'inline-flex', cursor: onClick ? 'pointer' : 'default' }}
      onClick={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        onClick();
      }}
    >
      <Badge color="gray">{label}</Badge>
    </span>
  );
  return tip ? <HoverTip content={tip} maxWidth={320}>{chip}</HoverTip> : chip;
}

export const BoxKV = styled.dl`
  margin: 0;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.md}px;
  overflow: hidden;
  > div { display: grid; grid-template-columns: 140px minmax(0, 1fr); }
  > div + div { border-top: 1px solid ${color('border-secondary')}; }
  > div > dt { padding: 10px 16px; background: ${color('bg-secondary')}; ${text('text-sm', 'medium')}; color: ${color('text-tertiary')}; }
  > div > dd { margin: 0; padding: 10px 16px; ${text('text-sm', 'regular')}; color: ${color('text-primary')}; word-break: break-all; }
`;

export function KVBox({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <BoxKV>
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </BoxKV>
  );
}

export const Json = styled.pre`
  margin: 0;
  padding: 16px;
  border-radius: ${radius.md}px;
  background: ${color('bg-secondary')};
  ${text('text-sm', 'regular')};
  font-family: inherit;
  color: ${color('text-secondary')};
  white-space: pre-wrap;
  word-break: break-all;
  overflow: auto;
`;

export const SubTitle = styled.h3`
  margin: 0;
  ${text('text-sm', 'semibold')};
  color: ${color('text-primary')};
`;

export const sortedJson = (o: Record<string, unknown>, indent = 2) => JSON.stringify(o, Object.keys(o).sort(), indent);
