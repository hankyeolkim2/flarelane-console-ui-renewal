import { useRouter } from 'next/router';
import { KV } from '@/components/channel/ChannelShell';
import KakaoDetail from '@/components/sent/KakaoDetail';
import { AlimtalkPreview } from '@/components/preview/KakaoPreview';
import { alimtalkMessages } from '@/lib/sent';
import { MsgCols, PreviewCol, Sub } from '@/components/sent/MessageLayout';

// Figma 「알림톡 — 보낸 메시지 상세」(1191:46253) — 메시지 = 왼쪽 key-value(여러 값은 「 / 」 한 줄) + 개인화 변수 설정, 오른쪽 미리보기 320.
const EMPHASIS = { NONE: '기본형', TEXT: '강조 표기형', IMAGE: '이미지형', ITEM_LIST: '아이템 리스트형' } as const;
const TYPE = { BA: '기본형', EX: '부가 정보형', AD: '채널 추가형', MI: '복합형' } as const;

export default function AlimtalkSentDetail() {
  const { query, isReady } = useRouter();
  const m = alimtalkMessages.find((x) => x.id === query.id);
  if (!isReady) return null;
  if (!m) return <p>데이터가 없습니다</p>;
  return (
    <KakaoDetail
      channel="alimtalk"
      m={m}
      message={
        <MsgCols>
          <div>
            <KV
              rows={[
                ['카테고리', `${m.categoryGroup} › ${m.category}`],
                ['템플릿 이름', m.templateName, '템플릿 코드', m.templateCode],
                ['강조유형', EMPHASIS[m.emphasis], '메시지 유형', TYPE[m.messageType]],
                ...(m.templateTitle ? [['제목', m.templateTitle] as [string, string]] : []),
                ...(m.templateSubtitle ? [['부제목', m.templateSubtitle] as [string, string]] : []),
                ...(m.templateImage ? [['이미지', m.templateImage] as [string, string]] : []),
                ...(m.templateHeader ? [['헤더', m.templateHeader] as [string, string]] : []),
                ...(m.itemHighlight ? [['아이템 하이라이트', `${m.itemHighlight.title}  /  ${m.itemHighlight.desc}`] as [string, string]] : []),
                ...(m.items ? [['아이템 리스트', m.items.map((i) => `${i.name} · ${i.desc}`).join('  /  ')] as [string, string]] : []),
                ['내용', m.templateContent],
                ...(m.templateExtra ? [['부가 정보', m.templateExtra] as [string, string]] : []),
                ...(m.templateAd ? [['안내 멘트', m.templateAd] as [string, string]] : []),
                ['버튼', m.buttons.length ? m.buttons.map((b) => `${b.type} · ${b.name}`).join('  /  ') : '-'],
                ['보안 템플릿', m.security ? 'ON' : 'OFF'],
              ]}
            />
            {Object.keys(m.interpolations).length > 0 && (
              <>
                <Sub>개인화 변수 설정</Sub>
                <KV rows={Object.entries(m.interpolations)} />
              </>
            )}
          </div>
          <PreviewCol>
            <small>미리보기</small>
            <AlimtalkPreview m={m} />
          </PreviewCol>
        </MsgCols>
      }
    />
  );
}
