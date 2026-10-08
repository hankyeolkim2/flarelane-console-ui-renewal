import { useRouter } from 'next/router';
import WebhookFormPage from '@/components/channel/WebhookFormPage';
import { useStore } from '@/lib/store';

export default function EditWebhook() {
  const { query, isReady } = useRouter();
  const { webhooks } = useStore();
  const w = webhooks.find((x) => x.id === query.id);
  if (!isReady) return null;
  // 스테이징: 불러오기 실패면 빈 칸으로 열림
  return <WebhookFormPage key={w?.id} initial={w} />;
}
