import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { Dialog } from '@/components/ui/Modal';
import { HoverTip } from '@/components/ui/Tooltip';
import { Help } from '@/components/channel/ChannelShell';
import DataTable from '@/components/channel/DataTable';
import { ReasonField } from './Reason';
import { fmt, hoursLabel, pct, won, type Conversion, type Segment, type Target } from '@/lib/sent';
import { useStore } from '@/lib/store';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 보낸 메시지 상세 공용 — Figma 「알림톡 — 보낸 메시지 상세」(1191:46253) · 푸시 상세 sample(567:30160).
// 머리 = 뒤로 + 「보낸 메시지 상세」 + 「메시지 복제」, 섹션마다 카드(간격 16), 카드 제목 Text lg SemiBold.
const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  > h1 { flex: 1; margin: 0; ${text('display-xs', 'semibold')}; color: ${color('text-primary')}; }
`;

export function DetailHeader({ backHref, copyHref }: { backHref: string; copyHref: string }) {
  const router = useRouter();
  return (
    <Head>
      <IconButton icon="arrow_back" label="뒤로" onClick={() => router.push(backHref)} />
      <h1>보낸 메시지 상세</h1>
      <Button size="md" iconLeading="content_copy" onClick={() => router.push(copyHref)}>
        메시지 복제
      </Button>
    </Head>
  );
}

export const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CardBox = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 23px;
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  box-shadow: ${shadow.xs};
  > h2 { margin: 0; ${text('text-lg', 'semibold')}; color: ${color('text-primary')}; }
`;

export function Section({ title, children, ...rest }: { title: string; children: ReactNode; 'data-detail-section'?: string }) {
  return (
    <CardBox {...rest}>
      <h2>{title}</h2>
      {children}
    </CardBox>
  );
}

const BlockHeadBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  > b { ${text('text-md', 'semibold')}; color: ${color('text-primary')}; }
`;

export function BlockHead({ icon, title, help }: { icon: string; title: string; help?: ReactNode }) {
  return (
    <BlockHeadBox>
      <span>
        <Icon name={icon} size={20} />
      </span>
      <b>{title}</b>
      {help && <Help>{help}</Help>}
    </BlockHeadBox>
  );
}

// 「2026.10.07 13:11:09 Asia/Seoul」
export const withTz = (s: string) => `${s} ${Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul'}`;

// ── 대상
const SegBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 11px 15px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.md}px;
  > button { display: flex; align-items: center; gap: 16px; width: 100%; padding: 0; border: 0; background: none; text-align: left; cursor: pointer; }
  > button:disabled { cursor: default; }
  > button > small { ${text('text-sm', 'medium')}; color: ${color('text-tertiary')}; }
  > button > b { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; ${text('text-sm', 'medium')}; color: ${color('text-primary')}; }
  > button > span { display: inline-flex; color: ${color('fg-quaternary')}; transition: transform 0.2s ease-out; }
  > div { display: flex; flex-direction: column; gap: 4px; padding: 10px 16px; border-radius: ${radius.md}px; background: ${color('bg-secondary')}; ${text('text-sm', 'regular')}; color: ${color('text-secondary')}; }
  > div b { font-weight: 600; color: ${color('text-primary')}; margin-right: 6px; }
`;

const Joiner = styled.span`
  align-self: flex-start;
  padding: 2px 8px;
  border-radius: ${radius.sm}px;
  background: ${color('bg-tertiary')};
  ${text('text-xs', 'semibold')};
  color: ${color('text-tertiary')};
`;

function SegmentChip({ s }: { s: Segment }) {
  const [open, setOpen] = useState(true);
  return (
    <SegBox>
      <button type="button" disabled={s.isDefault} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <small>세그먼트</small>
        <b>
          {s.name}
          {s.isDefault && <Badge color="gray">기본</Badge>}
        </b>
        {!s.isDefault && (
          <span style={{ transform: open ? 'none' : 'rotate(180deg)' }}>
            <Icon name="keyboard_arrow_down" size={24} />
          </span>
        )}
      </button>
      {!s.isDefault && open && s.conditions && (
        <div>
          {s.conditions.map((c) => {
            const [k, rest] = c.split('|');
            return (
              <span key={c}>
                <b>{k}</b>
                {rest}
              </span>
            );
          })}
        </div>
      )}
    </SegBox>
  );
}

const Groups = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  > small { ${text('text-sm', 'semibold')}; color: ${color('text-secondary')}; }
`;

