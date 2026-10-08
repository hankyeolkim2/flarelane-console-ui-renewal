import { useRouter } from 'next/router';
import AlimtalkDetail from '@/components/sent/AlimtalkDetail';
import { alimtalkMessages } from '@/lib/sent';

export default function AlimtalkSentDetail() {
  const { query, isReady } = useRouter();
  const m = alimtalkMessages.find((x) => x.id === query.id);
  if (!isReady) return null;
  if (!m) return <p>데이터가 없습니다</p>;
  return <AlimtalkDetail m={m} />;
}
