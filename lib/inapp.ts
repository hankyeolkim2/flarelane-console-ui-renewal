// 인앱 메시지 더미 — docs/staging-behavior-journeys-inapp.md 5~7장. 목록 그룹 · 이름은 Figma 목록(991:45253, 스테이징 실데이터).
// 스테이징은 HTML 문자열(data-flarelane-type 요소)을 GUI 로 고치지만, 프로토타입은 아래 모델을 고치고 HTML 을 만들어 미리보기에 씀.
export type DisplayType = 'BOTTOM_SHEET' | 'MODAL' | 'FULL_SCREEN' | 'HTML';
export type ActionType = 'close' | 'url' | 'custom' | 'subscribe';
export type IamAction = { type: ActionType; arg: string; unit?: 'DAY' | 'HOUR' };
export type IamButton = { text: string; color: string; bg: string; radius: number; clickId?: string; actions: IamAction[] };
export type IamSlide = { image: string; clickId?: string; actions: IamAction[] };
export type IamModel = {
  displayType: DisplayType;
  bg: string;
  bgClickId?: string;
  bgActions: IamAction[];
  slides: IamSlide[];
  buttons: IamButton[];
  carousel: { auto: boolean; speed: number };
  container: [string, string][];
  html?: string; // HTML 모드
};

