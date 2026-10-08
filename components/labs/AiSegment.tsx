import { Fragment, useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import { Card } from '@/components/channel/ChannelShell';
import { EmptyList } from '@/components/sent/SentList';
import { ReasonField } from '@/components/sent/Reason';
import { Radios } from '@/components/newmsg/parts';
import { segments } from '@/lib/audience';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';

// AI 세그먼트 — docs/staging-behavior-labs.md 3장. 페이지 제목 없음, 요청 카드 + 「요청 내역」 카드.
// 프로토타입: 「만들기」 → 생성중 행 추가 → 3초 폴링 흉내 후 생성됨/실패로 바뀜. 결과 활용은 CSV 다운로드뿐(세그먼트 저장 없음).
type Status = 'GENERATING' | 'GENERATED' | 'FAILED';
type Step = { kind: 'EXPLORE' | 'QUERY'; text: string };
type Req = { id: string; title: string; summary: string | null; status: Status; userCount: number | null; createdAt: string; prompt: string; source: { type: 'SEGMENT' | 'CSV' | 'ALL_USERS'; name: string; userCount: number | null }; steps: Step[]; direction: 'EXPAND' | 'CREATE' | 'NARROW' | null; targetUserCount: number | null; addedUserCount: number; resultDescription: string; failureReason?: string };

const STEPS: Step[] = [
  { kind: 'EXPLORE', text: '시작 대상의 최근 30일 행동을 살펴봤습니다.' },
  { kind: 'QUERY', text: '`purchase_completed` 이벤트가 2회 이상인 유저를 찾았습니다.' },
  { kind: 'QUERY', text: '`tags.grade` 가 `GOLD` 이상인 유저와 겹치는 부분을 확인했습니다.' },
];
const reqs: Req[] = [
  { id: 'ais-3', title: '가을 아우터 할인 문자 대상', summary: '구매 가능성 높은 유저 위주로 6천명 목표', status: 'GENERATED', userCount: 5980, createdAt: '2026.10.07 15:20:11', prompt: '가을 아우터 할인 문자, 6천명, 구매 가능성 높은 사람 위주로', source: { type: 'SEGMENT', name: '구독 유저', userCount: 4210 }, steps: STEPS, direction: 'EXPAND', targetUserCount: 6000, addedUserCount: 1770, resultDescription: '최근 30일 상품 조회 · 장바구니 담기 이력이 있는 유저를 더했습니다.' },
  { id: 'ais-2', title: 'VIP 재구매 유도', summary: null, status: 'GENERATED', userCount: 312, createdAt: '2026.10.02 10:05:40', prompt: 'VIP 중 최근 60일 구매 없는 사람만', source: { type: 'SEGMENT', name: 'VIP 유저', userCount: 520 }, steps: STEPS.slice(0, 2), direction: 'NARROW', targetUserCount: null, addedUserCount: 0, resultDescription: '최근 60일 구매 이력이 있는 유저 208명을 뺐습니다.' },
  { id: 'ais-1', title: '휴면 예정 유저', summary: '앱 미접속 25~29일', status: 'FAILED', userCount: null, createdAt: '2026.09.28 18:44:02', prompt: '곧 휴면 전환될 유저', source: { type: 'CSV', name: 'dormant.csv', userCount: 1200 }, steps: STEPS.slice(0, 1), direction: 'CREATE', targetUserCount: null, addedUserCount: 0, resultDescription: '', failureReason: '' },
];
const SUGGEST = [
  { channel: 'SMS', label: '할인 문자 대상', description: '구매 가능성 높은 유저 위주로', prompt: '가을 아우터 할인 문자, 6천명, 구매 가능성 높은 사람 위주로' },
  { channel: 'PUSH', label: '재방문 유도 푸시', description: '최근 7일 미접속 유저', prompt: '최근 7일 동안 앱에 들어오지 않은 유저 중 지난달 구매한 사람' },
  { channel: 'KAKAO_ALIMTALK', label: '장바구니 리마인드', description: '담아 두고 결제 안 한 유저', prompt: '장바구니에 상품을 담고 3일 안에 결제하지 않은 유저' },
];
const CH_ICON: Record<string, string> = { PUSH: 'notifications', SMS: 'sms', KAKAO_ALIMTALK: 'chat_bubble', KAKAO_BRAND_MESSAGE: 'chat_bubble', EMAIL: 'mail', IN_APP: 'web_asset' };

const Desc = styled.p`
  margin: 0;
  ${text('text-sm', 'regular')};
  color: ${color('text-tertiary')};
  > a { color: ${color('text-brand-secondary')}; font-weight: 600; }
`;
const Prompt = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.lg}px;
  &:focus-within { border-color: ${color('border-brand')}; }
  > textarea { width: 100%; min-height: 72px; border: 0; outline: none; resize: vertical; font: inherit; ${text('text-sm', 'regular')}; color: ${color('text-primary')}; }
