import { useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import TextField from '@/components/ui/TextField';
import TestDeviceModal from '@/components/channel/TestDeviceModal';
import Accordion from '@/components/channel/Accordion';
import { Card, CardHead, ChannelShell, KV } from '@/components/channel/ChannelShell';
import { useStore } from '@/lib/store';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma 「채널 — 앱 푸시 설정 — 1440」(1242:83681) 모양 + docs/staging-behavior-channel.md 동작. 값은 스테이징.
// 섹션 3개는 처음 접힘, 섹션마다 따로 「수정」 → 「취소」 · 「저장」. 저장 성공 토스트 없음.
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

const Uploaded = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${color('text-brand-secondary')};
  > button { display: inline-flex; padding: 2px; border: 0; border-radius: 4px; background: none; color: ${color('fg-quaternary')}; cursor: pointer; }
  > button:hover { background: ${color('bg-primary_hover')}; color: ${color('fg-quaternary_hover')}; }
`;

const LabelRow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 12px;
`;

// 파일 고르기 — 숨은 input 을 「업로드」 버튼으로 엶
function UploadButton({ accept, onFile }: { accept: string; onFile: (name: string, content: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button iconLeading="upload" onClick={() => ref.current?.click()}>업로드</Button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          f.text().then((c) => onFile(f.name, c));
        }}
      />
    </>
  );
}

function UploadedTag({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <Uploaded>
      {label}
      {onRemove && (
        <button type="button" aria-label="제거" onClick={onRemove}>
          <Icon name="close" size={16} />
        </button>
      )}
    </Uploaded>
  );
}

// 섹션 공통 — 저장값(saved) · 편집값(draft) · 수정 모드
function useSection<T>(initial: T) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(false);
  return {
    saved,
    draft,
    editing,
    set: (patch: Partial<T>) => setDraft((d) => ({ ...d, ...patch })),
    edit: () => { setDraft(saved); setEditing(true); },
    cancel: () => { setDraft(saved); setEditing(false); },
    commit: () => { setSaved(draft); setEditing(false); },
  };
}

function Foot({ editing, onEdit, onCancel, onSave, extra }: { editing: boolean; onEdit: () => void; onCancel: () => void; onSave: () => void; extra?: ReactNode }) {
  return (
    <Actions>
      {editing ? (
        <>
          <Button onClick={onCancel}>취소</Button>
          <Button hierarchy="primary" onClick={onSave}>저장</Button>
        </>
      ) : (
        <>
          {extra}
          <Button hierarchy="primary" onClick={onEdit}>수정</Button>
        </>
      )}
    </Actions>
  );
}

const val = (v: string, editing: boolean, onChange: (v: string) => void, placeholder: string) =>
  editing ? <TextField value={v} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /> : v || '-';

