import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import styled from '@emotion/styled';
import { color, radius, shadow } from '@/styles/tokens';

// 화면 위에 띄우는 팝오버(fixed) — 스테이징 팝오버 공통: 기본 bottom-end, 바깥 클릭으로 닫힘.
const Panel = styled.div`
  position: fixed;
  z-index: 40;
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  box-shadow: ${shadow.lg};
  overflow: hidden;
`;

type Props = {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  width: number;
  placement?: 'bottom-end' | 'bottom-start';
  offset?: number;
  children: ReactNode;
};

export default function Floating({ anchorRef, open, onClose, width, placement = 'bottom-end', offset = 6, children }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const a = anchorRef.current?.getBoundingClientRect();
      if (!a) return;
      let left = placement === 'bottom-end' ? a.right - width : a.left;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      let top = a.bottom + offset;
      const h = panel.current?.offsetHeight ?? 0;
      if (h && top + h > window.innerHeight - 8) top = Math.max(8, a.top - offset - h);
      setPos({ top, left });
    };
    place();
    const id = requestAnimationFrame(place);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchorRef, width, placement, offset]);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || anchorRef.current?.contains(t)) return;
      closeRef.current();
    };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [open, anchorRef]);

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <Panel ref={panel} style={{ width, top: pos?.top ?? -9999, left: pos?.left ?? -9999 }} onMouseDown={(e) => e.stopPropagation()}>
      {children}
    </Panel>,
    document.body,
  );
}
