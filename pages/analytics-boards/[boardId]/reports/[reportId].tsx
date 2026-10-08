import { useRouter } from 'next/router';
import ReportEditor from '@/components/analytics/editor/ReportEditor';
import { useStore } from '@/lib/store';

// 통계 편집 — mode "edit"
export default function ReportPage() {
  const router = useRouter();
  const { reports } = useStore();
  const boardId = router.query.boardId as string | undefined;
  const reportId = router.query.reportId as string | undefined;
  if (!router.isReady || !boardId || !reportId) return null;
  const report = reports.find((r) => r.id === reportId && r.boardId === boardId);
  if (!report) return <p style={{ margin: 24 }}>통계를 찾을 수 없어요.</p>;
  return <ReportEditor key={reportId} mode="edit" boardId={boardId} report={report} initialType={report.type} />;
}

ReportPage.layout = 'editor' as const;
