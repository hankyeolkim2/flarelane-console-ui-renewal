import { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from './Button';
import Floating from './Floating';
import NumberField from './NumberField';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 태그 「(기간) ~이후 / ~이전」 값 — 날짜(달력 팝오버) + 시(Hour) : 분(MM) + 브라우저 시간대. 초 · 밀리초 0, ISO 저장(docs 7.4).
const DateBtn = styled.button<{ $placeholder: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 148px;
  height: 36px;
  padding: 0 11px;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.md}px;
  background: ${color('bg-primary')};
  box-shadow: ${shadow.xs};
  cursor: pointer;
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  > b { ${(p) => (p.$placeholder ? text('text-sm', 'regular') : text('text-sm', 'medium'))}; color: ${(p) => (p.$placeholder ? color('text-placeholder') : color('text-primary'))}; }
  &[aria-expanded='true'], &:focus-visible { outline: none; border-color: ${color('border-brand')}; box-shadow: inset 0 0 0 1px ${color('border-brand')}, ${shadow.xs}; }
`;

const Cal = styled.div`
  padding: 16px;
  > header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  > header > b { ${text('text-sm', 'semibold')}; color: ${color('text-secondary')}; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 36px);
  gap: 2px 4px;
  > em { display: flex; align-items: center; justify-content: center; height: 32px; font-style: normal; ${text('text-xs', 'medium')}; color: ${color('text-tertiary')}; }
`;

const Day = styled.button<{ $sel: boolean; $today: boolean; $muted: boolean }>`
  position: relative;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 9999px;
  background: ${(p) => (p.$sel ? color('bg-brand-solid') : 'transparent')};
  ${(p) => (p.$sel || p.$today ? text('text-sm', 'semibold') : text('text-sm', 'regular'))};
  color: ${(p) => (p.$sel ? color('text-white') : p.$muted ? color('text-disabled') : color('text-secondary'))};
  cursor: pointer;
  &:hover { background: ${(p) => (p.$sel ? color('bg-brand-solid_hover') : color('bg-primary_hover'))}; }
  ${(p) => (p.$today && !p.$sel ? `&::after { content: ''; position: absolute; left: 50%; bottom: 4px; width: 4px; height: 4px; margin-left: -2px; border-radius: 9999px; background: ${color('fg-brand-primary')}; }` : '')}
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  > span { ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; white-space: nowrap; }
`;

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
const same = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function DateTimeField({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const d = value ? new Date(value) : null;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => { const b = d ?? new Date(); return new Date(b.getFullYear(), b.getMonth(), 1); });
  const [tz, setTz] = useState('');
  const anchor = useRef<HTMLDivElement>(null);
  useEffect(() => setTz(Intl.DateTimeFormat().resolvedOptions().timeZone), []);

  const set = (next: { day?: Date; h?: string; m?: string }) => {
    const base = next.day ?? d ?? new Date();
    const out = new Date(base.getFullYear(), base.getMonth(), base.getDate(), Number(next.h ?? (d ? d.getHours() : 0)) || 0, Number(next.m ?? (d ? d.getMinutes() : 0)) || 0, 0, 0);
    onChange(out.toISOString());
  };
  const first = view.getDay();
  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: Date[] = [];
  for (let i = 0; i < first; i++) cells.push(new Date(view.getFullYear(), view.getMonth(), i - first + 1));
  for (let i = 1; i <= days; i++) cells.push(new Date(view.getFullYear(), view.getMonth(), i));
  while (cells.length % 7) cells.push(new Date(view.getFullYear(), view.getMonth() + 1, cells.length - first - days + 1));
  const today = new Date();

  return (
    <Row>
      <div ref={anchor}>
        <DateBtn type="button" $placeholder={!d} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <span>
            <Icon name="calendar_today" size={16} />
          </span>
          <b>{d ? fmt(d) : '날짜 선택'}</b>
        </DateBtn>
        <Floating anchorRef={anchor} open={open} onClose={() => setOpen(false)} width={312} placement="bottom-start" offset={8}>
          <Cal>
            <header>
              <Button hierarchy="tertiary" icon="chevron_left" aria-label="이전 달" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} />
              <b>
                {view.getFullYear()}년 {view.getMonth() + 1}월
              </b>
              <Button hierarchy="tertiary" icon="chevron_right" aria-label="다음 달" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} />
            </header>
            <Grid>
              {['일', '월', '화', '수', '목', '금', '토'].map((w) => (
                <em key={w}>{w}</em>
              ))}
              {cells.map((c) => (
                <Day key={c.toISOString()} type="button" $sel={!!d && same(c, d)} $today={same(c, today)} $muted={c.getMonth() !== view.getMonth()} onClick={() => { set({ day: c }); setOpen(false); }}>
                  {c.getDate()}
                </Day>
              ))}
            </Grid>
          </Cal>
        </Floating>
      </div>
      <NumberField width={72} placeholder="Hour" min={0} max={23} value={d ? pad(d.getHours()) : ''} onChange={(h) => set({ h })} ariaLabel="시" />
      <span>:</span>
      <NumberField width={72} placeholder="MM" min={0} max={59} value={d ? pad(d.getMinutes()) : ''} onChange={(m) => set({ m })} ariaLabel="분" />
      <span>{tz}</span>
    </Row>
  );
}
