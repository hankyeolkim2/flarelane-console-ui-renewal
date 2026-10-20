import { useRef, useState, type ReactNode } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ButtonGroup from '@/components/ui/ButtonGroup';
import Checkbox from '@/components/ui/Checkbox';
import { Dialog } from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Slider from '@/components/ui/Slider';
import TextField from '@/components/ui/TextField';
import Toggle from '@/components/ui/Toggle';
import { HoverTip } from '@/components/ui/Tooltip';
import { Card, CardFoot, CardHead, ChannelShell, Field, Help } from '@/components/channel/ChannelShell';
import PushPreview, { type PreviewOS } from '@/components/preview/PushPreview';
import { useStore } from '@/lib/store';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma 「채널 — 웹 푸시 설정 (수정 중) — 1440」(1248:2037) 모양 + docs/staging-behavior-channel.md 「웹 푸시 · 연동됨 화면」 동작.
// 스테이징 프로젝트는 연동됨 + nativePromptConfig.active = true 라 팝업 설정 카드는 숨김.
// 카드마다 「수정」 → 「취소」 · 「저장」, 위젯 「활성화」 토글은 수정 모드와 상관없이 누르는 즉시 저장. 저장 성공 토스트 없음 · 입력값 검사 없음.
const SITE = 'https://junyeongchoi.github.io/';
const PROJECT_ID = '7e1a3c2b-4f5d-4c3a-9b8e-2d1f0a6c5e4b';
const SDK = `<script src="https://cdn.flarelane.com/WebSDK.js" charset="UTF-8"></script>\n<script> FlareLane.initialize({ projectId: "${PROJECT_ID}" }); </script>`;
const HOSTED = /imagedelivery\.net/;
const PLAN: 'STARTER' | 'TEAM' | 'BUSINESS' = 'BUSINESS';

const Cols = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(320px, 32%, 352px);
  gap: 32px;
  align-items: start;
`;

const Left = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
`;

const PreviewBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 23px 15px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  background: ${color('bg-primary')};
  box-shadow: 0px 1px 1px #0000000d;
