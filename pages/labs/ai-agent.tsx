import AiAgent from '@/components/labs/AiAgent';
import { useMounted } from '@/lib/useMounted';

export default function AiAgentPage() {
  return useMounted() ? <AiAgent /> : null;
}
