// 보낸 메시지 더미 — docs/staging-behavior-sent-history.md 의 응답 필드 중 화면이 읽는 것만.
// 앞쪽 항목은 Figma 시안(스테이징 실데이터) 그대로, 뒤쪽은 페이지를 채우려고 지어낸 것.
export type Source = 'console' | 'api' | 'testDevice' | 'system';
export const SOURCES: { value: Source; label: string }[] = [
  { value: 'console', label: '콘솔' },
  { value: 'api', label: 'API' },
  { value: 'testDevice', label: '테스트' },
  { value: 'system', label: '시스템' },
];
export const sourceLabel = (s: Source) => SOURCES.find((x) => x.value === s)!.label;

export type Segment = { name: string; isDefault?: boolean; conditions?: string[] }; // 조건 = 「필드|연산자 값」
export type Target =
  | { kind: 'segment'; include: Segment[][]; exclude?: Segment[][] }
  | { kind: 'csv'; file: string }
  | { kind: 'ids'; label: '유저 ID' | '기기' | '전화번호' | '이메일'; ids: string[] };

export type Conversion = { id: string; eventType: string; purchase?: boolean; filters?: string[]; basis?: 'SEND' | 'CLICK'; hours: number; candidate: number; converted: number; amount?: number };

export type Platform = 'android' | 'ios' | 'webDesktop' | 'webMobile';
export const PLATFORMS: Platform[] = ['android', 'ios', 'webDesktop', 'webMobile'];
export const PLATFORM_LABEL: Record<Platform, string> = { android: '앱(안드로이드)', ios: '앱(iOS)', webDesktop: '웹(데스크탑)', webMobile: '웹(모바일)' };
export type PlatformStat = { sent: number; clicked: number; remaining: number; uninstalled: number; capped: number; failed: number; conversions?: number; amount?: number };

export type PushMessage = {
  id: string;
  source: Source;
  campaignName?: string;
  title?: string;
  body: string;
  url?: string;
  imageUrl?: string;
  buttons?: { label: string; link: string }[];
  data?: Record<string, string>;
  createdAt: string; // yyyy.MM.dd HH:mm:ss
  targetPlatforms: Platform[];
  stats: Record<Platform, PlatformStat>;
  ttlMinutes?: number;
  rateLimitPerMinute?: number;
  targetSelectionRate?: number;
  ignoreCapping?: boolean;
  target: Target;
  conversions: Conversion[];
  failure: Record<string, number>;
  canExport: boolean;
};

type KakaoBase = {
  id: string;
  source: Source;
  campaignName?: string;
  createdAt: string;
  selected: number;
  sent: number;
  capped: number;
  unsubscribed: number;
  failed: number; // failed + aborted
  usedPoints: number;
  convertedUniqueUser: number;
  roas: number;
  ignoreCapping?: boolean;
  target: Target;
  conversions: Conversion[];
  failure: Record<string, number>;
  canExport: boolean;
};

export type AlimtalkMessage = KakaoBase & {
  categoryGroup: string;
  category: string;
  templateName: string;
  templateCode: string;
  emphasis: 'NONE' | 'TEXT' | 'IMAGE' | 'ITEM_LIST';
  messageType: 'BA' | 'EX' | 'AD' | 'MI';
  templateTitle?: string;
  templateSubtitle?: string;
  templateImage?: string;
  templateHeader?: string;
  itemHighlight?: { title: string; desc: string };
  items?: { name: string; desc: string }[];
  templateContent: string;
  templateExtra?: string;
  templateAd?: string;
  buttons: { type: string; name: string }[];
  security: boolean;
  interpolations: Record<string, string>;
};

export type FriendtalkMessage = KakaoBase & {
  messageType: 'FI' | 'FT' | 'FW' | 'FL' | 'FA' | 'FC';
  header?: string;
  text: string;
  image?: string;
  imageLink?: string;
  buttons: { name: string; link: string }[];
  isAd: boolean;
  targeting?: 'M' | 'N' | 'I';
  friendSent?: number;
  nonFriendSent?: number;
};

export type SmsMessage = KakaoBase & { type: 'SMS' | 'LMS' | 'MMS'; title?: string; body: string; isAd: boolean; image?: string };

