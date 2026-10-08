// 대상(유저 · 기기 · 세그먼트) 더미 — docs/staging-behavior-users-devices.md 의 응답 필드 중 화면이 읽는 것만.
// 앞쪽 값은 Figma 시안(스테이징 실데이터) 그대로, 나머지는 페이지를 채우려고 지어낸 것. 실제 이름 · 연락처는 넣지 않음.
export type User = {
  userId: string;
  name?: string;
  phoneNumber?: string;
  email?: string;
  country?: string;
  language?: string;
  dob?: string;
  timeZone?: string;
  smsUnsubscribedAt?: string;
  createdAt: string;
  updatedAt: string;
  lastDeviceActivatedAt?: string; // ISO
  tags: Record<string, string>;
};

const USER_IDS = ['fl1508-solo-1788143420', 'fl1508-multi-1788143420', 'chg-B-1787919325', 'chg-A-1787919325', 'con-base-1787919282', 'con-b-1787919252', 'con-a-1787919252', 'fl1508-J2-1787918936', 'fl1508-E-1787918731', 'fl1508-C2-1787918682', 'soobT'];

export const users: User[] = Array.from({ length: 64 }, (_, i): User => {
  const d = new Date(2026, 8, 10 - Math.floor(i / 3), 18, 20 - (i % 20), 10);
  const iso = d.toISOString();
  const f = (x: Date) => `${x.getFullYear()}.${String(x.getMonth() + 1).padStart(2, '0')}.${String(x.getDate()).padStart(2, '0')} ${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}:${String(x.getSeconds()).padStart(2, '0')}`;
  return {
    userId: USER_IDS[i] ?? `user_${String(1000 + i * 7)}`,
    name: i === 10 ? '테스트 유저' : i % 4 === 3 ? `고객${i}` : undefined,
    phoneNumber: i % 5 === 4 ? '010-0000-0000' : undefined,
    email: i === 10 ? 'user@example.com' : i % 6 === 5 ? `user${i}@example.com` : undefined,
    country: i % 3 === 0 ? 'KR' : undefined,
    language: i % 3 === 0 ? 'ko' : undefined,
    timeZone: i % 2 === 0 ? 'Asia/Seoul' : undefined,
    createdAt: f(d),
    updatedAt: f(new Date(d.getTime() + 86400000 * 0.7)),
    lastDeviceActivatedAt: i % 7 === 6 ? undefined : iso,
    tags: i % 3 === 0 ? { grade: 'GOLD', landing: 'sale' } : i % 3 === 1 ? { grade: 'SILVER' } : {},
  };
});

export type Platform = 'ios' | 'android' | 'webDesktop' | 'webMobile';
export type Device = {
  id: string;
  platform: Platform;
  deviceModel: string;
  osVersion: string;
  browser?: string;
  createdAt: string;
  lastActiveAt: string;
  userId?: string;
  isTest: boolean;
  testName?: string | null;
  isSubscribed: boolean;
  tags: Record<string, string>;
  appVersion?: string;
  sdkVersion?: string;
  countryCode?: string;
  languageCode?: string;
  timeZone?: string;
};

const SEED: [Platform, string, string, string | undefined, string, string, string | undefined, boolean, boolean][] = [
  ['webMobile', 'iOS', '18.7', 'Safari', '2026.09.10 18:30:28', '2026.09.10 18:30:28', 'user_1024', false, false],
  ['webDesktop', 'macOS', '10.15.7', 'Chrome', '2026.09.10 18:20:10', '2026.09.11 11:07:28', 'user_1024', true, true],
  ['android', 'Android', '14', undefined, '2026.08.31 12:10:43', '2026.08.31 12:15:39', undefined, true, false],
  ['android', 'Android', '14', undefined, '2026.08.31 12:03:07', '2026.08.31 12:04:41', undefined, true, false],
  ['android', 'Android', '13', undefined, '2026.08.31 11:56:35', '2026.08.31 11:57:30', undefined, true, false],
  ['ios', 'iOS', '17.6', undefined, '2026.08.31 11:30:29', '2026.08.31 11:31:06', undefined, true, false],
  ['ios', 'iOS', '17.6', undefined, '2026.08.31 11:30:22', '2026.08.31 11:30:26', 'user_2048', true, false],
  ['webDesktop', 'Windows', '11', 'Edge', '2026.08.28 21:15:25', '2026.08.28 21:15:32', 'user_4096', true, false],
];
const PLATS: Platform[] = ['android', 'ios', 'webDesktop', 'webMobile'];

