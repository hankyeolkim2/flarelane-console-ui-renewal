import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import styled from '@emotion/styled';
import Button from '@/components/ui/Button';
import Icon from '@/components/Icon';
import { fmtK, niceMax } from './MiniCharts';
import { HoverTip, PointTip } from '@/components/ui/Tooltip';
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


const TipHead = styled.b`
  display: flex;
  align-items: center;
  gap: 6px;
  > i { display: block; width: 12px; height: 2px; border-radius: 1px; }
`;
const TipDate = styled.small`
  display: block;
  margin-top: 2px;
  ${text('text-xs', 'regular')};
  color: ${color('text-tertiary_on-brand')};
`;
const TipValue = styled.strong`
  display: block;
  margin-top: 4px;
  ${text('text-sm', 'semibold')};
  color: ${color('text-white')};
`;

const XAxis = styled.div`
  position: relative;
  height: 20px;
  margin-left: 40px;
  ${text('text-sm', 'regular')};
  color: ${color('text-quaternary')};
  > span { position: absolute; top: 0; transform: translateX(-50%); white-space: nowrap; }
`;

// 계열 — 세분화면 label(「1. 이벤트/값/값」) · color 를 넘김, 없으면 「n. 이벤트」 · 기본 색
type Series = { name: string; values: number[]; label?: string; color?: string };
const sLabel = (s: Series, i: number) => s.label ?? `${i + 1}. ${s.name}`;
const sColor = (s: Series, i: number) => s.color ?? SERIES[i % SERIES.length];

