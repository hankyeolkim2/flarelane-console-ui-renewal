import ChannelSentList from '@/components/sent/ChannelSentList';
import { Num } from '@/components/sent/SentList';
import { alimtalkMessages } from '@/lib/sent';

// 알림톡 행: 캠페인명(제목) · 템플릿 이름(브랜드색) · 템플릿 내용 / 발송 시간 · 전체 유저 · 전환 유저 · 발송 유저 · ROAS
export default function AlimtalkSentHistory() {
  return (
    <ChannelSentList
      base="alimtalk"
      items={alimtalkMessages.map((m) => ({
        id: m.id,
        source: m.source,
        search: [m.id, m.campaignName, m.templateName, m.templateContent],
        content: { title: m.campaignName, sub: m.templateName, body: m.templateContent },
        cols: [
          [160, [{ label: '발송 시간', value: m.createdAt }]],
          [112, [{ label: '전체 유저', value: <Num n={m.selected} /> }, { label: '전환 유저', value: <Num n={m.convertedUniqueUser} /> }]],
          [112, [{ label: '발송 유저', value: <Num n={m.sent} /> }, { label: 'ROAS', value: `${Number((m.roas * 100).toFixed(2))}%` }]],
        ],
      }))}
    />
  );
}
