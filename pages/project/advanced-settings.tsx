import { useState } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import IconButton from '@/components/ui/IconButton';
import { UnderlineTabs } from '@/components/ui/Tabs';
import TextField from '@/components/ui/TextField';
import { Card } from '@/components/channel/ChannelShell';
import { PageTitle } from '@/components/sent/SentList';
import { useStore } from '@/lib/store';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 고급 설정 — docs/staging-behavior-dashboard-settings.md 2-7. Figma 시안 없음 → 프로젝트 화면 카드 틀로.
// 탭 「발송」 · 「유저&기기 관리」 · 「보안」, 「저장」은 지금 탭만 저장 → 토스트 「저장되었습니다.」.
type Tab = 'send' | 'device' | 'security';
const saved = { sendLatestDeviceOnly: false, deleteDeviceOnPushFeedback: true, allowedIps: ['211.234.10.1'], enforceMFA: false };

const Opt = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
  cursor: pointer;
  user-select: none;
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  > span { display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px 2px 10px; border: 1px solid ${color('border-secondary')}; border-radius: ${radius.sm}px; background: ${color('bg-secondary')}; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
  > span > button { display: inline-flex; padding: 0; border: 0; background: none; color: ${color('fg-quaternary')}; cursor: pointer; }
`;

export default function AdvancedSettings() {
  const router = useRouter();
  const { toast } = useStore();
  const [tab, setTab] = useState<Tab>('send');
  const [v, setV] = useState({ ...saved, allowedIps: [...saved.allowedIps] });
  const [ip, setIp] = useState('');
  const check = (k: 'sendLatestDeviceOnly' | 'deleteDeviceOnPushFeedback' | 'enforceMFA', label: string) => (
    <Opt onClick={() => setV({ ...v, [k]: !v[k] })}>
      <Checkbox checked={v[k]} />
      {label}
    </Opt>
  );
  return (
    <>
      <PageTitle>
        <IconButton icon="chevron_left" label="뒤로" onClick={() => router.push('/project')} />
        <h1>고급 설정</h1>
      </PageTitle>
      <Card>
        <UnderlineTabs<Tab>
          items={[
            { value: 'send', label: '발송' },
            { value: 'device', label: '유저&기기 관리' },
            { value: 'security', label: '보안' },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === 'send' && check('sendLatestDeviceOnly', '푸시 발송 시 동일 유저ID 중복 기기가 있는 경우 최근 접속한 1개 기기에만 발송')}
        {tab === 'device' && check('deleteDeviceOnPushFeedback', '푸시 발송 후 푸시서버(FCM/APNS)로부터 삭제 피드백 수신 시 기기 즉시 삭제')}
        {tab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <b style={{ fontSize: 14, fontWeight: 600 }}>콘솔 접속을 허용할 IP 접근제어</b>
              <div style={{ width: 360 }}>
                <TextField
                  placeholder="IP 주소 입력"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' || !ip.trim()) return;
                    setV({ ...v, allowedIps: [...new Set([...v.allowedIps, ip.trim()])] });
                    setIp('');
                  }}
                />
              </div>
              <Chips>
                {v.allowedIps.map((x) => (
                  <span key={x}>
                    {x}
                    <button type="button" aria-label="삭제" onClick={() => setV({ ...v, allowedIps: v.allowedIps.filter((y) => y !== x) })}>
                      <Icon name="close" size={16} />
                    </button>
                  </span>
                ))}
              </Chips>
            </div>
            {check('enforceMFA', '모든 멤버에 대해 2차 인증 강제 설정 요구')}
          </div>
        )}
      </Card>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          hierarchy="primary"
          size="md"
          onClick={() => {
            if (tab === 'send') saved.sendLatestDeviceOnly = v.sendLatestDeviceOnly;
            if (tab === 'device') saved.deleteDeviceOnPushFeedback = v.deleteDeviceOnPushFeedback;
            if (tab === 'security') Object.assign(saved, { allowedIps: [...v.allowedIps], enforceMFA: v.enforceMFA });
            toast('저장되었습니다.');
          }}
        >
          저장
        </Button>
      </div>
    </>
  );
}
