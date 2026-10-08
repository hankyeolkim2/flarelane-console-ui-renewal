import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styled from '@emotion/styled';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 툴팁은 화면 맨 위층(body)에 fixed 로 띄움 — 스크롤 영역(overflow) 안에서 잘리지 않게.
// 공간이 모자라면 뒤집고, 항상 화면 안(가장자리 8px)에 머묾.

export const TipBox = styled.div<{ maxWidth?: number }>`
  position: fixed;
  z-index: 70;
  max-width: ${(p) => (p.maxWidth ? `${p.maxWidth}px` : 'none')};
  padding: 8px 12px;
  border-radius: ${radius.md}px;
  background: ${color('bg-primary-solid')};
  box-shadow: ${shadow.lg};
  ${text('text-xs', 'semibold')};
  color: ${color('text-white')};
  white-space: ${(p) => (p.maxWidth ? 'normal' : 'nowrap')};
  word-break: keep-all; /* 한국어는 단어 단위로 줄바꿈 */
  a { color: ${color('text-white')}; font-weight: 600; text-decoration: underline; }
`;

const EDGE = 8;

// 점(차트 값) 옆 툴팁 — 기본 오른쪽, 모자라면 왼쪽 / 세로는 점 가운데, 화면 안으로
export function PointTip({ x, y, children, gap = 12 }: { x: number; y: number; children: ReactNode; gap?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let left = x + gap;
    if (left + w > window.innerWidth - EDGE) left = x - gap - w;
    left = Math.max(EDGE, left);
    const top = Math.max(EDGE, Math.min(y - h / 2, window.innerHeight - h - EDGE));
    setPos({ left, top });
  }, [x, y, gap, children]);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <TipBox ref={ref} style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, pointerEvents: 'none' }}>
      {children}
    </TipBox>,
    document.body,
  );
}

// 요소에 마우스를 올리면 위에(모자라면 아래) 뜨는 툴팁 — 툴팁 위로 마우스를 옮겨도 유지(안에 링크가 있을 때)
export function HoverTip({ content, children, maxWidth = 240 }: { content: ReactNode; children: ReactNode; maxWidth?: number }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = () => {
    clearTimeout(hide.current);
    setOpen(true);
  };
  const leave = () => {
    hide.current = setTimeout(() => setOpen(false), 120);
  };
  useLayoutEffect(() => {
    if (!open || !anchor.current || !tip.current) return;
    const a = anchor.current.getBoundingClientRect();
    const w = tip.current.offsetWidth;
    const h = tip.current.offsetHeight;
    let top = a.top - 6 - h;
    if (top < EDGE) top = a.bottom + 6;
    const left = Math.max(EDGE, Math.min(a.left + a.width / 2 - w / 2, window.innerWidth - w - EDGE));
    setPos({ left, top });
  }, [open]);
  return (
    <>
      <span ref={anchor} style={{ display: 'inline-flex' }} onMouseEnter={show} onMouseLeave={leave}>
        {children}
      </span>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <TipBox ref={tip} maxWidth={maxWidth} role="tooltip" style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, fontWeight: 400 }} onMouseEnter={show} onMouseLeave={leave}>
            {content}
          </TipBox>,
          document.body,
        )}
    </>
  );
}
