import ChannelSentList from '@/components/sent/ChannelSentList';
import { Num } from '@/components/sent/SentList';
import { smsMessages } from '@/lib/sent';

// 문자 행: 캠페인명 · 본문(캠페인명이 없으면 본문이 제목 자리) / 발송 유저 = 발송 + 대기
export default function SmsSentHistory() {
  return (
    <ChannelSentList
      base="sms"
      items={smsMessages.map((m) => ({
        id: m.id,
        source: m.source,
        search: [m.id, m.campaignName, m.title, m.body],
        content: m.campaignName ? { title: m.campaignName, body: m.body } : { title: m.body },
        cols: [
          [160, [{ label: '발송 시간', value: m.createdAt }]],
          [112, [{ label: '전체 유저', value: <Num n={m.selected} /> }, { label: '전환 유저', value: <Num n={m.convertedUniqueUser} /> }]],
          [112, [{ label: '발송 유저', value: <Num n={m.sent} /> }, { label: 'ROAS', value: `${Number((m.roas * 100).toFixed(2))}%` }]],
        ],
      }))}
    />
  );
}
