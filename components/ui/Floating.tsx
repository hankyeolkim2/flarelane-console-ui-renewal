import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import styled from '@emotion/styled';
import { color, radius, shadow } from '@/styles/tokens';

// 화면 위에 띄우는 팝오버(fixed) — 스테이징 팝오버 공통: 기본 bottom-end, 바깥 클릭으로 닫힘.
// look="calendar" = Figma `_Date picker menu`(r16 · border-secondary_alt · shadow-xl)

// 팝오버 층 = 80 — 모달(50) · AI 설정 모달(70) 위, 툴팁(90) 아래. body 에 띄워서 모달 본문 · 표 · 카드 같은 스크롤 영역에 잘리지 않음(10-21 전수 수정)
export const POPOVER_Z = 80;
const EDGE = 8;

export type Placement = { top?: number; bottom?: number; left: number; maxHeight: number };
const same = (a: Placement | null, b: Placement) => !!a && a.top === b.top && a.bottom === b.bottom && a.left === b.left && a.maxHeight === b.maxHeight;

// 칸(anchor) 기준 자리 — 아래에 붙이고, 아래가 모자라면서 위가 더 넓으면 위로 뒤집음(위로 열면 칸 쪽에 붙은 채 위로 자람).
// 그래도 넘치면 그쪽 높이까지만 보이고 안에서 스크롤. 가로는 align 기준 · 화면 안(가장자리 8).
// 열린 동안 스크롤 · 창 크기 · 팝오버 크기(검색 결과 줄어듦 등)가 바뀌면 다시 잼.
export function usePlacement(open: boolean, anchorRef: RefObject<HTMLElement | null>, panelRef: RefObject<HTMLElement | null>, align: 'start' | 'end' | 'center', offset: number) {
  const [pos, setPos] = useState<Placement | null>(null);
  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const place = () => {
      const a = anchorRef.current?.getBoundingClientRect();
      const p = panelRef.current;
      if (!a || !p) return;
      const w = p.offsetWidth;
      const h = p.scrollHeight + p.offsetHeight - p.clientHeight; // 줄이기 전 높이(테두리 포함)
      const below = Math.floor(window.innerHeight - a.bottom - offset - EDGE);
      const above = Math.floor(a.top - offset - EDGE);
      let left = align === 'start' ? a.left : align === 'end' ? a.right - w : a.left + a.width / 2 - w / 2;
      left = Math.round(Math.max(EDGE, Math.min(left, window.innerWidth - w - EDGE)));
      const next: Placement = h > below && above > below ? { bottom: Math.round(window.innerHeight - a.top + offset), left, maxHeight: above } : { top: Math.round(a.bottom + offset), left, maxHeight: below };
      setPos((prev) => (same(prev, next) ? prev : next));
    };
    place();
    const id = requestAnimationFrame(place);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(place);
    if (panelRef.current) ro?.observe(panelRef.current);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      cancelAnimationFrame(id);
      ro?.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchorRef, panelRef, align, offset]);
  return pos;
}

// 자리 잡기 전(첫 그림)엔 화면 밖에 두고 크기만 잼
export const placementStyle = (pos: Placement | null) => (pos ? { top: pos.top, bottom: pos.bottom, left: pos.left, maxHeight: pos.maxHeight } : { top: -9999, left: -9999 });

const Panel = styled.div<{ $calendar: boolean }>`
  position: fixed;
  z-index: ${POPOVER_Z};
  background: ${color('bg-primary')};
  border: 1px solid ${(p) => (p.$calendar ? color('border-secondary_alt') : color('border-secondary'))};
  border-radius: ${(p) => (p.$calendar ? radius['2xl'] : radius.xl)}px;
  box-shadow: ${(p) => (p.$calendar ? shadow.xl : shadow.lg)};
  overflow-x: hidden;
  overflow-y: auto;
`;

type Props = {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  width: number;
  placement?: 'bottom-end' | 'bottom-start';
  offset?: number;
  look?: 'menu' | 'calendar';
  children: ReactNode;
};

export default function Floating({ anchorRef, open, onClose, width, placement = 'bottom-end', offset = 6, look = 'menu', children }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const pos = usePlacement(open, anchorRef, panel, placement === 'bottom-end' ? 'end' : 'start', offset);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // 바깥 클릭은 캡처 단계에서 받음 — 모달 상자처럼 mousedown 전파를 막는 곳 안을 눌러도 닫히게(10-21, 개인화 변수 모달에서 안 닫히던 버그).
  // 단, 이 팝오버 안에서 연 다른 팝오버(뒤에 붙은 portal, 예: 달력 · 셀렉트 목록)를 누른 건 바깥이 아님
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || anchorRef.current?.contains(t)) return;
      const other = t instanceof Element ? t.closest('[data-floating]') : null;
      if (other && panel.current && panel.current.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING) return;
      closeRef.current();
    };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('mousedown', down, true);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down, true);
      document.removeEventListener('keydown', key);
    };
  }, [open, anchorRef]);

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <Panel ref={panel} data-floating $calendar={look === 'calendar'} style={{ width, ...placementStyle(pos) }} onMouseDown={(e) => e.stopPropagation()}>
      {children}
    </Panel>,
    document.body,
  );
}
