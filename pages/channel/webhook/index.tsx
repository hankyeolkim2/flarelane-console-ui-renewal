import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import { ChannelShell } from '@/components/channel/ChannelShell';
import DataTable, { Dot, Sub } from '@/components/channel/DataTable';
import { abbr, failRate, webhookTone } from '@/lib/webhooks';
import { useStore } from '@/lib/store';

// Figma 「채널 — 웹훅 — 1440」(1245:3454) — 표를 감싸는 카드 없이 표가 바로 본문에(사용자). 행 전체 클릭 → 상세.
export default function WebhookList() {
  const router = useRouter();
  const { webhooks } = useStore();
  return (
    <ChannelShell current="webhook" title="웹훅" actions={<Button hierarchy="primary" size="md" onClick={() => router.push('/channel/webhook/new')}>새 웹훅</Button>}>
      <DataTable
        card
        columns={[{ label: '정보', width: 'minmax(0,1fr)' }, { label: '성공 (최근 30일)', width: '140px' }, { label: '실패 (최근 30일)', width: '160px' }, { label: '상태', width: '64px' }]}
        rows={webhooks.map((w) => ({
          key: w.id,
          onClick: () => router.push(`/channel/webhook/${w.id}`),
          cells: [
            <div key="i" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</span>
              <Sub>{`${w.method} ${w.url}`}</Sub>
            </div>,
            abbr(w.success30),
            failRate(w),
            <Dot key="d" tone={webhookTone(w)} />,
          ],
        }))}
      />
    </ChannelShell>
  );
}
