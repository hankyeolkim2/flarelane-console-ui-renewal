import { useRouter } from 'next/router';
import { AlimtalkTemplateForm } from '@/components/templates/AlimtalkTemplates';
import { EmptyList } from '@/components/sent/SentList';
import { alimtalkTemplates } from '@/lib/templates';

export default function EditAlimtalkTemplatePage() {
  const router = useRouter();
  if (!router.isReady) return null;
  const t = alimtalkTemplates.find((x) => x.id === router.query.id);
  return t ? <AlimtalkTemplateForm key={t.id} t={t} /> : <EmptyList />;
}
