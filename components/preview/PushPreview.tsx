import { Fragment, useState } from 'react';
import styled from '@emotion/styled';
import { color, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma `Push preview`(877:29689) — 발송 미리보기의 OS 알림 그림. 10-20 Figma 원본 값(get_design_context · 상태 모음 1610:30694)으로 다시 그림.
// 앱 푸시 = Android(삼성 One UI) · iOS(길게 눌러 펼친 모습) / 웹 푸시 = Android Chrome(「수신 거부」 늘 붙음) · Windows(Win11, 버튼 없으면 「닫기」)
// + macOS(참고용 — 캠페인 이미지 · 버튼 미지원). 그림 파일 = public/preview(Figma 에서 받은 원본 그대로).
export type PreviewOS = 'android' | 'ios' | 'android-chrome' | 'windows' | 'macos';

type Props = {
  os: PreviewOS;
  title: string;
  body: string;
  url?: string; // 웹 푸시 출처 도메인
  icon?: string; // 사이트 아이콘(웹 푸시) — 없으면 「Site icon」 자리
  image?: string; // 이미지 주소 — 있으면 이미지 칸(불러오기 전 · 실패 = 회색 자리)
  buttons?: string[]; // 최대 2
  siteIcon?: boolean; // Android Chrome · Windows 사이트 아이콘 칸(채널 설정 › 웹 푸시 › 아이콘)
};

const hostOf = (url?: string) => {
  if (!url) return 'example.com';
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
};

// ── 공통 부품
const Root = styled.div<{ h: number }>`
  position: relative;
  width: 100%;
  height: ${(p) => p.h}px;
  overflow: hidden;
  word-break: break-word;
`;

// 앱 · 사이트 아이콘 자리(`_App icon`) — 회색 상자 + 아주 작은 글자
const Ph = styled.span<{ s: number; r: number; fs: number; lh: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${(p) => p.s}px;
  height: ${(p) => p.s}px;
  padding: 0 2px;
  border-radius: ${(p) => p.r}px;
  overflow: hidden;
  background: ${color('preview-icon-placeholder')};
  font-size: ${(p) => p.fs}px;
  line-height: ${(p) => p.lh}px;
  color: ${color('text-placeholder')};
  text-align: center;
`;

function Thumb({ src, s, r, fs, lh, label }: { src?: string; s: number; r: number; fs: number; lh: number; label: string }) {
  if (src) return <img src={src} alt="" style={{ width: s, height: s, borderRadius: r, objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <Ph s={s} r={r} fs={fs} lh={lh}>
      {label}
    </Ph>
  );
}

// 이미지 칸(`_Push image`) — 회색 자리 + 가운데 이미지 아이콘 24, 이미지 주소가 있으면 위에 덮음
const Slot = styled.div<{ ratio?: string; h?: number; r: number }>`
  position: relative;
  flex-shrink: 0;
  width: 100%;
  ${(p) => (p.ratio ? `aspect-ratio: ${p.ratio};` : `height: ${p.h}px;`)}
  border-radius: ${(p) => p.r}px;
  overflow: hidden;
  background: ${color('preview-image-placeholder')};
  > img:first-of-type { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
  > img + img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
`;

function PictureInner({ src, ratio, h, r = 0 }: { src: string; ratio?: string; h?: number; r?: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <Slot ratio={ratio} h={h} r={r}>
      <img src="/preview/image.svg" alt="" width={24} height={24} />
      {!failed && <img src={src} alt="" onError={() => setFailed(true)} />}
    </Slot>
  );
}
const Picture = (p: { src: string; ratio?: string; h?: number; r?: number }) => <PictureInner key={p.src} {...p} />;

// 아래쪽 흐림(`Fade`) — 흰 바탕을 Figma 마스크(위 투명 → 아래 불투명)로
const Fade = styled.i`
  position: absolute;
  left: 0;
  right: 0;
  top: 300px;
  height: 120px;
  background: ${color('bg-primary')};
  -webkit-mask: url(/preview/fade.svg) 0 0 / 100% 100% no-repeat;
  mask: url(/preview/fade.svg) 0 0 / 100% 100% no-repeat;
  pointer-events: none;
`;

// ── 휴대폰 틀(Android · iOS)
const SideBtn = styled.i<{ side: 'left' | 'right'; top: number; h: number }>`
  position: absolute;
  ${(p) => p.side}: 5px;
  top: ${(p) => p.top}px;
  width: 4px;
  height: ${(p) => p.h}px;
  border-radius: 2px;
  background: ${color('border-primary')};
`;

const PhoneBody = styled.i<{ r: number }>`
  position: absolute;
  left: 8px;
  right: 8px;
  top: 8px;
  height: 620px;
  border: 1.5px solid ${color('border-secondary')};
  border-radius: ${(p) => p.r}px;
  background: ${color('bg-primary')};
`;

const Screen = styled.div<{ r: number }>`
  position: absolute;
  left: 16px;
  right: 16px;
  top: 16px;
  height: 604px;
  border-radius: ${(p) => p.r}px;
  overflow: hidden;
  background: linear-gradient(to bottom, ${color('preview-device-screen-start')}, ${color('preview-device-screen-end')});
`;

const Clock = styled.b<{ left: number; top: number; fs: number }>`
  position: absolute;
  left: ${(p) => p.left}px;
  top: ${(p) => p.top}px;
  font-size: ${(p) => p.fs}px;
  font-weight: 600;
  line-height: normal;
  color: ${color('text-primary')};
  white-space: nowrap;
`;

// 상태 표시줄 조각(배터리 · 신호) — right/top 기준 절대 위치
const Mark = styled.i<{ right: number; top: number; w: number; h: number; r: number; outline?: boolean }>`
  position: absolute;
  right: ${(p) => p.right}px;
  top: ${(p) => p.top}px;
  width: ${(p) => p.w}px;
  height: ${(p) => p.h}px;
  border-radius: ${(p) => p.r}px;
  ${(p) => (p.outline ? `border: 1px solid ${color('fg-primary')};` : `background: ${color('fg-primary')};`)}
`;

type MarkSpec = [right: number, top: number, w: number, h: number, r: number, outline?: boolean];
const ANDROID_MARKS: MarkSpec[] = [
  [20, 11, 20, 10, 2.5, true], // 배터리
  [24, 13, 14, 6, 1], // 잔량
  [17.5, 14, 1.5, 4, 1], // 단자
  [57.4, 18, 2.6, 3, 1], // 신호
  [53.6, 15.8, 2.6, 5.2, 1],
  [49.8, 13.6, 2.6, 7.4, 1],
  [46, 11.4, 2.6, 9.6, 1],
];
const IOS_MARKS: MarkSpec[] = [
  [30, 19, 25, 12, 3.5, true],
  [34, 21, 19, 8, 2],
  [27.5, 23, 1.5, 4, 1],
  [76, 28, 3, 3, 1],
  [71.5, 25.8, 3, 5.2, 1],
  [67, 23.6, 3, 7.4, 1],
  [62.5, 21.4, 3, 9.6, 1],
];
const Marks = ({ list }: { list: MarkSpec[] }) => (
  <>
    {list.map(([right, top, w, h, r, outline], i) => (
      <Mark key={i} right={right} top={top} w={w} h={h} r={r} outline={outline} />
    ))}
  </>
);

function AndroidPhone() {
  return (
    <>
      <SideBtn side="right" top={130} h={48} />
      <SideBtn side="right" top={196} h={72} />
      <PhoneBody r={30} />
      <Screen r={24}>
        <Clock left={22} top={9} fs={12}>
          11:40
        </Clock>
        <Marks list={ANDROID_MARKS} />
        <img src="/preview/camera.svg" alt="" width={11} height={11} style={{ position: 'absolute', left: '50%', top: 10, transform: 'translateX(-50%)' }} />
      </Screen>
    </>
  );
}

const Island = styled.i`
  position: absolute;
  left: 50%;
  top: 14px;
  width: 76px;
  height: 22px;
  border-radius: 14px;
  transform: translateX(-50%);
  background: ${color('preview-device-camera')};
`;

function IPhone() {
  return (
    <>
      <SideBtn side="left" top={96} h={24} />
      <SideBtn side="left" top={140} h={44} />
      <SideBtn side="left" top={194} h={44} />
      <SideBtn side="right" top={150} h={70} />
      <PhoneBody r={42} />
      <Screen r={34}>
        <Clock left={32} top={16} fs={15}>
          11:40
        </Clock>
        <Marks list={IOS_MARKS} />
        <Island />
      </Screen>
    </>
  );
}

// ── Android 알림(앱 푸시 · Chrome 공용)
const ACard = styled.div`
  position: absolute;
  left: 24px;
  right: 24px;
  top: 58px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 12px;
  border-radius: 20px;
  background: ${color('preview-android-notification')};
  box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

const ATop = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  > img { flex-shrink: 0; }
`;

const AContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
`;

const AHead = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  overflow: hidden;
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
  > b { flex-shrink: 0; font-weight: 600; color: ${color('text-secondary')}; }
  > span { flex-shrink: 0; color: ${color('text-quaternary')}; }
  > em { flex-shrink: 0; max-width: 57px; overflow: hidden; text-overflow: ellipsis; font-style: normal; color: ${color('text-quaternary')}; }
`;

const NTitle = styled.p`
  margin: 0;
  width: 100%;
  font-size: 13px;
  line-height: 18px;
  font-weight: 600;
  color: ${color('text-primary')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NBody = styled.p`
  margin: 0;
  width: 100%;
  font-size: 13px;
  line-height: 18px;
  color: ${color('text-tertiary')};
`;

// 버튼 줄 — 카드 폭 균등 분할 · 가운데 · 세로 구분선(1 × 16)
const ARow = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding-top: 4px;
`;

const ACell = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  > i { flex-shrink: 0; width: 1px; height: 16px; background: ${color('preview-android-divider')}; }
  > span { flex: 1; min-width: 0; font-size: 13px; line-height: 18px; font-weight: 600; color: ${color('text-primary')}; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;

const ChromeBadge = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background: #2563eb; /* Figma blue 600 — Chrome 표시 원(브랜드 색, 토큰 대상 아님) */
`;

function Android({ chrome, title, body, host, icon, image, buttons, siteIcon }: { chrome: boolean; title: string; body: string; host: string; icon?: string; image?: string; buttons: string[]; siteIcon: boolean }) {
  return (
    <Root h={420}>
      <AndroidPhone />
      <ACard>
        <ATop>
          {chrome ? (
            <ChromeBadge>
              <img src="/preview/chrome-glyph.svg" alt="" width={15} height={15} />
            </ChromeBadge>
          ) : (
            <Thumb s={24} r={12} fs={5} lh={6.9} label="App icon" />
          )}
          <AContent>
            <AHead>
              <b>{chrome ? 'Chrome' : '앱 이름'}</b>
              {chrome && <em>{host}</em>}
              <span>오전 11:40</span>
            </AHead>
            <NTitle>{title}</NTitle>
            <NBody>{body}</NBody>
          </AContent>
          {chrome && siteIcon && <Thumb src={icon} s={28} r={6} fs={5} lh={6.9} label="Site icon" />}
          <img src={chrome ? '/preview/chrome-chevron.svg' : '/preview/android-chevron.svg'} alt="" width={16} height={16} />
        </ATop>
        {image && (
          <div style={{ width: '100%', paddingLeft: 32 }}>
            <Picture src={image} ratio="2 / 1" r={12} />
          </div>
        )}
        {(chrome || buttons.length > 0) && (
          <ARow>
            {buttons.map((b, i) => (
              <ACell key={i}>
                {i > 0 && <i />}
                <span>{b}</span>
              </ACell>
            ))}
            {chrome && (
              <ACell>
                {buttons.length > 0 && <i />}
                <span>수신 거부</span>
              </ACell>
            )}
          </ARow>
        )}
      </ACard>
      <Fade />
    </Root>
  );
}

// ── iOS(길게 눌러 펼친 모습)
const IDim = styled.i`
  position: absolute;
  left: 16px;
  right: 16px;
  top: 16px;
  height: 604px;
  border-radius: 34px;
  background: rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(1px);
`;

const IStack = styled.div`
  position: absolute;
  left: 24px;
  right: 24px;
  top: 72px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
`;

const ICard = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  border-radius: 16px;
  background: ${color('preview-apple-notification')};
  box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

const IMain = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
`;

const IHead = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
  overflow: hidden;
  > p { flex: 1; min-width: 0; }
  > span { flex-shrink: 0; ${text('text-xs', 'regular')}; color: ${color('text-quaternary')}; white-space: nowrap; }
`;

const IMenu = styled.div`
  display: flex;
  flex-direction: column;
  width: 200px;
  border-radius: 12px;
  background: ${color('preview-apple-notification')};
  box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  > i { height: 1px; background: ${color('preview-apple-separator')}; }
  > p { margin: 0; padding: 9px 14px; font-size: 13px; line-height: 18px; color: ${color('text-primary')}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;

function IOS({ title, body, image, buttons }: { title: string; body: string; image?: string; buttons: string[] }) {
  return (
    <Root h={420}>
      <IPhone />
      <IDim />
      <Fade />
      <IStack>
        <ICard>
          {image && <Picture src={image} ratio="2 / 1" />}
          <IMain>
            <Thumb s={36} r={8} fs={6} lh={7.5} label="App icon" />
            <AContent>
              <IHead>
                <NTitle>{title}</NTitle>
                <span>지금</span>
              </IHead>
              <NBody>{body}</NBody>
            </AContent>
          </IMain>
        </ICard>
        {buttons.length > 0 && (
          <IMenu>
            {buttons.map((b, i) => (
              <Fragment key={i}>
                {i > 0 && <i />}
                <p>{b}</p>
              </Fragment>
            ))}
          </IMenu>
        )}
      </IStack>
    </Root>
  );
}

// ── Windows(Win11 알림)
const WRoot = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
  height: 420px;
  overflow: hidden;
  border-bottom-right-radius: 4px;
  background: linear-gradient(119.74deg, ${color('preview-windows-wallpaper-start')} 7.14%, ${color('preview-windows-wallpaper-end')} 78.57%);
  word-break: break-word;
`;

const WToast = styled.div`
  display: flex;
  flex-direction: column;
  width: calc(100% - 24px);
  border-radius: 6px;
  background: ${color('preview-windows-toast')};
  box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.12);
  overflow: hidden;
`;

const WContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px 14px;
`;

const WHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  > img { flex-shrink: 0; }
  > span { flex: 1; min-width: 0; ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
`;

const WMain = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const WDomain = styled.p`
  margin: 0;
  ${text('text-xs', 'regular')};
  color: ${color('text-quaternary')};
`;

const WActions = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding-top: 4px;
  > span { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; height: 32px; border: 1px solid ${color('preview-windows-stroke')}; border-radius: 4px; background: ${color('preview-windows-button')}; font-size: 13px; line-height: 18px; color: ${color('text-primary')}; white-space: nowrap; overflow: hidden; }
`;

// 작업 표시줄 — 위 1px 선은 안쪽 그림자로(Figma 안쪽 선이라 자식 위치가 바깥 기준)
const Taskbar = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 100%;
  height: 34px;
  background: ${color('preview-windows-taskbar')};
  box-shadow: inset 0 1px 0 ${color('preview-windows-stroke')};
  > b { position: absolute; transform: translateX(100%); font-size: 9px; line-height: 12px; font-weight: 400; color: ${color('text-primary')}; white-space: nowrap; }
`;

function Windows({ title, body, host, icon, image, buttons, siteIcon }: { title: string; body: string; host: string; icon?: string; image?: string; buttons: string[]; siteIcon: boolean }) {
  return (
    <WRoot>
      <WToast>
        {image && <Picture src={image} h={140} />}
        <WContent>
          <WHead>
            <img src="/preview/chrome-logo-16.svg" alt="" width={16} height={16} />
            <span>Google Chrome</span>
            <img src="/preview/win-more.svg" alt="" width={14} height={14} />
            <img src="/preview/win-close.svg" alt="" width={14} height={14} />
          </WHead>
          <WMain>
            {siteIcon && <Thumb src={icon} s={48} r={0} fs={7} lh={8.6} label="Site icon" />}
            <AContent>
              <NTitle>{title}</NTitle>
              <NBody>{body}</NBody>
            </AContent>
          </WMain>
          <WDomain>{host}</WDomain>
          <WActions>{buttons.length ? buttons.map((b, i) => <span key={i}>{b}</span>) : <span>닫기</span>}</WActions>
        </WContent>
      </WToast>
      <Taskbar>
        <b style={{ right: 49, top: 4 }}>오전 11:40</b>
        <b style={{ right: 61, top: 16 }}>2026-09-30</b>
        <img src="/preview/win-wifi.svg" alt="" width={9} height={7} style={{ position: 'absolute', right: 93, top: 12 }} />
        <Mark right={74} top={12} w={12} h={7} r={1.5} outline />
        <Mark right={77.5} top={13.5} w={7} h={4} r={0.4} />
      </Taskbar>
    </WRoot>
  );
}

// ── macOS(참고용 — 캠페인 이미지 · 버튼 미지원, 시간 표시 없음)
const MRoot = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  border-top-right-radius: 12px;
  background: linear-gradient(140.19deg, ${color('preview-macos-wallpaper-start')} 7.14%, ${color('preview-macos-wallpaper-end')} 78.57%);
  word-break: break-word;
`;

const MBar = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 24px;
  background: ${color('preview-macos-menubar')};
  > b { position: absolute; right: 78px; top: 5px; transform: translateX(100%); font-size: 11px; line-height: 14px; font-weight: 400; color: ${color('text-primary')}; white-space: nowrap; }
`;

const MControl = styled.i`
  position: absolute;
  right: 88px;
  top: 7px;
  width: 12px;
  height: 10px;
  overflow: hidden;
  &::before, &::after { content: ''; position: absolute; left: 0; width: 12px; height: 4px; border-radius: 2px; background: ${color('fg-primary')}; }
  &::before { top: 0; }
  &::after { top: 6px; }
`;

const MCard = styled.div`
  position: absolute;
  left: 12px;
  right: 12px;
  top: 34px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: ${color('preview-apple-notification')};
  box-shadow: inset 0 0 0 1px ${color('preview-apple-separator')}, ${shadow.lg};
  overflow: hidden;
`;

const MIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 7px;
  background: ${color('preview-apple-notification')};
`;

const MDomain = styled.p`
  margin: 0;
  ${text('text-xs', 'semibold')};
  color: ${color('text-primary')};
`;

function MacOS({ title, body, host }: { title: string; body: string; host: string }) {
  return (
    <MRoot>
      <MBar>
        <Mark right={133} top={8} w={17} h={8} r={2} outline />
        <Mark right={137.5} top={9.5} w={11} h={5} r={1} />
        <img src="/preview/mac-wifi.svg" alt="" width={13} height={10} style={{ position: 'absolute', right: 110, top: 7 }} />
        <MControl />
        <b>(수) 오전 11:40</b>
      </MBar>
      <MCard>
        <MIcon>
          <img src="/preview/chrome-logo.svg" alt="" width={26} height={26} />
        </MIcon>
        <AContent>
          <NTitle>{title}</NTitle>
          <MDomain>{host}</MDomain>
          <NBody>{body}</NBody>
        </AContent>
      </MCard>
    </MRoot>
  );
}

export default function PushPreview({ os, title, body, url, icon, image, buttons = [], siteIcon = true }: Props) {
  const t = title || '제목이 여기 표시됩니다';
  const b = body || '내용이 여기 표시됩니다';
  const host = hostOf(url);
  const btns = buttons.slice(0, 2).map((x, i) => x || `버튼 ${i + 1}`);
  const img = image || undefined;
  if (os === 'ios') return <IOS title={t} body={b} image={img} buttons={btns} />;
  if (os === 'windows') return <Windows title={t} body={b} host={host} icon={icon} image={img} buttons={btns} siteIcon={siteIcon} />;
  if (os === 'macos') return <MacOS title={t} body={b} host={host} />;
  return <Android chrome={os === 'android-chrome'} title={t} body={b} host={host} icon={icon} image={img} buttons={btns} siteIcon={siteIcon} />;
}
