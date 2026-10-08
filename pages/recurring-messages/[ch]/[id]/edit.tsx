import { useRouter } from 'next/router';
import EditPage from '@/components/newmsg/EditPage';
import type { ChannelKey } from '@/lib/scheduled';

export default function RecurringEdit() {
  const router = useRouter();
  if (!router.isReady) return null;
  return <EditPage ch={router.query.ch as ChannelKey} kind="recurring" id={router.query.id as string} />;
}
