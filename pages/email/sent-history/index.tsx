import ChannelSentList from '@/components/sent/ChannelSentList';
import { emailMessages, fmt, won } from '@/lib/sent';

// 이메일 행: 캠페인명 · 이메일 제목(최대 2줄) / 발송 시간 · 읽음 | 발송 · 전환 | 실패 · 구매 총액 (Figma 배치)
export default function EmailSentHistory() {
  return (
    <ChannelSentList
      base="email"
      items={emailMessages.map((m) => ({
        id: m.id,
        source: m.source,
        search: [m.id, m.campaignName, m.title],
        content: { title: m.campaignName ?? '', body: m.title, bodyLines: 2 },
        cols: [
          [160, [{ label: '발송 시간', value: m.createdAt }, { label: '읽음', value: fmt(m.opened) }]],
          [112, [{ label: '발송', value: fmt(m.delivered) }, { label: '전환', value: fmt(m.converted) }]],
          [112, [{ label: '실패', value: fmt(m.failed + m.aborted) }, { label: '구매 총액', value: won(m.purchaseAmount) }]],
        ],
      }))}
    />
  );
}