function SegmentGroups({ label, groups }: { label: string; groups: Segment[][] }) {
  return (
    <Groups>
      <small>{label}</small>
      {groups.map((g, gi) => (
        <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {gi > 0 && <Joiner>또는</Joiner>}
          {g.map((s, si) => (
            <div key={s.name + si} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {si > 0 && <Joiner>그리고</Joiner>}
              <SegmentChip s={s} />
            </div>
          ))}
        </div>
      ))}
    </Groups>
  );
}

const FileBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: none;
  ${text('text-sm', 'medium')};
  color: ${color('text-primary')};
  cursor: pointer;
  > span { display: inline-flex; color: ${color('fg-success-primary')}; }
  &:hover { text-decoration: underline; }
`;

const TRow = styled.div`
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  align-items: start;
  padding: 16px 20px;
  border-bottom: 1px solid ${color('border-secondary')};
  > small { ${text('text-sm', 'semibold')}; color: ${color('text-quaternary')}; }
  > div { ${text('text-sm', 'medium')}; color: ${color('text-primary')}; white-space: pre-line; }
`;

export function TargetView({ target, extra }: { target: Target; extra?: ReactNode }) {
  const [reason, setReason] = useState(false);
  return (
    <>
      {extra}
      {target.kind === 'segment' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SegmentGroups label="포함" groups={target.include} />
          {target.exclude && <SegmentGroups label="제외" groups={target.exclude} />}
        </div>
      )}
      {target.kind === 'csv' && (
        <TRow>
          <small>파일 업로드</small>
          <div>
            <FileBtn type="button" onClick={() => setReason(true)}>
              <span>
                <Icon name="description" size={24} />
              </span>
              {target.file}
            </FileBtn>
          </div>
        </TRow>
      )}
      {target.kind === 'ids' && (
        <TRow>
          <small>{target.label}</small>
          <div>{target.ids.join('\n')}</div>
        </TRow>
      )}
      {reason && <ReasonField onClose={() => setReason(false)} onDownload={() => setReason(false)} />}
    </>
  );
}

// ── 도넛 (Figma `Pie chart` sm · Hole 50%, 0이면 chart-none 한 조각)
export type Series = { key: string; label: string; value: number; color: string };

export function Donut({ series, size = 160 }: { series: Series[]; size?: number }) {
  const sum = series.reduce((a, s) => a + s.value, 0);
  const r = size / 2;
  const w = r / 2; // 구멍 50%
  const rc = r - w / 2;
  const c = 2 * Math.PI * rc;
  let off = 0;
  const [tip, setTip] = useState<string | null>(null);
  return (
    <HoverTip content={tip ?? (sum ? '' : '-')}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0, transform: 'rotate(-90deg)' }} onMouseLeave={() => setTip(null)}>
        <circle cx={r} cy={r} r={rc} fill="none" stroke="var(--chart-none)" strokeWidth={w} />
        {sum > 0 &&
          series.map((s) => {
            const len = (s.value / sum) * c;
            const el = s.value > 0 && (
              <circle key={s.key} cx={r} cy={r} r={rc} fill="none" stroke={s.color} strokeWidth={w} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-off} onMouseEnter={() => setTip(`${s.label} ${fmt(s.value)}`)} />
            );
            off += len;
            return el;
          })}
      </svg>
    </HoverTip>
  );
}

const LegendBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  > div { display: flex; align-items: center; gap: 8px; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; white-space: pre; }
  > div > i { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  > div > button { padding: 0; border: 0; background: none; ${text('text-sm', 'semibold')}; color: ${color('text-brand-secondary')}; cursor: pointer; }
  > div > button:hover { text-decoration: underline; }
`;

export function Legend({ series, onFailDetail, failKey = 'failed' }: { series: Series[]; onFailDetail?: () => void; failKey?: string }) {
  const sum = series.reduce((a, s) => a + s.value, 0);
  return (
    <LegendBox>
      {series.map((s) => (
        <div key={s.key}>
          <i style={{ background: s.color }} />
          {`${s.label}  ${fmt(s.value)} (${pct(s.value, sum)})`}
          {s.key === failKey && s.value > 0 && onFailDetail && (
            <button type="button" onClick={onFailDetail}>
              실패 자세히 보기
            </button>
          )}
        </div>
      ))}
    </LegendBox>
  );
}

// ── 발송 통계 패널 (알림톡 · 브랜드메시지 · 문자 · 이메일)
const Panel = styled.div`
  display: flex;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.lg}px;
  overflow: hidden;
  > div:first-of-type { flex: 1; display: flex; align-items: center; justify-content: center; gap: 16px; padding: 24px 20px; border-right: 1px solid ${color('border-secondary')}; }
  > div:last-of-type { flex: 1; display: flex; flex-direction: column; }
`;

