import { useRouter } from 'next/router';
import SegmentDetail from '@/components/audience/SegmentDetail';

export default function SegmentDetailPage() {
  const { query, isReady } = useRouter();
  if (!isReady) return null;
  return <SegmentDetail target="Device" id={String(query.segmentId)} />;
}
