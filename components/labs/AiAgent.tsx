import { useState } from 'react';
import Button from '@/components/ui/Button';
import Toggle from '@/components/ui/Toggle';
import { Card, CardHead } from '@/components/channel/ChannelShell';
import { PageTitle } from '@/components/layout/AppLayout';
import { setChat, useChat } from '@/lib/chat';
import AiSettingsModal from './AiSettingsModal';

// AI 에이전트(설정 화면) — docs labs 1장. 채팅은 전역 패널(Chat.tsx), 여기선 런처 켜기/끄기 + AI 컨텍스트 수정.
export default function AiAgent() {
  const c = useChat();
  const [open, setOpen] = useState(false);
  const desc = { margin: 0, fontSize: 14, color: 'var(--text-tertiary)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <PageTitle>AI 에이전트</PageTitle>
      <Card>
        <CardHead title="AI 에이전트" actions={<Toggle checked={c.launcher} label="AI 에이전트 켜기" onChange={(launcher) => setChat({ launcher })} />} />
        <p style={desc}>콘솔 우하단에 에이전트를 노출합니다. 캠페인을 분석하고 운영할 수 있습니다.</p>
      </Card>
      <Card>
        <CardHead title="AI 컨텍스트" actions={<Button onClick={() => setOpen(true)}>AI 컨텍스트 수정</Button>} />
        <p style={desc}>서비스 정보와 비즈니스 목표를 AI 가 참고할 수 있도록 프로젝트 단위로 저장합니다.</p>
      </Card>
      {open && <AiSettingsModal onClose={() => setOpen(false)} />}
    </div>
  );
}
