import { useRouter } from 'next/router';
import EditPage from '@/components/newmsg/EditPage';

export default function ScheduledPushEdit() {
  const router = useRouter();
  if (!router.isReady) return null;
  return <EditPage ch="push" kind="scheduled" id={router.query.scheduledNotificationId as string} />;
}
