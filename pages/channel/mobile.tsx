import { useState } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import TextField, { FieldError } from '@/components/ui/TextField';
import Accordion from '@/components/channel/Accordion';
import { Card, CardHead, ChannelShell, KV } from '@/components/channel/ChannelShell';
import { useStore } from '@/lib/store';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma 「채널 — 앱 푸시 설정 — 1440」(1242:83681) — 값은 스테이징.
const Alert = styled.div`
  display: flex;
  gap: 16px;
  padding: 15px;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.xl}px;
  background: ${color('bg-primary_alt')};
  > span { display: inline-flex; color: ${color('fg-brand-primary')}; }
  > div > b { display: block; ${text('text-sm', 'semibold')}; color: ${color('text-secondary')}; }
  > div > p { margin: 4px 0 0; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
`;

const Note = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  border-radius: ${radius.md}px;
  background: ${color('bg-secondary')};
  ${text('text-sm', 'regular')};
  color: ${color('text-secondary')};
  > p { margin: 0; }
  a, b { color: ${color('text-brand-secondary')}; font-weight: 400; text-decoration: none; }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AppPushChannel() {
  const { toast } = useStore();
  const [invite, setInvite] = useState('');
  const [inviteError, setInviteError] = useState(false);
  return (
    <ChannelShell current="mobile" title="앱 푸시 설정">
      <Card>
        <Alert>
          <span>
            <Icon name="info" size={20} />
          </span>
          <div>
            <b>도움이 필요하신가요? 개발자 팀원에게 연동 가이드를 전달하세요.</b>
            <p>연동 가이드가 첨부된 초대 메일이 발송됩니다.</p>
          </div>
        </Alert>
        <div>
          <div style={{ display: 'flex', gap: 12 }}>
            <TextField
              placeholder="초대할 메일 주소 입력"
              value={invite}
              error={inviteError}
              onChange={(e) => {
                setInvite(e.target.value);
                setInviteError(false);
              }}
            />
            <Button
              hierarchy="primary"
              disabled={!invite.trim()}
              onClick={() => {
                if (!EMAIL.test(invite.trim())) return setInviteError(true);
                toast('초대 메일이 발송되었습니다.');
                setInvite('');
              }}
            >
              발송
            </Button>
          </div>
          {inviteError && <FieldError>올바른 이메일 주소를 입력해 주세요.</FieldError>}
        </div>
      </Card>
      <Card>
        <CardHead title="푸시 인증정보" help="앱 푸시를 보내려면 플랫폼별 인증정보가 필요합니다." />
        <Note>
          <p>
            자세한 내용은 <a href="https://flarelane.com/ko/docs/" target="_blank" rel="noreferrer">앱 푸시 연동</a> 가이드를 참고하세요
          </p>
          <p>
            기존 FCM API가 지원 종료됨에 따라 새로운 API를 위한 <b>Service Account JSON</b>을 업로드해주셔야 합니다.
          </p>
        </Note>
        <Accordion icon="android" title="FCM - Firebase Cloud Messaging">
          <KV
            rows={[
              ['Sender ID', '123'],
              ['Service Account JSON', 'flarelane-test-a45d5-firebase-adminsdk-geg68-2f519b2b08.json  업로드됨'],
            ]}
          />
          <Actions>
            <Button>테스트 발송</Button>
            <Button hierarchy="primary">수정</Button>
          </Actions>
        </Accordion>
        <Accordion icon="android" title="(Legacy) FCM - Firebase Cloud Messaging" badge={<Badge color="gray">지원 종료</Badge>}>
          <KV
            rows={[
              ['Server Key', '134'],
              ['Sender ID', '244'],
            ]}
          />
          <Actions>
            <Button hierarchy="primary">수정</Button>
          </Actions>
        </Accordion>
        <Accordion icon="apple" title="APNS - Apple Push Notification Service">
          <KV
            rows={[
              ['Key', '업로드됨'],
              ['KeyId', '1'],
              ['TeamId', '1'],
              ['Bundle Identifier', 'com.flarelane.sample'],
            ]}
          />
          <Actions>
            <Button hierarchy="primary">수정</Button>
          </Actions>
        </Accordion>
      </Card>
    </ChannelShell>
  );
}
