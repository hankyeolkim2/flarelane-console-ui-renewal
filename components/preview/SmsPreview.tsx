import styled from '@emotion/styled';
import type { SmsMessage } from '@/lib/sent';
import { color } from '@/styles/tokens';

// Figma `SMS preview`(1567:30816) — 흰 바탕(288 · 위아래 24 · 좌우 16 · 최소 높이 420 · r8) + 회색 말풍선(폭 232 · 안쪽 12 · r12 · 사이 6).
// 이미지(MMS) 156 · r6 → 제목(LMS · MMS, 굵게 — 없으면 뺌) → 본문([Web발신] 부터 한 덩어리). 보낸 메시지에서는 광고 문구 · 수신거부 번호를 자동으로 붙이지 않음(스테이징).
const Screen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  min-height: 420px;
  padding: 24px 16px;
  border: 1px solid ${color('border-secondary')};
  border-radius: 8px;
  background: ${color('preview-sms-bg')};
  overflow: hidden;
`;

const Bubble = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 232px;
  max-width: 100%;
  padding: 12px;
  border-radius: 12px;
  background: ${color('preview-sms-bubble')};
  overflow: hidden;
  font-size: 12px;
  line-height: 18px;
  color: ${color('text-primary')};
  word-break: break-word;
  > b { font-weight: 600; }
  > p { margin: 0; white-space: pre-wrap; }
`;

const Img = styled.div`
  position: relative;
  flex-shrink: 0;
  height: 156px;
  border-radius: 6px;
  background: ${color('preview-image-placeholder')};
  overflow: hidden;
  > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
`;

const isSrc = (s?: string) => !!s && /^(https?:|blob:|data:|\/)/.test(s);

export default function SmsPreview({ m }: { m: SmsMessage }) {
  return (
    <Screen>
      <Bubble>
        {m.image && <Img>{isSrc(m.image) && <img src={m.image} alt="" />}</Img>}
        {m.title && <b>{m.title}</b>}
        <p>{`[Web발신]\n${m.body}`}</p>
      </Bubble>
    </Screen>
  );
}
