import Builder from '@/components/journeys/builder/Builder';
import { useMounted } from '@/lib/useMounted';

export default function NewJourneyPage() {
  return useMounted() ? <Builder /> : null;
}
