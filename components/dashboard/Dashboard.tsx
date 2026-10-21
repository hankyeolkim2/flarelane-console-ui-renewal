import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { DateRangeMenu } from '@/components/ui/DatePicker';
import Button from '@/components/ui/Button';
import Floating from '@/components/ui/Floating';
import { Help } from '@/components/channel/ChannelShell';
import { BarChart, LineChart } from './Charts';
import { ReasonField } from '@/components/sent/Reason';
import { PageTitle } from '@/components/sent/SentList';
import { addDays, parseYmd, TODAY, ymd } from '@/lib/editor';
import { useStore } from '@/lib/store';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 기기 및 발송 현황 — Figma 「대시보드 — 1440 (기준)」(285:10279) + docs/staging-behavior-dashboard-settings.md 1장.
// 기본 기간 = 30일 전 ~ 어제(오늘 제외). 기간을 바꾸면 기기 수 카드를 뺀 카드가 다시 불러옴. Figma 에 없는 시간대별 클릭률 · 순위 카드는 같은 카드 틀로.
// 카드 머리는 다른 개편 화면처럼 세로 막대 없이 Text md SemiBold.
const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 23px;
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  box-shadow: ${shadow.xs};
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  > h2 { margin: 0; ${text('text-md', 'semibold')}; color: ${color('text-primary')}; }
  > i { flex: 1; }
  > span[data-leg] { display: inline-flex; align-items: center; gap: 6px; margin-right: 8px; ${text('text-xs', 'medium')}; color: ${color('text-secondary')}; }
  > span[data-leg] > i { width: 8px; height: 8px; border-radius: 50%; }
`;

const Two = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
`;

const Tiles = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-radius: ${radius.xl}px;
  background: ${color('bg-secondary')};
  > div { display: flex; align-items: center; gap: 12px; height: 100px; padding: 0 20px; }
  > div + div { border-left: 1px solid ${color('border-secondary')}; }
  > div > span { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: ${color('bg-brand-primary')}; color: ${color('fg-brand-secondary')}; }
  > div > p { margin: 0; display: flex; flex-direction: column; }
  > div > p > b { ${text('display-xs', 'semibold')}; color: ${color('text-primary')}; font-variant-numeric: tabular-nums; }
  > div > p > small { ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
`;

const Label = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
`;

const RangeBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 13px;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.md}px;
  background: ${color('bg-primary')};
  box-shadow: ${shadow.xs};
  ${text('text-md', 'medium')};
  color: ${color('text-primary')};
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  &:hover { background: ${color('bg-primary_hover')}; }
`;

const Rank = styled.table`
  width: 100%;
  border-collapse: collapse;
  th { padding: 10px 12px; border-bottom: 1px solid ${color('border-secondary')}; ${text('text-xs', 'semibold')}; color: ${color('text-quaternary')}; text-align: left; }
  td { padding: 12px; border-bottom: 1px solid ${color('border-secondary')}; ${text('text-sm', 'medium')}; color: ${color('text-primary')}; vertical-align: top; }
  tr:last-of-type td { border-bottom: 0; }
  td small { display: block; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
`;

const Medal = styled.span<{ n: number }>`
  display: inline-flex;
  margin-left: 8px;
  padding: 0 6px;
  border-radius: 9999px;
  ${text('text-xs', 'semibold')};
  background: ${(p) => (p.n === 1 ? '#FEC947' : p.n === 2 ? 'rgba(29,66,137,0.8)' : p.n === 3 ? 'rgba(29,66,137,0.5)' : color('bg-tertiary'))};
  color: ${(p) => (p.n <= 3 ? '#fff' : color('text-quaternary'))};
`;

const Shortcut = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 20px 23px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  background: ${color('bg-primary')};
  box-shadow: ${shadow.xs};
  ${text('text-md', 'semibold')};
  color: ${color('text-primary')};
  cursor: pointer;
  > i { flex: 1; }
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  &:hover { background: ${color('bg-primary_hover')}; }
`;

const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const seed = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const wave = (d: Date, k: number, amp: number) => {
  const h = seed(`${ymd(d)}-${k}`);
  return Math.round(amp * (0.15 + (h % 100) / 100) * (d.getDay() === 2 || d.getDay() === 4 ? 1.8 : 1));
};

const MESSAGES = [
  ['#11 이미지 푸시', '가을 신상품이 도착했어요', 0.214, 1203],
  ['장바구니 리마인드', '{{ name }}님, 장바구니에 담아 둔 상품이 할인 중이에요.', 0.183, 842],
  ['주간 베스트', '이번 주 가장 많이 본 상품을 확인하세요', 0.142, 510],
  ['쿠폰 만료 안내', '내일 만료되는 쿠폰이 있어요', 0.121, 388],
  ['신규 회원 혜택', '첫 구매 15% 할인 쿠폰이 발급되었어요', 0.097, 201],
  ['재입고 알림', '찜한 상품이 다시 입고되었어요', 0.081, 96],
] as const;

export function RankCard({ title, api, full = false }: { title: string; api: boolean; full?: boolean }) {
  const router = useRouter();
  // 대시보드 = 서버 기본 개수, 전체 보기 = per 20 — 더미는 있는 만큼
  const rows = (api ? MESSAGES.slice(2) : MESSAGES).slice(0, full ? 20 : 5);
  return (
    <Card>
      <Head>
        <h2>{title}</h2>
        <Help>
          선택한 기간 동안 모든 메시지들을 메시지 문구 기준으로 분석한 클릭률 순위입니다.
          <br />
          발송 총합이 5 이하이거나 클릭 총합이 0인 경우 표시되지 않습니다.
        </Help>
        <i />
        {!full && <Button onClick={() => router.push(api ? '/dashboard/message-rank/api' : '/dashboard/message-rank')}>더 보기</Button>}
      </Head>
      <Rank>
        <thead>
          <tr>
            <th style={{ width: 96 }}>클릭률</th>
            <th>메시지</th>
            <th style={{ width: 120, textAlign: 'right' }}>클릭합계</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([t, b, avg, total], i) => (
            <tr key={t}>
              <td>{`${(avg * 100).toFixed(2)}%`}</td>
              <td>
                {t}
                <small>{b}</small>
              </td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                {total.toLocaleString('ko-KR')}
                {i < 5 && <Medal n={i + 1}>{`${i + 1}위`}</Medal>}
              </td>
            </tr>
          ))}
        </tbody>
      </Rank>
    </Card>
  );
}

