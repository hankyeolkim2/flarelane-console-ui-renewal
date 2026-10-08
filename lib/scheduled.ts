// 예약된 메시지 더미 — 발송 완료 건은 보낸 메시지와 같은 id(행을 누르면 보낸 메시지 상세로 감), 대기 중 · 실패는 따로.
// 스테이징(10-07): 대기 중은 5채널 모두 0건이었으나 흐름을 보려고 몇 건 넣음(Figma 「대기 중 탭 · 행 메뉴 열림」 1230:4393 처럼).
import { alimtalkMessages, emailMessages, friendtalkMessages, pushMessages, smsMessages, type AlimtalkMessage, type EmailMessage, type FriendtalkMessage, type PushMessage, type SmsMessage } from './sent';

export type ScheduleStatus = 'WAITING' | 'STARTED' | 'REQUESTED' | 'FAILED';
export const SCHEDULE_STATUSES: ScheduleStatus[] = ['WAITING', 'STARTED', 'REQUESTED', 'FAILED'];
export type Scheduled<T> = { id: string; status: ScheduleStatus; sendAfter: string; m: T };
export type ChannelKey = 'push' | 'alimtalk' | 'friendtalk' | 'sms' | 'email';

const toMinute = (s: string) => `${s.slice(0, 16)}:00`;

function build<T extends { id: string; createdAt: string }>(sent: T[], prefix: string, pending: number, failed: number, zero: (m: T) => T): Scheduled<T>[] {
  const done = sent.filter((_, i) => i % 3 !== 1).map((m) => ({ id: m.id, status: 'REQUESTED' as const, sendAfter: toMinute(m.createdAt), m }));
  const pend = sent.slice(0, pending).map((m, i) => {
    const d = `2026.10.${String(14 + i * 3).padStart(2, '0')} 17:${String(9 + i * 10).padStart(2, '0')}:00`;
    return { id: `${prefix}-pending-${i}`, status: 'WAITING' as const, sendAfter: d, m: { ...zero(m), id: `${prefix}-pending-${i}`, createdAt: d } };
  });
  const fail = sent.slice(2, 2 + failed).map((m, i) => ({ id: `${prefix}-failed-${i}`, status: 'FAILED' as const, sendAfter: toMinute(m.createdAt), m: { ...zero(m), id: `${prefix}-failed-${i}` } }));
  return [...pend, ...done, ...fail];
}

const zeroPush = (m: PushMessage): PushMessage => ({
  ...m,
  stats: Object.fromEntries(Object.keys(m.stats).map((k) => [k, { sent: 0, clicked: 0, remaining: 0, uninstalled: 0, capped: 0, failed: 0, conversions: 0, amount: 0 }])) as PushMessage['stats'],
  failure: {},
  conversions: m.conversions.map((c) => ({ ...c, converted: 0, candidate: 0, amount: 0 })),
});
const zeroKakao = <T extends AlimtalkMessage | FriendtalkMessage | SmsMessage>(m: T): T => ({ ...m, selected: 0, sent: 0, failed: 0, capped: 0, unsubscribed: 0, usedPoints: 0, convertedUniqueUser: 0, failure: {}, conversions: m.conversions.map((c) => ({ ...c, converted: 0, candidate: 0, amount: 0 })) });
const zeroEmail = (m: EmailMessage): EmailMessage => ({ ...m, delivered: 0, opened: 0, failed: 0, aborted: 0, softBounced: 0, converted: 0, conversions: m.conversions.map((c) => ({ ...c, converted: 0, candidate: 0 })) });

export const scheduled = {
  push: build(pushMessages, 'push', 1, 3, zeroPush),
  alimtalk: build(alimtalkMessages, 'alimtalk', 0, 2, zeroKakao),
  friendtalk: build(friendtalkMessages, 'friendtalk', 0, 0, zeroKakao),
  sms: build(smsMessages, 'sms', 1, 5, zeroKakao),
  email: build(emailMessages, 'email', 0, 0, zeroEmail),
};

// 예약 취소 · 재시도 — 화면을 옮겨 다녀도 유지되도록 모듈 상태로 둠
const cancelled = new Set<string>();
const listeners = new Set<() => void>();
export const cancelSchedule = (id: string) => {
  cancelled.add(id);
  listeners.forEach((f) => f());
};
export const isCancelled = (id: string) => cancelled.has(id);
export const subscribeSchedule = (f: () => void) => {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
};
export const findScheduled = (ch: ChannelKey, id: string) => (scheduled[ch] as Scheduled<{ id: string }>[]).find((x) => x.id === id && !cancelled.has(x.id));