export default function AppPushChannel() {
  const { toast } = useStore();
  const router = useRouter();
  const [invite, setInvite] = useState('');
  const [testOpen, setTestOpen] = useState(false);
  const fcm = useSection({ senderId: '123', filename: 'flarelane-test-a45d5-firebase-adminsdk-geg68-2f519b2b08.json', json: '{}' as string | null });
  const legacy = useSection({ serverKey: '134', senderId: '244' });
  const apns = useSection({ key: '-----BEGIN PRIVATE KEY-----', keyId: '1', teamId: '1', topic: 'com.flarelane.sample' });
  const fcmComplete = (v: typeof fcm.draft) => !!(v.json && v.senderId && v.filename);
  const hasLegacy = !!(legacy.saved.serverKey || legacy.saved.senderId);

  return (
    <ChannelShell current="mobile" title="앱 푸시 설정">
      <Card>
        <Alert>
          <span>
            <Icon name="info" size={20} />
          </span>
          <div>
            <b>도움이 필요하신가요? 개발자 팀원에게 연동 가이드를 전달하세요.</b>
            <p>
              <a href="https://docs.flarelane.com/guide-for-developer" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>연동 가이드</a>가 첨부된 초대 메일이 발송됩니다.
            </p>
          </div>
        </Alert>
        <div style={{ display: 'flex', gap: 12 }}>
          <TextField placeholder="초대할 메일 주소 입력" value={invite} onChange={(e) => setInvite(e.target.value)} />
          <Button
            hierarchy="primary"
            onClick={() => {
              // 스테이징: 빈칸이면 아무 일 없음, 형식 검사 없음
              if (!invite) return;
              toast('초대 메일이 발송되었습니다.');
              setInvite('');
            }}
          >
            발송
          </Button>
        </div>
      </Card>
      <Card>
        <CardHead
          title="푸시 인증정보"
          help={
            <>
              앱 푸시 발송을 위해 각 플랫폼별 인증정보가 필수로 필요합니다.
              <br />
              자세한 내용은 <a href="https://docs.flarelane.co.kr/guide-for-developer" target="_blank" rel="noreferrer">개발 가이드</a>를 참고하세요.
            </>
          }
        />
        <Note>
          <p>
            자세한 내용은 <a href="https://docs.flarelane.co.kr/fcm-setting" target="_blank" rel="noreferrer">앱 푸시 연동</a> 가이드를 참고하세요
          </p>
          {hasLegacy && (
            <p>
              기존 FCM API가 지원 종료됨에 따라 새로운 API를 위한 <b>Service Account JSON</b>을 업로드해주셔야 합니다.
            </p>
          )}
        </Note>
        <Accordion icon="android" title="FCM - Firebase Cloud Messaging" defaultOpen={false}>
          <KV
            rows={[
              ['Sender ID', val(fcm.draft.senderId, fcm.editing, (v) => fcm.set({ senderId: v }), 'Sender ID')],
              [
                'Service Account JSON',
                <LabelRow key="j">
                  {fcm.draft.filename ? (
                    <UploadedTag label={`${fcm.draft.filename} 업로드됨`} onRemove={fcm.editing ? () => fcm.set({ filename: '', json: null }) : undefined} />
                  ) : fcm.editing ? null : (
                    '-'
                  )}
                  {fcm.editing && (
                    <UploadButton
                      accept=".json"
                      onFile={(name, c) => {
                        try {
                          JSON.parse(c);
                          fcm.set({ filename: name, json: c });
                        } catch {
                          // 스테이징: 파싱 실패는 조용히 무시
                        }
                      }}
                    />
                  )}
                </LabelRow>,
              ],
            ]}
          />
          <Foot
            editing={fcm.editing}
            onEdit={fcm.edit}
            onCancel={fcm.cancel}
            onSave={() => (fcmComplete(fcm.draft) ? fcm.commit() : toast('FCM 정보를 모두 입력해 주세요.'))}
            extra={<Button onClick={() => (fcmComplete(fcm.saved) ? setTestOpen(true) : toast('FCM 정보를 모두 입력해 주세요.'))}>테스트 발송</Button>}
          />
        </Accordion>
        {hasLegacy && (
          <Accordion icon="android" title="(Legacy) FCM - Firebase Cloud Messaging" badge={<Badge color="gray">지원 종료</Badge>} defaultOpen={false}>
            <KV
              rows={[
                ['Server Key', val(legacy.draft.serverKey, legacy.editing, (v) => legacy.set({ serverKey: v }), 'Server key')],
                ['Sender ID', val(legacy.draft.senderId, legacy.editing, (v) => legacy.set({ senderId: v }), 'Sender ID')],
              ]}
            />
            <Foot
              editing={legacy.editing}
              onEdit={legacy.edit}
              onCancel={legacy.cancel}
              onSave={() => (legacy.draft.serverKey.trim() && legacy.draft.senderId.trim() ? legacy.commit() : toast('FCM 정보를 모두 입력해 주세요.'))}
            />
          </Accordion>
        )}
        <Accordion icon="apple" title="APNS - Apple Push Notification Service" defaultOpen={false}>
          <KV
            rows={[
              [
                'Key',
                <LabelRow key="k">
                  {apns.draft.key ? <UploadedTag label="업로드됨" onRemove={apns.editing ? () => apns.set({ key: '' }) : undefined} /> : apns.editing ? null : '-'}
                  {apns.editing && <UploadButton accept=".p8" onFile={(_, c) => apns.set({ key: c })} />}
                </LabelRow>,
              ],
              ['KeyId', val(apns.draft.keyId, apns.editing, (v) => apns.set({ keyId: v }), 'Key ID')],
              ['TeamId', val(apns.draft.teamId, apns.editing, (v) => apns.set({ teamId: v }), 'Team ID')],
              ['Bundle Identifier', val(apns.draft.topic, apns.editing, (v) => apns.set({ topic: v }), 'Bundle Identifier')],
            ]}
          />
          <Foot
            editing={apns.editing}
            onEdit={apns.edit}
            onCancel={apns.cancel}
            onSave={() => (apns.draft.key && apns.draft.keyId && apns.draft.teamId && apns.draft.topic ? apns.commit() : toast('APNS 정보를 모두 입력해 주세요.'))}
          />
        </Accordion>
      </Card>
      {testOpen && (
        <TestDeviceModal
          onClose={() => setTestOpen(false)}
          onSend={() => {
            setTestOpen(false);
            toast('[FCM V1 발송] 기기에서 푸시 알림이 정상 수신되었는지 확인해주세요.');
            router.push('/push/sent-history/n-fcmv1-test');
          }}
        />
      )}
    </ChannelShell>
  );
}
