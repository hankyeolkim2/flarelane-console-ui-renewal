import AiSegment from '@/components/labs/AiSegment';
import { useMounted } from '@/lib/useMounted';

export default function AiSegmentPage() {
  return useMounted() ? <AiSegment /> : null;
}
