// 고객 여정 빌더 모델 — docs/staging-behavior-journey-builder.md 2 · 6장.
// 편집기 JSON = 노드({type, id, data, attr{x,y}}) + 화살표({from, to, index, executionType}). 저장 시 상세 화면용 단순 노드 목록도 만듦.
import type { JourneyNode } from './journeys';

export type NodeType = 'ENTRY' | 'SEND_NOTIFICATION' | 'SEND_ALIMTALK' | 'SEND_FRIENDTALK' | 'SEND_SMS' | 'SEND_EMAIL' | 'DISPLAY_IN_APP_MESSAGE' | 'EXECUTE_WEBHOOK' | 'TIME_DELAY' | 'AB_TEST' | 'SPLIT_BY_EVENT_CONDITIONS' | 'SPLIT_BY_SEGMENT_CONDITIONS' | 'TRIGGER_EVENT' | 'UPDATE_TAG';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BNode = { id: string; type: NodeType; x: number; y: number; data: Record<string, any> };
export type Arrow = { id: string; from: string; to: string; index: number; exec: 'ENTRY' | 'ON_SUCCESS' | 'ON_FAILURE' | 'DEFAULT' };
export type Settings = {
  entryPolicy: 'Once' | 'ReEntryAfterCompletion' | 'ReEntry';
  reMode: null | 'endOfDays' | 'minutes';
  reValue: number;
  reUnit: 'DAY' | 'HOUR';
  ignoreCapping: boolean;
  dnd: { start: number; end: number; handling: 'DELAY' | 'CANCEL' };
};
export type Graph = { nodes: BNode[]; arrows: Arrow[]; settings: Settings; conv: unknown };

export const LABEL: Record<NodeType, string> = {
  ENTRY: '시작 조건',
  SEND_NOTIFICATION: 'Push',
  SEND_ALIMTALK: 'Kakao Alimtalk',
  SEND_FRIENDTALK: 'Kakao BrandMessage',
  SEND_SMS: 'SMS',
  SEND_EMAIL: 'Email',
  DISPLAY_IN_APP_MESSAGE: 'In-App Message',
  EXECUTE_WEBHOOK: 'Webhook',
  TIME_DELAY: 'Delay',
  AB_TEST: 'A/B Test',
  SPLIT_BY_EVENT_CONDITIONS: 'Event Split',
  SPLIT_BY_SEGMENT_CONDITIONS: 'Segment Split',
  TRIGGER_EVENT: 'Trigger Event',
  UPDATE_TAG: 'Update Tags',
};
export const ICON: Record<NodeType, [string, string]> = {
  ENTRY: ['play_arrow', '#414651'],
  SEND_NOTIFICATION: ['notifications', '#2f54eb'],
  SEND_ALIMTALK: ['chat_bubble', '#e3b300'],
  SEND_FRIENDTALK: ['chat_bubble', '#e3b300'],
  SEND_SMS: ['sms', '#16a34a'],
  SEND_EMAIL: ['mail', '#0ea5e9'],
  DISPLAY_IN_APP_MESSAGE: ['web_asset', '#9b00ff'],
  EXECUTE_WEBHOOK: ['webhook', '#475467'],
  TIME_DELAY: ['schedule', '#f97316'],
  AB_TEST: ['call_split', '#ec4899'],
  SPLIT_BY_EVENT_CONDITIONS: ['alt_route', '#0891b2'],
  SPLIT_BY_SEGMENT_CONDITIONS: ['group', '#0891b2'],
  TRIGGER_EVENT: ['bolt', '#7c3aed'],
  UPDATE_TAG: ['sell', '#7c3aed'],
};
export const CHANNELS: NodeType[] = ['SEND_NOTIFICATION', 'SEND_ALIMTALK', 'SEND_FRIENDTALK', 'SEND_SMS', 'SEND_EMAIL', 'DISPLAY_IN_APP_MESSAGE', 'EXECUTE_WEBHOOK'];
export const FLOWS: NodeType[] = ['TIME_DELAY', 'AB_TEST', 'SPLIT_BY_EVENT_CONDITIONS', 'SPLIT_BY_SEGMENT_CONDITIONS', 'TRIGGER_EVENT', 'UPDATE_TAG'];

