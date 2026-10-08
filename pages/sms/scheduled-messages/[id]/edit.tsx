import { useRouter } from 'next/router';
import EditPage from '@/components/newmsg/EditPage';

export default function ScheduledSmsEdit() {
  const router = useRouter();
  if (!router.isReady) return null;
  return <EditPage ch="sms" kind="scheduled" id={router.query.id as string} />;
}
