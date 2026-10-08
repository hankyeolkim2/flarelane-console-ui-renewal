import { AlimtalkTemplateForm } from '@/components/templates/AlimtalkTemplates';
import { useMounted } from '@/lib/useMounted';

export default function NewAlimtalkTemplatePage() {
  return useMounted() ? <AlimtalkTemplateForm /> : null;
}
