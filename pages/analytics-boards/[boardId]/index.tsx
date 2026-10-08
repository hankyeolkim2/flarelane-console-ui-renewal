import { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Button from '@/components/ui/Button';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Icon from '@/components/Icon';
import InlineName, { type InlineNameHandle } from '@/components/ui/InlineName';
import { Anchor, Menu, MenuItem } from '@/components/ui/Menu';
import { ConfirmModal } from '@/components/ui/Modal';
import AnalyticsSearch from '@/components/analytics/AnalyticsSearch';
import CreateMenu from '@/components/analytics/CreateMenu';
import { FunnelMiniChart, InsightMiniChart, last30 } from '@/components/analytics/MiniCharts';
import { funnelCounts, insightValues } from '@/lib/catalog';
import { boardName, formatEdited, LIMITS, ME, reportName, type Report } from '@/lib/analytics';
import { useStore } from '@/lib/store';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma 「분석 보드 — 보드 — 1440」(1266:2) · 「빈 보드」(1267:5473) + 스테이징 보드 동작.

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  > h1 { margin: 0; min-width: 0; ${text('display-xs', 'semibold')}; color: ${color('text-primary')}; }
  > h1 > span, > h1 > input { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  > i { flex: 1; }
`;

const Meta = styled.div`
  display: flex;
  gap: 16px;
  > span { display: flex; align-items: center; gap: 6px; ${text('text-sm', 'medium')}; color: ${color('text-tertiary')}; }
  > span > i { display: inline-flex; color: ${color('fg-quaternary')}; }
  > span > b { ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 264px;
  padding: 19px;
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  box-shadow: ${shadow.xs};
  cursor: pointer;
  transition: box-shadow 0.1s linear;
  &:hover { box-shadow: ${shadow.sm}; }
`;

const CardHead = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  > span:first-of-type { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 32px; height: 32px; border-radius: ${radius.sm}px; background: ${color('bg-brand-primary')}; color: ${color('fg-brand-primary')}; }
  > em { font-style: normal; flex-shrink: 0; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
`;

const CardText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
  > span, > input { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  > small { ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
`;

const AddCard = styled.div<{ tall: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: ${(p) => (p.tall ? 420 : 264)}px;
  ${(p) => (p.tall ? 'grid-column: 1 / -1;' : '')}
  padding: 0 20px;
  border-radius: ${radius.xl}px;
  background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect x='0.5' y='0.5' width='calc(100%25 - 1px)' height='calc(100%25 - 1px)' fill='none' rx='11.5' ry='11.5' stroke='%23D1D5DB' stroke-width='1' stroke-dasharray='6%2c 4'/%3e%3c/svg%3e");
  > p { margin: 0; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
`;

const NotFound = styled.p`
  margin: 0;
  ${text('text-sm', 'regular')};
  color: ${color('text-tertiary')};
`;

function ReportCard({ report, onDelete }: { report: Report; onDelete: () => void }) {
  const router = useRouter();
  const { renameReport } = useStore();
  const nameRef = useRef<InlineNameHandle>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState(false);
  const insight = report.type === 'INSIGHT';
  return (
    <Card role="link" onClick={() => !nameRef.current?.isEditing && router.push(`/analytics-boards/${report.boardId}/reports/${report.id}`)}>
      <CardHead>
        <span>
          <Icon name={insight ? 'show_chart' : 'funnel'} size={20} />
        </span>
        <CardText>
          <InlineName ref={nameRef} name={report.name} fallback={insight ? '새 인사이트' : '새 퍼널'} onSave={(n) => renameReport(report.id, n)} />
          <small suppressHydrationWarning>{formatEdited(report.updatedAt)}</small>
        </CardText>
        <em>{report.createdBy}</em>
        <Anchor ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <Button hierarchy="tertiary" icon="more_horiz" aria-label="더보기" onClick={() => setMenu((v) => !v)} />
          <Menu open={menu} onClose={() => setMenu(false)} anchorRef={menuRef} width={160} align="end">
            <MenuItem label="이름 수정" onClick={() => { setMenu(false); setTimeout(() => nameRef.current?.startEdit()); }} />
            <MenuItem label="삭제" destructive onClick={() => { setMenu(false); onDelete(); }} />
          </Menu>
        </Anchor>
      </CardHead>
      {insight ? (
        <InsightMiniChart values={insightValues(report.events[0], last30, 'DAY', 'UNIQUE_USER')} label={report.events[0]} />
      ) : (
        <FunnelMiniChart steps={report.events} counts={report.funnel?.counts ?? funnelCounts(report.events)} />
      )}
    </Card>
  );
}

function AddReport({ boardId, count, tall }: { boardId: string; count: number; tall: boolean }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(false);
  const go = (type: 'INSIGHT' | 'FUNNEL') => {
    setOpen(false);
    router.push(`/analytics-reports/new?type=${type}&boardId=${boardId}`);
  };
  return (
    <AddCard tall={tall}>
      <Anchor ref={ref}>
        <Button iconLeading="add" onClick={() => (count >= LIMITS.reportsPerBoard ? setLimit(true) : setOpen((v) => !v))}>
          통계 추가
        </Button>
        <Menu open={open} onClose={() => setOpen(false)} anchorRef={ref} width={280} align="center">
          <MenuItem icon="show_chart" label="인사이트" description="이벤트의 발생 현황과 추이 분석" onClick={() => go('INSIGHT')} />
          <MenuItem icon="funnel" label="퍼널" description="단계별 전환율과 이탈률 분석" onClick={() => go('FUNNEL')} />
        </Menu>
      </Anchor>
      <p>통계를 생성하고 캠페인 성과를 확인해 보세요.</p>
      {limit && (
        <ConfirmModal
          title="이 보드의 통계 개수 제한에 도달했습니다."
          description={`보드당 최대 ${LIMITS.reportsPerBoard}개의 통계를 생성할 수 있습니다. 새 보드를 만들어 통계를 추가해 주세요.`}
          cancelLabel=""
          confirmLabel="확인"
          onClose={() => setLimit(false)}
          onConfirm={() => setLimit(false)}
        />
      )}
    </AddCard>
  );
}

export default function BoardPage() {
  const router = useRouter();
  const id = router.query.boardId as string | undefined;
  const { boards, reports, renameBoard, deleteBoard, deleteReport, toast } = useStore();
  const board = boards.find((b) => b.id === id);
  const list = reports.filter((r) => r.boardId === id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const nameRef = useRef<InlineNameHandle>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState(false);
  const [askBoard, setAskBoard] = useState(false);
  const [askReport, setAskReport] = useState<Report | null>(null);

  if (!id) return null;
  if (!board) return <NotFound>보드를 찾을 수 없어요.</NotFound>;

  const insights = list.filter((r) => r.type === 'INSIGHT').length;
  return (
    <>
      <Breadcrumbs items={[{ label: '분석 보드', href: '/analytics-boards' }, { label: boardName(board) }]} />
      <Head>
        <h1>
          <InlineName ref={nameRef} name={board.name} fallback="제목 없음" onSave={(n) => renameBoard(board.id, n)} />
        </h1>
        <Anchor ref={menuRef}>
          <Button hierarchy="tertiary" icon="more_horiz" aria-label="더보기" onClick={() => setMenu((v) => !v)} />
          <Menu open={menu} onClose={() => setMenu(false)} anchorRef={menuRef} width={160} align="start">
            <MenuItem label="이름 수정" onClick={() => { setMenu(false); setTimeout(() => nameRef.current?.startEdit()); }} />
            <MenuItem label="보드 삭제" destructive onClick={() => { setMenu(false); setAskBoard(true); }} />
          </Menu>
        </Anchor>
        <i />
        <CreateMenu />
      </Head>
      <AnalyticsSearch />
      <Meta>
        <span>
          <i><Icon name="show_chart" size={16} /></i>
          인사이트 <b>{insights}</b>
        </span>
        <span>
          <i><Icon name="funnel" size={16} /></i>
          퍼널 <b>{list.length - insights}</b>
        </span>
      </Meta>
      <Grid>
        {list.map((r) => (
          <ReportCard key={r.id} report={r} onDelete={() => setAskReport(r)} />
        ))}
        <AddReport boardId={board.id} count={list.length} tall={list.length === 0} />
      </Grid>
      {askBoard && (
        <ConfirmModal
          title="보드를 삭제하시겠습니까?"
          description="보드 삭제시 보드에 포함된 모든 통계가 삭제되며, 복구 불가합니다."
          cancelLabel="취소"
          confirmLabel="삭제"
          destructive
          onClose={() => setAskBoard(false)}
          onConfirm={() => {
            const name = boardName(board);
            deleteBoard(board.id);
            toast(`${name} 보드가 삭제되었습니다.`);
            router.push('/analytics-boards');
          }}
        />
      )}
      {askReport && (
        <ConfirmModal
          title={askReport.createdBy === ME ? '통계를 삭제하시겠습니까?' : '내가 생성한 통계가 아닙니다. 삭제하시겠습니까?'}
          description="삭제된 통계는 복구 불가합니다."
          cancelLabel="취소"
          confirmLabel="삭제"
          destructive
          onClose={() => setAskReport(null)}
          onConfirm={() => {
            deleteReport(askReport.id);
            toast(`${reportName(askReport)} 통계가 삭제되었습니다.`);
            setAskReport(null);
          }}
        />
      )}
    </>
  );
}
