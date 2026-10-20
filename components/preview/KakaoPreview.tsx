import styled from '@emotion/styled';
import type { AlimtalkMessage, FriendtalkMessage } from '@/lib/sent';
import { color } from '@/styles/tokens';

// Figma `Alimtalk preview`(1566:30694) · `Brand message preview`(1567:30815) — 10-20 Figma 원본 값(get_design_context)으로 다시 그림.
// 대화방 바탕(288 · 위아래 24 · 좌우 16 · 최소 높이 420 · r8) + 발신 프로필명 + 말풍선(r10). 캐러셀은 오른쪽 여백 0 이라 다음 카드가 끝에서 잘림.
// 색은 Components/Preview 토큰, 카카오 노랑(#fee500) · 배지(#333) · 할인율(orange 600)만 원색(Figma 와 같음).
const SENDER = '플레어레인';
const OPT_OUT = '수신거부 | 홈 > 채널 차단';
const isSrc = (s?: string) => !!s && /^(https?:|blob:|data:|\/)/.test(s);

const Room = styled.div<{ $carousel?: boolean }>`
  display: flex;
  align-items: flex-start;
  width: 100%;
  min-height: 420px;
  padding: ${(p) => (p.$carousel ? '24px 0 24px 16px' : '24px 16px')};
  border: 1px solid ${color('border-secondary')};
  border-radius: 8px;
  background: ${color('preview-kakao-chat-bg')};
  overflow: hidden;
  word-break: break-word;
  p { margin: 0; }
`;

const Msg = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Sender = styled.p`
  font-size: 12px;
  line-height: 18px;
  color: ${color('text-secondary')};
  white-space: nowrap;
`;

const Bubble = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  border-radius: 10px;
  background: ${color('preview-kakao-bubble')};
  overflow: hidden;
`;

const OptOut = styled.p<{ w?: number }>`
  width: ${(p) => (p.w ? `${p.w}px` : '100%')};
  flex-shrink: 0;
  font-size: 11px;
  line-height: 16px;
  color: ${color('text-quaternary')};
  text-align: right;
`;

const Hr = styled.i<{ w?: number }>`
  display: block;
  flex-shrink: 0;
  width: ${(p) => (p.w ? `${p.w}px` : '100%')};
  height: 1px;
  background: ${color('preview-kakao-divider')};
`;

// 이미지 칸 — 회색 자리, 이미지 주소가 있으면 채움(cover)
const Slot = styled.div<{ h?: number; ratio?: string; r?: number; s?: number }>`
  position: relative;
  flex-shrink: 0;
  width: ${(p) => (p.s ? `${p.s}px` : '100%')};
  ${(p) => (p.s ? `height: ${p.s}px;` : p.ratio ? `aspect-ratio: ${p.ratio};` : `height: ${p.h}px;`)}
  border-radius: ${(p) => p.r ?? 0}px;
  background: ${color('preview-kakao-fill')};
  overflow: hidden;
  > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
`;

function Pic({ src, ...p }: { src?: string; h?: number; ratio?: string; r?: number; s?: number }) {
  return <Slot {...p}>{isSrc(src) && <img src={src} alt="" />}</Slot>;
}

// 버튼(카카오 회색 · r4 · 7/8) — col = 세로 쌓기(알림톡 · 기본 텍스트형), 아니면 가로 균등(와이드 · 캐러셀)
const Btns = styled.div<{ col?: boolean; pad?: boolean }>`
  display: flex;
  flex-direction: ${(p) => (p.col ? 'column' : 'row')};
  gap: 6px;
  width: 100%;
  ${(p) => (p.pad ? 'padding: 0 12px 12px;' : '')}
  ${(p) => (p.col ? '' : '> * { flex: 1; min-width: 0; }')}
`;

const Btn = styled.p<{ yellow?: boolean }>`
  padding: 7px 8px;
  border-radius: 4px;
  background: ${(p) => (p.yellow ? '#fee500' : color('preview-kakao-fill'))};
  font-size: 12px;
  line-height: 18px;
  font-weight: 500;
  color: ${(p) => (p.yellow ? color('preview-kakao-on-yellow') : color('text-primary'))};
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

function Buttons({ names, col, pad }: { names: string[]; col?: boolean; pad?: boolean }) {
  return (
    <Btns col={col} pad={pad}>
      {names.map((n, i) => (
        <Btn key={i}>{n || `버튼 ${i + 1}`}</Btn>
      ))}
    </Btns>
  );
}

