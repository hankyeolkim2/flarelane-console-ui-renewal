import { useRouter } from 'next/router';
import SegmentEditor from '@/components/audience/SegmentEditor';
import { useMounted } from '@/lib/useMounted';

export default function NewSegment() {
  const { query, isReady } = useRouter();
  const mounted = useMounted();
  if (!isReady || !mounted) return null;
  return <SegmentEditor key={String(query.copySegmentId ?? '')} target="Device" copyId={typeof query.copySegmentId === 'string' ? query.copySegmentId : undefined} />;
}
