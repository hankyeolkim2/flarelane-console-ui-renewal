// 분석 보드 더미 데이터 — 스테이징 「분석 보드」 목록 · 「테스트 한결1」 보드 값 그대로 (2026-10-08 확인).
// 동작 규칙은 docs/staging-behavior-analytics.md.

export type ReportType = 'INSIGHT' | 'FUNNEL';

export type Report = {
  id: string;
  boardId: string;
  type: ReportType;
  name: string | null;
  createdBy: string; // 이메일 앞부분
  updatedAt: string; // ISO
  events: string[];
  funnel?: { counts: number[] };
};

export type Board = {
  id: string;
  name: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  reportsCount: number;
};

export const ME = 'hk.kim';
export const LIMITS = { firstPage: 10, nextPage: 6, reportsPerBoard: 30, searchMaxLength: 100, searchVisibleRows: 7 };
export const TOTAL_BOARDS = 30; // 스테이징 전체 보드 수 (목록은 이 중 확인된 것만 들고 있음)
export const MINE_BOARDS = 6;

// 스테이징 목록 순서(최근 편집순) 그대로
export const initialBoards: Board[] = [
  { id: 'b-2b7f', name: null, createdBy: 'hk.kim', createdAt: '2026-10-02T05:10:00Z', updatedAt: '2026-10-02T05:10:00Z', reportsCount: 0 },
  { id: 'b-9a41', name: null, createdBy: 'hk.kim', createdAt: '2026-09-29T07:40:00Z', updatedAt: '2026-09-29T07:40:00Z', reportsCount: 0 },
  { id: 'b-71cc', name: null, createdBy: 'hk.kim', createdAt: '2026-09-29T02:12:00Z', updatedAt: '2026-09-29T02:12:00Z', reportsCount: 0 },
  { id: 'd1782b09', name: '테스트 한결1', createdBy: 'hk.kim', createdAt: '2026-08-26T03:00:00Z', updatedAt: '2026-09-28T09:20:00Z', reportsCount: 3 },
  { id: 'b-50e3', name: null, createdBy: 'hk.kim', createdAt: '2026-09-28T06:31:00Z', updatedAt: '2026-09-28T06:31:00Z', reportsCount: 0 },
  { id: 'b-3d08', name: null, createdBy: 'hk.kim', createdAt: '2026-09-28T06:02:00Z', updatedAt: '2026-09-28T06:02:00Z', reportsCount: 0 },
  { id: 'b-8f12', name: '메시지 발송 품질 보드', createdBy: 'jy.choi', createdAt: '2026-09-10T01:00:00Z', updatedAt: '2026-09-16T08:00:00Z', reportsCount: 2 },
  { id: 'b-c4a9', name: '매출', createdBy: 'jm.lee', createdAt: '2026-09-11T01:00:00Z', updatedAt: '2026-09-16T04:00:00Z', reportsCount: 2 },
  { id: 'b-1e6d', name: null, createdBy: 'yh.kim', createdAt: '2026-09-01T06:00:00Z', updatedAt: '2026-09-01T06:00:00Z', reportsCount: 0 },
  { id: 'b-e055', name: '이커머스 핵심 지표 통합 대시보드 2026 하반기', createdBy: 'sb.jeon', createdAt: '2026-08-28T01:00:00Z', updatedAt: '2026-09-01T02:00:00Z', reportsCount: 2 },
];

export const initialReports: Report[] = [
  {
    id: '52329a18',
    boardId: 'd1782b09',
    type: 'INSIGHT',
    name: '새 인사이트새 인사이트새 인사이트새 인사이트새 인사이트새 인사이트새 인사이트',
    createdBy: 'hk.kim',
    updatedAt: '2026-08-31T02:00:00Z',
    events: ['banner_impression-v1'],
  },
  {
    id: '08dbc36b',
    boardId: 'd1782b09',
    type: 'FUNNEL',
    name: '새 퍼널',
    createdBy: 'hk.kim',
    updatedAt: '2026-08-26T05:00:00Z',
    events: ['soob', 'deferred', 'email.delivered'],
    funnel: { counts: [20, 6, 2] },
  },
  {
    id: 'a91e0c44',
    boardId: 'd1782b09',
    type: 'INSIGHT',
    name: '새 인사이트',
    createdBy: 'hk.kim',
    updatedAt: '2026-08-26T03:00:00Z',
    events: ['banner_impression-v1'],
  },
];

// 「n분 전 / n시간 전 / n일 전」, 7일이 넘으면 YY.MM.DD (스테이징 lastEdited 규칙)
export function formatEdited(iso: string, now = new Date('2026-10-08T15:00:00+09:00')) {
  const d = new Date(iso);
  const min = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (min < 60) return `${Math.max(min, 1)}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const day = Math.floor(h / 24);
  if (day <= 7) return `${day}일 전`;
  const yy = String(d.getFullYear()).slice(2);
  return `${yy}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export const boardName = (b: Pick<Board, 'name'>) => b.name || '제목 없음';
export const reportName = (r: Pick<Report, 'name' | 'type'>) => r.name || (r.type === 'INSIGHT' ? '새 인사이트' : '새 퍼널');
