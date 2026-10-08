// 웹훅 더미 — 스테이징 「채널 › 웹훅」 목록 · 「PR4 A-5 webhook」 상세 값 그대로 (2026-10-08 Figma 시안 기준).
export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export const METHODS: Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export type SendLog = { id: string; ok: boolean; test: boolean; at: string; requestId: string; response: string };
export type Webhook = {
  id: string;
  name: string;
  method: Method;
  url: string;
  headers: { key: string; value: string }[];
  body: string;
  success30: number;
  fail30: number;
  logs: SendLog[];
};

const pr4Logs: SendLog[] = [
  ['2026.09.17 16:55:21', false],
  ['2026.09.17 16:53:37', true],
  ['2026.09.17 16:35:40', true],
  ['2026.09.17 16:34:05', true],
  ['2026.09.17 16:30:36', true],
  ['2026.09.17 16:28:03', false],
  ['2026.09.17 16:24:36', false],
  ['2026.09.17 16:17:14', true],
  ['2026.09.15 21:37:13', true],
  ['2026.09.15 21:36:27', true],
].map(([at, ok], i) => ({ id: `l${i}`, ok: ok as boolean, test: i >= 8, at: at as string, requestId: ['6ef3634e-11b8-428e-887a-55bc770b34a5', '0b9a1c2e-5d7f-4e21-9a3b-7c1d2e4f6a80', 'c4e2f1a0-8b3d-4c5e-9f7a-1b2c3d4e5f60'][i % 3], response: '{}' }));

export const initialWebhooks: Webhook[] = [
  { id: 'wh-fl1666', name: 'FL-1666 staging 웹훅 회귀', method: 'POST', url: 'https://webhook.site/b02bea2d-af18-49ab-9ed6-f080702a7b4a?u={{ userId }}', headers: [], body: '', success30: 2, fail30: 2, logs: [] },
  { id: 'wh-pr8s6', name: 'PR8-S6-webhook', method: 'POST', url: 'https://webhook.site/51f32b30-6659-4303-8961-578640dc5244', headers: [], body: '', success30: 1, fail30: 0, logs: [] },
  {
    id: 'wh-pr4a5',
    name: 'PR4 A-5 webhook',
    method: 'POST',
    url: 'https://webhook.site/6e15f008-0f36-4046-9931-1b0fa289b742?grade={{ tags.grade }}',
    headers: [{ key: 'X-FL-User-{{ userId }}', value: '{{ name }}-{{ tags.grade }}' }],
    body: '{"user":"{{ name }}","grade":"{{ tags.grade }}","uid":"{{ userId }}","case":"PR4 A-5"}',
    success30: 10,
    fail30: 3,
    logs: pr4Logs,
  },
  { id: 'wh-test', name: 'test', method: 'GET', url: 'https://localhost', headers: [], body: '', success30: 0, fail30: 0, logs: [] },
  { id: 'wh-testes', name: 'test-es', method: 'GET', url: 'https://webhook.site/50bd8fc6-7685-4397-979a-2f23eff855ad', headers: [], body: '', success30: 0, fail30: 0, logs: [] },
  { id: 'wh-test1', name: 'test webhook 1', method: 'GET', url: 'https://webhook.site/7cc64f18-f470-4bcd-8906-35886923b68c', headers: [], body: '', success30: 0, fail30: 0, logs: [] },
  { id: 'wh-push', name: '푸시발송', method: 'POST', url: 'https://staging-api.flarelane.com/v1/projects/…/notifications', headers: [], body: '', success30: 0, fail30: 0, logs: [] },
  { id: 'wh-success', name: 'Success', method: 'GET', url: 'https://17db-175-113-78-31.ngrok-free.app/success', headers: [], body: '', success30: 0, fail30: 0, logs: [] },
];

// 상태 점: 실패 있음 = 빨강 · 성공만 = 초록 · 호출 없음 = 회색 (Figma 시안 규칙)
export const webhookTone = (w: Pick<Webhook, 'success30' | 'fail30'>) =>
  w.success30 + w.fail30 === 0 ? 'gray' : w.fail30 > 0 && w.fail30 / (w.success30 + w.fail30) >= 0.5 ? 'error' : 'success';
export const failRate = (w: Pick<Webhook, 'success30' | 'fail30'>) => {
  const t = w.success30 + w.fail30;
  return `${w.fail30} (${(t ? (w.fail30 / t) * 100 : 0).toFixed(1)}%)`;
};
