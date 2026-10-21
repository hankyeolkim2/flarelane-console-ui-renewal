import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { DateRangeMenu } from '@/components/ui/DatePicker';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Floating from '@/components/ui/Floating';
import Pagination from '@/components/ui/Pagination';
import Radio from '@/components/ui/Radio';
import TextField from '@/components/ui/TextField';
import { EmptyList, ListCard, PageTitle, SentRow } from '@/components/sent/SentList';
import { ReasonField } from '@/components/sent/Reason';
import { rowOf } from '@/components/sent/rows';
import { addDays, TODAY, ymd } from '@/lib/editor';
import { useStore } from '@/lib/store';
import { fmt, MAX_PAGES, pct, PER, PLATFORMS, pushMessages, SOURCES, sourceLabel, won, type PushMessage, type Source } from '@/lib/sent';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma 「푸시 보낸 메시지 — 목록 한 프레임안」(999:13857) + docs/staging-behavior-sent-history.md 2장.
// 쿼리 p · s(all 포함, 기본 console) · f(web,mobile) · gte · lte(기본 최근 30일) · sk. 검색하면 기간을 최근 30일로 되돌림.
type Src = 'all' | Source;
const SRC_OPTIONS: { value: Src; label: string }[] = [{ value: 'all', label: '전체' }, ...SOURCES];
const DEFAULT_RANGE = () => ({ gte: ymd(addDays(TODAY, -30)), lte: ymd(TODAY) });

const FilterCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px;
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  box-shadow: ${shadow.xs};
  > hr { width: 100%; margin: 0; border: 0; border-top: 1px solid ${color('border-secondary')}; }
`;

const FRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  > b { width: 72px; flex-shrink: 0; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
  > div { display: flex; align-items: center; gap: 24px; }
`;

