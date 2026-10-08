import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma `Dropdown menu` · `_Dropdown menu list item` (Inset icon=True).

// 바깥 클릭 · Esc 로 닫기
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [ref, open, onClose]);
}

export const Anchor = styled.div`
  position: relative;
  display: inline-flex;
`;

export const MenuPanel = styled.div<{ width?: number; align?: 'start' | 'end' | 'center'; offset?: number }>`
  position: absolute;
  top: calc(100% + ${(p) => p.offset ?? 4}px);
  ${(p) => (p.align === 'start' ? 'left: 0;' : p.align === 'center' ? 'left: 50%; transform: translateX(-50%);' : 'right: 0;')}
  z-index: 30;
  width: ${(p) => (p.width ? `${p.width}px` : 'auto')};
  padding: 4px 0;
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary_alt')};
  border-radius: ${radius.md}px;
  box-shadow: ${shadow.lg};
  text-align: left;
  cursor: default;
`;

// 호버는 바깥 버튼(ItemWrap)에서 안쪽 칸을 칠함 — 다른 스타일 컴포넌트를 선택자로 쓰지 않음
const ItemWrap = styled.button<{ destructive: boolean }>`
  display: flex;
  width: 100%;
  padding: 1px 6px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
  --mi-text: ${(p) => (p.destructive ? color('text-error-primary') : color('text-secondary'))};
  --mi-icon: ${(p) => (p.destructive ? color('fg-error-primary') : color('fg-quaternary'))};
  &:focus-visible { outline: none; }
  &:hover > span, &:focus-visible > span { background: ${color('bg-primary_hover')}; }
  ${(p) => (p.destructive ? '' : `&:hover, &:focus-visible { --mi-text: ${color('text-secondary_hover')}; }`)}
`;

const ItemContent = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 6px 8px 10px;
  border-radius: ${radius.sm}px;
  transition: background-color 0.1s linear;
`;

const ItemText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
  b { ${text('text-sm', 'semibold')}; color: var(--mi-text); }
  small { ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
`;

export function MenuItem({ icon, label, description, destructive = false, onClick }: { icon?: string; label: string; description?: string; destructive?: boolean; onClick: () => void }) {
  return (
    <ItemWrap type="button" role="menuitem" destructive={destructive} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <ItemContent>
        {icon && (
          <span style={{ display: 'inline-flex', color: 'var(--mi-icon)' }}>
            <Icon name={icon} size={16} />
          </span>
        )}
        <ItemText>
          <b>{label}</b>
          {description && <small>{description}</small>}
        </ItemText>
      </ItemContent>
    </ItemWrap>
  );
}

export const MenuDivider = styled.div`
  padding: 4px 0;
  &::after { content: ''; display: block; height: 1px; background: ${color('border-secondary')}; }
`;

export function Menu({ open, onClose, children, width, align, offset, anchorRef }: { open: boolean; onClose: () => void; children: ReactNode; width?: number; align?: 'start' | 'end' | 'center'; offset?: number; anchorRef: RefObject<HTMLElement | null> }) {
  useDismiss(anchorRef, open, onClose);
  if (!open) return null;
  return (
    <MenuPanel role="menu" width={width} align={align} offset={offset} onClick={(e) => e.stopPropagation()}>
      {children}
    </MenuPanel>
  );
}
