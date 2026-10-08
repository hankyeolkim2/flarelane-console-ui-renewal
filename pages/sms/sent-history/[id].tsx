import { useRouter } from 'next/router';
import SmsDetail from '@/components/sent/SmsDetail';
import { smsMessages } from '@/lib/sent';

export default function SmsSentDetail() {
  const { query, isReady } = useRouter();
  const m = smsMessages.find((x) => x.id === query.id);
  if (!isReady) return null;
  if (!m) return <p>데이터가 없습니다</p>;
  return <SmsDetail m={m} />;
}
