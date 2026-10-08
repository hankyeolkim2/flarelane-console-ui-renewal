// 반복 발송 메시지 더미 — docs/staging-behavior-scheduled-recurring.md 4~5장. 앞쪽은 Figma 목록(1086:50995, 스테이징 실데이터) 그대로.
import { alimtalkMessages, emailMessages, friendtalkMessages, pushMessages, smsMessages, type AlimtalkMessage, type EmailMessage, type FriendtalkMessage, type PushMessage, type SmsMessage } from './sent';
import type { ChannelKey } from './scheduled';

export type RecurringConfig = {
  periodic: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  hour: number;
  minute: number;
  weekdays?: ('MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN')[];
  daysOfMonth?: number[];
  timeZone: string;
  start: { type: 'NOW' | 'ON_DATE'; startDate?: string };
  end: { type: 'NEVER' | 'ON_DATE'; endDate?: string };
};
export type RecurringStatus = 'active' | 'paused' | 'draft' | 'archived';
type AnyMsg = PushMessage | AlimtalkMessage | FriendtalkMessage | SmsMessage | EmailMessage;
export type Recurring = {
  id: string;
  ch: ChannelKey;
  active: boolean;
  lastActivatedAt?: string;
  archivedAt?: string;
  nextRunAt?: string;
  createdAt: string;
  config: RecurringConfig;
  m: AnyMsg;
  history: string[]; // 회차별 보낸 메시지 id
};

export const CHANNEL_LABEL: Record<ChannelKey, string> = { push: '푸시 알림', sms: '문자', alimtalk: '카카오 알림톡', friendtalk: '카카오 브랜드메시지', email: '이메일' };
export const CHANNEL_ORDER: ChannelKey[] = ['push', 'sms', 'alimtalk', 'friendtalk', 'email'];

export const statusOf = (r: Pick<Recurring, 'active' | 'lastActivatedAt' | 'archivedAt'>): RecurringStatus => (r.active ? 'active' : !r.lastActivatedAt ? 'draft' : r.archivedAt ? 'archived' : 'paused');
export const STATUS_LABEL: Record<RecurringStatus, string> = { active: '활성화', paused: '일시중지', draft: '임시저장', archived: '아카이브됨' };

const SRC: Record<ChannelKey, AnyMsg[]> = { push: pushMessages, alimtalk: alimtalkMessages, friendtalk: friendtalkMessages, sms: smsMessages, email: emailMessages };
const daily = (hour: number, minute: number, tz = 'Asia/Seoul', end?: string): RecurringConfig => ({ periodic: 'DAILY', hour, minute, timeZone: tz, start: { type: 'ON_DATE', startDate: '2026.03.01' }, end: end ? { type: 'ON_DATE', endDate: end } : { type: 'NEVER' } });

// [채널, 캠페인명, 생성, 상태, 설정]
const SEED: [ChannelKey, string, string, RecurringStatus, RecurringConfig][] = [
  ['sms', '반복발송도 잘나오는지 확인', '2026.05.11 17:56:30', 'paused', daily(18, 0, 'Asia/Seoul', '2026.05.12')],
  ['push', 'recurring', '2026.04.30 11:35:48', 'paused', daily(11, 40)],
  ['email', 'recurring', '2026.03.17 19:47:31', 'paused', daily(19, 48)],
  ['alimtalk', 'test 아이템 리스트 복합형 테스트', '2026.03.09 12:24:33', 'paused', daily(12, 30)],
  ['friendtalk', 'soob multi conversion test', '2025.10.27 10:10:02', 'paused', daily(10, 12)],
  ['email', 'ff', '2026.03.18 11:58:44', 'paused', daily(11, 58, 'Asia/Taipei')],
  ['email', '주간 뉴스레터', '2026.02.02 09:00:00', 'active', { ...daily(9, 0), periodic: 'WEEKLY', weekdays: ['MON', 'WED', 'FRI'] }],
  ['email', '[만료] 봄 시즌 안내', '2026.04.01 10:00:00', 'active', daily(10, 0, 'Asia/Seoul', '2026.05.13')],
  ['push', '월초 혜택 알림', '2026.01.20 14:00:00', 'draft', { ...daily(10, 0), periodic: 'MONTHLY', daysOfMonth: [1, 15] }],
  ['sms', '배송 지연 안내', '2026.06.03 16:20:11', 'draft', daily(16, 30)],
  ['alimtalk', '회원가입 감사 알림', '2026.06.11 08:40:00', 'draft', daily(8, 45)],
  ['friendtalk', '주말 특가', '2026.07.01 11:00:00', 'draft', { ...daily(11, 0), periodic: 'WEEKLY', weekdays: ['SAT'] }],
  ['push', '구독 연장 리마인드', '2025.12.01 09:30:00', 'archived', daily(9, 30)],
  ['sms', '연말 이벤트', '2025.12.10 12:00:00', 'archived', daily(12, 0, 'Asia/Seoul', '2025.12.31')],
  ['email', '휴면 안내', '2025.11.02 10:00:00', 'archived', { ...daily(10, 0), periodic: 'MONTHLY', daysOfMonth: [1] }],
];

