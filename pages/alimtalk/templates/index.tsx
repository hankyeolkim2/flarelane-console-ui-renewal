import { useRouter } from 'next/router';
import { AlimtalkTemplateList } from '@/components/templates/AlimtalkTemplates';
import { useMounted } from '@/lib/useMounted';

export default function AlimtalkTemplatesPage() {
  const router = useRouter();
  const mounted = useMounted();
  return mounted && router.isReady ? <AlimtalkTemplateList /> : null;
}
