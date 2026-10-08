import { useState } from 'react';
import styled from '@emotion/styled';
import Button from '@/components/ui/Button';
import { fmtK, niceMax } from './MiniCharts';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma 「인사이트 편집」 Report card — Chart · CSV · Table, 「퍼널 편집」 Funnel · CSV · Table.

export const dayLabel = (d: Date) => `${d.getMonth() + 1}.${d.getDate()}`;
export type Gran = 'HOUR' | 'DAY' | 'MONTH';
const ampm = (d: Date) => `${d.getHours() % 12 || 12} ${d.getHours() < 12 ? '오전' : '오후'}`; // ko `h aa`
const yy = (d: Date) => String(d.getFullYear()).slice(2);
// 표 머리글: 일 `M.d` · 월 `M` · 시간 `M.d h aa`
export const headLabel = (d: Date, g: Gran) => (g === 'MONTH' ? `${d.getMonth() + 1}` : g === 'HOUR' ? `${dayLabel(d)} ${ampm(d)}` : dayLabel(d));
// 툴팁 날짜: `yy.M.d` · 월 `yy.M` · 시간 `yy.M.d h aa`
const tipLabel = (d: Date, g: Gran) => (g === 'MONTH' ? `${yy(d)}.${d.getMonth() + 1}` : g === 'HOUR' ? `${yy(d)}.${dayLabel(d)} ${ampm(d)}` : `${yy(d)}.${dayLabel(d)}`);

// 가로축 눈금: 시간 = 하루짜리면 2시간 간격 시각, 그 이상이면 날짜가 바뀌는 칸에 날짜 / 일 = 30일 이하 3칸 간격 / 월 = 매월
function xTicks(dates: Date[], g: Gran) {
  const n = dates.length;
  if (g === 'HOUR') {
    if (n <= 24) return dates.map((d, i) => ({ i, label: ampm(d) })).filter((t) => t.i % 2 === 0);
    const days = dates.map((d, i) => ({ i, d })).filter(({ d }) => d.getHours() === 0);
    const every = Math.max(1, Math.ceil(days.length / 10));
    return days.filter((_, k) => k % every === 0).map(({ i, d }) => ({ i, label: dayLabel(d) }));
  }
  if (g === 'MONTH') return dates.map((d, i) => ({ i, label: `${d.getMonth() + 1}` }));
  const every = n <= 30 ? 3 : Math.ceil(n / 10);
  return dates.map((d, i) => ({ i, label: dayLabel(d) })).filter((t) => t.i % every === 0);
}

// 계열 색 — 첫 계열 fg-brand-primary(Figma), 그 뒤는 차트 색 순서
const SERIES = ['var(--fg-brand-primary)', 'var(--chart-clicked)', 'var(--chart-remaining)', 'var(--chart-uninstalled)', 'var(--chart-capped)'];

const ChartBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 24px;
`;

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  > span { display: flex; align-items: center; gap: 6px; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
  > span > i { display: block; width: 12px; height: 2px; border-radius: 1px; }
`;

const Plot = styled.div`
  display: flex;
  gap: 8px;
  height: 260px;
`;

const YLabels = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 32px;
  padding: 0 0 0 0;
  ${text('text-sm', 'regular')};
  color: ${color('text-quaternary')};
  text-align: right;
  > span { line-height: 16px; }
`;

const GridArea = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px 0;
  > i { display: block; height: 1px; background: ${color('border-secondary')}; }
  > i:last-of-type { background: ${color('border-primary')}; }
  > svg { position: absolute; left: 0; right: 0; top: 8px; bottom: 8px; width: 100%; height: calc(100% - 16px); overflow: visible; }
`;


const Tip = styled.div`
  position: absolute;
  z-index: 5;
  padding: 8px 12px;
  border-radius: ${radius.md}px;
  background: ${color('bg-primary-solid')};
  box-shadow: ${shadow.lg};
  pointer-events: none;
  white-space: nowrap;
  ${text('text-xs', 'semibold')};
  color: ${color('text-white')};
  > b { display: flex; align-items: center; gap: 6px; }
  > b > i { display: block; width: 12px; height: 2px; border-radius: 1px; }
  > small { display: block; margin-top: 2px; ${text('text-xs', 'regular')}; color: ${color('text-tertiary_on-brand')}; }
  > strong { display: block; margin-top: 4px; ${text('text-sm', 'semibold')}; color: ${color('text-white')}; }
`;

