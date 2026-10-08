// 고객 여정 자동화 더미 — docs/staging-behavior-journeys-inapp.md 1~3장. 앞 4건은 Figma 목록(1085:22009, 스테이징 실데이터).
export type JourneyNode = { type: 'ENTRY' | 'MESSAGE' | 'DELAY' | 'CONDITION' | 'EXIT'; title: string; detail?: string; channel?: string; stat?: number };
export type Journey = {
  id: string;
  name: string;
  active: boolean;
  lastActivatedAt?: string;
  lastPausedAt?: string;
  archivedAt?: string;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  createdAt: string;
  entries: number;
  conversions: number;
  amount: number;
  entry: { kind: 'SEGMENT'; segment: string } | { kind: 'EVENT'; event: string; target: string };
  nodes: JourneyNode[];
  handlingOnPause?: 'PROCESS' | 'EXIT';
  editor?: import('./builder').Graph; // 빌더 편집기 JSON
};
export type JourneyStatus = 'active' | 'paused' | 'draft' | 'archived';
export const statusOf = (j: Journey): JourneyStatus => (j.active ? 'active' : j.archivedAt ? 'archived' : j.lastActivatedAt ? 'paused' : 'draft');
export const STATUS_LABEL: Record<JourneyStatus, string> = { active: '활성화', paused: '일시중지', draft: '임시저장', archived: '아카이브됨' };

const flow = (channel: string, msg: string): JourneyNode[] => [
  { type: 'ENTRY', title: '시작 조건', detail: '대상 세그먼트에 포함될 때 진입' },
  { type: 'DELAY', title: '대기', detail: '1일 대기' },
  { type: 'MESSAGE', title: channel, detail: msg, channel },
  { type: 'CONDITION', title: '이벤트 조건', detail: 'purchase_completed 발생 여부' },
  { type: 'EXIT', title: '종료' },
];

type Seed = [string, JourneyStatus, string, string?];
const SEED: Seed[] = [
  ['[검증] 여정 브랜드메시지 직계약 이미지(FI)', 'active', '2026.08.31'],
  ['[검증] 여정 브랜드메시지 직계약 (FT/M)', 'active', '2026.08.31'],
  ['FL1508-journey-updatetag', 'active', '2026.08.28', '2026.08.28 21:08'],
  ['v1', 'active', '2026.08.19', '2026.08.19 11:57'],
  ['장바구니 이탈 리마인드', 'paused', '2026.07.02', '2026.07.03 10:00'],
  ['신규 가입 웰컴 시리즈', 'paused', '2026.06.11', '2026.06.12 09:00'],
  ['휴면 고객 복귀', 'paused', '2026.05.20', '2026.05.21 14:30'],
  ['재구매 유도', 'paused', '2026.04.18', '2026.04.18 18:00'],
  ['생일 쿠폰', 'draft', '2026.09.30'],
  ['첫 구매 감사', 'draft', '2026.09.22'],
  ['리뷰 요청', 'draft', '2026.09.10'],
  ['봄 시즌 캠페인', 'archived', '2026.03.02', '2026.03.03 09:00'],
];

export const journeys: Journey[] = SEED.map(([name, st, created, act], i) => ({
  id: `jr-${i + 1}`,
  name,
  active: st === 'active',
  lastActivatedAt: st === 'draft' ? undefined : act ?? `${created} 10:00`,
  lastPausedAt: st === 'paused' || st === 'archived' ? '2026.09.01 12:00' : undefined,
  archivedAt: st === 'archived' ? '2026.06.30' : undefined,
  createdAt: created,
  entries: st === 'draft' ? 0 : [0, 0, 0, 0, 1240, 860, 3120, 450][i] ?? 12,
  conversions: st === 'draft' ? 0 : [0, 0, 0, 0, 82, 41, 230, 18][i] ?? 1,
  amount: st === 'draft' ? 0 : [0, 0, 0, 0, 2380000, 980000, 6410000, 520000][i] ?? 0,
  entry: i % 3 === 2 ? { kind: 'EVENT', event: 'add_to_cart', target: '모든 유저' } : { kind: 'SEGMENT', segment: i % 2 ? 'VIP 유저' : '전체 유저' },
  nodes: flow(['카카오 브랜드메시지', '카카오 브랜드메시지', '푸시 알림', '푸시 알림', '푸시 알림', '이메일', '문자', '카카오 알림톡'][i] ?? '푸시 알림', ['직계약 이미지 메시지', '직계약 텍스트 메시지', '태그 업데이트 확인', 'v1 테스트', '장바구니에 담긴 상품이 있어요', '가입을 환영합니다', '오랜만이에요! 쿠폰을 드려요', '다시 찾아주셔서 감사해요'][i] ?? '메시지'),
}));

const listeners = new Set<() => void>();
export const subscribeJourneys = (f: () => void) => {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
};
export const emitJourneys = () => listeners.forEach((f) => f());

export const PREBUILT = {
  base: [
    { id: 'ex-1', title: '신규 가입 웰컴 메시지', description: '가입 직후 환영 메시지와 첫 구매 혜택을 보냅니다.', created: true },
    { id: 'ex-2', title: '장바구니 이탈 리마인드', description: '장바구니에 담고 구매하지 않은 고객에게 알림을 보냅니다.', created: true },
    { id: 'ex-3', title: '휴면 고객 복귀', description: '30일 이상 방문하지 않은 고객에게 복귀 혜택을 안내합니다.', created: false },
  ],
  commerce: [
    { id: 'ex-4', title: '재구매 유도', description: '구매 후 일정 기간이 지난 고객에게 재구매를 제안합니다.', created: false },
    { id: 'ex-5', title: '리뷰 작성 요청', description: '배송 완료 뒤 리뷰 작성을 요청합니다.', created: false },
    { id: 'ex-6', title: '생일 쿠폰', description: '생일인 고객에게 쿠폰을 보냅니다.', created: false },
  ],
};