const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
export const newId = uid;

export function defaults(type: NodeType): Record<string, unknown> {
  switch (type) {
    case 'ENTRY':
      return { entryType: 'EVENT', target: 'ALL', anonymous: 'EXCLUDE', event: { name: '', filters: [] }, exits: [], segment: null };
    case 'SEND_NOTIFICATION':
      return { body: '', title: '', url: '', data: {}, waitMinutes: 0, campaignName: '', platforms: ['android', 'ios', 'webDesktop', 'webMobile'], extraSeg: false };
    case 'SEND_ALIMTALK':
      return { templateId: '' };
    case 'SEND_FRIENDTALK':
      return { messageType: 'FI', isAdvertisement: true, isAdultContent: false, shouldSendPushAlarm: true, targeting: 'I' };
    case 'SEND_SMS':
      return { body: '', isAdvertisement: true };
    case 'SEND_EMAIL':
      return { senderEmail: '', title: '', body: '' };
    case 'DISPLAY_IN_APP_MESSAGE':
      return { ttlMinutes: 4320, editorType: 'gui', htmlString: '', title: '', group: null };
    case 'EXECUTE_WEBHOOK':
      return { webhookId: '' };
    case 'TIME_DELAY':
      return { type: 'AFTER', waitMinutes: 60, n: 1, unit: 'HOUR', hour: 9, minute: 0 };
    case 'AB_TEST':
      return { groups: [{ id: uid(), name: 'A', pct: 50 }, { id: uid(), name: 'B', pct: 50 }], control: null };
    case 'SPLIT_BY_EVENT_CONDITIONS':
      return { since: 'ENTRY', recentN: 1, recentUnit: 'DAY', op: 'GTE', count: 1, event: { name: '', filters: [] } };
    case 'SPLIT_BY_SEGMENT_CONDITIONS':
      return { segment: null };
    case 'TRIGGER_EVENT':
      return { event: { type: '', data: [] } };
    case 'UPDATE_TAG':
      return { tags: [] };
  }
}

// 출력 핸들 — [라벨, 색, executionType]
export function outputs(n: BNode): [string, string, Arrow['exec']][] {
  if (n.type === 'ENTRY') return [['', '#717680', 'ENTRY']];
  if (['SEND_NOTIFICATION', 'SEND_ALIMTALK', 'SEND_FRIENDTALK', 'SEND_SMS', 'SEND_EMAIL', 'EXECUTE_WEBHOOK'].includes(n.type))
    return [
      ['성공', '#2f54eb', 'ON_SUCCESS'],
      ['실패', '#dc2626', 'ON_FAILURE'],
    ];
  if (n.type === 'SPLIT_BY_EVENT_CONDITIONS' || n.type === 'SPLIT_BY_SEGMENT_CONDITIONS')
    return [
      ['Yes', '#2f54eb', 'ON_SUCCESS'],
      ['No', '#dc2626', 'ON_FAILURE'],
    ];
  if (n.type === 'AB_TEST') return (n.data.groups as { name: string }[]).map((g) => [g.name, '#717680', 'DEFAULT']);
  return [['', '#717680', 'DEFAULT']];
}

