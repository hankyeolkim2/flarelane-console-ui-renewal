import { useRef, useState } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { Menu } from './Menu';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma `Select` sm — 높이 36, 패딩 8·10·8·12, 열림 = border-brand. 목록 = `_Select menu item`(선택 항목 체크).
export type Option<T extends string> = { value: T; label: string; disabled?: boolean };

const Trigger = styled.button<{ open: boolean; width?: number | string; $placeholder: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: ${(p) => (typeof p.width === 'number' ? `${p.width}px` : p.width ?? '100%')};
  height: 36px;
  padding: 0 9px 0 11px;
  border: 1px solid ${(p) => (p.open ? color('border-brand') : color('border-primary'))};
  border-radius: ${radius.md}px;
  background: ${color('bg-primary')};
  box-shadow: ${shadow.xs};
  text-align: left;
  cursor: pointer;
  > b {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    ${(p) => (p.$placeholder ? text('text-sm', 'regular') : text('text-sm', 'medium'))};
    color: ${(p) => (p.$placeholder ? color('text-placeholder') : color('text-primary'))};
  }
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:focus-visible { outline: none; border-color: ${color('border-brand')}; }
`;

const OptionRow = styled.button<{ selected: boolean }>`
  display: flex;
  width: 100%;
  padding: 1px 6px;
  border: 0;
  background: transparent;
  cursor: pointer;
  > span {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 8px 8px 10px;
    border-radius: ${radius.sm}px;
    background: ${(p) => (p.selected ? color('bg-primary_hover') : 'transparent')};
    ${text('text-sm', 'medium')};
    color: ${color('text-primary')};
    text-align: left;
  }
  > span > em { flex: 1; font-style: normal; }
  > span > i { display: inline-flex; color: ${color('fg-brand-primary')}; }
  &:hover:not(:disabled) > span { background: ${color('bg-primary_hover')}; }
  &:disabled { cursor: not-allowed; }
  &:disabled > span { color: ${color('text-disabled')}; }
`;

export default function Select<T extends string>({ value, options, onChange, placeholder, width, menuWidth, disabled }: { value: T | null; options: Option<T>[]; onChange: (v: T) => void; placeholder?: string; width?: number | string; menuWidth?: number; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);
  return (
    <div ref={ref} style={{ position: 'relative', width: typeof width === 'number' ? width : width ?? '100%', flexShrink: 0 }}>
      <Trigger type="button" open={open} width="100%" $placeholder={!current} disabled={disabled} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <b>{current ? current.label : placeholder}</b>
        <span>
          <Icon name="keyboard_arrow_down" size={16} />
        </span>
      </Trigger>
      <Menu open={open} onClose={() => setOpen(false)} anchorRef={ref} align="start" width={menuWidth ?? (typeof width === 'number' ? width : undefined)}>
        <div role="listbox">
          {options.map((o) => (
            <OptionRow key={o.value} type="button" role="option" disabled={o.disabled} aria-selected={o.value === value} selected={o.value === value} onClick={() => { onChange(o.value); setOpen(false); }}>
              <span>
                <em>{o.label}</em>
                {o.value === value && (
                  <i>
                    <Icon name="check" size={20} />
                  </i>
                )}
              </span>
            </OptionRow>
          ))}
        </div>
      </Menu>
    </div>
  );
}
