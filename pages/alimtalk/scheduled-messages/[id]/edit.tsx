import { useRouter } from 'next/router';
import EditPage from '@/components/newmsg/EditPage';

export default function ScheduledAlimtalkEdit() {
  const router = useRouter();
  if (!router.isReady) return null;
  return <EditPage ch="alimtalk" kind="scheduled" id={router.query.id as string} />;
}
