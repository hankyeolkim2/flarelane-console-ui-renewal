import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { recurringMessages } from '@/lib/recurring';
import { scheduled, type ChannelKey } from '@/lib/scheduled';
import type { AlimtalkMessage, EmailMessage, FriendtalkMessage, PushMessage, SmsMessage } from '@/lib/sent';
import { useMounted } from '@/lib/useMounted';
import AlimtalkNewMessage from './AlimtalkNewMessage';
import EmailNewMessage from './EmailNewMessage';
import FriendtalkNewMessage from './FriendtalkNewMessage';
import type { EditMode } from './parts';
import PushNewMessage from './PushNewMessage';
import SmsNewMessage from './SmsNewMessage';

// 예약 수정(…/scheduled-messages/[id]/edit) · 반복 수정(/recurring-messages/[ch]/[id]/edit) — 채널 새 메시지 화면을 수정 모드로.
// 예약은 발송 시각이 지났으면 바로 목록으로 replace, 못 찾으면 목록으로 push(docs scheduled-recurring 3 · 6.2장).
const NOW = '2026.10.08 23:00:00';

export default function EditPage({ ch, kind, id }: { ch: ChannelKey; kind: 'scheduled' | 'recurring'; id: string }) {
  const router = useRouter();
  const mounted = useMounted();
  const s = kind === 'scheduled' ? (scheduled[ch] as { id: string; sendAfter: string; m: unknown }[]).find((x) => x.id === id) : undefined;
  const r = kind === 'recurring' ? recurringMessages.find((x) => x.id === id && x.ch === ch) : undefined;
  const list = kind === 'scheduled' ? `/${ch}/scheduled-messages` : '/recurring-messages';
  const gone = kind === 'scheduled' ? !s || s.sendAfter <= NOW : !r;
  useEffect(() => {
    if (!gone) return;
    if (s) router.replace(list);
    else router.push(list);
  }, [gone, s, list, router]);
  if (!mounted || gone) return null;
  const m = (s?.m ?? r!.m) as never;
  const edit: EditMode = { kind, id, sendAfter: s?.sendAfter, config: r?.config };
  const props = { recurring: kind === 'recurring', edit };
  if (ch === 'push') return <PushNewMessage key={id} {...props} copy={m as PushMessage} />;
  if (ch === 'alimtalk') return <AlimtalkNewMessage key={id} {...props} copy={m as AlimtalkMessage} />;
  if (ch === 'friendtalk') return <FriendtalkNewMessage key={id} {...props} copy={m as FriendtalkMessage} />;
  if (ch === 'sms') return <SmsNewMessage key={id} {...props} copy={m as SmsMessage} />;
  return <EmailNewMessage key={id} {...props} copy={m as EmailMessage} />;
}
