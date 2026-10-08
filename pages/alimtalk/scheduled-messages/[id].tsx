import { useRouter } from 'next/router';
import ScheduledDetail from '@/components/sent/ScheduledDetail';

export default function ScheduledMessageDetail() {
  const { query, isReady } = useRouter();
  if (!isReady) return null;
  return <ScheduledDetail ch="alimtalk" id={String(query.id)} />;
}
