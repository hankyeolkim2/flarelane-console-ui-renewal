import { useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import Floating from '@/components/ui/Floating';
import Select from '@/components/ui/Select';
import { addDays, granularityRule, MIN_DATE, parseYmd, presetRange, rangeDays, rangeLabel, TODAY, ymd, type EditorState, type Granularity, type Preset } from '@/lib/editor';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma Toolbar(기간 버튼 · Date presets · 단위 Select) + 스테이징 기간 · 단위 규칙.

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 24px 16px;
  > i { flex: 1; }
`;

const Group = styled.div`
  display: inline-flex;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.md}px;
  overflow: hidden;
  box-shadow: ${shadow.xs};
  > button {
    height: 36px;
    padding: 0 14px;
    border: 0;
    background: ${color('bg-primary')};
    ${text('text-sm', 'semibold')};
    color: ${color('text-secondary')};
    cursor: pointer;
    transition: background-color 0.1s linear;
  }
  > button + button { border-left: 1px solid ${color('border-primary')}; }
  > button:hover, > button[aria-pressed='true'] { background: ${color('bg-primary_hover')}; color: ${color('text-secondary_hover')}; }
`;

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'YESTERDAY', label: '어제' },
  { value: 'TODAY', label: '오늘' },
  { value: 'LAST_7D', label: '7일' },
  { value: 'LAST_30D', label: '30일' },
];

// ── 기간 피커 (범위 달력 + 「기간설정」 프리셋 + 날짜 입력) ──
const Picker = styled.div`
  display: flex;
  flex-direction: column;
`;

const PickerBody = styled.div`
  display: flex;
`;

const Cal = styled.div`
  width: 328px;
  padding: 20px 24px;
  border-right: 1px solid ${color('border-secondary')};
`;

const CalHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  > b { ${text('text-md', 'semibold')}; color: ${color('text-secondary')}; }
  > button { display: inline-flex; width: 32px; height: 32px; align-items: center; justify-content: center; border: 0; border-radius: ${radius.md}px; background: transparent; color: ${color('fg-quaternary')}; cursor: pointer; }
  > button:hover:not(:disabled) { background: ${color('bg-primary_hover')}; }
  > button:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const Days = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 40px);
  row-gap: 4px;
  > span { display: flex; align-items: center; justify-content: center; height: 40px; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
`;

const Day = styled.button<{ edge: boolean; inRange: boolean; today: boolean }>`
  position: relative;
  height: 40px;
  border: 0;
  border-radius: ${(p) => (p.edge ? '9999px' : p.inRange ? '0' : '9999px')};
  background: ${(p) => (p.edge ? color('bg-brand-solid') : p.inRange ? color('bg-secondary') : 'transparent')};
  ${text('text-sm', 'regular')};
  color: ${(p) => (p.edge ? color('text-white') : color('text-secondary'))};
  font-weight: ${(p) => (p.today || p.edge ? 500 : 400)};
  cursor: pointer;
  &:hover:not(:disabled) { ${(p) => (p.edge ? '' : `background: ${color('bg-primary_hover')};`)} }
  &:disabled { color: ${color('text-disabled')}; cursor: not-allowed; }
  ${(p) => (p.today && !p.edge ? `&::after { content: ''; position: absolute; left: 50%; bottom: 6px; width: 5px; height: 5px; margin-left: -2.5px; border-radius: 50%; background: ${color('bg-brand-solid')}; }` : '')}
`;

const Side = styled.div`
  width: 220px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  > div > small { display: block; margin-bottom: 6px; ${text('text-xs', 'medium')}; color: ${color('text-tertiary')}; }
`;

const PresetItem = styled.button<{ $on: boolean }>`
  display: block;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: ${radius.sm}px;
  background: transparent;
  text-align: left;
  ${text('text-sm', 'medium')};
  color: ${(p) => (p.$on ? color('text-brand-secondary') : color('text-secondary'))};
  font-weight: ${(p) => (p.$on ? 600 : 500)};
  cursor: pointer;
  &:hover { background: ${color('bg-primary_hover')}; }
`;