export type EmailMessage = {
  id: string;
  source: Source;
  campaignName?: string;
  createdAt: string;
  title: string;
  senderEmail: string;
  body: string; // HTML
  delivered: number;
  pending: number;
  capped: number;
  unsubscribed: number;
  failed: number;
  aborted: number;
  opened: number;
  converted: number;
  purchaseAmount: number;
  softBounced: number;
  hardBounced: number;
  quotaExceeded: number;
  ignoreCapping?: boolean;
  target: Target;
  conversions: Conversion[];
  canExport: boolean;
};

export const FRIENDTALK_TYPE: Record<FriendtalkMessage['messageType'], string> = { FI: '기본 텍스트형', FT: '기본 텍스트형', FW: '와이드 이미지형', FL: '와이드 리스트형', FA: '캐러셀 커머스형', FC: '캐러셀 피드형' };

// ── 생성 도우미
const uuid = (seed: number) => {
  let h = (seed * 2654435761) >>> 0;
  const hex = () => {
    h = (h * 1103515245 + 12345) >>> 0;
    return (h >>> 8).toString(16).padStart(6, '0').slice(0, 4);
  };
  return `${hex()}${hex()}-${hex()}-4${hex().slice(1)}-${'89ab'[seed % 4]}${hex().slice(1)}-${hex()}${hex()}${hex()}`;
};
const at = (day: string, i: number) => `${day} ${String(9 + ((i * 5) % 12)).padStart(2, '0')}:${String((i * 17) % 60).padStart(2, '0')}:${String((i * 29) % 60).padStart(2, '0')}`;
const dayOf = (i: number) => {
  const d = new Date(2026, 8, 30 - Math.floor(i * 1.3));
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};
const pickSource = (i: number): Source => (i % 7 === 3 ? 'api' : i % 11 === 5 ? 'testDevice' : i % 13 === 9 ? 'system' : 'console');

const VIP: Target = { kind: 'segment', include: [[{ name: 'VIP 유저', conditions: ['유저 ID|= user_0001'] }]] };
const ALL: Target = { kind: 'segment', include: [[{ name: '전체 유저', isDefault: true }]] };
const KAKAO_CONV: Conversion[] = [
  { id: 'c1', eventType: '첫 방문', filters: ['notification_id 이 중에 하나 332558aa-4f4c-4b7e-9d1c-8f0e2a6b1c3d'], hours: 72, candidate: 1, converted: 0 },
  { id: 'c2', eventType: 'purchase_completed', purchase: true, hours: 72, candidate: 1, converted: 0, amount: 0 },
];

const zeroStat = (): PlatformStat => ({ sent: 0, clicked: 0, remaining: 0, uninstalled: 0, capped: 0, failed: 0, conversions: 0, amount: 0 });

