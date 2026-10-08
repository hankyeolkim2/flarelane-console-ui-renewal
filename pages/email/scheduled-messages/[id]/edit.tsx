import { useRouter } from 'next/router';
import EditPage from '@/components/newmsg/EditPage';

export default function ScheduledEmailEdit() {
  const router = useRouter();
  if (!router.isReady) return null;
  return <EditPage ch="email" kind="scheduled" id={router.query.id as string} />;
}