export function InsightChart({ series, dates, unit, granularity }: { series: Series[]; dates: Date[]; unit: '명' | '회'; granularity: Gran }) {
  const [hover, setHover] = useState<{ i: number; s: number; w: number; h: number; left: number; top: number } | null>(null);
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
          <span key={sLabel(s, i)}>
            <i style={{ background: sColor(s, i) }} />
            {sLabel(s, i)}
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
            setHover({ i, s, w: r.width, h: r.height, left: r.left, top: r.top });
          }}
          onMouseLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <i key={t} />
          ))}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {series.map((s, si) => (
              <path key={sLabel(s, si)} d={s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')} fill="none" stroke={sColor(s, si)} strokeWidth={2} vectorEffect="non-scaling-stroke" />
            ))}
            {hover && <line x1={x(hover.i)} x2={x(hover.i)} y1={0} y2={100} stroke="var(--border-primary)" vectorEffect="non-scaling-stroke" />}
          </svg>
          {hover && (() => {
            const sr = series[hover.s];
            const v = sr.values[hover.i];
            const px = (x(hover.i) / 100) * hover.w;
            const py = 8 + (y(v) / 100) * (hover.h - 16);
            return (
              <>
                <span style={{ position: 'absolute', left: px - 4, top: py - 4, width: 8, height: 8, borderRadius: 4, background: 'var(--bg-primary)', border: `2px solid ${sColor(sr, hover.s)}`, pointerEvents: 'none' }} />
                <PointTip x={hover.left + px} y={hover.top + py}>
                  <TipHead>
                    <i style={{ background: sColor(sr, hover.s) }} />
                    {sLabel(sr, hover.s)}
                  </TipHead>
                  <TipDate>{tipLabel(dates[hover.i], granularity)}</TipDate>
                  <TipValue>{`${v.toLocaleString('ko-KR')}${unit}`}</TipValue>
                </PointTip>
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
    // Figma 표 카드 — CSV 추출은 표 위 오른쪽 끝
    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 24px 0' }}>
      <Button hierarchy="tertiary" iconLeading="download" onClick={onClick}>
        CSV 추출
      </Button>
    </div>
  );
}

// ── 데이터 그룹(세분화) ──
// Figma 「split by 추가」 세분화 표(10-26 확정): 텍스트 열 = 고정 폭 + 한 줄 말줄임 + 잘렸을 때만 툴팁으로 전체 값.
// 텍스트 열 폭(칸 전체): 인사이트 이벤트 200 · 퍼널 단계 140 · 데이터 그룹 180. 숫자 열 = 값에 맞춤(평균 · 총 전환율 88~, 기간 · 단계 값 72~).
const LEAD_W = { INSIGHT: 200, FUNNEL: 140 };
const DIM_W = 180;

// 한 줄 말줄임 — 실제로 잘렸을 때만 호버 툴팁으로 전체 값
function Trunc({ text: label, width, children }: { text: string; width: number; children?: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [cut, setCut] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setCut(el.scrollWidth > el.clientWidth + 1);
  });
  const body = (
    <span ref={ref} style={{ display: 'block', width, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {children ?? label}
    </span>
  );
  return cut ? <HoverTip content={label} maxWidth={320}>{body}</HoverTip> : body;
}

const BT = styled.table`
  /* 고정 칸의 선이 스크롤 때 떨어지지 않게 separate */
  border-collapse: separate;
  border-spacing: 0;
  min-width: 100%;
  th { height: 40px; padding: 0 12px; background: ${color('bg-secondary')}; border-bottom: 1px solid ${color('border-secondary')}; ${text('text-xs', 'medium')}; color: ${color('text-tertiary')}; text-align: left; vertical-align: bottom; padding-bottom: 11px; white-space: normal; }
  td { padding: 12px; border-bottom: 1px solid ${color('border-secondary')}; ${text('text-sm', 'regular')}; color: ${color('text-secondary')}; vertical-align: top; }
  tr:last-of-type td { border-bottom: 0; }
  th:first-of-type, td:first-of-type { padding-left: 20px; }
  th:last-of-type, td:last-of-type { padding-right: 20px; }
  [data-text] { white-space: nowrap; color: ${color('text-primary')}; }
  [data-num] { min-width: 72px; text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  [data-avg] { min-width: 88px; }
  [data-dim-last] { border-right: 1px solid ${color('border-secondary')}; }
  /* 세로 스크롤 때 머리글 고정, 가로 스크롤 때 앞쪽 텍스트 열(이벤트 · 단계 + 데이터 그룹) 고정 — Figma 표 카드 */
  thead th { position: sticky; top: 0; z-index: 2; }
  [data-sticky] { position: sticky; left: var(--sl, 0); z-index: 1; background: ${color('bg-primary')}; }
  thead [data-sticky] { z-index: 3; background: ${color('bg-secondary')}; }
  td span[data-swatch] { display: flex; align-items: center; gap: 6px; min-width: 0; }
  /* 그래프 표시 체크박스 — Figma cb(ms check_box 18, 계열 색) / 해제 = check_box_outline_blank(fg-quaternary) */
  td span[data-swatch] > button { flex-shrink: 0; display: inline-flex; margin: 1px 0 0 -3px; padding: 0; border: 0; border-radius: 4px; background: none; color: ${color('fg-quaternary')}; cursor: pointer; }
  td span[data-swatch] > button:hover { color: ${color('fg-quaternary_hover')}; }
  td span[data-swatch] > button:focus-visible { outline: 2px solid ${color('border-brand')}; outline-offset: 1px; }
  tbody tr:hover td { background: ${color('bg-primary_hover')}; }
`;

// 세분화 표 스크롤 상자 — 최대 높이 안에서 가로 · 세로 스크롤(Figma: 인사이트 392 = 머리글 40 + 8행, 퍼널 416 = 머리글 64 + 8행)
// 스크롤바는 실제로 움직이는 영역에서만 — 세로 = 머리글 아래부터, 가로 = 고정 열이 끝난 곳부터.
// 머리글 옆 스크롤바 칸은 머리글 색 + 아래 구분선으로 이어 칠해 흰 띠가 남지 않게 함.
// --head-h · --sticky-w 는 StickyTable 이 실제 크기로 넣음.
const BScroll = styled.div`
  overflow: auto;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.md}px;
  overscroll-behavior: contain;
  &::-webkit-scrollbar:vertical {
    background: linear-gradient(
      to bottom,
      ${color('bg-secondary')} 0,
      ${color('bg-secondary')} calc(var(--head-h, 40px) - 1px),
      ${color('border-secondary')} calc(var(--head-h, 40px) - 1px),
      ${color('border-secondary')} var(--head-h, 40px),
      transparent var(--head-h, 40px)
    );
  }
  &::-webkit-scrollbar-track:vertical { margin-top: var(--head-h, 40px); }
  &::-webkit-scrollbar-track:horizontal { margin-left: var(--sticky-w, 0px); }
`;

// 고정 열의 left 값을 열 폭에서 계산해 칸마다 --sl 로 넣음(열 폭이 내용에 따라 바뀌어서)
function StickyTable({ maxHeight, children }: { maxHeight: number; children: ReactNode }) {
  const ref = useRef<HTMLTableElement>(null);
  useLayoutEffect(() => {
    const t = ref.current;
    if (!t) return;
    const apply = () => {
      const head = t.tHead?.rows[0];
      if (!head) return;
      const lefts: number[] = [];
      let x = 0;
      [...head.cells].forEach((c, i) => {
        if (!c.hasAttribute('data-sticky')) return;
        lefts[i] = x;
        x += c.getBoundingClientRect().width;
      });
      for (const row of [...t.rows]) [...row.cells].forEach((c, i) => lefts[i] !== undefined && c.style.setProperty('--sl', `${lefts[i]}px`));
      const box = t.parentElement;
      if (box) {
        box.style.setProperty('--head-h', `${t.tHead?.getBoundingClientRect().height ?? 40}px`);
        box.style.setProperty('--sticky-w', `${x}px`);
      }
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(t);
    return () => ro.disconnect();
  });
  return (
    <BScroll style={{ maxHeight }}>
      <BT ref={ref}>{children}</BT>
    </BScroll>
  );
}

export type BreakdownRow = { index: number; event: string; labels: string[]; color: string; values: number[] };

// 그래프에 그릴지 고르는 체크박스
function Check({ on, color: c, label, onToggle }: { on: boolean; color: string; label: string; onToggle: () => void }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} aria-label={`${label} 그래프에 표시`} style={on ? { color: c } : undefined} onClick={onToggle}>
      <Icon name={on ? 'check_box' : 'check_box_outline_blank'} size={18} />
    </button>
  );
}

export function InsightBreakdownTable({ rows, headers, dates, granularity, onToggle }: { rows: BreakdownRow[]; headers: string[]; dates: Date[]; granularity: Gran; onToggle?: (r: BreakdownRow) => void }) {
  return (
    <TableWrap>
      <StickyTable maxHeight={392}>
          <thead>
            <tr>
              <th data-text data-lead data-sticky><Trunc text="이벤트" width={LEAD_W.INSIGHT - 32} /></th>
              {headers.map((h, i) => (
                <th key={h} data-text data-sticky data-dim-last={i === headers.length - 1 ? '' : undefined}><Trunc text={h} width={DIM_W - 24} /></th>
              ))}
              <th data-num data-avg>평균</th>
              {dates.map((d) => (
                <th key={d.toISOString()} data-num>{headLabel(d, granularity)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.index}|${r.labels.join('|')}`}>
                <td data-text data-lead data-sticky><Trunc text={`${r.index + 1}. ${r.event}`} width={LEAD_W.INSIGHT - 32} /></td>
                {r.labels.map((l, i) =>
                  i === r.labels.length - 1 ? (
                    <td key={i} data-text data-sticky data-dim-last>
                      <span data-swatch style={{ width: DIM_W - 24 }}>
                        <Check on={!!r.color} color={r.color} label={`${r.index + 1}. ${r.event}/${r.labels.join('/')}`} onToggle={() => onToggle?.(r)} />
                        <Trunc text={l} width={DIM_W - 24 - 21} />
                      </span>
                    </td>
                  ) : (
                    <td key={i} data-text data-sticky><Trunc text={l} width={DIM_W - 24} /></td>
                  ),
                )}
                <td data-num data-avg>{Math.round(r.values.reduce((a, b) => a + b, 0) / Math.max(r.values.length, 1)).toLocaleString()}</td>
                {r.values.map((v, j) => (
                  <td key={j} data-num>{v.toLocaleString()}</td>
                ))}
              </tr>
            ))}
          </tbody>
      </StickyTable>
    </TableWrap>
  );
}

export type FunnelGroup = { labels: string[]; color: string; counts: number[] };

const BarsBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 24px 0;
`;

const BarsPlot = styled.div`
  display: flex;
  gap: 8px;
  height: 280px;
`;

const BarsArea = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  > [data-grid] { position: absolute; inset: 8px 0; display: flex; flex-direction: column; justify-content: space-between; pointer-events: none; }
  > [data-grid] > i { display: block; height: 1px; background: ${color('border-secondary')}; }
  > [data-grid] > i:last-of-type { background: ${color('border-primary')}; }
`;

// 단계 하나 = 계열 막대 묶음. 막대 폭은 묶음 폭을 계열 수로 나눔(Figma 「막대 폭 자동 분배」).
const StepGroup = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding: 8px 4%;
  > div { position: relative; flex: 1; height: 100%; max-width: 32px; }
  > div > i { position: absolute; left: 0; right: 0; bottom: 0; border-radius: 2px 2px 0 0; }
  > div > i[data-prev] { background: ${color('bg-tertiary')}; }
`;

const StepLabels = styled.div`
  display: flex;
  margin-left: 48px;
  > span { flex: 1; text-align: center; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; overflow-wrap: anywhere; }
`;

const Swatches = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  > span { display: flex; align-items: center; gap: 6px; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
  > span > i { display: block; width: 10px; height: 10px; border-radius: 2px; }
`;

// 막대 높이 = 계열의 첫 단계 대비 비율, 회색 상자 = 앞 단계 높이(9.14 변경사항)
export function FunnelBars({ steps, groups }: { steps: string[]; groups: FunnelGroup[] }) {
  const [hover, setHover] = useState<{ s: number; g: number; x: number; y: number } | null>(null);
  const pctOf = (g: FunnelGroup, i: number) => (g.counts[0] ? (g.counts[i] / g.counts[0]) * 100 : 0);
  return (
    <BarsBox>
      <Swatches>
        {groups.map((g) => (
          <span key={g.labels.join('/')}>
            <i style={{ background: g.color }} />
            {g.labels.join('/')}
          </span>
        ))}
      </Swatches>
      <BarsPlot>
        <YLabels style={{ width: 40 }}>
          {[100, 75, 50, 25, 0].map((t) => (
            <span key={t}>{`${t}%`}</span>
          ))}
        </YLabels>
        <BarsArea onMouseLeave={() => setHover(null)}>
          <div data-grid>
            {[0, 1, 2, 3, 4].map((k) => (
              <i key={k} />
            ))}
          </div>
          {steps.map((st, si) => (
            <StepGroup key={st + si}>
              {groups.map((g, gi) => (
                <div
                  key={gi}
                  onMouseMove={(e) => setHover({ s: si, g: gi, x: e.clientX, y: e.clientY })}
                >
                  {si > 0 && <i data-prev style={{ height: `${pctOf(g, si - 1)}%` }} />}
                  <i style={{ height: `${pctOf(g, si)}%`, background: g.color, opacity: hover && (hover.g !== gi || hover.s !== si) ? 0.4 : 1 }} />
                </div>
              ))}
            </StepGroup>
          ))}
          {hover && (() => {
            const g = groups[hover.g];
            const prev = hover.s ? g.counts[hover.s - 1] : g.counts[hover.s];
            return (
              <PointTip x={hover.x} y={hover.y}>
                <TipHead>
                  <i style={{ background: g.color }} />
                  {g.labels.join('/')}
                </TipHead>
                <TipDate>{`${hover.s + 1}. ${steps[hover.s]}`}</TipDate>
                <TipValue>{`${pct(pctOf(g, hover.s))} · ${g.counts[hover.s].toLocaleString()}`}</TipValue>
                {hover.s > 0 && <TipDate>{`앞 단계 대비 ${pct(prev ? (g.counts[hover.s] / prev) * 100 : 0)}`}</TipDate>}
              </PointTip>
            );
          })()}
        </BarsArea>
      </BarsPlot>
      <StepLabels>
        {steps.map((st, i) => (
          <span key={st + i}>{`${i + 1}. ${st}`}</span>
        ))}
      </StepLabels>
    </BarsBox>
  );
}

export function FunnelBreakdownTable({ steps, headers, groups, onToggle }: { steps: string[]; headers: string[]; groups: FunnelGroup[]; onToggle?: (g: FunnelGroup) => void }) {
  return (
    <TableWrap>
      <StickyTable maxHeight={416}>
          <thead>
            <tr>
              <th data-text data-sticky><Trunc text="단계" width={LEAD_W.FUNNEL - 32} /></th>
              {headers.map((h, i) => (
                <th key={h} data-text data-sticky data-dim-last={i === headers.length - 1 ? '' : undefined}><Trunc text={h} width={DIM_W - 24} /></th>
              ))}
              <th data-num data-avg>총 전환율</th>
              <th data-num>{`1. ${steps[0]}`}</th>
              {steps.slice(1).map((_, i) => (
                <th key={i} data-num>{`${i + 1} → ${i + 2}`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => {
              const first = g.counts[0] || 0;
              const last = g.counts[g.counts.length - 1] || 0;
              return (
                <tr key={g.labels.join('|')}>
                  <td data-text data-sticky><Trunc text="모든 단계" width={LEAD_W.FUNNEL - 32} /></td>
                  {g.labels.map((l, i) =>
                    i === g.labels.length - 1 ? (
                      <td key={i} data-text data-sticky data-dim-last>
                        <span data-swatch style={{ width: DIM_W - 24 }}>
                          <Check on={!!g.color} color={g.color} label={g.labels.join('/')} onToggle={() => onToggle?.(g)} />
                          <Trunc text={l} width={DIM_W - 24 - 21} />
                        </span>
                      </td>
                    ) : (
                      <td key={i} data-text data-sticky><Trunc text={l} width={DIM_W - 24} /></td>
                    ),
                  )}
                  <td data-num data-avg>{pct(first ? (last / first) * 100 : 0)}</td>
                  <td data-num>{first.toLocaleString()}</td>
                  {g.counts.slice(1).map((c, i) => (
                    <td key={i} data-num>
                      {pct(g.counts[i] ? (c / g.counts[i]) * 100 : 0)}
                      <small style={{ display: 'block', color: 'var(--text-tertiary)' }}>{c.toLocaleString()}</small>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
      </StickyTable>
    </TableWrap>
  );
}
