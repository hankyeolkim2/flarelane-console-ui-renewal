import { Card, CardHead, ChannelShell, KV, Stat, StatTiles } from '@/components/channel/ChannelShell';
import UnsubscribeWebhook from '@/components/channel/UnsubscribeWebhook';

// Figma 「채널 — 카카오 설정 — 1440」(1244:2037) — 값은 스테이징(관리자 번호는 010-0000-0000 으로 가림).
export default function KakaoChannel() {
  return (
    <ChannelShell current="kakao" title="카카오 설정">
      <Card>
        <CardHead title="발신 프로필" />
        <KV
          rows={[
            ['카카오톡 채널 ID', '@flarelane', '카카오톡 채널 이름', '플레어레인'],
            ['관리자 휴대폰 번호', '010-0000-0000', '사업자 카테고리', '컴퓨터, 소프트웨어/솔루션, 소프트웨어/솔루션'],
            ['브랜드메시지 비친구 승인', 'YES'],
          ]}
        />
      </Card>
      <Card>
        <CardHead title="수신거부" />
        <StatTiles>
          <Stat label="수신거부 번호" value="080-877-6010" />
          <Stat label="등록된 수신거부 수" value="1" />
          <Stat label="번호 등록일" value="2025-11-04" />
        </StatTiles>
      </Card>
      {/* 수신거부 번호가 있을 때만 */}
      <UnsubscribeWebhook channel="kakao" initial="https://webhook.site/3cae11b5-181c-4a91-b297-46fda1688ec0" />
    </ChannelShell>
  );
}
