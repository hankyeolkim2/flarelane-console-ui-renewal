import { useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { RangePicker } from '@/components/analytics/editor/Toolbar';
import Button from '@/components/ui/Button';
import ButtonGroup from '@/components/ui/ButtonGroup';
import Floating from '@/components/ui/Floating';
import { ConfirmModal } from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import { ButtonTabs } from '@/components/ui/Tabs';
import TextField from '@/components/ui/TextField';
import Toggle from '@/components/ui/Toggle';
import { Card, CardHead, Help } from '@/components/channel/ChannelShell';
import DataTable from '@/components/channel/DataTable';
import { LineChart } from '@/components/dashboard/Charts';
import { EmptyList, PageTitle } from '@/components/sent/SentList';
import { addDays, parseYmd, TODAY, ymd } from '@/lib/editor';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 결제 — Figma 「결제」(1233:30731) + docs/staging-behavior-dashboard-settings.md 4장.
// 스테이징 프로젝트 = DEVELOPER 플랜 → 결제 담당자 · 결제수단 카드 숨김(Figma 도 같음). 충전 · 자동 충전 = 브라우저 확인창 / 알림창(토스트 아님).
// 「충전하기」는 결제 담당자 정보와 카드가 둘 다 있어야 활성 — 더미에는 둘 다 넣어 모달을 열 수 있게 함.
const PLAN = { planName: 'DEVELOPER', deviceCount: 0, currency: 'USD', planPayAmount: 0, expiredAt: null as string | null };
const PAYER = { companyName: '플레어레인', managerName: '담당자', managerEmail: 'billing@example.com', managerTel: '010-0000-0000' };
const CARD = '1234********5678';
const UNIT = { SMS: 9.9, LMS: 30, MMS: 100, KakaoAlimtalk: 7.9, BrandF: 15, BrandN: 20 };

const Tiles = styled.div<{ cols: number }>`
  display: grid;
  grid-template-columns: repeat(${(p) => p.cols}, minmax(0, 1fr));
  gap: 16px;
  > div { display: flex; flex-direction: column; gap: 8px; padding: 20px; border-radius: ${radius.md}px; background: ${color('bg-secondary')}; }
  > div > small { ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; display: inline-flex; align-items: center; gap: 4px; }
  > div > b { ${text('display-xs', 'semibold')}; color: ${color('text-primary')}; font-variant-numeric: tabular-nums; }
`;

const Calc = styled.div`
  display: grid;
  grid-template-columns: 1fr 40px 1fr 40px 1fr;
  align-items: center;
  > span { text-align: center; ${text('text-lg', 'regular')}; color: ${color('text-quaternary')}; }
`;

const Auto = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: ${radius.md}px;
  background: ${color('bg-secondary')};
  > div { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  > div > b { ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  > div > span { ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
  > div > small { ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
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
`;

const Legend = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  > button { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: 0; background: none; ${text('text-xs', 'medium')}; color: ${color('text-secondary')}; cursor: pointer; }
  > button > i { width: 8px; height: 8px; border-radius: 50%; }
  > button[aria-pressed='false'] { color: ${color('text-disabled')}; }
  > button[aria-pressed='false'] > i { background: ${color('fg-quaternary')} !important; }
`;

const Pivot = styled.div`
  overflow-x: auto;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  > table { border-collapse: collapse; min-width: 100%; }
  th, td { padding: 0 20px; height: 64px; border-bottom: 1px solid ${color('border-secondary')}; text-align: left; white-space: nowrap; ${text('text-sm', 'medium')}; color: ${color('text-primary')}; font-variant-numeric: tabular-nums; }
  thead th { height: 40px; ${text('text-xs', 'semibold')}; color: ${color('text-quaternary')}; }
  tbody th { ${text('text-sm', 'medium')}; color: ${color('text-tertiary')}; width: 180px; }
  tr:last-of-type > * { border-bottom: 0; }
  tr[data-total] > * { color: ${color('text-brand-secondary')}; font-weight: 600; }
`;

const Amounts = ({ options, value, onChange, custom, setCustom }: { options: number[]; value: number | 'custom'; onChange: (v: number | 'custom') => void; custom: number; setCustom: (n: number) => void }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <ButtonGroup<string> items={[...options.map((o) => ({ value: String(o), label: o.toLocaleString('ko-KR') })), { value: 'custom', label: '직접입력' }]} value={String(value)} onChange={(v) => onChange(v === 'custom' ? 'custom' : Number(v))} />
    {value === 'custom' && <TextField type="number" min={0} max={999999999} value={String(custom)} onChange={(e) => setCustom(Math.min(999999999, Math.max(0, Number(e.target.value) || 0)))} />}
  </div>
);

const DOW = (d: Date) => `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function Billing() {
  const [points, setPoints] = useState({ balance: 0, reserved: 0 });
  const [auto, setAuto] = useState({ enabled: false, threshold: 50000, amount: 100000 });
  const [modal, setModal] = useState<null | 'charge' | 'auto'>(null);
  const [charge, setCharge] = useState<number | 'custom'>(100000);
  const [custom, setCustom] = useState(1000000);
  const [th, setTh] = useState<number | 'custom'>(50000);
  const [thCustom, setThCustom] = useState(1000000);
  const [am, setAm] = useState<number | 'custom'>(100000);
  const [amCustom, setAmCustom] = useState(1000000);
  const [interval, setInterval_] = useState<'days' | 'weeks' | 'months'>('days');
  const [range, setRange] = useState({ from: ymd(addDays(TODAY, -30)), to: ymd(addDays(TODAY, -1)) });
  const [payRange, setPayRange] = useState({ from: ymd(addDays(TODAY, -365)), to: ymd(TODAY) });
  const [open, setOpen] = useState<null | 'usage' | 'pay'>(null);
  const usageRef = useRef<HTMLButtonElement>(null);
  const payRef = useRef<HTMLButtonElement>(null);
  const [on, setOn] = useState({ alim: true, brand: true, sms: true });
  const [tab, setTab] = useState<'month' | 'point'>('month');
  const [page, setPage] = useState(1);
  const canCharge = !!PAYER.companyName && !!CARD;

  const dates = useMemo(() => {
    const out: Date[] = [];
    for (let d = parseYmd(range.from); d <= parseYmd(range.to); d = addDays(d, interval === 'days' ? 1 : interval === 'weeks' ? 7 : 30)) out.push(d);
    return out;
  }, [range, interval]);
  // 스테이징 프로젝트는 사용 내역이 0 — 차트 모양을 보려고 작은 값을 넣음
  const series = dates.map((d, i) => ({ alim: 60 + i * 0.7 + (i % 4), brand: 38 + i * 0.4 + (i % 3), sms: 10 + i * 1.1 + (i % 5) }));
  const sum = (k: 'alim' | 'brand' | 'sms') => series.reduce((a, s) => a + s[k], 0);
  const amountOf = (v: number | 'custom', c: number) => (v === 'custom' ? c : v);
  const won = (n: number) => `₩${n.toLocaleString('ko-KR')}`;
  const history: { id?: string; at: string; method: string; amount: number }[] = [];

  return (
    <>
      <PageTitle>
        <h1>결제</h1>
      </PageTitle>
      <Card>
        <CardHead
          title="나의 플랜"
          actions={
            // ko = 채널톡 버튼(자체 동작 없음)
            <Button hierarchy="primary" className="ch-button">
              업그레이드
            </Button>
          }
        />
        <Tiles cols={4}>
          <div>
            <small>플랜명</small>
            <b>{PLAN.planName}</b>
          </div>
          <div>
            <small>기간 내 구독 기기</small>
            <b>{PLAN.deviceCount.toLocaleString('ko-KR')}</b>
          </div>
          <div>
            <small>예상 결제액</small>
            <b>{PLAN.currency === 'KRW' ? `₩ ${PLAN.planPayAmount.toLocaleString('ko-KR')}` : PLAN.currency === 'USD' ? `$ ${PLAN.planPayAmount.toLocaleString('ko-KR')}` : ''}</b>
          </div>
          <div>
            <small>플랜 만료일</small>
            <b>{PLAN.expiredAt ?? '-'}</b>
          </div>
        </Tiles>
      </Card>

      <Card>
        <CardHead
          title="나의 포인트"
          actions={
            <Button hierarchy="primary" disabled={!canCharge} onClick={() => setModal('charge')}>
              충전하기
            </Button>
          }
        />
        <Calc>
          <Tiles cols={1}>
            <div>
              <small>전체 포인트</small>
              <b>{(points.balance + points.reserved).toLocaleString('ko-KR')}</b>
            </div>
          </Tiles>
          <span>-</span>
          <Tiles cols={1}>
            <div>
              <small>
                차감 예정 <Help>발송 시 필요한 포인트를 먼저 예약합니다. 발송 성공 시 예약된 포인트가 차감됩니다.</Help>
              </small>
              <b>{points.reserved.toLocaleString('ko-KR')}</b>
            </div>
          </Tiles>
          <span>=</span>
          <Tiles cols={1}>
            <div>
              <small>사용 가능 포인트</small>
              <b>{points.balance.toLocaleString('ko-KR')}</b>
            </div>
          </Tiles>
        </Calc>
        <hr style={{ margin: 0, border: 0, borderTop: '1px solid var(--border-secondary)' }} />
        <Auto>
          <Toggle
            label="자동 충전"
            checked={auto.enabled}
            disabled={!canCharge}
            onChange={(v) => {
              if (v) return setModal('auto');
              if (!window.confirm('자동 충전 설정을 해제하시겠습니까?\n발송 중 포인트가 부족해질 경우 발송이 중지됩니다.')) return;
              setAuto({ ...auto, enabled: false });
              window.alert('자동 충전 설정을 해제하였습니다.');
            }}
          />
          <div>
            <b>자동 충전</b>
            <span>{auto.enabled ? `사용 가능 포인트가 ${auto.threshold.toLocaleString('ko-KR')}이하가 될 경우 자동으로 ${auto.amount.toLocaleString('ko-KR')}포인트를 충전합니다.` : '사용 가능 포인트가 설정한 포인트 이하가 될 경우 자동으로 포인트를 충전합니다.'}</span>
            <small>* 유료 채널 발송은 사용 가능 포인트로 발송할 수 있습니다.</small>
          </div>
          <Button disabled={!canCharge} onClick={() => setModal('auto')}>
            자동 충전 설정
          </Button>
        </Auto>
      </Card>

      <Card>
        <CardHead
          title="포인트 사용 내역"
          actions={
            <>
              <Select<'days' | 'weeks' | 'months'> width={96} value={interval} options={[{ value: 'days', label: '일' }, { value: 'weeks', label: '주' }, { value: 'months', label: '달' }]} onChange={setInterval_} />
              <RangeBtn ref={usageRef} type="button" onClick={() => setOpen(open === 'usage' ? null : 'usage')}>
                <span>
                  <Icon name="calendar_today" size={20} />
                </span>
                {`${range.from} ~ ${range.to}`}
              </RangeBtn>
              <Floating anchorRef={usageRef} open={open === 'usage'} onClose={() => setOpen(null)} width={548}>
                <RangePicker range={range} onCancel={() => setOpen(null)} onConfirm={(r) => { setOpen(null); setRange(r); }} />
              </Floating>
            </>
          }
        />
        <Legend>
          {(
            [
              ['alim', '카카오 알림톡', '#F4CE37'],
              ['brand', '카카오 브랜드메시지', '#D67631'],
              ['sms', '문자', '#57BDE2'],
            ] as const
          ).map(([k, l, c]) => (
            <button key={k} type="button" aria-pressed={on[k]} onClick={() => setOn({ ...on, [k]: !on[k] })}>
              <i style={{ background: c }} />
              {l}
            </button>
          ))}
        </Legend>
        <LineChart
          labels={dates.map(DOW)}
          series={[
            ...(on.alim ? [{ key: 'alim', values: series.map((s) => Math.round(s.alim)), color: '#F4CE37' }] : []),
            ...(on.brand ? [{ key: 'brand', values: series.map((s) => Math.round(s.brand)), color: '#D67631' }] : []),
            ...(on.sms ? [{ key: 'sms', values: series.map((s) => Math.round(s.sms)), color: '#57BDE2' }] : []),
          ]}
          tip={(i) => (
            <>
              {on.alim && <span>{`카카오 알림톡: ${Math.round(series[i].alim).toLocaleString('ko-KR')}`}</span>}
              {on.brand && <span>{`카카오 브랜드메시지: ${Math.round(series[i].brand).toLocaleString('ko-KR')}`}</span>}
              {on.sms && <span>{`문자: ${Math.round(series[i].sms).toLocaleString('ko-KR')}`}</span>}
            </>
          )}
        />
        <Pivot>
          <table>
            <thead>
              <tr>
                <th />
                <th>전체</th>
                {[...dates].reverse().map((d) => (
                  <th key={ymd(d)}>{ymd(d).replace(/-/g, '.')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ['alim', '카카오 알림톡'],
                  ['brand', '카카오 브랜드메시지'],
                  ['sms', '문자'],
                ] as const
              ).map(([k, l]) => (
                <tr key={k}>
                  <th>{l}</th>
                  <td>{Math.round(sum(k)).toLocaleString('ko-KR')}</td>
                  {[...series].reverse().map((s, i) => (
                    <td key={i}>{Math.round(s[k]).toLocaleString('ko-KR')}</td>
                  ))}
                </tr>
              ))}
              <tr data-total="">
                <th>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    총 사용 포인트
                    <Help>
                      <span style={{ whiteSpace: 'pre-line' }}>{`SMS: ${UNIT.SMS}원\nLMS: ${UNIT.LMS}원\nMMS: ${UNIT.MMS}원\n카카오 알림톡: ${UNIT.KakaoAlimtalk}원\n브랜드메시지 친구: ${UNIT.BrandF}원\n브랜드메시지 비친구: ${UNIT.BrandN}원`}</span>
                    </Help>
                  </span>
                </th>
                <td>{Math.round(sum('alim') + sum('brand') + sum('sms')).toLocaleString('ko-KR')}</td>
                {[...series].reverse().map((s, i) => (
                  <td key={i}>{Math.round(s.alim + s.brand + s.sms).toLocaleString('ko-KR')}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </Pivot>
      </Card>

      <Card>
        <CardHead title="결제정보" />
        <ButtonTabs<'month' | 'point'> full items={[{ value: 'month', label: '월 결제 내역' }, { value: 'point', label: '포인트 결제 내역' }]} value={tab} onChange={setTab} />
        {tab === 'month' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <RangeBtn ref={payRef} type="button" onClick={() => setOpen(open === 'pay' ? null : 'pay')}>
              <span>
                <Icon name="calendar_today" size={20} />
              </span>
              {`${payRange.from} ~ ${payRange.to}`}
            </RangeBtn>
            <Floating anchorRef={payRef} open={open === 'pay'} onClose={() => setOpen(null)} width={548}>
              <RangePicker range={payRange} onCancel={() => setOpen(null)} onConfirm={(r) => { setOpen(null); setPayRange(r); setPage(1); }} />
            </Floating>
          </div>
        )}
        {tab === 'month' ? (
          <DataTable
            columns={[
              { label: '날짜', width: 'minmax(0,1fr)' },
              { label: '수단', width: '180px' },
              { label: '금액', width: '180px' },
              { label: '영수증', width: '100px' },
            ]}
            rows={history.slice((page - 1) * 10, page * 10).map((h, i) => ({ key: String(i), cells: [h.at, h.method, `${h.amount.toLocaleString('ko-KR')} 원`, h.id ? <Icon key="r" name="description" size={20} /> : '-'] }))}
            empty={<EmptyList />}
            footer={history.length > 0 && <Pagination page={page} pages={Math.ceil(history.length / 10)} onChange={setPage} />}
          />
        ) : (
          <DataTable
            columns={[
              { label: '날짜', width: 'minmax(0,1fr)' },
              { label: '충전 타입', width: '180px' },
              { label: '충전 포인트', width: '220px' },
              { label: '금액', width: '220px' },
            ]}
            rows={[]}
            empty={<EmptyList />}
          />
        )}
      </Card>

      {modal === 'charge' && (
        <ConfirmModal
          title="충전하기"
          cancelLabel="취소"
          confirmLabel="충전"
          onClose={() => setModal(null)}
          onConfirm={() => {
            if (!window.confirm('포인트를 충전하시겠습니까?')) return;
            const n = amountOf(charge, custom);
            setPoints((p) => ({ ...p, balance: p.balance + n }));
            window.alert('충전되었습니다.');
            setModal(null);
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, background: 'var(--bg-secondary)' }}>
              <Icon name="credit_card" size={24} />
              <span>
                카드번호 <b style={{ color: 'var(--text-primary)' }}>{`${CARD.slice(0, 4)} - **** - **** - ${CARD.slice(-4)}`}</b>
              </span>
            </div>
            <b style={{ color: 'var(--text-secondary)' }}>충전 금액</b>
            <Amounts options={[100000, 300000, 500000]} value={charge} onChange={setCharge} custom={custom} setCustom={setCustom} />
            <span>
              <b style={{ color: 'var(--text-brand-secondary)' }}>{won(Math.floor(amountOf(charge, custom) * 1.1))}</b>(부가세포함) 결제 후 <b style={{ color: 'var(--text-brand-secondary)' }}>{amountOf(charge, custom).toLocaleString('ko-KR')}</b>포인트를 충전합니다.
            </span>
          </div>
        </ConfirmModal>
      )}
      {modal === 'auto' && (
        <ConfirmModal
          title="자동 충전 설정"
          description="사용 가능 포인트보다 충전 포인트가 커야 합니다."
          cancelLabel="취소"
          confirmLabel="설정"
          onClose={() => setModal(null)}
          onConfirm={() => {
            setAuto({ enabled: true, threshold: amountOf(th, thCustom), amount: amountOf(am, amCustom) });
            window.alert('설정이 저장되었습니다.');
            setModal(null);
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            <b style={{ color: 'var(--text-secondary)' }}>사용 가능 포인트 잔액</b>
            <Amounts options={[50000, 100000, 300000]} value={th} onChange={setTh} custom={thCustom} setCustom={setThCustom} />
            <span>
              사용 가능 포인트가 <b style={{ color: 'var(--text-brand-secondary)' }}>{amountOf(th, thCustom).toLocaleString('ko-KR')}</b>보다 작으면
            </span>
            <b style={{ color: 'var(--text-secondary)' }}>충전 포인트</b>
            <Amounts options={[100000, 300000, 500000]} value={am} onChange={setAm} custom={amCustom} setCustom={setAmCustom} />
            <span>
              <b style={{ color: 'var(--text-brand-secondary)' }}>{won(Math.floor(amountOf(am, amCustom) * 1.1))}</b>(부가세포함)결제 후 <b style={{ color: 'var(--text-brand-secondary)' }}>{amountOf(am, amCustom).toLocaleString('ko-KR')}</b>포인트를 자동 충전합니다.
            </span>
          </div>
        </ConfirmModal>
      )}
    </>
  );
}
