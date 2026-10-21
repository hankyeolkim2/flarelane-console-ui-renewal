import { useRef, useState } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { Anchor, Menu, MenuItem } from '@/components/ui/Menu';
import { ConfirmModal, Dialog } from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import TextField, { FieldError } from '@/components/ui/TextField';
import { HoverTip } from '@/components/ui/Tooltip';
import { Card, CardHead, ChannelShell, Field, Stat, StatTiles } from '@/components/channel/ChannelShell';
import DataTable from '@/components/channel/DataTable';
import UnsubscribeWebhook from '@/components/channel/UnsubscribeWebhook';
import { useStore } from '@/lib/store';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma 「채널 — 이메일 — 1440」(1245:2048) · 「도메인 등록 모달」(1330:82503) 모양 + docs/staging-behavior-channel.md 동작. 값은 스테이징.
type Status = 'PENDING' | 'FAILED' | 'SUCCESS';
type Address = { id: string; email: string; displayName?: string };
type DnsRecord = { type: 'CNAME' | 'TXT' | 'MX'; name: string; value: string; verified: boolean };
type Domain = { id: string; name: string; status: Status; createdAt: string; verifiedAt: string | null; addresses: Address[] };

const HISTORY: [string, '정상' | '차단', string][] = [
  ['2026.02.24 12:45', '정상', '반송률 수동 해제'],
  ['2026.02.20 16:10', '차단', '반송률 9.07% (기준 3% 초과)'],
  ['2026.02.20 16:10', '차단', '반송률 9.07% (기준 3% 초과)'],
  ['2026.02.20 16:04', '정상', '반송률 수동 해제'],
  ['2026.02.20 16:02', '차단', '반송률 9.01% (기준 3% 초과)'],
];