export const devices: Device[] = Array.from({ length: 58 }, (_, i): Device => {
  const s = SEED[i];
  const platform = s ? s[0] : PLATS[i % 4];
  const web = platform === 'webDesktop' || platform === 'webMobile';
  const day = String(Math.max(1, 27 - Math.floor(i / 2))).padStart(2, '0');
  return {
    id: `${(0x3f2a91 + i * 7919).toString(16)}-${(0xb21 + i * 31).toString(16)}-4d1e-9c0a-${(0x5e7c0f12 + i * 104729).toString(16)}`,
    platform,
    deviceModel: s ? s[1] : platform === 'android' ? 'Android' : platform === 'ios' ? 'iOS' : platform === 'webDesktop' ? 'Windows' : 'Android',
    osVersion: s ? s[2] : platform === 'ios' ? '17.6' : '14',
    browser: s ? s[3] : web ? (i % 2 ? 'Chrome' : 'Safari') : undefined,
    createdAt: s ? s[4] : `2026.08.${day} 1${i % 10}:${String((i * 7) % 60).padStart(2, '0')}:12`,
    lastActiveAt: s ? s[5] : `2026.08.${day} 1${i % 10}:${String((i * 7 + 3) % 60).padStart(2, '0')}:40`,
    userId: s ? s[6] : i % 3 === 0 ? `user_${String(1000 + i * 7)}` : undefined,
    isTest: s ? s[7] : i % 9 === 4,
    testName: i === 1 ? '디자인팀 맥북' : i === 2 ? 'QA 갤럭시' : null,
    isSubscribed: s ? s[8] : i % 4 !== 2,
    tags: i % 2 === 0 ? { '@device_device_note': `D${i}`, grade: 'GOLD', landing: 'sale' } : {},
    appVersion: web ? undefined : '3.2.1',
    sdkVersion: web ? '1.8.0' : '2.4.3',
    countryCode: 'KR',
    languageCode: 'ko-KR',
    timeZone: 'Asia/Seoul',
  };
});

export const PLATFORM_ICON: Record<Platform, string> = { ios: 'apple', android: 'android', webDesktop: 'desktop_windows', webMobile: 'smartphone' };

// ── 세그먼트. filters = [[조건 …], …] 바깥 = 또는, 안쪽 = 그리고. 조건 = { type, values }
export type Condition = { type: string; values: string[] };
export type Segment = { id: string; name: string; type?: 'DEFAULT'; targetType: 'User' | 'Device'; filters: Condition[][]; createdAt: string; updatedAt: string; lastSyncedMin?: number | null; count?: number };

const seg = (id: string, name: string, targetType: Segment['targetType'], filters: Condition[][], extra: Partial<Segment> = {}): Segment => ({ id, name, targetType, filters, createdAt: '2026.09.01 10:00:00', updatedAt: '2026.09.20 14:30:00', ...extra });

export const segments: Segment[] = [
  seg('seg-u-all', '전체 유저', 'User', [], { type: 'DEFAULT', count: 1234 }),
  seg('seg-u-age2', '나이 복합 조건 test2', 'User', [[{ type: 'AGE', values: ['GT', '36'] }, { type: 'AGE', values: ['LTE', '38'] }, { type: 'AGE', values: ['EQ', '37'] }], [{ type: 'AGE', values: ['GTE', '40'] }]], { count: 15 }),
  seg('seg-u-age3', '나이 복합 조건 test3', 'User', [[{ type: 'USER_ID', values: ['EXIST'] }, { type: 'AGE', values: ['EQ', '38'] }], [{ type: 'USER_ID', values: ['EXIST'] }, { type: 'AGE', values: ['GT', '39'] }]], { count: 16 }),
  seg('seg-u-age-ne', '나이 !=', 'User', [[{ type: 'AGE', values: ['NOT_EQ', '38'] }]], { count: 1234 }),
  seg('seg-u-cache', '세그먼트 캐쉬 여부 v2', 'User', [[{ type: 'EVENT', values: ['v1', 'IN_THE_LAST_N_HOURS', '2160', '', 'GT', '2', []] as unknown as string[] }, { type: 'TAG', values: ['과일', 'INCLUDES', '사과, 수박, 참외'] }]], { lastSyncedMin: 13 }),
  seg('seg-u-vip', 'VIP 유저', 'User', [[{ type: 'USER_ID', values: ['EQ', 'user_0001'] }]], { count: 1 }),
  seg('seg-u-111', 'test222', 'User', [[{ type: 'USER_ID', values: ['EQ', '111'] }]], { count: 0 }),
  seg('seg-d-all', '전체 기기', 'Device', [], { type: 'DEFAULT' }),
  seg('seg-d-sub', '구독 기기', 'Device', [], { type: 'DEFAULT' }),
  seg('seg-d-ios', 'iOS 앱 기기', 'Device', [[{ type: 'PLATFORM', values: ['EQ', 'ios'] }]]),
  seg('seg-d-test', '테스트 기기만', 'Device', [[{ type: 'TEST_DEVICE', values: ['true'] }]]),
  seg('seg-d-recent', '최근 7일 접속', 'Device', [[{ type: 'LAST_ACTIVE_AT_WITHIN_HOURS', values: ['TIME_EQ', '168'] }, { type: 'PLATFORM', values: ['EQ', 'app'] }]]),
];

