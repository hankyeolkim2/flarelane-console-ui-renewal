import { useEffect, useReducer, useState } from 'react';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import { CountTabs } from '@/components/ui/Tabs';
import TextField from '@/components/ui/TextField';
import { EmptyList, ListCard, PageTitle, SentRow, StatusLead, type RowMenuItem } from './SentList';
import { rowOf } from './rows';
import { MAX_PAGES, PER, PLATFORMS, type PushMessage } from '@/lib/sent';
import { cancelSchedule, isCancelled, scheduled, SCHEDULE_STATUSES, subscribeSchedule, type ChannelKey, type Scheduled, type ScheduleStatus } from '@/lib/scheduled';
import { useStore } from '@/lib/store';

// 예약된 메시지 목록(5채널 공용) — Figma 「푸시 알림 — 예약된 메시지 (발송 완료 탭)」(1098:3434) 모양 + docs/staging-behavior-scheduled-recurring.md 1장.
// 쿼리 p · st(기본 WAITING) · sk. 탭을 바꾸면 검색어를 버림. 행 표지 = 상태 점 + 글(A안), 출처 배지는 글 맨 위.
const LABEL: Record<ScheduleStatus, string> = { WAITING: '대기 중', STARTED: '발송 중', REQUESTED: '발송 완료', FAILED: '실패' };
const TONE: Record<ScheduleStatus, 'warning' | 'brand' | 'success' | 'error'> = { WAITING: 'warning', STARTED: 'brand', REQUESTED: 'success', FAILED: 'error' };
const NOW = new Date('2026-10-08T23:00:00');
const parse = (s: string) => new Date(s.replace(/\./g, '-').replace(' ', 'T'));

type Item = Scheduled<{ id: string; source: Parameters<typeof SentRow>[0]['source']; campaignName?: string; createdAt: string }>;

const searchFields = (it: Item) => {
  const m = it.m as unknown as Record<string, unknown>;
  return [it.id, m.campaignName, m.title, m.body, m.text, m.templateName, m.templateContent].filter((x): x is string => typeof x === 'string');
};
const selectedOf = (ch: ChannelKey, it: Item) => (ch === 'push' ? PLATFORMS.reduce((a, p) => a + (it.m as unknown as PushMessage).stats[p].sent, 0) : ((it.m as unknown as { selected?: number }).selected ?? 0));

