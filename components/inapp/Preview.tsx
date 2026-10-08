import { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { color, radius } from '@/styles/tokens';

// 인앱 미리보기 — 모바일 390×844 · 웹 1280×1080 iframe 을 칸 폭에 맞춰 축소(스테이징 0.6398 / 0.5 배율과 같은 비율).
const Box = styled.div<{ h: number }>`
  position: relative;
  width: 100%;
  height: ${(p) => p.h}px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.lg}px;
  background: ${color('bg-secondary')};
  overflow: hidden;
  > iframe { position: absolute; top: 0; left: 50%; border: 0; transform-origin: 0 0; background: #fff; }
`;

export function Thumb({ html, size = 120 }: { html: string; size?: number }) {
  // 1000×1000 을 size 로 축소, 보이기 시작하면 250ms 뒤에 그림(스테이징)
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      t = setTimeout(() => setOn(true), 250);
    }, { rootMargin: '300px' });
    if (ref.current) io.observe(ref.current);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0, width: size, height: size, borderRadius: 8, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
      {on && <iframe title="썸네일" srcDoc={html} sandbox="allow-same-origin" style={{ position: 'absolute', width: 1000, height: 1000, border: 0, transform: `scale(${size / 1000})`, transformOrigin: '0 0', pointerEvents: 'none' }} />}
    </div>
  );
}

export default function Preview({ html, device, width = 336 }: { html: string; device: 'mobile' | 'web'; width?: number }) {
  const [w, h] = device === 'mobile' ? [390, 844] : [1280, 1080];
  const scale = device === 'mobile' ? 540 / 844 : width / 1280;
  return (
    <Box h={Math.round(h * scale) + 2}>
      <iframe title="미리보기" srcDoc={html} sandbox="allow-same-origin" style={{ width: w, height: h, transform: `scale(${scale}) translateX(-50%)` }} />
    </Box>
  );
}
