import { useRouter } from 'next/router';
import { EmailTemplateForm } from '@/components/templates/EmailTemplates';
import { EmptyList } from '@/components/sent/SentList';
import { emailTemplates } from '@/lib/templates';

export default function EditEmailTemplatePage() {
  const router = useRouter();
  if (!router.isReady) return null;
  const t = emailTemplates.find((x) => x.id === router.query.id);
  return t ? <EmailTemplateForm key={t.id} t={t} /> : <EmptyList />;
}
