import { useRef, useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { Anchor, Menu, MenuItem } from '@/components/ui/Menu';
import { Dialog } from '@/components/ui/Modal';
import TextField from '@/components/ui/TextField';
import { Card, CardHead, ChannelShell, Field, Stat, StatTiles } from '@/components/channel/ChannelShell';
import DataTable from '@/components/channel/DataTable';
import { useStore } from '@/lib/store';

// Figma 「채널 — 이메일 — 1440」(1245:2048) · 「도메인 등록 모달」(1330:82503) — 값은 스테이징.
type Domain = { name: string; verified: boolean; createdAt: string; verifiedAt: string | null; senders: string[] };

const HISTORY: [string, '정상' | '차단', string][] = [
  ['2026.02.24 12:45', '정상', '반송률 수동 해제'],
  ['2026.02.20 16:10', '차단', '반송률 9.07% (기준 3% 초과)'],
  ['2026.02.20 16:10', '차단', '반송률 9.07% (기준 3% 초과)'],
  ['2026.02.20 16:04', '정상', '반송률 수동 해제'],
  ['2026.02.20 16:02', '차단', '반송률 9.01% (기준 3% 초과)'],
];

function RowMenu({ items }: { items: { label: string; destructive?: boolean; onClick: () => void }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <Anchor ref={ref}>
      <IconButton icon="more_horiz" size="sm" label="더보기" onClick={() => setOpen((v) => !v)} />
      <Menu open={open} onClose={() => setOpen(false)} anchorRef={ref} width={160} align="end">
        {items.map((it) => (
          <MenuItem key={it.label} label={it.label} destructive={it.destructive} onClick={() => { setOpen(false); it.onClick(); }} />
        ))}
      </Menu>
    </Anchor>
  );
}

export default function EmailChannel() {
  const { toast } = useStore();
  const [domains, setDomains] = useState<Domain[]>([
    { name: 'flarelane3.com', verified: false, createdAt: '2026.04.06', verifiedAt: null, senders: [] },
    { name: 'noreply.flarelane.com', verified: true, createdAt: '2026.03.09', verifiedAt: '2026.03.09', senders: ['test@noreply.flarelane.com', 'mail@noreply.flarelane.com'] },
  ]);
  const [domainModal, setDomainModal] = useState(false);
  const [domainDraft, setDomainDraft] = useState('');
  const [webhook, setWebhook] = useState('https://example.com');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const rows = domains.flatMap((d) => [
    {
      key: d.name,
      cells: [
        d.name,
        <Badge key="b" color={d.verified ? 'success' : 'error'}>{d.verified ? '확인됨' : '미확인'}</Badge>,
        d.createdAt,
        d.verifiedAt ?? '-',
        <RowMenu key="m" items={[{ label: '삭제', destructive: true, onClick: () => setDomains((l) => l.filter((x) => x.name !== d.name)) }]} />,
      ],
    },
    ...d.senders.map((s) => ({
      key: s,
      sub: true,
      cells: [`└  ${s}`, '', '', '', <RowMenu key="m" items={[{ label: '삭제', destructive: true, onClick: () => setDomains((l) => l.map((x) => (x.name === d.name ? { ...x, senders: x.senders.filter((y) => y !== s) } : x))) }]} />],
    })),
  ]);

  return (
    <ChannelShell current="email" title="이메일">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
        <Card>
          <CardHead title="발송 상태" />
          <Stat value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><i style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--fg-success-secondary)' }} />정상</span>} />
        </Card>
        <Card>
          <CardHead title="관리 지표" />
          <StatTiles cols={2}>
            <Stat label="반송률" value="0%" />
            <Stat label="스팸률" value="0%" />
          </StatTiles>
        </Card>
        <Card>
          <CardHead title="월 발송량 및 한도" />
          <Stat value="0 / 1,100" sub="남은 발송 가능량: 1,100" />
        </Card>
      </div>
      <Card>
        <CardHead title="발송 상태 이력" />
        <DataTable
          columns={[{ label: '발생 시각', width: '200px' }, { label: '상태', width: '140px' }, { label: '사유', width: 'minmax(0,1fr)' }]}
          rows={HISTORY.map(([t, s, r], i) => ({ key: String(i), cells: [t, <Badge key="b" color={s === '정상' ? 'success' : 'error'}>{s}</Badge>, r] }))}
        />
      </Card>
      <Card>
        <CardHead
          title="도메인 및 발신 이메일"
          actions={
            <>
              <Button>발신 이메일 추가</Button>
              <Button hierarchy="primary" onClick={() => { setDomainDraft(''); setDomainModal(true); }}>도메인 등록</Button>
            </>
          }
        />
        <DataTable
          columns={[{ label: '도메인', width: 'minmax(0,1fr)' }, { label: '상태', width: '140px' }, { label: '등록일', width: '160px' }, { label: '최종 검증일', width: '160px' }, { label: '', width: '64px' }]}
          rows={rows}
        />
      </Card>
      <Card>
        <CardHead title="수신거부" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 8, background: 'var(--bg-secondary)' }}>
          <div style={{ flex: 1 }}>
            <Stat bare label="등록된 수신거부 수" value="33" />
          </div>
          <Button icon="download" aria-label="수신거부 목록 다운로드" onClick={() => toast('수신거부 목록을 내려받았습니다.')} />
        </div>
      </Card>
      <Card>
        <CardHead title="수신거부 웹훅 설정" help="수신거부가 등록되면 이 주소로 알려 드립니다." />
        {editing ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <TextField autoFocus value={draft} placeholder="https://" onChange={(e) => setDraft(e.target.value)} />
            <Button onClick={() => setEditing(false)}>취소</Button>
            <Button hierarchy="primary" onClick={() => { setWebhook(draft.trim()); setEditing(false); }}>저장</Button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: '20px', color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>{webhook || '-'}</span>
            <Button hierarchy="primary" onClick={() => { setDraft(webhook); setEditing(true); }}>수정</Button>
          </div>
        )}
      </Card>
      {domainModal && (
        <Dialog
          title="도메인 등록"
          onClose={() => setDomainModal(false)}
          footer={
            <>
              <Button size="md" onClick={() => setDomainModal(false)}>취소</Button>
              <Button
                hierarchy="primary"
                size="md"
                disabled={!domainDraft.trim()}
                onClick={() => {
                  setDomains((l) => [{ name: domainDraft.trim(), verified: false, createdAt: '2026.10.08', verifiedAt: null, senders: [] }, ...l]);
                  setDomainModal(false);
                }}
              >
                확인
              </Button>
            </>
          }
        >
          <Field>
            <label htmlFor="domain">도메인 주소</label>
            <TextField id="domain" autoFocus placeholder="flarelane.com / mail.flarelane.com" value={domainDraft} onChange={(e) => setDomainDraft(e.target.value)} />
          </Field>
        </Dialog>
      )}
    </ChannelShell>
  );
}