`;

const Label = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// Figma `Horizontal tabs` (button border) — 바탕 bg-secondary_alt, 선택 = bg-primary_alt + border-primary + shadow-xs
const SegTabs = styled.div`
  flex: 1;
  display: flex;
  gap: 2px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.md}px;
  background: ${color('bg-secondary_alt')};
  > button { flex: 1; height: 36px; margin: -1px 0; padding: 0 10px; border: 1px solid transparent; border-radius: ${radius.md}px; background: transparent; ${text('text-sm', 'semibold')}; color: ${color('text-quaternary')}; cursor: pointer; }
  > button:first-of-type { margin-left: -1px; }
  > button:last-of-type { margin-right: -1px; }
  > button[aria-pressed='true'] { border-color: ${color('border-primary')}; background: ${color('bg-primary_alt')}; color: ${color('text-secondary')}; box-shadow: 0px 1px 2px 0px #0000000d; }
  > button:hover:not([aria-pressed='true']) { color: ${color('text-tertiary')}; }
`;

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 20px;
  border-radius: ${radius.lg}px;
  background: ${color('bg-secondary')};
`;

const Swatch = styled.label<{ c: string; $on: boolean }>`
  position: relative;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.md}px;
  background: ${(p) => p.c};
  cursor: ${(p) => (p.$on ? 'pointer' : 'default')};
  > input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: inherit; }
`;

const CheckLabel = styled.label<{ $disabled: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
  cursor: ${(p) => (p.$disabled ? 'default' : 'pointer')};
  opacity: ${(p) => (p.$disabled ? 0.5 : 1)};
`;

const Browser = styled.div`
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  background: ${color('bg-primary')};
  overflow: hidden;
  > div:first-of-type { display: flex; align-items: center; gap: 6px; padding: 10px 12px; background: ${color('bg-secondary')}; }
  > div:first-of-type > i { width: 8px; height: 8px; border-radius: 50%; background: ${color('fg-quaternary')}; }
  > div:first-of-type > span { flex: 1; min-width: 0; padding: 3px 10px; border-radius: 6px; background: ${color('bg-primary')}; ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  > div:last-of-type { position: relative; height: 200px; }
`;

const Widget = styled.span`
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  box-shadow: 0px 1px 2px 0px #0000000d;
  color: ${color('fg-white')};
  transition: all 0.15s ease;
`;

const Paths = styled.textarea`
  width: 100%;
  min-height: 36px;
  padding: 7px 11px;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.md}px;
  background: ${color('bg-primary')};
  box-shadow: 0px 1px 2px 0px #0000000d;
  ${text('text-sm', 'regular')};
  color: ${color('text-primary')};
  resize: vertical;
  outline: none;
  &:focus { border-color: ${color('border-brand')}; box-shadow: inset 0 0 0 1px ${color('border-brand')}, 0px 1px 2px 0px #0000000d; }
  &:read-only { background: ${color('bg-secondary')}; box-shadow: none; resize: none; }
`;

const Uploaded = styled.span`
  flex: 1;
  min-width: 0;
  ${text('text-sm', 'medium')};
  color: ${color('text-brand-secondary')};
  > span { margin-left: 6px; color: ${color('text-tertiary')}; font-weight: 400; }
`;

const Code = styled.button`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.md}px;
  background: ${color('bg-secondary')};
  text-align: left;
  cursor: pointer;
  > pre { flex: 1; min-width: 0; margin: 0; font: 400 12px/18px ui-monospace, SFMono-Regular, Menlo, monospace; color: ${color('text-secondary')}; white-space: pre-wrap; word-break: break-all; }
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  &:hover > span { color: ${color('fg-quaternary_hover')}; }
`;

const Step = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  > h4 { margin: 0; ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  > p { margin: 0; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
  > p a { color: ${color('text-brand-secondary')}; display: inline-flex; align-items: center; gap: 2px; }
`;

const Alert = styled.div`
  display: flex;
  gap: 16px;
  padding: 15px;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.xl}px;
  background: ${color('bg-primary_alt')};
  > span { display: inline-flex; color: ${color('fg-brand-primary')}; }
  > div > b { display: block; ${text('text-sm', 'semibold')}; color: ${color('text-secondary')}; }
  > div > p { margin: 4px 0 0; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
  a { color: inherit; }
`;

function F({ label, help, children }: { label: string; help?: ReactNode; children: ReactNode }) {
  return (
    <Field>
      <Label>
        {label}
        {help && <Help>{help}</Help>}
      </Label>
      {children}
    </Field>
  );
}

// 이미지 입력칸 — 파일을 골랐거나 호스팅 주소면 「업로드됨」 · 읽기 전용 + X, 아니면 URL 직접 입력 + 「업로드」(값 있으면 「이미지 변경」)
type Img = { url: string; file?: string };
function ImageInput({ value, editing, onChange }: { value: Img; editing: boolean; onChange: (v: Img) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const locked = !!value.file || HOSTED.test(value.url);
  const shown = locked ? '업로드됨' : value.url;
  const field = <TextField readOnly={!editing || locked} placeholder="이미지 파일을 업로드하세요 (192×192 권장)" value={shown} onChange={(e) => onChange({ url: e.target.value })} />;
  const tipped = /^(https:|data:)/.test(value.url) ? (
    <HoverTip content={<img src={value.url} alt="" style={{ display: 'block', maxWidth: 160, maxHeight: 160 }} />}>
      <div style={{ flex: 1, minWidth: 0 }}>{field}</div>
    </HoverTip>
  ) : (
    <div style={{ flex: 1, minWidth: 0 }}>{field}</div>
  );
  return (
    <Row>
      {tipped}
      {editing &&
        (locked ? (
          <Button icon="close" aria-label="이미지 비우기" onClick={() => onChange({ url: '' })} />
        ) : (
          <>
            <Button iconLeading="upload" onClick={() => ref.current?.click()}>{value.url ? '이미지 변경' : '업로드'}</Button>
            <input
              ref={ref}
              type="file"
              hidden
              accept="image/jpg,image/jpeg,image/png"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f) return;
                const r = new FileReader();
                r.onload = () => onChange({ url: String(r.result), file: f.name });
                r.readAsDataURL(f);
              }}
            />
          </>
        ))}
    </Row>
  );
}

