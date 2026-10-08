import { useRouter } from 'next/router';
import FriendtalkNewMessage from '@/components/newmsg/FriendtalkNewMessage';
import { friendtalkMessages } from '@/lib/sent';
import { useMounted } from '@/lib/useMounted';

export default function FriendtalkNewMessagePage() {
  const router = useRouter();
  const mounted = useMounted();
  if (!mounted || !router.isReady) return null;
  const copy = friendtalkMessages.find((m) => m.id === router.query.copyMessageId);
  const recurring = router.query.config === 'recurring';
  return <FriendtalkNewMessage key={`${copy?.id}-${recurring}`} recurring={recurring} copy={copy} />;
}