// ── 푸시
const PUSH_SEED: [string, string, string, string | undefined, Source, string, Partial<Record<Platform, number>>, number][] = [
  ['PR3-16 CSV 업로드 검증', '#16 CSV 업로드', '쿠폰 {{ coupon }}', 'https://flarelane.com/coupon/september', 'console', '2026.09.11 11:22:20', { webDesktop: 1 }, 0],
  ['PR3-15 단건 개인화', '#15 단건 {{ name }}님', "{{ tags.grade }} 등급 · 기기 {{ tags['@device_device_note'] }}", 'https://flarelane.com/my/grade', 'api', '2026.09.11 11:07:19', { webDesktop: 1 }, 0],
  ['PR3-14 고정 제목', '#14 고정 제목', '변수 없는 고정 본문 (wire 형태 확인)', 'https://flarelane.com/notice/wire-check', 'console', '2026.09.10 19:51:58', { android: 1 }, 0],
  ['PR3-13 abort 조건', '#13 abort', '{% if tags.grade == "GOLD" %}{% abort_message %}{% endif %}본문', 'https://flarelane.com/abort-test', 'system', '2026.09.10 19:51:18', {}, 1],
  ['PR3-12 다중 플랫폼', '#12 전체 발송', '안드로이드 · iOS · 웹 동시 발송 확인', 'https://flarelane.com/multi', 'console', '2026.09.10 18:02:41', { android: 128, ios: 64, webDesktop: 212, webMobile: 37 }, 3],
  ['PR3-11 이미지 첨부', '#11 이미지 푸시', '가을 신상품이 도착했어요', 'https://flarelane.com/new-arrivals', 'console', '2026.09.09 14:30:12', { android: 1240, ios: 820 }, 12],
];
export const pushMessages: PushMessage[] = Array.from({ length: 27 }, (_, i): PushMessage => {
  const s = PUSH_SEED[i];
  const sentBy: Partial<Record<Platform, number>> = s ? s[6] : { android: 40 + ((i * 37) % 300), ios: (i * 23) % 140, webDesktop: (i * 51) % 260, webMobile: (i * 13) % 60 };
  const stats = Object.fromEntries(
    PLATFORMS.map((p) => {
      const sent = sentBy[p] ?? 0;
      const clicked = Math.floor(sent * (((i * 7) % 9) / 100));
      return [p, { ...zeroStat(), sent, clicked, remaining: p === 'android' && i === 4 ? 2 : 0, capped: p === 'ios' && i % 5 === 4 ? 3 : 0, uninstalled: p === 'webDesktop' && i % 4 === 1 && sent > 5 ? 2 : 0, failed: p === 'android' ? (s ? s[7] : i % 3) : 0, conversions: Math.floor(clicked / 3), amount: Math.floor(clicked / 3) * 29000 }];
    }),
  ) as Record<Platform, PlatformStat>;
  const failedTotal = PLATFORMS.reduce((a, p) => a + stats[p].failed, 0);
  return {
    id: i === 0 ? '29efb8f2-1ec0-4c6e-9e00-4732da03f461' : uuid(100 + i),
    source: s ? s[4] : pickSource(i),
    campaignName: s ? s[0] : i % 4 === 0 ? undefined : `가을 프로모션 ${i}차`,
    title: s ? s[1] : `[${i}차] 지금만 드리는 혜택`,
    body: s ? s[2] : '{{ name }}님, 장바구니에 담아 둔 상품이 할인 중이에요.',
    url: s ? s[3] : i % 3 === 0 ? undefined : `https://flarelane.com/event/${i}`,
    imageUrl: i === 5 || i % 6 === 2 ? 'https://picsum.photos/seed/fl-push/600/300' : undefined,
    buttons: i === 4 ? [{ label: '바로 보기', link: 'https://flarelane.com/multi' }, { label: '나중에', link: 'https://flarelane.com' }] : undefined,
    data: i === 4 ? { coupon: 'AUTUMN10', screen: 'home' } : undefined,
    createdAt: s ? s[5] : at(dayOf(i - 6), i),
    targetPlatforms: PLATFORMS.filter((p) => (sentBy[p] ?? 0) > 0 || i === 3),
    stats,
    ttlMinutes: i === 0 ? 4320 : i % 2 ? 1440 : undefined,
    rateLimitPerMinute: i === 0 ? 100 : undefined,
    targetSelectionRate: i === 4 ? 0.5 : undefined,
    ignoreCapping: i % 2 === 0 ? false : undefined,
    target: i === 0 ? { kind: 'csv', file: '1789093339838-pr3-usercustomdata.csv' } : i === 1 ? { kind: 'ids', label: '유저 ID', ids: ['user_0001', 'user_0002'] } : i % 2 ? VIP : ALL,
    conversions: i === 4 ? [{ id: 'pc1', eventType: 'purchase_completed', purchase: true, hours: 72, candidate: 441, converted: 9, amount: 261000 }] : [],
    failure: failedTotal ? { PROVIDER_REJECTED: Math.ceil(failedTotal / 2), DEVICE_NOT_FOUND: Math.floor(failedTotal / 2) } : {},
    canExport: i !== 3,
  };
});

