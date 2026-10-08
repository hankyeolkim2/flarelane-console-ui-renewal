import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { Anchor, Menu, MenuItem } from '@/components/ui/Menu';
import { ConfirmModal } from '@/components/ui/Modal';
import { CsvButton, dayLabel, FunnelResult, FunnelTable, InsightChart, InsightTable } from '@/components/analytics/ReportResult';
import { boardName, ME, type Board, type Report, type ReportType } from '@/lib/analytics';
import { funnelCounts, insightValues } from '@/lib/catalog';
import { addDays, defaultState, NAME_MAX, parseYmd, queryKey, serialize, uid, withRange, type EditorState } from '@/lib/editor';
import { useStore } from '@/lib/store';
import { pushWithTransition, reportVT } from '@/lib/viewTransition';
import BoardSelectModal from './BoardSelectModal';
import QueryPanel from './QueryPanel';
import Toolbar from './Toolbar';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 통계 편집 — Figma 「인사이트 편집 (모두 펼침)」(1300:96) · 「퍼널 편집」(1301:2) 모양 + docs/staging-behavior-analytics-editor.md 동작.

const ReportCard = styled.section`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px 8px;
  min-height: 60px;
  > i { flex: 1; }
  > em { font-style: normal; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; white-space: nowrap; }
`;

const NameInput = styled.input`
  width: 440px;
  padding: 0 0 2px;
  border: 0;
  border-bottom: 1px solid ${color('border-brand')};
  outline: none;
  background: transparent;
  ${text('text-sm', 'semibold')};
  color: ${color('text-primary')};
`;

const Result = styled.div<{ center: boolean }>`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  ${(p) => (p.center ? 'align-items: center; justify-content: center;' : '')}
`;

