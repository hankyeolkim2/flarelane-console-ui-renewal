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
