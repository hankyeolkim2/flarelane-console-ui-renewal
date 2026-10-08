import { useRouter } from 'next/router';
import PushDetail from '@/components/sent/PushDetail';
import { pushMessages } from '@/lib/sent';

export default function PushSentDetail() {
  const { query, isReady } = useRouter();
  // 테스트 발송(채널 › 앱 푸시)에서 넘어온 주소는 첫 건으로 보여 줌
  const m = pushMessages.find((x) => x.id === query.notificationId) ?? (query.notificationId === 'n-fcmv1-test' ? pushMessages[0] : undefined);
  if (!isReady) return null;
  if (!m) return <p>데이터가 없습니다</p>;
  return <PushDetail m={m} />;
}
