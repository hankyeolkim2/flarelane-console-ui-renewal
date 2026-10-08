import { useState, type ReactNode } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import IconButton from '@/components/ui/IconButton';
import { HoverTip } from '@/components/ui/Tooltip';
import { Help, KV } from '@/components/channel/ChannelShell';
import { BlockHead, Cards, ConversionTable, DetailHeader, Donut, FAIL_LABELS, FailureModal, Section, TargetView, usePolling, useReason, withTz, type Series } from './Detail';
import { SourceBadge } from './SentList';
import { fmt, pct, PLATFORM_LABEL, PLATFORMS, type Platform, type PlatformStat, type PushMessage } from '@/lib/sent';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma 푸시 상세 sample(567:30160) + docs 4.1 — 발송 정보 / 메시지(라벨 · 값, 휴대폰 미리보기 없음) / 유형 & 대상 / 분석(전체 통계 · 플랫폼별 통계).
// 플랫폼 색 = 차트 램프(안드로이드 chart-converted · iOS chart-clicked · 웹 데스크탑 chart-impression · 웹 모바일 chart-sent).
const PCOLOR: Record<Platform, string> = { android: 'var(--chart-converted)', ios: 'var(--chart-clicked)', webDesktop: 'var(--chart-impression)', webMobile: 'var(--chart-sent)' };
const PICON: Record<Platform, string> = { android: 'android', ios: 'apple', webDesktop: 'desktop_windows', webMobile: 'smartphone' };

const sum = (m: PushMessage, k: keyof PlatformStat) => PLATFORMS.reduce((a, p) => a + (m.stats[p][k] ?? 0), 0);

const ttlLabel = (min: number) => (min % 1440 === 0 ? `${min / 1440}일` : min % 60 === 0 ? `${min / 60}시간` : `${min}분`);

const Panel = styled.div`
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.lg}px;
  overflow: hidden;
  > div + div { border-top: 1px solid ${color('border-secondary')}; }
`;

const Two = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  > * + * { border-left: 1px solid ${color('border-secondary')}; }
`;

const Metric = styled.div<{ sm?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: ${(p) => (p.sm ? '16px' : '20px')};
  > span { flex: 1; display: flex; align-items: center; gap: 6px; padding-top: ${(p) => (p.sm ? 4 : 6)}px; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
  > span > i { width: 8px; height: 8px; border-radius: 50%; }
  > div { display: flex; align-items: flex-start; gap: 4px; }
  > div > p { margin: 0; display: flex; flex-direction: column; align-items: flex-end; }
  > div > p > b { ${(p) => (p.sm ? text('text-lg', 'semibold') : text('text-xl', 'semibold'))}; color: ${color('text-primary')}; font-variant-numeric: tabular-nums; }
  > div > p > em { font-style: normal; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
`;

const DonutCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px 20px;
`;

const LegendBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  > div { display: flex; align-items: center; gap: 8px; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; white-space: pre; }
  > div > i { width: 8px; height: 8px; border-radius: 50%; }
`;

const Status = styled.div<{ sm?: boolean }>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 24px;
  row-gap: ${(p) => (p.sm ? 8 : 12)}px;
  padding: ${(p) => (p.sm ? '12px 16px' : '16px 20px')};
  > div { display: flex; align-items: center; gap: 6px; ${(p) => (p.sm ? text('text-xs', 'medium') : text('text-sm', 'medium'))}; color: ${color('text-secondary')}; }
  > div > i { width: 8px; height: 8px; border-radius: 50%; }
  > div > span { flex: 1; display: inline-flex; align-items: center; gap: 6px; }
  > div > b { font-weight: 500; color: ${color('text-primary')}; font-variant-numeric: tabular-nums; }
  > div button { padding: 0; border: 0; background: none; ${text('text-sm', 'semibold')}; color: ${color('text-brand-secondary')}; cursor: pointer; }
