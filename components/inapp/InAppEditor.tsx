import { useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { RangePicker } from '@/components/analytics/editor/Toolbar';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Floating from '@/components/ui/Floating';
import IconButton from '@/components/ui/IconButton';
import Radio from '@/components/ui/Radio';
import Select from '@/components/ui/Select';
import TextField from '@/components/ui/TextField';
import Toggle from '@/components/ui/Toggle';
import { Card, CardHead, Help } from '@/components/channel/ChannelShell';
import { LineChart } from '@/components/dashboard/Charts';
import TestDeviceModal from '@/components/channel/TestDeviceModal';
import { ReasonField } from '@/components/sent/Reason';
import Preview from './Preview';
import { addDays, parseYmd, TODAY, ymd } from '@/lib/editor';
import { emitInApp, hasClose, inApps, OPS, toHtml, type ActionType, type IamAction, type IamModel, type InApp } from '@/lib/inapp';
import { useStore } from '@/lib/store';
import { useLeaveGuard } from '@/lib/useLeaveGuard';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 인앱 메시지 새로 만들기 · 수정 · 상세 공용 — Figma 「새 인앱 메시지」(1172:22503) + docs/staging-behavior-journeys-inapp.md 7장.
// 상세 = 같은 폼 읽기 전용 + 통계 · 기간 필터 · 「일시중지/활성화」 · 하단 삭제/수정. 새로/수정 = 나가기 경고, 저장 성공 토스트 없음 → 상세로.
type Mode = 'new' | 'edit' | 'detail';

const Cols = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(300px, 32%, 368px);
  gap: 16px;
  align-items: start;
`;

const Side = styled.div`
  position: sticky;
  top: 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 15px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  background: ${color('bg-primary')};
  box-shadow: ${shadow.xs};
  > header { display: flex; align-items: center; gap: 4px; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
  > header > i { flex: 1; }
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  > h1 { flex: 1; margin: 0; ${text('display-xs', 'semibold')}; color: ${color('text-primary')}; }
`;

const Panel = styled.div`
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.md}px;
  overflow: hidden;
  > button { display: flex; align-items: center; width: 100%; padding: 12px 16px; border: 0; background: ${color('bg-primary')}; ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; cursor: pointer; text-align: left; }
  > button[aria-expanded='true'] { background: ${color('bg-secondary')}; }
  > button > i { flex: 1; }
  > button > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  > div { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
`;

const L = styled.span`
  display: block;
  margin-bottom: 6px;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  > small { ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; white-space: nowrap; }
`;

const Note = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 15px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.md}px;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
  > span { display: inline-flex; color: ${color('fg-brand-secondary')}; }
`;

const Swatch = styled.span<{ c: string }>`
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.md}px;
  background: ${(p) => p.c};
`;

const Opt = styled.label<{ $ro?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
  cursor: ${(p) => (p.$ro ? 'default' : 'pointer')};
  user-select: none;
`;

const StatCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 20px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.lg}px;
  > div:first-of-type { display: flex; align-items: center; gap: 8px; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
  > div:first-of-type > b { flex: 1; text-align: right; ${text('text-xl', 'semibold')}; color: ${color('text-primary')}; }
  > i { display: flex; height: 8px; border-radius: 9999px; overflow: hidden; background: var(--chart-none); }
  > ul { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
  > ul > li { display: flex; align-items: center; gap: 6px; }
  > ul > li > em { width: 8px; height: 8px; border-radius: 50%; }
`;

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
  cursor: pointer;
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
`;

const ACTION_LABEL: Record<ActionType, string> = { close: '닫기', url: 'URL', custom: '커스텀 액션', subscribe: '푸시 알림 구독 요청' };
const PLAT = [
  ['android', '앱(안드로이드)', 'var(--chart-converted)'],
  ['ios', '앱(iOS)', 'var(--chart-clicked)'],
  ['webDesktop', '웹(데스크탑)', 'var(--chart-impression)'],
  ['webMobile', '웹(모바일)', 'var(--chart-sent)'],
] as const;

function Fold({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Panel>
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {title}
        <i />
        <span>
          <Icon name={open ? 'keyboard_arrow_up' : 'chevron_right'} size={20} />
        </span>
      </button>
      {open && <div>{children}</div>}
    </Panel>
  );
}

function Actions({ list, ro, onChange }: { list: IamAction[]; ro: boolean; onChange: (a: IamAction[]) => void }) {
  const [draft, setDraft] = useState<IamAction>({ type: 'close', arg: '', unit: 'DAY' });
  const free = (Object.keys(ACTION_LABEL) as ActionType[]).filter((t) => !list.some((a) => a.type === t));
  const line = (a: IamAction, set: (a: IamAction) => void, tail: ReactNode, key: string) => (
    <Row key={key}>
      <div style={{ width: 132 }}>
        <Select<ActionType> disabled={ro} value={a.type} placeholder="액션 선택" options={(key === 'new' ? free : [a.type]).map((t) => ({ value: t, label: ACTION_LABEL[t] }))} onChange={(type) => set({ ...a, type, arg: '' })} />
      </div>
      {a.type === 'close' ? (
        <>
          <div style={{ width: 80 }}>
            <TextField readOnly={ro} value={a.arg} placeholder="n일 동안 보지 않기" onChange={(e) => set({ ...a, arg: e.target.value })} />
          </div>
          <div style={{ width: 100 }}>
            <Select<'DAY' | 'HOUR'> disabled={ro} value={a.unit ?? 'DAY'} options={[{ value: 'DAY', label: '일' }, { value: 'HOUR', label: '시간' }]} onChange={(unit) => set({ ...a, unit })} />
          </div>
          <small>* 다시 보지 않기</small>
          <i style={{ flex: 1 }} />
        </>
      ) : a.type === 'subscribe' ? (
        <i style={{ flex: 1 }} />
      ) : (
        <TextField readOnly={ro} value={a.arg} placeholder={a.type === 'url' ? 'https://' : '액션 이름'} onChange={(e) => set({ ...a, arg: e.target.value })} />
      )}
      {tail}
    </Row>
  );
  return (
    <div>
      <L>액션</L>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.map((a, i) => line(a, (x) => onChange(list.map((y, j) => (j === i ? x : y))), !ro && <IconButton icon="delete" label="삭제" onClick={() => onChange(list.filter((_, j) => j !== i))} />, String(i)))}
        {!ro &&
          free.length > 0 &&
          line(
            { ...draft, type: free.includes(draft.type) ? draft.type : free[0] },
            setDraft,
            <IconButton
              icon="add"
              label="추가"
              onClick={() => {
                const a = { ...draft, type: free.includes(draft.type) ? draft.type : free[0] };
                if (a.type === 'close' && a.arg && Number.isNaN(Number(a.arg))) return window.alert('숫자를 입력해주세요.');
                onChange([...list, a]);
                setDraft({ type: 'close', arg: '', unit: 'DAY' });
              }}
            />,
            'new',
          )}
      </div>
    </div>
  );
}

function ClickStat({ id, ro, onChange }: { id?: string; ro: boolean; onChange: (id?: string) => void }) {
  return (
    <Row>
      <Opt $ro={ro} onClick={() => !ro && onChange(id === undefined ? '' : undefined)}>
        <Checkbox checked={id !== undefined} disabled={ro} />
        클릭 통계 활성화
      </Opt>
      {id !== undefined && (
        <div style={{ width: 160 }}>
          <TextField readOnly={ro} placeholder="클릭ID" value={id} onChange={(e) => onChange(e.target.value)} />
        </div>
      )}
    </Row>
  );
}

export default function InAppEditor({ mode, initial }: { mode: Mode; initial: InApp }) {
  const router = useRouter();
  const { toast } = useStore();
  const ro = mode === 'detail';
  const allow = useLeaveGuardFor(mode);
  const [m, setM] = useState<InApp>(() => JSON.parse(JSON.stringify(initial)));
  const [device, setDevice] = useState<'mobile' | 'web'>('mobile');
  const [period, setPeriod] = useState(m.start ? 'range' : 'always');
  const [range, setRange] = useState({ from: (router.query.gte as string) ?? ymd(addDays(TODAY, -30)), to: (router.query.lte as string) ?? ymd(TODAY) });
  const [rangeOpen, setRangeOpen] = useState(false);
  const rangeRef = useRef<HTMLButtonElement>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [csv, setCsv] = useState(false);
  const [convTab, setConvTab] = useState(0);
  const [convEvents, setConvEvents] = useState(['purchase_completed']);
  const [basis, setBasis] = useState<'CLICK' | 'SEND'>('CLICK');
  const [window_, setWindow] = useState({ n: 3, unit: 'DAY' });
  const model = m.model;
  const setModel = (patch: Partial<IamModel>) => setM({ ...m, model: { ...model, ...patch } });
  const set = (patch: Partial<InApp>) => setM({ ...m, ...patch });
  const html = toHtml(model);

  const save = () => {
    if (!hasClose(model)) return window.alert('닫기 액션이 없습니다. 닫기 액션을 추가해주세요.');
    if (period === 'range' && (!m.start || !m.end || m.start >= m.end)) return toast('노출 기간이 유효하지 않습니다.');
    const next = { ...m, start: period === 'range' ? m.start : undefined, end: period === 'range' ? m.end : undefined };
    if (mode === 'edit') {
      if (!window.confirm('수정하시겠습니까?')) return;
      Object.assign(inApps.find((x) => x.id === m.id)!, next);
    } else {
      // 새로 만든 인앱은 항상 일시중지 상태로 생성
      inApps.push({ ...next, status: 'paused', displayStatus: 'paused', createdAt: '2026.10.08' });
    }
    emitInApp();
    allow();
    router.push(`/in-app/${m.id}`);
  };

  const dates: Date[] = [];
  for (let d = parseYmd(range.from); d <= parseYmd(range.to); d = addDays(d, 1)) dates.push(d);
  const s = m.stats;
  const daily = (tot: number, k: number) => dates.map((_, i) => Math.round((tot / Math.max(1, dates.length)) * (0.6 + ((i * k) % 9) / 10)));
  const disp = daily(s.displayed, 37);
  const clk = daily(s.clicked, 53);

  return (
    <>
      <Head>
        <IconButton icon="chevron_left" label="뒤로" onClick={() => router.push({ pathname: '/in-app', query: router.query.gte ? { gte: router.query.gte, lte: router.query.lte } : {} })} />
        <h1>{mode === 'new' ? '새 인앱 메시지' : '인앱 메시지'}</h1>
        {mode !== 'new' && (
          <>
            <RangeBtn ref={rangeRef} type="button" onClick={() => setRangeOpen((v) => !v)}>
              <span>
                <Icon name="calendar_today" size={20} />
              </span>
              {`${range.from} – ${range.to}`}
            </RangeBtn>
            <Floating anchorRef={rangeRef} open={rangeOpen} onClose={() => setRangeOpen(false)} width={548}>
              <RangePicker range={range} onCancel={() => setRangeOpen(false)} onConfirm={(r) => { setRangeOpen(false); setRange(r); }} />
            </Floating>
          </>
        )}
      </Head>
      <Cols>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <CardHead title="캠페인 명" />
            <Row>
              <TextField readOnly={ro} placeholder="인앱 메시지 제목" value={m.title} onChange={(e) => set({ title: e.target.value })} />
              {ro && (
                <Button
                  size="md"
                  onClick={() => {
                    const target = inApps.find((x) => x.id === m.id)!;
                    // 스테이징: 활성화는 확인창, 일시중지는 확인 없이 바로
                    if (m.status !== 'active' && !window.confirm('활성화하시겠습니까?')) return;
                    const st = m.status === 'active' ? 'paused' : 'active';
                    Object.assign(target, { status: st, displayStatus: st });
                    set({ status: st, displayStatus: st });
                    emitInApp();
                  }}
                >
                  {m.status === 'active' ? '일시중지' : '활성화'}
                </Button>
              )}
            </Row>
          </Card>
          <Card>
            <CardHead
              title="노출 시점"
              help={
                <>
                  인앱메시지 노출 시점은 고객사가 직접 제어합니다.
                  <br />
                  서비스 내 원하는 타이밍에 displayInApp(&apos;트리거_이름&apos;) 함수를 실행하도록 코드를 삽입하세요. 입력한 트리거 조건과 일치하는 함수 실행 시점에 인앱메시지가 노출됩니다.
                </>
              }
            />
            <Row>
              <div style={{ width: 320 }}>
                <TextField readOnly={ro} placeholder="트리거 입력" value={m.group} onChange={(e) => set({ group: e.target.value })} />
              </div>
              {!ro && (
                <Button iconLeading="add" disabled={(m.conditions?.length ?? 0) >= 3} onClick={() => set({ conditions: [...(m.conditions ?? []), { key: '', op: 'EQ', value: '' }] })}>
                  필터
                </Button>
              )}
            </Row>
            {(m.conditions ?? []).map((c, i) => (
              <Row key={i}>
                <TextField readOnly={ro} placeholder="속성 입력" value={c.key} onChange={(e) => set({ conditions: m.conditions!.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)) })} />
                <div style={{ width: 140, flexShrink: 0 }}>
                  <Select<string> disabled={ro} value={c.op} options={OPS.map(([v, l]) => ({ value: v, label: l }))} onChange={(op) => set({ conditions: m.conditions!.map((x, j) => (j === i ? { ...x, op } : x)) })} />
                </div>
                <TextField readOnly={ro} placeholder="값 입력" value={c.value} onChange={(e) => set({ conditions: m.conditions!.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                {!ro && <IconButton icon="remove" label="삭제" onClick={() => set({ conditions: m.conditions!.length === 1 ? null : m.conditions!.filter((_, j) => j !== i) })} />}
              </Row>
            ))}
            <Note>
              <span>
                <Icon name="info" size={20} />
              </span>
              {`FlareLane.displayInApp("${m.group}") 실행 시 인앱메시지 노출`}
            </Note>
          </Card>

          {ro && (
            <Card>
              <CardHead title="통계" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {(
                  [
                    ['노출', s.displayed, 'displayed'],
                    ['클릭', s.clicked, 'clicked'],
                  ] as const
                ).map(([l, v, k]) => (
                  <StatCard key={k}>
                    <div>
                      {l}
                      <b>
                        {v.toLocaleString('ko-KR')}
                        {k === 'clicked' && <span style={{ marginLeft: 6, fontSize: 14, fontWeight: 400, color: 'var(--text-tertiary)' }}>{`${(s.displayed ? (s.clicked / s.displayed) * 100 : 0).toFixed(1)}%`}</span>}
                      </b>
                      {v > 0 && <IconButton icon="download" label="다운로드" onClick={() => setCsv(true)} />}
                    </div>
                    <i>{v > 0 && PLAT.map(([p, , c]) => <span key={p} style={{ width: `${(s.platform[p][k] / v) * 100}%`, background: c }} />)}</i>
                    <ul>
                      {PLAT.map(([p, pl, c]) => (
                        <li key={p}>
                          <em style={{ background: c }} />
                          {`${pl} ${s.platform[p][k].toLocaleString('ko-KR')} (${(v ? (s.platform[p][k] / v) * 100 : 0).toFixed(1)}%)`}
                        </li>
                      ))}
                    </ul>
                  </StatCard>
                ))}
              </div>
              <b style={{ fontSize: 14, fontWeight: 600 }}>기간별 노출 및 클릭</b>
              <LineChart
                labels={dates.map(ymd)}
                series={[
                  { key: 'd', values: disp, color: 'var(--chart-impression)' },
                  { key: 'c', values: clk, color: 'var(--chart-clicked)' },
                ]}
                tip={(i) => (
                  <>
                    <span>{`노출: ${disp[i].toLocaleString('ko-KR')}`}</span>
                    <span>{`클릭: ${clk[i].toLocaleString('ko-KR')}`}</span>
                  </>
                )}
              />
            </Card>
          )}

          <Card>
            <CardHead
              title="메시지"
              actions={
                <>
                  <Button
                    hierarchy="tertiary"
                    iconLeading="content_copy"
                    onClick={() => navigator.clipboard?.writeText(html).then(() => window.alert('클립보드에 복사되었습니다.'))}
                  >
                    HTML 복사하기
                  </Button>
                  {ro && <Button onClick={() => setTestOpen(true)}>테스트 발송</Button>}
                </>
              }
            />
            {model.displayType === 'HTML' ? (
              <textarea aria-label="인앱 HTML" readOnly={ro} value={model.html ?? ''} onChange={(e) => setModel({ html: e.target.value })} style={{ minHeight: 320, padding: 12, border: '1px solid var(--border-primary)', borderRadius: 8, font: '13px/20px ui-monospace, Menlo, monospace' }} />
            ) : (
              <>
                <Fold title="배경">
                  <div>
                    <L>배경색</L>
                    <Row>
                      <Swatch c={model.bg} />
                      <div style={{ width: 200 }}>
                        <TextField readOnly={ro} value={model.bg} onChange={(e) => setModel({ bg: e.target.value })} />
                      </div>
                    </Row>
                  </div>
                  <ClickStat id={model.bgClickId} ro={ro} onChange={(bgClickId) => setModel({ bgClickId })} />
                  <Actions list={model.bgActions} ro={ro} onChange={(bgActions) => setModel({ bgActions })} />
                  <Note>
                    <span>
                      <Icon name="info" size={20} />
                    </span>
                    이 영역을 클릭하여 인앱메시지를 닫으려면 닫기 액션을 추가하세요.
                  </Note>
                </Fold>
                {model.slides.map((sl, i) => (
                  <Fold key={i} title="이미지" defaultOpen={i === 0}>
                    <div>
                      <L>이미지</L>
                      <Row style={{ padding: '10px 14px', border: '1px solid var(--border-secondary)', borderRadius: 8 }}>
                        <Icon name="image" size={20} />
                        <span style={{ flex: 1, fontSize: 14 }}>{`${sl.image} · 업로드됨`}</span>
                        {!ro && <IconButton icon="close" size="xs" label="지우기" onClick={() => undefined} />}
                      </Row>
                    </div>
                    <ClickStat id={sl.clickId} ro={ro} onChange={(clickId) => setModel({ slides: model.slides.map((x, j) => (j === i ? { ...x, clickId } : x)) })} />
                    <Actions list={sl.actions} ro={ro} onChange={(actions) => setModel({ slides: model.slides.map((x, j) => (j === i ? { ...x, actions } : x)) })} />
                    {!ro && model.slides.length >= 3 && (
                      <Row style={{ justifyContent: 'flex-end' }}>
                        <Button hierarchy="destructive-tertiary" iconLeading="delete" onClick={() => setModel({ slides: model.slides.filter((_, j) => j !== i) })}>
                          캐러셀 삭제
                        </Button>
                      </Row>
                    )}
                  </Fold>
                ))}
                {!ro && model.slides.length > 1 && model.slides.length < 6 && (
                  <Row style={{ justifyContent: 'flex-end' }}>
                    <Button hierarchy="tertiary" iconLeading="add" onClick={() => setModel({ slides: [...model.slides, { image: `image${model.slides.length + 1}.png`, actions: [] }] })}>
                      캐러셀 추가
                    </Button>
                  </Row>
                )}
                {model.buttons.map((b, i) => (
                  <Fold key={i} title="버튼">
                    <Row>
                      <div style={{ flex: 1 }}>
                        <L>색</L>
                        <Row>
                          <Swatch c={b.color} />
                          <TextField readOnly={ro} value={b.color} onChange={(e) => setModel({ buttons: model.buttons.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)) })} />
                        </Row>
                      </div>
                      <div style={{ flex: 1 }}>
                        <L>배경색</L>
                        <Row>
                          <Swatch c={b.bg} />
                          <TextField readOnly={ro} value={b.bg} onChange={(e) => setModel({ buttons: model.buttons.map((x, j) => (j === i ? { ...x, bg: e.target.value } : x)) })} />
                        </Row>
                      </div>
                    </Row>
                    <div style={{ width: 120 }}>
                      <L>모서리 곡선(px)</L>
                      <TextField readOnly={ro} type="number" min={0} value={String(b.radius)} onChange={(e) => setModel({ buttons: model.buttons.map((x, j) => (j === i ? { ...x, radius: Number(e.target.value) } : x)) })} />
                    </div>
                    <ClickStat id={b.clickId} ro={ro} onChange={(clickId) => setModel({ buttons: model.buttons.map((x, j) => (j === i ? { ...x, clickId } : x)) })} />
                    <Actions list={b.actions} ro={ro} onChange={(actions) => setModel({ buttons: model.buttons.map((x, j) => (j === i ? { ...x, actions } : x)) })} />
                  </Fold>
                ))}
                {!ro && (
                  <Fold title="고급 설정">
                    <L>웹 컨테이너 설정</L>
                    {model.container.map(([k, v], i) => (
                      <Row key={i}>
                        <div style={{ width: 160 }}>
                          <Select<string> value={k || null} placeholder="Key" options={['top', 'left', 'bottom', 'right', 'width', 'height', 'z-index', 'position', 'transform'].map((x) => ({ value: x, label: x }))} onChange={(nk) => setModel({ container: model.container.map((x, j) => (j === i ? [nk, x[1]] : x)) })} />
                        </div>
                        <TextField placeholder="Value" value={v} onChange={(e) => setModel({ container: model.container.map((x, j) => (j === i ? [x[0], e.target.value] : x)) })} />
                        <IconButton icon="remove" label="삭제" onClick={() => setModel({ container: model.container.filter((_, j) => j !== i) })} />
                      </Row>
                    ))}
                    <Row style={{ justifyContent: 'flex-end' }}>
                      <Button iconLeading="add" onClick={() => setModel({ container: [...model.container, ['', '']] })}>
                        추가
                      </Button>
                    </Row>
                  </Fold>
                )}
                {model.slides.length > 1 && (
                  <Fold title="캐러셀 설정">
                    <Row>
                      <span style={{ width: 140, fontSize: 14, color: 'var(--text-secondary)' }}>자동 슬라이드</span>
                      <Toggle label="자동 슬라이드" disabled={ro} checked={model.carousel.auto} onChange={(auto) => setModel({ carousel: { ...model.carousel, auto } })} />
                    </Row>
                    <Row>
                      <span style={{ width: 140, fontSize: 14, color: 'var(--text-secondary)' }}>자동 슬라이드 속도(초)</span>
                      <div style={{ width: 80 }}>
                        <TextField readOnly={ro} type="number" min={1} value={String(model.carousel.speed)} onChange={(e) => setModel({ carousel: { ...model.carousel, speed: Math.max(1, Number(e.target.value) || 1) } })} />
                      </div>
                      <small>초</small>
                    </Row>
                  </Fold>
                )}
              </>
            )}
          </Card>

          <Card>
            <CardHead title="설정" />
            <div style={{ width: 160 }}>
              <L>우선순위</L>
              <Select<string> disabled={ro} value={String(m.priority)} options={[{ value: '0', label: '높음' }, { value: '1', label: '중간' }, { value: '2', label: '낮음' }]} onChange={(v) => set({ priority: Number(v) as 0 | 1 | 2 })} />
            </div>
            <div>
              <L>노출 기간</L>
              <Row style={{ gap: 16, marginBottom: 8 }}>
                <Opt $ro={ro} onClick={() => !ro && setPeriod('always')}>
                  <Radio checked={period === 'always'} disabled={ro} />
                  항상
                </Opt>
                <Opt $ro={ro} onClick={() => { if (ro) return; setPeriod('range'); if (!m.start) set({ start: '2026-10-08T23:00', end: '2026-10-15T23:00' }); }}>
                  <Radio checked={period === 'range'} disabled={ro} />
                  기간 내
                </Opt>
              </Row>
              {period === 'range' &&
                (ro ? (
                  <span style={{ fontSize: 14 }}>{`${m.start} ~ ${m.end} Asia/Seoul`}</span>
                ) : (
                  <Row>
                    <TextField type="datetime-local" value={(m.start ?? '').replace(/\./g, '-').replace(' ', 'T').slice(0, 16)} onChange={(e) => set({ start: e.target.value })} />
                    <small>~</small>
                    <TextField type="datetime-local" value={(m.end ?? '').replace(/\./g, '-').replace(' ', 'T').slice(0, 16)} onChange={(e) => set({ end: e.target.value })} />
                    <small>Asia/Seoul</small>
                  </Row>
                ))}
            </div>
            <div>
              <L>노출 대상</L>
              <Row style={{ gap: 16 }}>
                <Opt $ro={ro} onClick={() => !ro && set({ target: 'all' })}>
                  <Radio checked={m.target === 'all'} disabled={ro} />
                  모든 기기
                </Opt>
                <Opt $ro={ro} onClick={() => !ro && set({ target: 'segment' })}>
                  <Radio checked={m.target === 'segment'} disabled={ro} />
                  다음 조건 만족 기기
                </Opt>
              </Row>
              {m.target === 'segment' && (
                <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 10, background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ width: 160 }}>
                    <Select<string> disabled={ro} value={null} placeholder="필터 선택" options={['플랫폼', '테스트 기기', '유저 ID', '태그', 'APP 버전', 'OS 버전', '국가', '언어'].map((x) => ({ value: x, label: x }))} onChange={() => undefined} />
                  </div>
                  {!ro && (
                    <div>
                      <Button hierarchy="tertiary" iconLeading="add">
                        그리고
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHead title="전환 이벤트 설정" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[false, true].map((on) => (
                <Opt key={String(on)} $ro={ro} onClick={() => !ro && set({ conversion: on })}>
                  <Radio checked={m.conversion === on} disabled={ro} />
                  {on ? '설정' : '미설정'}
                </Opt>
              ))}
            </div>
            {m.conversion && (
              <>
                <div style={{ border: '1px solid var(--border-secondary)', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px', borderBottom: '1px solid var(--border-secondary)', background: 'var(--bg-secondary)' }}>
                    {convEvents.map((_, i) => (
                      <button key={i} type="button" onClick={() => setConvTab(i)} style={{ padding: '10px 0', border: 0, borderBottom: `2px solid ${convTab === i ? 'var(--fg-brand-primary)' : 'transparent'}`, background: 'none', fontSize: 14, fontWeight: 600, color: convTab === i ? 'var(--text-brand-secondary)' : 'var(--text-quaternary)', cursor: 'pointer' }}>
                        {i ? `이벤트 ${i + 1}` : '이벤트'}
                      </button>
                    ))}
                    {!ro && <IconButton icon="add" size="xs" label="추가" onClick={() => setConvEvents((l) => [...l, ''])} />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
                    <div>
                      <L>이벤트</L>
                      <div style={{ width: 240 }}>
                        <Select<string> disabled={ro} value={convEvents[convTab] || null} placeholder="이벤트 선택" options={['purchase_completed', 'add_to_cart', 'sign_up'].map((x) => ({ value: x, label: x }))} onChange={(v) => setConvEvents((l) => l.map((x, j) => (j === convTab ? v : x)))} />
                      </div>
                    </div>
                    <div>
                      <L>전환 측정 기준</L>
                      <Row style={{ gap: 16 }}>
                        <Opt $ro={ro} onClick={() => !ro && setBasis('CLICK')}>
                          <Radio checked={basis === 'CLICK'} disabled={ro} />
                          클릭 기반
                        </Opt>
                        <Opt $ro={ro} onClick={() => !ro && setBasis('SEND')}>
                          <Radio checked={basis === 'SEND'} disabled={ro} />
                          발송 기반
                        </Opt>
                      </Row>
                    </div>
                    <div>
                      <L>기여 기간</L>
                      <Row>
                        <div style={{ width: 80 }}>
                          <TextField readOnly={ro} type="number" min={1} value={String(window_.n)} onChange={(e) => setWindow({ ...window_, n: Math.max(1, Number(e.target.value) || 1) })} />
                        </div>
                        <div style={{ width: 96 }}>
                          <Select<string> disabled={ro} value={window_.unit} options={[{ value: 'DAY', label: '일' }, { value: 'HOUR', label: '시간' }]} onChange={(unit) => setWindow({ ...window_, unit })} />
                        </div>
                      </Row>
                    </div>
                  </div>
                </div>
                <Note>
                  <span>
                    <Icon name="info" size={20} />
                  </span>
                  {`${basis === 'CLICK' ? '클릭' : '발송'} 후 ${window_.n}${window_.unit === 'DAY' ? '일' : '시간'} 내 ${convEvents[convTab] || '이벤트'} 이벤트 발생 시 전환으로 측정됩니다.`}
                </Note>
              </>
            )}
          </Card>
        </div>
        <Side>
          <header>
            미리보기 <Help>실제 화면은 기기 · 앱 화면에 따라 다르게 보일 수 있습니다.</Help>
            <i />
            <IconButton icon="smartphone" hierarchy={device === 'mobile' ? 'secondary' : 'tertiary'} label="모바일" onClick={() => setDevice('mobile')} />
            <IconButton icon="desktop_windows" hierarchy={device === 'web' ? 'secondary' : 'tertiary'} label="웹" onClick={() => setDevice('web')} />
          </header>
          <Preview html={html} device={device} />
        </Side>
      </Cols>
      <div style={{ display: 'flex', justifyContent: ro ? 'space-between' : 'flex-end' }}>
        {ro ? (
          <>
            <Button
              hierarchy="destructive-secondary"
              size="md"
              onClick={() => {
                if (!window.confirm('삭제하시겠습니까?')) return;
                inApps.splice(inApps.findIndex((x) => x.id === m.id), 1);
                emitInApp();
                toast('인앱 메시지가 삭제되었습니다.');
                router.replace('/in-app');
              }}
            >
              삭제
            </Button>
            <Button hierarchy="primary" size="md" onClick={() => router.push(`/in-app/${m.id}/edit`)}>
              수정
            </Button>
          </>
        ) : (
          <Button hierarchy="primary" size="md" onClick={save}>
            {mode === 'new' ? '생성' : '수정'}
          </Button>
        )}
      </div>
      {testOpen && (
        <TestDeviceModal
          filter={() => true}
          onClose={() => setTestOpen(false)}
          onSend={() => {
            setTestOpen(false);
            window.alert('테스트 인앱 메시지가 최우선 노출 예약되었습니다. 해당 기기로 노출 그룹 실행 시 노출됩니다.');
          }}
        />
      )}
      {csv && <ReasonField onClose={() => setCsv(false)} onDownload={() => setCsv(false)} />}
    </>
  );
}

// 상세는 나가기 경고 없음
function useLeaveGuardFor(mode: Mode) {
  const guard = useLeaveGuard();
  return mode === 'detail' ? () => undefined : guard;
}
