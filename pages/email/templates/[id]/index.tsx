import { useRouter } from 'next/router';
import { EmailTemplateDetail } from '@/components/templates/EmailTemplates';
import { useTemplates } from '@/components/templates/PushTemplateList';
import { EmptyList } from '@/components/sent/SentList';
import { emailTemplates } from '@/lib/templates';

export default function EmailTemplateDetailPage() {
  const router = useRouter();
  useTemplates();
  if (!router.isReady) return null;
  const t = emailTemplates.find((x) => x.id === router.query.id);
  return t ? <EmailTemplateDetail key={t.id} t={t} /> : <EmptyList />;
}
