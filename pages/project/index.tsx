import { useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Floating from '@/components/ui/Floating';
import { MenuItem } from '@/components/ui/Menu';
import { ConfirmModal, Dialog } from '@/components/ui/Modal';
import Radio from '@/components/ui/Radio';
import Select from '@/components/ui/Select';
import { ButtonTabs } from '@/components/ui/Tabs';
import TextField from '@/components/ui/TextField';
import { Card, CardHead, Help } from '@/components/channel/ChannelShell';
import DataTable from '@/components/channel/DataTable';
import { PageTitle } from '@/components/sent/SentList';
import { events } from '@/lib/catalog';
import { useStore } from '@/lib/store';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 프로젝트 — Figma 「프로젝트」(1110:11101) + docs/staging-behavior-dashboard-settings.md 2장.
// 카드마다 「수정」 → 「취소」(서버 값 다시 불러옴) · 「저장」. 저장 성공 = 토스트 「프로젝트가 수정되었습니다.」(멤버 쪽은 토스트 없는 동작 그대로).
// Figma: 카드마다 「수정」이 있어 Primary 대신 Secondary md.
type Ch = 'PUSH' | 'KAKAO_ALIMTALK' | 'KAKAO_BRAND_MESSAGE' | 'SMS' | 'EMAIL';
const CHS: { value: Ch; label: string; icon: string }[] = [
  { value: 'PUSH', label: '푸시 알림', icon: 'tooltip_2' },
  { value: 'KAKAO_ALIMTALK', label: '카카오 알림톡', icon: 'kakao_chat' },
  { value: 'KAKAO_BRAND_MESSAGE', label: '카카오 브랜드메시지', icon: 'kakao_chat' },
  { value: 'SMS', label: '문자', icon: 'sms' },
  { value: 'EMAIL', label: '이메일', icon: 'mail' },
];
const TZ = ['Asia/Seoul', 'Asia/Tokyo', 'Asia/Taipei', 'Asia/Singapore', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'UTC'];
const OFF: Record<string, string> = { 'Asia/Seoul': '+09:00', 'Asia/Tokyo': '+09:00', 'Asia/Taipei': '+08:00', 'Asia/Singapore': '+08:00', 'America/New_York': '-04:00', 'America/Los_Angeles': '-07:00', 'Europe/London': '+01:00', UTC: '+00:00' };
const CURRENCY = ['KRW', 'USD', 'JPY', 'EUR', 'TWD', 'SGD'];

type Cap = { daily: { active: boolean; maxCount: number }; weekly: { active: boolean; maxCount: number } };
type Project = {
  name: string;
  tz: string;
  purchase: null | { eventType: string; priceKey: string; quantityKey: string; currency: string; n: number; unit: 'DAY' | 'HOUR' };
  caps: Record<Ch, Cap>;
  throttle: Record<Ch, number | null>;
};
const cap = (d = false, dn = 3, w = false, wn = 10): Cap => ({ daily: { active: d, maxCount: dn }, weekly: { active: w, maxCount: wn } });
// 서버 값(모듈 상태) — 「취소」는 이 값으로 되돌림
const server: Project = {
  name: 'https://junyeongchoi.github.io/',
  tz: 'Asia/Seoul',
  purchase: { eventType: 'event', priceKey: 'price', quantityKey: 'quantity', currency: 'KRW', n: 6, unit: 'DAY' },
  caps: { PUSH: cap(), KAKAO_ALIMTALK: cap(true, 2), KAKAO_BRAND_MESSAGE: cap(), SMS: cap(true, 1, true, 5), EMAIL: cap() },
  throttle: { PUSH: null, KAKAO_ALIMTALK: null, KAKAO_BRAND_MESSAGE: null, SMS: 10000, EMAIL: null },
};
const PROJECT_ID = 'c2a83003-fc8a-4871-bb65-72d835ac7893';
const API_KEY = 'sk_live_9f2c4e1a7b3d5f8a';

type Member = { id?: string; email: string; admin: boolean; mfa: boolean; createdAt: string };
const MEMBERS: Member[] = [
  { id: 'm1', email: 'member1@example.com', admin: true, mfa: true, createdAt: '2023.11.17 14:22:32' },
  { id: 'm2', email: 'member2@example.com', admin: true, mfa: true, createdAt: '2023.11.17 14:34:20' },
  { id: 'm3', email: 'member3@example.com', admin: true, mfa: false, createdAt: '2023.11.17 17:01:55' },
  { id: 'm4', email: 'member4@example.com', admin: true, mfa: true, createdAt: '2024.09.24 11:50:51' },
  { id: 'm5', email: 'member5@example.com', admin: true, mfa: false, createdAt: '2025.04.09 18:39:24' },
  { id: 'm6', email: 'member6@example.com', admin: true, mfa: true, createdAt: '2026.03.04 18:10:45' },
  { id: 'm7', email: 'member7@example.com', admin: false, mfa: false, createdAt: '2024.12.10 18:28:33' },
  { id: 'm8', email: 'member8@example.com', admin: false, mfa: false, createdAt: '2025.02.07 17:14:02' },
];
const IS_ADMIN = false; // 스테이징 계정 기준 — 「멤버 권한 설정」은 관리자만 활성(Figma 도 Disabled)

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 24px;
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
  > span { display: flex; align-items: center; gap: 4px; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
`;

const Avatar = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  margin-top: 26px;
  border-radius: ${radius.md}px;
  background: ${color('bg-brand-solid')};
  ${text('text-md', 'semibold')};
  color: ${color('text-white')};
`;

const Opt = styled.label<{ $disabled: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
  cursor: ${(p) => (p.$disabled ? 'default' : 'pointer')};
  opacity: ${(p) => (p.$disabled ? 0.6 : 1)};
`;

const Summary = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
  padding: 12px 16px;
  border-radius: ${radius.md}px;
  background: ${color('bg-secondary')};
  > div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  > div > small { ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
  > div > b { ${text('text-sm', 'medium')}; color: ${color('text-primary')}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

const Sentence = styled.div<{ $disabled: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 28px;
  ${text('text-sm', 'regular')};
  color: ${(p) => (p.$disabled ? color('text-disabled') : color('text-secondary'))};
`;

const Foot = ({ editing, onEdit, onCancel, onSave }: { editing: boolean; onEdit: () => void; onCancel: () => void; onSave: () => void }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
    {editing ? (
      <>
        <Button size="md" onClick={onCancel}>취소</Button>
        <Button hierarchy="primary" size="md" onClick={onSave}>저장</Button>
      </>
    ) : (
      <Button size="md" onClick={onEdit}>수정</Button>
    )}
  </div>
);

function Copy({ value, shown }: { value: string; shown: string }) {
  const { toast } = useStore();
  const go = () => navigator.clipboard?.writeText(value).then(() => toast('클립보드에 복사되었습니다.'), () => toast('클립보드로 복사하는 데 실패했습니다.'));
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ flex: 1, cursor: 'pointer' }} onClick={go}>
        <TextField readOnly value={shown} style={{ cursor: 'pointer' }} />
      </div>
      <Button icon="content_copy" aria-label="복사" onClick={go} />
    </div>
  );
}

