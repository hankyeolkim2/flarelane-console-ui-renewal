import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import AlimtalkDetail from './AlimtalkDetail';
import EmailDetail from './EmailDetail';
import FriendtalkDetail from './FriendtalkDetail';
import PushDetail, { type DetailVariant } from './PushDetail';
import SmsDetail from './SmsDetail';
import { cancelSchedule, findScheduled, type ChannelKey } from '@/lib/scheduled';
import type { AlimtalkMessage, EmailMessage, FriendtalkMessage, PushMessage, SmsMessage } from '@/lib/sent';
import { useStore } from '@/lib/store';

// 예약된 메시지 상세 — 보낸 메시지 상세와 같은 섹션, 제목 「예약된 메시지 상세」 · 「메시지 복제」 없음 · 날짜 라벨 「예약 날짜」.
// 예약 시각이 아직 안 지났으면 페이지 맨 아래 「예약 취소」(destructive Secondary, 왼쪽) · 「수정」(Primary, 오른쪽) — Figma 1229:1698.
const NOW = new Date('2026-10-08T23:00:00');
const parse = (s: string) => new Date(s.replace(/\./g, '-').replace(' ', 'T'));

export default function ScheduledDetail({ ch, id }: { ch: ChannelKey; id: string }) {
  const router = useRouter();
  const { toast } = useStore();
  const [ask, setAsk] = useState(false);
  const it = findScheduled(ch, id);
  const list = `/${ch}/scheduled-messages`;
  // 푸시: 발송 완료면 보낸 메시지 상세로, 못 찾으면 목록으로
  useEffect(() => {
    if (!it) router.push(list);
    else if (ch === 'push' && it.status === 'REQUESTED') router.push(`/push/sent-history/${it.m.id}`);
  }, [it, ch, list, router]);
  if (!it) return null;
  const future = parse(it.sendAfter) > NOW;
  const variant: DetailVariant = {
    title: '예약된 메시지 상세',
    copy: false,
    dateLabel: '예약 날짜',
    date: it.sendAfter,
    backHref: list,
    footer: future && (
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button hierarchy="destructive-secondary" size="md" onClick={() => setAsk(true)}>
          예약 취소
        </Button>
        <Button hierarchy="primary" size="md" onClick={() => router.push(`${list}/${id}/edit`)}>
          수정
        </Button>
      </div>
    ),
  };
  return (
    <>
      {ch === 'push' && <PushDetail m={it.m as unknown as PushMessage} variant={variant} />}
      {ch === 'alimtalk' && <AlimtalkDetail m={it.m as unknown as AlimtalkMessage} variant={variant} />}
      {ch === 'friendtalk' && <FriendtalkDetail m={it.m as unknown as FriendtalkMessage} variant={variant} />}
      {ch === 'sms' && <SmsDetail m={it.m as unknown as SmsMessage} variant={variant} />}
      {ch === 'email' && <EmailDetail m={it.m as unknown as EmailMessage} variant={variant} />}
      {ask && (
        <ConfirmModal
          title="예약을 취소하시겠습니까?"
          description="취소된 예약은 복구할 수 없습니다."
          cancelLabel="닫기"
          confirmLabel="확인"
          destructive
          onClose={() => setAsk(false)}
          onConfirm={() => {
            setAsk(false);
            toast('예약이 취소되었습니다.');
            // 푸시는 replace(?p=1), 나머지는 push(목록)
            if (ch === 'push') router.replace('/push/scheduled-messages?p=1').then(() => cancelSchedule(id));
            else router.push(list).then(() => cancelSchedule(id));
          }}
        />
      )}
    </>
  );
}
