import ChannelSentList from '@/components/sent/ChannelSentList';
import { rowOf } from '@/components/sent/rows';
import { alimtalkMessages } from '@/lib/sent';

// 행 글 · 지표 = components/sent/rows.tsx (docs 보낸 메시지 1.5)
export default function AlimtalkSentHistory() {
  return <ChannelSentList base="alimtalk" items={alimtalkMessages.map((m) => ({ id: m.id, source: m.source, search: [m.id, m.campaignName, m.templateName, m.templateContent], ...rowOf.alimtalk(m, { label: '발송 시간', value: m.createdAt }) }))} />;
}
