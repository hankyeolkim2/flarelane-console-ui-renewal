import PushTemplateList from '@/components/templates/PushTemplateList';
import { useMounted } from '@/lib/useMounted';

export default function PushTemplatesPage() {
  return useMounted() ? <PushTemplateList /> : null;
}