const State = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
  > p { margin: 0; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
  > p a { color: ${color('text-brand-secondary')}; font-weight: 600; }
`;

const Spinner = styled.span`
  display: inline-flex;
  color: ${color('fg-brand-primary')};
  animation: spin 0.8s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const Banner = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 24px 8px;
  padding: 10px 12px;
  border: 1px solid ${color('border-warning')};
  border-radius: ${radius.md}px;
  background: ${color('bg-warning-primary')};
  ${text('text-sm', 'medium')};
  color: ${color('text-warning-primary')};
  > p { flex: 1; margin: 0; }
`;

const LEAVE = '저장되지 않은 변경사항이 있습니다. 페이지를 나가시겠습니까?';
const CRM_START = '2026-05-01';
const isCrm = (e: string) => e.includes('.'); // channel.action 형식 = CRM 이벤트

// 저장된 통계 → 편집 설정
export function stateFromReport(r: Report): EditorState {
  if (r.config) return r.config;
  const s = defaultState(r.type);
  return {
    ...s,
    measurement: r.type === 'FUNNEL' ? 'TOTAL_COUNT' : 'UNIQUE_USER', // 스테이징 「새 퍼널」 저장값
    metrics: r.events.map((e) => ({ id: uid('m'), event: e, filters: [] })),
  };
}

function buckets(s: EditorState) {
  const from = parseYmd(s.range.from);
  const to = parseYmd(s.range.to);
  const days = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
  if (s.granularity === 'HOUR') return Array.from({ length: days * 24 }, (_, i) => new Date(from.getTime() + i * 3600000));
  if (s.granularity === 'MONTH') {
    const out: Date[] = [];
    for (let d = new Date(from.getFullYear(), from.getMonth(), 1); d <= to; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) out.push(d);
    return out;
  }
  return Array.from({ length: days }, (_, i) => addDays(from, i));
}

type Props = { mode: 'edit' | 'create'; boardId: string | null; report?: Report; initialType: ReportType };

export default function ReportEditor({ mode, boardId, report, initialType }: Props) {
  const router = useRouter();
  const { boards, renameReport, deleteReport, saveReport, toast } = useStore();
  const board = boards.find((b) => b.id === boardId);

  const initial = useMemo(() => (report ? stateFromReport(report) : defaultState(initialType)), [report, initialType]);
  const [state, setState] = useState<EditorState>(initial);
  const [baseline, setBaseline] = useState(() => serialize(initial));
  const [name, setName] = useState<string | null>(report?.name ?? null);
  const [renamedInCreate, setRenamedInCreate] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [askDelete, setAskDelete] = useState(false);
  const [boardModal, setBoardModal] = useState(false);
  const [crmClosed, setCrmClosed] = useState(false);
  const bypass = useRef(false);

  const dirty = serialize(state) !== baseline;
  const defaultName = state.type === 'INSIGHT' ? '새 인사이트' : '새 퍼널';
  const shownName = mode === 'create' ? name ?? defaultName : name || '제목 없음';

  // ── 쿼리: 설정이 바뀌면 바로 다시 (디바운스 없음) ──
  const key = queryKey(state);
  const ready = state.type === 'INSIGHT' ? state.metrics.length >= 1 : state.metrics.length >= 2;
  const [status, setStatus] = useState<'EMPTY' | 'LOADING' | 'SUCCEEDED'>(ready ? 'LOADING' : 'EMPTY');
  useEffect(() => {
    if (!ready) return setStatus('EMPTY');
    setStatus('LOADING');
    const t = setTimeout(() => setStatus('SUCCEEDED'), 700);
    return () => clearTimeout(t);
  }, [key, ready]);

  // 저장 버튼: SAVING · SAVED(저장 됨) · READY(결과 성공 + 변경 있음) · DISABLED
  const saveState = saving ? 'SAVING' : saved && !dirty ? 'SAVED' : status === 'SUCCEEDED' && dirty ? 'READY' : 'DISABLED';
  useEffect(() => {
    if (dirty) setSaved(false);
  }, [dirty]);

  // ── 나가기 경고 ──
  const guard = dirty || (mode === 'create' && renamedInCreate);
  useEffect(() => {
    if (!guard) return;
    const before = (e: BeforeUnloadEvent) => {
      if (bypass.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    const route = (url: string) => {
      if (bypass.current || url === router.asPath) return;
      if (!window.confirm(LEAVE)) {
        router.events.emit('routeChangeError');
        throw 'route change aborted (unsaved changes)';
      }
    };
    window.addEventListener('beforeunload', before);
    router.events.on('routeChangeStart', route);
    return () => {
      window.removeEventListener('beforeunload', before);
      router.events.off('routeChangeStart', route);
    };
  }, [guard, router]);

  const update = useCallback((s: EditorState) => setState(s), []);

  const commitName = () => {
    const v = draftName.trim();
    setEditingName(false);
    if (!v || v === (name ?? '')) return;
    setName(v);
    if (mode === 'edit' && report) renameReport(report.id, v);
    else setRenamedInCreate(true);
  };

  const finishSave = (target: Board) => {
    const id = mode === 'edit' && report ? report.id : uid('r');
    const r: Report = {
      id,
      boardId: target.id,
      type: state.type,
      name: mode === 'create' ? (renamedInCreate ? name : null) : name,
      createdBy: report?.createdBy ?? ME,
      updatedAt: new Date().toISOString(),
      events: state.metrics.map((m) => m.event),
      funnel: state.type === 'FUNNEL' ? { counts: funnelCounts(state.metrics.map((m) => m.event)) } : undefined,
      config: state,
    };
    setSaving(true);
    setTimeout(() => {
      saveReport(r);
      setSaving(false);
      toast('저장 완료!');
      if (mode === 'edit') {
        setBaseline(serialize(state));
        setSaved(true);
      } else {
        bypass.current = true;
        router.replace(`/analytics-boards/${target.id}/reports/${id}`);
      }
    }, 500);
  };

  const onSave = () => {
    if (mode === 'edit' && board) return finishSave(board);
    if (mode === 'create' && board) return finishSave(board);
    setBoardModal(true);
  };

  // ── 결과 데이터 ──
  const dates = useMemo(() => buckets(state), [state]);
  const unit = state.measurement === 'UNIQUE_USER' ? '명' : '회';
  const series = state.metrics.map((m) => ({ name: m.event, values: insightValues(m.event, dates, state.granularity, state.measurement) }));
  const counts = funnelCounts(state.metrics.map((m) => m.event));
  const crm = state.type === 'INSIGHT' && !crmClosed && state.range.from < CRM_START && state.metrics.some((m) => isCrm(m.event));
  const crumbs = boardId
    ? [
        { label: '분석 보드', href: '/analytics-boards' },
        { label: board ? boardName(board) : '제목 없음', href: `/analytics-boards/${boardId}`, transition: true }, // [실험] 결과 카드가 보드 카드 자리로 줄어듦
        { label: shownName },
      ]
    : [{ label: shownName }];

  return (
    <>
      <ReportCard style={report ? ({ viewTransitionName: reportVT(report.id), viewTransitionClass: 'report-card' } as React.CSSProperties) : undefined}>
        <Header>
          {editingName ? (
            <NameInput
              autoFocus
              maxLength={NAME_MAX}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName();
                if (e.key === 'Escape') setEditingName(false);
              }}
              onBlur={commitName}
            />
          ) : (
            <Breadcrumbs items={crumbs} />
          )}
          <Anchor ref={menuRef}>
            <IconButton icon="more_horiz" size="sm" label="더보기" onClick={() => setMenu((v) => !v)} />
            <Menu open={menu} onClose={() => setMenu(false)} anchorRef={menuRef} width={160} align="start">
              <MenuItem
                label="이름 수정"
                onClick={() => {
                  setMenu(false);
                  setDraftName(shownName === '제목 없음' ? '' : shownName);
                  setEditingName(true);
                }}
              />
              {mode === 'edit' && report && (
                <MenuItem
                  label="삭제"
                  destructive
                  onClick={() => {
                    setMenu(false);
                    setAskDelete(true);
                  }}
                />
              )}
            </Menu>
          </Anchor>
          <i />
          <em title={report?.createdBy ?? ME}>생성자: {report?.createdBy ?? ME}</em>
          <Button hierarchy="primary" disabled={saveState !== 'READY'} onClick={onSave}>
            {saveState === 'SAVING' ? (
              <Spinner>
                <Icon name="progress_activity" size={20} />
              </Spinner>
            ) : saveState === 'SAVED' ? (
              '저장 됨'
            ) : (
              '저장'
            )}
          </Button>
        </Header>
        {crm && (
          <Banner>
            <Icon name="warning" size={20} />
            <p>CRM 이벤트는 5.1 이후 발생된 데이터만 존재합니다.</p>
            <IconButton icon="close" size="xs" label="닫기" onClick={() => setCrmClosed(true)} />
          </Banner>
        )}
        <Toolbar state={state} onRange={(r) => update(withRange(state, r))} onGranularity={(g) => update({ ...state, granularity: g })} />
        <Result center={status !== 'SUCCEEDED'}>
          {status === 'EMPTY' && (
            <State>
              <p>통계 생성을 위해 분석 지표에서 이벤트를 선택하세요.</p>
              <p>
                <a href={`https://flarelane.com/ko/docs/data-analytics/${state.type === 'INSIGHT' ? 'insight' : 'funnel'}-tips/`} target="_blank" rel="noreferrer">
                  {state.type === 'INSIGHT' ? '인사이트 사용 방법 확인하기.' : '퍼널 사용 방법 확인하기.'}
                </a>
              </p>
            </State>
          )}
          {status === 'LOADING' && (
            <State>
              <Spinner>
                <Icon name="progress_activity" size={48} />
              </Spinner>
              <p>데이터가 많을 경우 최대 10분이 걸릴 수 있습니다.</p>
            </State>
          )}
          {status === 'SUCCEEDED' && state.type === 'INSIGHT' && (
            <>
              <InsightChart series={series} dates={dates} unit={unit} granularity={state.granularity} />
              <CsvButton onClick={() => toast(`${shownName}_${dayLabel(dates[0])}-${dayLabel(dates[dates.length - 1])}.csv`)} />
              <InsightTable series={series} dates={dates} granularity={state.granularity} />
            </>
          )}
          {status === 'SUCCEEDED' && state.type === 'FUNNEL' && (
            <>
              <FunnelResult steps={state.metrics.map((m) => m.event)} counts={counts} />
              <CsvButton onClick={() => toast(`${shownName} CSV 추출`)} />
              <FunnelTable steps={state.metrics.map((m) => m.event)} counts={counts} />
            </>
          )}
        </Result>
      </ReportCard>
      <QueryPanel state={state} onChange={update} />
      {askDelete && report && (
        <ConfirmModal
          title={report.createdBy === ME ? '통계를 삭제하시겠습니까?' : '내가 생성한 통계가 아닙니다. 삭제하시겠습니까?'}
          description="삭제된 통계는 복구 불가합니다."
          cancelLabel="취소"
          confirmLabel="삭제"
          destructive
          onClose={() => setAskDelete(false)}
          onConfirm={() => {
            bypass.current = true;
            deleteReport(report.id);
            toast(`${name || '제목 없음'} 통계가 삭제되었습니다.`);
            pushWithTransition(router, `/analytics-boards/${report.boardId}`);
          }}
        />
      )}
      {boardModal && (
        <BoardSelectModal
          onClose={() => setBoardModal(false)}
          onSave={(b) => {
            setBoardModal(false);
            finishSave(b);
          }}
        />
      )}
    </>
  );
}