const Tile = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 88px;
  padding: 16px 20px;
  & + & { border-top: 1px solid ${color('border-secondary')}; }
  > span { flex: 1; display: flex; flex-direction: column; gap: 4px; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
  > span > small { ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
  > div { display: flex; align-items: center; gap: 8px; }
  > div > i { display: flex; flex-direction: column; align-items: flex-end; font-style: normal; }
  > div > i > b { ${text('text-xl', 'semibold')}; color: ${color('text-primary')}; font-variant-numeric: tabular-nums; }
  > div > i > em { font-style: normal; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
`;

export type TileSpec = { label: string; value: string; sub?: string; download?: () => void; rows?: [string, string][] };

export function StatTile({ t }: { t: TileSpec }) {
  return (
    <Tile>
      <span>
        {t.label}
        {t.rows?.map(([k, v]) => (
          <small key={k}>{`${k}  ${v}`}</small>
        ))}
      </span>
      <div>
        <i>
          <b>{t.value}</b>
          {t.sub && <em>{t.sub}</em>}
        </i>
        {t.download && <IconButton icon="download" label="다운로드" onClick={t.download} />}
      </div>
    </Tile>
  );
}

export function SendStatsPanel({ series, onFailDetail, tiles }: { series: Series[]; onFailDetail: () => void; tiles: TileSpec[] }) {
  return (
    <Panel>
      <div>
        <Donut series={series} />
        <Legend series={series} onFailDetail={onFailDetail} />
      </div>
      <div>
        {tiles.map((t) => (
          <StatTile key={t.label} t={t} />
        ))}
      </div>
    </Panel>
  );
}

// ── 실패 상세 통계 모달 (폭 600) — 새로고침은 30초간 비활성, 총합 행 다운로드
const FailList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.md}px;
  overflow: hidden;
  > div { display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 6px 16px; ${text('text-sm', 'regular')}; color: ${color('text-secondary')}; }
  > div + div { border-top: 1px solid ${color('border-secondary')}; }
  > div > span { flex: 1; }
  > div > b { ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; font-variant-numeric: tabular-nums; }
  > div[data-total] { background: ${color('bg-brand-primary')}; }
  > div[data-total] > span, > div[data-total] > b { color: ${color('text-brand-secondary')}; font-weight: 600; }
`;

export function FailureModal({ labels, data, ratio, onClose }: { labels: Record<string, string>; data: Record<string, number>; ratio?: boolean; onClose: () => void }) {
  const [cool, setCool] = useState(30);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [loading]);
  useEffect(() => {
    if (cool <= 0) return;
    const t = setTimeout(() => setCool((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cool]);
  const sum = Object.values(data).reduce((a, b) => a + b, 0);
  return (
    <>
      <Dialog
        title="실패 상세 통계"
        width={600}
        onClose={onClose}
        actions={
          <HoverTip content={cool > 0 ? `${cool}초 후 새로고침할 수 있습니다` : '새로고침'}>
            <span style={{ display: 'inline-flex' }}>
              <IconButton
                icon="refresh"
                label="새로고침"
                disabled={cool > 0}
                onClick={() => {
                  setLoading(true);
                  setCool(30);
                }}
              />
            </span>
          </HoverTip>
        }
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32, color: 'var(--fg-quaternary)' }}>
            <Icon name="progress_activity" size={28} />
          </div>
        ) : (
          <FailList>
            {Object.entries(data).map(([k, v]) => (
              <div key={k}>
                <span>{labels[k] ?? k}</span>
                <b>{ratio ? `${fmt(v)} (${pct(v, sum)})` : fmt(v)}</b>
              </div>
            ))}
            <div data-total="">
              <span>총합</span>
              <b>{fmt(sum)}</b>
              <IconButton icon="download" label="다운로드" onClick={() => setReason(true)} />
            </div>
          </FailList>
        )}
      </Dialog>
      {reason && <ReasonField onClose={() => setReason(false)} onDownload={() => setReason(false)} />}
    </>
  );
}

// ── 전환 이벤트 표 (6열: 이벤트 명 · 필터 · 측정 기준 · 기여 기간 · 전환 · 구매 총액)
const FilterChip = styled.span`
  display: inline-block;
  max-width: 320px;
  padding: 2px 8px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.sm}px;
  background: ${color('bg-secondary')};
  ${text('text-xs', 'medium')};
  color: ${color('text-secondary')};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export function ConversionTable({ conversions, defaultBasis }: { conversions: Conversion[]; defaultBasis: 'SEND' | 'CLICK' }) {
  const [reason, setReason] = useState(false);
  return (
    <>
      <DataTable
        columns={[
          { label: '이벤트 명', width: '220px' },
          { label: '필터', width: 'minmax(0,1fr)' },
          { label: '측정 기준', width: '120px' },
          { label: '기여 기간', width: '100px' },
          { label: '전환', width: '140px' },
          { label: '구매 총액', width: '140px' },
        ]}
        rows={conversions.map((c) => ({
          key: c.id,
          cells: [
            <span key="e" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.eventType}</span>
              {c.purchase && <Badge color="brand">구매</Badge>}
            </span>,
            c.filters?.length ? (
              <HoverTip key="f" content={c.filters.join('\n')}>
                <FilterChip>{c.filters[0]}</FilterChip>
              </HoverTip>
            ) : (
              '-'
            ),
            (c.basis ?? defaultBasis) === 'SEND' ? '발송 기반' : '클릭 기반',
            hoursLabel(c.hours),
            <span key="c" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {`${fmt(c.converted)} (${pct(c.converted, c.candidate)})`}
              {c.converted > 0 && <IconButton icon="download" size="xs" label="다운로드" onClick={() => setReason(true)} />}
            </span>,
            c.purchase ? won(c.amount ?? 0) : '-',
          ],
        }))}
      />
      {reason && <ReasonField onClose={() => setReason(false)} onDownload={() => setReason(false)} />}
    </>
  );
}

// 실패 코드 라벨 (docs 3.6)
export const FAIL_LABELS = {
  push: { PROVIDER_REJECTED: '프로바이더 거부 (FCM/APNs/브라우저 서버)', DEVICE_NOT_FOUND: '발송 가능한 기기 없음', LIQUID_ABORTED: '개인화 문법 중단 ({% abort_message%})', ETC: '기타' },
  kakao: {
    RECEIVING_BLOCKED: '채널 차단, 채널 발송 불가',
    UNABLE_TO_SEND: '카카오톡 유저가 아님, 버전 미지원, 휴면 유저',
    INVALID_PARAMETER: '잘못된 값(전화번호 오류/메시지 내용, 설정 오류)',
    UNSUBSCRIBED: '수신거부',
    UNSUPPORTED_COUNTRY: '지원하지 않는 국가',
    INSUFFICIENT_POINTS: '잔여 포인트 부족',
    FREQUENCY_CAPPED: '발송 제한 초과',
    LIQUID_ABORTED: '개인화 문법 중단 ({% abort_message%})',
    ZERO_TARGET: '발송 가능한 대상 없음',
    ETC: '단말기 비활성, 단말기 네트워크 오류 등',
  },
  sms: {
    UNABLE_TO_SEND: '없는 번호, 단말기 서비스 정지(요금 미납 등)',
    SEND_TIMEOUT: '단말기 미응답 (전원 종료, 비행기 모드, 음영 지역 등)',
    INVALID_PARAMETER: '잘못된 전화번호 형식',
    UNSUBSCRIBED: '수신거부',
    UNSUPPORTED_COUNTRY: '지원하지 않는 국가',
    INSUFFICIENT_POINTS: '잔여 포인트 부족',
    FREQUENCY_CAPPED: '발송 제한 초과',
    LIQUID_ABORTED: '개인화 문법 중단 ({% abort_message%})',
    ZERO_TARGET: '발송 가능한 대상 없음',
    ETC: '통신사 차단, 단말기 네트워크 오류 등',
  },
  email: { SOFT_BOUNCED: '임시 반송', HARD_BOUNCED: '영구 반송', QUOTA_EXCEEDED: '발송 제한 초과', DELIVERED_FAILED: '발송 실패', ETC: '기타' },
};

// 상세는 10초마다 조용히 다시 불러옴(이메일 제외) — 프로토타입은 값이 그대로라 갱신 신호만
export function usePolling(ms = 10000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
  return tick;
}

// 다운로드 사유 모달을 여는 훅 — 성공 토스트 없음(스테이징), 파일만
export function useReason() {
  const { toast } = useStore();
  const [open, setOpen] = useState(false);
  return {
    open: () => setOpen(true),
    node: open ? <ReasonField onClose={() => setOpen(false)} onDownload={() => setOpen(false)} /> : null,
    toast,
  };
}

export const NotFound = () => <Section title="정보">데이터가 없습니다</Section>;