const DateInput = styled.input<{ error: boolean }>`
  width: 100%;
  height: 36px;
  padding: 0 11px;
  border: 1px solid ${(p) => (p.error ? color('border-error') : color('border-primary'))};
  border-radius: ${radius.md}px;
  box-shadow: ${shadow.xs};
  ${text('text-sm', 'regular')};
  color: ${color('text-primary')};
  outline: none;
  &:focus { border-color: ${(p) => (p.error ? color('border-error') : color('border-brand'))}; }
  & + & { margin-top: 6px; }
`;

const Err = styled.p`
  margin: 6px 0 0;
  ${text('text-xs', 'regular')};
  color: ${color('text-error-primary')};
`;

const Foot = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid ${color('border-secondary')};
  > small { flex: 1; ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
`;

const PICKER_PRESETS: { label: string; range: () => [Date, Date] }[] = [
  { label: '오늘', range: () => [TODAY, TODAY] },
  { label: '어제', range: () => [addDays(TODAY, -1), addDays(TODAY, -1)] },
  { label: '최근 7일', range: () => [addDays(TODAY, -7), TODAY] },
  { label: '최근 30일', range: () => [addDays(TODAY, -30), TODAY] },
  { label: '최근 90일', range: () => [addDays(TODAY, -90), TODAY] },
  { label: '최근 1년', range: () => [addDays(TODAY, -365), TODAY] },
];

// 숫자만 입력하면 `-` 자동, 최대 10자
const autoDash = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.length > 6 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}` : d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d;
};
const clampDate = (s: string) => {
  const d = parseYmd(s);
  if (d > TODAY) return ymd(TODAY);
  if (d < MIN_DATE) return ymd(MIN_DATE);
  return s;
};
const validYmd = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseYmd(s).getTime()) && ymd(parseYmd(s)) === s;