`;
const Sug = styled.button`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.md}px;
  background: ${color('bg-secondary')};
  text-align: left;
  cursor: pointer;
  > b { display: flex; align-items: center; gap: 6px; ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  > span { ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  &:hover { border-color: ${color('border-brand')}; }
`;
const Make = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 18px;
  border: 0;
  border-radius: ${radius.md}px;
  background: linear-gradient(90deg, #2f54eb, #38bdf8, #2f54eb);
  background-size: 200% 100%;
  animation: flow 30s linear infinite;
  ${text('text-md', 'semibold')};
  color: #fff;
  cursor: pointer;
  @keyframes flow { from { background-position: 0 0; } to { background-position: 200% 0; } }
  &:disabled { filter: grayscale(1); opacity: 0.5; cursor: not-allowed; }
`;
const Table = styled.div`
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.lg}px;
  overflow: hidden;
  > div[data-row] { display: grid; grid-template-columns: 34px minmax(0, 1fr) 120px 130px 190px 80px; align-items: center; min-height: 63px; padding: 0 12px 0 8px; border-top: 1px solid ${color('border-secondary')}; ${text('text-sm', 'medium')}; color: ${color('text-primary')}; }
  > div[data-head] { min-height: 39px; border-top: 0; background: ${color('bg-secondary')}; ${text('text-xs', 'semibold')}; color: ${color('text-quaternary')}; }
  > div[data-click] { cursor: pointer; }
  > div[data-click]:hover { background: ${color('bg-primary_hover')}; }
`;
const Skel = styled.i`
  display: block;
  width: 160px;
  height: 10px;
  margin-top: 6px;
  border-radius: 5px;
  background: ${color('bg-tertiary')};
  animation: pulse 1.2s ease-in-out infinite;
  @keyframes pulse { 50% { opacity: 0.4; } }
`;
const Detail = styled.div`
  padding: 16px 24px 20px 50px;
  border-top: 1px solid ${color('border-secondary')};
  background: ${color('bg-secondary')};
  > ol { max-width: 760px; margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 16px; }
  > ol > li { position: relative; padding-left: 20px; }
  > ol > li::before { content: ''; position: absolute; left: 0; top: 6px; width: 8px; height: 8px; border-radius: 50%; background: ${color('fg-brand-secondary')}; }
  small { ${text('text-xs', 'semibold')}; color: ${color('text-tertiary')}; }
  p { margin: 4px 0 0; ${text('text-md', 'regular')}; color: ${color('text-primary')}; }
  code { padding: 1px 4px; border-radius: 4px; background: ${color('bg-tertiary')}; font-size: 12px; }
`;
const StepLine = styled.div<{ $i: number }>`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  ${text('text-sm', 'regular')};
  color: ${color('text-secondary')};
  opacity: 0;
  animation: in 0.2s ease forwards;
  animation-delay: ${(p) => p.$i * 90}ms;
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  @keyframes in { to { opacity: 1; } }
`;

const code = (s: string) => s.split(/(`[^`]+`)/).map((x, i) => (x.startsWith('`') ? <code key={i}>{x.slice(1, -1)}</code> : <Fragment key={i}>{x}</Fragment>));
const fmt = (n: number) => n.toLocaleString('ko-KR');
const sourceText = (s: Req['source']) => (s.type === 'ALL_USERS' ? (s.userCount ? `전체 유저 ${fmt(s.userCount)}명` : '전체 유저') : `${s.type === 'SEGMENT' ? '세그먼트' : 'CSV'} ${s.name}${s.userCount ? ` ${fmt(s.userCount)}명` : ''}`);
function outcome(r: Req) {
  if (r.direction === 'CREATE') return '시작 대상에서 조건에 맞는 유저를 골랐습니다.';
  if (r.direction === 'EXPAND') return r.addedUserCount ? `시작 대상에 ${fmt(r.addedUserCount)}명을 새로 더했습니다.` : '시작 대상 밖에서 조건에 맞는 유저를 찾지 못해 시작 대상 그대로입니다.';
  const removed = (r.source.userCount ?? 0) - (r.userCount ?? 0);
  return removed > 0 ? `시작 대상에서 ${fmt(removed)}명을 뺐습니다.` : '시작 대상이 모두 조건에 맞아 뺀 유저가 없습니다.';
}

export default function AiSegment() {
  const [src, setSrc] = useState<'SEGMENT' | 'CSV'>('SEGMENT');
  const [seg, setSeg] = useState<string | null>(null);
  const [csv, setCsv] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string[]>([]);
  const [dl, setDl] = useState<Req | null>(null);
  const [, force] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const opts = segments.filter((s) => s.targetType === 'User').sort((a, b) => (a.type === 'DEFAULT' ? -1 : b.type === 'DEFAULT' ? 1 : a.name < b.name ? -1 : 1));
  const cur = segments.find((s) => s.id === seg);
  const can = (src === 'SEGMENT' ? !!seg : !!csv) && !!prompt.trim() && !busy;
  const generating = reqs.some((r) => r.status === 'GENERATING');
  useEffect(() => {
    if (!generating) return;
    const t = setInterval(() => {
      for (const r of reqs)
        if (r.status === 'GENERATING' && Date.now() - Number(r.id.split('-')[1]) > 6000) {
          Object.assign(r, { status: 'GENERATED', userCount: Math.round((r.source.userCount ?? 1000) * 1.3), addedUserCount: Math.round((r.source.userCount ?? 1000) * 0.3), steps: STEPS, summary: '조건에 맞는 유저를 더해 대상을 넓혔습니다', resultDescription: '최근 30일 상품 조회 이력이 있는 유저를 더했습니다.' });
        }
      force((n) => n + 1);
    }, 3000);
    return () => clearInterval(t);
  }, [generating]);
  const make = () => {
    if (!can) return;
    setBusy(true);
    setTimeout(() => {
      reqs.unshift({ id: `ais-${Date.now()}`, title: prompt.trim().slice(0, 30), summary: null, status: 'GENERATING', userCount: null, createdAt: '2026.10.08 23:00:00', prompt: prompt.trim(), source: src === 'SEGMENT' ? { type: 'SEGMENT', name: cur!.name, userCount: cur!.count ?? null } : { type: 'CSV', name: csv!, userCount: 3 }, steps: [], direction: 'EXPAND', targetUserCount: null, addedUserCount: 0, resultDescription: '' });
      setPrompt('');
      setSrc('SEGMENT');
      setSeg(null);
      setCsv(null);
      setPage(1);
      setBusy(false);
    }, 600);
  };
  const rows = reqs.slice((page - 1) * 10, page * 10);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <Card>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>AI 세그먼트</h3>
        <Desc>
          원하는 세그먼트를 만들거나 모수를 확장 또는 최적화할 수 있습니다.{' '}
          <a href="https://flarelane.com/ko/docs/ai-segment/" target="_blank" rel="noreferrer">
            문서보기
          </a>
        </Desc>
        <Radios<'SEGMENT' | 'CSV'>
          value={src}
          options={[
            { value: 'SEGMENT', label: '세그먼트' },
            { value: 'CSV', label: 'CSV 업로드' },
          ]}
          onChange={setSrc}
        />
        {src === 'SEGMENT' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 320 }}>
              <Select<string> value={seg} placeholder="세그먼트 선택" options={opts.map((s) => ({ value: s.id, label: s.type === 'DEFAULT' ? `${s.name} · 기본` : s.name }))} onChange={setSeg} />
            </div>
            {cur && <b style={{ fontSize: 14, color: 'var(--text-brand-secondary)' }}>{`${fmt(cur.count ?? 0)}명`}</b>}
          </div>
        ) : csv ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', border: '1px solid var(--border-secondary)', borderRadius: 10, maxWidth: 480 }}>
            <Icon name="description" size={24} />
            <b style={{ flex: 1, fontSize: 14 }}>{csv}</b>
            <Button hierarchy="destructive-tertiary" onClick={() => (window.alert('파일을 삭제하시겠습니까?'), setCsv(null))}>
              삭제
            </Button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '28px 16px', border: '1px dashed var(--border-primary)', borderRadius: 12, background: 'var(--bg-primary)', fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <Icon name="upload" size={24} />
            이곳을 클릭하거나, 파일을 드래그해서 업로드 해주세요.
            <small style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>지원 형식: XLSX, CSV / 최대 첨부 가능 용량 50 MB</small>
          </button>
        )}
        <input ref={fileRef} type="file" accept=".csv,.xlsx" hidden onChange={(e) => (e.target.files?.[0] && setCsv(e.target.files[0].name), (e.target.value = ''))} />
        <Prompt>
          <textarea aria-label="프롬프트" rows={3} maxLength={2000} value={prompt} placeholder="어떻게 만들까요? 예) 가을 아우터 할인 문자, 6천명, 구매 가능성 높은 사람 위주로" onChange={(e) => setPrompt(e.target.value)} />
          {!prompt && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SUGGEST.length}, minmax(0,1fr))`, gap: 8 }}>
              {SUGGEST.map((s) => (
                <Sug key={s.label} type="button" title={s.prompt} onClick={() => setPrompt(s.prompt)}>
                  <b>
                    <Icon name={CH_ICON[s.channel]} size={16} />
                    {s.label}
                  </b>
                  <span>{s.description}</span>
                </Sug>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Make type="button" disabled={!can} onClick={make}>
              <Icon name="auto_fix_high" size={20} />
              만들기
            </Make>
          </div>
        </Prompt>
      </Card>
      <Card>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>요청 내역</h3>
        {reqs.length === 0 ? (
          <EmptyList />
        ) : (
          <Table>
            <div data-row="" data-head="">
              <span />
              <span>타이틀</span>
              <span>상태</span>
              <span>유저 수</span>
              <span>생성 시간</span>
              <span />
            </div>
            {rows.map((r) => {
              const on = open.includes(r.id);
              const gen = r.status === 'GENERATING';
              return (
                <Fragment key={r.id}>
                  <div data-row="" data-click={gen ? undefined : ''} onClick={() => !gen && setOpen(on ? open.filter((x) => x !== r.id) : [...open, r.id])}>
                    <span style={{ display: 'inline-flex', color: 'var(--fg-quaternary)', transform: on ? 'rotate(90deg)' : undefined }}>
                      <Icon name="chevron_right" size={20} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <b style={{ display: 'block', fontWeight: 600 }}>{r.title}</b>
                      {gen && <Skel />}
                      {r.summary && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{r.summary}</span>}
                    </div>
                    <span>{gen ? <Badge color="purple">생성중</Badge> : r.status === 'GENERATED' ? <Badge color="success">생성됨</Badge> : <Badge color="error">실패</Badge>}</span>
                    <span style={r.userCount === null ? { color: 'var(--text-quaternary)' } : undefined}>{r.userCount === null ? '—' : fmt(r.userCount)}</span>
                    <span>{r.createdAt}</span>
                    <span style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                      {gen ? <Icon name="progress_activity" size={20} /> : r.status === 'GENERATED' ? <IconButton icon="download" size="xs" hierarchy="secondary" label="다운로드" onClick={() => setDl(r)} /> : null}
                      <IconButton
                        icon="delete"
                        size="xs"
                        label="삭제"
                        onClick={() => {
                          if (!window.confirm('이 요청을 삭제하시겠습니까? 뽑아 둔 대상도 함께 사라집니다.')) return;
                          reqs.splice(reqs.indexOf(r), 1);
                          if (page > 1 && (page - 1) * 10 >= reqs.length) setPage(page - 1);
                          force((n) => n + 1);
                        }}
                      />
                    </span>
                  </div>
                  {on && (
                    <Detail>
                      <ol>
                        <li>
                          <small>{sourceText(r.source)}</small>
                          <p style={{ fontSize: 15 }}>{r.prompt}</p>
                        </li>
                        <li>
                          {r.steps.map((s, i) => (
                            <StepLine key={i} $i={i}>
                              <span>
                                <Icon name={s.kind === 'EXPLORE' ? 'auto_awesome' : 'search'} size={16} />
                              </span>
                              <em style={{ fontStyle: 'normal' }}>{code(s.text)}</em>
                            </StepLine>
                          ))}
                          {r.status === 'GENERATED' && (
                            <StepLine $i={r.steps.length}>
                              <span>
                                <Icon name="check" size={16} />
                              </span>
                              {outcome(r)}
                            </StepLine>
                          )}
                        </li>
                        <li>
                          {r.status === 'FAILED' ? (
                            <p style={{ color: 'var(--text-error-primary)' }}>{r.failureReason || '기준을 세우지 못해 멈췄습니다.'}</p>
                          ) : r.userCount === null ? (
                            <p>아직 뽑는 중입니다.</p>
                          ) : (
                            <>
                              <p>
                                <b>{`${fmt(r.userCount)}명`}</b> {r.resultDescription}
                              </p>
                              {r.targetUserCount && <small>{`목표 ${fmt(r.targetUserCount)}명`}</small>}
                            </>
                          )}
                        </li>
                      </ol>
                    </Detail>
                  )}
                </Fragment>
              );
            })}
          </Table>
        )}
        {reqs.length > 0 && <Pagination page={page} pages={Math.min(100, Math.ceil(reqs.length / 10))} onChange={setPage} />}
      </Card>
      {dl && <ReasonField onClose={() => setDl(null)} onDownload={() => setDl(null)} />}
    </div>
  );
}
