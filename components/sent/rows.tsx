import { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { Num, type RowContent, type Stat } from './SentList';
import { FRIENDTALK_TYPE, fmt, pct, PLATFORMS, won, type AlimtalkMessage, type EmailMessage, type FriendtalkMessage, type PushMessage, type SmsMessage } from '@/lib/sent';
import { color } from '@/styles/tokens';

// 보낸 메시지 · 예약된 메시지 목록 행의 글 · 지표 — 채널별(docs 보낸 메시지 1.5 · 예약 1.6). 날짜 칸 라벨만 「발송 시간」/「예약 날짜」로 바뀜.
const Skel = styled.i`
  display: block;
  width: 64px;
  height: 20px;
  border-radius: 4px;
  background: linear-gradient(90deg, ${color('bg-secondary')}, ${color('bg-tertiary')}, ${color('bg-secondary')});
  background-size: 200% 100%;
  animation: sk 1.2s linear infinite;
  @keyframes sk { from { background-position: 200% 0; } to { background-position: 0 0; } }
`;

const total = (m: PushMessage, k: 'sent' | 'clicked' | 'conversions' | 'amount') => PLATFORMS.reduce((a, p) => a + (m.stats[p][k] ?? 0), 0);

// 전환 · 구매 총액은 행이 화면에 들어오면 500~2000ms 뒤 불러옴(스테이징 지연 로드)
function LazyConv({ m, kind }: { m: PushMessage; kind: 'conv' | 'amount' }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        t = setTimeout(() => setReady(true), 500 + ((m.id.charCodeAt(0) * 37) % 1500));
        io.disconnect();
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, [m.id]);
  const sent = total(m, 'sent');
  return <span ref={ref}>{!ready ? <Skel /> : kind === 'conv' ? `${fmt(total(m, 'conversions'))} (${pct(total(m, 'conversions'), sent)})` : won(total(m, 'amount'))}</span>;
}

function PlatformIcons({ m }: { m: PushMessage }) {
  const icons: [string, boolean][] = [
    ['smartphone', m.stats.webMobile.sent > 0 || m.targetPlatforms.includes('webMobile')],
    ['desktop_windows', m.stats.webDesktop.sent > 0 || m.targetPlatforms.includes('webDesktop')],
    ['android', m.stats.android.sent > 0 || m.targetPlatforms.includes('android')],
    ['apple', m.stats.ios.sent > 0 || m.targetPlatforms.includes('ios')],
  ];
  return (
    <span style={{ display: 'flex', gap: 4, color: 'var(--fg-quaternary)' }}>
      {icons.filter(([, on]) => on).map(([n]) => (
        <Icon key={n} name={n} size={20} />
      ))}
    </span>
  );
}


type Row = { content: RowContent; cols: [number, Stat[]][] };
const roas = (r: number) => `${Number((r * 100).toFixed(2))}%`;
const kakaoCols = (m: { selected: number; sent: number; convertedUniqueUser: number; roas: number }, date: Stat): [number, Stat[]][] => [
  [160, [date]],
  [112, [{ label: '전체 유저', value: <Num n={m.selected} /> }, { label: '전환 유저', value: <Num n={m.convertedUniqueUser} /> }]],
  [112, [{ label: '발송 유저', value: <Num n={m.sent} /> }, { label: 'ROAS', value: roas(m.roas) }]],
];

export const rowOf = {
  push: (m: PushMessage, date: Stat): Row => {
    const sent = total(m, 'sent');
    const clicked = total(m, 'clicked');
    return {
      content: { eyebrow: m.campaignName ? { text: m.campaignName, tone: 'brand' } : undefined, title: m.title, body: m.body, url: m.url, image: !!m.imageUrl },
      cols: [
        [160, [date, { label: '플랫폼', value: <PlatformIcons m={m} />, raw: true }]],
        [112, [{ label: '발송', value: fmt(sent) }, { label: '전환', value: <LazyConv m={m} kind="conv" /> }]],
        [112, [{ label: '클릭', value: `${fmt(clicked)} (${pct(clicked, sent)})` }, { label: '구매 총액', value: <LazyConv m={m} kind="amount" /> }]],
      ],
    };
  },
  alimtalk: (m: AlimtalkMessage, date: Stat): Row => ({ content: { title: m.campaignName, sub: m.templateName, body: m.templateContent }, cols: kakaoCols(m, date) }),
  friendtalk: (m: FriendtalkMessage, date: Stat): Row => ({ content: { eyebrow: { text: FRIENDTALK_TYPE[m.messageType], tone: 'primary' }, title: m.campaignName ?? '', body: m.text, bodyLines: 2 }, cols: kakaoCols(m, date) }),
  sms: (m: SmsMessage, date: Stat): Row => ({ content: m.campaignName ? { title: m.campaignName, body: m.body } : { title: m.body }, cols: kakaoCols(m, date) }),
  email: (m: EmailMessage, date: Stat): Row => ({
    content: { title: m.campaignName ?? '', body: m.title, bodyLines: 2 },
    cols: [
      [160, [date, { label: '읽음', value: fmt(m.opened) }]],
      [112, [{ label: '발송', value: fmt(m.delivered) }, { label: '전환', value: fmt(m.converted) }]],
      [112, [{ label: '실패', value: fmt(m.failed + m.aborted) }, { label: '구매 총액', value: won(m.purchaseAmount) }]],
    ],
  }),
};
