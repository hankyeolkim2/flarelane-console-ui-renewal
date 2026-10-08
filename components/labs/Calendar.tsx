import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import Floating from '@/components/ui/Floating';
import IconButton from '@/components/ui/IconButton';
import { Dialog } from '@/components/ui/Modal';
import { HoverTip } from '@/components/ui/Tooltip';
import AlimtalkDetail from '@/components/sent/AlimtalkDetail';
import EmailDetail from '@/components/sent/EmailDetail';
import FriendtalkDetail from '@/components/sent/FriendtalkDetail';
import PushDetail from '@/components/sent/PushDetail';
import SmsDetail from '@/components/sent/SmsDetail';
import { Thumb } from '@/components/inapp/Preview';
import { chat, setChat } from '@/lib/chat';
import { inApps, toHtml } from '@/lib/inapp';
import { nextDates, recurringMessages, statusOf } from '@/lib/recurring';
import { isCancelled, scheduled, type ChannelKey } from '@/lib/scheduled';
import { alimtalkMessages, emailMessages, friendtalkMessages, pushMessages, smsMessages } from '@/lib/sent';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 캘린더(실험실) — docs/staging-behavior-labs.md 4장. 스테이징은 FullCalendar, 프로토타입은 같은 동작의 월 · 주 · 일 보기를 직접 그림.
type Cat = 'campaign' | 'scheduled' | 'recurring' | 'reminder' | 'inApp';
type Ev = { id: string; title: string; category: Cat; channel?: ChannelKey; start?: Date; end?: Date; at?: Date; href?: string; description?: string; sessionId?: string; ref?: unknown };
const CAT: Record<Cat, [string, string, string, string]> = {
  campaign: ['일회성 캠페인', '#3A04FF', '#EBE6FF', '#24029E'],
  scheduled: ['예약 캠페인', '#FF007F', '#FFE6F2', '#9E004F'],
  recurring: ['반복 자동화', '#04B69F', '#E6F8F5', '#027163'],
  reminder: ['해야 될 내 작업', '#FE3800', '#FFEBE6', '#9D2300'],
  inApp: ['인앱', '#9B00FF', '#F5E6FF', '#60009E'],
};
const CH: [ChannelKey, string][] = [
  ['push', '푸시'],
  ['alimtalk', '카카오 알림톡'],
  ['friendtalk', '카카오 브랜드메시지'],
  ['sms', '문자'],
  ['email', '이메일'],
];
const CH_NAME = Object.fromEntries(CH) as Record<ChannelKey, string>;
const HOLIDAYS: Record<string, string> = { '2026-09-24': '추석 연휴', '2026-09-25': '추석', '2026-09-26': '추석 연휴', '2026-10-03': '개천절', '2026-10-05': '대체공휴일', '2026-10-09': '한글날', '2026-12-25': '기독탄신일' };
const SKY: [string, string][] = [
  ['맑음', 'sunny'],
  ['구름조금', 'partly_cloudy_day'],
  ['구름많음', 'cloud'],
  ['흐림', 'cloud'],
  ['비', 'rainy'],
];
const TODAY = new Date(2026, 9, 8);
const NOW = new Date(2026, 9, 8, 23, 0);
const KEY = 'flarelane_calendar_hidden_filter';

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dot = (d: Date) => `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
const add = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const same = (a: Date, b: Date) => ymd(a) === ymd(b);
const parse = (s: string) => new Date(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)), Number(s.slice(11, 13) || 0), Number(s.slice(14, 16) || 0));
const sunday = (d: Date) => add(d, -d.getDay());
const ampm = (h: number) => (h === 0 ? '오전 12시' : h < 12 ? `오전 ${h}시` : h === 12 ? '오후 12시' : `오후 ${h - 12}시`);
const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function allEvents(): Ev[] {
  const out: Ev[] = [];
  const sent = { push: pushMessages, alimtalk: alimtalkMessages, friendtalk: friendtalkMessages, sms: smsMessages, email: emailMessages } as const;
  for (const [ch, list] of Object.entries(sent) as [ChannelKey, { id: string; campaignName?: string; title?: string; createdAt: string }[]][])
    for (const m of list) out.push({ id: `c-${m.id}`, title: m.campaignName || m.title || '', category: 'campaign', channel: ch, at: parse(m.createdAt), href: `/${ch}/sent-history/${m.id}`, ref: m });
  for (const ch of CH.map((c) => c[0]))
    for (const s of scheduled[ch] as { id: string; status: string; sendAfter: string; m: { campaignName?: string } }[])
      if (s.status === 'WAITING' && !isCancelled(s.id)) out.push({ id: `s-${s.id}`, title: s.m.campaignName ?? '', category: 'scheduled', channel: ch, at: parse(s.sendAfter), href: `/${ch}/scheduled-messages/${s.id}`, ref: s.m });
  for (const r of recurringMessages)
    if (statusOf(r) === 'active')
      for (const d of nextDates({ ...r.config, start: { type: 'ON_DATE', startDate: '2026.09.01' } }, 60)) out.push({ id: `r-${r.id}-${d.getTime()}`, title: r.m.campaignName ?? '', category: 'recurring', channel: r.ch, at: d, href: `/recurring-messages/${r.ch}/${r.id}`, ref: r.m });
  for (const m of inApps) if (m.start) out.push({ id: `i-${m.id}`, title: m.title, category: 'inApp', start: parse(m.start), end: m.end ? parse(m.end) : add(parse(m.start), 400), href: `/in-app/${m.id}`, ref: m });
  out.push({ id: 'rem-1', title: '주간 성과 리포트 확인', category: 'reminder', at: new Date(2026, 9, 8, 9, 0), description: '지난주 캠페인 성과를 정리하고 다음 주 발송 계획에 반영하기', sessionId: 's-2' });
  out.push({ id: 'rem-2', title: '추석 이후 휴면 유저 리마인드', category: 'reminder', at: new Date(2026, 9, 13, 10, 0), description: '연휴 동안 접속하지 않은 유저에게 보낼 메시지 준비' });
  return out;
}

// ── 스타일
const Wrap = styled.div`
  display: flex;
  height: 100%;
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  box-shadow: ${shadow.xs};
  overflow: hidden;
