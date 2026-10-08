// date-fns formatDistance(ko, addSuffix) 근사 — 「약 3시간 전」 「5분 전」 「25일 전」 「약 1개월 전」. 프로토타입 기준 시각 2026.10.08 23:00.
export const NOW = new Date('2026-10-08T23:00:00');

export function ago(input: string | Date) {
  const d = typeof input === 'string' ? new Date(input.includes('T') ? input : input.replace(/\./g, '-').replace(' ', 'T')) : input;
  const min = Math.round((NOW.getTime() - d.getTime()) / 60000);
  if (min < 1) return '1분 미만 전';
  if (min < 45) return `${min}분 전`;
  if (min < 90) return '약 1시간 전';
  if (min < 1440) return `약 ${Math.round(min / 60)}시간 전`;
  if (min < 2520) return '1일 전';
  if (min < 43200) return `${Math.round(min / 1440)}일 전`;
  if (min < 86400) return `약 ${Math.round(min / 43200)}개월 전`;
  if (min < 525600) return `${Math.round(min / 43200)}개월 전`;
  return `약 ${Math.round(min / 525600)}년 전`;
}
