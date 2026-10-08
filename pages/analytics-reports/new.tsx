import { useRouter } from 'next/router';
import ReportEditor from '@/components/analytics/editor/ReportEditor';

// 새 통계 — `/analytics-reports/new?type=INSIGHT|FUNNEL&boardId=…` (type 이 아니면 INSIGHT, boardId 없으면 저장 때 보드 선택)
export default function NewReportPage() {
  const router = useRouter();
  if (!router.isReady) return null;
  const type = router.query.type === 'FUNNEL' ? 'FUNNEL' : 'INSIGHT';
  const boardId = typeof router.query.boardId === 'string' ? router.query.boardId : null;
  return <ReportEditor key={`${type}-${boardId}`} mode="create" boardId={boardId} initialType={type} />;
}

NewReportPage.layout = 'editor' as const;
