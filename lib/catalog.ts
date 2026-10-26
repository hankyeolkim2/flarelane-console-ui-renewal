// 이벤트 · 속성 · 세그먼트 카탈로그 — Figma 시안(스테이징 값)에서 옮김.
// [확인됨] 이벤트 이름 목록 앞부분 · soob 속성(w6, w7) · 퍼널 수(20/6/2) (banner_impression-v1 은 스테이징에선 속성 없음)
// [임시] 속성값 · 세그먼트 · 유저/기기 속성 목록 — 스테이징 카탈로그 API(로그인 필요)에서 아직 못 읽음

export const RECENT_DAYS = 30;

export type EventItem = { name: string; recent: number; properties: string[] };

// 속성: soob(w6, w7)만 스테이징 값, 나머지는 [임시] 더미(10-21 「적당히 채워줘」, 10-22 「속성 · 값 전부 채워줘」).
// banner_impression-v1 은 스테이징에선 속성 없음 — 프로토타입은 필터 확인용으로 더미를 넣음.
export const events: EventItem[] = [
  { name: '1', recent: 0, properties: ['label', 'value', 'page', 'platform'] },
  { name: '12345', recent: 0, properties: ['order_id', 'amount', 'currency', 'payment_method', 'platform'] },
  { name: 'add_to_cart', recent: 0, properties: ['product_id', 'product_name', 'category', 'price', 'quantity', 'platform'] },
  { name: 'app_opened', recent: 0, properties: ['app_version', 'os', 'os_version', 'launch_source', 'is_first_open'] },
  { name: 'banner_impression-v1', recent: 0, properties: ['banner_id', 'banner_name', 'placement', 'position', 'campaign'] },
  { name: 'begin_checkout', recent: 0, properties: ['cart_id', 'item_count', 'total_price', 'coupon_code', 'payment_method'] },
  { name: 'blacklist', recent: 0, properties: ['reason', 'channel', 'source'] },
  { name: 'brown', recent: 0, properties: ['color', 'size', 'category', 'price'] },
  { name: 'cat', recent: 0, properties: ['breed', 'age', 'gender', 'color'] },
  { name: 'claude_track_test', recent: 0, properties: ['test_id', 'variant', 'step', 'platform'] },
  { name: 'deferred', recent: 6, properties: ['link_id', 'campaign', 'source', 'medium'] },
  { name: 'email.delivered', recent: 2, properties: ['campaign_id', 'template_id', 'email_domain', 'message_type'] },
  { name: 'soob', recent: 20, properties: ['w6', 'w7'] },
];

// [임시] 속성값 — w6 · w7 외에는 더미. 이벤트 속성 + 유저 · 기기 속성(타겟 · 새 메시지 필터) 전부.
export const propertyValues: Record<string, string[]> = {
  w6: ['x', 'y', 'z'],
  w7: ['k'],
  // 공통
  platform: ['iOS', 'Android', 'Web'],
  page: ['home', 'product_detail', 'cart', 'checkout', 'mypage'],
  label: ['banner', 'popup', 'button', 'card'],
  value: ['0', '1', '10', '100'],
  // 주문 · 결제
  order_id: ['ORD-240901-0001', 'ORD-240915-0128', 'ORD-241002-0542', 'ORD-241008-0913'],
  amount: ['9900', '29000', '59000', '129000'],
  currency: ['KRW', 'USD', 'JPY'],
  payment_method: ['card', 'kakaopay', 'naverpay', 'bank_transfer'],
  cart_id: ['CART-1001', 'CART-1002', 'CART-1003'],
  item_count: ['1', '2', '3', '5'],
  total_price: ['15000', '42000', '89000', '210000'],
  coupon_code: ['FALL15', 'WELCOME10', 'VIP20'],
  // 상품
  product_id: ['P-1001', 'P-1002', 'P-2001', 'P-3005'],
  product_name: ['가을 스니커즈', '울 니트', '데님 재킷', '레더 백'],
  category: ['신발', '상의', '아우터', '가방'],
  price: ['19900', '39000', '79000', '159000'],
  quantity: ['1', '2', '3'],
  // 앱
  app_version: ['3.2.0', '3.3.1', '3.4.0'],
  os: ['Android', 'iOS'],
  os_version: ['iOS 17.6', 'iOS 18.0', 'Android 13', 'Android 14'],
  launch_source: ['push', 'direct', 'deeplink'],
  is_first_open: ['true', 'false'],
  // 배너
  banner_id: ['BN-001', 'BN-002', 'BN-003'],
  banner_name: ['가을 세일', '신규 가입 혜택', 'VIP 전용'],
  placement: ['home_top', 'home_middle', 'category', 'cart'],
  position: ['1', '2', '3'],
  // 차단 · 채널
  reason: ['spam', 'unsubscribed', 'bounced'],
  channel: ['push', 'sms', 'email', 'kakao'],
  // 기타 테스트 이벤트
  color: ['brown', 'black', 'beige', 'white'],
  size: ['S', 'M', 'L', 'XL'],
  breed: ['korean_short', 'persian', 'siamese'],
  age: ['1', '3', '5', '8'],
  gender: ['male', 'female'],
  test_id: ['T-01', 'T-02', 'T-03'],
  variant: ['A', 'B', 'C'],
  step: ['1', '2', '3'],
  // 유입
  link_id: ['LNK-a1b2', 'LNK-c3d4', 'LNK-e5f6'],
  campaign: ['autumn_sale', 'welcome', 'vip_event'],
  source: ['instagram', 'kakao', 'naver', 'google'],
  medium: ['cpc', 'social', 'email', 'push'],
  // 이메일
  campaign_id: ['CMP-0901', 'CMP-0915', 'CMP-1002'],
  template_id: ['TPL-welcome', 'TPL-cart-remind', 'TPL-receipt'],
  email_domain: ['gmail.com', 'naver.com', 'daum.net', 'example.com'],
  message_type: ['marketing', 'transactional'],
  // 유저 속성
  '국가 코드': ['KR', 'US', 'JP', 'CN'],
  '언어 코드': ['ko', 'en', 'ja', 'zh'],
  생일: ['1990-01-15', '1995-06-30', '2000-12-24'],
  '문자 수신 거부': ['true', 'false'],
  grade: ['VIP', 'Gold', 'Silver', 'Bronze'],
  name: ['김플레', '이레인', '박콘솔'],
  // 기기 속성
  플랫폼: ['App(iOS)', 'App(Android)', 'Web(Windows)', 'Web(Mac)'],
  '웹 브라우저': ['Chrome', 'Safari', 'Edge', 'Firefox'],
  '테스트 기기': ['true', 'false'],
  '구독 여부': ['true', 'false'],
  '@device_model': ['iPhone 15', 'iPhone 13', 'Galaxy S24', 'Galaxy A54'],
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
