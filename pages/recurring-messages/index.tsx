import { useEffect, useReducer, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Badge, { type BadgeColor } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Floating from '@/components/ui/Floating';
import { MenuItem } from '@/components/ui/Menu';
import { CountTabs } from '@/components/ui/Tabs';
import TextField from '@/components/ui/TextField';
import { EmptyList, ListCard, Num, PageTitle, SentRow, StatusLead, type RowContent, type RowMenuItem, type Stat } from '@/components/sent/SentList';
import RecurringActionModal, { type RecurringAction } from '@/components/sent/RecurringModals';
import { CHANNEL_LABEL, CHANNEL_ORDER, endText, recurringMessages, setRecurringStatus, statusOf, STATUS_LABEL, subscribeRecurring, periodText, type Recurring, type RecurringStatus } from '@/lib/recurring';
import type { ChannelKey } from '@/lib/scheduled';
import { FRIENDTALK_TYPE, fmt, pct, PLATFORMS, won, type AlimtalkMessage, type EmailMessage, type FriendtalkMessage, type PushMessage, type SmsMessage } from '@/lib/sent';
import { color } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma 「반복 발송 메시지 — 목록 (일시중지 탭)」(1086:50995) 모양 + docs/staging-behavior-scheduled-recurring.md 4장.
// 한 번에 전부 불러오고 페이지 없음. 탭 = 로컬 상태(처음은 ?status= 또는 활성화), 검색은 300ms 뒤 ?sk= 로 반영 · 검색 중엔 탭 숨김(상태 무관).
const CH_COLOR: Record<ChannelKey, BadgeColor> = { sms: 'indigo', push: 'orange', email: 'purple', alimtalk: 'warning', friendtalk: 'success' };
const CH_ICON: Record<ChannelKey, string> = { push: 'tooltip_2', alimtalk: 'kakao_chat', friendtalk: 'kakao_chat', sms: 'sms', email: 'mail' };
const MENU_ORDER: ChannelKey[] = ['push', 'alimtalk', 'friendtalk', 'sms', 'email'];
const STATUSES: RecurringStatus[] = ['active', 'paused', 'draft', 'archived'];
const ST_ICON: Record<RecurringStatus, string> = { active: 'play_circle', paused: 'pause_circle', draft: 'draft', archived: 'archive' };
const ST_TONE = { active: 'success', paused: 'warning', draft: 'gray', archived: 'brand' } as const;

const Filter = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  > b { ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
  > label { display: inline-flex; align-items: center; gap: 8px; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; cursor: pointer; user-select: none; }
`;

const search = (r: Recurring) => {
  const m = r.m as unknown as Record<string, unknown>;
  const items = (m.items as { title?: string }[] | undefined)?.map((i) => i.title) ?? [];
  return [m.campaignName, m.title, m.body, m.templateName, m.templateContent, m.header, m.text, ...items].filter((x): x is string => typeof x === 'string');
};

function rowOf(r: Recurring): { content: RowContent; cols: [number, Stat[]][] } {
  const st = statusOf(r);
  const expired = st === 'active' && !r.nextRunAt;
  const meta = st === 'archived' ? `아카이브됨: ${r.archivedAt}` : st === 'active' ? (expired ? `기간 만료: ~ ${r.config.end.endDate ?? '-'}` : `다음 발송 일정: ${r.nextRunAt} (${r.config.timeZone})`) : `생성 시간: ${r.createdAt}`;
  const col1: [number, Stat[]] = [160, [{ label: '반복 주기', value: `${periodText(r.config)} (${r.config.timeZone})` }, { label: '발송 종료일', value: endText(r.config) }]];
  const m = r.m;
  const base: RowContent = { title: m.campaignName ?? '', meta: { text: meta, danger: expired } };
  if (r.ch === 'push') {
    const p = m as PushMessage;
    const sent = PLATFORMS.reduce((a, k) => a + p.stats[k].sent, 0);
    const clicked = PLATFORMS.reduce((a, k) => a + p.stats[k].clicked, 0);
    const conv = PLATFORMS.reduce((a, k) => a + (p.stats[k].conversions ?? 0), 0);
    return { content: base, cols: [col1, [112, [{ label: '발송', value: fmt(sent) }, { label: '전환', value: `${fmt(conv)} (${pct(conv, sent)})` }]], [112, [{ label: '클릭', value: `${fmt(clicked)} (${pct(clicked, sent)})` }, { label: '구매 총액', value: won(0) }]]] };
  }
  if (r.ch === 'email') {
    const e = m as EmailMessage;
    return { content: base, cols: [col1, [112, [{ label: '발송', value: fmt(e.delivered) }, { label: '전환', value: fmt(e.converted) }]], [112, [{ label: '읽음', value: fmt(e.opened) }, { label: '구매 총액', value: won(e.purchaseAmount) }]]] };
  }
  const k = m as AlimtalkMessage | FriendtalkMessage | SmsMessage;
  const content: RowContent =
    r.ch === 'alimtalk' ? { ...base, sub: (k as AlimtalkMessage).templateName } : r.ch === 'friendtalk' ? { ...base, eyebrow: { text: FRIENDTALK_TYPE[(k as FriendtalkMessage).messageType], tone: 'primary' }, body: (k as FriendtalkMessage).text } : base;
  return {
    content,
    cols: [col1, [112, [{ label: '전체 유저', value: <Num n={k.selected} /> }, { label: '전환 유저', value: <Num n={k.convertedUniqueUser} /> }]], [112, [{ label: '발송 유저', value: <Num n={k.sent} /> }, { label: 'ROAS', value: `${Number((k.roas * 100).toFixed(2))}%` }]]],
  };
}

export default function RecurringMessages() {
  const router = useRouter();
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => subscribeRecurring(rerender), []);
  const [tab, setTab] = useState<RecurringStatus>('active');
  const [channels, setChannels] = useState<ChannelKey[]>(CHANNEL_ORDER);
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<{ r: Recurring; action: RecurringAction } | null>(null);
  const newRef = useRef<HTMLDivElement>(null);
  const sk = typeof router.query.sk === 'string' ? router.query.sk : '';

  useEffect(() => {
    if (!router.isReady) return;
    const s = router.query.status;
    if (typeof s === 'string' && STATUSES.includes(s as RecurringStatus)) setTab(s as RecurringStatus);
    setInput(sk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);
  // 300ms 디바운스로 ?sk= 반영(shallow)
  useEffect(() => {
    if (!router.isReady || input === sk) return;
    const t = setTimeout(() => router.replace({ pathname: router.pathname, query: input ? { ...router.query, sk: input } : Object.fromEntries(Object.entries(router.query).filter(([k]) => k !== 'sk')) }, undefined, { shallow: true }), 300);
    return () => clearTimeout(t);
  }, [input, sk, router]);

  const byChannel = recurringMessages.filter((r) => channels.includes(r.ch));
  const k = sk.trim().toLowerCase();
  const list = k ? byChannel.filter((r) => search(r).some((f) => f.toLowerCase().includes(k))) : byChannel.filter((r) => statusOf(r) === tab);

  const menu = (r: Recurring): RowMenuItem[] => {
    const st = statusOf(r);
    const items: RowMenuItem[] = [];
    if (st === 'active') items.push({ label: '일시중지', onClick: () => setModal({ r, action: 'pause' }) });
    if (st === 'paused' || st === 'draft') items.push({ label: '활성화', onClick: () => setModal({ r, action: 'active' }) });
    if (st === 'paused') items.push({ label: '아카이브', onClick: () => setModal({ r, action: 'archive' }) });
    if (st === 'archived') items.push({ label: '아카이브 해제', onClick: () => setRecurringStatus(r.id, 'pause') });
    items.push({ label: '삭제', destructive: true, onClick: () => setModal({ r, action: 'delete' }) });
    return items;
  };

  return (
    <>
      <PageTitle>
        <h1>반복 발송 메시지</h1>
        <i />
        <div ref={newRef}>
          <Button hierarchy="primary" size="md" iconTrailing={menuOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'} onClick={() => setMenuOpen((v) => !v)}>
            새 반복 발송 메시지
          </Button>
        </div>
        <Floating anchorRef={newRef} open={menuOpen} onClose={() => setMenuOpen(false)} width={220} offset={4}>
          <div style={{ padding: '4px 0' }}>
            {MENU_ORDER.map((c) => (
              <MenuItem key={c} icon={CH_ICON[c]} label={CHANNEL_LABEL[c]} onClick={() => router.push(`/${c}/new-message?config=recurring`)} />
            ))}
          </div>
        </Floating>
      </PageTitle>
      <TextField icon="search" placeholder="캠페인명, 제목, 내용 검색" maxLength={100} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && router.replace({ pathname: router.pathname, query: { ...router.query, sk: input } }, undefined, { shallow: true })} />
      <Filter>
        <b>채널</b>
        {CHANNEL_ORDER.map((c) => (
          <label
            key={c}
            onClick={() => {
              if (channels.includes(c) && channels.length === 1) return window.alert('최소 하나 이상 선택해주세요.');
              setChannels((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]));
            }}
          >
            <Checkbox checked={channels.includes(c)} />
            {CHANNEL_LABEL[c]}
          </label>
        ))}
      </Filter>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!k && (
          <CountTabs<RecurringStatus>
            items={STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s], icon: ST_ICON[s], count: byChannel.filter((r) => statusOf(r) === s).length }))}
            value={tab}
            onChange={setTab}
          />
        )}
        <ListCard>
          {list.length === 0 ? (
            <EmptyList />
          ) : (
            list.map((r) => {
              const st = statusOf(r);
              return (
                <SentRow
                  key={r.id}
                  source={r.m.source}
                  lead={<StatusLead tone={ST_TONE[st]} label={STATUS_LABEL[st]} />}
                  topBadge={<Badge color={CH_COLOR[r.ch]}>{CHANNEL_LABEL[r.ch]}</Badge>}
                  href={`/recurring-messages/${r.ch}/${r.id}`}
                  menu={menu(r)}
                  {...rowOf(r)}
                />
              );
            })
          )}
        </ListCard>
      </div>
      {modal && <RecurringActionModal r={modal.r} action={modal.action} onClose={() => setModal(null)} />}
    </>
  );
}