export default function ScheduledList({ ch }: { ch: ChannelKey }) {
  const router = useRouter();
  const { toast } = useStore();
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => subscribeSchedule(rerender), []);
  const { p, st, sk } = router.query as Record<string, string | undefined>;
  const page = Number(p ?? NaN);
  const status = (st ?? 'WAITING') as ScheduleStatus;
  const keyword = sk ?? '';
  const [input, setInput] = useState(keyword);
  const [cancel, setCancel] = useState<string | null>(null);
  useEffect(() => setInput(keyword), [keyword]);

  const invalid = router.isReady && (!Number.isInteger(page) || page < 1 || page > MAX_PAGES || !SCHEDULE_STATUSES.includes(status));
  useEffect(() => {
    if (invalid) router.push({ pathname: router.pathname, query: { p: 1, st: 'WAITING' } });
  }, [invalid, router]);
  if (!router.isReady || invalid) return null;

  const base = `/${ch}`;
  const all = (scheduled[ch] as unknown as Item[]).filter((x) => !isCancelled(x.id));
  const k = keyword.trim().toLowerCase();
  const matched = all.filter((x) => !k || searchFields(x).some((f) => f.toLowerCase().includes(k)));
  const count = (s: ScheduleStatus) => matched.filter((x) => x.status === s).length;
  const list = matched.filter((x) => x.status === status);
  const pages = Math.ceil(Math.min(list.length, MAX_PAGES * PER) / PER);
  const rows = list.slice((page - 1) * PER, page * PER);
  const push = (q: Record<string, string | number | undefined>) => router.push({ pathname: router.pathname, query: Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined && v !== '')) });
  const search = () => {
    const t = input.trim();
    if (t === keyword) return;
    push({ p: 1, st: status, sk: t });
  };
  const sentHref = (it: Item) => `${base}/sent-history/${it.id}`;
  const detailHref = (it: Item) => `${base}/scheduled-messages/${it.id}`;
  // 행 클릭: 푸시는 REQUESTED 만 보낸 메시지로, 나머지 채널은 REQUESTED · STARTED 를 보낸 메시지로
  const open = (it: Item) => router.push(ch === 'push' ? (it.status === 'REQUESTED' ? sentHref(it) : detailHref(it)) : it.status === 'REQUESTED' || it.status === 'STARTED' ? sentHref(it) : detailHref(it));
  const menu = (it: Item): RowMenuItem[] => {
    const items: RowMenuItem[] = [{ label: '상세 정보', onClick: () => router.push(it.status === 'REQUESTED' || it.status === 'STARTED' ? sentHref(it) : detailHref(it)) }];
    if (it.status === 'WAITING') {
      items.push({ label: '수정', onClick: () => router.push(`${detailHref(it)}/edit`) });
      items.push({ label: '예약 취소', destructive: true, onClick: () => setCancel(it.id) });
    } else if (parse(it.sendAfter).getTime() + 5 * 60000 <= NOW.getTime() && selectedOf(ch, it) === 0) {
      items.push({
        label: '재시도',
        destructive: true,
        onClick: () => {
          if (!window.confirm('발송을 재시도 하시겠습니까?')) return;
          window.alert('발송 재시도 요청이 완료되었습니다.');
        },
      });
    }
    return items;
  };

  return (
    <>
      <PageTitle>
        <h1>예약된 메시지</h1>
      </PageTitle>
      <div style={{ display: 'flex', gap: 8 }}>
        <TextField icon="search" placeholder="캠페인명, 제목, 내용, ID 검색" maxLength={100} value={input} onChange={(e) => setInput(e.target.value)} onKeyUp={(e) => e.key === 'Enter' && search()} />
        <Button onClick={search}>검색</Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <CountTabs<ScheduleStatus>
          items={[
            { value: 'WAITING', label: '대기 중', icon: 'schedule', count: count('WAITING') },
            { value: 'REQUESTED', label: '발송 완료', icon: 'check_circle', count: count('REQUESTED') },
            { value: 'FAILED', label: '실패', icon: 'error', count: count('FAILED') },
          ]}
          value={status}
          onChange={(v) => push({ p: 1, st: v })}
        />
        <ListCard>
          {rows.length === 0 ? (
            <EmptyList />
          ) : (
            rows.map((it) => {
              const r = (rowOf[ch] as (m: unknown, d: { label: string; value: string }) => ReturnType<typeof rowOf.sms>)(it.m, { label: '예약 날짜', value: it.sendAfter });
              const tone = TONE[it.status];
              return <SentRow key={it.id} source={it.m.source} lead={<StatusLead tone={tone === 'brand' ? 'gray' : tone} label={LABEL[it.status]} />} menu={menu(it)} onOpen={() => open(it)} {...r} />;
            })
          )}
          {/* 스테이징: 0건이면 페이지네이션 숨김 */}
          {rows.length > 0 && <Pagination page={page} pages={pages} onChange={(n) => push({ p: n, st: status, sk: keyword })} />}
        </ListCard>
      </div>
      {cancel && (
        <ConfirmModal
          title="예약을 취소하시겠습니까?"
          description="취소된 예약은 복구할 수 없습니다."
          cancelLabel="닫기"
          confirmLabel="확인"
          destructive
          onClose={() => setCancel(null)}
          onConfirm={() => {
            cancelSchedule(cancel);
            setCancel(null);
            toast('예약이 취소되었습니다.');
          }}
        />
      )}
    </>
  );
}
