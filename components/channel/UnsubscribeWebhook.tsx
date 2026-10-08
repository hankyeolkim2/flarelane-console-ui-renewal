import { useState } from 'react';
import Button from '@/components/ui/Button';
import TextField from '@/components/ui/TextField';
import { Card, CardHead } from './ChannelShell';

// 「수신거부 웹훅 설정」(문자 · 카카오 · 이메일 공용) — docs/staging-behavior-channel.md
// 「수정」 → 확인창 → 편집, 「저장」 → 확인창 → 저장(취소하면 편집만 끝나고 입력값은 그대로 보임). 별도 취소 버튼 · 형식 검사 · 토스트 없음.
const GUIDE = {
  sms: 'https://docs.flarelane.co.kr/sms-overview#hxRtq',
  kakao: 'https://docs.flarelane.co.kr/sms-overview#hxRtq',
  email: 'https://docs.flarelane.co.kr/email-overview#hxRtq',
};

export default function UnsubscribeWebhook({ channel, initial }: { channel: 'sms' | 'kakao' | 'email'; initial: string }) {
  const [value, setValue] = useState(initial);
  const [editing, setEditing] = useState(false);
  return (
    <Card>
      <CardHead
        title="수신거부 웹훅 설정"
        help={
          <>
            수신거부 리스트에 새롭게 번호가 추가/삭제될 경우 이를 웹훅을 통해 받아볼 수 있습니다.{' '}
            <a href={GUIDE[channel]} target="_blank" rel="noreferrer">자세히보기</a>
          </>
        }
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* 모양은 Figma: 읽기 = 주소 글자, 수정 = 입력칸 */}
        {editing ? (
          <TextField autoFocus placeholder="https://example.com/webhook" value={value} onChange={(e) => setValue(e.target.value)} />
        ) : (
          <span style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: '20px', color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>{value || '-'}</span>
        )}
        <Button
          hierarchy="primary"
          onClick={() => {
            if (!editing) {
              if (window.confirm('수신거부 웹훅 설정을 수정하시겠습니까?')) setEditing(true);
              return;
            }
            window.confirm('수신거부 웹훅 설정을 저장하시겠습니까?\n해당 URL로 수신거부 리포트가 전달됩니다.');
            setEditing(false);
          }}
        >
          {editing ? '저장' : '수정'}
        </Button>
      </div>
    </Card>
  );
}