// ── 알림톡
const Head = styled.p`
  width: 100%;
  padding: 10px 12px;
  background: #fee500;
  font-size: 12px;
  line-height: 18px;
  font-weight: 600;
  color: ${color('preview-kakao-on-yellow')};
  white-space: nowrap;
`;

const ABody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 12px;
  font-size: 12px;
  line-height: 18px;
  color: ${color('text-primary')};
  > p { white-space: pre-wrap; }
  > p[data-sub] { color: ${color('text-quaternary')}; }
  > b { font-size: 14px; line-height: 20px; font-weight: 600; }
`;

// 강조 표기형 — 보조 문구(작게 회색) 위 · 타이틀(18 Bold) 아래 · 구분선
const Emph = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  > div { display: flex; flex-direction: column; gap: 2px; }
  > div > small { font-size: 12px; line-height: 18px; color: ${color('text-quaternary')}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  > div > strong { font-size: 18px; line-height: 24px; font-weight: 700; }
`;

// 아이템 하이라이트 — 구분선 · 타이틀(14 Regular) + 설명(12 회색)
const Highlight = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  > div { display: flex; flex-direction: column; gap: 2px; }
  > div > span { font-size: 14px; line-height: 20px; }
  > div > small { font-size: 12px; line-height: 18px; color: ${color('text-quaternary')}; }
`;

// 아이템 리스트(Summary=Off) — 위아래 구분선 · 이름 72(회색) + 값(왼쪽 정렬)
const Items = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  > div { display: flex; align-items: flex-start; gap: 8px; }
  > div > span { overflow: hidden; text-overflow: ellipsis; }
  > div > span:first-of-type { flex-shrink: 0; width: 72px; color: ${color('text-quaternary')}; white-space: nowrap; }
  > div > span:last-of-type { flex: 1; min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; } /* 값 2줄 넘으면 말줄임 */
`;

const ChannelAdd = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  > p[data-sub] { color: ${color('text-quaternary')}; }
`;

const KakaoBadge = styled.span`
  position: absolute;
  top: 16px;
  right: -6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 11px;
  background: #333;
  font-size: 6px;
  line-height: 8px;
  font-weight: 700;
  color: #fff;
`;

export function AlimtalkPreview({ m }: { m: AlimtalkMessage }) {
  const add = m.templateAd;
  const addBtn = m.buttons.find((b) => b.type === '채널 추가');
  const rest = add ? m.buttons.filter((b) => b.type !== '채널 추가') : m.buttons;
  const hl = m.itemHighlight && (m.itemHighlight.title || m.itemHighlight.desc) ? m.itemHighlight : null;
  return (
    <Room>
      <Msg>
        <Sender>{SENDER}</Sender>
        <Bubble>
          <Head>알림톡 도착</Head>
          {(m.emphasis === 'IMAGE' || m.emphasis === 'ITEM_LIST') && m.templateImage && <Pic src={m.templateImage} ratio="2 / 1" />}
          <ABody>
            {m.emphasis === 'TEXT' && (
              <Emph>
                <div>
                  <small>{m.templateSubtitle || '보조 문구'}</small>
                  <strong>{m.templateTitle || '강조 표기 타이틀'}</strong>
                </div>
                <Hr />
              </Emph>
            )}
            {m.templateHeader && <b>{m.templateHeader}</b>}
            {hl && (
              <Highlight>
                <Hr />
                <div>
                  <span>{hl.title}</span>
                  <small>{hl.desc}</small>
                </div>
              </Highlight>
            )}
            {!!m.items?.length && (
              <Items>
                <Hr />
                {m.items.map((it, i) => (
                  <div key={i}>
                    <span>{it.name}</span>
                    <span>{it.desc}</span>
                  </div>
                ))}
                <Hr />
              </Items>
            )}
            <p>{m.templateContent || '내용이 여기 표시됩니다'}</p>
            {m.templateExtra && <p data-sub="">{m.templateExtra}</p>}
            {add && (
              <ChannelAdd>
                <p data-sub="">{add}</p>
                <Btn yellow>{addBtn?.name || '채널 추가'}</Btn>
              </ChannelAdd>
            )}
            {rest.length > 0 && (
              <Btns col>
                {rest.map((b, i) => (
                  <Btn key={i} yellow={b.type === '채널 추가'}>
                    {b.name}
                  </Btn>
                ))}
              </Btns>
            )}
          </ABody>
        </Bubble>
        <KakaoBadge>kakao</KakaoBadge>
      </Msg>
    </Room>
  );
}

// ── 브랜드 메시지 — 유형 5가지(기본 텍스트형 FI · 와이드 이미지형 FW · 와이드 리스트형 FL · 캐러셀 커머스형 FA · 캐러셀 피드형 FC)
export type BrandCard = { image?: string; title?: string; text?: string; price?: string; discount?: string; rate?: string; buttons: string[] };
export type BrandModel = {
  kind: 'FI' | 'FW' | 'FL' | 'FA' | 'FC';
  isAd: boolean;
  image?: string;
  text?: string;
  buttons?: string[];
  header?: string;
  items?: { image?: string; text?: string }[];
  intro?: { image?: string; title?: string; text?: string } | null;
  cards?: BrandCard[];
  more?: boolean;
  notice?: string; // M · N 타겟팅(채널 친구 아님) 무료수신거부 080 줄 — 스테이징 동작 유지
};

const BBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 12px;
  font-size: 12px;
  line-height: 18px;
  color: ${color('text-primary')};
  > p { white-space: pre-wrap; }
  > p[data-sub] { color: ${color('text-quaternary')}; }
`;