function DeviceCard({ title, a, b }: { title: string; a: [string, string, number, number]; b: [string, string, number, number] }) {
  const tile = (x: [string, string, number, number], k: 2 | 3) => (
    <div>
      <span>
        <Icon name={x[1]} size={20} />
      </span>
      <p>
        <b>{x[k].toLocaleString('ko-KR')}</b>
        <small>{x[0]}</small>
      </p>
    </div>
  );
  return (
    <Card>
      <Head>
        <h2>{title}</h2>
      </Head>
      <Label>
        전체 기기 수 <Help>현재까지 누적된 전체 생성 기기 수 입니다.</Help>
      </Label>
      <Tiles style={{ marginTop: -10 }}>
        {tile(a, 2)}
        {tile(b, 2)}
      </Tiles>
      <Label>
        알림 구독 기기 수 <Help>전체 기기 중 현재 푸시 알림을 받을 수 있는 기기 수 입니다.</Help>
      </Label>
      <Tiles style={{ marginTop: -10 }}>
        {tile(a, 3)}
        {tile(b, 3)}
      </Tiles>
    </Card>
  );
}

export function DashboardHeader({ range, onRange }: { range: { from: string; to: string }; onRange: (r: { from: string; to: string }) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <PageTitle>
      <h1>기기 및 발송 현황</h1>
      <i />
      <RangeBtn ref={ref} type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span>
          <Icon name="calendar_month" size={20} />
        </span>
        {`${range.from} – ${range.to}`}
      </RangeBtn>
      <Floating anchorRef={ref} open={open} onClose={() => setOpen(false)} width={808} offset={8} look="calendar">
        <DateRangeMenu
          range={range}
          onCancel={() => setOpen(false)}
          onConfirm={(r) => {
            setOpen(false);
            onRange(r);
          }}
        />
      </Floating>
    </PageTitle>
  );
}

export const defaultRange = () => ({ from: ymd(addDays(TODAY, -30)), to: ymd(addDays(TODAY, -1)) });

