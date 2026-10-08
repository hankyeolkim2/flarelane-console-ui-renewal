// [임시] 테스트 기기 — 스테이징 `GET /devices?isTest=true` 응답에서 화면이 읽는 칸만. 값은 지어낸 것.
export type TestDevice = { id: string; alias: string; platform: 'android' | 'ios' | 'web'; createdAt: string; lastActiveAt: string; userId: string; subscribed: boolean };

const ALIASES = ['QA 갤럭시 S24', '디자인팀 픽셀 8', '개발 에뮬레이터', 'QA 갤럭시 탭', '현영 폴드5', 'CS 갤럭시 A54', '사내 테스트폰 1', '사내 테스트폰 2'];

export const testDevices: TestDevice[] = Array.from({ length: 40 }, (_, i) => {
  const platform = (['android', 'android', 'ios', 'android', 'web'] as const)[i % 5];
  const d = 28 - (i % 27);
  return {
    id: `dev-${(1000 + i * 37).toString(16)}-${i}`,
    alias: i < ALIASES.length ? ALIASES[i] : `테스트 기기 ${i + 1}`,
    platform,
    createdAt: `2026.${String(3 + (i % 6)).padStart(2, '0')}.${String(d).padStart(2, '0')} 10:${String((i * 7) % 60).padStart(2, '0')}`,
    lastActiveAt: `2026.10.${String(Math.max(1, 8 - (i % 8))).padStart(2, '0')} 1${i % 10}:${String((i * 13) % 60).padStart(2, '0')}`,
    userId: i % 3 === 2 ? '-' : `user_${String(2040 + i)}`,
    subscribed: i % 6 !== 4,
  };
});

export const PLATFORM_LABEL = { android: 'Android', ios: 'iOS', web: 'Web' } as const;