// ── 알림톡
const ALIM_SEED: [string, string, number][] = [
  ['[디자인 QA] 알림톡 전환·변수 테스트', '2026.10.07 13:11:09', 1],
  ['FL1561 E render userId', '2026.09.16 12:55:40', 1],
  ['FL1561 E control literal', '2026.09.16 12:51:19', 1],
  ['FL1561 E render check', '2026.09.16 12:40:53', 0],
  ['P5 N-2 header only unmapped', '2026.09.15 18:37:11', 0],
  ['P5 N-3 broken liquid csv', '2026.09.15 17:48:02', 0],
  ['P5 AlimtalkBulk segment', '2026.09.15 16:24:30', 1],
  ['P5 AlimtalkSingle phone', '2026.09.15 16:23:10', 1],
  ['P5 AlimtalkCsv', '2026.09.15 16:20:54', 1],
];
export const alimtalkMessages: AlimtalkMessage[] = Array.from({ length: 46 }, (_, i): AlimtalkMessage => {
  const s = ALIM_SEED[i];
  const selected = s ? (i === 0 ? 2 : 1) : 1 + ((i * 7) % 4);
  const sent = s ? s[2] : Math.max(0, selected - (i % 3 === 0 ? 1 : 0));
  return {
    id: i === 0 ? 'e802ab58-94f9-4369-af30-53c5c087ecae' : uuid(300 + i),
    source: s ? 'console' : pickSource(i),
    campaignName: s ? s[0] : `알림톡 회귀 ${i}`,
    createdAt: s ? s[1] : at(dayOf(i - 4).replace('2026.09', '2026.08'), i),
    selected,
    sent,
    capped: 0,
    unsubscribed: 0,
    failed: selected - sent,
    usedPoints: sent * 7.9,
    convertedUniqueUser: 0,
    roas: 0,
    ignoreCapping: i === 0 ? true : undefined,
    target: i === 0 || i === 6 ? VIP : i === 7 ? { kind: 'ids', label: '전화번호', ids: ['010-0000-0000'] } : i === 8 ? { kind: 'csv', file: 'alimtalk-target.csv' } : ALL,
    conversions: i === 0 ? KAKAO_CONV : [],
    failure: selected - sent ? { UNABLE_TO_SEND: selected - sent } : {},
    canExport: i === 0 || i === 6,
    categoryGroup: '회원',
    category: '회원가입',
    templateName: i === 0 ? '아이템 리스트 - 복합형' : '아이템 리스트 변수 - v3',
    templateCode: 'itemListMI',
    emphasis: 'ITEM_LIST',
    messageType: 'MI',
    templateImage: 'item-list-header.png',
    templateHeader: '아이템 리스트 헤더',
    itemHighlight: { title: '타이틀 -', desc: '디스크립션 -' },
    items: [1, 2, 3, 4].map((n) => ({ name: `아이템${n}`, desc: `내용${n}` })),
    templateContent: i === 0 ? 'test 아이템 리스트 복합형 테스트' : 'test 입니다',
    templateExtra: '아이템 리스트 부가정보입니다. 이것저것 내용 넣어보는 중',
    templateAd: '채널 추가하고 이 채널의 마케팅 메시지 등을 카카오톡으로 받기',
    buttons: [
      { type: '채널 추가', name: '채널 추가' },
      { type: '봇키워드', name: '봇 버튼' },
      { type: '메시지 전달', name: '메시지' },
    ],
    security: false,
    interpolations: { '#{header}': '{{ name }}님 알림', '#{title}': '{{ tags.grade }} 등급', '#{desc}': 'PR4 A-2 검증', '#{body}': '{{ userId }}', '#{sum}': '1,000원' },
  };
});

