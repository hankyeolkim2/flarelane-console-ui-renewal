import { useRef, useState, type ReactNode } from 'react';
import styled from '@emotion/styled';
import { PointTip } from '@/components/ui/Tooltip';
import { color } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 대시보드 차트 — 점선 가로 그리드 · y 0부터(최대 = 데이터 최대 × 1.3, 정수 눈금) · 마우스 위치 세로 점선 + 툴팁(docs 1-2 · 1-3).
const H = 220;

const Box = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: ${H}px auto;
  column-gap: 12px;
  row-gap: 8px;
  > [data-y] { display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; ${text('text-xs', 'regular')}; color: ${color('text-quaternary')}; margin: -9px 0; font-variant-numeric: tabular-nums; }
  > [data-x] { grid-column: 2; display: flex; justify-content: space-between; ${text('text-xs', 'regular')}; color: ${color('text-quaternary')}; white-space: nowrap; overflow: hidden; }
`;

const Plot = styled.div`
  position: relative;
  > svg { display: block; width: 100%; height: 100%; overflow: visible; }
`;

const Tip = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  > b { ${text('text-xs', 'semibold')}; }
  > span { ${text('text-xs', 'regular')}; }
`;

const ticks = (max: number) => {
  const top = Math.max(2, Math.ceil(max * 1.3));
  const step = Math.max(1, Math.ceil(top / 4));
  return { top: step * 4, labels: [4, 3, 2, 1, 0].map((i) => String(step * i)) };
};

export type LineSeries = { key: string; values: number[]; color: string; area?: boolean; scale?: number };

export function LineChart({ labels, series, tip, xEvery }: { labels: string[]; series: LineSeries[]; tip: (i: number) => ReactNode; xEvery?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const max = Math.max(...series.filter((s) => !s.scale).flatMap((s) => s.values), 0);
  const { top, labels: yl } = ticks(max);
  const n = labels.length;
  const W = 1000;
  const px = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * W);
  const py = (v: number, s?: LineSeries) => H - (v / (s?.scale ? Math.max(2, Math.max(...s.values) * s.scale) : top)) * H;
  const every = xEvery ?? Math.max(1, Math.ceil(n / 10));
  return (
    <Box>
      <div data-y="">
        {yl.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
      <Plot
        ref={ref}
        onMouseMove={(e) => {
          const r = ref.current!.getBoundingClientRect();
          const i = Math.round(((e.clientX - r.left) / r.width) * (n - 1));
          setHover({ i: Math.max(0, Math.min(n - 1, i)), x: r.left + (Math.max(0, Math.min(n - 1, i)) / Math.max(1, n - 1)) * r.width, y: r.top + 20 });
        }}
        onMouseLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`g-${s.key}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={s.color} stopOpacity="0.25" />
                <stop offset="1" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {[0, 1, 2, 3, 4].map((k) => (
            <line key={k} x1="0" x2={W} y1={(k / 4) * H} y2={(k / 4) * H} stroke="var(--border-secondary)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          ))}
          {series.map((s) => {
            const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${px(i)},${py(v, s)}`).join(' ');
            return (
              <g key={s.key}>
                {s.area && <path d={`${d} L${px(n - 1)},${H} L${px(0)},${H} Z`} fill={`url(#g-${s.key})`} />}
                <path d={d} fill="none" stroke={s.color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                {n === 1 && <circle cx={px(0)} cy={py(s.values[0], s)} r="4" fill={s.color} />}
              </g>
            );
          })}
          {hover && <line x1={px(hover.i)} x2={px(hover.i)} y1="0" y2={H} stroke="var(--fg-brand-secondary)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />}
        </svg>
        {hover && (
          <PointTip x={hover.x} y={hover.y}>
            <Tip>
              <b>{labels[hover.i]}</b>
              {tip(hover.i)}
            </Tip>
          </PointTip>
        )}
      </Plot>
      <div data-x="">
        {labels.map((l, i) => (i % every === 0 ? <span key={l}>{l}</span> : null))}
      </div>
    </Box>
  );
}

const Bars = styled.div`
  position: relative;
  display: flex;
  align-items: stretch;
  height: 100%;
  > div { position: relative; flex: 1; display: flex; justify-content: center; align-items: flex-end; margin: 0 1px; border-radius: 4px; background: ${color('bg-secondary')}; }
  > div:hover { background: linear-gradient(to top, rgba(59, 130, 246, 0.16), rgba(59, 130, 246, 0)); }
  > div > i { width: 70%; max-width: 16px; border-radius: 4px 4px 0 0; background: var(--chart-clicked); }
`;

export function BarChart({ labels, values, tip }: { labels: string[]; values: number[]; tip: (i: number) => ReactNode }) {
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const top = Math.min(100, Math.max(1, Math.max(...values) * 1.3));
  const step = top / 4;
  return (
    <Box>
      <div data-y="">
        {[4, 3, 2, 1, 0].map((i) => (
          <span key={i}>{`${Math.round(step * i)}%`}</span>
        ))}
      </div>
      <Plot>
        <Bars>
          {values.map((v, i) => (
            <div
              key={i}
              onMouseEnter={(e) => {
                const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                setHover({ i, x: r.left + r.width / 2, y: r.top + r.height - (v / top) * r.height });
              }}
              onMouseLeave={() => setHover(null)}
            >
              <i style={{ height: `${(v / top) * 100}%` }} />
            </div>
          ))}
        </Bars>
        {hover && (
          <PointTip x={hover.x} y={hover.y}>
            <Tip>
              <b>{`${labels[hover.i]}시`}</b>
              {tip(hover.i)}
            </Tip>
          </PointTip>
        )}
      </Plot>
      <div data-x="" style={{ justifyContent: 'space-around' }}>
        {labels.map((l) => (
          <span key={l} style={{ flex: 1, textAlign: 'center' }}>
            {l}
          </span>
        ))}
      </div>
    </Box>
  );
}