export const TYPE_LABEL: Record<string, string> = {
  PLATFORM: '플랫폼',
  TEST_DEVICE: '테스트 기기',
  USER_ID: '유저 ID',
  TAG: '태그',
  EVENT: '이벤트',
  BROWSER: '웹 브라우저',
  APP_VERSION: 'APP 버전',
  OS_VERSION: 'OS 버전',
  SDK_VERSION: 'SDK 버전',
  SUBSCRIBED: '알림 구독 기기',
  CREATED_AT_WITHIN_HOURS: '최초 생성 시간',
  LAST_ACTIVE_AT_WITHIN_HOURS: '마지막 접속 시간',
  LAST_DEVICE_ACTIVATED_AT_WITHIN_HOURS: '마지막 접속 시간',
  COUNTRY: '국가',
  LANGUAGE: '언어',
  BIRTHDAY: '생일',
  SMS_UNSUBSCRIBED: '문자 수신 거부 유저',
  PHONE_NUMBER: '전화번호',
  AGE: '나이',
};

export const OP_LABEL: Record<string, string> = {
  EQ: '=',
  NOT_EQ: '≠',
  GT: '>',
  GTE: '≥',
  LT: '<',
  LTE: '≤',
  EXIST: '가 존재하면',
  NOT_EXIST: '가 존재하지 않으면',
  AFTER: '(기간) ~이후',
  BEFORE: '(기간) ~이전',
  AFTER_HOURS: '(기간) ~시간 이상 경과',
  REMAIN_HOURS: '(기간) ~시간 남음',
  IN_THE_LAST_N_HOURS: '(기간) 최근 ~시간 이내',
  INCLUDES: '이 중에 하나',
  CONTAINS_ANY_OF: '다음 중 하나를 포함',
  CONTAINS_NONE_OF: '다음 중 하나를 미포함',
  CSV: '가 CSV 파일에 포함',
  TIME_EQ: '최근 ~시간 이내',
  TIME_NOT_EQ: '~시간 이상 경과',
  BIRTHDAY_EQ: '이 오늘이면',
  true: '입니다',
  false: '아닙니다',
  app: '앱 (전체)',
  android: '앱(안드로이드)',
  ios: '앱(iOS)',
  web: '웹 (전체)',
  webDesktop: '웹(데스크탑)',
  webMobile: '웹(모바일)',
};

// 조건 한 줄 → [유형 라벨, 값 글] (docs 5.5)
export function describe(c: Condition): [string, string] {
  const label = c.type === 'TAG' ? c.values[0] : TYPE_LABEL[c.type] ?? c.type;
  if (c.type === 'EVENT') {
    const [name, , hours, , op, count] = c.values;
    const h = Number(hours);
    return ['이벤트', `최근 ${h % 24 === 0 ? `${h / 24}일` : `${h}시간`} 이내, 다음 ${name} ${OP_LABEL[op] ?? op} ${count}회 발생`];
  }
  const vals = c.type === 'TAG' ? c.values.slice(1) : c.values;
  const timeType = c.type === 'CREATED_AT_WITHIN_HOURS' || c.type === 'LAST_ACTIVE_AT_WITHIN_HOURS' || c.type === 'LAST_DEVICE_ACTIVATED_AT_WITHIN_HOURS';
  const parts = vals.map((v, i) => {
    if (i === 0 && timeType) return OP_LABEL[`TIME_${v}`] ?? OP_LABEL[v] ?? v;
    if (i === 0 && c.type === 'BIRTHDAY') return OP_LABEL.BIRTHDAY_EQ;
    if (timeType && i === 1) return `[ ${v} 시간 ]`;
    return OP_LABEL[v] ?? v;
  });
  return [label, parts.join(' ')];
}

export const hasEventOrCsv = (filters: Condition[][]) => {
  const t: string[] = [];
  if (filters.flat().some((c) => c.type === 'EVENT')) t.push('EVENT');
  if (filters.flat().some((c) => c.values.includes('CSV'))) t.push('CSV');
  return t;
};

// 세그먼트 모듈 상태 — 추가 · 수정 · 삭제가 화면 이동 뒤에도 남도록
const listeners = new Set<() => void>();
export const subscribeAudience = (f: () => void) => {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
};
export const emitAudience = () => listeners.forEach((f) => f());