// ── 브랜드메시지
const FRIEND_SEED: [string, string, string, number][] = [
  ['[FL-1667] staging 브랜드메시지', '[FL-1667] {{ name }}님 브랜드메시지', '2026.09.30 15:41:31', 0],
  ['PR8-S3-friendtalk-button', '[PR8] {{ "ok" | upcase }} name={{ name }}', '2026.09.22 12:50:57', 1],
  ['PR8-S3-friendtalk-button', '[PR8] {{ "ok" | upcase }} name={{ name }}', '2026.09.22 12:24:00', 1],
  ['PR8-S3-friendtalk-button', '[PR8] {{ "ok" | upcase }} name={{ name }}', '2026.09.21 16:28:39', 0],
  ['P6 Friendtalk phone fix', '{{ name }}님 {{ tags.grade }} 등급 친구톡 (PR4 A-3)', '2026.09.18 18:53:45', 0],
  ['P6 Friendtalk phone fix', '{{ name }}님 {{ tags.grade }} 등급 친구톡 (PR4 A-3)', '2026.09.18 16:42:54', 1],
];
export const friendtalkMessages: FriendtalkMessage[] = Array.from({ length: 41 }, (_, i): FriendtalkMessage => {
  const s = FRIEND_SEED[i];
  const sent = s ? s[3] : i % 4 ? 1 : 0;
  return {
    id: uuid(500 + i),
    source: s ? 'console' : pickSource(i),
    campaignName: s ? s[0] : `브랜드메시지 점검 ${i}`,
    createdAt: s ? s[2] : at(dayOf(i - 3).replace('2026.09', '2026.08'), i),
    selected: 1,
    sent,
    capped: 0,
    unsubscribed: 0,
    failed: 1 - sent,
    usedPoints: sent * 15,
    convertedUniqueUser: 0,
    roas: 0,
    target: i % 2 ? VIP : { kind: 'ids', label: '전화번호', ids: ['010-0000-0000'] },
    conversions: i === 0 ? KAKAO_CONV : [],
    failure: sent ? {} : { RECEIVING_BLOCKED: 1 },
    canExport: i % 2 === 1,
    messageType: 'FT',
    text: s ? s[1] : '{{ name }}님, 이번 주 혜택을 확인해 보세요.',
    buttons: i === 1 || i === 2 ? [{ name: '자세히 보기', link: 'https://flarelane.com' }] : [],
    isAd: i % 3 === 0,
    targeting: i === 0 ? 'M' : 'I',
    friendSent: i === 0 ? 0 : undefined,
    nonFriendSent: i === 0 ? 0 : undefined,
  };
});

// ── 문자
const SMS_SEED: [string | undefined, string, string, SmsMessage['type']][] = [
  ['[FL-1667] staging SMS', '[FL-1667] {{ name }}님 SMS', '2026.09.30 15:37:29', 'SMS'],
  ['FL-1666 staging 문자 회귀', '[FL-1666] {{ name || 고객 }}님 / {{ tags.grade || 없음 }} / {{ tags.cc_test_missing || 기본값 }}', '2026.09.29 11:36:10', 'LMS'],
  ['PR8-S8-sms-bulk-csv', '(광고) [플레어레인] [PR8-S8] bulk name={{ name }} 무료수신거부: null', '2026.09.21 17:00:20', 'SMS'],
  ['PR8-S15-sms-abort', '(광고) [플레어레인] [PR8-abort] {% abort_message %} never 무료수신거부: null', '2026.09.21 16:36:01', 'SMS'],
  ['PR8-S1-sms-render', '(광고) [플레어레인] [PR8] {{ "ok" | upcase }} name={{ name }} grade={{ tags.grade }} 무료수신거부: null', '2026.09.21 16:24:03', 'LMS'],
  [undefined, '(광고) [플레어레인] test 무료수신거부: null 무료수신거부: null', '2026.09.18 10:34:57', 'SMS'],
];
export const smsMessages: SmsMessage[] = Array.from({ length: 44 }, (_, i): SmsMessage => {
  const s = SMS_SEED[i];
  const sent = s ? (i === 3 ? 0 : 1) : i % 5 ? 1 : 0;
  return {
    id: uuid(700 + i),
    source: s ? 'console' : pickSource(i),
    campaignName: s ? s[0] : `문자 점검 ${i}`,
    createdAt: s ? s[2] : at(dayOf(i - 3).replace('2026.09', '2026.08'), i),
    selected: 1,
    sent,
    capped: 0,
    unsubscribed: i === 5 ? 1 : 0,
    failed: 1 - sent,
    usedPoints: sent * (s?.[3] === 'LMS' ? 30 : 9.9),
    convertedUniqueUser: 0,
    roas: 0,
    target: i % 2 ? VIP : { kind: 'ids', label: '전화번호', ids: ['010-0000-0000'] },
    conversions: i === 0 ? KAKAO_CONV : [],
    failure: sent ? {} : { LIQUID_ABORTED: 1 },
    canExport: i % 2 === 1,
    type: s ? s[3] : i % 3 ? 'SMS' : 'LMS',
    title: s?.[3] === 'LMS' ? '[플레어레인] 안내' : undefined,
    body: s ? s[1] : '[플레어레인] {{ name }}님, 주문하신 상품이 출고되었습니다.',
    isAd: (s ? s[1] : '').startsWith('(광고)'),
  };
});