function MemberMenu({ m, onRole, onDelete }: { m: Member; onRole: () => void; onDelete: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button ref={ref} type="button" aria-label="더 보기" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} style={{ display: 'inline-flex', width: 32, height: 32, alignItems: 'center', justifyContent: 'center', border: 0, borderRadius: 8, background: 'transparent', color: 'var(--fg-quaternary)', cursor: 'pointer' }}>
        <Icon name="more_horiz" size={20} />
      </button>
      <Floating anchorRef={ref} open={open} onClose={() => setOpen(false)} width={160} offset={4}>
        <div style={{ padding: '4px 0' }}>
          {m.id && <MenuItem label="역할 변경" onClick={() => { setOpen(false); onRole(); }} />}
          <MenuItem label="멤버 삭제" destructive onClick={() => { setOpen(false); onDelete(); }} />
        </div>
      </Floating>
    </>
  );
}

export default function ProjectPage() {
  const router = useRouter();
  const { toast } = useStore();
  const [p, setP] = useState<Project>(() => JSON.parse(JSON.stringify(server)));
  const [editing, setEditing] = useState<null | 'basic' | 'purchase' | 'cap' | 'throttle'>(null);
  const [capTab, setCapTab] = useState<Ch>('PUSH');
  const [thTab, setThTab] = useState<Ch>('PUSH');
  const [members, setMembers] = useState<Member[]>(MEMBERS);
  const [modal, setModal] = useState<null | { kind: 'invite' } | { kind: 'role'; m: Member } | { kind: 'delete'; m: Member } | { kind: 'cannot' } | { kind: 'perm' } | { kind: 'project' }>(null);
  const [invite, setInvite] = useState('');
  const [roleAdmin, setRoleAdmin] = useState(false);
  const [perm, setPerm] = useState({ list: true, detail: false, csv: false, mcpWrite: false, mcpRead: false });
  const [confirmName, setConfirmName] = useState('');

  const reset = () => {
    setP(JSON.parse(JSON.stringify(server)));
    setEditing(null);
  };
  const save = () => {
    if (!p.name.trim()) return toast('프로젝트명을 입력해 주세요.');
    if (editing === 'cap') {
      const bad = CHS.find((c) => {
        const x = p.caps[c.value];
        return (x.daily.active && (x.daily.maxCount < 1 || x.daily.maxCount > 70)) || (x.weekly.active && (x.weekly.maxCount < 1 || x.weekly.maxCount > 490));
      });
      if (bad) {
        setCapTab(bad.value);
        return toast('빈도 제한 값은 일 1~70, 주 1~490 범위만 가능합니다.');
      }
    }
    if (editing === 'throttle') {
      const bad = CHS.find((c) => {
        const v = p.throttle[c.value];
        return v !== null && (v < 100 || v > 1000000);
      });
      if (bad) {
        setThTab(bad.value);
        return toast('발송 속도는 분당 100 ~ 1,000,000 값만 가능합니다.');
      }
    }
    Object.assign(server, JSON.parse(JSON.stringify(p)));
    setEditing(null);
    toast('프로젝트가 수정되었습니다.');
  };
  const ed = (k: typeof editing) => editing === k;
  const c = p.caps[capTab];
  const setCap = (patch: Partial<Cap>) => setP({ ...p, caps: { ...p.caps, [capTab]: { ...c, ...patch } } });
  const limited = c.daily.active || c.weekly.active;
  const th = p.throttle[thTab];
  const pu = p.purchase;
  const setPu = (patch: Partial<NonNullable<Project['purchase']>>) => setP({ ...p, purchase: { ...(pu as NonNullable<Project['purchase']>), ...patch } });
  const capLine = (k: 'daily' | 'weekly', max: number, label: string): ReactNode => (
    <Sentence $disabled={!ed('cap')}>
      <span style={{ cursor: ed('cap') ? 'pointer' : 'default' }} onClick={() => ed('cap') && setCap({ [k]: { ...c[k], active: !c[k].active } } as Partial<Cap>)}>
        <Checkbox checked={c[k].active} disabled={!ed('cap')} />
      </span>
      {label}
      <div style={{ width: 88 }}>
        <TextField type="number" min={1} max={max} disabled={!ed('cap') || !c[k].active} value={c[k].active ? String(c[k].maxCount) : ''} onChange={(e) => setCap({ [k]: { ...c[k], maxCount: Number(e.target.value) } } as Partial<Cap>)} />
      </div>
      개의 메시지를 수신합니다.
    </Sentence>
  );

  return (
    <>
      <PageTitle>
        <h1>프로젝트</h1>
      </PageTitle>
      <Card>
        <CardHead
          title="기본 정보"
          badge={<Badge color="brand">ENTERPRISE</Badge>}
          actions={
            <Button hierarchy="tertiary" onClick={() => router.push('/project/advanced-settings')}>
              고급 설정
            </Button>
          }
        />
        <Row>
          <Avatar>{p.name.replace(/^https?:\/\//, '').charAt(0).toLowerCase()}</Avatar>
          <Field>
            <span>프로젝트명</span>
            <TextField placeholder="프로젝트명" readOnly={!ed('basic')} value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
          </Field>
          <Field as="div">
            <span>
              대체 시간대 <Help>시간대를 알 수 없는 유저를 위한 대체 시간대를 설정합니다.</Help>
            </span>
            <Select<string> disabled={!ed('basic')} value={p.tz} options={TZ.map((t) => ({ value: t, label: `(GMT${OFF[t]}) ${t}` }))} onChange={(tz) => setP({ ...p, tz })} />
          </Field>
        </Row>
        <Field as="div">
          <span>
            프로젝트 ID
            <Help>
              프로젝트를 식별하는 고유한 값입니다.
              <br />
              SDK 연동이나 API 사용 시 프로젝트 ID가 필요합니다.
            </Help>
          </span>
          <Copy value={PROJECT_ID} shown={PROJECT_ID} />
        </Field>
        <Field as="div">
          <span>
            APIKEY <Help>REST API 사용 시 HTTP 헤더에 삽입할 인증키입니다.</Help>
          </span>
          <Copy value={API_KEY} shown={'•'.repeat(API_KEY.length)} />
        </Field>
        <Foot editing={ed('basic')} onEdit={() => setEditing('basic')} onCancel={reset} onSave={save} />
      </Card>

      <Card>
        <CardHead title="구매 전환 이벤트" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[false, true].map((on) => (
            <Opt key={String(on)} $disabled={!ed('purchase')} onClick={() => ed('purchase') && setP({ ...p, purchase: on ? pu ?? { eventType: '', priceKey: '', quantityKey: '', currency: '', n: 3, unit: 'DAY' } : null })}>
              <Radio checked={!!pu === on} disabled={!ed('purchase')} />
              {on ? '설정' : '미설정'}
            </Opt>
          ))}
        </div>
        {pu &&
          (ed('purchase') ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 12 }}>
              <Field as="div">
                <span>이벤트</span>
                <Select<string> value={pu.eventType || null} placeholder="purchase" options={events.map((e) => ({ value: e.name, label: e.name }))} onChange={(eventType) => setPu({ eventType })} />
              </Field>
              <Field>
                <span>금액 데이터</span>
                <TextField placeholder="price" value={pu.priceKey} onChange={(e) => setPu({ priceKey: e.target.value })} />
              </Field>
              <Field>
                <span>수량 데이터</span>
                <TextField placeholder="quantity" value={pu.quantityKey} onChange={(e) => setPu({ quantityKey: e.target.value })} />
              </Field>
              <Field as="div">
                <span>통화</span>
                <Select<string> value={pu.currency || null} placeholder="USD" options={CURRENCY.map((x) => ({ value: x, label: x }))} onChange={(currency) => setPu({ currency })} />
              </Field>
              <Field as="div">
                <span>기여 기간</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ width: 64 }}>
                    <TextField type="number" min={1} max={pu.unit === 'DAY' ? 7 : 168} value={String(pu.n)} onChange={(e) => setPu({ n: Math.max(1, Number(e.target.value) || 1) })} />
                  </div>
                  <Select<'DAY' | 'HOUR'> value={pu.unit} options={[{ value: 'DAY', label: '일' }, { value: 'HOUR', label: '시간' }]} onChange={(unit) => setPu({ unit })} />
                </div>
              </Field>
            </div>
          ) : (
            <Summary>
              {[
                ['이벤트', pu.eventType],
                ['금액 데이터', pu.priceKey],
                ['수량 데이터', pu.quantityKey],
                ['통화', pu.currency],
                ['기여 기간', `${pu.n} ${pu.unit === 'DAY' ? '일' : '시간'}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <small>{k}</small>
                  <b>{v || '-'}</b>
                </div>
              ))}
            </Summary>
          ))}
        <Foot editing={ed('purchase')} onEdit={() => setEditing('purchase')} onCancel={reset} onSave={save} />
      </Card>

      <Card>
        <CardHead title="메시지 발송 빈도 제한" />
        <ButtonTabs<Ch> full items={CHS} value={capTab} onChange={setCapTab} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Opt $disabled={!ed('cap')} onClick={() => ed('cap') && setCap({ daily: { ...c.daily, active: false }, weekly: { ...c.weekly, active: false } })}>
            <Radio checked={!limited} disabled={!ed('cap')} />
            무제한 발송
          </Opt>
          <Opt $disabled={!ed('cap')} onClick={() => ed('cap') && !limited && setCap({ daily: { ...c.daily, active: true } })}>
            <Radio checked={limited} disabled={!ed('cap')} />
            유저별 발송 빈도 제한 설정
          </Opt>
          {capLine('daily', 70, '1일 동안 최대')}
          {capLine('weekly', 490, '1주 동안 최대')}
        </div>
        <Foot editing={ed('cap')} onEdit={() => setEditing('cap')} onCancel={reset} onSave={save} />
      </Card>

      <Card>
        <CardHead title="메시지 발송 속도 제한" />
        <ButtonTabs<Ch> full items={CHS} value={thTab} onChange={setThTab} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Opt $disabled={!ed('throttle')} onClick={() => ed('throttle') && setP({ ...p, throttle: { ...p.throttle, [thTab]: null } })}>
            <Radio checked={th === null} disabled={!ed('throttle')} />
            최대한 빠르게 발송
          </Opt>
          <Opt $disabled={!ed('throttle')} onClick={() => ed('throttle') && th === null && setP({ ...p, throttle: { ...p.throttle, [thTab]: 10000 } })}>
            <Radio checked={th !== null} disabled={!ed('throttle')} />
            발송 속도 제한 설정
          </Opt>
          <Sentence $disabled={!ed('throttle')}>
            분당
            <div style={{ width: 120 }}>
              <TextField type="number" min={100} max={1000000} disabled={!ed('throttle') || th === null} value={th === null ? '' : String(th)} onChange={(e) => setP({ ...p, throttle: { ...p.throttle, [thTab]: Number(e.target.value) } })} />
            </div>
            개의 메시지를 발송합니다.
          </Sentence>
        </div>
        <Foot editing={ed('throttle')} onEdit={() => setEditing('throttle')} onCancel={reset} onSave={save} />
      </Card>

      <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 23px 16px' }}>
          <CardHead
            title="멤버"
            actions={
              <>
                <Button hierarchy="tertiary" disabled={!IS_ADMIN} onClick={() => setModal({ kind: 'perm' })}>
                  멤버 권한 설정
                </Button>
                <Button hierarchy="tertiary" onClick={() => router.push('/project/console-usage-log')}>
                  콘솔 이용 기록
                </Button>
                <Button iconLeading="person_add" onClick={() => { setInvite(''); setModal({ kind: 'invite' }); }}>
                  초대하기
                </Button>
              </>
            }
          />
        </div>
        <div style={{ borderTop: '1px solid var(--border-secondary)', margin: '0 -1px -1px' }}>
          <DataTable
            columns={[
              { label: '이메일', width: 'minmax(0,1fr)' },
              { label: '역할', width: '140px' },
              { label: '2차 인증', width: '120px' },
              { label: '등록일', width: '220px' },
              { label: '', width: '56px' },
            ]}
            rows={members.map((m) => ({
              key: m.email,
              cells: [
                <span key="e" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {m.email}
                  {!m.id && <Badge color="gray">대기중</Badge>}
                </span>,
                <Badge key="r" color={m.admin ? 'brand' : 'gray'}>{m.admin ? '관리자' : '멤버'}</Badge>,
                <span key="m" style={{ display: 'inline-flex', color: m.mfa ? 'var(--fg-success-secondary)' : 'var(--fg-quaternary)' }}>
                  <Icon name="verified_user" size={20} />
                </span>,
                m.createdAt,
                <MemberMenu
                  key="mm"
                  m={m}
                  onRole={() => {
                    setRoleAdmin(m.admin);
                    setModal({ kind: 'role', m });
                  }}
                  onDelete={() => setModal({ kind: 'delete', m })}
                />,
              ],
            }))}
          />
        </div>
      </Card>

      <div>
        <Button hierarchy="destructive-secondary" size="md" onClick={() => { setConfirmName(''); setModal({ kind: 'project' }); }}>
          프로젝트 삭제
        </Button>
      </div>

      {modal?.kind === 'invite' && (
        <ConfirmModal
          title="맴버 초대하기"
          cancelLabel="취소"
          confirmLabel="확인"
          onClose={() => setModal(null)}
          onConfirm={() => {
            if (!invite) return;
            setMembers((l) => [...l, { email: invite, admin: false, mfa: false, createdAt: '2026.10.08 23:00:00' }]);
            toast('초대 메일이 발송되었습니다.');
            setModal(null);
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>이메일</span>
            <TextField autoFocus placeholder="초대할 메일 주소 입력" value={invite} onChange={(e) => setInvite(e.target.value)} />
            <span>현재 미가입자일 경우 가입 시점에 자동으로 멤버에 추가됩니다.</span>
          </div>
        </ConfirmModal>
      )}
      {modal?.kind === 'role' && (
        <ConfirmModal
          title="역할 변경"
          cancelLabel="취소"
          confirmLabel="확인"
          onClose={() => setModal(null)}
          onConfirm={() => {
            const em = modal.m.email;
            setMembers((l) => l.map((x) => (x.email === em ? { ...x, admin: roleAdmin } : x)));
            setModal(null);
          }}
        >
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <TextField readOnly value={modal.m.email} />
            <Select<string> width={120} value={roleAdmin ? 'admin' : 'member'} options={[{ value: 'admin', label: '관리자' }, { value: 'member', label: '멤버' }]} onChange={(v) => setRoleAdmin(v === 'admin')} />
          </div>
        </ConfirmModal>
      )}
      {modal?.kind === 'delete' && (
        <ConfirmModal
          title="멤버를 삭제하시겠습니까?"
          description="해당 멤버는 현재 프로젝트에서 삭제됩니다."
          cancelLabel="취소"
          confirmLabel="삭제"
          destructive
          onClose={() => setModal(null)}
          onConfirm={() => {
            const m = modal.m;
            if (m.admin && members.filter((x) => x.admin).length < 2) return setModal({ kind: 'cannot' });
            setMembers((l) => l.filter((x) => x.email !== m.email));
            setModal(null);
          }}
        />
      )}
      {modal?.kind === 'cannot' && <ConfirmModal title="해당 멤버를 삭제할 수 없습니다." description="관리자 1명 이하일 경우 삭제할 수 없습니다." cancelLabel="" confirmLabel="확인" onClose={() => setModal(null)} onConfirm={() => setModal(null)} />}
      {modal?.kind === 'perm' && (
        <Dialog
          title="멤버 권한 변경"
          onClose={() => setModal(null)}
          footer={
            <>
              <Button size="md" onClick={() => setModal(null)}>취소</Button>
              <Button hierarchy="primary" size="md" onClick={() => { toast('멤버 권한 설정이 완료되었습니다.'); setModal(null); }}>
                저장
              </Button>
            </>
          }
        >
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-tertiary)' }}>관리자는 모든 권한이 활성화되어 있습니다</p>
          {(
            [
              ['데이터 조회 권한', [['list', '유저 데이터 보이기(리스트)'], ['detail', '유저 데이터 보이기(상세)']]],
              ['다운로드 권한', [['csv', 'CSV 다운로드']]],
              ['MCP 권한', [['mcpWrite', 'MCP 데이터 수정(Read&Write)'], ['mcpRead', 'MCP 데이터 조회(Read only)']]],
            ] as [string, [keyof typeof perm, string][]][]
          ).map(([g, items]) => (
            <div key={g} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <b style={{ fontSize: 14, fontWeight: 600 }}>{g}</b>
              {items.map(([k, label]) => {
                const locked = k === 'mcpRead' && perm.mcpWrite;
                return (
                  <Opt key={k} $disabled={locked} onClick={() => !locked && setPerm((x) => (k === 'mcpWrite' ? { ...x, mcpWrite: !x.mcpWrite, mcpRead: !x.mcpWrite ? true : x.mcpRead } : { ...x, [k]: !x[k] }))} style={{ justifyContent: 'space-between' }}>
                    {label}
                    <Checkbox checked={perm[k]} disabled={locked} />
                  </Opt>
                );
              })}
            </div>
          ))}
        </Dialog>
      )}
      {modal?.kind === 'project' && (
        <ConfirmModal
          title="정말 삭제하시겠습니까?"
          description="삭제된 프로젝트는 복구할 수 없습니다."
          cancelLabel="취소"
          confirmLabel="삭제"
          destructive
          onClose={() => setModal(null)}
          onConfirm={() => {
            if (confirmName !== server.name) return toast('프로젝트명이 일치하지 않습니다.');
            setModal(null);
            toast('프로젝트가 삭제되었습니다.');
          }}
        >
          <p style={{ margin: '8px 0' }}>
            삭제를 원하시면 아래에 <b style={{ color: 'var(--text-primary)' }}>&quot;{server.name}&quot;</b>을 입력해 주세요.
          </p>
          <TextField value={confirmName} onChange={(e) => setConfirmName(e.target.value)} />
        </ConfirmModal>
      )}
    </>
  );
}
