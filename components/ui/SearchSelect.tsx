import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from './Button';
import Floating from './Floating';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 검색 팝오버(10-19 확정 스펙) — Figma `Search menu` · `_Dropdown menu header` Type=Search.
// 검색 줄 = 상자형 인풋 · 구분선 없음 · 사방 8 · 모서리 12 · 항목 바탕이 인풋 상자와 같은 8 선(목록 4 + 항목 4).
// 열리면 2px 브랜드 포커스는 검색 인풋에만 — 셀렉트 박스는 기본 테두리(화살표만 위로).
export type SearchOption = { value: string; label: string; sub?: string; disabled?: boolean };

const Trigger = styled.button<{ $placeholder: boolean; $error: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 36px;
  padding: 0 9px 0 11px;
  border: 1px solid ${(p) => (p.$error ? color('border-error') : color('border-primary'))};
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
  > b > small { margin-left: 6px; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
  > span { display: inline-flex; color: ${color('fg-quaternary')}; transition: transform 0.15s; }
  &[aria-expanded='true'] > span { transform: rotate(180deg); }
  &:focus-visible { outline: none; border-color: ${color('border-brand')}; box-shadow: inset 0 0 0 1px ${color('border-brand')}, ${shadow.xs}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
`;

const SearchBox = styled.label`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 8px 0 12px;
  border-radius: ${radius.md}px;
  background: ${color('bg-primary')};
  box-shadow: inset 0 0 0 1px ${color('border-primary')}, ${shadow.xs};
  cursor: text;
  &:focus-within { box-shadow: inset 0 0 0 2px ${color('border-brand')}, ${shadow.xs}; }
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  > input { flex: 1; min-width: 0; height: 100%; border: 0; outline: none; background: transparent; ${text('text-sm', 'regular')}; color: ${color('text-primary')}; }
  > input::placeholder { color: ${color('text-placeholder')}; }
`;

const List = styled.ul`
  margin: 0;
  padding: 4px;
  list-style: none;
  max-height: 284px;
  overflow-y: auto;
`;

const Item = styled.li<{ $active: boolean; $disabled: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  margin: 1px 4px;
  padding: 0 8px;
  border-radius: ${radius.sm}px;
  background: ${(p) => (p.$active ? color('bg-primary_hover') : 'transparent')};
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  user-select: none;
  > b { flex-shrink: 0; max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; ${text('text-sm', 'medium')}; color: ${(p) => (p.$disabled ? color('text-disabled') : color('text-primary'))}; }
  > small { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
  > i { margin-left: auto; display: inline-flex; color: ${color('fg-brand-primary')}; }
`;

const Empty = styled.div`
  padding: 8px 16px 10px;
  ${text('text-sm', 'regular')};
  color: ${color('text-tertiary')};
`;

const Notice = styled.div`
  padding: 4px 12px 10px;
  ${text('text-xs', 'regular')};
  color: ${color('text-quaternary')};
  text-align: center;
`;

type Props = {
  value: string | null;
  options: SearchOption[];
  onChange: (v: string) => void;
  placeholder?: string;
  width?: number | string;
  menuWidth?: number;
  searchPlaceholder?: string;
  creatable?: boolean; // 「직접입력: …」
  notice?: string; // 목록 아래 작은 안내(예: 「전체 중 최근 일부가 표시됩니다.」)
  action?: { label: string; onClick: () => void }; // 검색 줄 오른쪽 「+ …」
  emptyText?: string;
  showSub?: boolean; // 셀렉트 박스에도 회색 보조 글자(국가 이름 등)
  error?: boolean;
  disabled?: boolean;
  footer?: ReactNode;
};

export default function SearchSelect({ value, options, onChange, placeholder = '선택', width = '100%', menuWidth, searchPlaceholder = '검색', creatable = false, notice, action, emptyText = '검색 결과가 없습니다', showSub = false, error = false, disabled = false, footer }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const anchor = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const current = options.find((o) => o.value === value);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    const hit = t ? options.filter((o) => o.label.toLowerCase().includes(t) || (o.sub ?? '').toLowerCase().includes(t)) : options;
    const exact = options.some((o) => o.value === q.trim());
    const rows: (SearchOption & { create?: boolean })[] = [];
    if (creatable && q.trim() && !exact) rows.push({ value: q.trim(), label: '직접입력:', sub: q.trim(), create: true });
    return rows.concat(hit);
  }, [q, options, creatable]);

  useEffect(() => {
    if (!open) return;
    setQ('');
    const i = options.findIndex((o) => o.value === value);
    setActive(Math.max(0, i));
    const id = requestAnimationFrame(() => input.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    const el = list.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const close = (focusTrigger = false) => {
    setOpen(false);
    if (focusTrigger) trigger.current?.focus();
  };
  const choose = (o: SearchOption) => {
    if (o.disabled) return;
    onChange(o.value);
    close(true);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(shown.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (shown[active]) choose(shown[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); close(true); }
  };
  // 기본 320(DS `Search menu` 폭) · 검색 줄 오른쪽에 「+ …」 단추가 있으면 400 — 검색 칸이 좁아지지 않게(10-20 사용자 「인풋 너비가 너무 좁아」 · 「좀 더 넓게」)
  // 어느 경우든 셀렉트 박스보다 좁아지지 않음 — 열 때 박스 실제 폭을 잼(10-20 사용자 「팝오버 너비는 최소 셀렉트 박스보다 넓어야」)
  const [boxW, setBoxW] = useState(0);
  const openMenu = () => {
    setBoxW(anchor.current?.offsetWidth ?? 0);
    setOpen(true);
  };
  const mw = Math.max(boxW, menuWidth ?? (action ? 400 : 320));

  return (
    <div ref={anchor} style={{ width: typeof width === 'number' ? width : width, flexShrink: 0 }}>
      <Trigger
        ref={trigger}
        type="button"
        $placeholder={!value}
        $error={error}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => { if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openMenu(); } }}
      >
        <b>
          {current ? current.label : value || placeholder}
          {showSub && current?.sub && <small>{current.sub}</small>}
        </b>
        <span>
          <Icon name="keyboard_arrow_down" size={16} />
        </span>
      </Trigger>
      <Floating anchorRef={anchor} open={open} onClose={() => close(false)} width={mw} placement="bottom-start" offset={4}>
        <Head>
          <SearchBox>
            <span>
              <Icon name="search" size={16} />
            </span>
            <input ref={input} value={q} placeholder={searchPlaceholder} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} aria-label={searchPlaceholder} />
          </SearchBox>
          {action && (
            <Button hierarchy="tertiary" iconLeading="add" onClick={() => { close(false); action.onClick(); }}>
              {action.label}
            </Button>
          )}
        </Head>
        {shown.length ? (
          <List ref={list} role="listbox">
            {shown.map((o, i) => (
              <Item key={(o as { create?: boolean }).create ? '__create' : o.value} role="option" aria-selected={o.value === value} $active={i === active} $disabled={!!o.disabled} onMouseEnter={() => setActive(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(o)}>
                <b>{o.label}</b>
                {o.sub && <small>{o.sub}</small>}
                {o.value === value && !(o as { create?: boolean }).create && (
                  <i>
                    <Icon name="check" size={16} />
                  </i>
                )}
              </Item>
            ))}
          </List>
        ) : (
          <Empty>{emptyText}</Empty>
        )}
        {notice && <Notice>{notice}</Notice>}
        {footer}
      </Floating>
    </div>
  );
}
