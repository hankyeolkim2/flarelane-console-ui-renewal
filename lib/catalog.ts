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

// 결과 더미 — 그래프 모양을 볼 수 있게 이벤트 이름을 시드로 만든 값(새로고침해도 같음).
// 퍼널의 soob → deferred → email.delivered 는 스테이징 값(20 / 6 / 2) 그대로.
function seedOf(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// 하루 값: 이벤트별 기본 수준 × 요일(주말 감소) × 완만한 추세 × 흔들림
function dailyValue(event: string, d: Date) {
  const base = 600 + (seedOf(event) % 2400);
  const r = rng(seedOf(event + dayKey(d)))();
  const dow = d.getDay();
  const week = dow === 0 || dow === 6 ? 0.72 : dow === 5 ? 0.9 : 1;
  const trend = 1 + Math.sin((d.getTime() / 86400000 + (seedOf(event) % 30)) / 9) * 0.12;
  return base * week * trend * (0.85 + r * 0.3);
}

// 시간 곡선: 새벽 낮고 오후 · 저녁 높음
const HOUR_CURVE = [0.25, 0.18, 0.14, 0.12, 0.12, 0.16, 0.3, 0.55, 0.85, 1.05, 1.15, 1.2, 1.25, 1.2, 1.15, 1.1, 1.1, 1.15, 1.3, 1.45, 1.5, 1.35, 0.95, 0.55];
const HOUR_SUM = HOUR_CURVE.reduce((a, b) => a + b, 0);

export function insightValues(event: string, dates: Date[], granularity: 'HOUR' | 'DAY' | 'MONTH', measurement: 'UNIQUE_USER' | 'TOTAL_COUNT') {
  const mult = measurement === 'TOTAL_COUNT' ? 1.6 + (seedOf(event) % 10) / 10 : 1;
  return dates.map((d) => {
    let v: number;
    if (granularity === 'HOUR') {
      const r = rng(seedOf(event + dayKey(d) + d.getHours()))();
      v = (dailyValue(event, d) * HOUR_CURVE[d.getHours()]) / HOUR_SUM * (0.8 + r * 0.4);
    } else if (granularity === 'MONTH') {
      const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      v = 0;
      for (let i = 1; i <= days; i++) v += dailyValue(event, new Date(d.getFullYear(), d.getMonth(), i));
    } else v = dailyValue(event, d);
    return Math.round(v * mult);
  });
}

export function funnelCounts(eventsInOrder: string[]) {
  const known: Record<string, number> = { soob: 20, deferred: 6, 'email.delivered': 2 };
  const staging = eventsInOrder.every((e) => e in known) && eventsInOrder[0] === 'soob';
  const out: number[] = [];
  eventsInOrder.forEach((e, i) => {
    if (staging) {
      out.push(i === 0 ? known[e] : Math.min(known[e], out[i - 1]));
      return;
    }
    if (i === 0) {
      out.push(Math.round(2000 + (seedOf(e) % 6000)));
      return;
    }
    const rate = 0.3 + rng(seedOf(eventsInOrder.slice(0, i + 1).join('>')))() * 0.45; // 앞 단계 대비 30~75%
    out.push(Math.round(out[i - 1] * rate));
  });
  return out;
}
