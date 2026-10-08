// 푸시 템플릿 더미 — docs/staging-behavior-new-message-templates.md 8.1 · 8.2.
import type { AlimtalkMessage, Platform } from './sent';

export type TemplateCategory = { id: string; name: string; color: string };
export type PushTemplate = {
  id: string;
  name: string;
  category?: TemplateCategory;
  title?: string;
  body: string;
  url?: string;
  imageUrl?: string;
  buttons?: { label: string; link: string }[];
  data?: Record<string, string>;
  targetPlatforms: Platform[];
  ignoreCapping: boolean;
  conversion?: { event: string; hours: number; basis: 'CLICK' | 'SEND' };
  createdAt: string;
  updatedAt: string;
  sent: number;
  clicked: number;
  converted: number;
  amount: number;
};

// 배지 색 = components/ui/Badge 팔레트 이름
export const categories: TemplateCategory[] = [
  { id: 'c1', name: '프로모션', color: 'orange' },
  { id: 'c2', name: '공지', color: 'sky' },
  { id: 'c3', name: '리텐션', color: 'purple' },
];
export const CATEGORY_COLORS = ['gray', 'brand', 'success', 'error', 'warning', 'sky', 'orange', 'indigo', 'purple'];

const ALL: Platform[] = ['android', 'ios', 'webDesktop', 'webMobile'];
const SEED: [string, number | null, string, string, string | undefined, string][] = [
  ['가을 시즌 오프', 0, '[가을 시즌 오프] 최대 50% 할인', '{{ name | default: "고객" }}님, 이번 주말까지만 드리는 혜택을 확인하세요.', 'https://flarelane.com/event/autumn', '2026.10.06 14:20:11'],
  ['장바구니 리마인드', 2, '장바구니에 담아 둔 상품이 있어요', '담아 둔 상품이 곧 품절될 수 있어요. 지금 확인해 보세요.', 'https://flarelane.com/cart', '2026.10.02 09:12:40'],
  ['서비스 점검 안내', 1, '서비스 점검 안내', '10월 12일(일) 02:00~04:00 서비스 점검이 진행됩니다.', undefined, '2026.09.28 18:03:55'],
  ['신규 가입 환영', 2, '가입을 환영해요!', '첫 구매 시 사용할 수 있는 10% 쿠폰이 발급되었어요.', 'https://flarelane.com/coupon', '2026.09.20 11:45:00'],
  ['앱 업데이트', null, '새 버전이 출시되었어요', '더 빨라진 검색과 새로운 홈 화면을 만나보세요.', 'https://flarelane.com/app', '2026.09.11 16:30:21'],
  ['주간 베스트', 0, '이번 주 베스트 상품', '지난주 가장 많이 본 상품 10개를 모았어요.', 'https://flarelane.com/best', '2026.09.04 10:00:00'],
  ['포인트 소멸 예정', 2, '포인트 소멸 예정 안내', '{{ tags.point | default: "0" }}P가 이번 달 말 소멸될 예정이에요.', 'https://flarelane.com/my/point', '2026.08.27 13:10:08'],
];

export const pushTemplates: PushTemplate[] = SEED.map(([name, cat, title, body, url, at], i) => ({
  id: String(1200 + i),
  name,
  category: cat === null ? undefined : categories[cat],
  title,
  body,
  url,
  imageUrl: i === 0 ? 'https://picsum.photos/seed/fl-push/600/300' : undefined,
  buttons: i === 0 ? [{ label: '혜택 보기', link: 'https://flarelane.com/event/autumn' }] : undefined,
  data: i === 1 ? { screen: 'cart' } : undefined,
  targetPlatforms: i === 4 ? ['android', 'ios'] : ALL,
  ignoreCapping: false,
  conversion: i === 0 ? { event: 'purchase_completed', hours: 72, basis: 'CLICK' } : undefined,
  createdAt: at,
  updatedAt: at,
  sent: [12840, 3420, 51200, 880, 0, 9100, 2210][i],
  clicked: [1034, 288, 2410, 121, 0, 612, 140][i],
  converted: [86, 21, 0, 14, 0, 33, 9][i],
  amount: [2494000, 609000, 0, 406000, 0, 957000, 261000][i],
}));

