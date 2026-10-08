import ChannelSentList from '@/components/sent/ChannelSentList';
import { Num } from '@/components/sent/SentList';
import { FRIENDTALK_TYPE, friendtalkMessages } from '@/lib/sent';

// 브랜드메시지 행: 메시지 유형(위 작은 글) · 캠페인명 · 내용(최대 2줄)
export default function FriendtalkSentHistory() {
  return (
    <ChannelSentList
      base="friendtalk"
      items={friendtalkMessages.map((m) => ({
        id: m.id,
        source: m.source,
        search: [m.id, m.campaignName, m.text],
        content: { eyebrow: { text: FRIENDTALK_TYPE[m.messageType], tone: 'primary' }, title: m.campaignName ?? '', body: m.text, bodyLines: 2 },
        cols: [
          [160, [{ label: '발송 시간', value: m.createdAt }]],
          [112, [{ label: '전체 유저', value: <Num n={m.selected} /> }, { label: '전환 유저', value: <Num n={m.convertedUniqueUser} /> }]],
          [112, [{ label: '발송 유저', value: <Num n={m.sent} /> }, { label: 'ROAS', value: `${Number((m.roas * 100).toFixed(2))}%` }]],
        ],
      }))}
    />
  );
}
