import { useRouter } from 'next/router';
import { PushTemplateDetail } from '@/components/templates/PushTemplateEditor';
import { useTemplates } from '@/components/templates/PushTemplateList';
import { EmptyList } from '@/components/sent/SentList';
import { pushTemplates } from '@/lib/templates';

export default function PushTemplateDetailPage() {
  const router = useRouter();
  useTemplates();
  if (!router.isReady) return null;
  const t = pushTemplates.find((x) => x.id === router.query.templateId);
  return t ? <PushTemplateDetail key={t.id} t={t} /> : <EmptyList />;
}
