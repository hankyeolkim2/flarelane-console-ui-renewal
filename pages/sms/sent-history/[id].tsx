import { useRouter } from 'next/router';
import Badge from '@/components/ui/Badge';
import Toggle from '@/components/ui/Toggle';
import { KV } from '@/components/channel/ChannelShell';
import KakaoDetail from '@/components/sent/KakaoDetail';
import { MsgCols, PreviewCol } from '@/components/sent/MessageLayout';
import SmsPreview from '@/components/preview/SmsPreview';
import { smsMessages } from '@/lib/sent';

// Figma 「문자 — 보낸 메시지 상세」(1194:25489) — 광고성 메시지 토글(읽기 전용) · 제목(SMS 아닐 때) · 내용 + 유형 배지 · 이미지, 오른쪽 휴대폰 미리보기.
export default function SmsSentDetail() {
  const { query, isReady } = useRouter();
  const m = smsMessages.find((x) => x.id === query.id);
  if (!isReady) return null;
  if (!m) return <p>데이터가 없습니다</p>;
  return (
    <KakaoDetail
      channel="sms"
      m={m}
      message={
        <MsgCols>
          <KV
            rows={[
              ['광고성 메시지', <Toggle key="t" checked={m.isAd} disabled label="광고성 메시지" onChange={() => undefined} />],
              ...(m.type !== 'SMS' ? [['제목', m.title ?? '-'] as [string, string]] : []),
              [
                '내용',
                <span key="b" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, whiteSpace: 'pre-wrap' }}>
                  <span style={{ flex: 1 }}>{m.body}</span>
                  <Badge color="gray">{m.type}</Badge>
                </span>,
              ],
              ...(m.image ? [['이미지', '업로드됨'] as [string, string]] : []),
            ]}
          />
          <PreviewCol>
            <small>미리보기</small>
            <SmsPreview m={m} />
          </PreviewCol>
        </MsgCols>
      }
    />
  );
}
