// 이벤트 · 속성 · 세그먼트 카탈로그 — Figma 시안(스테이징 값)에서 옮김.
// [확인됨] 이벤트 이름 목록 앞부분 · soob 속성(w6, w7) · banner_impression-v1 속성 없음 · 퍼널 수(20/6/2)
// [임시] 속성값 · 세그먼트 · 유저/기기 속성 목록 — 스테이징 카탈로그 API(로그인 필요)에서 아직 못 읽음

export const RECENT_DAYS = 30;

export type EventItem = { name: string; recent: number; properties: string[] };

export const events: EventItem[] = [
  { name: '1', recent: 0, properties: [] },
  { name: '12345', recent: 0, properties: [] },
  { name: 'add_to_cart', recent: 0, properties: [] },
  { name: 'app_opened', recent: 0, properties: [] },
  { name: 'banner_impression-v1', recent: 0, properties: [] },
  { name: 'begin_checkout', recent: 0, properties: [] },
  { name: 'blacklist', recent: 0, properties: [] },
  { name: 'brown', recent: 0, properties: [] },
  { name: 'cat', recent: 0, properties: [] },
  { name: 'claude_track_test', recent: 0, properties: [] },
  { name: 'deferred', recent: 6, properties: [] },
  { name: 'email.delivered', recent: 2, properties: [] },
  { name: 'soob', recent: 20, properties: ['w6', 'w7'] },
];

// [임시] 속성값
export const propertyValues: Record<string, string[]> = {
  w6: ['x', 'y', 'z'],
  w7: ['k'],
};

// [임시] 세그먼트
export const segments: { id: string; name: string; type: 'USER' | 'DEVICE' }[] = [
  { id: 'seg_0001', name: '구매 고객', type: 'USER' },
  { id: 'seg_0002', name: '최근 7일 접속 기기', type: 'DEVICE' },
];

// [임시] 유저 · 기기 속성 / 태그
export const userProperties = ['국가 코드', '언어 코드', '생일', '문자 수신 거부'];
export const userTags = ['grade', 'name'];
export const deviceProperties = ['플랫폼', '웹 브라우저', '테스트 기기', '구독 여부'];
export const deviceTags = ['@device_model'];

export const eventByName = (n: string) => events.find((e) => e.name === n);

// 결과 더미: 스테이징에서 본 값(banner_impression-v1 = 0, 퍼널 20/6/2), 그 밖은 0
export function insightValues(event: string, buckets: number) {
  return Array.from({ length: buckets }, () => 0 * event.length);
}
export function funnelCounts(eventsInOrder: string[]) {
  const known: Record<string, number> = { soob: 20, deferred: 6, 'email.delivered': 2 };
  const out: number[] = [];
  eventsInOrder.forEach((e, i) => {
    const v = known[e] ?? 0;
    out.push(i === 0 ? v : Math.min(v, out[i - 1]));
  });
  return out;
}