const listeners = new Set<() => void>();
export const subscribeTemplates = (f: () => void) => {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
};
export const emitTemplates = () => listeners.forEach((f) => f());

// ── 알림톡 템플릿 (docs 8.5 ~ 8.7). 검수 상태: TMP 검수 전 · APL 검수 전(신청) · REQ 검수 중 · COM 검수 완료 · REJ 반려됨
export type Inspection = 'TMP' | 'APL' | 'REQ' | 'COM' | 'REJ';
export type AlimtalkTemplate = Pick<AlimtalkMessage, 'categoryGroup' | 'category' | 'templateName' | 'templateCode' | 'emphasis' | 'messageType' | 'templateTitle' | 'templateSubtitle' | 'templateImage' | 'templateHeader' | 'itemHighlight' | 'items' | 'templateContent' | 'templateExtra' | 'templateAd' | 'buttons' | 'security'> & {
  id: string;
  inspection: Inspection;
  sender: string;
  createdAt: string;
  updatedAt: string;
  rejectComment?: string;
  stats: { selected: number; sent: number; converted: number; roas: number };
};
export const SENDER = { plusFriendId: '@flarelane', name: '플레어레인' };
export const INSPECTION_LABEL: Record<Inspection, string> = { TMP: '검수 전', APL: '검수 전', REQ: '검수 중', COM: '검수 완료', REJ: '반려됨' };
const AT: [string, string, Inspection, AlimtalkTemplate['emphasis'], AlimtalkTemplate['messageType'], string, string, string][] = [
  ['주문 완료 안내', 'order_done_v2', 'COM', 'NONE', 'BA', '거래', '주문', '#{name}님, 주문이 완료되었습니다.\n주문번호: #{orderNo}\n결제금액: #{price}'],
  ['배송 시작 안내', 'ship_start', 'COM', 'TEXT', 'BA', '거래', '배송', '#{name}님의 상품이 배송을 시작했어요.\n운송장 번호: #{invoice}'],
  ['회원가입 환영', 'welcome_01', 'COM', 'NONE', 'AD', '회원', '회원가입', '#{name}님, 플레어레인 가입을 환영합니다!\n첫 구매 10% 쿠폰을 드려요.'],
  ['아이템 리스트 - 복합형', 'itemListMI', 'COM', 'ITEM_LIST', 'MI', '회원', '회원가입', 'test 아이템 리스트 복합형 테스트'],
  ['예약 확인', 'reserve_ok', 'COM', 'IMAGE', 'EX', '예약', '예약 완료', '#{name}님, #{date} 예약이 확인되었습니다.'],
  ['포인트 소멸 예정', 'point_expire', 'REQ', 'NONE', 'BA', '회원', '포인트', '#{name}님, #{point}P가 #{date}에 소멸될 예정입니다.'],
  ['비밀번호 변경', 'pw_change', 'REJ', 'NONE', 'BA', '회원', '보안', '#{name}님, 비밀번호가 변경되었습니다.'],
  ['쿠폰 발급 안내', 'coupon_new', 'TMP', 'NONE', 'AD', '마케팅', '쿠폰', '#{name}님께 #{coupon} 쿠폰이 발급되었어요.'],
  ['재입고 알림', 'restock', 'APL', 'TEXT', 'BA', '거래', '재입고', '찜하신 #{item} 상품이 재입고되었습니다.'],
  ['결제 실패 안내', 'pay_fail', 'COM', 'NONE', 'BA', '거래', '결제', '#{name}님, 결제가 실패했습니다. 결제수단을 확인해 주세요.'],
];
export const alimtalkTemplates: AlimtalkTemplate[] = AT.map(([templateName, templateCode, inspection, emphasis, messageType, categoryGroup, category, templateContent], i) => ({
  id: String(5100 + i),
  templateName,
  templateCode,
  inspection,
  emphasis,
  messageType,
  categoryGroup,
  category,
  templateContent,
  templateTitle: emphasis === 'TEXT' ? '#{title}' : undefined,
  templateSubtitle: emphasis === 'TEXT' ? '안내' : undefined,
  templateImage: emphasis === 'IMAGE' || emphasis === 'ITEM_LIST' ? 'header.png' : undefined,
  templateHeader: emphasis === 'ITEM_LIST' ? '아이템 리스트 헤더' : undefined,
  itemHighlight: emphasis === 'ITEM_LIST' ? { title: '타이틀', desc: '디스크립션' } : undefined,
  items: emphasis === 'ITEM_LIST' ? [1, 2, 3].map((n) => ({ name: `아이템${n}`, desc: `#{item${n}}` })) : undefined,
  templateExtra: messageType === 'EX' || messageType === 'MI' ? '자세한 내용은 고객센터로 문의해 주세요.' : undefined,
  templateAd: messageType === 'AD' || messageType === 'MI' ? '채널 추가하고 이 채널의 마케팅 메시지 등을 카카오톡으로 받기' : undefined,
  buttons: messageType === 'AD' || messageType === 'MI' ? [{ type: '채널 추가', name: '채널 추가' }, { type: '웹 링크', name: '자세히 보기' }] : [{ type: '웹 링크', name: '자세히 보기' }],
  security: i === 6,
  sender: SENDER.plusFriendId,
  createdAt: `2026.0${9 - (i % 3)}.${String(28 - i * 2).padStart(2, '0')} 1${i % 10}:20:00`,
  updatedAt: `2026.09.${String(29 - i).padStart(2, '0')} 10:00:00`,
  rejectComment: inspection === 'REJ' ? '변수 #{name} 에 대한 예시 값이 필요합니다. 수정 후 재검수 요청해 주세요.' : undefined,
  stats: inspection === 'COM' ? { selected: 1200 - i * 90, sent: 1150 - i * 90, converted: 40 - i * 3, roas: 320 - i * 25 } : { selected: 0, sent: 0, converted: 0, roas: 0 },
}));
export const varsOf = (t: Pick<AlimtalkTemplate, 'templateTitle' | 'templateContent' | 'templateHeader' | 'items' | 'itemHighlight'>) =>
  [...new Set([t.templateTitle, t.templateContent, t.templateHeader, t.itemHighlight?.title, t.itemHighlight?.desc, ...(t.items ?? []).flatMap((x) => [x.name, x.desc])].join('\n').match(/#\{[^}]+\}/g) ?? [])];

// ── 이메일 템플릿 (docs 6장 · 8.3 · 8.4). 프리셋 = 「빠른 시작」, 내 템플릿 = 저장한 템플릿.
export type EmailTemplate = { id: string; name: string; html: string; createdAt: string; conversion?: { event: string; hours: number; basis: 'CLICK' | 'SEND' }; stats: { sent: number; failed: number; opened: number; converted: number; amount: number } };
const shell = (inner: string) => `<!doctype html><html><body style="margin:0;background:#f3f4f6"><div style="max-width:600px;margin:0 auto;background:#fff;font-family:Pretendard,sans-serif;color:#111827">${inner}<div style="padding:24px;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb">플레어레인 · 서울시 강남구<br/><a href="{{ unsubscribe_url }}" style="color:#6b7280">수신거부</a></div></div></body></html>`;
const hero = (c1: string, c2: string, t: string) => `<div style="height:220px;background:linear-gradient(135deg,${c1},${c2});display:flex;align-items:flex-end;padding:24px;color:#fff;font-size:24px;font-weight:700">${t}</div>`;
const para = (t: string) => `<p style="margin:0;padding:12px 24px;font-size:15px;line-height:1.6">${t}</p>`;
const cta = (t: string) => `<div style="padding:16px 24px 28px"><a href="https://flarelane.com" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#1d3a8a;color:#fff;text-decoration:none;font-weight:600">${t}</a></div>`;
const grid = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px 24px">${[1, 2, 3, 4].map((n) => `<div><div style="height:120px;border-radius:8px;background:#e5e7eb"></div><b style="display:block;margin-top:8px;font-size:14px">상품 ${n}</b><span style="font-size:13px;color:#6b7280">29,000원</span></div>`).join('')}</div>`;
export const emailPresets: { id: string; name: string; html: string }[] = [
  ['빈 페이지에서 시작하기', shell('<div style="height:320px"></div>')],
  ['이미지 포스터형', shell(hero('#c08457', '#24364f', '가을 시즌 오프') + cta('지금 보러 가기'))],
  ['종합형1', shell(hero('#1d3a8a', '#7c3aed', '이달의 소식') + para('{{ name }}님, 이번 달 새로운 소식을 전해드려요.') + grid + cta('더 보기'))],
  ['종합형2', shell(para('<b style="font-size:20px">새로운 기능 업데이트</b>') + hero('#0ea5e9', '#1d3a8a', 'NEW') + para('더 빨라진 검색과 새 홈 화면을 만나보세요.') + cta('자세히 보기'))],
  ['아이템 리스트형1', shell(para('<b style="font-size:20px">추천 상품</b>') + grid)],
  ['아이템 리스트형2', shell(hero('#16a34a', '#065f46', '베스트 아이템') + grid + cta('전체 보기'))],
  ['뉴스레터형1', shell(para('<b style="font-size:22px">FlareLane Weekly</b>') + para('이번 주 마케팅 자동화 인사이트 3가지를 정리했어요.') + para('1. 리텐션 캠페인 설계<br/>2. 전환 이벤트 측정<br/>3. 세그먼트 활용'))],
  ['뉴스레터형2', shell(hero('#334155', '#0f172a', 'Newsletter') + para('{{ name }}님을 위한 이번 주 소식입니다.') + cta('읽어보기'))],
  ['CTA 강조형', shell(para('<b style="font-size:22px">지금 가입하면 10% 할인</b>') + cta('쿠폰 받기'))],
  ['텍스트형', shell(para('안녕하세요 {{ name }}님,') + para('플레어레인을 이용해 주셔서 감사합니다. 서비스 이용 중 궁금한 점이 있다면 언제든 문의해 주세요.'))],
].map(([name, html], i) => ({ id: `preset-${i}`, name, html }));
export const emailTemplates: EmailTemplate[] = [
  ['10월 뉴스레터', 6, '2026.10.02 10:00:00'],
  ['가을 프로모션 메일', 1, '2026.09.25 15:30:00'],
  ['신규 가입 웰컴', 9, '2026.09.11 09:20:00'],
  ['휴면 안내', 9, '2026.08.30 18:00:00'],
  ['장바구니 리마인드', 4, '2026.08.12 11:11:00'],
].map(([name, p, at], i) => ({ id: String(8800 + i), name: name as string, html: emailPresets[p as number].html, createdAt: at as string, conversion: i === 1 ? { event: 'purchase_completed', hours: 72, basis: 'CLICK' } : undefined, stats: { sent: [5200, 3100, 880, 12000, 640][i], failed: [12, 4, 0, 230, 2][i], opened: [1820, 940, 410, 1300, 210][i], converted: [40, 66, 12, 3, 18][i], amount: [1160000, 1914000, 348000, 87000, 522000][i] } }));
export const emailSenders = [
  { email: 'test@noreply.flarelane.com', name: '플레어레인' },
  { email: 'news@flarelane.com', name: 'FlareLane 뉴스' },
];
