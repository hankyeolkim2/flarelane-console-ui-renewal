import type { ReactNode } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { HoverTip } from '@/components/ui/Tooltip';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma 채널 설정 섹션(1242:83680) 공통 — 제목 · 채널 타일 6개 · 소제목(+오른쪽 버튼) · 카드 · 키-값 표 · 숫자 타일.

export type ChannelKey = 'mobile' | 'web' | 'kakao' | 'sms' | 'email' | 'webhook';

export const CHANNELS: { key: ChannelKey; label: string; icon: string; href: string }[] = [
  { key: 'mobile', label: '앱 푸시', icon: 'smartphone', href: '/channel/mobile' },
  { key: 'web', label: '웹 푸시', icon: 'web_asset', href: '/channel/web' },
  { key: 'kakao', label: '카카오', icon: 'kakao_chat', href: '/channel/kakao' },
  { key: 'sms', label: '문자', icon: 'sms', href: '/channel/sms' },
  { key: 'email', label: '이메일', icon: 'mail', href: '/channel/email' },
  { key: 'webhook', label: '웹훅', icon: 'webhook', href: '/channel/webhook' },
];

const Title = styled.h1`
  margin: 0;
  ${text('display-xs', 'semibold')};
  color: ${color('text-primary')};
`;

const Tiles = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
`;

const Tile = styled(Link, { shouldForwardProp: (p) => !p.startsWith('$') && !['current', 'collapsed'].includes(p) })<{ $on: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  height: 76px;
  padding: 0 19px;
  border: 1px solid ${(p) => (p.$on ? color('border-brand') : color('border-secondary'))};
  border-radius: ${radius.xl}px;
  background: ${(p) => (p.$on ? color('bg-brand-primary') : color('bg-primary'))};
  box-shadow: ${shadow.xs};
  ${text('text-md', 'semibold')};
  color: ${(p) => (p.$on ? color('text-brand-secondary') : color('text-secondary'))};
  text-decoration: none;
  transition: background-color 0.1s linear, border-color 0.1s linear;
  > span { display: inline-flex; color: ${(p) => (p.$on ? color('fg-brand-primary') : color('fg-quaternary'))}; }
  &:hover { ${(p) => (p.$on ? '' : `background: ${color('bg-primary_hover')}; border-color: ${color('border-primary')};`)} }
`;

const SubHead = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  > h2 { margin: 0; ${text('text-lg', 'semibold')}; color: ${color('text-primary')}; }
  > i { flex: 1; }
`;

export function ChannelShell({ current, title, actions, children }: { current: ChannelKey | null; title?: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <>
      <Title>채널</Title>
      <Tiles>
        {CHANNELS.map((c) => (
          <Tile key={c.key} href={c.href} $on={c.key === current} aria-current={c.key === current ? 'page' : undefined} onClick={(e) => c.key === current && e.preventDefault()} style={c.key === current ? { cursor: 'default' } : undefined}>
            <span>
              <Icon name={c.key === current ? `${c.icon}_filled` : c.icon} size={24} />
            </span>
            {c.label}
          </Tile>
        ))}
      </Tiles>
      {title && (
        <SubHead>
          <h2>{title}</h2>
          <i />
          {actions}
        </SubHead>
      )}
      {children && <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>}
    </>
  );
}

export const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 23px;
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  box-shadow: ${shadow.xs};
`;

const CardHeadBox = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  > h3 { margin: 0; ${text('text-md', 'semibold')}; color: ${color('text-primary')}; }
  > i { flex: 1; }
`;

export function Help({ children }: { children: ReactNode }) {
  return (
    <HoverTip content={children}>
      <span style={{ display: 'inline-flex', color: 'var(--fg-quaternary)', cursor: 'help' }}>
        <Icon name="help" size={16} />
      </span>
    </HoverTip>
  );
}

export function CardHead({ title, help, actions }: { title: string; help?: ReactNode; actions?: ReactNode }) {
  return (
    <CardHeadBox>
      <h3>{title}</h3>
      {help && <Help>{help}</Help>}
      <i />
      {actions}
    </CardHeadBox>
  );
}

// 키-값 표 — 라벨 160(sm SemiBold text-quaternary) · 값(sm Medium text-primary), 줄마다 아래 테두리
const KVRow = styled.div<{ cols: number }>`
  display: grid;
  grid-template-columns: ${(p) => (p.cols === 2 ? '160px minmax(0,1fr) 160px minmax(0,1fr)' : '160px minmax(0,1fr)')};
  border-bottom: 1px solid ${color('border-secondary')};
  > dt, > dd { display: flex; align-items: center; min-height: 63px; margin: 0; padding: 8px 20px; }
  > dt { ${text('text-sm', 'semibold')}; color: ${color('text-quaternary')}; }
  > dd { ${text('text-sm', 'medium')}; color: ${color('text-primary')}; word-break: break-all; }
`;

export function KV({ rows }: { rows: ([ReactNode, ReactNode] | [ReactNode, ReactNode, ReactNode, ReactNode])[] }) {
  return (
    <dl style={{ margin: 0 }}>
      {rows.map((r, i) => (
        <KVRow key={i} cols={r.length === 4 ? 2 : 1}>
          <dt>{r[0]}</dt>
          <dd>{r[1]}</dd>
          {r.length === 4 && (
            <>
              <dt>{r[2]}</dt>
              <dd>{r[3]}</dd>
            </>
          )}
        </KVRow>
      ))}
    </dl>
  );
}

// 숫자 타일 — bg-secondary · r8 · 라벨 sm Medium text-tertiary · 값 Display xs SemiBold
export const StatTiles = styled.div<{ cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${(p) => p.cols ?? 3}, minmax(0, 1fr));
  gap: 16px;
`;

const StatBox = styled.div<{ $bare?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: ${(p) => (p.$bare ? '0' : '16px 20px')};
  border-radius: ${radius.md}px;
  background: ${(p) => (p.$bare ? 'transparent' : color('bg-secondary'))};
  > small { display: flex; align-items: center; gap: 4px; ${text('text-sm', 'medium')}; color: ${color('text-tertiary')}; }
  > b { ${text('display-xs', 'semibold')}; color: ${color('text-primary')}; }
  > p { margin: 0; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
`;

export function Stat({ label, value, sub, help, bare }: { label?: string; value: ReactNode; sub?: string; help?: ReactNode; bare?: boolean }) {
  return (
    <StatBox $bare={bare}>
      {label && (
        <small>
          {label}
          {help && <Help>{help}</Help>}
        </small>
      )}
      <b>{value}</b>
      {sub && <p>{sub}</p>}
    </StatBox>
  );
}

export const CardFoot = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  > label, > span[data-label] { display: flex; align-items: center; gap: 4px; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
`;
