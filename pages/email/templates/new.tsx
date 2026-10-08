import { useRouter } from 'next/router';
import { EmailTemplateForm } from '@/components/templates/EmailTemplates';
import { emailTemplates } from '@/lib/templates';
import { useMounted } from '@/lib/useMounted';

// ?copyMessageId= 이면 그 템플릿을 복제해 시작
export default function NewEmailTemplatePage() {
  const router = useRouter();
  const mounted = useMounted();
  if (!mounted || !router.isReady) return null;
  const copy = emailTemplates.find((t) => t.id === router.query.copyMessageId);
  return <EmailTemplateForm key={copy?.id} copy={copy} />;
}
