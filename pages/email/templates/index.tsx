import { EmailTemplateList } from '@/components/templates/EmailTemplates';
import { useMounted } from '@/lib/useMounted';

export default function EmailTemplatesPage() {
  return useMounted() ? <EmailTemplateList /> : null;
}
