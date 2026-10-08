import { ChannelShell } from '@/components/channel/ChannelShell';

// 스테이징 `/channel` — 탭 카드만, 선택된 탭 · 본문 없음.
export default function ChannelRoot() {
  return <ChannelShell current={null} />;
}
