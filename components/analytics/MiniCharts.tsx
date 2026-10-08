import { useState } from 'react';
import styled from '@emotion/styled';
import { color } from '@/styles/tokens';
import { PointTip } from '@/components/ui/Tooltip';
import { text } from '@/styles/typography';

// 보드 카드 안 미리보기 — Figma 「widget — 인사이트」(Line and bar chart) · 「widget — 퍼널」(step 막대).

const days = (from: Date, n: number) => Array.from({ length: n }, (_, i) => new Date(from.getTime() + i * 86400000));
export const last30 = days(new Date('2026-09-09T00:00:00+09:00'), 30);
export const md = (d: Date) => `${d.getMonth() + 1}.${d.getDate()}`;

// Y 눈금 5개 — 데이터 최댓값에 맞춰 1 · 2 · 2.5 · 5 × 10ⁿ 간격 (0이면 0 ~ 4k), X = 4일 간격 라벨
export function niceMax(peak: number) {
  if (peak <= 0) return 4000;
  const raw = peak / 4;
  const p = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((v) => v >= raw)!;
  return step * 4;
}
export const fmtK = (v: number) => (v >= 1_000_000 ? `${+(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : String(v));

const ChartWrap = styled.div`
  position: relative;
  display: flex;
  gap: 4px;
  height: 166px;
`;

const YAxis = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 18px;
  padding-bottom: 24px;
  ${text('text-xs', 'regular')};
  color: ${color('text-quaternary')};
  text-align: right;
  > span { line-height: 1; }
`;

const Plot = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const Grid = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-top: 4px;
  > i { display: block; height: 1px; background: ${color('border-tertiary')}; }
  > i:last-of-type { background: ${color('border-secondary')}; }
  svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
`;

const XAxis = styled.div`
  display: flex;
  justify-content: space-between;
  height: 18px;
  margin-top: 6px;
  ${text('text-xs', 'regular')};
  color: ${color('text-quaternary')};
`;

const TipSub = styled.small`
  display: block;
  ${text('text-xs', 'regular')};
  color: ${color('text-tertiary_on-brand')};
`;

export function InsightMiniChart({ values, label }: { values: number[]; label: string }) {
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const max = niceMax(Math.max(...values));
  const Y = [4, 3, 2, 1, 0].map((k) => fmtK((max / 4) * k));
  const n = values.length;
  const pts = values.map((v, i) => [(i / (n - 1)) * 100, 100 - (v / max) * 100]);
  const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  return (
    <ChartWrap>
      <YAxis>
        {Y.map((y) => (
          <span key={y}>{y}</span>
        ))}
      </YAxis>
      <Plot>
        <Grid
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const i = Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1))));
            setHover({ i, x: r.left + (pts[i][0] / 100) * r.width, y: r.top + (pts[i][1] / 100) * r.height });
          }}
          onMouseLeave={() => setHover(null)}
        >
          {Y.map((y) => (
            <i key={y} />
          ))}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="insightFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#193875" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#193875" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${path} L100,100 L0,100 Z`} fill="url(#insightFill)" />
            <path d={path} fill="none" stroke="var(--fg-brand-primary)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            {hover && <line x1={pts[hover.i][0]} x2={pts[hover.i][0]} y1={0} y2={100} stroke="var(--border-primary)" strokeWidth={1} vectorEffect="non-scaling-stroke" />}
          </svg>
          {hover && (
            <PointTip x={hover.x} y={hover.y}>
              {values[hover.i].toLocaleString('ko-KR')}명
              <TipSub>{md(last30[hover.i])} · {label}</TipSub>
            </PointTip>
          )}
        </Grid>
        <XAxis>
          {last30.filter((_, i) => i % 4 === 0).map((d) => (
            <span key={d.toISOString()}>{md(d)}</span>
          ))}
        </XAxis>
      </Plot>
    </ChartWrap>
  );
}

const Steps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 166px;
`;

const Step = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  > span:first-of-type { width: 120px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; ${text('text-sm', 'regular')}; color: ${color('text-secondary')}; }
  > b { width: 52px; flex-shrink: 0; text-align: right; ${text('text-sm', 'medium')}; color: ${color('text-primary')}; }
`;

const Track = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  height: 8px;
  border-radius: 4px;
  background: ${color('bg-tertiary')};
`;

const Fill = styled.div<{ dim: boolean }>`
  height: 100%;
  border-radius: 4px;
  background: ${color('bg-brand-solid')};
  opacity: ${(p) => (p.dim ? 0.4 : 1)};
  transition: opacity 0.1s linear;
`;

const Drop = styled.div<{ $on: boolean }>`
  flex: 1;
  height: 100%;
  border-radius: 0 4px 4px 0;
  background: ${(p) => (p.$on ? color('bg-quaternary') : 'transparent')};
`;

const pct = (v: number) => (v === 100 ? '100%' : `${v.toFixed(1)}%`);

// 막대 = 전환(진한 부분) · 이탈(나머지, 2단계부터) — 마우스를 올리면 각각 전환/이탈 말풍선 (스테이징 동작)
export function FunnelMiniChart({ steps, counts }: { steps: string[]; counts: number[] }) {
  const [hover, setHover] = useState<{ i: number; kind: 'conversion' | 'drop'; x: number; y: number } | null>(null);
  const first = counts[0] || 0;
  return (
    <Steps>
      {steps.map((s, i) => {
        const prev = i > 0 ? counts[i - 1] : counts[i];
        // 막대 길이 · % = 바로 앞 단계 대비 전환율 (Figma · 스테이징: 30.0% = 6/20, 33.3% = 2/6)
        const stepConv = prev ? (counts[i] / prev) * 100 : 0;
        const conv = i === 0 ? (first ? 100 : 0) : stepConv;
        const dropCount = i > 0 ? prev - counts[i] : 0;
        const dropRate = i > 0 && prev ? (dropCount / prev) * 100 : 0;
        const on = hover?.i === i;
        return (
          <Step key={s}>
            <span>{`${i + 1}. ${s}`}</span>
            <Track>
              <Fill
                dim={on && hover?.kind === 'drop'}
                style={{ width: `${conv}%` }}
                onMouseMove={(e) => setHover({ i, kind: 'conversion', x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setHover(null)}
              />
              {i > 0 && <Drop $on={on && hover?.kind === 'drop'} onMouseMove={(e) => setHover({ i, kind: 'drop', x: e.clientX, y: e.clientY })} onMouseLeave={() => setHover(null)} />}
              {on && hover && (
                <PointTip x={hover.x} y={hover.y}>
                  {hover.kind === 'conversion' ? `${pct(stepConv)} 전환` : `${pct(dropRate)} 이탈`}
                  <TipSub>{`${i + 1}. ${s} · ${(hover.kind === 'conversion' ? counts[i] : dropCount).toLocaleString('ko-KR')}명`}</TipSub>
                </PointTip>
              )}
            </Track>
            <b>{pct(conv)}</b>
          </Step>
        );
      })}
    </Steps>
  );
}