// 연속 15개 제한 — BrandMessage · Delay · A/B Test 는 세지 않음
const COUNTED: NodeType[] = ['SEND_NOTIFICATION', 'EXECUTE_WEBHOOK', 'DISPLAY_IN_APP_MESSAGE', 'SEND_ALIMTALK', 'SEND_SMS', 'SEND_EMAIL', 'SPLIT_BY_EVENT_CONDITIONS', 'SPLIT_BY_SEGMENT_CONDITIONS', 'TRIGGER_EVENT', 'UPDATE_TAG'];
export function longest(g: Graph): number {
  const entry = g.nodes.find((n) => n.type === 'ENTRY');
  if (!entry) return 0;
  const walk = (id: string, seen: Set<string>): number => {
    if (seen.has(id)) return 0;
    const n = g.nodes.find((x) => x.id === id);
    if (!n) return 0;
    const next = g.arrows.filter((a) => a.from === id).map((a) => walk(a.to, new Set([...seen, id])));
    return (COUNTED.includes(n.type) ? 1 : 0) + Math.max(0, ...next);
  };
  return walk(entry.id, new Set());
}
export function canConnect(g: Graph, from: string, to: string): boolean {
  if (from === to) return false;
  const t = g.nodes.find((n) => n.id === to);
  const f = g.nodes.find((n) => n.id === from);
  if (!t || !f || t.type === 'ENTRY') return false;
  if (g.arrows.some((a) => a.to === to)) return false;
  if (g.arrows.some((a) => a.from === to && a.to === from)) return false;
  if (f.type === 'AB_TEST' && t.type === 'AB_TEST') return false;
  return true;
}

// 저장 검증(1.4) — 실패 시 토스트 문구, 통과면 null
export function validate(g: Graph, ctx: { smsSender: boolean; kakaoSender: boolean }): string | null {
  const ids = new Set(g.nodes.map((n) => n.id));
  if (g.nodes.some((n) => n.type !== 'ENTRY' && !g.arrows.some((a) => a.to === n.id)) || g.arrows.some((a) => !ids.has(a.to))) return '연결되지 않은 액션이 있습니다.';
  for (const n of g.nodes.filter((x) => x.type === 'AB_TEST')) {
    const outs = (n.data.groups as unknown[]).length;
    for (let i = 0; i < outs; i++) if (!g.arrows.some((a) => a.from === n.id && a.index === i)) return 'AB액션은 모두 연결하여야 합니다.';
  }
  const entry = g.nodes.find((n) => n.type === 'ENTRY');
  if (!entry?.data.entryType) return '시작 조건을 먼저 선택해야 합니다.';
  let msg: string | null = null;
  for (const n of g.nodes) {
    const d = n.data;
    const bad =
      (n.type === 'SEND_NOTIFICATION' && !d.body) ||
      (n.type === 'EXECUTE_WEBHOOK' && !d.webhookId) ||
      (n.type === 'SEND_ALIMTALK' && (!d.templateId || !ctx.kakaoSender)) ||
      (n.type === 'SEND_FRIENDTALK' && !ctx.kakaoSender) ||
      (n.type === 'SEND_SMS' && (!d.body || !ctx.smsSender)) ||
      (n.type === 'SEND_EMAIL' && (!d.senderEmail || !d.title || !d.body)) ||
      (n.type === 'DISPLAY_IN_APP_MESSAGE' && !d.htmlString) ||
      (n.type === 'SPLIT_BY_SEGMENT_CONDITIONS' && !d.segment) ||
      (n.type === 'SPLIT_BY_EVENT_CONDITIONS' && !d.event?.name) ||
      (n.type === 'TRIGGER_EVENT' && !d.event?.type) ||
      (n.type === 'UPDATE_TAG' && !(d.tags as unknown[]).length);
    if (!bad) continue;
    msg = (n.type === 'SEND_ALIMTALK' || n.type === 'SEND_FRIENDTALK') && !ctx.kakaoSender ? '카카오 발신 프로필이 없습니다.' : n.type === 'SEND_SMS' && !ctx.smsSender ? 'SMS 발신 번호가 없습니다.' : msg ?? '메시지 내용이 비어있습니다.';
  }
  return msg;
}

