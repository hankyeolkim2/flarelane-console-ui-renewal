import { useRouter } from 'next/router';
import SegmentEditor from '@/components/audience/SegmentEditor';

export default function EditSegment() {
  const { query, isReady } = useRouter();
  if (!isReady) return null;
  return <SegmentEditor key={String(query.segmentId)} target="User" id={String(query.segmentId)} />;
}
