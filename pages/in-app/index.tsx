import { useEffect, useReducer, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { DateRangeMenu } from '@/components/ui/DatePicker';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Floating from '@/components/ui/Floating';
import { MenuItem } from '@/components/ui/Menu';
import { ConfirmModal } from '@/components/ui/Modal';
import TextField from '@/components/ui/TextField';
import { HoverTip } from '@/components/ui/Tooltip';
import { Thumb } from '@/components/inapp/Preview';
import { EmptyList, Num } from '@/components/sent/SentList';
import { addDays, TODAY, ymd } from '@/lib/editor';
import { emitInApp, inApps, OPS, subscribeInApp, toHtml, type InApp } from '@/lib/inapp';
import { useStore } from '@/lib/store';
import { useMounted } from '@/lib/useMounted';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 인앱 메시지 목록 — Figma 「인앱 메시지 — 프로토타입2」(991:45253) 모양 + docs/staging-behavior-journeys-inapp.md 5장.
// 쿼리 gte · lte · status(없으면 localStorage, 그것도 없으면 active,temp) · sk. 페이지 없음. 노출 그룹 클릭 = 그 섹션으로 스크롤 + 3초 강조.
// ⋯ 일시중지 · 활성화 · 삭제 = 브라우저 확인창, 삭제만 토스트. 복제 = 확인 모달 → 수정 화면.
type S = 'temp' | 'active' | 'paused';
const STATUS: [S, string][] = [
  ['temp', '임시 저장'],
  ['active', '활성화'],
  ['paused', '일시 중단'],
];
const KEY = 'flarelane_inAppStatus';
const PRIORITY = ['높음', '중간', '낮음'];

const Head = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  > div:first-of-type { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  > div:first-of-type > h1 { margin: 0; ${text('display-xs', 'semibold')}; color: ${color('text-primary')}; }
  > div:first-of-type > p { margin: 0; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
`;

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
  > label { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
  > i { flex: 1; }
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

const Cols = styled.div`
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  > div > small { display: block; margin-bottom: 8px; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
`;

const Rail = styled.div`
  position: sticky;
  top: 32px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  background: ${color('bg-primary')};
  box-shadow: ${shadow.xs};
  overflow: hidden;
  > button { display: flex; flex-direction: column; gap: 4px; width: 100%; padding: 12px 16px; border: 0; background: ${color('bg-primary')}; text-align: left; cursor: pointer; }
  > button + button { border-top: 1px solid ${color('border-secondary')}; }
  > button > b { ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  > button > small { ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
  > button:hover:not(:disabled) { background: ${color('bg-secondary')}; }
  > button:disabled { background: ${color('bg-secondary')}; cursor: default; }
  > button:disabled > b, > button:disabled > small { color: ${color('text-disabled')}; }
`;

const Group = styled.section<{ $hl: boolean }>`
  border: 1px solid ${(p) => (p.$hl ? color('border-brand') : color('border-secondary'))};
  border-radius: ${radius.xl}px;
  background: ${color('bg-primary')};
  box-shadow: ${(p) => (p.$hl ? '0 0 0 4px rgba(29,66,137,0.12)' : shadow.xs)};
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
  > header { display: flex; align-items: center; padding: 14px 20px; border-bottom: 1px solid ${color('border-secondary')}; }
  > header > b { flex: 1; ${text('text-lg', 'semibold')}; color: ${color('text-primary')}; }
  > header > small { display: inline-flex; align-items: center; gap: 4px; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
`;

const Card = styled.div`
  display: flex;
  gap: 16px;
  padding: 20px;
  cursor: pointer;
  & + & { border-top: 1px solid ${color('border-secondary')}; }
  &:hover { background: ${color('bg-secondary')}; }
  > div[data-body] { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
  > div[data-body] > header { display: flex; align-items: center; gap: 8px; }
  > div[data-body] > header > b { flex: 1; min-width: 0; ${text('text-lg', 'semibold')}; color: ${color('text-primary')}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

const Chip = styled.span<{ s: S }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  border-radius: 9999px;
  border: 1px solid ${(p) => (p.s === 'active' ? color('utility-green-200') : p.s === 'paused' ? color('utility-yellow-200') : color('utility-neutral-200'))};
  background: ${(p) => (p.s === 'active' ? color('utility-green-50') : p.s === 'paused' ? color('utility-yellow-50') : color('utility-neutral-50'))};
  ${text('text-xs', 'medium')};
  color: ${(p) => (p.s === 'active' ? color('utility-green-700') : p.s === 'paused' ? color('utility-yellow-700') : color('utility-neutral-700'))};
  white-space: nowrap;
  &::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  > div { display: grid; grid-template-columns: auto 1fr; row-gap: 6px; column-gap: 12px; padding: 0 20px; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; white-space: nowrap; }
  > div:first-of-type { padding-left: 0; }
  > div + div { border-left: 1px solid ${color('border-secondary')}; }
  > div > b { text-align: right; ${text('text-sm', 'medium')}; color: ${color('text-primary')}; font-variant-numeric: tabular-nums; }
  > div > b > em { margin-left: 8px; font-style: normal; color: ${color('text-tertiary')}; font-weight: 400; }
`;

const pct = (a: number, b: number) => `${(b ? (a / b) * 100 : 0).toFixed(1)}%`;

function CardMenu({ m, onCopy }: { m: InApp; onCopy: () => void }) {
  const router = useRouter();
  const { toast } = useStore();
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const run = (f: () => void) => {
    setOpen(false);
    f();
  };
  return (
    <span onClick={(e) => e.stopPropagation()}>
      <button ref={ref} type="button" aria-label="더 보기" onClick={() => setOpen((v) => !v)} style={{ display: 'inline-flex', width: 32, height: 32, alignItems: 'center', justifyContent: 'center', border: 0, borderRadius: 8, background: 'transparent', color: 'var(--fg-quaternary)', cursor: 'pointer' }}>
        <Icon name="more_horiz" size={20} />
      </button>
      <Floating anchorRef={ref} open={open} onClose={() => setOpen(false)} width={160} offset={4}>
        <div style={{ padding: '4px 0' }}>
          {m.status === 'active' && <MenuItem label="일시중지" onClick={() => run(() => window.confirm('일시중지하시겠습니까?') && (Object.assign(m, { status: 'paused', displayStatus: 'paused' }), emitInApp()))} />}
          {m.status === 'paused' && <MenuItem label="활성화" onClick={() => run(() => window.confirm('활성화하시겠습니까?') && (Object.assign(m, { status: 'active', displayStatus: 'active' }), emitInApp()))} />}
          <MenuItem label="수정" onClick={() => run(() => router.push(`/in-app/${m.id}/edit`))} />
          <MenuItem label="복제" onClick={() => run(onCopy)} />
          <MenuItem
            label="삭제"
            destructive
            onClick={() =>
              run(() => {
                if (!window.confirm('삭제하시겠습니까?')) return;
                inApps.splice(inApps.indexOf(m), 1);
                emitInApp();
                toast('인앱 메시지가 삭제되었습니다.');
              })
            }
          />
        </div>
      </Floating>
    </span>
  );
}

export default function InAppList() {
  const router = useRouter();
  const mounted = useMounted();
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => subscribeInApp(rerender), []);
  const q = router.query as Record<string, string | undefined>;
  const range = q.gte && q.lte && q.gte <= q.lte ? { from: q.gte, to: q.lte } : { from: ymd(addDays(TODAY, -30)), to: ymd(TODAY) };
  const [input, setInput] = useState(q.sk ?? '');
  const [rangeOpen, setRangeOpen] = useState(false);
  const rangeRef = useRef<HTMLButtonElement>(null);
  const [warn, setWarn] = useState(false);
  const [hl, setHl] = useState<string | null>(null);
  const [copy, setCopy] = useState<InApp | null>(null);
  const replace = (patch: Record<string, string | undefined>) =>
    router.replace({ pathname: router.pathname, query: Object.fromEntries(Object.entries({ ...router.query, ...patch }).filter(([, v]) => v)) }, undefined, { shallow: true });
  useEffect(() => {
    if (!router.isReady) return;
    const t = setTimeout(() => (input.trim() !== (q.sk ?? '') ? replace({ sk: input.trim() || undefined }) : undefined), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);
  if (!mounted || !router.isReady) return null;

  let statuses: S[] = ['active', 'temp'];
  if (q.status) statuses = q.status.split(',').filter((x): x is S => ['temp', 'active', 'paused'].includes(x));
  else
    try {
      const s = localStorage.getItem(KEY);
      if (s) statuses = JSON.parse(s);
    } catch {
      // 저장소를 못 쓰면 기본값
    }
  const toggle = (s: S) => {
    if (statuses.includes(s) && statuses.length === 1) return setWarn(true);
    setWarn(false);
    const next = statuses.includes(s) ? statuses.filter((x) => x !== s) : [...statuses, s];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // 무시
    }
    replace({ status: next.join(',') });
  };
  const k = (q.sk ?? '').toLowerCase();
  const groups = [...new Set(inApps.map((m) => m.group))].map((g) => {
    const all = inApps.filter((m) => m.group === g);
    return { group: g, all, list: all.filter((m) => statuses.includes(m.displayStatus) && (!k || m.title.toLowerCase().includes(k))) };
  });
  const visible = groups.filter((g) => g.list.length);

  return (
    <>
      <Head>
        <div>
          <h1>인앱 메시지</h1>
          <p>템플릿 별 상세한 통계 확인이 가능합니다.</p>
        </div>
        <div style={{ width: 480 }}>
          <TextField icon="search" style={{ height: 40 }} placeholder="캠페인명 검색" maxLength={100} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && replace({ sk: input.trim() || undefined })} />
        </div>
        <Button hierarchy="primary" size="md" iconLeading="add" onClick={() => router.push('/in-app/templates')}>
          새 인앱 메시지
        </Button>
      </Head>
      <Bar>
        상태
        {STATUS.map(([s, l]) => (
          <label key={s} onClick={() => toggle(s)}>
            <Checkbox checked={statuses.includes(s)} />
            {l}
          </label>
        ))}
        {warn && <span style={{ color: 'var(--text-error-primary)', fontWeight: 400 }}>상태 태그는 최소 1개 이상 선택해주세요</span>}
        <i />
        노출 기간
        <RangeBtn ref={rangeRef} type="button" onClick={() => setRangeOpen((v) => !v)}>
          <span>
            <Icon name="calendar_month" size={20} />
          </span>
          {`${range.from} – ${range.to}`}
        </RangeBtn>
        <Floating anchorRef={rangeRef} open={rangeOpen} onClose={() => setRangeOpen(false)} width={808} offset={8} look="calendar">
          <DateRangeMenu range={range} onCancel={() => setRangeOpen(false)} onConfirm={(r) => { setRangeOpen(false); replace({ gte: r.from, lte: r.to }); }} />
        </Floating>
      </Bar>
      <Cols>
        <div>
          <small>노출 그룹</small>
          <Rail>
            {groups.map((g) => (
              <button
                key={g.group}
                type="button"
                disabled={!g.list.length}
                onClick={() => {
                  document.getElementById(`grp-${g.group}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  setHl(g.group);
                  setTimeout(() => setHl(null), 3000);
                }}
              >
                <b>{g.group}</b>
                <small>{`활성화 ${g.all.filter((m) => m.status === 'active').length} · 전체 ${g.all.length}`}</small>
              </button>
            ))}
          </Rail>
        </div>
        <div>
          <small>템플릿</small>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {visible.length === 0 && <EmptyList />}
            {visible.map((g) => (
              <Group key={g.group} id={`grp-${g.group}`} $hl={hl === g.group}>
                <header>
                  <b>{g.group}</b>
                  <small>
                    <Icon name="filter_alt" size={16} />
                    {`${g.list.length}건 필터링 (총 ${g.all.length}건)`}
                  </small>
                </header>
                {g.list.map((m) => {
                  const s = m.stats;
                  const z = m.displayStatus === 'temp';
                  return (
                    <Card key={m.id} role="link" onClick={(e) => (e.metaKey || e.ctrlKey ? window.open(`/in-app/${m.id}?gte=${range.from}&lte=${range.to}`, '_blank') : router.push({ pathname: `/in-app/${m.id}`, query: { gte: range.from, lte: range.to } }))}>
                      <Thumb html={toHtml(m.model)} />
                      <div data-body="">
                        <header>
                          <Chip s={m.displayStatus}>{STATUS.find(([x]) => x === m.displayStatus)![1]}</Chip>
                          <b>{m.title}</b>
                          {m.conditions && (
                            <HoverTip content={<span style={{ whiteSpace: 'pre-line' }}>{m.conditions.map((c) => `${c.key} ${OPS.find(([o]) => o === c.op)?.[1] ?? c.op} ${c.value}`).join('\n')}</span>}>
                              <span style={{ display: 'inline-flex', color: 'var(--fg-quaternary)' }}>
                                <Icon name="filter_alt" size={18} />
                              </span>
                            </HoverTip>
                          )}
                          <CardMenu m={m} onCopy={() => setCopy(m)} />
                        </header>
                        <Stats>
                          <div>
                            우선순위<b>{PRIORITY[m.priority]}</b>
                            생성 시간<b>{m.createdAt}</b>
                            <span style={m.isExpired ? { color: 'var(--text-error-primary)' } : undefined}>{m.isExpired ? '기간 만료' : '노출 기간'}</span>
                            <b>{m.start ? `${m.start.slice(0, 10)} ~ ${m.end?.slice(0, 10)}` : '항상'}</b>
                          </div>
                          <div>
                            노출<b>{z ? 0 : <Num n={s.displayed} />}</b>
                            클릭
                            <b>
                              {z ? 0 : <Num n={s.clicked} />}
                              <em>{pct(z ? 0 : s.clicked, s.displayed)}</em>
                            </b>
                            클릭 유저
                            <b>
                              {z ? 0 : <Num n={s.clickedUsers} />}
                              <em>{pct(z ? 0 : s.clickedUsers, s.displayed)}</em>
                            </b>
                          </div>
                          <div>
                            구매 총액<b>{`₩${(z ? 0 : s.amount).toLocaleString('ko-KR')}`}</b>
                            전환
                            <b>
                              {z ? 0 : <Num n={s.converted} />}
                              <em>{pct(z ? 0 : s.converted, s.clicked)}</em>
                            </b>
                            전환 유저
                            <b>
                              {z ? 0 : <Num n={s.convertedUsers} />}
                              <em>{pct(z ? 0 : s.convertedUsers, s.clicked)}</em>
                            </b>
                          </div>
                        </Stats>
                      </div>
                    </Card>
                  );
                })}
              </Group>
            ))}
          </div>
        </div>
      </Cols>
      {copy && (
        <ConfirmModal
          title="정말 복제하시겠습니까?"
          description="이 인앱 메시지로 1개의 복제본을 생성합니다."
          cancelLabel="취소"
          confirmLabel="확인"
          onClose={() => setCopy(null)}
          onConfirm={() => {
            const id = `iam-${Date.now().toString(36)}`;
            inApps.push({ ...JSON.parse(JSON.stringify(copy)), id, title: `${copy.title}`, status: 'paused', displayStatus: 'paused', createdAt: '2026.10.08' });
            emitInApp();
            setCopy(null);
            router.push(`/in-app/${id}/edit`);
          }}
        />
      )}
    </>
  );
}