// 자동 정렬(Arrange) — 레벨별 세로 300, 연결 안 된 노드는 시작 노드 오른쪽 +500 부터 한 줄 5개
export function arrange(g: Graph): BNode[] {
  const entry = g.nodes.find((n) => n.type === 'ENTRY')!;
  const pos = new Map<string, [number, number]>();
  const levels: string[][] = [];
  const visit = (id: string, lv: number) => {
    if ([...pos.keys()].includes(id)) return;
    (levels[lv] ??= []).push(id);
    pos.set(id, [0, lv]);
    g.arrows
      .filter((a) => a.from === id)
      .sort((a, b) => a.index - b.index)
      .forEach((a) => visit(a.to, lv + 1));
  };
  visit(entry.id, 0);
  const X0 = 600;
  const W = 300;
  levels.forEach((ids, lv) => ids.forEach((id, i) => pos.set(id, [X0 + (i - (ids.length - 1) / 2) * W, 80 + lv * 300])));
  let k = 0;
  return g.nodes.map((n) => {
    const p = pos.get(n.id);
    if (p) return { ...n, x: p[0], y: p[1] };
    const q = { ...n, x: X0 + 500 + (k % 5) * W, y: 80 + Math.floor(k / 5) * 300 };
    k += 1;
    return q;
  });
}

// 카드 요약
export function summary(n: BNode): string[] {
  const d = n.data;
  switch (n.type) {
    case 'ENTRY':
      return d.entryType === 'EVENT' ? [d.event?.name || '이벤트를 선택해 주세요'] : [d.segment || '세그먼트를 선택해 주세요'];
    case 'SEND_NOTIFICATION':
      return [d.campaignName, d.title, d.body].filter(Boolean);
    case 'SEND_ALIMTALK':
      return [d.campaignName, d.templateName].filter(Boolean);
    case 'SEND_FRIENDTALK':
      return [d.campaignName, d.text].filter(Boolean);
    case 'SEND_SMS':
      return [d.campaignName, d.body].filter(Boolean);
    case 'SEND_EMAIL':
      return [d.campaignName, d.title].filter(Boolean);
    case 'DISPLAY_IN_APP_MESSAGE': {
      const m = d.ttlMinutes as number;
      return [d.title, `노출 예약 기간: ${m % 1440 === 0 ? `${m / 1440} 일` : m % 60 === 0 ? `${m / 60} 시간` : `${m} 분`}`].filter(Boolean);
    }
    case 'EXECUTE_WEBHOOK':
      return [d.webhookName].filter(Boolean);
    case 'TIME_DELAY':
      return [d.type === 'UNTIL' ? `${String(d.hour).padStart(2, '0')}:${String(d.minute).padStart(2, '0')} 까지` : `${d.n} ${{ DAY: '일', HOUR: '시간', MINUTE: '분' }[d.unit as string]}`];
    case 'AB_TEST':
      return [...(d.groups as { name: string; pct: number }[]).map((g) => `${g.name} ${g.pct}%`), ...(d.control ? [`미발송 그룹 ${d.control}%`] : [])];
    case 'SPLIT_BY_EVENT_CONDITIONS':
      return d.event?.name ? [`${d.since === 'ENTRY' ? '여정 진입 이후부터' : `최근 ${d.recentN}${{ DAY: '일', HOUR: '시간', MINUTE: '분' }[d.recentUnit as string]} 이내`}`, `${d.event.name} ${{ EQ: '=', NOT_EQ: '≠', LT: '<', LTE: '≤', GT: '>', GTE: '≥' }[d.op as string]} ${d.count} 회 발생`] : [];
    case 'SPLIT_BY_SEGMENT_CONDITIONS':
      return [d.segment].filter(Boolean);
    case 'TRIGGER_EVENT':
      return [d.event?.type].filter(Boolean);
    case 'UPDATE_TAG':
      return (d.tags as { key: string; value: string }[]).map((t) => `${t.key}: ${t.value}`);
  }
}

