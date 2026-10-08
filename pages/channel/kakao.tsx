import { useState } from 'react';
import Button from '@/components/ui/Button';
import TextField from '@/components/ui/TextField';
import { Card, CardHead, ChannelShell, KV, Stat, StatTiles } from '@/components/channel/ChannelShell';
import { useStore } from '@/lib/store';

// Figma 「채널 — 카카오 설정 — 1440」(1244:2037) — 값은 스테이징(관리자 번호는 010-0000-0000 으로 가림).
export default function KakaoChannel() {
  const { toast } = useStore();
  const [webhook, setWebhook] = useState('https://webhook.site/3cae11b5-181c-4a91-b297-46fda1688ec0');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(webhook);
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
      <Card>
        <CardHead title="수신거부 웹훅 설정" help="수신거부가 등록되면 이 주소로 알려 드립니다." />
        {editing ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <TextField autoFocus value={draft} placeholder="https://" onChange={(e) => setDraft(e.target.value)} />
            <Button onClick={() => { setDraft(webhook); setEditing(false); }}>취소</Button>
            <Button hierarchy="primary" onClick={() => { setWebhook(draft.trim()); setEditing(false); toast('저장되었습니다.'); }}>저장</Button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ flex: 1, minWidth: 0, font: '400 14px/20px inherit', color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>{webhook || '-'}</span>
            <Button hierarchy="primary" onClick={() => { setDraft(webhook); setEditing(true); }}>수정</Button>
          </div>
        )}
      </Card>
    </ChannelShell>
  );
}