const XAxis = styled.div`
  position: relative;
  height: 20px;
  margin-left: 40px;
  ${text('text-sm', 'regular')};
  color: ${color('text-quaternary')};
  > span { position: absolute; top: 0; transform: translateX(-50%); white-space: nowrap; }
`;

export function InsightChart({ series, dates, unit, granularity }: { series: { name: string; values: number[] }[]; dates: Date[]; unit: '명' | '회'; granularity: Gran }) {
  const [hover, setHover] = useState<{ i: number; s: number; w: number; h: number } | null>(null);
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const ticks = [4, 3, 2, 1, 0].map((k) => (max / 4) * k);
  const n = dates.length;
  const x = (i: number) => (n > 1 ? (i / (n - 1)) * 100 : 50);
  const y = (v: number) => 100 - (v / max) * 100;
  const ticksX = xTicks(dates, granularity);
  return (
    <ChartBox>
      <Legend>
        {series.map((s, i) => (
          <span key={s.name}>
            <i style={{ background: SERIES[i % SERIES.length] }} />
            {`${i + 1}. ${s.name}`}
          </span>
        ))}
      </Legend>
      <Plot>
        <YLabels>
          {ticks.map((t) => (
            <span key={t}>{fmtK(t)}</span>
          ))}
        </YLabels>
        <GridArea
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const i = Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1))));
            // 마우스에서 가장 가까운 계열의 점
            const py = ((e.clientY - r.top - 8) / (r.height - 16)) * 100;
            let s = 0;
            series.forEach((sr, k) => {
              if (Math.abs(y(sr.values[i]) - py) < Math.abs(y(series[s].values[i]) - py)) s = k;
            });
            setHover({ i, s, w: r.width, h: r.height });
          }}
          onMouseLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <i key={t} />
          ))}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {series.map((s, si) => (
              <path key={s.name} d={s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')} fill="none" stroke={SERIES[si % SERIES.length]} strokeWidth={2} vectorEffect="non-scaling-stroke" />
            ))}
            {hover && <line x1={x(hover.i)} x2={x(hover.i)} y1={0} y2={100} stroke="var(--border-primary)" vectorEffect="non-scaling-stroke" />}
          </svg>
          {hover && (() => {
            const sr = series[hover.s];
            const v = sr.values[hover.i];
            const px = (x(hover.i) / 100) * hover.w;
            const py = 8 + (y(v) / 100) * (hover.h - 16);
            const flip = px > hover.w - 200; // 오른쪽이 모자라면 왼쪽으로
            const top = Math.max(0, Math.min(py - 36, hover.h - 76)); // 그래프 영역 안에서
            return (
              <>
                <span style={{ position: 'absolute', left: px - 4, top: py - 4, width: 8, height: 8, borderRadius: 4, background: 'var(--bg-primary)', border: `2px solid ${SERIES[hover.s % SERIES.length]}`, pointerEvents: 'none' }} />
                <Tip style={{ top, ...(flip ? { right: hover.w - px + 12 } : { left: px + 12 }) }}>
                  <b>
                    <i style={{ background: SERIES[hover.s % SERIES.length] }} />
                    {`${hover.s + 1}. ${sr.name}`}
                  </b>
                  <small>{tipLabel(dates[hover.i], granularity)}</small>
                  <strong>{`${v.toLocaleString('ko-KR')}${unit}`}</strong>
                </Tip>
              </>
            );
          })()}
        </GridArea>
      </Plot>
      <XAxis>
        {ticksX.map((t) => (
          <span key={t.i} style={{ left: `${x(t.i)}%` }}>{t.label}</span>
        ))}
      </XAxis>
    </ChartBox>
  );
}

const TableWrap = styled.div`
  padding: 8px 24px 24px;
`;

const Scroll = styled.div`
  overflow-x: auto;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.md}px;
`;

const T = styled.table`
  border-collapse: collapse;
  min-width: 100%;
  white-space: nowrap;
  th { height: 40px; padding: 0 16px; background: ${color('bg-secondary')}; border-bottom: 1px solid ${color('border-secondary')}; ${text('text-sm', 'medium')}; color: ${color('text-tertiary')}; text-align: left; }
  td { padding: 14px 16px; border-bottom: 1px solid ${color('border-secondary')}; ${text('text-md', 'regular')}; color: ${color('text-secondary')}; }
  tr:last-of-type td { border-bottom: 0; }
  td:first-of-type { color: ${color('text-primary')}; }
  td small { display: block; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
`;