// 와이드 리스트형 — 타이틀(가운데) · 첫 항목 큰 이미지(아래 그늘 + 흰 글) · 2~4 항목 썸네일 40
const LTitle = styled.p`
  width: 100%;
  padding: 10px 12px 2px;
  font-size: 12px;
  line-height: 18px;
  font-weight: 600;
  color: ${color('text-primary')};
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 8px 12px 12px;
  > [data-row] { display: flex; align-items: center; gap: 10px; }
  > [data-row] > p { flex: 1; min-width: 0; font-size: 12px; line-height: 18px; color: ${color('text-primary')}; }
`;

const Lead = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 100%;
  height: 97px;
  border-radius: 4px;
  background: ${color('preview-kakao-fill')};
  overflow: hidden;
  > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  > i { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 55%, rgba(0, 0, 0, 0.4)); }
  > p { position: absolute; left: 10px; right: 10px; bottom: 8px; font-size: 12px; line-height: 18px; font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;

// 캐러셀 — 카드 폭 200 · 사이 8, 가로로 넘겨 봄(스크롤 막대 숨김). 더보기 = 마지막 카드 오른쪽 원형 버튼 36 + 「더보기」
const Track = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const Card = styled.div<{ stretch?: boolean }>`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 200px;
  ${(p) => (p.stretch ? 'align-self: stretch;' : '')}
  border-radius: 8px;
  background: ${color('preview-kakao-bubble')};
  overflow: hidden;
`;

const CBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding: 10px 10px 12px;
  font-size: 12px;
  line-height: 18px;
  > b { font-size: 13px; line-height: 18px; font-weight: 600; color: ${color('text-primary')}; }
  > p { color: ${color('text-tertiary')}; white-space: pre-wrap; }
  > p[data-sub] { color: ${color('text-quaternary')}; }
  > strong { font-size: 15px; line-height: 20px; font-weight: 600; color: ${color('text-primary')}; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
`;

// 커머스 상품명 · 가격(할인가 굵게 · 정상가 취소선 · 할인율 주황, 할인 없으면 정상가만)
const NamePrice = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  > p { font-size: 13px; line-height: 18px; color: ${color('text-primary')}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  > div { display: flex; align-items: baseline; gap: 4px; white-space: nowrap; }
  > div > b { font-size: 15px; line-height: 20px; font-weight: 700; color: ${color('text-primary')}; }
  > div > s { font-size: 11px; line-height: 16px; color: ${color('text-quaternary')}; }
  > div > em { font-style: normal; font-size: 11px; line-height: 16px; color: #ea580c; }
`;

const More = styled.div`
  align-self: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-left: 2px;
  padding-right: 24px; /* 끝까지 넘기면 마지막 카드가 왼쪽 끝에 — Figma More view */
  > span { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 18px; background: ${color('preview-kakao-bubble')}; box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.12); }
  > small { font-size: 11px; line-height: 14px; color: ${color('text-secondary')}; white-space: nowrap; }
`;

const won = (v: string) => Number(v).toLocaleString('ko-KR');

function Commerce({ c, first }: { c: BrandCard; first: boolean }) {
  const hasPrice = !!(c.discount || c.price);
  return (
    <Card>
      <Pic src={c.image} h={150} />
      <CBody>
        <NamePrice>
          <p>{c.title || (first ? '타이틀' : '상품명')}</p>
          {hasPrice && (
            <div>
              <b>{`${won(c.discount || c.price || '0')}원`}</b>
              {c.discount && c.price && <s>{won(c.price)}</s>}
              {c.discount && c.rate && <em>{`${c.rate}%`}</em>}
            </div>
          )}
        </NamePrice>
        <Hr />
        <p data-sub="">{c.text || (first ? '내용이 여기 표시됩니다' : '부가 정보')}</p>
        <Buttons names={c.buttons.length ? c.buttons : ['버튼 1']} />
      </CBody>
    </Card>
  );
}

function Feed({ c, first }: { c: BrandCard; first: boolean }) {
  return (
    <Card>
      <Pic src={c.image} h={150} />
      <CBody>
        <b>{c.title || '타이틀'}</b>
        <Hr />
        <p>{c.text || (first ? '내용이 여기 표시됩니다' : '내용')}</p>
        <Buttons names={c.buttons.length ? c.buttons : ['버튼 1']} />
      </CBody>
    </Card>
  );
}

export function BrandPreview({ model: b }: { model: BrandModel }) {
  const sender = `${b.isAd ? '(광고)' : ''}${SENDER}`;
  if (b.kind === 'FA' || b.kind === 'FC') {
    const cards = b.cards?.length ? b.cards : [{ buttons: [] }, { buttons: [] }];
    return (
      <Room $carousel>
        <Msg>
          <Sender>{sender}</Sender>
          <Track>
            {b.kind === 'FA' && b.intro && (
              <Card stretch>
                <Pic src={b.intro.image} h={150} />
                <CBody>
                  <strong>{b.intro.title || '타이틀'}</strong>
                  <Hr w={20} />
                  <p>{b.intro.text || '내용'}</p>
                </CBody>
              </Card>
            )}
            {cards.map((c, i) => (b.kind === 'FA' ? <Commerce key={i} c={c} first={i === 0} /> : <Feed key={i} c={c} first={i === 0} />))}
            {b.more && (
              <More>
                <span>
                  <img src="/preview/kakao-more.svg" alt="" width={18} height={18} />
                </span>
                <small>더보기</small>
              </More>
            )}
          </Track>
          {b.isAd && <OptOut w={200}>{OPT_OUT}</OptOut>}
        </Msg>
      </Room>
    );
  }
  const buttons = b.buttons ?? [];
  return (
    <Room>
      <Msg>
        <Sender>{sender}</Sender>
        <Bubble>
          {b.kind === 'FL' ? (
            <>
              <LTitle>{b.header || '타이틀'}</LTitle>
              <List>
                {(b.items?.length ? b.items : [{}, {}, {}]).map((it, i) =>
                  i === 0 ? (
                    <Lead key={i}>
                      {isSrc(it.image) && <img src={it.image} alt="" />}
                      <i />
                      <p>{it.text || '리스트 항목 1 내용'}</p>
                    </Lead>
                  ) : (
                    <div key={i} data-row="">
                      <Pic src={it.image} s={40} r={4} />
                      <p>{it.text || `리스트 항목 ${i + 1} 내용`}</p>
                    </div>
                  ),
                )}
              </List>
            </>
          ) : (
            <>
              {(b.kind === 'FW' || b.image) && <Pic src={b.image} h={b.kind === 'FW' ? 164 : 109} />}
              <BBody>
                <p>{b.text || '내용이 여기 표시됩니다'}</p>
                {b.notice && <p data-sub="">{b.notice}</p>}
              </BBody>
            </>
          )}
          {buttons.length > 0 && <Buttons names={buttons} col={b.kind === 'FI'} pad />}
        </Bubble>
        {b.isAd && <OptOut>{OPT_OUT}</OptOut>}
      </Msg>
    </Room>
  );
}

// 보낸 메시지(평평한 기록) → 미리보기 모양. 리스트형은 줄마다 항목, 캐러셀은 기록에 남은 첫 카드만.
export function FriendtalkPreview({ m, serviceNumber = '080-000-0000' }: { m: FriendtalkMessage; serviceNumber?: string }) {
  const kind = m.messageType === 'FT' ? 'FI' : m.messageType;
  const buttons = m.buttons.map((x) => x.name);
  const model: BrandModel =
    kind === 'FL'
      ? { kind, isAd: m.isAd, header: m.header, items: m.text.split('\n').map((text, i) => ({ text, image: i === 0 ? m.image : undefined })), buttons }
      : kind === 'FA' || kind === 'FC'
        ? { kind, isAd: m.isAd, cards: [{ image: m.image, title: m.header, text: m.text, buttons }] }
        : { kind, isAd: m.isAd, image: m.image, text: m.text, buttons, notice: m.targeting === 'M' || m.targeting === 'N' ? `무료수신거부 ${serviceNumber}` : undefined };
  return <BrandPreview model={model} />;
}
