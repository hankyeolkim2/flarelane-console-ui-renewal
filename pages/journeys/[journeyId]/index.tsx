import { useEffect, useReducer, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { DateRangeMenu } from '@/components/ui/DatePicker';
import Button from '@/components/ui/Button';
import { DateTimePicker } from '@/components/ui/DatePicker';
import Floating from '@/components/ui/Floating';
import IconButton from '@/components/ui/IconButton';
import { MenuItem } from '@/components/ui/Menu';
import { Dialog } from '@/components/ui/Modal';
import Radio from '@/components/ui/Radio';
import Select from '@/components/ui/Select';
import TextField from '@/components/ui/TextField';
import { Card, CardHead } from '@/components/channel/ChannelShell';
import { LineChart } from '@/components/dashboard/Charts';
import Canvas from '@/components/journeys/Canvas';
import { EntryModal, JourneyModal, metaLine, type JourneyAction } from '@/components/journeys/JourneyList';
import { ReasonField } from '@/components/sent/Reason';
import { StatusLead } from '@/components/sent/SentList';
import { addDays, parseYmd, TODAY, ymd } from '@/lib/editor';
import { journeys, STATUS_LABEL, statusOf, subscribeJourneys, emitJourneys } from '@/lib/journeys';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 여정 상세 — docs/staging-behavior-journeys-inapp.md 3장. 캔버스 · 분석 패널은 범위 밖이라 단순화(노드 세로 그림 + 전체 통계 · 일별 차트).
// 머리: 임시저장 = 「최초 활성화 이후 수정 불가」 + 「수정」, 활성화 이력 있음 = 「제목 수정」. 활성화/일시중지 + ▼ 「여정 예약」.
const STATUS_TONE = { active: 'success', paused: 'warning', draft: 'gray', archived: 'brand' } as const;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 40px;
  > h1 { margin: 0; ${text('display-xs', 'semibold')}; color: ${color('text-primary')}; }
  > small { ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
  > i { flex: 1; }
`;

const Split = styled.div`
  display: inline-flex;
  > button:first-of-type { border-radius: 8px 0 0 8px; }
  > button:last-of-type { border-radius: 0 8px 8px 0; margin-left: 1px; }
`;

const Tiles = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  > div { display: flex; flex-direction: column; gap: 4px; padding: 16px 20px; border-radius: ${radius.md}px; background: ${color('bg-secondary')}; }
  > div > small { ${text('text-sm', 'medium')}; color: ${color('text-tertiary')}; }
  > div > b { ${text('display-xs', 'semibold')}; color: ${color('text-primary')}; }
`;

const RangeBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 13px;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.md}px;
  background: ${color('bg-primary')};
  box-shadow: ${shadow.xs};
  ${text('text-sm', 'semibold')};
  color: ${color('text-secondary')};
  cursor: pointer;
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
`;

const Opt = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
  cursor: pointer;
`;

const Err = styled.p`
  margin: 4px 0 0;
  ${text('text-sm', 'regular')};
  color: ${color('text-error-primary')};
`;

function ScheduleModal({ active, onClose, onSave }: { active: boolean; onClose: () => void; onSave: () => void }) {
  const [tz, setTz] = useState('Asia/Seoul');
  const [start, setStart] = useState<'manual' | 'at'>('manual');
  const [end, setEnd] = useState<'manual' | 'at'>('manual');
  const [sd, setSd] = useState('2026-10-08T23:01');
  const [ed, setEd] = useState('2026-10-09T00:01');
  const [handling, setHandling] = useState<'PROCESS' | 'EXIT'>('PROCESS');
  const now = '2026-10-08T23:00';
  const sErr = start === 'at' && sd <= now;
  const eErr = end === 'at' && ed <= (start === 'at' ? sd : now);
  return (
    <Dialog
      title="여정 예약"
      width={520}
      onClose={onClose}
      footer={
        <>
          <Button size="md" onClick={onClose}>취소</Button>
          <Button hierarchy="primary" size="md" disabled={sErr || eErr} onClick={onSave}>
            저장
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-tertiary)' }}>활성화 이후에는 여정 수정이 불가능합니다.</p>
      <div>
        <b style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>타임존</b>
        <Select<string> value={tz} options={['Asia/Seoul', 'Asia/Tokyo', 'UTC'].map((t) => ({ value: t, label: t }))} onChange={setTz} />
      </div>
      <div style={{ opacity: active ? 0.5 : 1, pointerEvents: active ? 'none' : 'auto' }}>
        <b style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>시작일</b>
        <div style={{ display: 'flex', gap: 16 }}>
          <Opt onClick={() => setStart('manual')}>
            <Radio checked={start === 'manual'} />
            수동 시작
          </Opt>
          <Opt onClick={() => setStart('at')}>
            <Radio checked={start === 'at'} />
            예약하기
          </Opt>
        </div>
        {start === 'at' && (
          <div style={{ marginTop: 8 }}>
            <DateTimePicker ariaLabel="여정 시작일" min="2026-10-08" value={sd} onChange={setSd} />
          </div>
        )}
        {sErr && <Err>시작일은 현재 시간 이후로 선택해주세요.</Err>}
      </div>
      <div>
        <b style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>종료일</b>
        <div style={{ display: 'flex', gap: 16 }}>
          <Opt onClick={() => setEnd('manual')}>
            <Radio checked={end === 'manual'} />
            수동 종료
          </Opt>
          <Opt onClick={() => setEnd('at')}>
            <Radio checked={end === 'at'} />
            예약하기
          </Opt>
        </div>
        {end === 'at' && (
          <>
            <div style={{ marginTop: 8 }}>
              <DateTimePicker ariaLabel="여정 종료일" value={ed} onChange={setEd} />
            </div>
            {eErr && <Err>종료일은 시작일 이후로 선택해주세요.</Err>}
            <b style={{ display: 'block', margin: '12px 0 6px', fontSize: 14, fontWeight: 500 }}>발송 대기 중인 메시지</b>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Opt onClick={() => setHandling('PROCESS')}>
                <Radio checked={handling === 'PROCESS'} />
                기존 여정대로 정상 발송
              </Opt>
              <Opt onClick={() => setHandling('EXIT')}>
                <Radio checked={handling === 'EXIT'} />
                발송 취소 및 여정 종료
              </Opt>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}

export default function JourneyDetail() {
  const router = useRouter();
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => subscribeJourneys(rerender), []);
  const [range, setRange] = useState({ from: ymd(addDays(TODAY, -30)), to: ymd(TODAY) });
  const [rangeOpen, setRangeOpen] = useState(false);
  const rangeRef = useRef<HTMLButtonElement>(null);
  const moreRef = useRef<HTMLSpanElement>(null);
  const [more, setMore] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [modal, setModal] = useState<JourneyAction | null>(null);
  const [schedule, setSchedule] = useState(false);
  const [entry, setEntry] = useState(false);
  const [csv, setCsv] = useState(false);
  useEffect(() => {
    try {
      const s = sessionStorage.getItem('flarelane_journey_analytics_dates');
      if (s) {
        setRange(JSON.parse(s));
        sessionStorage.removeItem('flarelane_journey_analytics_dates');
      }
    } catch {
      // 저장소를 못 쓰면 기본 30일
    }
  }, []);
  const j = journeys.find((x) => x.id === router.query.journeyId);
  useEffect(() => {
    if (router.isReady && !j) router.push('/journeys');
  }, [router, j]);
  if (!router.isReady || !j) return null;
  const st = statusOf(j);
  const dates: Date[] = [];
  for (let d = parseYmd(range.from); d <= parseYmd(range.to); d = addDays(d, 1)) dates.push(d);
  const per = dates.map((_, i) => (j.entries ? Math.round((j.entries / dates.length) * (0.6 + ((i * 37) % 9) / 10)) : 0));

  return (
    <>
      <Head>
        <IconButton icon="arrow_back" label="뒤로" onClick={() => router.push('/journeys')} />
        {renaming !== null ? (
          <div style={{ width: 360 }}>
            <TextField autoFocus placeholder="새 여정 이름 입력" value={renaming} onChange={(e) => setRenaming(e.target.value)} />
          </div>
        ) : (
          <h1>{j.name}</h1>
        )}
        <StatusLead tone={STATUS_TONE[st]} label={STATUS_LABEL[st]} />
        {!j.archivedAt && j.lastActivatedAt && <small>{metaLine(j).split(' · ')[1]}</small>}
        <i />
        {st === 'draft' ? (
          <>
            <small>최초 활성화 이후 수정 불가</small>
            <Button hierarchy="tertiary" onClick={() => router.push(`/journeys/${j.id}/edit`)}>
              수정
            </Button>
          </>
        ) : (
          <Button
            hierarchy="tertiary"
            onClick={() => {
              if (renaming === null) return setRenaming(j.name);
              j.name = renaming.trim() || j.name;
              setRenaming(null);
              emitJourneys();
            }}
          >
            {renaming === null ? '제목 수정' : '저장'}
          </Button>
        )}
        <Split>
          <Button hierarchy="primary" onClick={() => setModal(j.active ? 'pause' : 'active')}>
            {j.active ? '일시중지' : '활성화'}
          </Button>
          <span ref={moreRef}>
            <Button hierarchy="primary" icon="keyboard_arrow_down" aria-label="더 보기" aria-haspopup="menu" aria-expanded={more} onClick={() => setMore((v) => !v)} />
          </span>
        </Split>
        <Floating anchorRef={moreRef} open={more} onClose={() => setMore(false)} width={140} offset={4}>
          <div style={{ padding: '4px 0' }}>
            <MenuItem label="여정 예약" onClick={() => { setMore(false); setSchedule(true); }} />
          </div>
        </Floating>
      </Head>
      <Card>
        <CardHead
          title="여정 분석"
          actions={
            <>
              <RangeBtn ref={rangeRef} type="button" aria-haspopup="dialog" aria-expanded={rangeOpen} onClick={() => setRangeOpen((v) => !v)}>
                <span>
                  <Icon name="calendar_month" size={20} />
                </span>
                {`${range.from} – ${range.to}`}
              </RangeBtn>
              <Floating anchorRef={rangeRef} open={rangeOpen} onClose={() => setRangeOpen(false)} width={808} offset={8} look="calendar">
                <DateRangeMenu range={range} onCancel={() => setRangeOpen(false)} onConfirm={(r) => { setRangeOpen(false); setRange(r); }} />
              </Floating>
            </>
          }
        />
        <b style={{ fontSize: 14, fontWeight: 600 }}>전체 통계</b>
        <Tiles>
          <div>
            <small>진입 여정</small>
            <b>{j.entries.toLocaleString('ko-KR')}</b>
          </div>
          <div>
            <small>전환 여정</small>
            <b>{j.conversions.toLocaleString('ko-KR')}</b>
          </div>
          <div>
            <small>전환율</small>
            <b>{`${(j.entries ? (j.conversions / j.entries) * 100 : 0).toFixed(1)}%`}</b>
          </div>
          <div>
            <small>구매 총액</small>
            <b>{`₩${j.amount.toLocaleString('ko-KR')}`}</b>
          </div>
        </Tiles>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <b style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>여정 일별 통계</b>
          <Button hierarchy="tertiary" iconLeading="download" onClick={() => setCsv(true)}>
            CSV로 내보내기
          </Button>
        </div>
        <LineChart labels={dates.map(ymd)} series={[{ key: 'e', values: per, color: 'var(--chart-clicked)', area: true }]} tip={(i) => <span>{`진입 여정: ${per[i].toLocaleString('ko-KR')}`}</span>} />
      </Card>
      <Canvas nodes={j.nodes} stats={j.nodes.map((_, i) => Math.max(0, Math.round(j.entries * (1 - i * 0.18))))} onEntry={() => setEntry(true)} height={560} />
      {modal && <JourneyModal j={j} action={modal} onClose={() => setModal(null)} onDone={() => rerender()} />}
      {schedule && (
        <ScheduleModal
          active={j.active}
          onClose={() => setSchedule(false)}
          onSave={() => setSchedule(false)}
        />
      )}
      {entry && <EntryModal j={j} onClose={() => setEntry(false)} />}
      {csv && <ReasonField onClose={() => setCsv(false)} onDownload={() => setCsv(false)} />}
    </>
  );
}