// ── 이메일
const EMAIL_SEED: [string, string, string, number, number][] = [
  ['FL-1692 link click test', '[FL-1692] 링크별 클릭 테스트', '2026.09.30 15:04:35', 1, 0],
  ['FL-1692 link click test', '[FL-1692] 링크별 클릭 테스트', '2026.09.30 15:03:59', 0, 0],
  ['FL-1666 staging 이메일 본문', '[FL-1666] 본문 치환 테스트', '2026.09.29 12:18:47', 1, 1],
  ['FL-1666 staging 이메일 회귀', '[FL-1666] {{ userId }} / {{ name || 고객 }} 테스트', '2026.09.28 18:24:30', 1, 1],
  ['PR8-S5-email-csv', '[PR8-S5] {{ name }}님께', '2026.09.21 16:57:21', 1, 0],
  ['PR8-S4-email-render', '[PR8] {{ "ok" | upcase }} 렌더 확인', '2026.09.21 16:40:08', 1, 1],
];
export const emailMessages: EmailMessage[] = Array.from({ length: 23 }, (_, i): EmailMessage => {
  const s = EMAIL_SEED[i];
  const delivered = s ? s[3] : (i * 3) % 5;
  return {
    id: uuid(900 + i),
    source: s ? 'console' : pickSource(i),
    campaignName: s ? s[0] : `뉴스레터 ${i}호`,
    createdAt: s ? s[2] : at(dayOf(i - 3).replace('2026.09', '2026.08'), i),
    title: s ? s[1] : `[플레어레인] 뉴스레터 ${i}호`,
    senderEmail: 'test@noreply.flarelane.com',
    body: `<div style="font-family:sans-serif;padding:24px;color:#111827"><h1 style="font-size:20px">${s ? s[1] : '이달의 소식'}</h1><p>안녕하세요 {{ name }}님,</p><p>플레어레인 이메일 발송 테스트입니다. <a href="https://flarelane.com">자세히 보기</a></p></div>`,
    delivered,
    pending: 0,
    capped: 0,
    unsubscribed: 0,
    failed: s && s[3] === 0 ? 1 : 0,
    aborted: 0,
    opened: s ? s[4] : Math.min(delivered, i % 2),
    converted: 0,
    purchaseAmount: 0,
    softBounced: s && s[3] === 0 ? 1 : 0,
    hardBounced: 0,
    quotaExceeded: 0,
    target: { kind: 'ids', label: '이메일', ids: ['hk@example.com'] },
    conversions: i === 0 ? [{ id: 'ec1', eventType: 'link_click', basis: 'CLICK', hours: 24, candidate: 1, converted: 0 }] : [],
    canExport: true,
  };
});

// 최신순(스테이징 서버 기본 정렬 추정)
for (const l of [pushMessages, alimtalkMessages, friendtalkMessages, smsMessages, emailMessages] as { createdAt: string }[][]) l.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

// ── 공통 포맷
export const PER = 10;
export const MAX_PAGES = 500;
export const fmt = (n: number) => n.toLocaleString('ko-KR');
// 1,000 이상 축약(소수 2자리 버림)
export const abbrNum = (n: number) => {
  for (const [v, u] of [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']] as const) if (n >= v) return `${Math.floor((n / v) * 100) / 100}${u}`;
  return String(n);
};
export const pct = (a: number, b: number) => `${(b ? (a / b) * 100 : 0).toFixed(1)}%`;
export const won = (n: number) => `₩${n.toLocaleString('ko-KR')}`;
export const hoursLabel = (h: number) => (h % 24 === 0 ? `${h / 24}일` : `${h}시간`);

export const matches = (q: string, ...fields: (string | undefined)[]) => {
  const k = q.trim().toLowerCase();
  return !k || fields.some((f) => f?.toLowerCase().includes(k));
};
