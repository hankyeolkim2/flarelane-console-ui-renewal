import { Card, CardHead, ChannelShell, KV, Stat, StatTiles } from '@/components/channel/ChannelShell';

// Figma 「채널 — 문자 설정 — 1440」(1244:3214) — 값은 스테이징(발신번호 010-0000-0000 으로 가림).
export default function SmsChannel() {
  return (
    <ChannelShell current="sms" title="문자 설정">
      <Card>
        <CardHead title="발신번호" />
        <KV
          rows={[
            ['발신번호', '010-0000-0000', '등록일', '2024-10-01'],
            ['업체명', '플레어레인'],
          ]}
        />
      </Card>
      <Card>
        <CardHead title="수신거부" />
        <StatTiles>
          <Stat label="수신거부 번호" value="-" />
          <Stat label="등록된 수신거부 수" value="0" />
          <Stat label="번호 등록일" value="2024-10-02" />
        </StatTiles>
      </Card>
    </ChannelShell>
  );
}