export default function Dashboard() {
  const router = useRouter();
  const { toast } = useStore();
  const [range, setRange] = useState(defaultRange);
  const [csv, setCsv] = useState<string | null>(null);
  const dates = useMemo(() => {
    const out: Date[] = [];
    for (let d = parseYmd(range.from); d <= parseYmd(range.to); d = addDays(d, 1)) out.push(d);
    return out;
  }, [range]);
  const labels = dates.map((d) => `${ymd(d)} (${DOW[d.getDay()]})`);
  const fresh = dates.map((d) => wave(d, 1, 12));
  const sent = dates.map((d) => wave(d, 2, 24));
  const clicked = sent.map((s, i) => Math.round(s * (0.05 + (seed(labels[i]) % 30) / 100)));
  const hours = Array.from({ length: 24 }, (_, h) => (h >= 8 && h <= 22 ? 0.02 + ((seed(`${range.from}${h}`) % 90) / 1000) * (h === 12 || h === 20 ? 2 : 1) : 0.005 + (h % 3) / 1000));
  const webFirst = 392 + 25 > 0;
  const web = <DeviceCard key="w" title="웹 푸시" a={['데스크탑', 'desktop_windows', 392, 32]} b={['모바일', 'smartphone', 25, 10]} />;
  const app = <DeviceCard key="a" title="앱 푸시" a={['안드로이드', 'android', 281, 5]} b={['iOS', 'smartphone', 518, 506]} />;
  const exportBtn = (name: string): ReactNode => (
    <Button hierarchy="tertiary" iconLeading="download" onClick={() => setCsv(name)}>
      CSV로 내보내기
    </Button>
  );
  return (
    <>
      <DashboardHeader range={range} onRange={setRange} />
      <Two>{webFirst ? [web, app] : [app, web]}</Two>
      <Card>
        <Head>
          <h2>신규 등록 기기</h2>
          <Help>선택한 기간 동안 신규 생성 기기 추이입니다.</Help>
          <i />
          <span data-leg="">
            <i style={{ background: 'var(--chart-clicked)' }} />새 기기
          </span>
          {exportBtn('신규 등록 기기')}
        </Head>
        <LineChart labels={labels} series={[{ key: 'new', values: fresh, color: 'var(--chart-clicked)', area: true }]} tip={(i) => <span style={{ fontWeight: 600 }}>{fresh[i].toLocaleString('ko-KR')}</span>} />
      </Card>
      <Two>
        <Card>
          <Head>
            <h2>발송 &amp; 클릭</h2>
            <Help>선택한 기간 동안 모든 메시지들의 발송과 클릭 각각의 총합 추이입니다.</Help>
            <i />
            <span data-leg="">
              <i style={{ background: 'var(--chart-clicked)' }} />
              발송
            </span>
            <span data-leg="">
              <i style={{ background: 'var(--chart-capped)' }} />
              클릭
            </span>
            {exportBtn('발송 & 클릭')}
          </Head>
          <LineChart
            labels={labels}
            xEvery={Math.ceil(labels.length / 4)}
            series={[
              { key: 'sent', values: sent, color: 'var(--chart-clicked)' },
              { key: 'clicked', values: clicked, color: 'var(--chart-capped)', scale: 2 },
            ]}
            tip={(i) => (
              <>
                <span>{`발송: ${sent[i].toLocaleString('ko-KR')}`}</span>
                <span>{`클릭: ${clicked[i].toLocaleString('ko-KR')} (${sent[i] ? ((clicked[i] / sent[i]) * 100).toFixed(2) : '0.00'}%)`}</span>
              </>
            )}
          />
        </Card>
        <Card>
          <Head>
            <h2>발송 시간대별 평균 클릭률</h2>
            <Help>선택한 기간 동안 모든 메시지들의 발송 시간대별 평균 클릭률 추이입니다.</Help>
            <i />
            {exportBtn('발송 시간대별 평균 클릭률')}
          </Head>
          <BarChart labels={hours.map((_, h) => String(h))} values={hours.map((v) => v * 100)} tip={(i) => <span style={{ fontWeight: 600 }}>{`${(hours[i] * 100).toFixed(2)}%`}</span>} />
        </Card>
      </Two>
      <Two>
        <RankCard title="가장 클릭률 높은 메시지 (콘솔)" api={false} />
        <RankCard title="가장 클릭률 높은 메시지 (API)" api />
      </Two>
      <Shortcut type="button" onClick={() => router.push('/data-management')}>
        최근 이벤트
        <i />
        <span>
          <Icon name="chevron_right" size={20} />
        </span>
      </Shortcut>
      {csv && (
        <ReasonField
          info={
            <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', rowGap: 8, fontSize: 14 }}>
              <span style={{ color: 'var(--text-tertiary)' }}>기간</span>
              <span>{`${range.from} ~ ${range.to}`}</span>
              <span style={{ color: 'var(--text-tertiary)' }}>데이터</span>
              <span>{csv}</span>
            </div>
          }
          onClose={() => setCsv(null)}
          onDownload={() => {
            setCsv(null);
            toast('파일 다운로드에 성공했습니다.');
          }}
        />
      )}
    </>
  );
}