const DOMAIN_RE = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*\.[a-z]{2,}$/i;
const LOCAL_RE = /^[a-z0-9](?:[a-z0-9.!#$%&'*+/=?^_`{|}~-]*[a-z0-9])?$/i;

// [임시] DNS 레코드 — 스테이징 SES 형식을 흉내 낸 값
const dnsOf = (d: Domain): DnsRecord[] => {
  const ok = d.status === 'SUCCESS';
  return [
    { type: 'CNAME', name: `fl1._domainkey.${d.name}`, value: 'fl1.dkim.amazonses.com', verified: ok },
    { type: 'CNAME', name: `fl2._domainkey.${d.name}`, value: 'fl2.dkim.amazonses.com', verified: ok },
    { type: 'TXT', name: `_dmarc.${d.name}`, value: 'v=DMARC1; p=none;', verified: ok },
    { type: 'MX', name: `mail.${d.name}`, value: '10 feedback-smtp.ap-northeast-2.amazonses.com', verified: ok },
  ];
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

function StatusBadge({ status }: { status: Status }) {
  if (status === 'PENDING')
    return (
      <HoverTip
        content={
          <>
            <b style={{ display: 'block' }}>도메인 확인 중</b>최대 48시간이 소요될 수 있습니다.
          </>
        }
      >
        <Badge color="gray">확인중</Badge>
      </HoverTip>
    );
  return <Badge color={status === 'SUCCESS' ? 'success' : 'error'}>{status === 'SUCCESS' ? '확인됨' : '미확인'}</Badge>;
}

function RowMenu({ items }: { items: { label: string; destructive?: boolean; onClick: () => void }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <Anchor ref={ref}>
      <IconButton icon="more_horiz" size="sm" label="더보기" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} />
      <Menu open={open} onClose={() => setOpen(false)} anchorRef={ref} width={160} align="end">
        {items.map((it) => (
          <MenuItem key={it.label} label={it.label} destructive={it.destructive} onClick={() => { setOpen(false); it.onClick(); }} />
        ))}
      </Menu>
    </Anchor>
  );
}

const DnsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.md}px;
  th, td { padding: 10px 12px; border-bottom: 1px solid ${color('border-secondary')}; text-align: left; vertical-align: top; }
  th { background: ${color('bg-secondary')}; ${text('text-xs', 'semibold')}; color: ${color('text-quaternary')}; }
  td { ${text('text-sm', 'regular')}; color: ${color('text-primary')}; word-break: break-all; }
  td > div { display: flex; align-items: flex-start; gap: 6px; }
  td button { flex-shrink: 0; display: inline-flex; padding: 0; border: 0; background: none; color: ${color('fg-quaternary')}; cursor: pointer; }
  td button:hover { color: ${color('fg-quaternary_hover')}; }
`;

const Check = styled.div<{ ok: boolean }>`
  display: flex;
  gap: 8px;
  padding: 12px;
  border-radius: ${radius.md}px;
  background: ${(p) => (p.ok ? color('bg-success-primary') : color('bg-error-primary'))};
  color: ${(p) => (p.ok ? color('text-success-primary') : color('text-error-primary'))};
  ${text('text-sm', 'medium')};
  ul { margin: 4px 0 0; padding-left: 16px; ${text('text-sm', 'regular')}; }
`;

export default function EmailChannel() {
  const { toast } = useStore();
  const [domains, setDomains] = useState<Domain[]>([
    { id: 'd1', name: 'flarelane3.com', status: 'FAILED', createdAt: '2026.04.06', verifiedAt: null, addresses: [] },
    {
      id: 'd2',
      name: 'noreply.flarelane.com',
      status: 'SUCCESS',
      createdAt: '2026.03.09',
      verifiedAt: '2026.03.09',
      addresses: [
        { id: 'a1', email: 'test@noreply.flarelane.com', displayName: '플레어레인' },
        { id: 'a2', email: 'mail@noreply.flarelane.com' },
      ],
    },
  ]);
  const [modal, setModal] = useState<null | 'domain' | 'address' | 'csv'>(null);
  const [domainInput, setDomainInput] = useState('');
  const [addr, setAddr] = useState({ name: '', local: '', domainId: null as string | null });
  const [reason, setReason] = useState('');
  const [csvBusy, setCsvBusy] = useState(false);
  const [dns, setDns] = useState<Domain | null>(null);
  const [dnsCheck, setDnsCheck] = useState<null | DnsRecord[]>(null);
  const [askDelete, setAskDelete] = useState<null | { kind: 'domain'; d: Domain } | { kind: 'address'; d: Domain; a: Address }>(null);

  const copy = (v: string) =>
    navigator.clipboard?.writeText(v).then(
      () => toast('클립보드에 복사되었습니다.'),
      () => toast('클립보드로 복사하는 데 실패했습니다.'),
    );

  const domainInvalid = !!domainInput && !DOMAIN_RE.test(domainInput);
  const localInvalid = !!addr.local && !LOCAL_RE.test(addr.local);

  const rows = domains.flatMap((d) => [
    {
      key: d.id,
      cells: [
        d.name,
        <StatusBadge key="b" status={d.status} />,
        d.createdAt,
        d.verifiedAt ?? '-',
        <RowMenu
          key="m"
          items={[
            { label: '상태 갱신', onClick: () => toast('상태가 갱신되었습니다.') },
            { label: 'DNS 정보', onClick: () => { setDns(d); setDnsCheck(null); } },
            { label: '도메인 삭제', destructive: true, onClick: () => setAskDelete({ kind: 'domain', d }) },
          ]}
        />,
      ],
    },
    ...d.addresses.map((a) => ({
      key: a.id,
      sub: true,
      cells: [
        <span key="e" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ color: 'var(--fg-quaternary)' }}>└</span>
          {a.email}
          {a.displayName && <span style={{ color: 'var(--text-tertiary)' }}>({a.displayName})</span>}
        </span>,
        '',
        '',
        '',
        <RowMenu key="m" items={[{ label: '이메일 삭제', destructive: true, onClick: () => setAskDelete({ kind: 'address', d, a }) }]} />,
      ],
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
              <Button onClick={() => { setAddr({ name: '', local: '', domainId: null }); setModal('address'); }}>발신 이메일 추가</Button>
              <Button hierarchy="primary" onClick={() => { setDomainInput(''); setModal('domain'); }}>도메인 등록</Button>
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
          <Button icon="download" aria-label="다운로드" disabled={csvBusy} onClick={() => (csvBusy ? window.alert('이미 CSV 다운로드가 진행중입니다.') : (setReason(''), setModal('csv')))} />
        </div>
      </Card>
      <UnsubscribeWebhook channel="email" initial="https://example.com" />

      {modal === 'domain' && (
        <Dialog
          title="도메인 등록"
          onClose={() => setModal(null)}
          footer={
            <>
              <Button size="md" onClick={() => setModal(null)}>취소</Button>
              <Button
                hierarchy="primary"
                size="md"
                disabled={!domainInput || domainInvalid}
                onClick={() => {
                  setDomains((l) => [...l, { id: `d${Date.now()}`, name: domainInput.trim(), status: 'PENDING', createdAt: today(), verifiedAt: null, addresses: [] }]);
                  toast('도메인이 등록되었습니다.');
                  setModal(null);
                }}
              >
                확인
              </Button>
            </>
          }
        >
          <Field>
            <label htmlFor="domain">도메인 주소</label>
            <div>
              <TextField id="domain" autoFocus error={domainInvalid} placeholder="flarelane.com / mail.flarelane.com" value={domainInput} onChange={(e) => setDomainInput(e.target.value)} />
              {domainInvalid && <FieldError>올바른 도메인 주소를 입력해주세요.</FieldError>}
            </div>
          </Field>
        </Dialog>
      )}

      {modal === 'address' && (
        <Dialog
          title="발신 이메일 추가"
          onClose={() => setModal(null)}
          footer={
            <>
              <Button size="md" onClick={() => setModal(null)}>취소</Button>
              <Button
                hierarchy="primary"
                size="md"
                disabled={!addr.local || localInvalid || !addr.domainId}
                onClick={() => {
                  const d = domains.find((x) => x.id === addr.domainId)!;
                  setDomains((l) => l.map((x) => (x.id === d.id ? { ...x, addresses: [...x.addresses, { id: `a${Date.now()}`, email: `${addr.local}@${d.name}`, displayName: addr.name.trim() || undefined }] } : x)));
                  toast('이메일이 추가되었습니다.');
                  setModal(null);
                }}
              >
                확인
              </Button>
            </>
          }
        >
          <Field>
            <label htmlFor="sender">발송자명 (선택)</label>
            <TextField id="sender" placeholder="수신자에게 표시되는 발신자 이름입니다" value={addr.name} onChange={(e) => setAddr({ ...addr, name: e.target.value })} />
          </Field>
          <Field>
            <span data-label>이메일 주소 · 도메인</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TextField error={localInvalid} value={addr.local} onChange={(e) => setAddr({ ...addr, local: e.target.value })} />
              <span style={{ color: 'var(--text-tertiary)' }}>@</span>
              <Select
                width={200}
                value={addr.domainId}
                placeholder={domains.length ? '도메인 선택' : '(확인된 도메인 없음)'}
                options={domains.map((d) => ({ value: d.id, label: d.name }))}
                onChange={(v) => setAddr({ ...addr, domainId: v })}
              />
            </div>
            {localInvalid && <FieldError>올바른 이메일 주소를 입력해주세요.</FieldError>}
          </Field>
        </Dialog>
      )}

      {modal === 'csv' && (
        <Dialog
          title="CSV 다운로드"
          onClose={() => setModal(null)}
          footer={
            <>
              <Button size="md" onClick={() => setModal(null)}>취소</Button>
              <Button
                hierarchy="primary"
                size="md"
                disabled={!reason.trim()}
                onClick={() => {
                  setModal(null);
                  setCsvBusy(true);
                  // 스테이징은 10초마다 준비 상태를 확인하고 완료되면 내려받음
                  setTimeout(() => {
                    setCsvBusy(false);
                    toast('수신거부 목록 CSV를 내려받았습니다.');
                  }, 2000);
                }}
              >
                다운로드
              </Button>
            </>
          }
        >
          <Field>
            <label htmlFor="reason">다운로드 사유 입력</label>
            <TextField id="reason" autoFocus placeholder="다운로드 사유를 입력해 주세요." value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </Dialog>
      )}

      {dns && (
        <Dialog
          title="도메인 인증 DNS 설정"
          width={720}
          onClose={() => setDns(null)}
          footer={
            <>
              <Button size="md" onClick={() => setDnsCheck(dnsOf(dns).filter((r) => !r.verified))}>검사</Button>
              <Button hierarchy="primary" size="md" onClick={() => setDns(null)}>확인</Button>
            </>
          }
        >
          {(['CNAME', 'TXT', 'MX'] as const).map((type) => (
            <Field key={type}>
              <span data-label>{type}</span>
              <DnsTable>
                <thead>
                  <tr>
                    <th style={{ width: '45%' }}>Name</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {dnsOf(dns)
                    .filter((r) => r.type === type)
                    .map((r) => (
                      <tr key={r.name + r.value}>
                        {[r.name, r.value].map((v) => (
                          <td key={v}>
                            <div>
                              <span style={{ flex: 1 }}>{v}</span>
                              <button type="button" aria-label="복사" onClick={() => copy(v)}>
                                <Icon name="content_copy" size={16} />
                              </button>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </DnsTable>
            </Field>
          ))}
          {dnsCheck && (
            <Check ok={dnsCheck.length === 0}>
              <Icon name={dnsCheck.length ? 'error' : 'check'} size={20} />
              <div>
                {dnsCheck.length ? 'DNS 레코드 설정을 확인해주세요' : '설정이 모두 확인되었습니다'}
                {dnsCheck.length > 0 && (
                  <ul>
                    {dnsCheck.map((r) => (
                      <li key={r.name + r.value}>{`Name: ${r.name}`}</li>
                    ))}
                  </ul>
                )}
              </div>
            </Check>
          )}
        </Dialog>
      )}

      {askDelete && (
        <ConfirmModal
          title={askDelete.kind === 'domain' ? '도메인을 삭제하시겠습니까?' : '이메일을 삭제하시겠습니까?'}
          description={askDelete.kind === 'domain' ? '삭제된 도메인은 복구할 수 없습니다.' : '삭제된 이메일은 복구할 수 없습니다.'}
          cancelLabel="취소"
          confirmLabel="삭제"
          destructive
          onClose={() => setAskDelete(null)}
          onConfirm={() => {
            if (askDelete.kind === 'domain') {
              setDomains((l) => l.filter((x) => x.id !== askDelete.d.id));
              toast('도메인이 삭제되었습니다.');
            } else {
              setDomains((l) => l.map((x) => (x.id === askDelete.d.id ? { ...x, addresses: x.addresses.filter((y) => y.id !== askDelete.a.id) } : x)));
              toast('이메일이 삭제되었습니다.');
            }
            setAskDelete(null);
          }}
        />
      )}
    </ChannelShell>
  );
}
