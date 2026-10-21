import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import DatePicker from './DatePicker';
import NumberField from './NumberField';
import { parseYmd, ymd } from '@/lib/editor';
import { color } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 태그 「(기간) ~이후 / ~이전」 값 — 날짜(DS 달력 `_Date picker menu` Single date) + 시(Hour) : 분(MM) + 브라우저 시간대. 초 · 밀리초 0, ISO 저장(docs 7.4).
const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  > span { ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; white-space: nowrap; }
`;

const pad = (n: number) => String(n).padStart(2, '0');

export default function DateTimeField({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const d = value ? new Date(value) : null;
  const [tz, setTz] = useState('');
  useEffect(() => setTz(Intl.DateTimeFormat().resolvedOptions().timeZone), []);

  const set = (next: { day?: Date; h?: string; m?: string }) => {
    const base = next.day ?? d ?? new Date();
    const out = new Date(base.getFullYear(), base.getMonth(), base.getDate(), Number(next.h ?? (d ? d.getHours() : 0)) || 0, Number(next.m ?? (d ? d.getMinutes() : 0)) || 0, 0, 0);
    onChange(out.toISOString());
  };

  return (
    <Row>
      <DatePicker width={148} value={d ? ymd(d) : ''} onChange={(s) => set({ day: parseYmd(s) })} ariaLabel="날짜" />
      <NumberField width={72} placeholder="Hour" min={0} max={23} value={d ? pad(d.getHours()) : ''} onChange={(h) => set({ h })} ariaLabel="시" />
      <span>:</span>
      <NumberField width={72} placeholder="MM" min={0} max={59} value={d ? pad(d.getMinutes()) : ''} onChange={(m) => set({ m })} ariaLabel="분" />
      <span>{tz}</span>
    </Row>
  );
}
