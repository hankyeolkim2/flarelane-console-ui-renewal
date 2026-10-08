import { useRouter } from 'next/router';
import FriendtalkDetail from '@/components/sent/FriendtalkDetail';
import { friendtalkMessages } from '@/lib/sent';

export default function FriendtalkSentDetail() {
  const { query, isReady } = useRouter();
  const m = friendtalkMessages.find((x) => x.id === query.id);
  if (!isReady) return null;
  if (!m) return <p>데이터가 없습니다</p>;
  return <FriendtalkDetail m={m} />;
}
