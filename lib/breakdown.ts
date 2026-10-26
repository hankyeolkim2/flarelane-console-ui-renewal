import type { SplitBlock } from './editor';

// 데이터 그룹(세분화) 결과 더미 — Figma 「split by 추가」 인사이트 · 퍼널 세분화 시안 기준.
// 세그먼트 = 전체 · 포함 · 미포함, 속성 = 값마다 한 줄. 조합은 데이터 그룹 순서대로 곱함.

type Value = { label: string; share: number }; // share = 전체 대비 비율(더미)

const DEVICE_VALUES: Record<string, Value[]> = {
  플랫폼: [
    { label: 'App(iOS)', share: 0.38 },
    { label: 'App(Android)', share: 0.34 },
    { label: 'Web(Windows)', share: 0.17 },
    { label: 'Web(Mac)', share: 0.11 },
  ],
  '웹 브라우저': [
    { label: 'Chrome', share: 0.62 },
    { label: 'Safari', share: 0.27 },
    { label: 'Edge', share: 0.11 },
  ],
  '테스트 기기': [
    { label: '테스트 기기', share: 0.04 },
    { label: '일반 기기', share: 0.96 },
  ],
  '구독 여부': [
    { label: '구독', share: 0.71 },
    { label: '미구독', share: 0.29 },
  ],
};

const USER_VALUES: Record<string, Value[]> = {
  '국가 코드': [
    { label: 'KR', share: 0.72 },
    { label: 'US', share: 0.17 },
    { label: 'JP', share: 0.11 },
  ],
  '언어 코드': [
    { label: 'ko', share: 0.75 },
    { label: 'en', share: 0.18 },
    { label: 'ja', share: 0.07 },
  ],
};

const FALLBACK: Value[] = [
  { label: '값 A', share: 0.6 },
  { label: '값 B', share: 0.4 },
];

export function splitValues(b: SplitBlock): Value[] {
  if (b.kind === '세그먼트')
    return [
      { label: '전체 유저', share: 1 },
      { label: `'${b.label}'에 포함 유저`, share: 0.27 },
      { label: `'${b.label}'에 미포함 유저`, share: 0.73 },
    ];
  const table = b.kind === '기기' ? DEVICE_VALUES : USER_VALUES;
  return table[b.label] ?? FALLBACK;
}

// 표 머리글 — 「세그먼트 · VIP 고객」, 「기기 · 플랫폼」
export const splitHeader = (b: SplitBlock) => `${b.kind} · ${b.label}`;

export type Combo = { key: string; labels: string[]; share: number };

export function combos(splits: SplitBlock[]): Combo[] {
  let out: Combo[] = [{ key: '', labels: [], share: 1 }];
  for (const b of splits) {
    const vals = splitValues(b);
    out = out.flatMap((c) => vals.map((v) => ({ key: `${c.key}|${v.label}`, labels: [...c.labels, v.label], share: c.share * v.share })));
  }
  return out;
}

// 조합마다 조금씩 다르게(새로고침해도 같은 값)
export function jitter(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return 0.85 + ((h >>> 0) % 1000) / 1000 * 0.3;
}

// 세분화 계열 색 — 신규 DS Utility 토큰(Figma 변수 Light 값 = styles/tokens.ts). 이웃한 계열끼리 색상 · 명도가 갈리게 순서를 섞음.
// 노랑은 500 이 흰 바탕에서 흐려 700, 빨강은 오류 색과 겹쳐 제외. 10개 = 그래프에 그리는 계열 상한.
export const BREAKDOWN_COLORS = [
  'var(--utility-brand-500)',
  'var(--utility-sky-500)',
  'var(--utility-orange-500)',
  'var(--utility-green-500)',
  'var(--utility-purple-500)',
  'var(--utility-pink-500)',
  'var(--utility-yellow-700)',
  'var(--utility-indigo-500)',
  'var(--utility-slate-500)',
  'var(--utility-brand-300)',
];