`;
const Side = styled.aside`
  flex-shrink: 0;
  width: 232px;
  padding: 16px;
  border-right: 1px solid ${color('border-secondary')};
  overflow: auto;
  > b { display: block; margin: 20px 0 8px; ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  > hr { margin: 8px 0; border: 0; border-top: 1px solid ${color('border-secondary')}; }
  > small { display: block; margin-top: 6px; ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
`;
const Mini = styled.div`
  > header { display: flex; align-items: center; ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  > header > span { flex: 1; }
  > div { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-top: 8px; text-align: center; }
  > div > small { ${text('text-xs', 'medium')}; color: ${color('text-quaternary')}; }
  > div > button { height: 26px; border: 0; border-radius: 50%; background: none; ${text('text-xs', 'medium')}; color: ${color('text-secondary')}; cursor: pointer; }
  > div > button[data-out] { color: ${color('text-disabled')}; }
  > div > button[data-sel] { background: ${color('bg-tertiary')}; }
  > div > button[data-today] { background: ${color('bg-brand-solid')}; color: #fff; }
`;
const Check = styled.label<{ $c: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
  cursor: pointer;
  > i { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border: 1.5px solid ${(p) => p.$c}; border-radius: 4px; color: #fff; }
  > i[data-on] { background: ${(p) => p.$c}; }
`;
const Body = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  > header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid ${color('border-secondary')}; }
  > header > h1 { flex: 1; margin: 0 0 0 4px; font-size: 20px; font-weight: 600; color: ${color('text-primary')}; }
`;
const Views = styled.div`
  display: inline-flex;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.md}px;
  overflow: hidden;
  > button { height: 34px; padding: 0 14px; border: 0; border-left: 1px solid ${color('border-primary')}; background: ${color('bg-primary')}; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; cursor: pointer; }
  > button:first-of-type { border-left: 0; }
  > button[aria-pressed='true'] { background: ${color('bg-tertiary')}; font-weight: 700; }
`;
const Month = styled.div`
  flex: 1;
  display: grid;
  grid-template-rows: 28px repeat(6, minmax(0, 1fr));
  min-height: 0;
  > div { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); min-height: 0; }
  > div:first-of-type > span { display: flex; align-items: center; justify-content: center; border-bottom: 1px solid ${color('border-secondary')}; ${text('text-xs', 'semibold')}; color: ${color('text-tertiary')}; }
`;
const Cell = styled.div<{ $out: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 0;
  padding: 4px;
  border-right: 1px solid ${color('border-secondary')};
  border-bottom: 1px solid ${color('border-secondary')};
  background: ${(p) => (p.$out ? color('bg-secondary') : color('bg-primary'))};
  overflow: hidden;
  > header { display: flex; align-items: center; gap: 4px; height: 20px; ${text('text-xs', 'medium')}; color: ${(p) => (p.$out ? color('text-disabled') : color('text-secondary'))}; }
  > header > b { font-weight: 600; }
  > header > b[data-today] { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 4px; border-radius: 10px; background: ${color('bg-brand-solid')}; color: #fff; }
  > header > b[data-holiday] { color: #e5484d; }
  > header > em { margin-left: auto; font-style: normal; font-size: 10px; color: ${color('text-quaternary')}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  > header > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  > button[data-more] { align-self: flex-start; padding: 0 4px; border: 0; background: none; ${text('text-xs', 'semibold')}; color: ${color('text-tertiary')}; cursor: pointer; }
`;
const Bar = styled.button<{ $c: string }>`
  display: block;
  width: 100%;
  min-height: 18px;
  padding: 1px 6px;
  border: 1px solid ${(p) => p.$c};
  border-radius: 4px;
  background: ${(p) => p.$c};
  ${text('text-xs', 'medium')};
  color: #fff;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
`;
const Grid = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  > div[data-head], > div[data-allday] { display: grid; border-bottom: 1px solid ${color('border-secondary')}; }
  > div[data-head] > span { padding: 6px 4px; text-align: center; ${text('text-xs', 'semibold')}; color: ${color('text-tertiary')}; }
  > div[data-allday] > span { display: flex; flex-direction: column; gap: 2px; padding: 4px; border-left: 1px solid ${color('border-secondary')}; }
  > div[data-allday] > span:first-of-type { justify-content: center; border-left: 0; ${text('text-xs', 'medium')}; color: ${color('text-quaternary')}; }
  > div[data-scroll] { flex: 1; overflow: auto; }
`;
const H = 48;

function sky(d: Date) {
  const off = Math.round((d.getTime() - TODAY.getTime()) / 864e5);
  if (off < 0 || off > 9) return null;
  const am = SKY[(off * 3) % SKY.length];
  const pm = SKY[(off * 7 + 1) % SKY.length];
  const t = 12 + ((off * 5) % 8);
  return { am, pm, tip: `오전 ${am[0]} ${t - 6}~${t}°\n오후 ${pm[0]} ${t - 2}~${t + 4}°${pm[0] === '비' ? ' 강수 3mm' : ''}\n서울특별시` };
}

export default function Calendar() {
  const router = useRouter();
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [cur, setCur] = useState(TODAY);
  const [mini, setMini] = useState(new Date(2026, 9, 1));
  const [hidden, setHidden] = useState<{ categories: string[]; channels: string[]; overlays: string[] }>({ categories: [], channels: [], overlays: [] });
  const [pop, setPop] = useState<{ e: Ev; el: HTMLElement } | null>(null);
  const [more, setMore] = useState<{ d: Date; el: HTMLElement } | null>(null);
  const [modal, setModal] = useState<Ev | null>(null);
  const popRef = useRef<HTMLElement | null>(null);
  const moreRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v) setHidden(JSON.parse(v));
    } catch {
      /* 무시 */
    }
  }, []);
  const save = (h: typeof hidden) => {
    setHidden(h);
    try {
      localStorage.setItem(KEY, JSON.stringify(h));
    } catch {
      /* 무시 */
    }
  };
  const toggle = (k: 'categories' | 'channels', v: string) => save({ ...hidden, [k]: hidden[k].includes(v) ? hidden[k].filter((x) => x !== v) : [...hidden[k], v] });
  const overlay = (v: string) => save({ ...hidden, overlays: hidden.overlays.includes(v) ? hidden.overlays.filter((x) => x !== v) : [...hidden.overlays, v] });
  const all = useMemo(allEvents, []);
  const noChannel = CH.every(([c]) => hidden.channels.includes(c));
  const events = all.filter((e) => !hidden.categories.includes(e.category) && (!e.channel || !hidden.channels.includes(e.channel)) && !(noChannel && ['campaign', 'scheduled', 'recurring'].includes(e.category)));
  const on = (d: Date) => events.filter((e) => (e.at ? same(e.at, d) : e.start && e.end && ymd(e.start) <= ymd(d) && ymd(d) <= ymd(e.end))).sort((a, b) => ((a.at?.getTime() ?? 0) < (b.at?.getTime() ?? 0) ? -1 : 1));
  const holiday = (d: Date) => (hidden.overlays.includes('holidays') ? HOLIDAYS[ymd(d)] : undefined);
  const weather = (d: Date) => (hidden.overlays.includes('weather') ? sky(d) : null);

  const days = view === 'month' ? Array.from({ length: 42 }, (_, i) => add(sunday(new Date(cur.getFullYear(), cur.getMonth(), 1)), i)) : view === 'week' ? Array.from({ length: 7 }, (_, i) => add(sunday(cur), i)) : [cur];
  const title = view === 'month' ? `${cur.getFullYear()}년 ${cur.getMonth() + 1}월` : view === 'week' ? `${days[0].getFullYear()}년 ${days[0].getMonth() + 1}월 ${days[0].getDate()}일 – ${days[6].getMonth() !== days[0].getMonth() ? `${days[6].getMonth() + 1}월 ` : ''}${days[6].getDate()}일` : `${cur.getFullYear()}년 ${cur.getMonth() + 1}월 ${cur.getDate()}일`;
  const move = (n: number) => {
    const d = view === 'month' ? new Date(cur.getFullYear(), cur.getMonth() + n, 1) : add(cur, n * (view === 'week' ? 7 : 1));
    setCur(d);
    setMini(new Date(d.getFullYear(), d.getMonth(), 1));
  };
  const open = (e: Ev, el: HTMLElement) => {
    setMore(null);
    if (e.category === 'reminder') {
      popRef.current = el;
      setPop({ e, el });
    } else setModal(e);
  };
  const bar = (e: Ev, d?: Date) => (
    <Bar key={e.id} type="button" $c={CAT[e.category][1]} title={e.title || '(제목 없음)'} onClick={(ev) => open(e, ev.currentTarget)}>
      {e.at && view === 'month' ? `${hm(e.at)} ` : ''}
      {e.start && d && !same(e.start, d) && d.getDay() !== 0 ? '' : e.title || '(제목 없음)'}
    </Bar>
  );
  const dayHead = (d: Date): ReactNode => {
    const w = weather(d);
    return (
      <>
        {w && (
          <HoverTip content={<span style={{ whiteSpace: 'pre-line' }}>{w.tip}</span>}>
            <span>
              <Icon name={w.am[1]} size={12} />
              <Icon name={w.pm[1]} size={12} />
            </span>
          </HoverTip>
        )}
      </>
    );
  };

  const miniDays = Array.from({ length: 42 }, (_, i) => add(sunday(mini), i));
  const checks: ([string, string, boolean, () => void] | null)[] = [
    ['해야 될 내 작업', CAT.reminder[1], !hidden.categories.includes('reminder'), () => toggle('categories', 'reminder')],
    null,
    ...(['campaign', 'scheduled', 'recurring'] as Cat[]).map((c): [string, string, boolean, () => void] => [CAT[c][0], CAT[c][1], !hidden.categories.includes(c), () => toggle('categories', c)]),
    null,
    ...CH.map(([c, l]): [string, string, boolean, () => void] => [l, '#414651', !hidden.channels.includes(c), () => toggle('channels', c)]),
    ['인앱', CAT.inApp[1], !hidden.categories.includes('inApp'), () => toggle('categories', 'inApp')],
    null,
    ['공휴일', '#E5484D', hidden.overlays.includes('holidays'), () => overlay('holidays')],
    ['날씨(예보)', '#414651', hidden.overlays.includes('weather'), () => overlay('weather')],
  ];

  return (
    <Wrap>
      <Side>
        <Mini>
          <header>
            <span>{`${mini.getFullYear()}년 ${mini.getMonth() + 1}월`}</span>
            <IconButton icon="chevron_left" size="xs" label="이전" onClick={() => setMini(new Date(mini.getFullYear(), mini.getMonth() - 1, 1))} />
            <IconButton icon="chevron_right" size="xs" label="다음" onClick={() => setMini(new Date(mini.getFullYear(), mini.getMonth() + 1, 1))} />
          </header>
          <div>
            {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
              <small key={d}>{d}</small>
            ))}
            {miniDays.map((d) => (
              <button key={ymd(d)} type="button" data-out={d.getMonth() !== mini.getMonth() ? '' : undefined} data-today={same(d, TODAY) ? '' : undefined} data-sel={same(d, cur) ? '' : undefined} onClick={() => setCur(d)}>
                {d.getDate()}
              </button>
            ))}
          </div>
        </Mini>
        <b>표시 항목</b>
        {checks.map((c, i) =>
          c === null ? (
            <hr key={i} />
          ) : (
            <Check key={c[0]} $c={c[1]} onClick={c[3]}>
              <i data-on={c[2] ? '' : undefined}>{c[2] && <Icon name="check" size={12} />}</i>
              {c[0]}
            </Check>
          ),
        )}
      </Side>
      <Body>
        <header>
          <Button onClick={() => (setCur(TODAY), setMini(new Date(2026, 9, 1)))}>오늘</Button>
          <IconButton icon="chevron_left" label="이전" onClick={() => move(-1)} />
          <IconButton icon="chevron_right" label="다음" onClick={() => move(1)} />
          <h1>{title}</h1>
          <Views>
            {(
              [
                ['month', '월'],
                ['week', '주'],
                ['day', '일'],
              ] as const
            ).map(([v, l]) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
                {l}
              </button>
            ))}
          </Views>
        </header>
        {view === 'month' ? (
          <Month>
            <div>
              {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            {Array.from({ length: 6 }, (_, w) => (
              <div key={w}>
                {days.slice(w * 7, w * 7 + 7).map((d) => {
                  const list = on(d);
                  const hol = holiday(d);
                  return (
                    <Cell key={ymd(d)} $out={d.getMonth() !== cur.getMonth()}>
                      <header>
                        <b data-today={same(d, TODAY) ? '' : undefined} data-holiday={hol ? '' : undefined}>
                          {d.getDate() === 1 ? `${d.getMonth() + 1}월 ${d.getDate()}일` : d.getDate()}
                        </b>
                        {dayHead(d)}
                        {hol && <em title={hol}>{hol}</em>}
                      </header>
                      {list.slice(0, 3).map((e) => bar(e, d))}
                      {list.length > 3 && (
                        <button
                          type="button"
                          data-more=""
                          onClick={(ev) => {
                            moreRef.current = ev.currentTarget;
                            setMore({ d, el: ev.currentTarget });
                          }}
                        >{`+${list.length - 3}개`}</button>
                      )}
                    </Cell>
                  );
                })}
              </div>
            ))}
          </Month>
        ) : (
          <Grid>
            <div data-head="" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0,1fr))` }}>
              <span />
              {days.map((d) => (
                <span key={ymd(d)} style={same(d, TODAY) ? { color: 'var(--text-brand-secondary)' } : undefined}>
                  {`${d.getMonth() + 1}. ${d.getDate()}. (${'일월화수목금토'[d.getDay()]})`}
                  {holiday(d) && <em style={{ display: 'block', fontStyle: 'normal', fontSize: 10, color: '#e5484d' }}>{holiday(d)}</em>}
                  <span style={{ display: 'inline-flex', marginLeft: 4, color: 'var(--fg-quaternary)' }}>{dayHead(d)}</span>
                </span>
              ))}
            </div>
            <div data-allday="" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0,1fr))` }}>
              <span>종일</span>
              {days.map((d) => (
                <span key={ymd(d)}>{on(d).filter((e) => !e.at).map((e) => bar(e, d))}</span>
              ))}
            </div>
            <div data-scroll="" ref={(el) => {
              if (el && el.scrollTop === 0) el.scrollTop = H * 8;
            }}>
              <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: `56px repeat(${days.length}, minmax(0,1fr))` }}>
                <div>
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} style={{ height: H, paddingRight: 6, textAlign: 'right', fontSize: 11, color: 'var(--text-quaternary)', transform: 'translateY(-6px)' }}>
                      {h ? ampm(h) : ''}
                    </div>
                  ))}
                </div>
                {days.map((d) => {
                  const list = on(d).filter((e) => e.at);
                  return (
                    <div key={ymd(d)} style={{ position: 'relative', borderLeft: '1px solid var(--border-secondary)', background: `repeating-linear-gradient(to bottom, transparent 0, transparent ${H - 1}px, var(--border-secondary) ${H - 1}px, var(--border-secondary) ${H}px)` }}>
                      {list.map((e, i) => {
                        const top = (e.at!.getHours() * 60 + e.at!.getMinutes()) * (H / 60);
                        const lane = list.filter((x, j) => j < i && Math.abs(x.at!.getTime() - e.at!.getTime()) < 36e5).length;
                        return (
                          <div key={e.id} style={{ position: 'absolute', top, left: 2 + lane * 18, right: 2, height: H / 2 - 2 }}>
                            <Bar type="button" $c={CAT[e.category][1]} style={{ height: '100%' }} onClick={(ev) => open(e, ev.currentTarget)}>
                              {`${hm(e.at!)} ${e.title || '(제목 없음)'}`}
                            </Bar>
                          </div>
                        );
                      })}
                      {same(d, NOW) && <i style={{ position: 'absolute', left: 0, right: 0, top: (NOW.getHours() * 60 + NOW.getMinutes()) * (H / 60), height: 2, background: '#e5484d' }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </Grid>
        )}
      </Body>
      <Floating anchorRef={moreRef} open={!!more} onClose={() => setMore(null)} width={240} offset={4}>
        {more && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 10 }}>
            <b style={{ fontSize: 13 }}>{`${more.d.getMonth() + 1}월 ${more.d.getDate()}일`}</b>
            {on(more.d).map((e) => bar(e, more.d))}
          </div>
        )}
      </Floating>
      <Floating anchorRef={popRef} open={!!pop} onClose={() => setPop(null)} width={300} offset={4}>
        {pop && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ padding: '2px 8px', borderRadius: 999, border: `1px solid ${CAT.reminder[1]}`, background: CAT.reminder[2], color: CAT.reminder[3], fontSize: 12, fontWeight: 600 }}>{CAT.reminder[0]}</span>
              <i style={{ flex: 1 }} />
              {pop.e.sessionId && chat.sessions.some((s) => s.id === pop.e.sessionId) && (
                <IconButton
                  icon="forum"
                  size="xs"
                  label="대화 열기"
                  onClick={() => {
                    setChat({ launcher: true, open: true, exp: false, sid: pop.e.sessionId! });
                    setPop(null);
                  }}
                />
              )}
              {pop.e.href && <IconButton icon="open_in_new" size="xs" label="상세 보기" onClick={() => router.push(pop.e.href!)} />}
            </div>
            <b style={{ fontSize: 14 }}>{pop.e.title}</b>
            {pop.e.description && <p style={{ margin: 0, maxHeight: 200, overflow: 'auto', fontSize: 13, color: 'var(--text-secondary)' }}>{pop.e.description}</p>}
            <small style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{`${dot(pop.e.at!)} ${hm(pop.e.at!)}`}</small>
          </div>
        )}
      </Floating>
      {modal && <EventModal e={modal} onClose={() => setModal(null)} />}
    </Wrap>
  );
}

const Embed = styled.div`
  & > :first-of-type { display: none; }
  & button { pointer-events: none; }
  & [data-detail-section] button, & a { pointer-events: auto; }
