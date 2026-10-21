import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { DateRangeMenu } from '@/components/ui/DatePicker';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Floating from '@/components/ui/Floating';
import IconButton from '@/components/ui/IconButton';
import { MenuItem } from '@/components/ui/Menu';
import { ConfirmModal, Dialog } from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { UnderlineTabs } from '@/components/ui/Tabs';
import TextField, { FieldError } from '@/components/ui/TextField';
import Toggle from '@/components/ui/Toggle';
import { Card, CardHead, Help } from '@/components/channel/ChannelShell';
import DataTable from '@/components/channel/DataTable';
import { ReasonField } from '@/components/sent/Reason';
import { EmptyList, PageTitle } from '@/components/sent/SentList';
import { addDays, TODAY, ymd } from '@/lib/editor';
import { useStore } from '@/lib/store';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 고객 데이터 연동 — Figma 「고객 데이터 연동」(1109:10546) + docs/staging-behavior-dashboard-settings.md 3장.
// 최근 이벤트: ID · Event Type 입력만으로는 다시 안 불러옴(기간 확인 · 새로고침 때 반영, 새로고침 뒤 5초 비활성).
// 이벤트 · 태그: 숨김 = 브라우저 확인창, 숨김 해제 · 추가 · 수정 · 삭제는 토스트 없음. 행 클릭 = 오른쪽 상세 패널 800. ?n=e · ?n=t = 추가 모달 바로 열림.
type Item = { id: string; name: string; description: string; hidden: boolean; readOnly?: boolean; trends?: number[]; data?: { key: string; description: string; examples: string[] }[]; syncRate?: number | null; examples?: string[] };
const AUTO = 'FLARELANE_AUTO_SYNC';
const NAME_RE = /^[A-Za-z0-9_]*$/;

const eventsData: Item[] = [
  { id: 'e1', name: '걷', description: '설명', hidden: false, trends: Array(14).fill(0) },
  { id: 'e2', name: '겇', description: AUTO, hidden: false, trends: Array(14).fill(0) },
  { id: 'e3', name: '뗄', description: AUTO, hidden: false, trends: Array(14).fill(0) },
  { id: 'e4', name: '뱐', description: AUTO, hidden: false, trends: Array(14).fill(0) },
  { id: 'e5', name: 'purchase_completed', description: '구매 완료', hidden: false, trends: [3, 5, 2, 8, 4, 6, 9, 3, 7, 12, 4, 6, 8, 10], data: [{ key: 'price', description: '결제 금액', examples: ['29000', '15000', '4500'] }, { key: 'product_id', description: '상품 ID', examples: ['P-102', 'P-993'] }] },
  { id: 'e6', name: 'fw_journey_test', description: '여정 테스트', hidden: false, trends: [0, 0, 1, 0, 2, 0, 0, 0, 1, 0, 0, 3, 0, 1] },
  { id: 'e7', name: 'old_event', description: '', hidden: true },
  { id: 'e8', name: '@iam_displayed', description: '인앱 메시지 노출', hidden: false, readOnly: true, trends: [12, 30, 22, 18, 40, 25, 33, 20, 28, 31, 22, 19, 26, 35] },
];
const tagsData: Item[] = [
  { id: 't1', name: 'grade', description: '회원 등급', hidden: false, syncRate: 0.412, examples: ['GOLD', 'SILVER', 'VIP'] },
  { id: 't2', name: 'name', description: AUTO, hidden: false, syncRate: 0.083, examples: ['테스트'] },
  { id: 't3', name: 'landing', description: '', hidden: false, syncRate: null },
  { id: 't4', name: 'legacy_flag', description: '', hidden: true, syncRate: 0 },
];
const PURCHASE = 'purchase_completed';