export function InsightTable({ series, dates, granularity }: { series: { name: string; values: number[] }[]; dates: Date[]; granularity: Gran }) {
  return (
    <TableWrap>
      <Scroll>
        <T>
          <thead>
            <tr>
              <th style={{ width: 220, minWidth: 220 }}>이벤트</th>
              <th style={{ width: 90, minWidth: 90 }}>평균</th>
              {dates.map((d) => (
                <th key={d.toISOString()} style={{ width: 90, minWidth: 90 }}>{headLabel(d, granularity)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {series.map((s, i) => (
              <tr key={s.name}>
                <td>{`${i + 1}. ${s.name}`}</td>
                <td>{Math.round(s.values.reduce((a, b) => a + b, 0) / Math.max(s.values.length, 1)).toLocaleString()}</td>
                {s.values.map((v, j) => (
                  <td key={j}>{v.toLocaleString()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </T>
      </Scroll>
    </TableWrap>
  );
}

const pct = (v: number) => `${v.toFixed(1)}%`;

const FunnelBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 24px;
`;

const Step = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 44px;
  > span:first-of-type { width: 160px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; ${text('text-md', 'regular')}; color: ${color('text-secondary')}; }
  > div:last-of-type { position: relative; flex: 1; height: 24px; border-radius: 2px; background: ${color('bg-tertiary')}; }
  > div:last-of-type > i { display: block; height: 100%; border-radius: 2px; background: ${color('bg-brand-solid')}; }
`;

const Val = styled.div`
  width: 52px;
  flex-shrink: 0;
  > b { display: block; ${text('text-md', 'semibold')}; color: ${color('text-primary')}; }
  > small { ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
`;

const DropRow = styled.div`
  ${text('text-sm', 'regular')};
  color: ${color('text-tertiary')};
`;

// 막대 길이 = 첫 단계 대비, 숫자 = 앞 단계 대비 전환율 + 인원 (Figma 「퍼널 편집」 값)
export function FunnelResult({ steps, counts }: { steps: string[]; counts: number[] }) {
  const first = counts[0] || 0;
  return (
    <FunnelBox>
      {steps.map((s, i) => {
        const prev = i ? counts[i - 1] : counts[i];
        const stepRate = prev ? (counts[i] / prev) * 100 : 0;
        return (
          <div key={s} style={{ display: 'contents' }}>
            {i > 0 && <DropRow>{`이탈 ${pct(100 - stepRate)}`}</DropRow>}
            <Step>
              <span>{`${i + 1}. ${s}`}</span>
              <Val>
                <b>{i === 0 ? (first ? '100%' : '0%') : pct(stepRate)}</b>
                <small>{counts[i].toLocaleString()}</small>
              </Val>
              <div>
                <i style={{ width: `${first ? (counts[i] / first) * 100 : 0}%` }} />
              </div>
            </Step>
          </div>
        );
      })}
    </FunnelBox>
  );
}

export function FunnelTable({ steps, counts }: { steps: string[]; counts: number[] }) {
  const first = counts[0] || 0;
  const last = counts[counts.length - 1] || 0;
  return (
    <TableWrap>
      <Scroll>
        <T>
          <thead>
            <tr>
              <th style={{ width: 316, minWidth: 316 }}>단계</th>
              <th style={{ width: 140, minWidth: 140 }}>총 전환율</th>
              <th style={{ width: 160, minWidth: 160 }}>{`1. ${steps[0]}`}</th>
              {steps.slice(1).map((_, i) => (
                <th key={i} style={{ width: 160, minWidth: 160 }}>{`${i + 1} → ${i + 2}`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 500 }}>모든 단계</td>
              <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{pct(first ? (last / first) * 100 : 0)}</td>
              <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{first.toLocaleString()}</td>
              {counts.slice(1).map((c, i) => (
                <td key={i} style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                  {pct(counts[i] ? (c / counts[i]) * 100 : 0)}
                  <small>{c.toLocaleString()}</small>
                </td>
              ))}
            </tr>
          </tbody>
        </T>
      </Scroll>
    </TableWrap>
  );
}

export function CsvButton({ onClick }: { onClick: () => void }) {
  return (
    <div style={{ padding: '12px 24px 0' }}>
      <Button hierarchy="tertiary" iconLeading="download" onClick={onClick}>
        CSV 추출
      </Button>
    </div>
  );
}
