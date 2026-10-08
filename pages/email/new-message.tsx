import { useRouter } from 'next/router';
import EmailNewMessage from '@/components/newmsg/EmailNewMessage';
import { emailMessages } from '@/lib/sent';
import { useMounted } from '@/lib/useMounted';

export default function EmailNewMessagePage() {
  const router = useRouter();
  const mounted = useMounted();
  if (!mounted || !router.isReady) return null;
  const copy = emailMessages.find((m) => m.id === router.query.copyMessageId);
  const recurring = router.query.config === 'recurring';
  return <EmailNewMessage key={`${copy?.id}-${recurring}`} recurring={recurring} copy={copy} />;
}
