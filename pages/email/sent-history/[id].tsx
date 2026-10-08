import { useRouter } from 'next/router';
import EmailDetail from '@/components/sent/EmailDetail';
import { emailMessages } from '@/lib/sent';

export default function EmailSentDetail() {
  const { query, isReady } = useRouter();
  const m = emailMessages.find((x) => x.id === query.id);
  if (!isReady) return null;
  if (!m) return <p>데이터가 없습니다</p>;
  return <EmailDetail m={m} />;
}
