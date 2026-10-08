import { useState } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { Dialog } from '@/components/ui/Modal';
import { Help, KV } from '@/components/channel/ChannelShell';
import { BlockHead, Cards, ConversionTable, DetailHeader, FAIL_LABELS, FailureModal, Section, SendStatsPanel, TargetView, useReason, withTz } from './Detail';
import { MsgCols, PreviewCol } from './MessageLayout';
import { SourceBadge } from './SentList';
import { fmt, pct, type EmailMessage } from '@/lib/sent';
import type { DetailVariant } from './PushDetail';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma 「이메일 — 보낸 메시지 상세」(1194:28226) + docs 4.5 — 폴링 없음, 발송 비용 없음, 도넛에 수신거부 포함, 실패 모달은 비율 표시.
const Thumb = styled.button`
  position: relative;
  height: 360px;
  padding: 0;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.md}px;
  background: ${color('bg-secondary')};
  overflow: hidden;
  cursor: zoom-in;
  > iframe { width: 640px; height: 900px; border: 0; transform: scale(0.5); transform-origin: 0 0; pointer-events: none; background: #fff; }
  &:hover { border-color: ${color('border-primary')}; }
`;

const Seg = styled.div`
  display: inline-flex;
  gap: 4px;
  > button { display: inline-flex; padding: 6px; border: 0; border-radius: ${radius.sm}px; background: transparent; color: ${color('fg-quaternary')}; cursor: pointer; }
  > button[aria-pressed='true'] { background: ${color('bg-primary_hover')}; color: ${color('fg-secondary')}; }
`;

const Title = styled.p`
  margin: 0;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
`;

export default function EmailDetail({ m, variant = {} }: { m: EmailMessage; variant?: DetailVariant }) {
  const [preview, setPreview] = useState(false);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [fail, setFail] = useState(false);
  const reason = useReason();
  const failedTotal = m.failed + m.aborted;
  return (
    <>
      <DetailHeader title={variant.title} actions={variant.headerActions} backHref={variant.backHref ?? '/email/sent-history'} copyHref={variant.copy === false ? undefined : `/email/new-message?copyMessageId=${m.id}`} />
      <Cards>
        <Section title="정보">
          <KV
            rows={[
              ['ID', m.id],
              ['캠페인 명', m.campaignName ?? '-'],
              ...(variant.infoRows ?? [
              [
                variant.dateLabel ?? '발송 시간',
                withTz(variant.date ?? m.createdAt),
                <span key="l" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  발송 환경 <Help>메시지가 발송된 환경입니다.</Help>
                </span>,
                <SourceBadge key="b" source={m.source} />,
              ],
                ['발송 빈도 제한 무시', m.ignoreCapping ? 'TRUE' : 'FALSE'],
              ]),
            ]}
          />
        </Section>
        <Section title="메시지">
          <MsgCols>
            <KV
              rows={[
                ['발신자 정보', `${m.senderEmail} (플레어레인)`],
                ['이메일 제목', m.title],
              ]}
            />
            {m.body && (
              <PreviewCol>
                <small>본문</small>
                <Thumb type="button" aria-label="미리보기" onClick={() => setPreview(true)}>
                  <iframe title="본문" srcDoc={m.body} sandbox="" tabIndex={-1} />
                </Thumb>
              </PreviewCol>
            )}
          </MsgCols>
        </Section>
        <Section title="유형 & 대상">
          <TargetView target={m.target} />
        </Section>
        <Section title="분석">
          <BlockHead icon="monitoring" title="전체 통계" />
          <SendStatsPanel
            series={[
              { key: 'sent', label: '발송', value: m.delivered, color: 'var(--chart-sent)' },
              { key: 'waiting', label: '대기', value: m.pending, color: 'var(--chart-remaining)' },
              { key: 'capped', label: '제한됨', value: m.capped, color: 'var(--chart-capped)' },
              { key: 'unsubscribed', label: '수신거부', value: m.unsubscribed, color: 'var(--chart-uninstalled)' },
              { key: 'failed', label: '실패', value: failedTotal, color: 'var(--chart-failed)' },
            ]}
            onFailDetail={() => setFail(true)}
            tiles={[
              { label: '발송', value: fmt(m.delivered), download: m.delivered > 0 && m.canExport ? reason.open : undefined },
              { label: '읽음', value: fmt(m.opened), sub: `(${pct(m.opened, m.delivered)})`, download: m.opened > 0 ? reason.open : undefined },
            ]}
          />
          {m.conversions.length > 0 && (
            <>
              <BlockHead icon="conversion_path" title="전환 이벤트" />
              <ConversionTable conversions={m.conversions} defaultBasis="CLICK" />
            </>
          )}
        </Section>
        {variant.after}
        {variant.footer}
      </Cards>
      {preview && (
        <Dialog title="이메일 미리보기" width={device === 'desktop' ? 760 : 440} onClose={() => setPreview(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Title style={{ flex: 1 }}>{m.title}</Title>
            <Seg>
              <button type="button" aria-label="데스크톱" aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')}>
                <Icon name="desktop_windows" size={20} />
              </button>
              <button type="button" aria-label="모바일" aria-pressed={device === 'mobile'} onClick={() => setDevice('mobile')}>
                <Icon name="smartphone" size={20} />
              </button>
            </Seg>
          </div>
          <iframe title="이메일 미리보기" srcDoc={m.body} sandbox="" style={{ width: '100%', height: 520, border: '1px solid var(--border-secondary)', borderRadius: 8 }} />
        </Dialog>
      )}
      {fail && (
        <FailureModal
          labels={FAIL_LABELS.email}
          ratio
          data={{ SOFT_BOUNCED: m.softBounced, HARD_BOUNCED: m.hardBounced, QUOTA_EXCEEDED: m.quotaExceeded, DELIVERED_FAILED: Math.max(0, m.failed - (m.softBounced + m.hardBounced + m.quotaExceeded)), ETC: m.aborted }}
          onClose={() => setFail(false)}
        />
      )}
      {reason.node}
    </>
  );
}