const RECENT = [
  ['2026.10.03 20:44:40', 'fw_journey_test', 'user', 'mh4dev', '{"word":"바카라"}'],
  ['2026.09.29 13:11:39', 'soob5', 'user', 'soob', '{}'],
  ['2026.09.29 13:11:19', '@iam_closed', 'user', 'soob', '{"dontShowMinutes":1440,"iamId":"295dc7fe-be8e-4626-bb1b-921cf90b9373"}'],
  ['2026.09.29 12:49:33', '@iam_displayed', 'user', 'soob', '{"iamId":"295dc7fe-be8e-4626-bb1b-921cf90b9373"}'],
  ['2026.09.29 12:49:33', 'deferred', 'user', 'soob', '{}'],
  ['2026.09.28 09:12:02', 'purchase_completed', 'device', '3f2a91-b21-4d1e', '{"price":29000}'],
];

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
  white-space: nowrap;
  cursor: pointer;
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
`;

const Drawer = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 45;
  display: flex;
  flex-direction: column;
  width: 800px;
  max-width: 100vw;
  background: ${color('bg-primary')};
  border-left: 1px solid ${color('border-secondary')};
  box-shadow: ${shadow.xl};
  > header { display: flex; align-items: center; gap: 8px; padding: 20px 24px; border-bottom: 1px solid ${color('border-secondary')}; }
  > header > h2 { flex: 1; margin: 0; ${text('text-lg', 'semibold')}; color: ${color('text-primary')}; }
  > div { flex: 1; overflow: auto; display: flex; flex-direction: column; gap: 16px; padding: 24px; }
  > footer { display: flex; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid ${color('border-secondary')}; }
`;

const Label = styled.span`
  display: block;
  margin-bottom: 6px;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
`;

const Inline = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  ${text('text-sm', 'regular')};
  color: ${color('text-tertiary')};
  > b { ${text('text-md', 'semibold')}; color: ${color('text-primary')}; }
  > span > em { margin-left: 6px; font-style: normal; color: ${color('text-primary')}; }
  > i { flex: 1; }
