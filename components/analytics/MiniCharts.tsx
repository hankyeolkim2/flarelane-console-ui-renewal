import { useState } from 'react';
import styled from '@emotion/styled';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 보드 카드 안 미리보기 — Figma 「widget — 인사이트」(Line and bar chart) · 「widget — 퍼널」(step 막대).

const days = (from: Date, n: number) => Array.from({ length: n }, (_, i) => new Date(from.getTime() + i * 86400000));
export const last30 = days(new Date('2026-09-09T00:00:00+09:00'), 30);
export const md = (d: Date) => `${d.getMonth() + 1}.${d.getDate()}`;

// Y 눈금 = 0 ~ 4k (스테이징 · Figma 값), X = 4일 간격 라벨
const Y = ['4k', '3k', '2k', '1k', '0'];

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

const Tip = styled.div`
  position: absolute;
  z-index: 5;
  transform: translate(-50%, calc(-100% - 10px));
  padding: 8px 12px;
  border-radius: ${radius.md}px;
  background: ${color('bg-primary-solid')};
  box-shadow: ${shadow.lg};
  pointer-events: none;
  white-space: nowrap;
  ${text('text-xs', 'semibold')};
  color: ${color('text-white')};
  > small { display: block; ${text('text-xs', 'regular')}; color: ${color('text-tertiary_on-brand')}; }
`;

export function InsightMiniChart({ values, label }: { values: number[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = 4000;
  const n = values.length;
  const pts = values.map((v, i) => [(i / (n - 1)) * 100, 100 - (v / max) * 100]);
  const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  return (
    <ChartWrap onClick={(e) => e.stopPropagation()}>
      <YAxis>
        {Y.map((y) => (
          <span key={y}>{y}</span>
        ))}
      </YAxis>
      <Plot>
        <Grid
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setHover(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1)))));
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
            {hover != null && <line x1={pts[hover][0]} x2={pts[hover][0]} y1={0} y2={100} stroke="var(--border-primary)" strokeWidth={1} vectorEffect="non-scaling-stroke" />}
          </svg>
          {hover != null && (
            <Tip style={{ left: `${pts[hover][0]}%`, top: `${pts[hover][1]}%` }}>
              {values[hover].toLocaleString()}명
              <small>{md(last30[hover])} · {label}</small>
            </Tip>
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
  const [hover, setHover] = useState<{ i: number; kind: 'conversion' | 'drop' } | null>(null);
  const first = counts[0] || 0;
  return (
    <Steps onClick={(e) => e.stopPropagation()}>
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
                onMouseEnter={() => setHover({ i, kind: 'conversion' })}
                onMouseLeave={() => setHover(null)}
              />
              {i > 0 && <Drop $on={on && hover?.kind === 'drop'} onMouseEnter={() => setHover({ i, kind: 'drop' })} onMouseLeave={() => setHover(null)} />}
              {on && (
                <Tip style={{ left: hover!.kind === 'conversion' ? `${conv / 2}%` : `${(conv + 100) / 2}%`, top: 0 }}>
                  {hover!.kind === 'conversion' ? `${pct(stepConv)} 전환` : `${pct(dropRate)} 이탈`}
                  <small>{`${i + 1}. ${s} · ${hover!.kind === 'conversion' ? counts[i] : dropCount}명`}</small>
                </Tip>
              )}
            </Track>
            <b>{pct(conv)}</b>
          </Step>
        );
      })}
    </Steps>
  );
}
