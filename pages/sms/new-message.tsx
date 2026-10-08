import { useRouter } from 'next/router';
import SmsNewMessage from '@/components/newmsg/SmsNewMessage';
import { smsMessages } from '@/lib/sent';
import { useMounted } from '@/lib/useMounted';

export default function SmsNewMessagePage() {
  const router = useRouter();
  const mounted = useMounted();
  if (!mounted || !router.isReady) return null;
  const copy = smsMessages.find((m) => m.id === router.query.copyMessageId);
  const recurring = router.query.config === 'recurring';
  return <SmsNewMessage key={`${copy?.id}-${recurring}`} recurring={recurring} copy={copy} />;
}
