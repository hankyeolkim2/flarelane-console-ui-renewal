import { useRouter } from 'next/router';
import { KV } from '@/components/channel/ChannelShell';
import KakaoDetail from '@/components/sent/KakaoDetail';
import { MsgCols, PreviewCol } from '@/components/sent/MessageLayout';
import { FriendtalkPreview } from '@/components/preview/KakaoPreview';
import { FRIENDTALK_TYPE, friendtalkMessages } from '@/lib/sent';

// Figma 「브랜드메시지 — 보낸 메시지 상세」(1194:22278) — 알림톡 상세 틀. 유형 & 대상 위에 「수신자 타겟팅」 행.
const TARGETING = { M: '선택한 유저 전체에게 발송 (M)', N: '선택한 유저 중 채널친구를 제외하고 발송 (N)', I: '선택한 유저 중 채널친구에게 발송 (I)' } as const;

export default function FriendtalkSentDetail() {
  const { query, isReady } = useRouter();
  const m = friendtalkMessages.find((x) => x.id === query.id);
  if (!isReady) return null;
  if (!m) return <p>데이터가 없습니다</p>;
  return (
    <KakaoDetail
      channel="friendtalk"
      m={m}
      targetExtra={m.targeting && <KV rows={[['수신자 타겟팅', TARGETING[m.targeting]]]} />}
      message={
        <MsgCols>
          <KV
            rows={[
              ['메시지 유형', FRIENDTALK_TYPE[m.messageType]],
              ...(m.header ? [['타이틀', m.header] as [string, string]] : []),
              ['내용', m.text],
              ...(m.image ? [['이미지', m.image] as [string, string], ['이미지 링크', m.imageLink ?? '-'] as [string, string]] : []),
              ['버튼', m.buttons.length ? m.buttons.map((b) => `${b.name} · ${b.link}`).join('  /  ') : '-'],
              ['광고 여부', m.isAd ? 'ON' : 'OFF'],
            ]}
          />
          <PreviewCol>
            <small>미리보기</small>
            <FriendtalkPreview m={m} />
          </PreviewCol>
        </MsgCols>
      }
    />
  );
}
