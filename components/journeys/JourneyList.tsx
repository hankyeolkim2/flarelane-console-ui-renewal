import { useEffect, useReducer, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { RangePicker } from '@/components/analytics/editor/Toolbar';
import Button from '@/components/ui/Button';
import Floating from '@/components/ui/Floating';
import IconButton from '@/components/ui/IconButton';
import { ConfirmModal, Dialog } from '@/components/ui/Modal';
import Radio from '@/components/ui/Radio';
import { CountTabs } from '@/components/ui/Tabs';
import TextField from '@/components/ui/TextField';
import Toggle from '@/components/ui/Toggle';
import { Help } from '@/components/channel/ChannelShell';
import Canvas from './Canvas';
import { EmptyList, ListCard, Num, PageTitle, SentRow, StatusLead, type RowMenuItem } from '@/components/sent/SentList';
import { addDays, TODAY, ymd } from '@/lib/editor';
import { emitJourneys, journeys, STATUS_LABEL, statusOf, subscribeJourneys, type Journey, type JourneyStatus } from '@/lib/journeys';
import { useMounted } from '@/lib/useMounted';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 고객 여정 자동화 목록 — Figma 「고객 여정 자동화 — 목록 (활성화 탭)」(1085:22009) + docs/staging-behavior-journeys-inapp.md 1장.
// 쿼리 tab · gte · lte · sk(shallow replace), 검색 중엔 탭 숨김. 목록이 비면 /journeys/pre-built 로. 메뉴 동작은 토스트 없음.
const TABS: JourneyStatus[] = ['active', 'paused', 'draft', 'archived'];
const ICON: Record<JourneyStatus, string> = { active: 'play_circle', paused: 'pause_circle', draft: 'draft', archived: 'archive' };
const TONE = { active: 'success', paused: 'warning', draft: 'gray', archived: 'brand' } as const;
const DEFAULT = () => ({ from: ymd(addDays(TODAY, -30)), to: ymd(TODAY) });

const RangeBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 15px;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.md}px;
  background: ${color('bg-primary')};
  box-shadow: ${shadow.xs};
  ${text('text-sm', 'semibold')};
  color: ${color('text-secondary')};
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
`;

const Drawer = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 45;
  display: flex;
  flex-direction: column;
  width: 680px;
  max-width: 100vw;
  background: ${color('bg-primary')};
  box-shadow: ${shadow.xl};
  > header { display: flex; align-items: center; gap: 8px; padding: 20px 24px 0; }
  > header > h2 { flex: 1; margin: 0; ${text('text-lg', 'semibold')}; color: ${color('text-primary')}; }
  > section { flex: 1; overflow: auto; display: flex; flex-direction: column; gap: 16px; padding: 20px 24px; }
  > footer { padding: 16px 24px; border-top: 1px solid ${color('border-secondary')}; }
`;

const Dim = styled.div`
  position: fixed;
  inset: 0;
  z-index: 44;
  background: rgba(0, 4, 22, 0.2);
`;

