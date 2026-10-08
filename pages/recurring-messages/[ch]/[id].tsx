import { useEffect, useReducer, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { Help } from '@/components/channel/ChannelShell';
import AlimtalkDetail from '@/components/sent/AlimtalkDetail';
import { Section } from '@/components/sent/Detail';
import EmailDetail from '@/components/sent/EmailDetail';
import FriendtalkDetail from '@/components/sent/FriendtalkDetail';
import PushDetail, { type DetailVariant } from '@/components/sent/PushDetail';
import RecurringActionModal, { type RecurringAction } from '@/components/sent/RecurringModals';
import { rowOf } from '@/components/sent/rows';
import { EmptyList, ListCard, SentRow, SourceBadge } from '@/components/sent/SentList';
import SmsDetail from '@/components/sent/SmsDetail';
import { deleteRecurring, endText, gmt, periodText, recurringMessages, startText, statusOf, subscribeRecurring } from '@/lib/recurring';
import { alimtalkMessages, emailMessages, friendtalkMessages, pushMessages, smsMessages, type AlimtalkMessage, type EmailMessage, type FriendtalkMessage, type PushMessage, type SmsMessage } from '@/lib/sent';

// 반복 발송 메시지 상세 — Figma 1222:27359 모양 + docs 5장. 보낸 메시지 상세 틀에 정보 행(다음 발송 일정 · 반복 주기 · 시작/종료일)과 「보낸 메시지」 카드(5개씩, 쪽 번호는 화면 상태)를 더함.
// 하단: 「삭제」(활성화가 아닐 때, 왼쪽) · 「수정」(임시저장일 때만, 오른쪽). 폴링 없음.
const SENT = { push: pushMessages, alimtalk: alimtalkMessages, friendtalk: friendtalkMessages, sms: smsMessages, email: emailMessages } as const;
type Row = [ReactNode, ReactNode] | [ReactNode, ReactNode, ReactNode, ReactNode];
const Gray = ({ children }: { children: ReactNode }) => <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>{children}</span>;

export default function RecurringDetail() {
  const router = useRouter();
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => subscribeRecurring(rerender), []);
  const [modal, setModal] = useState<RecurringAction | null>(null);
  const [page, setPage] = useState(1);
  const r = recurringMessages.find((x) => x.id === router.query.id);
  if (!router.isReady) return null;
  if (!r) return <p>데이터가 없습니다</p>;
  const st = statusOf(r);
  const ch = r.ch;
  const sent = r.history.map((id) => (SENT[ch] as { id: string; createdAt: string }[]).find((x) => x.id === id)).filter(Boolean) as { id: string; createdAt: string }[];
  const rows = sent.slice((page - 1) * 5, page * 5);
  const capping = (r.m as { ignoreCapping?: boolean }).ignoreCapping;
  const ttl = ch === 'push' ? (r.m as PushMessage).ttlMinutes : undefined;
  const infoRows: Row[] = [
    [
      '다음 발송 일정',
      <span key="n" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {r.nextRunAt ?? '-'} <Gray>({r.config.timeZone})</Gray>
        {/* Figma: Link color sm */}
        <button type="button" onClick={() => setModal('dates')} style={{ padding: 0, border: 0, background: 'none', font: '600 14px/20px Pretendard, sans-serif', color: 'var(--text-brand-secondary)', cursor: 'pointer' }}>
          예상 발송 일정
        </button>
      </span>,
      <span key="l" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        발송 환경 <Help>메시지가 발송된 환경입니다.</Help>
      </span>,
      <SourceBadge key="b" source={r.m.source} />,
    ],
    ...(capping !== undefined ? [(ttl ? ['발송 빈도 제한 무시', capping ? 'TRUE' : 'FALSE', '알림 만료 기간', ttl % 1440 === 0 ? `${ttl / 1440}일` : `${ttl / 60}시간`] : ['발송 빈도 제한 무시', capping ? 'TRUE' : 'FALSE']) as Row] : []),
    [
      '반복 주기',
      <span key="p">
        {periodText(r.config)} <Gray>{gmt(r.config.timeZone)}</Gray>
      </span>,
    ],
    ['발송 시작일', startText(r.config), '발송 종료일', endText(r.config)],
  ];
  const variant: DetailVariant = {
    title: '반복 발송 메시지 상세',
    copy: false,
    backHref: '/recurring-messages',
    infoRows,
    headerActions: (
      <Button hierarchy="primary" size="md" onClick={() => setModal(st === 'active' ? 'pause' : 'active')}>
        {st === 'active' ? '일시중지' : '활성화'}
      </Button>
    ),
    after: (
      <Section title="보낸 메시지">
        <ListCard>
          {rows.length === 0 ? (
            <EmptyList />
          ) : (
            rows.map((m) => {
              const row = (rowOf[ch] as (m: unknown, d: { label: string; value: string }) => ReturnType<typeof rowOf.sms>)(m, { label: '발송 시간', value: m.createdAt });
              return <SentRow key={m.id} source="system" href={`/${ch}/sent-history/${m.id}`} menu={[]} {...row} />;
            })
          )}
          {sent.length > 0 && <Pagination page={page} pages={Math.ceil(sent.length / 5)} onChange={setPage} />}
        </ListCard>
      </Section>
    ),
    footer: st !== 'active' && (
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button hierarchy="destructive-secondary" size="md" onClick={() => setModal('delete')}>
          삭제
        </Button>
        {st === 'draft' && (
          <Button hierarchy="primary" size="md" onClick={() => router.push(`/recurring-messages/${ch}/${r.id}/edit`)}>
            수정
          </Button>
        )}
      </div>
    ),
  };
  return (
    <>
      {ch === 'push' && <PushDetail m={r.m as PushMessage} variant={variant} />}
      {ch === 'alimtalk' && <AlimtalkDetail m={r.m as AlimtalkMessage} variant={variant} />}
      {ch === 'friendtalk' && <FriendtalkDetail m={r.m as FriendtalkMessage} variant={variant} />}
      {ch === 'sms' && <SmsDetail m={r.m as SmsMessage} variant={variant} />}
      {ch === 'email' && <EmailDetail m={r.m as EmailMessage} variant={variant} />}
      {modal && (
        <RecurringActionModal
          r={r}
          action={modal}
          onClose={() => setModal(null)}
          onDeleted={() => router.replace('/recurring-messages').then(() => deleteRecurring(r.id))}
        />
      )}
    </>
  );
}