`;

const BarBox = styled.div<{ sm?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: ${(p) => (p.sm ? '16px' : '20px')};
  > div:first-of-type { position: relative; display: flex; height: 8px; border-radius: 9999px; background: var(--chart-none); overflow: hidden; }
  > div:first-of-type > i { height: 100%; }
  > div:first-of-type > em { position: absolute; left: 0; top: 0; bottom: 0; background: var(--chart-converted); }
  > div:last-of-type { display: flex; justify-content: center; gap: 16px; ${text('text-xs', 'medium')}; color: ${color('text-tertiary')}; }
`;

function Bar({ s, sm }: { s: PlatformStat; sm?: boolean }) {
  const parts: [string, number, string][] = [
    [s.clicked ? '발송 (+클릭)' : '발송', s.sent, 'var(--chart-sent)'],
    ['대기', s.remaining, 'var(--chart-remaining)'],
    ['제한됨', s.capped, 'var(--chart-capped)'],
    ['삭제', s.uninstalled, 'var(--chart-uninstalled)'],
    ['실패', s.failed, 'var(--chart-failed)'],
  ];
  const t = parts.reduce((a, p) => a + p[1], 0);
  return (
    <BarBox sm={sm}>
      <div>
        {t > 0 && parts.map(([l, v, c]) => v > 0 && <i key={l} style={{ width: `${(v / t) * 100}%`, background: c }} />)}
        {t > 0 && s.clicked > 0 && <em style={{ width: `${(s.clicked / t) * 100}%` }} />}
      </div>
      {t > 0 && (
        <div>
          {parts.filter(([, v]) => v > 0).map(([l]) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      )}
    </BarBox>
  );
}

function MetricCell({ dot, label, help, value, sub, download, sm }: { dot: string; label: string; help?: ReactNode; value: number; sub?: string; download?: () => void; sm?: boolean }) {
  return (
    <Metric sm={sm}>
      <span>
        <i style={{ background: dot }} />
        {label}
        {help && <Help>{help}</Help>}
      </span>
      <div>
        <p>
          <b>{fmt(value)}</b>
          {sub && <em>{sub}</em>}
        </p>
        {download && <IconButton icon="download" label="다운로드" onClick={download} />}
      </div>
    </Metric>
  );
}

const PCard = styled.div`
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.lg}px;
  overflow: hidden;
  > header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: ${color('bg-secondary')}; ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  > header > span { display: inline-flex; color: ${color('fg-secondary')}; }
  > div + div { border-top: 1px solid ${color('border-secondary')}; }
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
`;

const MsgVal = styled.span`
  color: ${color('text-brand-secondary')};
  white-space: pre-wrap;
`;

const Pre = styled.pre`
  margin: 0;
  padding: 12px;
  border-radius: ${radius.md}px;
  background: ${color('bg-secondary')};
  ${text('text-sm', 'regular')};
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: ${color('text-primary')};
`;

export type DetailVariant = { title?: string; copy?: boolean; dateLabel?: string; date?: string; backHref?: string; footer?: ReactNode };

export default function PushDetail({ m, variant = {} }: { m: PushMessage; variant?: DetailVariant }) {
  usePolling();
  const [fail, setFail] = useState(false);
  const reason = useReason();
  const sent = sum(m, 'sent');
  const clicked = sum(m, 'clicked');
  const failed = sum(m, 'failed');
  const platSeries = (k: 'sent' | 'clicked'): Series[] => PLATFORMS.map((p) => ({ key: p, label: PLATFORM_LABEL[p], value: m.stats[p][k], color: PCOLOR[p] }));
  const totalStat: PlatformStat = { sent, clicked, remaining: sum(m, 'remaining'), uninstalled: sum(m, 'uninstalled'), capped: sum(m, 'capped'), failed };
  const order: Platform[] = ['android', 'ios', 'webDesktop', 'webMobile'];
  // 알림 만료 기간 · 발송 빈도 제한 무시는 있을 때만, 둘 다 있으면 한 줄 2칸(Figma)
  const capping = m.ignoreCapping === undefined ? null : m.ignoreCapping ? 'TRUE' : 'FALSE';
  const ttl = m.ttlMinutes ? ttlLabel(m.ttlMinutes) : null;
  type Row = [ReactNode, ReactNode] | [ReactNode, ReactNode, ReactNode, ReactNode];
  const ttlRow: Row[] = ttl && capping ? [['알림 만료 기간', ttl, '발송 빈도 제한 무시', capping]] : ttl ? [['알림 만료 기간', ttl]] : capping ? [['발송 빈도 제한 무시', capping]] : [];
  const legend = (series: Series[]) => {
    const t = series.reduce((a, s) => a + s.value, 0);
    return (
      <LegendBox>
        {series.map((s) => (
          <div key={s.key}>
            <i style={{ background: s.color }} />
            {`${s.label}  ${fmt(s.value)} (${pct(s.value, t)})`}
          </div>
        ))}
      </LegendBox>
    );
  };

  return (
    <>
      <DetailHeader title={variant.title} backHref={variant.backHref ?? '/push/sent-history'} copyHref={variant.copy === false ? undefined : `/push/new-message?copyMessageId=${m.id}`} />
      <Cards>
        <Section title="발송 정보">
          <KV
            rows={[
              ['ID', m.id],
              ...(m.campaignName ? [['캠페인 명', m.campaignName] as [ReactNode, ReactNode]] : []),
              [
                variant.dateLabel ?? '발송 시간',
                withTz(variant.date ?? m.createdAt),
                <span key="l" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  발송 환경 <Help>메시지가 발송된 환경입니다.</Help>
                </span>,
                <SourceBadge key="b" source={m.source} />,
              ],
              ...ttlRow,
              ...(m.rateLimitPerMinute ? [['발송 속도', `분당 ${fmt(m.rateLimitPerMinute)}개 메시지 발송`] as [ReactNode, ReactNode]] : []),
              ...(typeof m.targetSelectionRate === 'number' ? [['무작위 일부 발송', `${m.targetSelectionRate * 100}%`] as [ReactNode, ReactNode]] : []),
            ]}
          />
        </Section>
        <Section title="메시지">
          <KV
            rows={[
              ['제목', m.title ? <MsgVal key="t">{m.title}</MsgVal> : '-'],
              ['내용', <MsgVal key="b">{m.body}</MsgVal>],
              ['URL', m.url ?? '-'],
              [
                '이미지',
                m.imageUrl ? (
                  <HoverTip key="i" content={<img src={m.imageUrl} alt="" style={{ display: 'block', maxWidth: 200, borderRadius: 4 }} />}>
                    <span style={{ textDecoration: 'underline', cursor: 'default' }}>{m.imageUrl}</span>
                  </HoverTip>
                ) : (
                  '-'
                ),
              ],
              ...(m.buttons ? [['버튼', <span key="bt" style={{ whiteSpace: 'pre-line' }}>{m.buttons.map((b) => `${b.label}(${b.link})`).join('\n')}</span>] as [ReactNode, ReactNode]] : []),
              ...(m.data ? [['데이터', <Pre key="d">{JSON.stringify(m.data, null, 4)}</Pre>] as [ReactNode, ReactNode]] : []),
            ]}
          />
        </Section>
        <Section title="유형 & 대상">
          <TargetView
            target={m.target}
            extra={
              m.targetPlatforms.length > 0 && (
                <KV
                  rows={[
                    [
                      '플랫폼',
                      order
                        .filter((p) => m.targetPlatforms.includes(p))
                        .map((p) => PLATFORM_LABEL[p])
                        .join(', '),
                    ],
                  ]}
                />
              )
            }
          />
        </Section>
        <Section title="분석">
          <BlockHead icon="monitoring" title="전체 통계" />
          <Panel>
            <Two>
              <MetricCell dot="var(--chart-sent)" label="발송" help="성공적으로 발송된 기기 수입니다." value={sent} download={sent > 0 && m.canExport ? reason.open : undefined} />
              <MetricCell dot="var(--chart-clicked)" label="클릭" help="알림을 직접 클릭한 기기 수입니다." value={clicked} sub={`(${pct(clicked, sent)})`} download={clicked > 0 ? reason.open : undefined} />
            </Two>
            <Two>
              <DonutCell>
                <Donut series={platSeries('sent')} />
                {legend(platSeries('sent'))}
              </DonutCell>
              <DonutCell>
                <Donut series={platSeries('clicked')} />
                {legend(platSeries('clicked'))}
              </DonutCell>
            </Two>
            <Status>
              <div>
                <i style={{ background: 'var(--chart-remaining)' }} />
                <span>
                  대기 <Help>발송 대기중인 기기 수입니다.</Help>
                </span>
                <b>{fmt(totalStat.remaining)}</b>
              </div>
              <div>
                <i style={{ background: 'var(--chart-uninstalled)' }} />
                <span>삭제</span>
                <b>{fmt(totalStat.uninstalled)}</b>
              </div>
              <div>
                <i style={{ background: 'var(--chart-capped)' }} />
                <span>
                  제한됨{' '}
                  <Help>
                    <a href="https://docs.flarelane.co.kr/frequency-capping" target="_blank" rel="noreferrer">
                      발송 빈도 제한 설정
                    </a>
                    으로 인해 발송되지 않은 기기 수입니다.
                  </Help>
                </span>
                <b>{fmt(totalStat.capped)}</b>
              </div>
              <div>
                <i style={{ background: 'var(--chart-failed)' }} />
                <span>
                  실패
                  {failed > 0 && (
                    <button type="button" onClick={() => setFail(true)}>
                      자세히 보기
                    </button>
                  )}
                </span>
                <b>{fmt(failed)}</b>
              </div>
            </Status>
            <Bar s={totalStat} />
          </Panel>
          {m.conversions.length > 0 && (
            <>
              <BlockHead icon="conversion_path" title="전환 이벤트" />
              <ConversionTable conversions={m.conversions} defaultBasis="CLICK" />
            </>
          )}
          <BlockHead icon="devices" title="플랫폼별 통계" />
          <Grid2>
            {order.map((p) => {
              const s = m.stats[p];
              return (
                <PCard key={p}>
                  <header>
                    <span>
                      <Icon name={PICON[p]} size={20} />
                    </span>
                    {PLATFORM_LABEL[p]}
                  </header>
                  <Two>
                    <MetricCell sm dot="var(--chart-sent)" label="발송" value={s.sent} />
                    <MetricCell sm dot="var(--chart-clicked)" label="클릭" value={s.clicked} sub={`(${pct(s.clicked, s.sent)})`} />
                  </Two>
                  <Bar sm s={s} />
                  <Status sm>
                    <div>
                      <i style={{ background: 'var(--chart-remaining)' }} />
                      <span>대기</span>
                      <b>{fmt(s.remaining)}</b>
                    </div>
                    <div>
                      <i style={{ background: 'var(--chart-uninstalled)' }} />
                      <span>삭제</span>
                      <b>{fmt(s.uninstalled)}</b>
                    </div>
                    <div>
                      <i style={{ background: 'var(--chart-capped)' }} />
                      <span>제한됨</span>
                      <b>{fmt(s.capped)}</b>
                    </div>
                    <div>
                      <i style={{ background: 'var(--chart-failed)' }} />
                      <span>실패</span>
                      <b>{fmt(s.failed)}</b>
                    </div>
                  </Status>
                </PCard>
              );
            })}
          </Grid2>
        </Section>
        {variant.footer}
      </Cards>
      {fail && <FailureModal labels={FAIL_LABELS.push} data={m.failure} onClose={() => setFail(false)} />}
      {reason.node}
    </>
  );
}
