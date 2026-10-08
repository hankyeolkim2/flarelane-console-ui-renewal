import { useState, type ReactNode } from 'react';
import { Help, KV } from '@/components/channel/ChannelShell';
import { BlockHead, Cards, ConversionTable, DetailHeader, FAIL_LABELS, FailureModal, Section, SendStatsPanel, TargetView, usePolling, useReason, withTz, type Series } from './Detail';
import { SourceBadge } from './SentList';
import type { DetailVariant } from './PushDetail';
import { fmt, type AlimtalkMessage, type FriendtalkMessage, type SmsMessage } from '@/lib/sent';

// 알림톡 · 브랜드메시지 · 문자 보낸 메시지 상세 공용 틀 — 정보 / 메시지(채널별) / 유형 & 대상 / 분석(발송 통계 + 전환 이벤트).
// 도넛: 알림톡 · 브랜드메시지는 수신거부 제외, 문자는 포함. 10초마다 다시 불러옴.
type Msg = AlimtalkMessage | FriendtalkMessage | SmsMessage;

const points = (n: number) => `₩${n.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}`;

export default function KakaoDetail({ channel, m, message, targetExtra, variant = {} }: { channel: 'alimtalk' | 'friendtalk' | 'sms'; m: Msg; message: ReactNode; targetExtra?: ReactNode; variant?: DetailVariant }) {
  usePolling();
  const [fail, setFail] = useState(false);
  const reason = useReason();
  const withUnsub = channel === 'sms';
  const waiting = Math.max(0, m.selected - m.sent - m.failed);
  const failedOnly = Math.max(0, m.failed - m.capped - (withUnsub ? m.unsubscribed : 0));
  const series: Series[] = [
    { key: 'sent', label: '발송', value: m.sent, color: 'var(--chart-sent)' },
    { key: 'waiting', label: '대기', value: waiting, color: 'var(--chart-remaining)' },
    { key: 'capped', label: '제한됨', value: m.capped, color: 'var(--chart-capped)' },
    ...(withUnsub ? [{ key: 'unsubscribed', label: '수신거부', value: m.unsubscribed, color: 'var(--chart-uninstalled)' }] : []),
    { key: 'failed', label: '실패', value: failedOnly, color: 'var(--chart-failed)' },
  ];
  const friend = 'friendSent' in m && typeof m.friendSent === 'number' ? m : null;
  const freqChannelOn = true; // 프로젝트 빈도 제한 설정 — 스테이징 프로젝트는 켜져 있음
  return (
    <>
      <DetailHeader title={variant.title} actions={variant.headerActions} backHref={variant.backHref ?? `/${channel}/sent-history`} copyHref={variant.copy === false ? undefined : `/${channel}/new-message?copyMessageId=${m.id}`} />
      <Cards>
        <div data-detail-section="content" style={{ display: 'contents' }}>
          <Section title="정보">
            <KV
              rows={[
                ['ID', m.id],
                ...(m.campaignName ? [['캠페인 명', m.campaignName] as [ReactNode, ReactNode]] : []),
                ...(variant.infoRows ?? [
                [
                  variant.dateLabel ?? '발송 시간',
                  withTz(variant.date ?? m.createdAt),
                  <span key="l" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    발송 환경 <Help>메시지가 발송된 환경입니다.</Help>
                  </span>,
                  <SourceBadge key="b" source={m.source} />,
                ],
                  ...(m.ignoreCapping !== undefined && (freqChannelOn || m.ignoreCapping) ? [['발송 빈도 제한 무시', m.ignoreCapping ? 'TRUE' : 'FALSE'] as [ReactNode, ReactNode]] : []),
                ]),
              ]}
            />
          </Section>
          <Section title="메시지">{message}</Section>
          <Section title="유형 & 대상">
            <TargetView target={m.target} extra={targetExtra} />
          </Section>
        </div>
        <div data-detail-section="stats" style={{ display: 'contents' }}>
          <Section title="분석">
            <BlockHead icon="send" title="발송 통계" />
            <SendStatsPanel
              series={series}
              onFailDetail={() => setFail(true)}
              tiles={[
                { label: '발송', value: fmt(m.sent), download: m.sent > 0 && m.canExport ? reason.open : undefined, rows: friend ? [['친구', fmt(friend.friendSent ?? 0)], ['비친구', fmt(friend.nonFriendSent ?? 0)]] : undefined },
                { label: '발송 비용', value: points(m.usedPoints) },
              ]}
            />
            {m.conversions.length > 0 && (
              <>
                <BlockHead icon="conversion_path" title="전환 이벤트" />
                <ConversionTable conversions={m.conversions} defaultBasis="SEND" />
              </>
            )}
          </Section>
        </div>
        {variant.after}
        {variant.footer}
      </Cards>
      {fail && <FailureModal labels={channel === 'sms' ? FAIL_LABELS.sms : FAIL_LABELS.kakao} data={m.failure} onClose={() => setFail(false)} />}
      {reason.node}
    </>
  );
}
