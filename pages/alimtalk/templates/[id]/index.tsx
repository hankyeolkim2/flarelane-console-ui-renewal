import { useRouter } from 'next/router';
import { AlimtalkTemplateDetail } from '@/components/templates/AlimtalkTemplates';
import { useTemplates } from '@/components/templates/PushTemplateList';
import { EmptyList } from '@/components/sent/SentList';
import { alimtalkTemplates } from '@/lib/templates';

export default function AlimtalkTemplateDetailPage() {
  const router = useRouter();
  useTemplates();
  if (!router.isReady) return null;
  const t = alimtalkTemplates.find((x) => x.id === router.query.id);
  return t ? <AlimtalkTemplateDetail key={t.id} t={t} /> : <EmptyList />;
}
