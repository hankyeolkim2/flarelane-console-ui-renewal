// 통계 편집 규칙 — docs/staging-behavior-analytics-editor.md 그대로.
import type { ReportType } from './analytics';

export type Preset = 'YESTERDAY' | 'TODAY' | 'LAST_7D' | 'LAST_30D';
export type Granularity = 'HOUR' | 'DAY' | 'MONTH';
export type Measurement = 'UNIQUE_USER' | 'TOTAL_COUNT';
export type Operator = 'EQ' | 'NEQ' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'INCLUDES';

export type Filter = { id: string; property: string | null; operator: Operator; values: string[] };
export type Metric = { id: string; event: string; filters: Filter[] };
export type TargetBlock =
  | { id: string; kind: 'EVENT'; event: string; filters: Filter[] }
  | { id: string; kind: 'SEGMENT'; segmentId: string }
  | { id: string; kind: 'USER' | 'DEVICE'; property: string; operator: Operator; value: string };
export type TargetGroup = { id: string; blocks: TargetBlock[] };

export type EditorState = {
  type: ReportType;
  range: { from: string; to: string; preset: Preset | null }; // yyyy-MM-dd
  granularity: Granularity;
  measurement: Measurement;
  conversionWindow: { value: number; unit: 'DAY' | 'HOUR' };
  metrics: Metric[];
  targets: TargetGroup[];
};

export const MAX_METRICS = 10;
export const MAX_TARGET_GROUPS = 10;
export const MAX_FILTER_VALUES = 100;
export const NAME_MAX = 100;

// 프로토타입 기준일 = 2026-10-08 (스테이징 확인일)
export const TODAY = new Date('2026-10-08T00:00:00');
export const MIN_DATE = addDays(TODAY, -365);

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// 툴바 프리셋: 어제 · 오늘 · 7일(오늘−6~오늘) · 30일(오늘−29~오늘)
export function presetRange(p: Preset) {
  const t = TODAY;
  if (p === 'YESTERDAY') return { from: ymd(addDays(t, -1)), to: ymd(addDays(t, -1)) };
  if (p === 'TODAY') return { from: ymd(t), to: ymd(t) };
  if (p === 'LAST_7D') return { from: ymd(addDays(t, -6)), to: ymd(t) };
  return { from: ymd(addDays(t, -29)), to: ymd(t) };
}

export const rangeDays = (r: { from: string; to: string }) => Math.round((parseYmd(r.to).getTime() - parseYmd(r.from).getTime()) / 86400000) + 1;

// 기간 일수 → 허용 단위 · 기본 단위
export function granularityRule(days: number): { allowed: Granularity[]; fallback: Granularity } {
  if (days <= 1) return { allowed: ['HOUR'], fallback: 'HOUR' };
  if (days <= 30) return { allowed: ['HOUR', 'DAY'], fallback: 'DAY' };
  if (days <= 60) return { allowed: ['DAY', 'MONTH'], fallback: 'DAY' };
  return { allowed: ['DAY', 'MONTH'], fallback: 'MONTH' };
}

export function withRange(s: EditorState, range: EditorState['range']): EditorState {
  const rule = granularityRule(rangeDays(range));
  return { ...s, range, granularity: rule.allowed.includes(s.granularity) ? s.granularity : rule.fallback };
}

let seq = 0;
export const uid = (p: string) => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;

export function defaultState(type: ReportType): EditorState {
  return {
    type,
    range: { ...presetRange('LAST_30D'), preset: 'LAST_30D' },
    granularity: 'DAY',
    measurement: 'UNIQUE_USER',
    conversionWindow: { value: 7, unit: 'DAY' },
    metrics: [],
    targets: [],
  };
}

// 변경 감지 — 프리셋이면 날짜 대신 프리셋 이름으로 비교, 이름은 포함 안 함, id 는 빼고 비교
export function serialize(s: EditorState) {
  const strip = (f: Filter) => ({ p: f.property, o: f.operator, v: f.values });
  return JSON.stringify({
    t: s.type,
    r: s.range.preset ?? [s.range.from, s.range.to],
    g: s.granularity,
    m: s.measurement,
    c: s.conversionWindow,
    e: s.metrics.map((m) => ({ e: m.event, f: m.filters.map(strip) })),
    tg: s.targets.map((g) => g.blocks.map((b) => (b.kind === 'EVENT' ? { k: b.kind, e: b.event, f: b.filters.map(strip) } : b.kind === 'SEGMENT' ? { k: b.kind, s: b.segmentId } : { k: b.kind, p: b.property, o: b.operator, v: b.value }))),
  });
}

// 쿼리에 실제로 들어가는 설정 (값 0개 필터 · 불완전 타겟 제외) — 결과 다시 불러오기 판단용
export function queryKey(s: EditorState) {
  const ok = (f: Filter) => f.property && f.values.length;
  return JSON.stringify({
    t: s.type,
    r: [s.range.from, s.range.to],
    g: s.type === 'INSIGHT' ? s.granularity : null,
    m: s.measurement,
    c: s.type === 'FUNNEL' && s.measurement === 'TOTAL_COUNT' ? s.conversionWindow : null,
    e: s.metrics.map((m) => ({ e: m.event, f: m.filters.filter(ok).map((f) => [f.property, f.operator, f.values]) })),
    tg: s.targets.map((g) => g.blocks.filter((b) => b.kind !== 'USER' && b.kind !== 'DEVICE' ? true : !!b.value).map((b) => b.id)),
  });
}

export const OPERATORS: { value: Operator; label: string }[] = [
  { value: 'EQ', label: '=' },
  { value: 'NEQ', label: '≠' },
  { value: 'GT', label: '>' },
  { value: 'GTE', label: '≥' },
  { value: 'LT', label: '<' },
  { value: 'LTE', label: '≤' },
  { value: 'INCLUDES', label: '이 중에 하나' },
];

// 「a」 / 「a, or b」 / 「a, b, or c」
export function joinValues(v: string[]) {
  if (v.length <= 1) return v[0] ?? '';
  return `${v.slice(0, -1).join(', ')}, or ${v[v.length - 1]}`;
}

// 검색 규칙: 소문자 + `_` 제거 후 부분 일치
export const norm = (s: string) => s.toLowerCase().replace(/_/g, '');
export const matches = (s: string, q: string) => norm(s).includes(norm(q));

// 툴바 기간 표시: 같은 해 `yyyy-MM-dd ~ MM-dd`, 다른 해 `yyyy-MM-dd ~ yyyy-MM-dd`
export function rangeLabel(r: { from: string; to: string }) {
  return r.from.slice(0, 4) === r.to.slice(0, 4) ? `${r.from} ~ ${r.to.slice(5)}` : `${r.from} ~ ${r.to}`;
}