const Opt = styled.label<{ $disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  user-select: none;
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
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  &:hover { background: ${color('bg-primary_hover')}; }
`;

const Info = styled.dl`
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  row-gap: 8px;
  margin: 0;
  > dt { ${text('text-sm', 'medium')}; color: ${color('text-tertiary')}; }
  > dd { margin: 0; ${text('text-sm', 'medium')}; color: ${color('text-primary')}; }
`;

export default function PushSentHistory() {
  const router = useRouter();
  const { toast } = useStore();
  const q = router.query as Record<string, string | undefined>;
  const page = Number(q.p);
  const src = SRC_OPTIONS.find((x) => x.value === q.s)?.value;
  const f = (q.f ?? 'web,mobile').split(',').filter((x) => x === 'web' || x === 'mobile');
  const range = { gte: q.gte ?? DEFAULT_RANGE().gte, lte: q.lte ?? DEFAULT_RANGE().lte };
  const keyword = q.sk ?? '';
  const [input, setInput] = useState(keyword);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const rangeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => setInput(keyword), [keyword]);

  const invalid = router.isReady && (!src || !Number.isInteger(page) || page < 1 || page > MAX_PAGES);
  useEffect(() => {
    if (invalid) router.replace({ pathname: router.pathname, query: { s: 'console', p: 1, f: f.join(',') } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalid]);
  if (!router.isReady || invalid) return null;

  const push = (patch: Record<string, string | number | undefined>) => {
    const next = { p: 1, s: src, f: f.join(','), gte: range.gte, lte: range.lte, sk: keyword || undefined, ...patch };
    router.push({ pathname: router.pathname, query: Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined && v !== '')) });
  };
  const search = () => {
    const t = input.trim();
    if (t === keyword) return;
    push({ ...DEFAULT_RANGE(), sk: t || undefined });
  };
  const togglePlatform = (k: 'web' | 'mobile') => {
    if (f.includes(k) && f.length === 1) return window.alert('최소 하나 이상 선택해주세요.');
    push({ f: (f.includes(k) ? f.filter((x) => x !== k) : [...f, k]).sort().reverse().join(',') });
  };

  const k = keyword.trim().toLowerCase();
  const list = pushMessages.filter((m) => {
    if (src !== 'all' && m.source !== src) return false;
    const day = m.createdAt.slice(0, 10).replace(/\./g, '-');
    if (day < range.gte || day > range.lte) return false;
    const web = m.targetPlatforms.some((p) => p === 'webDesktop' || p === 'webMobile');
    const app = m.targetPlatforms.some((p) => p === 'android' || p === 'ios');
    if (f.length === 1 && !((f[0] === 'web' && web) || (f[0] === 'mobile' && app))) return false;
    return !k || [m.id, m.campaignName, m.title, m.body].some((x) => x?.toLowerCase().includes(k));
  });
  const pages = Math.ceil(Math.min(list.length, MAX_PAGES * PER) / PER);
  const rows = list.slice((page - 1) * PER, page * PER);

  return (
    <>
      <PageTitle>
        <h1>보낸 메시지</h1>
        <i />
        <Button hierarchy="tertiary" size="md" iconLeading="download" onClick={() => setCsvOpen(true)}>
          CSV로 내보내기
        </Button>
      </PageTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FilterCard>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 480 }}>
              <TextField icon="search" style={{ height: 40 }} placeholder="캠페인명, 제목, 내용, ID 검색" maxLength={100} value={input} onChange={(e) => setInput(e.target.value)} onKeyUp={(e) => e.key === 'Enter' && search()} />
            </div>
            <Button hierarchy="primary" size="md" onClick={search}>
              검색
            </Button>
          </div>
          <hr />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FRow>
              <b>기간</b>
              <div>
                <RangeBtn ref={rangeRef} type="button" aria-haspopup="dialog" aria-expanded={rangeOpen} onClick={() => setRangeOpen((v) => !v)}>
                  <span>
                    <Icon name="calendar_month" size={20} />
                  </span>
                  {`${range.gte} – ${range.lte}`}
                </RangeBtn>
                <Floating anchorRef={rangeRef} open={rangeOpen} onClose={() => setRangeOpen(false)} width={808} offset={8} look="calendar" placement="bottom-start">
                  <DateRangeMenu
                    range={{ from: range.gte, to: range.lte }}
                    onCancel={() => setRangeOpen(false)}
                    onConfirm={(r) => {
                      setRangeOpen(false);
                      push({ gte: r.from, lte: r.to });
                    }}
                  />
                </Floating>
              </div>
            </FRow>
            <FRow>
              <b>플랫폼</b>
              <div>
                {(['web', 'mobile'] as const).map((p) => (
                  <Opt key={p} onClick={() => togglePlatform(p)}>
                    <Checkbox checked={f.includes(p)} />
                    {p === 'web' ? '웹 (전체)' : '앱 (전체)'}
                  </Opt>
                ))}
              </div>
            </FRow>
            <FRow>
              <b>발송 환경</b>
              <div>
                {SRC_OPTIONS.map((o) => (
                  <Opt key={o.value} onClick={() => o.value !== src && push({ s: o.value })}>
                    <Radio checked={o.value === src} />
                    {o.label}
                  </Opt>
                ))}
              </div>
            </FRow>
          </div>
        </FilterCard>
        <ListCard>
          {rows.length === 0 ? (
            <EmptyList />
          ) : (
            rows.map((m) => <SentRow key={m.id} source={m.source} href={`/push/sent-history/${m.id}`} copyHref={`/push/new-message?copyMessageId=${m.id}`} {...rowOf.push(m, { label: '발송 시간', value: m.createdAt })} />)
          )}
          {/* 스테이징: 0건이면 페이지네이션 숨김 */}
          {rows.length > 0 && <Pagination page={page} pages={pages} onChange={(n) => push({ p: n })} />}
        </ListCard>
      </div>

      {csvOpen && (
        <ReasonField
          title="CSV 다운로드"
          info={
            <Info>
              <dt>기간</dt>
              <dd>{`${range.gte} ~ ${range.lte}`}</dd>
              <dt>데이터</dt>
              <dd>{`보낸 메시지(${src === 'all' ? '전체' : sourceLabel(src as Source)})`}</dd>
            </Info>
          }
          onClose={() => setCsvOpen(false)}
          onDownload={() => {
            setCsvOpen(false);
            toast('파일 다운로드에 성공했습니다.');
          }}
        />
      )}
    </>
  );
}

