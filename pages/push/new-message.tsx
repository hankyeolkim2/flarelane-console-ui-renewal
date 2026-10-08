import { useRouter } from 'next/router';
import PushNewMessage from '@/components/newmsg/PushNewMessage';
import { pushMessages } from '@/lib/sent';
import { useMounted } from '@/lib/useMounted';

// 푸시 새 메시지 — ?config=recurring(반복 발송 기본) · ?copyMessageId=(보낸 메시지 복사)
export default function PushNewMessagePage() {
  const router = useRouter();
  const mounted = useMounted();
  if (!mounted || !router.isReady) return null;
  const copy = pushMessages.find((m) => m.id === router.query.copyMessageId);
  const recurring = router.query.config === 'recurring';
  return <PushNewMessage key={`${copy?.id}-${recurring}`} recurring={recurring} copy={copy} />;
}
