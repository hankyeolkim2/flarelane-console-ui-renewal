import { PushTemplateForm } from '@/components/templates/PushTemplateEditor';
import { useMounted } from '@/lib/useMounted';

export default function NewPushTemplatePage() {
  return useMounted() ? <PushTemplateForm /> : null;
}
