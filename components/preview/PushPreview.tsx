import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { color } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma `Push preview`(877:29689) — OS 알림 그림. 알림 카드는 OS 모양(브랜드색·DS radius 안 씀), 틀만 중립 토큰.
// mobile = Android Chrome 기기 틀 · desktop = Windows / macOS 알림 카드.
export type PreviewOS = 'android' | 'windows' | 'macos';

const Frame = styled.div`
  position: relative;
  height: 420px;
  overflow: hidden;
`;

const Body = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  height: 620px;
  border: 1.5px solid ${color('border-secondary')};
  border-radius: 30px;
  background: ${color('bg-primary')};
`;

const Screen = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  height: 604px;
  border-radius: 24px;
  background: linear-gradient(to bottom, #eceff4, #f6f7f9);
  overflow: hidden;
  > b { position: absolute; left: 22px; top: 9px; font: 600 12px/normal Pretendard, sans-serif; color: ${color('text-primary')}; }
  > i { position: absolute; left: 50%; top: 10px; width: 11px; height: 11px; margin-left: -5.5px; border-radius: 50%; background: #111827; }
`;

const Side = styled.i<{ top: number; h: number }>`
  position: absolute;
  right: 5px;
  top: ${(p) => p.top}px;
  width: 4px;
  height: ${(p) => p.h}px;
  border-radius: 2px;
  background: #d1d6db;
`;

const Status = styled.span`
  position: absolute;
  top: 11px;
  right: 20px;
  display: flex;
  align-items: flex-end;
  gap: 1.2px;
  > i { width: 2.6px; border-radius: 1px; background: #111827; }
  > span { margin-left: 6px; width: 20px; height: 10px; padding: 1px; border: 1px solid rgba(17, 24, 39, 0.4); border-radius: 2.5px; }
  > span::after { content: ''; display: block; width: 14px; height: 6px; border-radius: 1px; background: #111827; }
`;

const Card = styled.div`
  position: absolute;
  top: 58px;
  left: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 16px;
  background: ${color('bg-primary')};
  box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

const CardHead = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  ${text('text-xs', 'regular')};
  color: ${color('text-quaternary')};
  white-space: nowrap;
  > span:nth-of-type(2) { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  > span:last-of-type { display: inline-flex; color: ${color('fg-quaternary')}; }
`;

const AppIcon = styled.span<{ src?: string; size: number }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${(p) => p.size}px;
  height: ${(p) => p.size}px;
  border-radius: 6px;
  background: ${(p) => (p.src ? `center / cover no-repeat url(${p.src})` : color('utility-neutral-200'))};
  color: ${color('fg-quaternary')};
`;

const Title = styled.p`
  margin: 0;
  ${text('text-sm', 'semibold')};
  color: ${color('text-primary')};
  word-break: break-all;
`;

const Msg = styled.p`
  margin: 0;
  ${text('text-sm', 'regular')};
  color: ${color('text-tertiary')};
  word-break: break-all;
`;

const Fade = styled.i`
  position: absolute;
  top: 300px;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0), ${color('bg-primary')});
`;

// 데스크탑 — 바탕화면 위 알림 카드
const Desk = styled.div<{ os: PreviewOS }>`
  position: relative;
  height: 420px;
  border-radius: 12px;
  background: linear-gradient(160deg, #e8ecf3, #f6f7f9);
  overflow: hidden;
  > div {
    position: absolute;
    ${(p) => (p.os === 'macos' ? 'top: 16px;' : 'bottom: 16px;')}
    left: 16px;
    right: 16px;
    display: flex;
    gap: 12px;
    padding: 12px 14px;
    border-radius: ${(p) => (p.os === 'macos' ? 14 : 8)}px;
    background: ${(p) => (p.os === 'macos' ? 'rgba(255,255,255,0.86)' : color('bg-primary'))};
    box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.12);
  }
  > div > div { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  > div small { ${text('text-xs', 'regular')}; color: ${color('text-quaternary')}; }
`;

export default function PushPreview({ os, title, body, url, icon }: { os: PreviewOS; title: string; body: string; url: string; icon?: string }) {
  const host = (() => {
    try {
      return new URL(url).host;
    } catch {
      return url;
    }
  })();
  if (os !== 'android')
    return (
      <Desk os={os}>
        <div>
          <AppIcon src={icon} size={40}>
            {!icon && <Icon name="web_asset" size={20} />}
          </AppIcon>
          <div>
            <small>{os === 'macos' ? `Google Chrome · ${host}` : `Google Chrome · ${host}`}</small>
            <Title>{title}</Title>
            <Msg>{body}</Msg>
          </div>
        </div>
      </Desk>
    );
  return (
    <Frame>
      <Side top={130} h={48} />
      <Side top={196} h={72} />
      <Body />
      <Screen>
        <b>12:30</b>
        <i />
        <Status>
          <i style={{ height: 3 }} />
          <i style={{ height: 5.2 }} />
          <i style={{ height: 7.4 }} />
          <i style={{ height: 9.6 }} />
          <span />
        </Status>
      </Screen>
      <Card>
        <CardHead>
          <AppIcon src={icon} size={16} />
          <span>{`Chrome · ${host} · now`}</span>
          <span>
            <Icon name="keyboard_arrow_down" size={16} />
          </span>
        </CardHead>
        <Title>{title}</Title>
        <Msg>{body}</Msg>
      </Card>
      <Fade />
    </Frame>
  );
}
