import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma `Horizontal tabs` — Button border(목록 전체/내가 만든) · Button minimal(편집 인사이트/퍼널, Full width).
export type TabItem<T extends string> = { value: T; label: string; count?: number; icon?: string };

const BorderWrap = styled.div`
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  background: ${color('bg-secondary_alt')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.lg}px;
`;

const BorderTab = styled.button<{ current: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 12px;
  border: 0;
  border-radius: ${radius.sm}px;
  background: ${(p) => (p.current ? color('bg-primary_alt') : 'transparent')};
  box-shadow: ${(p) => (p.current ? shadow.sm : 'none')};
  ${text('text-sm', 'semibold')};
  color: ${(p) => (p.current ? color('text-secondary') : color('text-quaternary'))};
  cursor: pointer;
  transition: background-color 0.1s linear, color 0.1s linear;
  > em { font-style: normal; ${text('text-sm', 'medium')}; color: ${(p) => (p.current ? color('text-secondary') : color('text-tertiary'))}; }
  &:hover { ${(p) => (p.current ? '' : `background: ${color('bg-tertiary')}; color: ${color('text-secondary')};`)} }
  &:focus-visible { outline: none; box-shadow: ${shadow['focus-ring']}; }
`;

export function BorderTabs<T extends string>({ items, value, onChange }: { items: TabItem<T>[]; value: T; onChange: (v: T) => void }) {
  return (
    <BorderWrap role="tablist">
      {items.map((it) => (
        <BorderTab key={it.value} type="button" role="tab" aria-selected={it.value === value} current={it.value === value} onClick={() => onChange(it.value)}>
          {it.label}
          {it.count != null && <em>{it.count}</em>}
        </BorderTab>
      ))}
    </BorderWrap>
  );
}

const MinimalWrap = styled.div`
  display: flex;
  height: 36px;
  background: ${color('bg-secondary_alt')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.md}px;
`;

const MinimalTab = styled.button<{ current: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  margin: -1px;
  border: 1px solid ${(p) => (p.current ? color('border-primary') : 'transparent')};
  border-radius: ${radius.md}px;
  background: ${(p) => (p.current ? color('bg-primary_alt') : 'transparent')};
  box-shadow: ${(p) => (p.current ? shadow.xs : 'none')};
  ${text('text-sm', 'semibold')};
  color: ${(p) => (p.current ? color('text-secondary') : color('text-quaternary'))};
  cursor: pointer;
  transition: color 0.1s linear;
  > span { display: inline-flex; color: ${(p) => (p.current ? color('fg-quaternary_hover') : color('fg-quaternary'))}; }
  &:hover { color: ${color('text-secondary')}; }
  &:disabled { cursor: not-allowed; }
  &:disabled:hover { color: ${color('text-quaternary')}; }
  &:focus-visible { outline: none; box-shadow: ${shadow['focus-ring']}; }
`;

export function MinimalTabs<T extends string>({ items, value, onChange, disabled }: { items: TabItem<T>[]; value: T; onChange: (v: T) => void; disabled?: (v: T) => boolean }) {
  return (
    <MinimalWrap role="tablist">
      {items.map((it) => (
        <MinimalTab key={it.value} type="button" role="tab" aria-selected={it.value === value} current={it.value === value} disabled={disabled?.(it.value) && it.value !== value} onClick={() => onChange(it.value)}>
          {it.icon && (
            <span>
              <Icon name={it.icon} size={20} />
            </span>
          )}
          {it.label}
        </MinimalTab>
      ))}
    </MinimalWrap>
  );
}

// Figma `Horizontal tabs` (button border, 안쪽 여백 4) — 바탕 bg-secondary_alt · r10, 탭 36 · r6, 선택 = bg-primary_alt + shadow-sm.
const PaddedWrap = styled.div<{ $full?: boolean }>`
  display: ${(p) => (p.$full ? 'flex' : 'inline-flex')};
  gap: 4px;
  padding: 3px;
  background: ${color('bg-secondary_alt')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.lg}px;
`;

const PaddedTab = styled.button<{ current: boolean; $full?: boolean }>`
  ${(p) => (p.$full ? 'flex: 1;' : '')}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 12px;
  border: 0;
  border-radius: ${radius.sm}px;
  background: ${(p) => (p.current ? color('bg-primary_alt') : 'transparent')};
  box-shadow: ${(p) => (p.current ? shadow.sm : 'none')};
  ${text('text-sm', 'semibold')};
  color: ${(p) => (p.current ? color('text-secondary') : color('text-quaternary'))};
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.1s linear;
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  &:hover { color: ${color('text-secondary')}; }
  &:focus-visible { outline: none; box-shadow: ${shadow['focus-ring']}; }
`;

export function ButtonTabs<T extends string>({ items, value, onChange, full = false }: { items: TabItem<T>[]; value: T; onChange: (v: T) => void; full?: boolean }) {
  return (
    <PaddedWrap role="tablist" $full={full}>
      {items.map((it) => (
        <PaddedTab key={it.value} type="button" role="tab" $full={full} aria-selected={it.value === value} current={it.value === value} onClick={() => it.value !== value && onChange(it.value)}>
          {it.icon && (
            <span>
              <Icon name={it.icon} size={16} />
            </span>
          )}
          {it.label}
        </PaddedTab>
      ))}
    </PaddedWrap>
  );
}

// Figma `Horizontal tabs` (button border · 전체 폭 · md) — 예약된 메시지 상태 탭: 바탕 bg-secondary_alt · r12 · 안쪽 6, 탭 44 · 아이콘 20 + 이름(md SemiBold) + 건수(md Medium).
const CountWrap = styled.div`
  display: flex;
  gap: 4px;
  padding: 5px;
  background: ${color('bg-secondary_alt')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
`;

const CountTab = styled.button<{ current: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 44px;
  padding: 0 10px;
  border: 0;
  border-radius: ${radius.sm}px;
  background: ${(p) => (p.current ? color('bg-primary_alt') : 'transparent')};
  box-shadow: ${(p) => (p.current ? shadow.sm : 'none')};
  cursor: pointer;
  > span { display: inline-flex; color: ${(p) => (p.current ? color('fg-secondary') : color('fg-quaternary'))}; }
  > b { ${text('text-md', 'semibold')}; color: ${(p) => (p.current ? color('text-secondary') : color('text-quaternary'))}; }
  > em { font-style: normal; ${text('text-md', 'medium')}; color: ${(p) => (p.current ? color('text-secondary') : color('text-tertiary'))}; font-variant-numeric: tabular-nums; }
  &:hover > b { color: ${color('text-secondary')}; }
  &:focus-visible { outline: none; box-shadow: ${shadow['focus-ring']}; }
`;

export function CountTabs<T extends string>({ items, value, onChange }: { items: TabItem<T>[]; value: T; onChange: (v: T) => void }) {
  return (
    <CountWrap role="tablist">
      {items.map((it) => (
        <CountTab key={it.value} type="button" role="tab" aria-selected={it.value === value} current={it.value === value} onClick={() => it.value !== value && onChange(it.value)}>
          {it.icon && (
            <span>
              <Icon name={it.icon} size={20} />
            </span>
          )}
          <b>{it.label}</b>
          {it.count !== undefined && <em>{it.count.toLocaleString('ko-KR')}</em>}
        </CountTab>
      ))}
    </CountWrap>
  );
}

// Figma `Horizontal tabs` Underline sm — 선택 = text-brand-secondary + 아래 2px border-brand, 탭 아래 1px 선.
const UnderWrap = styled.div`
  display: inline-flex;
  gap: 12px;
  border-bottom: 1px solid ${color('border-secondary')};
`;

const UnderTab = styled.button<{ current: boolean }>`
  height: 36px;
  margin-bottom: -1px;
  padding: 0 4px;
  border: 0;
  border-bottom: 2px solid ${(p) => (p.current ? color('fg-brand-primary_alt') : 'transparent')};
  background: transparent;
  ${text('text-sm', 'semibold')};
  color: ${(p) => (p.current ? color('text-brand-secondary') : color('text-quaternary'))};
  cursor: pointer;
  &:hover { color: ${(p) => (p.current ? color('text-brand-secondary') : color('text-secondary'))}; }
`;

export function UnderlineTabs<T extends string>({ items, value, onChange }: { items: TabItem<T>[]; value: T; onChange: (v: T) => void }) {
  return (
    <UnderWrap role="tablist">
      {items.map((it) => (
        <UnderTab key={it.value} type="button" role="tab" aria-selected={it.value === value} current={it.value === value} onClick={() => onChange(it.value)}>
          {it.label}
        </UnderTab>
      ))}
    </UnderWrap>
  );
}
