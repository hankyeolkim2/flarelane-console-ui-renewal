import { useRef, useState } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from './Button';
import Floating from './Floating';
import IconButton from './IconButton';
import NumberField from './NumberField';
import TextField from './TextField';
import { addDays, MIN_DATE, parseYmd, TODAY, ymd } from '@/lib/editor';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 달력 — Figma `_Date picker menu`(308:21686 · Single date 308:22023) · `_Calendar cell`(308:22251) · 6차 적용 안내 §6.
// 한 달 = 월요일 시작 · 6주(앞뒤 달 날짜는 Disabled 모양) · 칸 40 원형 · 줄 사이 4. 값은 모두 'YYYY-MM-DD'.

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];
export const monthLabel = (m: Date) => `${m.getFullYear()}년 ${m.getMonth() + 1}월`;
export const firstOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const addMonths = (m: Date, n: number) => new Date(m.getFullYear(), m.getMonth() + n, 1);
export const validYmd = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseYmd(s).getTime()) && ymd(parseYmd(s)) === s;
// 숫자만 쳐도 `-` 자동, 최대 10자
export const autoDash = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.length > 6 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}` : d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d;
};

// ---------- `_Calendar cell` ----------
// Type: Default · Today's date(bg-secondary) · Selected(bg-brand-solid) · Active(기간 사이, bg-secondary) / State: Hover · Disabled(글자 50%)
type Kind = 'default' | 'today' | 'selected' | 'active';
const Slot = styled.div`
  position: relative;
  width: 40px;
  height: 40px;
  /* 기간 연결 띠 — 칸 가운데에서 이웃 칸 가운데까지(Figma Connector left/right), 줄 끝 · 달 경계에서 끊음 */
  > i { position: absolute; top: 0; bottom: 0; background: ${color('bg-secondary')}; }
