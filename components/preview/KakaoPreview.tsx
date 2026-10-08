import styled from '@emotion/styled';
import type { AlimtalkMessage, FriendtalkMessage } from '@/lib/sent';

// Figma 「Alimtalk preview」(1192:23308) — 카카오 채팅 바탕 #b2c7da · 말풍선 r10 · 알림톡 머리 #fee500 · 버튼 r4.
// 카카오 고유 색이라 DS 토큰을 입히지 않음(Push preview 와 같은 규칙).
const Bg = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 24px 16px;
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  background: #b2c7da;
  > small { font-size: 12px; line-height: 18px; color: #374151; }
`;

const Bubble = styled.div`
  overflow: hidden;
  border-radius: 10px;
  background: #fff;
  > header { padding: 10px 12px; background: #fee500; font-size: 12px; line-height: 18px; font-weight: 600; color: #191919; }
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  font-size: 12px;
  line-height: 18px;
  color: #191919;
  word-break: break-all;
  white-space: pre-wrap;
  > i { display: block; height: 1px; background: #eee; }
  > b { font-size: 14px; line-height: 20px; font-weight: 600; }
  > [data-img] { height: 108px; border-radius: 6px; background: var(--bg-tertiary); }
  > [data-li] { display: flex; justify-content: space-between; white-space: nowrap; }
  > [data-li] > span:first-of-type { color: #6b7280; }
  > [data-mute] { color: #8a8a8a; }
  > [data-btn] { padding: 7px 0; border-radius: 4px; background: #f2f2f2; text-align: center; font-weight: 500; }
  > [data-btn='yellow'] { background: #fee500; }
`;

export function AlimtalkPreview({ m }: { m: AlimtalkMessage }) {
  return (
    <Bg>
      <small>플레어레인</small>
      <Bubble>
        <header>알림톡 도착</header>
        <Body>
          {m.emphasis !== 'NONE' && m.templateImage && <div data-img="" />}
          {m.templateHeader && <b>{m.templateHeader}</b>}
          {m.items && (
            <>
              <i />
              {m.items.map((it, i) => (
                <div key={i} data-li="">
                  <span>{it.name}</span>
                  <span>{it.desc}</span>
                </div>
              ))}
              <i />
            </>
          )}
          <span>{m.templateContent}</span>
          {m.templateExtra && <span>{m.templateExtra}</span>}
          {m.templateAd && <span data-mute="">{m.templateAd}</span>}
          {m.buttons.map((b, i) => (
            <div key={i} data-btn={b.type === '채널 추가' ? 'yellow' : ''}>
              {b.name}
            </div>
          ))}
        </Body>
      </Bubble>
    </Bg>
  );
}

export function FriendtalkPreview({ m, serviceNumber = '080-000-0000' }: { m: FriendtalkMessage; serviceNumber?: string }) {
  const brand = m.targeting === 'M' || m.targeting === 'N';
  return (
    <Bg>
      <small>발신 프로필</small>
      <Bubble>
        <Body>
          {m.image && <div data-img="" />}
          {m.header && <b>{m.header}</b>}
          <span>{`${m.isAd ? '(광고) ' : ''}${m.text}`}</span>
          {brand && <span data-mute="">{`무료수신거부 ${serviceNumber}`}</span>}
          {m.buttons.map((b, i) => (
            <div key={i} data-btn="">
              {b.name}
            </div>
          ))}
        </Body>
      </Bubble>
    </Bg>
  );
}