// 저장용 — 상세 화면 단순 그림(시작 노드부터 첫 갈래 따라 일렬)
const CH_NAME: Partial<Record<NodeType, string>> = { SEND_NOTIFICATION: '푸시 알림', SEND_ALIMTALK: '카카오 알림톡', SEND_FRIENDTALK: '카카오 브랜드메시지', SEND_SMS: '문자', SEND_EMAIL: '이메일', DISPLAY_IN_APP_MESSAGE: '인앱 메시지', EXECUTE_WEBHOOK: '웹훅' };
export function toSimple(g: Graph): JourneyNode[] {
  const out: JourneyNode[] = [];
  let cur = g.nodes.find((n) => n.type === 'ENTRY');
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    const s = summary(cur);
    out.push(cur.type === 'ENTRY' ? { type: 'ENTRY', title: '시작 조건', detail: cur.data.entryType === 'EVENT' ? `${s[0]} 이벤트 발생 시 진입` : '대상 세그먼트에 포함될 때 진입' } : cur.type === 'TIME_DELAY' ? { type: 'DELAY', title: '대기', detail: s[0] } : CH_NAME[cur.type] ? { type: 'MESSAGE', title: CH_NAME[cur.type]!, detail: s.join(' · '), channel: CH_NAME[cur.type] } : { type: 'CONDITION', title: LABEL[cur.type], detail: s.join(' · ') });
    const next = g.arrows.filter((a) => a.from === cur!.id).sort((a, b) => a.index - b.index)[0];
    cur = next ? g.nodes.find((n) => n.id === next.to) : undefined;
  }
  out.push({ type: 'EXIT', title: '종료' });
  return out;
}

// 상세용 단순 노드 → 편집 그래프(저장된 편집기 JSON이 없을 때)
export function fromSimple(nodes: JourneyNode[]): Graph {
  const g: Graph = { nodes: [], arrows: [], settings: defaultSettings(), conv: null };
  const T: Record<string, NodeType> = { '푸시 알림': 'SEND_NOTIFICATION', '카카오 알림톡': 'SEND_ALIMTALK', '카카오 브랜드메시지': 'SEND_FRIENDTALK', 문자: 'SEND_SMS', 이메일: 'SEND_EMAIL' };
  let prev: BNode | null = null;
  for (const s of nodes) {
    if (s.type === 'EXIT') break;
    const type: NodeType = s.type === 'ENTRY' ? 'ENTRY' : s.type === 'DELAY' ? 'TIME_DELAY' : s.type === 'MESSAGE' ? T[s.channel ?? ''] ?? 'SEND_NOTIFICATION' : 'SPLIT_BY_EVENT_CONDITIONS';
    const data = { ...defaults(type) } as Record<string, unknown>;
    if (type === 'ENTRY') Object.assign(data, { entryType: 'SEGMENT', segment: '전체 유저' });
    if (type === 'TIME_DELAY') Object.assign(data, { n: 1, unit: 'DAY', waitMinutes: 1440 });
    if (type === 'SEND_NOTIFICATION' || type === 'SEND_SMS') Object.assign(data, { body: s.detail ?? '' });
    if (type === 'SEND_ALIMTALK') Object.assign(data, { templateId: '5100', templateName: '주문 완료 안내' });
    if (type === 'SEND_FRIENDTALK') Object.assign(data, { text: s.detail ?? '' });
    if (type === 'SEND_EMAIL') Object.assign(data, { senderEmail: 'test@noreply.flarelane.com', title: s.detail ?? '', body: '<p>본문</p>' });
    if (type === 'SPLIT_BY_EVENT_CONDITIONS') Object.assign(data, { event: { name: 'purchase_completed', filters: [] } });
    const n: BNode = { id: uid(), type, x: 600, y: 80 + g.nodes.length * 300, data };
    g.nodes.push(n);
    if (prev) g.arrows.push({ id: uid(), from: prev.id, to: n.id, index: 0, exec: prev.type === 'ENTRY' ? 'ENTRY' : outputs(prev)[0][2] });
    prev = n;
  }
  return g;
}

export const defaultSettings = (): Settings => ({ entryPolicy: 'Once', reMode: null, reValue: 1, reUnit: 'HOUR', ignoreCapping: false, dnd: { start: 21, end: 8, handling: 'DELAY' } });
export const emptyGraph = (): Graph => ({ nodes: [{ id: uid(), type: 'ENTRY', x: 600, y: 80, data: defaults('ENTRY') }], arrows: [], settings: defaultSettings(), conv: null });