`;
const Cell = styled.button<{ $kind: Kind }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: ${radius.full}px;
  background: ${(p) => (p.$kind === 'selected' ? color('bg-brand-solid') : p.$kind === 'default' ? 'transparent' : color('bg-secondary'))};
  ${(p) => text('text-sm', p.$kind === 'default' ? 'regular' : 'medium')};
  color: ${(p) => (p.$kind === 'selected' ? color('text-white') : color('text-secondary'))};
  cursor: pointer;
  &:hover:not(:disabled) {
    background: ${(p) => (p.$kind === 'selected' ? color('bg-brand-solid_hover') : p.$kind === 'default' ? color('bg-primary_hover') : color('bg-secondary_hover'))};
    color: ${(p) => (p.$kind === 'selected' ? color('text-white') : color('text-secondary_hover'))};
    font-weight: 500;
  }
  &:disabled { cursor: default; }
  &:disabled > span { opacity: 0.5; }
  &:focus-visible { outline: none; box-shadow: ${shadow['focus-ring']}; z-index: 1; }
`;
const Days = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 40px);
  row-gap: 4px;
  > em { display: flex; align-items: center; justify-content: center; height: 40px; font-style: normal; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
`;

export type MonthGridProps = {
  month: Date; // 그 달 1일
  selected?: string; // 날짜 하나
  range?: { from: string; to: string }; // 기간(시작 · 끝 = Selected, 사이 = Active)
  min?: string;
  max?: string;
  weekStart?: 'mon' | 'sun'; // 기본 월요일(6차) — 분석 보드 기간 피커만 일요일(기존 배치 유지)
  hideOutside?: boolean; // 앞뒤 달 날짜를 비워 둠(분석 보드 기간 피커) — 기본은 Disabled 모양으로 보임
  onPick: (s: string) => void;
};

export function MonthGrid({ month, selected, range, min, max, weekStart = 'mon', hideOutside = false, onPick }: MonthGridProps) {
  const lead = weekStart === 'sun' ? month.getDay() : (month.getDay() + 6) % 7;
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const today = ymd(TODAY);
  const count = hideOutside ? Math.ceil((lead + last) / 7) * 7 : 42;
  const cells = Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i - lead + 1));
  const ranged = !!range?.from && !!range?.to && range.from !== range.to;
  const weekdays = weekStart === 'sun' ? ['일', ...WEEKDAYS.slice(0, 6)] : WEEKDAYS;
  return (
    <Days role="grid" aria-label={monthLabel(month)}>
      {weekdays.map((w) => (
        <em key={w}>{w}</em>
      ))}
      {cells.map((d, i) => {
        const s = ymd(d);
        const inMonth = d.getMonth() === month.getMonth();
        if (hideOutside && !inMonth) return <Slot key={s} />;
        const disabled = !inMonth || (!!min && s < min) || (!!max && s > max);
        const edge = selected ? s === selected : !!range && (s === range.from || s === range.to);
        const between = inMonth && ranged && s > range!.from && s < range!.to;
        const kind: Kind = inMonth && edge ? 'selected' : between ? 'active' : inMonth && s === today ? 'today' : 'default';
        const col = i % 7;
        const day = d.getDate();
        const left = inMonth && ranged && s > range!.from && s <= range!.to && col !== 0 && day !== 1;
        const right = inMonth && ranged && s >= range!.from && s < range!.to && col !== 6 && day !== last;
        return (
          <Slot key={s}>
            {(left || right) && <i style={{ left: left ? 0 : 20, right: right ? 0 : 20 }} />}
            <Cell type="button" $kind={kind} disabled={disabled} aria-pressed={kind === 'selected'} aria-label={s} onClick={() => onPick(s)}>
              <span>{day}</span>
            </Cell>
          </Slot>
        );
      })}
    </Days>
  );
}

// 달 이동 줄 — `Button utility` 32(아이콘 20) · 가운데 「2026년 8월」 Text sm/SemiBold fg-secondary. hidePrev/hideNext = 두 달 나란히일 때 안쪽 단추 숨김(자리는 유지)
const MonthBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  > b { ${text('text-sm', 'semibold')}; color: ${color('fg-secondary')}; }
  > [data-hidden] { visibility: hidden; }
`;
export function MonthNav({ month, onMove, hidePrev, hideNext, prevDisabled, nextDisabled }: { month: Date; onMove: (n: number) => void; hidePrev?: boolean; hideNext?: boolean; prevDisabled?: boolean; nextDisabled?: boolean }) {
  return (
    <MonthBar>
      <IconButton icon="chevron_left" label="이전 달" data-hidden={hidePrev || undefined} tabIndex={hidePrev ? -1 : undefined} disabled={prevDisabled} onClick={() => onMove(-1)} />
      <b>{monthLabel(month)}</b>
      <IconButton icon="chevron_right" label="다음 달" data-hidden={hideNext || undefined} tabIndex={hideNext ? -1 : undefined} disabled={nextDisabled} onClick={() => onMove(1)} />
    </MonthBar>
  );
}

// ---------- 날짜 하나 — 칸 + `_Date picker menu` Single date ----------
// 칸 = `Input field` sm(36) + 앞 `calendar_month`(fg-tertiary, 6차 §6-2) · 값 2026-10-13 · 열림 = 테두리 2px(입력 칸 포커스와 같음)
const Field = styled.button<{ $placeholder: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 36px;
  padding: 0 11px;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.md}px;
  background: ${color('bg-primary')};
  box-shadow: ${shadow.xs};
  text-align: left;
  cursor: pointer;
  > span { display: inline-flex; color: ${color('fg-tertiary')}; }
  > b { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; ${text('text-sm', 'regular')}; color: ${(p) => (p.$placeholder ? color('text-placeholder') : color('text-primary'))}; }
  &[aria-expanded='true'], &:focus-visible { outline: none; border-color: ${color('border-brand')}; box-shadow: inset 0 0 0 1px ${color('border-brand')}, ${shadow.xs}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
// 좌우 23 = Figma 24 − 테두리 1(Figma 는 선이 자리를 안 차지함) — 날짜 7칸(280)이 딱 맞게
const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 23px;
`;
const Row = styled.div`
  display: flex;
  gap: 12px;
  > :first-of-type { flex: 1; min-width: 0; }
`;
const Bottom = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid ${color('border-secondary')};
  > * { flex: 1; }
`;

type Props = {
  value: string; // 'YYYY-MM-DD' 또는 ''
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  width?: number | string;
  disabled?: boolean;
  ariaLabel?: string;
};

export default function DatePicker({ value, onChange, min, max, placeholder = '날짜 선택', width = '100%', disabled = false, ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState(value);
  const [typed, setTyped] = useState(value);
  const [month, setMonth] = useState(() => firstOfMonth(validYmd(value) ? parseYmd(value) : TODAY));
  const anchor = useRef<HTMLDivElement>(null);
  const allowed = (s: string) => validYmd(s) && (!min || s >= min) && (!max || s <= max);

  const show = () => {
    setPick(value);
    setTyped(value);
    setMonth(firstOfMonth(validYmd(value) ? parseYmd(value) : TODAY));
    setOpen(true);
  };
  const choose = (s: string) => {
    setPick(s);
    setTyped(s);
    setMonth(firstOfMonth(parseYmd(s)));
  };
  const today = ymd(TODAY);

  return (
    <div ref={anchor} style={{ width, flexShrink: 0 }}>
      <Field type="button" $placeholder={!value} disabled={disabled} aria-haspopup="dialog" aria-expanded={open} aria-label={ariaLabel} onClick={() => (open ? setOpen(false) : show())}>
        <span>
          <Icon name="calendar_month" size={16} />
        </span>
        <b>{value || placeholder}</b>
      </Field>
      <Floating anchorRef={anchor} open={open} onClose={() => setOpen(false)} width={328} placement="bottom-start" offset={8} look="calendar">
        <div role="dialog" aria-label="날짜 선택">
          <Body>
            <MonthNav month={month} onMove={(n) => setMonth(addMonths(month, n))} />
            <Row>
              <TextField
                value={typed}
                placeholder="YYYY-MM-DD"
                aria-label="날짜 입력"
                onChange={(e) => {
                  const v = autoDash(e.target.value);
                  setTyped(v);
                  if (allowed(v)) choose(v);
                }}
              />
              <Button disabled={!allowed(today)} onClick={() => choose(today)}>
                오늘
              </Button>
            </Row>
            <MonthGrid month={month} selected={pick} min={min} max={max} onPick={choose} />
          </Body>
          <Bottom>
            <Button full onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button full hierarchy="primary" disabled={!allowed(pick)} onClick={() => { onChange(pick); setOpen(false); }}>
              확인
            </Button>
          </Bottom>
        </div>
      </Floating>
    </div>
  );
}

// ---------- 기간 — `_Date picker menu` Dual dates(308:21686 · 시안 975:44503 · 6차 §6-1) ----------
// 808 = 왼쪽 프리셋 152(오른쪽 선) + 두 달 328 · 328(왼쪽 달 오른쪽 선) / 아래 시작 · 끝 입력(각 최대 200, 사이 「–」) + 취소 · 확인, 위 선.
// 프리셋 = 오늘 · 어제 · 최근 7일 · 30일 · 90일 · 1년(항목 36 · r6 · 선택 = bg-secondary + text-secondary_hover). 고를 수 있는 날 = 1년 전 ~ 오늘(기존 RangePicker 와 같음)
const PRESETS: { label: string; range: () => [Date, Date] }[] = [
  { label: '오늘', range: () => [TODAY, TODAY] },
  { label: '어제', range: () => [addDays(TODAY, -1), addDays(TODAY, -1)] },
  { label: '최근 7일', range: () => [addDays(TODAY, -7), TODAY] },
  { label: '최근 30일', range: () => [addDays(TODAY, -30), TODAY] },
  { label: '최근 90일', range: () => [addDays(TODAY, -90), TODAY] },
  { label: '최근 1년', range: () => [addDays(TODAY, -365), TODAY] },
];
const Dual = styled.div`
  display: flex;
`;
const Presets = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 152px;
  padding: 12px;
  border-right: 1px solid ${color('border-secondary')};
`;
const Preset = styled.button<{ $on: boolean }>`
  width: 100%;
  padding: 8px 12px;
  border: 0;
  border-radius: ${radius.sm}px;
  background: ${(p) => (p.$on ? color('bg-secondary') : 'transparent')};
  ${text('text-sm', 'medium')};
  color: ${(p) => (p.$on ? color('text-secondary_hover') : color('text-secondary'))};
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  &:hover { background: ${(p) => (p.$on ? color('bg-secondary') : color('bg-primary_hover'))}; color: ${color('text-secondary_hover')}; }
  &:focus-visible { outline: none; box-shadow: ${shadow['focus-ring']}; }
`;
const Trailing = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;
const Months = styled.div`
  display: flex;
  > div { display: flex; flex-direction: column; gap: 8px; padding: 20px 23px; }
  > div:first-of-type { width: 328px; border-right: 1px solid ${color('border-secondary')}; }
  > div:last-of-type { flex: 1; min-width: 0; }
`;
const RangeBottom = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid ${color('border-secondary')};
`;
const RangeInputs = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  > label { flex: 1; max-width: 200px; }
  > span { ${text('text-md', 'regular')}; color: ${color('text-quaternary')}; }
  > p { flex-basis: 100%; margin: 0; ${text('text-sm', 'regular')}; color: ${color('text-error-primary')}; }
`;

export function DateRangeMenu({ range, onConfirm, onCancel }: { range: { from: string; to: string }; onConfirm: (r: { from: string; to: string }) => void; onCancel: () => void }) {
  const min = ymd(MIN_DATE);
  const max = ymd(TODAY);
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const [picking, setPicking] = useState(false); // 시작만 고른 상태
  const [fromText, setFromText] = useState(range.from);
  const [toText, setToText] = useState(range.to);
  // 오른쪽 달 = 끝 날짜의 달(오늘 달을 넘지 않음), 왼쪽 = 그 앞 달
  const [right, setRight] = useState(() => firstOfMonth(validYmd(range.to) ? parseYmd(range.to) : TODAY));
  const left = addMonths(right, -1);
  const clamp = (s: string) => (s > max ? max : s < min ? min : s);
  const sync = (f: string, t: string) => {
    setFrom(f);
    setTo(t);
    setFromText(f);
    setToText(t);
  };
  const pick = (s: string) => {
    if (!picking) {
      sync(s, '');
      setPicking(true);
    } else {
      if (s < from) sync(s, from);
      else sync(from, s);
      setPicking(false);
    }
  };
  const errFmt = (fromText.length === 10 && !validYmd(fromText)) || (toText.length === 10 && !validYmd(toText));
  const errOrder = !errFmt && validYmd(fromText) && validYmd(toText) && fromText > toText;
  const incomplete = (fromText.length > 0 && fromText.length < 10) || (toText.length > 0 && toText.length < 10);
  const canConfirm = !!from && !!to && !picking && !errFmt && !errOrder && !incomplete;
  const active = PRESETS.find((p) => {
    const [a, b] = p.range();
    return ymd(a) === from && ymd(b) === to;
  });
  const typed = (which: 'from' | 'to', raw: string) => {
    const v = autoDash(raw);
    (which === 'from' ? setFromText : setToText)(v);
    if (!validYmd(v)) return;
    const c = clamp(v);
    if (which === 'from') { setFrom(c); setFromText(c); } else { setTo(c); setToText(c); setPicking(false); }
  };

  return (
    <Dual role="dialog" aria-label="기간 선택">
      <Presets>
        {PRESETS.map((p) => (
          <Preset
            key={p.label}
            type="button"
            $on={active?.label === p.label}
            onClick={() => {
              const [a, b] = p.range();
              sync(ymd(a), ymd(b));
              setPicking(false);
              setRight(firstOfMonth(b));
            }}
          >
            {p.label}
          </Preset>
        ))}
      </Presets>
      <Trailing>
        <Months>
          <div>
            <MonthNav month={left} hideNext prevDisabled={left <= firstOfMonth(MIN_DATE)} onMove={(n) => setRight(addMonths(right, n))} />
            <MonthGrid month={left} range={{ from, to }} min={min} max={max} onPick={pick} />
          </div>
          <div>
            <MonthNav month={right} hidePrev nextDisabled={right >= firstOfMonth(TODAY)} onMove={(n) => setRight(addMonths(right, n))} />
            <MonthGrid month={right} range={{ from, to }} min={min} max={max} onPick={pick} />
          </div>
        </Months>
        <RangeBottom>
          <RangeInputs>
            <TextField value={fromText} placeholder="YYYY-MM-DD" aria-label="시작일" error={errFmt || errOrder} maxLength={10} onChange={(e) => typed('from', e.target.value)} />
            <span>–</span>
            <TextField value={toText} placeholder="YYYY-MM-DD" aria-label="종료일" error={errFmt || errOrder} maxLength={10} onChange={(e) => typed('to', e.target.value)} />
            {errFmt && <p>날짜 형식이 올바르지 않습니다</p>}
            {errOrder && <p>시작일이 종료일보다 늦을 수 없습니다</p>}
          </RangeInputs>
          <Button onClick={onCancel}>취소</Button>
          <Button hierarchy="primary" disabled={!canConfirm} onClick={() => onConfirm({ from, to })}>
            확인
          </Button>
        </RangeBottom>
      </Trailing>
    </Dual>
  );
}

// ---------- 날짜 + 시 : 분 — 6차 §6-2 「시 · 분은 날짜 칸 옆 따로」(달력 안에 시간 넣지 않음) ----------
// 값 'YYYY-MM-DDTHH:mm'(datetime-local 과 같은 모양) 또는 ''
const TimeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  > span { ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
`;
const two = (s: string, max: number) => String(Math.min(max, Math.max(0, Number(s) || 0))).padStart(2, '0');

export function DateTimePicker({ value, onChange, min, ariaLabel }: { value: string; onChange: (v: string) => void; min?: string; ariaLabel?: string }) {
  const [date = '', time = ''] = value ? value.split('T') : [];
  const [hh = '00', mm = '00'] = time ? time.split(':') : [];
  const emit = (d: string, h: string, m: string) => onChange(`${d || ymd(TODAY)}T${two(h, 23)}:${two(m, 59)}`);
  return (
    <TimeRow>
      <DatePicker width={160} value={date} min={min} ariaLabel={ariaLabel} onChange={(d) => emit(d, hh, mm)} />
      <NumberField width={72} placeholder="Hour" min={0} max={23} value={value ? hh : ''} onChange={(h) => emit(date, h, mm)} ariaLabel="시" />
      <span>:</span>
      <NumberField width={72} placeholder="MM" min={0} max={59} value={value ? mm : ''} onChange={(m) => emit(date, hh, m)} ariaLabel="분" />
    </TimeRow>
  );
}
