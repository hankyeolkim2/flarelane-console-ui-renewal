import styled from '@emotion/styled';
import type { SmsMessage } from '@/lib/sent';

// 문자 미리보기 — 휴대폰 틀(320×382) 안 말풍선. 보낸 메시지에서는 광고 문구 · 수신거부 번호를 자동으로 붙이지 않음(스테이징).
const Phone = styled.div`
  height: 382px;
  padding: 20px 16px;
  border: 1px solid var(--border-secondary);
  border-radius: 24px;
  background: linear-gradient(to bottom, #eceff4, #f6f7f9);
  overflow: auto;
`;

const Bubble = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 240px;
  padding: 10px 12px;
  border-radius: 16px 16px 16px 4px;
  background: #fff;
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.06);
  font-size: 13px;
  line-height: 19px;
  color: #111827;
  white-space: pre-wrap;
  word-break: break-all;
  > b { font-weight: 600; }
  > i { height: 120px; border-radius: 8px; background: var(--bg-tertiary); }
`;

export default function SmsPreview({ m }: { m: SmsMessage }) {
  const showTitle = !!m.title || m.type !== 'SMS';
  return (
    <Phone>
      <Bubble>
        {m.image && <i />}
        {showTitle && <b>{m.title || '제목없음'}</b>}
        <span>{`[Web발신]\n${m.body}`}</span>
      </Bubble>
    </Phone>
  );
}
