// 푸시 템플릿 더미 — docs/staging-behavior-new-message-templates.md 8.1 · 8.2.
import type { Platform } from './sent';

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