function useCard<T>(initial: T) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(false);
  return {
    saved,
    draft,
    editing,
    v: editing ? draft : saved,
    set: (patch: Partial<T>) => setDraft((d) => ({ ...d, ...patch })),
    edit: () => { setDraft(saved); setEditing(true); },
    cancel: () => { setDraft(saved); setEditing(false); },
    commit: (over?: Partial<T>) => { const next = { ...draft, ...over }; setSaved(next); setDraft(next); setEditing(false); },
    patchSaved: (patch: Partial<T>) => { setSaved((s) => ({ ...s, ...patch })); setDraft((d) => ({ ...d, ...patch })); },
  };
}

function Foot({ editing, onEdit, onCancel, onSave }: { editing: boolean; onEdit: () => void; onCancel: () => void; onSave: () => void }) {
  return (
    <CardFoot>
      {editing ? (
        <>
          <Button size="md" onClick={onCancel}>취소</Button>
          <Button hierarchy="primary" size="md" onClick={onSave}>저장</Button>
        </>
      ) : (
        <Button hierarchy="primary" size="md" onClick={onEdit}>수정</Button>
      )}
    </CardFoot>
  );
}

type Device = 'desktop' | 'mobile';
type Pos = 'left' | 'right';
type WidgetCfg = {
  active: boolean;
  color: string;
  hideIfMobile: boolean;
  allowedPaths: string;
  desktop: { size: number; position: Pos; h: number; v: number; image: Img };
  mobile: { size: number; position: Pos; h: number; v: number; image: Img };
};

