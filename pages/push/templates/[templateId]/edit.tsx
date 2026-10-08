import { useRouter } from 'next/router';
import { PushTemplateForm } from '@/components/templates/PushTemplateEditor';
import { EmptyList } from '@/components/sent/SentList';
import { pushTemplates } from '@/lib/templates';

export default function EditPushTemplatePage() {
  const router = useRouter();
  if (!router.isReady) return null;
  const t = pushTemplates.find((x) => x.id === router.query.templateId);
  return t ? <PushTemplateForm key={t.id} t={t} /> : <EmptyList />;
}
