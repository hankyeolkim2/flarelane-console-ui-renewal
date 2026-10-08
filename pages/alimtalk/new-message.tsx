import { useRouter } from 'next/router';
import AlimtalkNewMessage from '@/components/newmsg/AlimtalkNewMessage';
import { alimtalkMessages } from '@/lib/sent';
import { useMounted } from '@/lib/useMounted';

export default function AlimtalkNewMessagePage() {
  const router = useRouter();
  const mounted = useMounted();
  if (!mounted || !router.isReady) return null;
  const copy = alimtalkMessages.find((m) => m.id === router.query.copyMessageId);
  const recurring = router.query.config === 'recurring';
  return <AlimtalkNewMessage key={`${copy?.id}-${recurring}`} recurring={recurring} copy={copy} />;
}
