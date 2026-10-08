import ChannelSentList from '@/components/sent/ChannelSentList';
import { rowOf } from '@/components/sent/rows';
import { smsMessages } from '@/lib/sent';

// 행 글 · 지표 = components/sent/rows.tsx (docs 보낸 메시지 1.5)
export default function SmsSentHistory() {
  return <ChannelSentList base="sms" items={smsMessages.map((m) => ({ id: m.id, source: m.source, search: [m.id, m.campaignName, m.title, m.body], ...rowOf.sms(m, { label: '발송 시간', value: m.createdAt }) }))} />;
}