export default function WebPushChannel() {
  const { toast } = useStore();
  const [howTo, setHowTo] = useState(false);
  const [invite, setInvite] = useState('');
  const [pv, setPv] = useState<{ tab: Device; desktopOs: PreviewOS }>({ tab: 'mobile', desktopOs: 'windows' });
  const [wDevice, setWDevice] = useState<Device>('desktop');

  const basic = useCard({
    siteName: SITE,
    icon: { url: '' } as Img,
    badge: { url: '' } as Img,
    welcomeActive: true,
    welcomeBody: '구독 완료 >_-',
    hidePromotion: true,
  });
  const widget = useCard<WidgetCfg>({
    active: true,
    color: '#000000',
    hideIfMobile: false,
    allowedPaths: '/*',
    desktop: { size: 1, position: 'right', h: 15, v: 15, image: { url: 'https://imagedelivery.net/fl/widget-image.png', file: 'widget-image.png' } },
    mobile: { size: 1, position: 'right', h: 15, v: 15, image: { url: '' } },
  });

  const b = basic.v;
  const w = widget.v;
  const wd = w[wDevice];
  const setWd = (patch: Partial<WidgetCfg['desktop']>) => widget.set({ [wDevice]: { ...widget.draft[wDevice], ...patch } } as Partial<WidgetCfg>);
  const hasCustom = !!wd.image.url;

  const save = <T,>(card: { commit: (over?: Partial<T>) => void }, imgs: Img[], over?: Partial<T>) => {
    // 스테이징: 실제 업로드는 저장 때 — 3MB 초과면 토스트 후 저장 중단
    if (imgs.some((i) => i.file && i.url.length * 0.75 > 3 * 1024 * 1024)) return toast('이미지 크기가 너무 큽니다. (3MB 이하 허용)');
    card.commit(over);
  };

  const copy = () =>
    navigator.clipboard?.writeText(SDK).then(
      () => toast('클립보드에 복사되었습니다.'),
      () => toast('클립보드로 복사하는 데 실패했습니다.'),
    );
  const downloadSw = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['importScripts("https://cdn.flarelane.com/ServiceWorker.js");'], { type: 'text/javascript' }));
    a.download = 'sw.js';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const os: PreviewOS = pv.tab === 'mobile' ? 'android' : pv.desktopOs;
  const origin = new URL(SITE).origin;

  return (
    <ChannelShell current="web" title="웹 푸시 설정" actions={<Button size="md" onClick={() => setHowTo(true)}>연동 방법</Button>}>
      <Card>
        <CardHead title="기본 설정" />
        <Cols>
          <Left>
            <F label="사이트명" help="메시지에 제목이 없는 경우 사이트명으로 대체됩니다.">
              <TextField readOnly={!basic.editing} value={b.siteName} onChange={(e) => basic.set({ siteName: e.target.value })} />
            </F>
            <F label="사이트 URL (최초 설정 후 변경 불가)" help="플레어레인이 연동되는 정확한 사이트 주소를 입력합니다.">
              <TextField disabled value={SITE} readOnly />
            </F>
            <F label="아이콘">
              <ImageInput value={b.icon} editing={basic.editing} onChange={(icon) => basic.set({ icon })} />
            </F>
            <F
              label="배지 (안드로이드)"
              help={
                <>
                  안드로이드 상단 알림바에 표시되는 아이콘입니다. 자세한 내용은{' '}
                  <a href="https://docs.flarelane.co.kr/web-push-integration" target="_blank" rel="noreferrer">웹 푸시 가이드</a>를 참고하세요.
                </>
              }
            >
              <ImageInput value={b.badge} editing={basic.editing} onChange={(badge) => basic.set({ badge })} />
            </F>
            <F label="구독 완료 시 메시지">
              <Row style={{ gap: 12 }}>
                <Toggle label="구독 완료 시 메시지" checked={b.welcomeActive} disabled={!basic.editing} onChange={(welcomeActive) => basic.set({ welcomeActive })} />
                <TextField readOnly={!basic.editing} value={b.welcomeBody} onChange={(e) => basic.set({ welcomeBody: e.target.value })} />
              </Row>
            </F>
            <Field>
              <Label>
                &apos;플레어레인 이용중&apos; 로고 삭제
                {PLAN === ('STARTER' as string) && (
                  <HoverTip content="플랜 업그레이드 필요">
                    <a href="https://flarelane.com/ko/pricing" target="_blank" rel="noreferrer" style={{ display: 'inline-flex' }}>
                      <Badge color="brand">UPGRADE</Badge>
                    </a>
                  </HoverTip>
                )}
              </Label>
              <Toggle label="'플레어레인 이용중' 로고 삭제" checked={b.hidePromotion} disabled={!basic.editing || PLAN === ('STARTER' as string)} onChange={(hidePromotion) => basic.set({ hidePromotion })} />
            </Field>
          </Left>
          <PreviewBox>
            <Label>
              미리보기
              <Help>실제 화면은 기기 · 브라우저에 따라 다르게 보일 수 있습니다.</Help>
            </Label>
            <Row>
              <SegTabs>
                {(['mobile', 'desktop'] as const).map((t) => (
                  <button key={t} type="button" aria-pressed={pv.tab === t} onClick={() => setPv({ ...pv, tab: t })}>
                    {t === 'mobile' ? '모바일' : '데스크탑'}
                  </button>
                ))}
              </SegTabs>
              <div style={{ flex: 1 }}>
                {pv.tab === 'mobile' ? (
                  <Select width="100%" value="android" options={[{ value: 'android', label: 'Android' }]} onChange={() => undefined} />
                ) : (
                  <Select<PreviewOS>
                    width="100%"
                    value={pv.desktopOs}
                    options={[
                      { value: 'windows', label: 'Windows' },
                      { value: 'macos', label: 'Mac OS' },
                    ]}
                    onChange={(v) => setPv({ ...pv, desktopOs: v })}
                  />
                )}
              </div>
            </Row>
            <PushPreview os={os} title={b.siteName} body={b.welcomeBody} url={SITE} icon={b.icon.url || undefined} />
          </PreviewBox>
        </Cols>
        <Foot editing={basic.editing} onEdit={basic.edit} onCancel={basic.cancel} onSave={() => save(basic, [basic.draft.icon, basic.draft.badge])} />
      </Card>

      <Card>
        <CardHead
          title="위젯 설정"
          actions={
            <Row>
              <Label>활성화</Label>
              <Toggle label="위젯 활성화" checked={widget.saved.active} onChange={(active) => widget.patchSaved({ active })} />
            </Row>
          }
        />
        {widget.saved.active && (
          <>
            <Cols>
              <Left>
                <F label="색상">
                  <Row>
                    <Swatch c={w.color} $on={widget.editing}>
                      {widget.editing && <input type="color" aria-label="색상 선택" value={/^#[0-9a-f]{6}$/i.test(w.color) ? w.color : '#000000'} onChange={(e) => widget.set({ color: e.target.value })} />}
                    </Swatch>
                    <TextField readOnly={!widget.editing} value={w.color} onChange={(e) => widget.set({ color: e.target.value })} />
                  </Row>
                </F>
                <Row style={{ justifyContent: 'space-between' }}>
                  <ButtonGroup<Device>
                    items={[
                      { value: 'desktop', label: '데스크탑' },
                      { value: 'mobile', label: '모바일' },
                    ]}
                    value={wDevice}
                    onChange={setWDevice}
                  />
                  <CheckLabel $disabled={!widget.editing} onClick={() => widget.editing && widget.set({ hideIfMobile: !w.hideIfMobile })}>
                    <Checkbox checked={w.hideIfMobile} disabled={!widget.editing} />
                    모바일에서 노출하지 않기
                  </CheckLabel>
                </Row>
                <Panel>
                  <F label="커스텀 이미지" help="화질 개선을 위해 실제 화면에서는 이미지의 1/2 사이즈로 보여집니다.">
                    {wd.image.file || HOSTED.test(wd.image.url) ? (
                      <Row style={{ minHeight: 36 }}>
                        <Uploaded>
                          {wd.image.file ?? 'image'}
                          <span>업로드됨</span>
                        </Uploaded>
                        {widget.editing && <Button icon="close" aria-label="이미지 비우기" onClick={() => setWd({ image: { url: '' } })} />}
                      </Row>
                    ) : (
                      <ImageInput value={wd.image} editing={widget.editing} onChange={(image) => setWd({ image })} />
                    )}
                  </F>
                  <F label="크기">
                    <Slider label="크기" min={0.5} max={1.5} step={0.1} unit="x" value={hasCustom ? 1 : wd.size} disabled={!widget.editing || hasCustom} onChange={(size) => setWd({ size })} />
                  </F>
                  <F label="위치">
                    <div>
                      <ButtonGroup<Pos>
                        items={[
                          { value: 'left', label: '왼쪽' },
                          { value: 'right', label: '오른쪽' },
                        ]}
                        value={wd.position}
                        disabled={!widget.editing}
                        onChange={(position) => setWd({ position })}
                      />
                    </div>
                  </F>
                  <F label="가로">
                    <Slider label="가로" min={1} max={100} unit="px" value={wd.h} disabled={!widget.editing} onChange={(h) => setWd({ h })} />
                  </F>
                  <F label="세로">
                    <Slider label="세로" min={1} max={100} unit="px" value={wd.v} disabled={!widget.editing} onChange={(v) => setWd({ v })} />
                  </F>
                </Panel>
                <F label="위젯 노출 경로" help="위젯이 노출될 URL 경로를 지정할 수 있습니다. (전체 노출의 경우 /* 추가)">
                  <Paths rows={Math.max(1, w.allowedPaths.split('\n').length)} readOnly={!widget.editing} value={w.allowedPaths} onChange={(e) => widget.set({ allowedPaths: e.target.value })} />
                </F>
              </Left>
              <Field style={{ gap: 12 }}>
                <Label>미리보기</Label>
                <Browser>
                  <div>
                    <i />
                    <i />
                    <i />
                    <span>{new URL(SITE).host}</span>
                  </div>
                  <div>
                    {!(wDevice === 'mobile' && w.hideIfMobile) && (
                      <Widget
                        style={{
                          background: w.color,
                          width: 64 * (hasCustom ? 1 : wd.size),
                          height: 64 * (hasCustom ? 1 : wd.size),
                          bottom: Math.min(wd.v, 120),
                          [wd.position]: Math.min(wd.h, 260),
                        }}
                      >
                        <Icon name="web_asset" size={Math.round(28 * (hasCustom ? 1 : wd.size))} />
                      </Widget>
                    )}
                  </div>
                </Browser>
              </Field>
            </Cols>
            <Foot
              editing={widget.editing}
              onEdit={widget.edit}
              onCancel={widget.cancel}
              onSave={() => {
                // 스테이징 저장값: allowedPaths 는 줄별 trim · 빈 줄 제거
                save(widget, [widget.draft.desktop.image, widget.draft.mobile.image], { allowedPaths: widget.draft.allowedPaths.split('\n').map((l) => l.trim()).filter(Boolean).join('\n') });
              }}
            />
          </>
        )}
      </Card>

      {howTo && (
        <Dialog title="연동 방법" width={640} onClose={() => setHowTo(false)}>
          <Alert>
            <span>
              <Icon name="info" size={20} />
            </span>
            <div>
              <b>도움이 필요하신가요? 개발자 팀원에게 연동 가이드를 전달하세요.</b>
              <p>
                <a href="https://docs.flarelane.com/web-push-integration" target="_blank" rel="noreferrer">연동 가이드</a>가 첨부된 초대 메일이 발송됩니다.
              </p>
            </div>
          </Alert>
          <Row style={{ gap: 12 }}>
            <TextField placeholder="초대할 메일 주소 입력" value={invite} onChange={(e) => setInvite(e.target.value)} />
            <Button
              hierarchy="primary"
              onClick={() => {
                if (!invite) return;
                toast('초대 메일이 발송되었습니다.');
                setInvite('');
              }}
            >
              발송
            </Button>
          </Row>
          <hr style={{ width: '100%', margin: 0, border: 0, borderTop: '1px solid var(--border-secondary)' }} />
          <Step>
            <h4>1단계: 다음 파일을 웹사이트 루트 URL에 업로드하세요.</h4>
            <div>
              <Button size="md" iconLeading="download" onClick={downloadSw}>파일 다운로드 (sw.js)</Button>
            </div>
            <p>
              다음 주소에서 접근이 가능해야 합니다:{' '}
              <a href={`${origin}/sw.js`} target="_blank" rel="noreferrer">
                {`${origin}/sw.js`}
                <Icon name="open_in_new" size={14} />
              </a>
            </p>
          </Step>
          <Step>
            <h4>2단계: 다음 코드를 웹사이트 내 &lt;/body&gt; 태그 전에 추가하세요.</h4>
            <Code type="button" onClick={copy} aria-label="코드 복사">
              <pre>{SDK}</pre>
              <span>
                <Icon name="content_copy" size={16} />
              </span>
            </Code>
          </Step>
        </Dialog>
      )}
    </ChannelShell>
  );
}
