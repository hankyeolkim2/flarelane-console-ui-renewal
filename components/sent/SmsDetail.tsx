import Badge from '@/components/ui/Badge';
import Toggle from '@/components/ui/Toggle';
import { KV } from '@/components/channel/ChannelShell';
import KakaoDetail from './KakaoDetail';
import type { DetailVariant } from './PushDetail';
import { MsgCols, PreviewCol } from './MessageLayout';
import SmsPreview from '@/components/preview/SmsPreview';
import { type SmsMessage } from '@/lib/sent';

// Figma 「문자 — 보낸 메시지 상세」(1194:25489) — 광고성 메시지 토글(읽기 전용) · 제목(SMS 아닐 때) · 내용 + 유형 배지 · 이미지, 오른쪽 휴대폰 미리보기.
export default function SmsDetail({ m, variant }: { m: SmsMessage; variant?: DetailVariant }) {
  return (
    <KakaoDetail
      channel="sms"
      m={m}
      variant={variant}
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