`;

function EventModal({ e, onClose }: { e: Ev; onClose: () => void }) {
  const router = useRouter();
  const [, , bg, fg] = CAT[e.category];
  const m = e.ref as never;
  let body: ReactNode = null;
  if (e.category === 'inApp') {
    const iam = e.ref as (typeof inApps)[number];
    body = (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 24 }}>
        <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 12, fontSize: 14 }}>
          <dt style={{ color: 'var(--text-tertiary)' }}>캠페인 명</dt>
          <dd style={{ margin: 0 }}>{iam.title}</dd>
          <dt style={{ color: 'var(--text-tertiary)' }}>노출 시점</dt>
          <dd style={{ margin: 0 }}>{iam.group}</dd>
          <dt style={{ color: 'var(--text-tertiary)' }}>노출 기간</dt>
          <dd style={{ margin: 0 }}>{`${iam.start ? iam.start.slice(0, 10) : '시작일 없음'} - ${iam.end ? iam.end.slice(0, 10) : '종료일 없음'}`}</dd>
        </dl>
        <div>
          <small style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>미리보기</small>
          <Thumb html={toHtml(iam.model)} size={320} />
        </div>
      </div>
    );
  } else if (e.channel) {
    const D = { push: PushDetail, alimtalk: AlimtalkDetail, friendtalk: FriendtalkDetail, sms: SmsDetail, email: EmailDetail }[e.channel] as (p: { m: never }) => ReactNode;
    body = (
      <Embed>
        <D m={m} />
      </Embed>
    );
  }
  return (
    <Dialog
      title={e.title || '(제목 없음)'}
      width={1080}
      onClose={onClose}
      actions={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ padding: '2px 8px', borderRadius: 999, border: `1px solid ${CAT[e.category][1]}`, background: bg, color: fg, fontSize: 12, fontWeight: 600 }}>{CAT[e.category][0]}</span>
          {e.channel && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{CH_NAME[e.channel]}</span>}
          {e.href && <IconButton icon="open_in_new" label="페이지에서 열기" onClick={() => router.push(e.href!)} />}
        </span>
      }
    >
      <div style={{ maxHeight: 'calc(100vh - 220px)', overflow: 'auto' }}>{body}</div>
    </Dialog>
  );
}