export const recurringMessages: Recurring[] = SEED.map(([ch, name, createdAt, st, config], i) => {
  const src = SRC[ch];
  const base = src[i % src.length];
  const m = { ...base, id: `rec-${ch}-${i}`, campaignName: name, source: 'system' as const, createdAt };
  const expired = config.end.type === 'ON_DATE' && (config.end.endDate ?? '') < '2026.10.08';
  return {
    id: `rec-${ch}-${i}`,
    ch,
    active: st === 'active',
    lastActivatedAt: st === 'draft' ? undefined : '2026.05.01 00:00:00',
    archivedAt: st === 'archived' ? '2026.06.30 18:00:00' : undefined,
    nextRunAt: st === 'active' && !expired ? `2026.10.09 ${String(config.hour).padStart(2, '0')}:${String(config.minute).padStart(2, '0')}:00` : undefined,
    createdAt,
    config,
    m: m as AnyMsg,
    history: st === 'draft' ? [] : src.slice(0, 2 + (i % 6)).map((x) => x.id),
  };
});

// ── 문구 (docs 4.6)
const WD = { MON: '월', TUE: '화', WED: '수', THU: '목', FRI: '금', SAT: '토', SUN: '일' } as const;
const WD_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
const pad = (n: number) => String(n).padStart(2, '0');
export const periodText = (c: RecurringConfig) => {
  const t = `${pad(c.hour)}:${pad(c.minute)}`;
  if (c.periodic === 'WEEKLY') return `매주 ${WD_ORDER.filter((d) => c.weekdays?.includes(d)).map((d) => WD[d]).join(', ')}요일 ${t}`;
  if (c.periodic === 'MONTHLY') return `매월 ${[...(c.daysOfMonth ?? [])].sort((a, b) => a - b).join(', ')}일 ${t}`;
  return `매일 ${t}`;
};
const OFFSET: Record<string, string> = { 'Asia/Seoul': '+09:00', 'Asia/Taipei': '+08:00', 'Asia/Tokyo': '+09:00' };
export const gmt = (tz: string) => `(GMT${OFFSET[tz] ?? '+00:00'}) ${tz}`;
export const startText = (c: RecurringConfig) => (c.start.type === 'ON_DATE' ? c.start.startDate ?? '-' : '지금부터');
export const endText = (c: RecurringConfig) => (c.end.type === 'ON_DATE' ? c.end.endDate ?? '-' : '무기한');

// 다음 발송 예정일 n개 (모달 · 활성화 확인) — 프로토타입 기준일 2026.10.08
export function nextDates(c: RecurringConfig, n: number): Date[] {
  const out: Date[] = [];
  const d = new Date(2026, 9, 8, c.hour, c.minute);
  const end = c.end.type === 'ON_DATE' && c.end.endDate ? new Date(c.end.endDate.replace(/\./g, '-') + 'T23:59:59') : null;
  for (let i = 0; i < 400 && out.length < n; i++) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i, c.hour, c.minute);
    if (i === 0 && x <= new Date(2026, 9, 8, 23, 0)) continue;
    if (end && x > end) break;
    const wd = WD_ORDER[(x.getDay() + 6) % 7];
    if (c.periodic === 'WEEKLY' && !c.weekdays?.includes(wd)) continue;
    if (c.periodic === 'MONTHLY' && !c.daysOfMonth?.includes(x.getDate())) continue;
    out.push(x);
  }
  return out;
}

// 상태 변경 · 삭제 — 화면을 옮겨 다녀도 유지되는 모듈 상태
const listeners = new Set<() => void>();
export const subscribeRecurring = (f: () => void) => {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
};
const emit = () => listeners.forEach((f) => f());
export const setRecurringStatus = (id: string, s: 'active' | 'pause' | 'archive') => {
  const r = recurringMessages.find((x) => x.id === id);
  if (!r) return;
  if (s === 'active') {
    r.active = true;
    r.lastActivatedAt = '2026.10.08 23:00:00';
    r.archivedAt = undefined;
    const nd = nextDates(r.config, 1)[0];
    r.nextRunAt = nd ? `${nd.getFullYear()}.${pad(nd.getMonth() + 1)}.${pad(nd.getDate())} ${pad(nd.getHours())}:${pad(nd.getMinutes())}:00` : undefined;
  } else if (s === 'pause') {
    r.active = false;
    r.archivedAt = undefined;
    r.nextRunAt = undefined;
  } else {
    r.active = false;
    r.archivedAt = '2026.10.08 23:00:00';
  }
  emit();
};
export const deleteRecurring = (id: string) => {
  const i = recurringMessages.findIndex((x) => x.id === id);
  if (i >= 0) recurringMessages.splice(i, 1);
  emit();
};
export const fmtDate = (d: Date) => `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
export const fmtTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