const Metrics = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  > div { padding: 12px 16px; border-radius: ${radius.md}px; background: ${color('bg-secondary')}; display: flex; flex-direction: column; gap: 2px; }
  > div > small { ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
  > div > b { ${text('text-lg', 'semibold')}; color: ${color('text-primary')}; }
  > div > em { font-style: normal; ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
`;

const Opt = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
  cursor: pointer;
`;

const won = (n: number) => `₩${n.toLocaleString('ko-KR')}`;
const rate = (a: number, b: number) => `${(b ? (a / b) * 100 : 0).toFixed(1)}%`;

export function metaLine(j: Journey) {
  const parts = [`생성 시간: ${j.createdAt}`];
  if (!j.archivedAt && (j.lastActivatedAt || j.scheduledStartAt)) parts.push(`활성화: ${j.scheduledStartAt ?? j.lastActivatedAt} ~ ${j.scheduledEndAt ?? (j.active ? '미지정' : j.lastPausedAt ?? '미지정')}`);
  if (j.archivedAt) parts.push(`아카이브됨: ${j.archivedAt}`);
  return parts.join(' · ');
}

export function EntryModal({ j, onClose }: { j: Journey; onClose: () => void }) {
  return (
    <Dialog title="시작 조건" onClose={onClose}>
      {j.entry.kind === 'SEGMENT' ? (
        <>
          <p style={{ margin: 0, fontSize: 14 }}>대상 세그먼트에 포함될 때 진입</p>
          <span style={{ alignSelf: 'flex-start', padding: '4px 10px', borderRadius: 6, background: 'var(--bg-secondary)', fontSize: 14 }}>{j.entry.segment}</span>
          <b style={{ fontSize: 14 }}>종료 조건</b>
          <p style={{ margin: 0, fontSize: 14 }}>진입 조건을 만족하지 않게될 때 여정 종료</p>
        </>
      ) : (
        <>
          <b style={{ fontSize: 14 }}>진입 대상</b>
          <p style={{ margin: 0, fontSize: 14 }}>{j.entry.target}</p>
          <p style={{ margin: 0, fontSize: 14 }}>다음 이벤트가 발생할 때 여정 진입</p>
          <span style={{ alignSelf: 'flex-start', padding: '4px 10px', borderRadius: 6, background: 'var(--bg-secondary)', fontSize: 14 }}>{j.entry.event}</span>
        </>
      )}
    </Dialog>
  );
}

export type JourneyAction = 'pause' | 'active' | 'replicate' | 'archive' | 'delete';
export function JourneyModal({ j, action, onClose, onDone }: { j: Journey; action: JourneyAction; onClose: () => void; onDone: (tab?: JourneyStatus, nextId?: string) => void }) {
  const [handling, setHandling] = useState<'PROCESS' | 'EXIT'>(j.handlingOnPause ?? 'PROCESS');
  const cfg = {
    pause: ['정말 일시중지하시겠습니까?', ''],
    active: ['정말 활성화하시겠습니까?', '활성화 이후에는 변경이 불가능합니다. 변경이 필요할 경우 여정을 복제하세요.'],
    replicate: ['정말 복제하시겠습니까?', '이 여정으로 1개의 복제본을 생성합니다.'],
    archive: ['정말 아카이브하시겠습니까?', '해당 자동화가 아카이브 상태로 보관되며, 언제든 아카이브 상태를 되돌릴 수 있습니다.'],
    delete: ['정말 삭제하시겠습니까?', '현재 활성화 상태인 경우, 비활성화 상태로 전환이 필요합니다.'],
  }[action];
  return (
    <ConfirmModal
      title={cfg[0]}
      description={cfg[1] || undefined}
      cancelLabel="취소"
      confirmLabel="확인"
      destructive={action === 'delete'}
      onClose={onClose}
      onConfirm={() => {
        if (action === 'pause') Object.assign(j, { active: false, lastPausedAt: '2026.10.08 23:00', handlingOnPause: handling });
        if (action === 'active') Object.assign(j, { active: true, lastActivatedAt: j.lastActivatedAt ?? '2026.10.08 23:00', archivedAt: undefined });
        if (action === 'archive') Object.assign(j, { archivedAt: '2026.10.08' });
        let nextId: string | undefined;
        if (action === 'replicate') {
          nextId = `jr-${Date.now().toString(36)}`;
          journeys.unshift({ ...j, id: nextId, name: `${j.name} (복제)`, active: false, lastActivatedAt: undefined, lastPausedAt: undefined, archivedAt: undefined, createdAt: '2026.10.08', entries: 0, conversions: 0, amount: 0 });
        }
        if (action === 'delete') journeys.splice(journeys.indexOf(j), 1);
        emitJourneys();
        onClose();
        onDone(action === 'pause' ? 'paused' : action === 'active' ? 'active' : action === 'archive' ? 'archived' : undefined, nextId);
      }}
    >
      {action === 'pause' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <b style={{ color: 'var(--text-secondary)', fontSize: 14 }}>발송 대기 중인 메시지는 어떻게 할까요?</b>
          {(
            [
              ['PROCESS', '기존 여정대로 정상 발송'],
              ['EXIT', '발송 취소 및 여정 종료'],
            ] as const
          ).map(([v, l]) => (
            <Opt key={v} onClick={() => setHandling(v)}>
              <Radio checked={handling === v} />
              {l}
            </Opt>
          ))}
        </div>
      )}
    </ConfirmModal>
  );
}

export default function JourneyList() {
  const router = useRouter();
  const mounted = useMounted();
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => subscribeJourneys(rerender), []);
  const q = router.query as Record<string, string | undefined>;
  const tabQ = TABS.includes(q.tab as JourneyStatus) ? (q.tab as JourneyStatus) : null;
  const range = q.gte && q.lte && q.gte <= q.lte ? { from: q.gte, to: q.lte } : DEFAULT();
  const sk = (q.sk ?? '').trim();
  const [input, setInput] = useState(sk);
  const [rangeOpen, setRangeOpen] = useState(false);
  const rangeRef = useRef<HTMLButtonElement>(null);
  const [drawer, setDrawer] = useState<Journey | null>(null);
  const [stat, setStat] = useState(false);
  const [entry, setEntry] = useState<Journey | null>(null);
  const [modal, setModal] = useState<{ j: Journey; action: JourneyAction } | null>(null);

  const replace = (patch: Record<string, string | undefined>) => {
    const next = Object.fromEntries(Object.entries({ ...router.query, ...patch }).filter(([, v]) => v !== undefined && v !== ''));
    router.replace({ pathname: router.pathname, query: next }, undefined, { shallow: true });
  };
  useEffect(() => {
    if (!router.isReady) return;
    if (journeys.length === 0) router.push('/journeys/pre-built');
  }, [router]);
  useEffect(() => {
    if (!router.isReady || input.trim() === sk) return;
    const t = setTimeout(() => replace({ sk: input.trim() || undefined }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);
  if (!mounted || !router.isReady) return null;

  // 활성/일시중지가 없고 임시저장만 있으면 임시저장 탭으로
  const tab: JourneyStatus = tabQ ?? (journeys.every((j) => !j.lastActivatedAt) && journeys.some((j) => statusOf(j) === 'draft') ? 'draft' : 'active');
  const list = sk ? journeys.filter((j) => j.name.toLowerCase().includes(sk.toLowerCase())) : journeys.filter((j) => statusOf(j) === tab);

  const menu = (j: Journey): RowMenuItem[] => {
    const st = statusOf(j);
    const items: RowMenuItem[] = [];
    if (!j.archivedAt) items.push(j.active ? { label: '일시중지', onClick: () => setModal({ j, action: 'pause' }) } : { label: '활성화', onClick: () => setModal({ j, action: 'active' }) });
    items.push({ label: '복제', onClick: () => setModal({ j, action: 'replicate' }) });
    if (st === 'paused') items.push({ label: '아카이브', onClick: () => setModal({ j, action: 'archive' }) });
    if (st === 'archived')
      items.push({
        label: '아카이브 해제',
        onClick: () => {
          j.archivedAt = undefined;
          emitJourneys();
          replace({ tab: 'paused' });
        },
      });
    items.push({ label: '삭제', destructive: true, onClick: () => setModal({ j, action: 'delete' }) });
    return items;
  };

  return (
    <>
      <PageTitle>
        <h1>고객 여정 자동화</h1>
        <Help>
          <a href="https://docs.flarelane.co.kr/automations" target="_blank" rel="noreferrer">
            고객 여정 자동화
          </a>
          를 통해 구매 등 유저의 최종 목표 달성을 이끌어낼 수 있도록 시나리오 기반의 메시지 발송 자동화가 가능합니다.
        </Help>
        <i />
        <RangeBtn ref={rangeRef} type="button" aria-label="데이터 기간 필터" onClick={() => setRangeOpen((v) => !v)}>
          <span>
            <Icon name="calendar_today" size={20} />
          </span>
          {`${range.from} – ${range.to}`}
        </RangeBtn>
        <Floating anchorRef={rangeRef} open={rangeOpen} onClose={() => setRangeOpen(false)} width={548}>
          <RangePicker range={range} onCancel={() => setRangeOpen(false)} onConfirm={(r) => { setRangeOpen(false); replace({ gte: r.from, lte: r.to }); }} />
        </Floating>
        <Button hierarchy="primary" size="md" iconLeading="add" onClick={() => router.push('/journeys/pre-built')}>
          새 자동화
        </Button>
      </PageTitle>
      <TextField icon="search" placeholder="여정명 검색" maxLength={100} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && replace({ sk: input.trim() || undefined })} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!sk && <CountTabs<JourneyStatus> items={TABS.map((t) => ({ value: t, label: STATUS_LABEL[t], icon: ICON[t], count: journeys.filter((j) => statusOf(j) === t).length }))} value={tab} onChange={(t) => replace({ tab: t })} />}
        <ListCard>
          {list.length === 0 ? (
            <EmptyList />
          ) : (
            list.map((j) => {
              const st = statusOf(j);
              return (
                <SentRow
                  key={j.id}
                  source="console"
                  lead={<StatusLead tone={TONE[st]} label={STATUS_LABEL[st]} />}
                  topBadge={<></>}
                  content={{ title: j.name, meta: { text: metaLine(j) } }}
                  cols={[
                    [160, [{ label: '진입 여정', value: <Num n={j.entries} /> }]],
                    [112, [{ label: '전환 여정', value: `${j.conversions.toLocaleString('ko-KR')} (${rate(j.conversions, j.entries)})` }]],
                    [112, [{ label: '구매 총액', value: won(j.amount) }]],
                  ]}
                  menu={menu(j)}
                  onOpen={() => {
                    setDrawer(j);
                    setStat(false);
                  }}
                />
              );
            })
          )}
        </ListCard>
      </div>
      {drawer && (
        <>
          <Dim data-cover onClick={() => setDrawer(null)} />
          <Drawer>
            <header>
              <h2>{drawer.name}</h2>
              <IconButton icon="close" label="닫기" onClick={() => setDrawer(null)} />
            </header>
            <section>
              <Metrics>
                <div>
                  <small>진입 여정</small>
                  <b>{drawer.entries.toLocaleString('ko-KR')}</b>
                </div>
                <div>
                  <small>전환 여정</small>
                  <b>{drawer.conversions.toLocaleString('ko-KR')}</b>
                  <em>{`(${rate(drawer.conversions, drawer.entries)})`}</em>
                </div>
                <div>
                  <small>구매 총액</small>
                  <b>{won(drawer.amount)}</b>
                </div>
              </Metrics>
              <Canvas nodes={drawer.nodes} stats={stat ? drawer.nodes.map((_, i) => Math.max(0, Math.round(drawer.entries * (1 - i * 0.18)))) : undefined} onEntry={() => setEntry(drawer)} height="calc(100vh - 330px)" />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-end', fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
                통계 <Toggle label="통계" checked={stat} onChange={setStat} />
              </span>
            </section>
            <footer>
              <Button
                hierarchy="primary"
                size="md"
                full
                onClick={() => {
                  try {
                    sessionStorage.setItem('flarelane_journey_analytics_dates', JSON.stringify(range));
                  } catch {
                    // 저장소를 쓸 수 없어도 이동은 함
                  }
                  router.push(`/journeys/${drawer.id}`);
                }}
              >
                자세히보기
              </Button>
            </footer>
          </Drawer>
        </>
      )}
      {entry && <EntryModal j={entry} onClose={() => setEntry(null)} />}
      {modal && (
        <JourneyModal
          j={modal.j}
          action={modal.action}
          onClose={() => setModal(null)}
          onDone={(t, nextId) => {
            if (nextId) return router.push(`/journeys/${nextId}/edit`);
            if (t) replace({ tab: t });
          }}
        />
      )}
    </>
  );
}