function RangePicker({ range, onConfirm, onCancel }: { range: { from: string; to: string }; onConfirm: (r: { from: string; to: string }) => void; onCancel: () => void }) {
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState<string>(range.to);
  const [picking, setPicking] = useState(false); // 시작만 고른 상태
  const [month, setMonth] = useState(() => {
    const d = parseYmd(range.to);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [fromText, setFromText] = useState(range.from);
  const [toText, setToText] = useState(range.to);

  const sync = (f: string, t: string) => {
    setFrom(f);
    setTo(t);
    setFromText(f);
    setToText(t);
  };

  const cells = useMemo(() => {
    const first = new Date(month);
    const start = addDays(first, -first.getDay());
    return Array.from({ length: 42 }, (_, i) => addDays(start, i)).filter((d, i) => i < 35 || d.getMonth() === month.getMonth());
  }, [month]);

  const errFmt = (fromText && !validYmd(fromText) && fromText.length === 10) || (toText && !validYmd(toText) && toText.length === 10);
  const errOrder = !errFmt && validYmd(fromText) && validYmd(toText) && fromText > toText;
  const incomplete = (fromText.length > 0 && fromText.length < 10) || (toText.length > 0 && toText.length < 10);
  const canConfirm = !!from && !!to && !picking && !errFmt && !errOrder && !incomplete;

  const pickDay = (d: Date) => {
    const s = ymd(d);
    if (!picking) {
      sync(s, '');
      setToText('');
      setPicking(true);
    } else {
      if (s < from) sync(s, from);
      else sync(from, s);
      setPicking(false);
    }
  };

  const activePreset = PICKER_PRESETS.find((p) => {
    const [a, b] = p.range();
    return ymd(a) === from && ymd(b) === to;
  });

  return (
    <Picker>
      <PickerBody>
        <Cal>
          <CalHead>
            <button type="button" aria-label="이전 달" disabled={new Date(month.getFullYear(), month.getMonth(), 0) < MIN_DATE} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
              <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}><Icon name="chevron_right" size={20} /></span>
            </button>
            <b>{`${month.getFullYear()}년 ${month.getMonth() + 1}월`}</b>
            <button type="button" aria-label="다음 달" disabled={new Date(month.getFullYear(), month.getMonth() + 1, 1) > TODAY} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
              <Icon name="chevron_right" size={20} />
            </button>
          </CalHead>
          <Days>
            {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
              <span key={d}>{d}</span>
            ))}
            {cells.map((d) => {
              const s = ymd(d);
              const other = d.getMonth() !== month.getMonth();
              const disabled = d > TODAY || d < MIN_DATE;
              const edge = s === from || s === to;
              const inRange = !!from && !!to && s > from && s < to;
              return other ? (
                <span key={s} />
              ) : (
                <Day key={s} type="button" disabled={disabled} edge={edge} inRange={inRange} today={s === ymd(TODAY)} onClick={() => pickDay(d)}>
                  {d.getDate()}
                </Day>
              );
            })}
          </Days>
        </Cal>
        <Side>
          <div>
            <small>기간설정</small>
            {PICKER_PRESETS.map((p) => (
              <PresetItem
                key={p.label}
                type="button"
                $on={activePreset?.label === p.label}
                onClick={() => {
                  const [a, b] = p.range();
                  sync(ymd(a), ymd(b));
                  setPicking(false);
                  setMonth(new Date(b.getFullYear(), b.getMonth(), 1));
                }}
              >
                {p.label}
              </PresetItem>
            ))}
          </div>
          <div>
            <small>날짜</small>
            <DateInput
              error={!!errFmt || errOrder}
              placeholder="yyyy-MM-dd"
              value={fromText}
              maxLength={10}
              onChange={(e) => {
                const v = autoDash(e.target.value);
                setFromText(v);
                if (validYmd(v)) {
                  const c = clampDate(v);
                  setFrom(c);
                  if (c !== v) setFromText(c);
                }
              }}
            />
            <DateInput
              error={!!errFmt || errOrder}
              placeholder="yyyy-MM-dd"
              value={toText}
              maxLength={10}
              onChange={(e) => {
                const v = autoDash(e.target.value);
                setToText(v);
                if (validYmd(v)) {
                  const c = clampDate(v);
                  setTo(c);
                  setPicking(false);
                  if (c !== v) setToText(c);
                }
              }}
            />
            {errFmt && <Err>날짜 형식이 올바르지 않습니다</Err>}
            {errOrder && <Err>시작일이 종료일보다 늦을 수 없습니다</Err>}
          </div>
        </Side>
      </PickerBody>
      <Foot>
        <small>Asia/Seoul</small>
        <Button onClick={onCancel}>취소</Button>
        <Button hierarchy="primary" disabled={!canConfirm} onClick={() => onConfirm({ from, to })}>
          확인
        </Button>
      </Foot>
    </Picker>
  );
}

export default function Toolbar({ state, onRange, onGranularity }: { state: EditorState; onRange: (r: EditorState['range']) => void; onGranularity: (g: Granularity) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const rule = granularityRule(rangeDays(state.range));
  return (
    <Bar>
      <div ref={ref}>
        <Button iconLeading="calendar_today" iconTrailing="keyboard_arrow_down" onClick={() => setOpen((v) => !v)}>
          {rangeLabel(state.range)}
        </Button>
      </div>
      <Floating anchorRef={ref} open={open} width={550} placement="bottom-start" onClose={() => setOpen(false)}>
        <RangePicker
          range={state.range}
          onCancel={() => setOpen(false)}
          onConfirm={(r) => {
            // 피커로 정한 범위는 항상 직접 지정(프리셋 해제)
            onRange({ ...r, preset: null });
            setOpen(false);
          }}
        />
      </Floating>
      <Group role="group" aria-label="기간 프리셋">
        {PRESETS.map((p) => (
          <button key={p.value} type="button" aria-pressed={state.range.preset === p.value} onClick={() => onRange({ ...presetRange(p.value), preset: p.value })}>
            {p.label}
          </button>
        ))}
      </Group>
      <i />
      {state.type === 'INSIGHT' && (
        <Select<Granularity>
          width={96}
          value={state.granularity}
          onChange={onGranularity}
          options={(
            [
              ['HOUR', '시간'],
              ['DAY', '일'],
              ['MONTH', '월'],
            ] as [Granularity, string][]
          )
            .map(([value, label]) => ({ value, label, disabled: !rule.allowed.includes(value) }))}
        />
      )}
    </Bar>
  );
}
