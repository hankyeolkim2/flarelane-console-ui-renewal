import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { placementStyle, POPOVER_Z, usePlacement } from './Floating';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma `Dropdown menu` · `_Dropdown menu list item` (Inset icon=True).

// 바깥 클릭 · Esc 로 닫기 — 바깥 클릭은 캡처 단계(모달 상자 등 mousedown 전파를 막는 곳 안에서도 닫히게, 10-21)
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!ref.current || ref.current.contains(t)) return;
      // 메뉴 안에서 연 팝오버(뒤에 붙은 portal)를 누른 건 바깥이 아님
      const other = t instanceof Element ? t.closest('[data-floating]') : null;
      if (other && ref.current.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING) return;
      onClose();
    };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', down, true);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down, true);
      document.removeEventListener('keydown', key);
    };
  }, [ref, open, onClose]);
}

export const Anchor = styled.div`
  position: relative;
  display: inline-flex;
`;

// 목록 상자 — body 에 fixed 로 띄움(Floating 과 같은 자리 잡기): 모달 본문 · 표 · 카드 스크롤 영역에 잘리지 않고, 아래가 모자라면 위로 열림(10-21 전수 수정)
export const MenuPanel = styled.div`
  position: fixed;
  z-index: ${POPOVER_Z};
  padding: 4px 0;
  overflow-y: auto;
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

// stretch(셀렉트 목록) = 붙은 칸(셀렉트 박스) · width 보다 좁아지지 않고, 글자가 더 길면 줄바꿈 없이 그만큼 넓게
export function Menu({ open, onClose, children, width, align = 'end', offset = 4, stretch, anchorRef }: { open: boolean; onClose: () => void; children: ReactNode; width?: number; align?: 'start' | 'end' | 'center'; offset?: number; stretch?: boolean; anchorRef: RefObject<HTMLElement | null> }) {
  const panel = useRef<HTMLDivElement>(null);
  useDismiss(anchorRef, open, onClose);
  const pos = usePlacement(open, anchorRef, panel, align, offset);
  if (!open || typeof document === 'undefined') return null;
  const size = stretch ? { width: 'max-content', minWidth: Math.max(anchorRef.current?.offsetWidth ?? 0, width ?? 0), maxWidth: 'calc(100vw - 32px)' } : { width: width ?? 'auto' };
  return createPortal(
    <MenuPanel ref={panel} role="menu" data-floating style={{ ...size, ...placementStyle(pos) }} onClick={(e) => e.stopPropagation()}>
      {children}
    </MenuPanel>,
    document.body,
  );
}
