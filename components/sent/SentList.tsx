import { useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Badge, { type BadgeColor } from '@/components/ui/Badge';
import Floating from '@/components/ui/Floating';
import { MenuItem } from '@/components/ui/Menu';
import { HoverTip } from '@/components/ui/Tooltip';
import { abbrNum, fmt, sourceLabel, type Source } from '@/lib/sent';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma `List row`(511:19125) — 왼쪽 발송 출처 배지(72) · 가운데 글(1줄 말줄임) · 오른쪽 지표 열(160 · 112 · 112, 간격 24) · 끝 ⋯.
// 발송 출처 색(09-30 확정): 콘솔 Brand · API Sky · 테스트 Orange · 시스템 Gray.
const SOURCE_COLOR: Record<Source, BadgeColor> = { console: 'brand', api: 'sky', testDevice: 'orange', system: 'gray' };

export function SourceBadge({ source }: { source: Source }) {
  return <Badge color={SOURCE_COLOR[source]}>{sourceLabel(source)}</Badge>;
}

export const ListCard = styled.div`
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  box-shadow: ${shadow.xs};
  overflow: hidden;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid ${color('border-secondary')};
  background: ${color('bg-primary')};
  cursor: pointer;
  transition: background-color 0.1s linear;
  &:hover { background: ${color('bg-secondary')}; }
`;

const Lead = styled.div`
  flex-shrink: 0;
  width: 72px;
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  > * { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  > small { ${text('text-xs', 'medium')}; }
  > b { ${text('text-md', 'semibold')}; color: ${color('text-primary')}; }
  > em { font-style: normal; ${text('text-sm', 'medium')}; color: ${color('text-brand-secondary')}; }
  > p { ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
  > p[data-lines='2'] { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  > span { display: flex; align-items: center; gap: 4px; ${text('text-xs', 'regular')}; color: ${color('text-quaternary')}; }
  > span > [data-u] { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

const Stats = styled.div`
  flex-shrink: 0;
  display: flex;
  gap: 24px;
  align-items: flex-start;
`;

const Col = styled.div<{ w: number }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: ${(p) => p.w}px;
`;

const Cell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  > small { ${text('text-xs', 'regular')}; color: ${color('text-quaternary')}; }
  > b { ${text('text-sm', 'medium')}; color: ${color('text-primary')}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
  > div { display: flex; gap: 4px; color: ${color('fg-quaternary')}; }
`;

const More = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: ${radius.md}px;
  background: transparent;
  color: ${color('fg-quaternary')};
  cursor: pointer;
  &:hover, &[aria-expanded='true'] { background: ${color('bg-primary_hover')}; color: ${color('fg-quaternary_hover')}; }
`;

// 1,000 이상은 축약 + 마우스를 올리면 전체 숫자
export function Num({ n }: { n: number }) {
  if (n < 1000) return <>{n}</>;
  return (
    <HoverTip content={fmt(n)}>
      <span>{abbrNum(n)}</span>
    </HoverTip>
  );
}

export type Stat = { label: string; value: ReactNode; raw?: boolean };
export type RowContent = { eyebrow?: { text: string; tone: 'brand' | 'primary' }; title?: string; sub?: string; body?: string; bodyLines?: 1 | 2; url?: string; image?: boolean };

export type RowMenuItem = { label: string; icon?: string; destructive?: boolean; onClick: () => void };

// lead 를 넘기면 왼쪽 표지를 바꾸고 출처 배지는 글 맨 위로(예약된 메시지 A안). menu 를 넘기면 ⋯ 메뉴 항목을 바꿈(기본 = 복제).
export function SentRow({ source, content, cols, href, copyHref, lead, menu, onOpen }: { source: Source; content: RowContent; cols: [number, Stat[]][]; href?: string; copyHref?: string; lead?: ReactNode; menu?: RowMenuItem[]; onOpen?: () => void }) {
  const router = useRouter();
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const go = (e: MouseEvent) => {
    if (onOpen) return onOpen();
    if (!href) return;
    // 스테이징: Ctrl/⌘ 클릭은 새 탭
    if (e.metaKey || e.ctrlKey) window.open(href, '_blank');
    else router.push(href);
  };
  const items: RowMenuItem[] = menu ?? (copyHref ? [{ label: '복제', icon: 'content_copy', onClick: () => router.push(copyHref) }] : []);
  return (
    <Row role="link" onClick={go}>
      <Lead>{lead ?? <SourceBadge source={source} />}</Lead>
      <Content>
        {lead && (
          <span style={{ marginBottom: 0 }}>
            <SourceBadge source={source} />
          </span>
        )}
        {content.eyebrow && <small style={{ color: content.eyebrow.tone === 'brand' ? 'var(--text-brand-secondary)' : 'var(--text-primary)' }}>{content.eyebrow.text}</small>}
        {content.title && <b>{content.title}</b>}
        {content.sub && <em>{content.sub}</em>}
        {content.body && <p data-lines={content.bodyLines ?? 1}>{content.body}</p>}
        {(content.url || content.image) && (
          <span>
            {content.url && (
              <>
                <Icon name="link" size={16} />
                <i data-u style={{ fontStyle: 'normal' }}>{content.url}</i>
              </>
            )}
            {content.image && <Icon name="image" size={16} />}
          </span>
        )}
      </Content>
      <Stats>
        {cols.map(([w, cells], i) => (
          <Col key={i} w={w}>
            {cells.map((c) => (
              <Cell key={c.label}>
                <small>{c.label}</small>
                {c.raw ? <div>{c.value}</div> : <b>{c.value}</b>}
              </Cell>
            ))}
          </Col>
        ))}
      </Stats>
      <More
        ref={ref}
        type="button"
        aria-label="더 보기"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <Icon name="more_horiz" size={20} />
      </More>
      <Floating anchorRef={ref} open={open} onClose={() => setOpen(false)} width={160} offset={4}>
        <div style={{ padding: '4px 0' }} onClick={(e) => e.stopPropagation()}>
          {items.map((it) => (
            <MenuItem key={it.label} label={it.label} icon={it.icon} destructive={it.destructive} onClick={() => { setOpen(false); it.onClick(); }} />
          ))}
        </div>
      </Floating>
    </Row>
  );
}

// 빈 상태 — Figma `Empty state`(Featured icon sm · 「데이터가 없습니다」, 설명 · 버튼 숨김)
const EmptyBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 24px;
  > span { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border: 1px solid ${color('border-primary')}; border-radius: ${radius.md}px; box-shadow: ${shadow.xs}; color: ${color('fg-secondary')}; }
  > b { ${text('text-md', 'semibold')}; color: ${color('text-primary')}; }
`;

export function EmptyList() {
  return (
    <EmptyBox>
      <span>
        <Icon name="search" size={20} />
      </span>
      <b>데이터가 없습니다</b>
    </EmptyBox>
  );
}

// 상태 표지 — 점 8 + 글(sm Medium text-secondary)
const StatusBox = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
  white-space: nowrap;
  > i { width: 8px; height: 8px; border-radius: 50%; }
`;

export function StatusLead({ tone, label }: { tone: 'success' | 'warning' | 'error' | 'gray'; label: string }) {
  const c = tone === 'success' ? 'var(--fg-success-secondary)' : tone === 'warning' ? 'var(--fg-warning-secondary)' : tone === 'error' ? 'var(--fg-error-secondary)' : 'var(--fg-quaternary)';
  return (
    <StatusBox>
      <i style={{ background: c }} />
      {label}
    </StatusBox>
  );
}

export const PageTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 32px;
  > h1 { margin: 0; ${text('display-xs', 'semibold')}; color: ${color('text-primary')}; }
  > i { flex: 1; }
`;