export type Template = { id: string; title: string; model: IamModel };
const btn = (text: string, primary = true): IamButton => ({ text, color: primary ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)', bg: primary ? 'rgba(0, 0, 0, 1)' : 'rgba(243, 244, 246, 1)', radius: 0, actions: primary ? [{ type: 'close', arg: '1', unit: 'DAY' }] : [{ type: 'close', arg: '', unit: 'DAY' }] });
const IMG = ['여름맞이 홈케어 세일', '신상품 입고 안내', '앱 전용 쿠폰'];
const slide = (i: number): IamSlide => ({ image: `image${i + 1}.png`, actions: [] });
const model = (displayType: DisplayType, kind: 'one' | 'two' | 'image' | 'carousel'): IamModel => ({
  displayType,
  bg: 'rgba(0, 0, 0, 0.5)',
  bgActions: [{ type: 'close', arg: '1', unit: 'HOUR' }],
  slides: kind === 'carousel' ? [slide(0), slide(1), slide(2)] : [slide(0)],
  buttons: kind === 'one' ? [btn('자세히 보기')] : kind === 'two' ? [btn('닫기', false), btn('자세히 보기')] : kind === 'carousel' ? [btn('자세히 보기')] : [],
  carousel: { auto: true, speed: 5 },
  container: [],
});

export const TEMPLATES: Template[] = (['BOTTOM_SHEET', 'MODAL', 'FULL_SCREEN'] as const).flatMap((t, ti) =>
  (['one', 'two', 'image', 'carousel'] as const).map((k, ki) => ({ id: String(ti * 4 + ki + 1), title: { one: 'One Button', two: 'Two Button', image: 'Only Image', carousel: 'Carousel' }[k], model: model(t, k) })),
);
export const DISPLAY_LABEL: Record<Exclude<DisplayType, 'HTML'>, string> = { BOTTOM_SHEET: 'Bottom Sheet', MODAL: 'Modal', FULL_SCREEN: 'Full Screen' };

// 모델 → HTML (미리보기 · 「HTML 복사하기」)
export function toHtml(m: IamModel): string {
  if (m.displayType === 'HTML') return m.html ?? '';
  const act = (a: IamAction[]) => a.map((x) => (x.type === 'close' ? `FlareLaneIAM.close(${x.arg ? Number(x.arg) * (x.unit === 'DAY' ? 1440 : 60) : 0})` : x.type === 'url' ? `FlareLaneIAM.openUrl('${x.arg}')` : x.type === 'custom' ? `FlareLaneIAM.executeAction('${x.arg}')` : 'FlareLaneIAM.requestPushPermission()')).join(';');
  const img = (s: IamSlide, i: number) =>
    `<div data-flarelane-type="image" ${s.clickId ? `data-flarelane-clickable-id="${s.clickId}"` : ''} data-flarelane-action="${act(s.actions)}" style="position:relative;height:${m.displayType === 'FULL_SCREEN' ? '100%' : '260px'};background:linear-gradient(135deg,#c08457,#7c4a2d 55%,#24364f);color:#fff;display:flex;flex-direction:column;justify-content:flex-end;padding:20px;font-family:Pretendard,sans-serif">
      <b style="font-size:22px">${IMG[i % IMG.length]}</b><span style="font-size:13px;opacity:.85;margin-top:6px">${s.image} · 최대 50% 할인</span>
      ${m.slides.length > 1 ? `<span style="position:absolute;top:12px;right:12px;font-size:11px;background:rgba(0,0,0,.4);padding:2px 6px;border-radius:9px">${i + 1}/${m.slides.length}</span>` : ''}
    </div>`;
  const buttons = m.buttons.length
    ? `<div style="display:flex;gap:8px;padding:12px">${m.buttons
        .map((b) => `<button data-flarelane-type="button" data-flarelane-action="${act(b.actions)}" style="flex:1;height:44px;border:0;border-radius:${b.radius}px;background:${b.bg};color:${b.color};font:600 14px Pretendard,sans-serif">${b.text}</button>`)
        .join('')}</div>`
    : '';
  const box = `<div data-flarelane-type="container" style="background:#fff;overflow:hidden;${m.displayType === 'BOTTOM_SHEET' ? 'position:absolute;left:0;right:0;bottom:0;border-radius:16px 16px 0 0' : m.displayType === 'MODAL' ? 'position:absolute;left:24px;right:24px;top:50%;transform:translateY(-50%);border-radius:16px' : 'position:absolute;inset:0;display:flex;flex-direction:column'}">${img(m.slides[0], 0)}${buttons}</div>`;
  return `<!doctype html><html><body style="margin:0;height:100vh"><div data-flarelane-type="background" data-flarelane-action="${act(m.bgActions)}" style="position:fixed;inset:0;background:${m.bg}"></div>${box}<span style="position:absolute;right:12px;top:${m.displayType === 'BOTTOM_SHEET' ? 'calc(100% - 330px)' : '12px'};color:#fff;font:16px sans-serif">✕</span></body></html>`;
}
export const hasClose = (m: IamModel) => (m.displayType === 'HTML' ? /FlareLaneIAM\.close\(/.test(m.html ?? '') : [...m.bgActions, ...m.slides.flatMap((s) => s.actions), ...m.buttons.flatMap((b) => b.actions)].some((a) => a.type === 'close'));

export type Condition = { key: string; op: string; value: string };
export type InApp = {
  id: string;
  title: string;
  group: string;
  status: 'active' | 'paused';
  displayStatus: 'temp' | 'active' | 'paused';
  priority: 0 | 1 | 2;
  createdAt: string;
  start?: string;
  end?: string;
  isExpired?: boolean;
  conditions: Condition[] | null;
  target: 'all' | 'segment';
  conversion: boolean;
  model: IamModel;
  stats: { displayed: number; clicked: number; clickedUsers: number; converted: number; convertedUsers: number; amount: number; platform: Record<'android' | 'ios' | 'webDesktop' | 'webMobile', { displayed: number; clicked: number }> };
};

const st = (d: number, c: number) => ({ displayed: d, clicked: c, clickedUsers: Math.round(c * 0.8), converted: Math.round(c * 0.1), convertedUsers: Math.round(c * 0.08), amount: Math.round(c * 0.1) * 29000, platform: { android: { displayed: Math.round(d * 0.4), clicked: Math.round(c * 0.4) }, ios: { displayed: Math.round(d * 0.3), clicked: Math.round(c * 0.3) }, webDesktop: { displayed: Math.round(d * 0.2), clicked: Math.round(c * 0.2) }, webMobile: { displayed: d - Math.round(d * 0.4) - Math.round(d * 0.3) - Math.round(d * 0.2), clicked: c - Math.round(c * 0.4) - Math.round(c * 0.3) - Math.round(c * 0.2) } } });

const SEED: [string, string, InApp['displayStatus'], string, number, number][] = [
  ['5235', '123', 'paused', '2025.10.13', 0, 0],
  ['캐러셀 테스트', '123', 'temp', '2026.06.26', 0, 0],
  ['캐러셀 테스트', '123', 'temp', '2026.06.26', 0, 0],
  ['캐러셀 테스트 2', '123', 'paused', '2026.06.30', 0, 0],
  ['바텀시트 쿠폰', '123', 'paused', '2026.07.02', 0, 0],
  ['신규 회원 환영', '123', 'paused', '2026.07.10', 0, 0],
  ['이전 프로모션', '123', 'paused', '2026.04.10', 0, 0],
  ['123123', '123123', 'active', '2026.05.01', 3420, 412],
  ['12341', '12341', 'active', '2026.05.02', 1280, 96],
  ['adsfasf', 'adsfasf', 'paused', '2026.05.03', 0, 0],
  ['click', 'click', 'active', '2026.06.01', 920, 188],
  ['홈 배너 1', 'home', 'active', '2026.08.01', 15200, 1830],
  ['홈 배너 2', 'home', 'temp', '2026.08.03', 0, 0],
  ['홈 배너 3', 'home', 'paused', '2026.08.05', 4100, 290],
  ['1124 테스트', '1124', 'paused', '2025.11.24', 0, 0],
  ['asdfadsf', 'asdfadsf', 'paused', '2025.09.01', 0, 0],
];

export const inApps: InApp[] = SEED.map(([title, group, ds, created, d, c], i) => ({
  id: `iam-${i + 1}`,
  title,
  group,
  status: ds === 'active' ? 'active' : 'paused',
  displayStatus: ds,
  priority: 1,
  createdAt: created,
  start: i === 11 ? '2026.08.01 00:00:00' : undefined,
  end: i === 11 ? '2026.12.31 23:59:00' : undefined,
  isExpired: i === 6,
  conditions: i === 8 ? [{ key: 'page', op: 'EQ', value: 'home' }] : null,
  target: 'all',
  conversion: i === 11,
  model: JSON.parse(JSON.stringify(TEMPLATES[i % TEMPLATES.length].model)),
  stats: st(d, c),
}));

const listeners = new Set<() => void>();
export const subscribeInApp = (f: () => void) => {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
};
export const emitInApp = () => listeners.forEach((f) => f());
export const OPS: [string, string][] = [
  ['EQ', '='],
  ['NOT_EQ', '≠'],
  ['GT', '>'],
  ['GTE', '≥'],
  ['LT', '<'],
  ['LTE', '≤'],
  ['INCLUDES', '이 중에 하나'],
  ['CONTAINS', '포함'],
  ['NOT_CONTAINS', '포함하지 않음'],
];