`;

const shortNum = (n: number) => (n >= 1e6 ? `${Math.floor(n / 1e5) / 10}M` : n >= 1000 ? `${Math.floor(n / 100) / 10}k` : String(n));

function Spark({ v }: { v: number[] }) {
  const max = Math.max(1, ...v);
  const pts = v.map((x, i) => `${(i / (v.length - 1)) * 116 + 2},${22 - (x / max) * 20}`);
  const last = pts[pts.length - 1].split(',');
  return (
    <svg width="120" height="24" viewBox="0 0 120 24">
      <polyline points={pts.join(' ')} fill="none" stroke="var(--chart-clicked)" strokeWidth="1.5" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill="var(--chart-clicked)" />
    </svg>
  );
}

function ItemMenu({ it, purchase, onHide, onEdit, onDelete }: { it: Item; purchase: boolean; onHide: () => void; onEdit: () => void; onDelete: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  if (it.readOnly) return null;
  return (
    <span onClick={(e) => e.stopPropagation()}>
      <button ref={ref} type="button" aria-label="더 보기" onClick={() => setOpen((v) => !v)} style={{ display: 'inline-flex', width: 32, height: 32, alignItems: 'center', justifyContent: 'center', border: 0, borderRadius: 8, background: 'transparent', color: 'var(--fg-quaternary)', cursor: 'pointer' }}>
        <Icon name="more_horiz" size={20} />
      </button>
      <Floating anchorRef={ref} open={open} onClose={() => setOpen(false)} width={160} offset={4}>
        <div style={{ padding: '4px 0' }}>
          <MenuItem label={it.hidden ? '숨김 해제' : '숨김'} onClick={() => { setOpen(false); onHide(); }} />
          <MenuItem label="수정" onClick={() => { setOpen(false); onEdit(); }} />
          {!purchase && <MenuItem label="삭제" destructive onClick={() => { setOpen(false); onDelete(); }} />}
        </div>
      </Floating>
    </span>
  );
}

function ItemModal({ kind, item, onClose, onSave }: { kind: 'event' | 'tag'; item?: Item; onClose: () => void; onSave: (it: Item) => void }) {
  const [name, setName] = useState(item?.name ?? '');
  const [touched, setTouched] = useState(false);
  const [desc, setDesc] = useState(item && item.description !== AUTO ? item.description : '');
  const [props, setProps] = useState<{ key: string; description: string; isNew?: boolean; touched?: boolean }[]>(item?.data?.map((d) => ({ key: d.key, description: d.description })) ?? []);
  const label = kind === 'event' ? '이벤트' : '태그';
  const badName = !item && !NAME_RE.test(name);
  const badKey = props.some((p) => p.isNew && !NAME_RE.test(p.key));
  return (
    <Dialog
      title={`${label} ${item ? '수정' : '추가'}`}
      width={560}
      onClose={onClose}
      footer={
        <>
          <Button size="md" onClick={onClose}>취소</Button>
          <Button
            hierarchy="primary"
            size="md"
            disabled={!name.trim() || badName || badKey}
            onClick={() =>
              onSave({
                id: item?.id ?? `${kind[0]}${Date.now()}`,
                name: name.trim(),
                description: desc.trim(),
                hidden: item?.hidden ?? false,
                trends: item?.trends,
                syncRate: item?.syncRate,
                examples: item?.examples,
                data: kind === 'event' ? props.filter((p) => p.key.trim()).map((p) => ({ key: p.key.trim(), description: p.description.trim(), examples: item?.data?.find((d) => d.key === p.key)?.examples ?? [] })) : undefined,
              })
            }
          >
            확인
          </Button>
        </>
      }
    >
      <div>
        <Label>{`${label} *`}</Label>
        <TextField readOnly={!!item} maxLength={100} error={touched && badName} placeholder={`${label} 이름을 입력해 주세요.`} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} />
        {touched && badName && <FieldError>영문, 숫자, 언더바(_)만 입력할 수 있습니다.</FieldError>}
      </div>
      <div>
        <Label>설명</Label>
        <TextField maxLength={500} placeholder="어떤 데이터인지 설명해 주세요." value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>
      {kind === 'event' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Label style={{ flex: 1, margin: 0 }}>속성</Label>
            <Button hierarchy="tertiary" iconLeading="add" disabled={props.length >= 100} onClick={() => setProps((l) => [{ key: '', description: '', isNew: true }, ...l])}>
              추가하기
            </Button>
          </div>
          {props.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 36px', gap: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-quaternary)' }}>
              <span>속성명</span>
              <span>속성 설명</span>
              <span />
            </div>
          )}
          {props.map((p, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 36px', gap: 8, alignItems: 'start' }}>
              <div>
                <TextField readOnly={!p.isNew} maxLength={100} error={p.touched && p.isNew && !NAME_RE.test(p.key)} placeholder="예: product_id" value={p.key} onChange={(e) => setProps((l) => l.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} onBlur={() => setProps((l) => l.map((x, j) => (j === i ? { ...x, touched: true } : x)))} />
                {p.touched && p.isNew && !NAME_RE.test(p.key) && <FieldError>영문, 숫자, 언더바(_)만 입력할 수 있습니다.</FieldError>}
              </div>
              <TextField maxLength={500} placeholder="어떤 값인지 설명해 주세요." value={p.description} onChange={(e) => setProps((l) => l.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
              <IconButton icon="do_not_disturb_on" label="삭제" onClick={() => setProps((l) => l.filter((_, j) => j !== i))} />
            </div>
          ))}
        </div>
      )}
    </Dialog>
  );
}

function ExportModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [on, setOn] = useState(false);
  const [arn, setArn] = useState('');
  const [bucket, setBucket] = useState('');
  const [prefix, setPrefix] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const groups: [string, string[]][] = [
    ['푸시 알림', ['push_sent', 'push_clicked']],
    ['문자', ['sms_sent']],
    ['카카오톡', ['kakao_alimtalk_sent', 'kakao_friendtalk_sent']],
    ['이메일', ['email_delivered', 'email_opened', 'email_clicked']],
    ['인앱 메시지', ['iam_displayed', 'iam_clicked']],
  ];
  return (
    <Dialog
      title="이벤트 데이터 내보내기 설정"
      width={600}
      onClose={onClose}
      actions={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
          활성화 <Toggle label="활성화" checked={on} onChange={setOn} />
        </span>
      }
      footer={
        <>
          <Button size="md" onClick={onClose}>취소</Button>
          <Button hierarchy="primary" size="md" disabled={on && !(arn && bucket && prefix)} onClick={onSave}>
            저장
          </Button>
        </>
      }
    >
      <div>
        <Label>
          AWS Role ARN{' '}
          <a href="https://docs.flarelane.co.kr/export-crm-events" target="_blank" rel="noreferrer" style={{ marginLeft: 8, color: 'var(--text-brand-secondary)' }}>
            가이드 바로가기
          </a>
        </Label>
        <TextField placeholder="AWS Role ARN을 입력해 주세요." value={arn} onChange={(e) => setArn(e.target.value)} />
      </div>
      <div>
        <Label>AWS S3 Bucket Name</Label>
        <TextField placeholder="S3 Bucket Name을 입력해 주세요." value={bucket} onChange={(e) => setBucket(e.target.value)} />
      </div>
      <div>
        <Label>AWS S3 Bucket Prefix</Label>
        <TextField maxLength={512} placeholder="AWS S3 Bucket Prefix를 입력해 주세요." value={prefix} onChange={(e) => setPrefix(e.target.value)} />
      </div>
      <div>
        <Label>내보낼 이벤트 선택</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups.map(([g, evs]) => (
            <div key={g}>
              <b style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-quaternary)' }}>{g}</b>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {evs.map((e) => (
                  <span key={e} role="checkbox" aria-checked={picked.includes(e)} onClick={() => setPicked((l) => (l.includes(e) ? l.filter((x) => x !== e) : [...l, e]))} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                    <Checkbox checked={picked.includes(e)} />
                    {e}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  );
}

export default function DataManagement() {
  const router = useRouter();
  const { toast } = useStore();
  const [by, setBy] = useState<'user' | 'device'>('user');
  const [id, setId] = useState('');
  const [type, setType] = useState('');
  const [range, setRange] = useState({ from: ymd(addDays(TODAY, -7)), to: ymd(TODAY) });
  const [applied, setApplied] = useState({ by: 'user', id: '', type: '' });
  const [cool, setCool] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const rangeRef = useRef<HTMLButtonElement>(null);
  const [csv, setCsv] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [tab, setTab] = useState<'event' | 'tag'>('event');
  const [showHidden, setShowHidden] = useState({ event: false, tag: false });
  const [evs, setEvs] = useState(eventsData);
  const [tgs, setTgs] = useState(tagsData);
  const [modal, setModal] = useState<null | { kind: 'event' | 'tag'; item?: Item }>(null);
  const [del, setDel] = useState<null | { kind: 'event' | 'tag'; item: Item }>(null);
  const [panel, setPanel] = useState<null | { kind: 'event' | 'tag'; item: Item }>(null);

  useEffect(() => {
    const n = router.query.n;
    if (n === 'e' || n === 't') {
      setTab(n === 'e' ? 'event' : 'tag');
      setModal({ kind: n === 'e' ? 'event' : 'tag' });
    }
  }, [router.query.n]);

  const recent = RECENT.filter((r) => (!applied.type || r[1] === applied.type) && (!applied.id || (r[2] === applied.by && r[3] === applied.id)));
  const list = (tab === 'event' ? evs : tgs).filter((x) => showHidden[tab] || !x.hidden);
  const copy = (v: string) => navigator.clipboard?.writeText(v).then(() => toast('클립보드에 복사되었습니다.'), () => toast('클립보드로 복사하는 데 실패했습니다.'));
  const hide = (kind: 'event' | 'tag', it: Item) => {
    const set = kind === 'event' ? setEvs : setTgs;
    if (!it.hidden) {
      const ok = window.confirm(kind === 'event' ? '이벤트를 숨기시겠습니까?\n숨긴 이벤트는 이벤트 선택 리스트에서 노출되지 않습니다.' : '태그를 숨기시겠습니까?\n숨긴 태그는 태그 선택 리스트에서 노출되지 않습니다.');
      if (!ok) return;
    }
    set((l) => l.map((x) => (x.id === it.id ? { ...x, hidden: !x.hidden } : x)));
  };
  const descOf = (d: string) => (d === AUTO ? <span style={{ color: 'var(--text-tertiary)' }}>(데이터 연동되어 자동 추가됨)</span> : d || '-');

  return (
    <>
      <PageTitle>
        <h1>고객 데이터 연동</h1>
        <Help>
          프로젝트에 연동된 이벤트와 태그 고객 데이터를 관리할 수 있습니다. 자세한 내용은{' '}
          <a href="https://docs.flarelane.co.kr/data-management" target="_blank" rel="noreferrer">
            고객 데이터 연동
          </a>{' '}
          가이드를 참고하세요.
        </Help>
      </PageTitle>

      <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 23px' }}>
          <CardHead
            title="최근 이벤트"
            help="발생한 이벤트가 최근순으로 최대 50개까지 노출됩니다. 특정 유저ID나 기기ID로 필터링도 가능합니다."
            actions={
              <Button hierarchy="tertiary" iconLeading="download" onClick={() => setCsv(true)}>
                CSV로 내보내기
              </Button>
            }
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Select<'user' | 'device'> width={120} value={by} options={[{ value: 'user', label: '유저 ID' }, { value: 'device', label: '기기 ID' }]} onChange={setBy} />
            <div style={{ width: 200 }}>
              <TextField placeholder="ID" value={id} onChange={(e) => setId(e.target.value)} />
            </div>
            <div style={{ width: 200 }}>
              <TextField placeholder="Event Type" value={type} onChange={(e) => setType(e.target.value)} />
            </div>
            <RangeBtn ref={rangeRef} type="button" onClick={() => setRangeOpen((v) => !v)}>
              <span>
                <Icon name="calendar_month" size={20} />
              </span>
              {`${range.from} – ${range.to}`}
            </RangeBtn>
            <Floating anchorRef={rangeRef} open={rangeOpen} onClose={() => setRangeOpen(false)} width={808} offset={8} look="calendar" placement="bottom-start">
              <DateRangeMenu
                range={range}
                onCancel={() => setRangeOpen(false)}
                onConfirm={(r) => {
                  setRangeOpen(false);
                  setRange(r);
                  setApplied({ by, id: id.trim(), type: type.trim() });
                }}
              />
            </Floating>
            <IconButton
              icon="refresh"
              hierarchy="secondary"
              label="새로고침"
              disabled={cool}
              onClick={() => {
                setApplied({ by, id: id.trim(), type: type.trim() });
                setCool(true);
                setTimeout(() => setCool(false), 5000);
              }}
            />
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border-secondary)', margin: '0 -1px -1px' }}>
          <DataTable
            columns={[
              { label: '생성 시간', width: '180px' },
              { label: '타입', width: '180px' },
              { label: '대상', width: '100px' },
              { label: '대상 ID', width: '160px' },
              { label: '데이터', width: 'minmax(0,1fr)' },
              { label: '', width: '56px' },
            ]}
            rows={recent.map((r, i) => ({
              key: String(i),
              cells: [
                r[0],
                r[1],
                r[2],
                r[3],
                <span key="d" style={{ overflowX: 'auto', whiteSpace: 'nowrap', maxWidth: 385, display: 'block' }}>
                  {r[4]}
                </span>,
                <IconButton key="c" icon="content_copy" label="복사" onClick={() => copy(JSON.stringify({ createdAt: r[0], type: r[1], subjectType: r[2], subjectId: r[3], data: JSON.parse(r[4]) }))} />,
              ],
            }))}
            empty={<EmptyList />}
          />
        </div>
      </Card>

      <Card style={{ padding: '15px 23px' }}>
        <Inline>
          <b>이벤트 내보내기</b>
          <Badge color="gray">• 비활성화</Badge>
          <span>
            최근 내보내기<em>-</em>
          </span>
          <span>
            내보내는 이벤트 개수<em>-</em>
          </span>
          <i />
          {/* 스테이징 프로젝트는 isCrmEventExportEnabled = false → 설정 비활성. 시안 확인용으로 열리게 둠 */}
          <Button iconLeading="settings" onClick={() => setExportOpen(true)}>
            설정
          </Button>
        </Inline>
      </Card>

      <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '16px 23px 0' }}>
          <UnderlineTabs<'event' | 'tag'> items={[{ value: 'event', label: '이벤트' }, { value: 'tag', label: '태그' }]} value={tab} onChange={setTab} />
          <i style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
            <Button hierarchy="tertiary" iconLeading={showHidden[tab] ? 'visibility_off' : 'visibility'} onClick={() => setShowHidden((s) => ({ ...s, [tab]: !s[tab] }))}>
              숨긴 항목 보기
            </Button>
            <Button iconLeading="add" onClick={() => setModal({ kind: tab })}>
              추가
            </Button>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border-secondary)', margin: '0 -1px -1px' }}>
          <DataTable
            columns={[
              { label: '이름', width: '260px' },
              { label: '설명', width: 'minmax(0,1fr)' },
              tab === 'event'
                ? { label: <>최근 14일<Help>최근 14일간의 발생 볼륨과 일별 발생 추이를 보여줍니다.</Help></>, width: '200px' }
                : { label: <>연동률<Help>전체 유저 중 이 태그 값을 보유한 유저의 비율입니다.</Help></>, width: '140px' },
              { label: '', width: '56px' },
            ]}
            rows={list.map((it) => ({
              key: it.id,
              onClick: () => setPanel({ kind: tab, item: it }),
              sub: panel?.item.id === it.id,
              cells: [
                <span key="n" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, minWidth: 0 }}>
                  {tab === 'event' && it.name === PURCHASE && <Badge color="brand">구매 이벤트</Badge>}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {it.hidden && <Icon name="visibility_off" size={16} />}
                    {it.name}
                  </span>
                </span>,
                <span key="d" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {descOf(it.description)}
                </span>,
                tab === 'event' ? (
                  it.trends ? (
                    <span key="t" style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 36 }}>{shortNum(it.trends.reduce((a, b) => a + b, 0))}</span>
                      <Spark v={it.trends} />
                    </span>
                  ) : (
                    '집계 전'
                  )
                ) : typeof it.syncRate === 'number' ? (
                  `${(it.syncRate * 100).toFixed(1)}%`
                ) : (
                  '집계 전'
                ),
                <ItemMenu key="m" it={it} purchase={it.name === PURCHASE} onHide={() => hide(tab, it)} onEdit={() => setModal({ kind: tab, item: it })} onDelete={() => setDel({ kind: tab, item: it })} />,
              ],
            }))}
            empty={<EmptyList />}
          />
        </div>
      </Card>

      {panel && (
        <Drawer aria-label={panel.item.name}>
          <header>
            <h2>{panel.item.name}</h2>
            <ItemMenu it={panel.item} purchase={panel.item.name === PURCHASE} onHide={() => hide(panel.kind, panel.item)} onEdit={() => setModal({ kind: panel.kind, item: panel.item })} onDelete={() => setDel({ kind: panel.kind, item: panel.item })} />
            <IconButton icon="close" label="닫기" onClick={() => setPanel(null)} />
          </header>
          <div>
            <div>
              <Label>설명</Label>
              <span style={{ fontSize: 14 }}>{descOf(panel.item.description)}</span>
            </div>
            {panel.kind === 'tag' ? (
              <>
                <div>
                  <Label>연동률</Label>
                  <span style={{ fontSize: 14 }}>{typeof panel.item.syncRate === 'number' ? `${(panel.item.syncRate * 100).toFixed(1)}%` : '집계 전'}</span>
                </div>
                <div>
                  <Label>속성값 예시</Label>
                  <span style={{ fontSize: 14 }}>{panel.item.examples?.slice(0, 3).join(', ') || '-'}</span>
                </div>
              </>
            ) : (
              <DataTable
                columns={[
                  { label: '속성', width: '160px' },
                  { label: '설명', width: '240px' },
                  { label: '속성값 예시', width: 'minmax(0,1fr)' },
                ]}
                rows={panel.item.data?.length ? panel.item.data.map((d) => ({ key: d.key, cells: [d.key, d.description || '-', d.examples.slice(0, 3).join(', ') || '-'] })) : [{ key: '-', cells: ['-', '-', '-'] }]}
              />
            )}
          </div>
          <footer>
            <Button size="md" onClick={() => setPanel(null)}>
              닫기
            </Button>
          </footer>
        </Drawer>
      )}
      {modal && (
        <ItemModal
          key={modal.item?.id ?? 'new'}
          kind={modal.kind}
          item={modal.item}
          onClose={() => setModal(null)}
          onSave={(it) => {
            const set = modal.kind === 'event' ? setEvs : setTgs;
            set((l) => (l.some((x) => x.id === it.id) ? l.map((x) => (x.id === it.id ? it : x)) : [...l, it]));
            if (panel?.item.id === it.id) setPanel({ kind: modal.kind, item: it });
            setModal(null);
          }}
        />
      )}
      {del && (
        <ConfirmModal
          title={del.kind === 'event' ? '이벤트를 삭제하시겠습니까?' : '태그를 삭제하시겠습니까?'}
          cancelLabel="취소"
          confirmLabel="삭제"
          destructive
          onClose={() => setDel(null)}
          onConfirm={() => {
            (del.kind === 'event' ? setEvs : setTgs)((l) => l.filter((x) => x.id !== del.item.id));
            if (panel?.item.id === del.item.id) setPanel(null);
            setDel(null);
          }}
        />
      )}
      {csv && (
        <ReasonField
          onClose={() => setCsv(false)}
          onDownload={() => {
            setCsv(false);
            toast('파일 다운로드에 성공했습니다.');
          }}
        />
      )}
      {exportOpen && (
        <ExportModal
          onClose={() => setExportOpen(false)}
          onSave={() => {
            setExportOpen(false);
            toast('이벤트 내보내기 설정이 저장되었습니다.');
          }}
        />
      )}
    </>
  );
}
