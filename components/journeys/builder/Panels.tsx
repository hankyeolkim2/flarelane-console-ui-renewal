import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import IconButton from '@/components/ui/IconButton';
import Select from '@/components/ui/Select';
import TextField from '@/components/ui/TextField';
import Toggle from '@/components/ui/Toggle';
import { Help } from '@/components/channel/ChannelShell';
import PushPreview from '@/components/preview/PushPreview';
import { AlimtalkPreview, FriendtalkPreview } from '@/components/preview/KakaoPreview';
import SmsPreview from '@/components/preview/SmsPreview';
import { Thumb } from '@/components/inapp/Preview';
import { ConversionSection, initialConv, Label, Opt, PlatformSelect, Radios, Row, VarField, type Conv } from '@/components/newmsg/parts';
import { fromMessage, PushFields, type PushMsg } from '@/components/newmsg/push';
import { AlimtalkFields, atAsMsg, atInitial, type AtM } from '@/components/newmsg/AlimtalkNewMessage';
import { FriendtalkFields, ftAsMsg, ftCheck, ftFresh, type FtM } from '@/components/newmsg/FriendtalkNewMessage';
import { SmsFields, smsAsMsg, smsInitial, type SmsM } from '@/components/newmsg/SmsNewMessage';
import { EmailFields, emInitial, type EmM } from '@/components/newmsg/EmailNewMessage';
import { KakaoTestSend } from '@/components/newmsg/Shell';
import { segments } from '@/lib/audience';
import { events, userTags } from '@/lib/catalog';
import { ICON, LABEL, type BNode, type NodeType, type Settings } from '@/lib/builder';
import { TEMPLATES, toHtml, DISPLAY_LABEL } from '@/lib/inapp';
import { useStore } from '@/lib/store';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 여정 빌더 오른쪽 패널 — docs journey-builder 2.4 · 3 · 4장. 「확인」 = 패널 검증 후 편집 데이터에 반영(서버 호출 없음).
const W = { base: 520, medium: 620, wide: 900, full: 'calc(100% - 240px)' };
const Box = styled.aside<{ $w: number | string }>`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  width: ${(p) => (typeof p.$w === 'number' ? `${p.$w}px` : p.$w)};
  max-width: 100%;
  background: ${color('bg-primary')};
  border-left: 1px solid ${color('border-secondary')};
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.06);
  animation: slide 0.1s ease;
  @keyframes slide { from { transform: translateX(24px); opacity: 0; } }
  > header { display: flex; align-items: center; gap: 8px; padding: 16px 20px; border-bottom: 1px solid ${color('border-secondary')}; }
  > header > span { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 8px; color: #fff; }
  > header > b { flex: 1; ${text('text-lg', 'semibold')}; color: ${color('text-primary')}; }
  > section { flex: 1; overflow: auto; display: flex; flex-direction: column; gap: 20px; padding: 20px; }
  > footer { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-top: 1px solid ${color('border-secondary')}; }
  > footer > i { flex: 1; }
  > footer > small { ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
`;
const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  > b { display: flex; align-items: center; gap: 4px; ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  > p { margin: 0; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
`;
const Two = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
  align-items: start;
`;
const LinkBtn = styled.button`
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  ${text('text-sm', 'semibold')};
  color: ${color('text-brand-secondary')};
  cursor: pointer;
  &:disabled { color: ${color('text-disabled')}; cursor: not-allowed; }
`;
const TypeCard = styled.button<{ $on: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid ${(p) => (p.$on ? color('border-brand') : color('border-secondary'))};
  outline: ${(p) => (p.$on ? `1px solid ${color('border-brand')}` : 'none')};
  border-radius: ${radius.lg}px;
  background: ${color('bg-primary')};
  ${text('text-md', 'semibold')};
  color: ${color('text-primary')};
  cursor: pointer;
  > span { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; background: ${color('bg-brand-primary')}; color: ${color('fg-brand-secondary')}; }
`;

type Shell = { title: string; type: NodeType; width: keyof typeof W; readOnly: boolean; id?: string; onClose: () => void; onDelete?: () => void; onConfirm?: () => void; children: ReactNode; titleIcon?: string };
export function PanelShell({ title, type, width, readOnly, id, onClose, onDelete, onConfirm, children, titleIcon }: Shell) {
  const [ic, bg] = ICON[type];
  return (
    <Box $w={W[width]} role="dialog" aria-label={title}>
      <header>
        <span style={{ background: bg }}>
          <Icon name={titleIcon ?? ic} size={18} />
        </span>
        <b>{title}</b>
        <IconButton icon="close" label="닫기" onClick={onClose} />
      </header>
      <section>{children}</section>
      <footer>
        {readOnly ? (
          <>
            {id && <small>{`ID: ${id}`}</small>}
            <i />
            <Button size="md" onClick={onClose}>
              닫기
            </Button>
          </>
        ) : (
          <>
            {onDelete && (
              <Button size="md" hierarchy="destructive-secondary" onClick={() => window.confirm('액션을 삭제합니다.') && onDelete()}>
                삭제
              </Button>
            )}
            <i />
            <Button size="md" hierarchy="primary" onClick={onConfirm}>
              확인
            </Button>
          </>
        )}
      </footer>
    </Box>
  );
}

// ── 이벤트 행 (3.2)
export type EvRow = { name: string; filters: [string, string, string, boolean?][] };
const OPS9: [string, string][] = [
  ['EQ', '='],
  ['NOT_EQ', '≠'],
  ['GT', '>'],
  ['GTE', '≥'],
  ['LT', '<'],
  ['LTE', '≤'],
  ['INCLUDES', '이 중에 하나'],
  ['CONTAINS', '포함'],
  ['NOT_CONTAINS', '포함하지 않음'],
];
export function EventRow({ value, onChange, entry, readOnly, onDelete, entryEvent }: { value: EvRow; onChange: (v: EvRow) => void; entry?: boolean; readOnly?: boolean; onDelete?: () => void; entryEvent?: string }) {
  const router = useRouter();
  const props = events.find((e) => e.name === value.name)?.properties ?? ['price', 'item_id', 'category'];
  const ops = entry ? OPS9 : OPS9.slice(0, 7);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, border: '1px solid var(--border-secondary)', borderRadius: 10, background: 'var(--bg-primary)' }}>
      <Row>
        <div style={{ width: 300 }}>
          <Select<string> disabled={readOnly} value={value.name || null} placeholder="이벤트 선택" options={[...events.filter((e) => !e.name.startsWith('@')).map((e) => ({ value: e.name, label: e.name })), { value: '__new', label: '+ 새 이벤트' }]} onChange={(name) => (name === '__new' ? router.push('/data-management?n=e') : onChange({ name, filters: [] }))} />
        </div>
        {!readOnly && (
          <LinkBtn type="button" disabled={value.filters.length >= 3} onClick={() => onChange({ ...value, filters: [...value.filters, ['', 'EQ', '']] })}>
            + 필터
          </LinkBtn>
        )}
        <i style={{ flex: 1 }} />
        {onDelete && !readOnly && <IconButton icon="delete" label="삭제" onClick={onDelete} />}
      </Row>
      {value.filters.map((f, i) => {
        const set = (p: Partial<{ 0: string; 1: string; 2: string; 3: boolean }>) => onChange({ ...value, filters: value.filters.map((x, j) => (j === i ? (Object.assign([...x], p) as EvRow['filters'][number]) : x)) });
        return (
          <Row key={i}>
            <div style={{ width: 200 }}>
              <Select<string> disabled={readOnly} value={f[0] || null} placeholder="데이터 키" options={props.map((p) => ({ value: p, label: p }))} onChange={(k) => set({ 0: k })} />
            </div>
            <div style={{ width: 130 }}>
              <Select<string> disabled={readOnly} value={f[1]} options={ops.map(([v, l]) => ({ value: v, label: l }))} onChange={(o) => set({ 1: o })} />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
              {f[3] && <small style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-tertiary)' }}>{`${entryEvent || 'entry_event'}.data.`}</small>}
              <TextField readOnly={readOnly} placeholder="값 입력" value={f[2]} onChange={(e) => set({ 2: e.target.value })} />
            </div>
            {!entry && !readOnly && (
              <IconButton icon="more_vert" size="xs" label={f[3] ? '시작 조건 이벤트의 데이터와 비교 해제' : '시작 조건 이벤트의 데이터와 비교'} onClick={() => set({ 3: !f[3] })} />
            )}
            {!readOnly && <IconButton icon="remove" size="xs" label="삭제" onClick={() => onChange({ ...value, filters: value.filters.filter((_, j) => j !== i) })} />}
          </Row>
        );
      })}
    </div>
  );
}
const evEmpty = (e: EvRow) => !e.name || e.filters.some((f) => !f[0] || !f[1] || !f[2]);

const USER_SEGS = () => segments.filter((s) => s.targetType === 'User');
function SegmentPick({ value, onChange, readOnly }: { value: string | null; onChange: (v: string) => void; readOnly?: boolean }) {
  return (
    <div style={{ width: 360 }}>
      <Select<string> disabled={readOnly} value={value} placeholder="필터 선택" options={USER_SEGS().map((s) => ({ value: s.name, label: s.name }))} onChange={onChange} />
    </div>
  );
}

type P = { node: BNode; readOnly: boolean; onClose: () => void; onSave: (data: BNode['data']) => void; onDelete: () => void; entry?: BNode };

// ── 시작 조건 (3.1)
export function EntryPanel({ node, readOnly, onClose, onSave }: P) {
  const { toast } = useStore();
  const [d, setD] = useState(() => JSON.parse(JSON.stringify(node.data)));
  const set = (p: Record<string, unknown>) => setD({ ...d, ...p });
  const reset = (entryType: string) => setD({ entryType, target: 'ALL', anonymous: 'EXCLUDE', event: { name: '', filters: [] }, exits: [], segment: null });
  const confirm = () => {
    if (d.entryType === 'EVENT' && (evEmpty(d.event) || (d.exits as EvRow[]).some(evEmpty))) return toast('이벤트 상세 조건이 비어있습니다.');
    if ((d.entryType === 'SEGMENT' || d.target === 'SEG') && !d.segment) return toast('세그먼트 상세 조건이 비어있습니다.');
    onSave(d);
  };
  const anon = (
    <Group>
      <b>
        비회원 기기 포함 여부
        <Help>유저 ID가 없는 비회원 기기를 포함할지 설정합니다.</Help>
      </b>
      <div style={{ width: 240 }}>
        <Select<string>
          disabled={readOnly}
          value={d.anonymous}
          options={[
            { value: 'EXCLUDE', label: '미포함' },
            { value: 'INCLUDE', label: '포함' },
            { value: 'ANONYMOUS_DEVICE_ONLY', label: '비회원 기기만' },
          ]}
          onChange={(anonymous) => set({ anonymous })}
        />
      </div>
    </Group>
  );
  return (
    <PanelShell title="시작 조건" type="ENTRY" width="wide" readOnly={readOnly} id={node.id} onClose={onClose} onConfirm={confirm}>
      <div style={{ display: 'flex', gap: 12 }}>
        <TypeCard type="button" $on={d.entryType === 'EVENT'} onClick={() => !readOnly && d.entryType !== 'EVENT' && reset('EVENT')}>
          <span>
            <Icon name="bolt" size={28} />
          </span>
          이벤트 기반
        </TypeCard>
        <TypeCard type="button" $on={d.entryType === 'SEGMENT'} onClick={() => !readOnly && d.entryType !== 'SEGMENT' && reset('SEGMENT')}>
          <span>
            <Icon name="group" size={28} />
          </span>
          세그먼트 기반
        </TypeCard>
      </div>
      {d.entryType === 'EVENT' ? (
        <>
          <Group>
            <b>진입 대상</b>
            <Radios<string>
              disabled={readOnly}
              value={d.target}
              options={[
                { value: 'ALL', label: '모든 유저' },
                { value: 'SEG', label: '다음 조건 만족 유저' },
              ]}
              onChange={(target) => set({ target })}
            />
            {d.target === 'SEG' && <SegmentPick readOnly={readOnly} value={d.segment} onChange={(segment) => set({ segment })} />}
          </Group>
          {anon}
          <Group>
            <b>진입 시점</b>
            <p>다음 이벤트가 발생할 때 여정 진입</p>
            <EventRow entry readOnly={readOnly} value={d.event} onChange={(event) => set({ event })} />
          </Group>
          <Group>
            <b>종료 조건</b>
            <p>다음 이벤트가 발생할 때 여정 종료</p>
            {(d.exits as EvRow[]).length === 0 ? (
              readOnly ? (
                <p>종료 조건이 없어 모든 메시지 발송</p>
              ) : (
                <LinkBtn type="button" onClick={() => set({ exits: [{ name: '', filters: [] }] })}>
                  + 종료 이벤트 추가
                </LinkBtn>
              )
            ) : (
              <>
                {(d.exits as EvRow[]).map((e, i) => (
                  <div key={i} style={{ display: 'contents' }}>
                    {i > 0 && <small style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>또는</small>}
                    <EventRow readOnly={readOnly} entryEvent={d.event.name} value={e} onChange={(v) => set({ exits: d.exits.map((x: EvRow, j: number) => (j === i ? v : x)) })} onDelete={() => set({ exits: d.exits.filter((_: EvRow, j: number) => j !== i) })} />
                  </div>
                ))}
                {!readOnly && d.exits.length < 5 && (
                  <div>
                    <Button onClick={() => set({ exits: [...d.exits, { name: '', filters: [] }] })}>또는</Button>
                  </div>
                )}
              </>
            )}
          </Group>
        </>
      ) : (
        <>
          <Group>
            <b>진입 대상</b>
            <p>대상 세그먼트에 포함될 때 진입</p>
            <SegmentPick readOnly={readOnly} value={d.segment} onChange={(segment) => set({ segment })} />
          </Group>
          {anon}
          <Group>
            <b>종료 조건</b>
            <p>진입 조건을 만족하지 않게될 때 여정 종료</p>
          </Group>
        </>
      )}
    </PanelShell>
  );
}

// ── 메시지 패널 공통 「캠페인 명」
const Campaign = ({ value, onChange, readOnly, placeholder = '캠페인 명 (선택)' }: { value: string; onChange: (v: string) => void; readOnly?: boolean; placeholder?: string }) => (
  <Group>
    <b>캠페인 명</b>
    <TextField readOnly={readOnly} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
  </Group>
);

// ── Push (4.1)
export function PushPanel({ node, readOnly, onClose, onSave, onDelete }: P) {
  const { toast } = useStore();
  const [campaign, setCampaign] = useState<string>(node.data.campaignName ?? '');
  const [pf, setPf] = useState<string[]>(node.data.platforms);
  const [msg, setMsg] = useState<PushMsg>(() => fromMessage({ title: node.data.title, body: node.data.body, url: node.data.url, imageUrl: node.data.image, buttons: node.data.buttons, data: node.data.data }));
  const [extra, setExtra] = useState<boolean>(!!node.data.extraSeg);
  const [seg, setSeg] = useState<string | null>(node.data.extraSegName ?? null);
  const confirm = () => {
    if (!msg.body.trim()) return toast('메시지 내용이 비어있습니다.');
    if (extra && !seg) return toast('추가 세그먼트 상세 조건이 비어있습니다.');
    onSave({ ...node.data, campaignName: campaign, platforms: pf, title: msg.title, body: msg.body, url: msg.url, image: msg.image, buttons: msg.buttons, data: Object.fromEntries(msg.data.map((x) => [x.key, x.value])), extraSeg: extra, extraSegName: seg });
  };
  return (
    <PanelShell title="Push" type="SEND_NOTIFICATION" width="full" readOnly={readOnly} id={node.id} onClose={onClose} onDelete={onDelete} onConfirm={confirm}>
      <Campaign readOnly={readOnly} value={campaign} onChange={setCampaign} />
      <Group>
        <b>발송 플랫폼</b>
        <PlatformSelect readOnly={readOnly} value={pf} onChange={setPf} toast={toast} />
      </Group>
      <Group>
        <b>메시지</b>
        <Two>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <PushFields value={msg} locked={readOnly} toast={toast} onChange={setMsg} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Label>미리보기</Label>
            <PushPreview os="android" title={msg.title} body={msg.body} url={msg.url || 'https://flarelane.com'} image={msg.image} buttons={msg.buttons.map((b) => b.label)} />
          </div>
        </Two>
      </Group>
      <Group>
        <b>추가 세그먼트</b>
        <Radios<string>
          disabled={readOnly}
          value={extra ? 'on' : 'off'}
          options={[
            { value: 'off', label: '비활성화' },
            { value: 'on', label: '활성화' },
          ]}
          onChange={(v) => setExtra(v === 'on')}
        />
        {extra && (
          <div style={{ width: 360 }}>
            <Select<string> disabled={readOnly} value={seg} placeholder="필터 선택" options={segments.filter((s) => s.targetType === 'Device').map((s) => ({ value: s.name, label: s.name }))} onChange={setSeg} />
          </div>
        )}
      </Group>
    </PanelShell>
  );
}

// ── Kakao Alimtalk (4.2)
export function AlimtalkPanel({ node, readOnly, onClose, onSave, onDelete }: P) {
  const { toast } = useStore();
  const [campaign, setCampaign] = useState<string>(node.data.campaignName ?? '');
  const [m, setM] = useState<AtM>(() => node.data.m ?? { ...atInitial(), picker: !node.data.templateId });
  const [test, setTest] = useState(false);
  const confirm = () => {
    if (!m.t) return;
    if (Object.values(m.vars).some((v) => !v.trim())) return toast('개인화 변수를 모두 입력해주세요.');
    onSave({ ...node.data, campaignName: campaign, templateId: m.t.id, templateName: m.t.templateName, interpolations: m.vars, m: { ...m, picker: false } });
  };
  return (
    <PanelShell title="Kakao Alimtalk" type="SEND_ALIMTALK" width="full" readOnly={readOnly} id={node.id} onClose={onClose} onDelete={onDelete} onConfirm={confirm}>
      <Campaign readOnly={readOnly} value={campaign} onChange={setCampaign} />
      <Group>
        <b>
          메시지
          <i style={{ flex: 1 }} />
          {!readOnly && <Button onClick={() => setM({ ...m, picker: true })}>템플릿 선택</Button>}
        </b>
        <Two>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AlimtalkFields m={m} set={(p) => setM((x) => ({ ...x, ...p }))} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Label>미리보기</Label>
            <AlimtalkPreview m={atAsMsg(m)} />
            <Button full iconLeading="send" onClick={() => setTest(true)}>
              테스트 발송
            </Button>
          </div>
        </Two>
      </Group>
      {test && <KakaoTestSend ch="alimtalk" onClose={() => setTest(false)} />}
    </PanelShell>
  );
}

// ── Kakao BrandMessage (4.3)
export function FriendtalkPanel({ node, readOnly, onClose, onSave, onDelete }: P) {
  const [campaign, setCampaign] = useState<string>(node.data.campaignName ?? '');
  const [m, setM] = useState<FtM>(() => node.data.m ?? ftFresh('FI'));
  const [test, setTest] = useState(false);
  const confirm = () => {
    if (!ftCheck(m)) return;
    const a = ftAsMsg(m);
    onSave({ ...node.data, campaignName: campaign, messageType: a.messageType, text: a.text, isAdvertisement: m.isAd, isAdultContent: m.age, senderId: 'sender-1', m });
  };
  return (
    <PanelShell title="Kakao BrandMessage" type="SEND_FRIENDTALK" width="full" readOnly={readOnly} id={node.id} onClose={onClose} onDelete={onDelete} onConfirm={confirm}>
      <Campaign readOnly={readOnly} value={campaign} onChange={setCampaign} />
      <Group>
        <b>메시지</b>
        <Two>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FriendtalkFields m={m} set={(p) => setM((x) => ({ ...x, ...p }))} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Label>미리보기</Label>
            <FriendtalkPreview m={ftAsMsg(m)} />
            <Button full iconLeading="send" onClick={() => setTest(true)}>
              테스트 발송
            </Button>
          </div>
        </Two>
      </Group>
      {test && <KakaoTestSend ch="friendtalk" onClose={() => setTest(false)} />}
    </PanelShell>
  );
}

// ── SMS (4.4)
export function SmsPanel({ node, readOnly, onClose, onSave, onDelete }: P) {
  const [campaign, setCampaign] = useState<string>(node.data.campaignName ?? '');
  const [m, setM] = useState<SmsM>(() => node.data.m ?? smsInitial());
  const [test, setTest] = useState(false);
  const confirm = () => {
    const bad = [...`${m.title}${m.body}`].filter((c) => (c.codePointAt(0) ?? 0) > 0xffff);
    if (bad.length && !window.confirm(`문자 메시지에서 사용할 수 없는 문자가 있습니다.\n내용: ${bad.join(' ')}\n* 해당 글자는 "?, �" 등으로 표시될 수 있습니다.\n\n발송하시겠습니까?`)) return onClose();
    onSave({ ...node.data, campaignName: campaign, body: m.body, isAdvertisement: m.isAd, m });
  };
  return (
    <PanelShell title="SMS" type="SEND_SMS" width="full" readOnly={readOnly} id={node.id} onClose={onClose} onDelete={onDelete} onConfirm={confirm}>
      <Campaign readOnly={readOnly} value={campaign} onChange={setCampaign} />
      <Group>
        <b>메시지</b>
        <Two>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SmsFields m={m} set={(p) => setM((x) => ({ ...x, ...p }))} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Label>미리보기</Label>
            <SmsPreview m={smsAsMsg(m)} />
            <Button full iconLeading="send" onClick={() => setTest(true)}>
              테스트 발송
            </Button>
          </div>
        </Two>
      </Group>
      {test && <KakaoTestSend ch="sms" onClose={() => setTest(false)} />}
    </PanelShell>
  );
}

// ── Email (4.5)
export function EmailPanel({ node, readOnly, onClose, onSave, onDelete }: P) {
  const [campaign, setCampaign] = useState<string>(node.data.campaignName ?? '');
  const [m, setM] = useState<EmM>(() => ({ ...emInitial(), html: node.data.body ?? '', sender: node.data.senderEmail || null, subject: node.data.title ?? '' }));
  const confirm = () => {
    if (!m.sender || !m.subject.trim() || !m.html) return window.alert('빈 값이 존재합니다.');
    onSave({ ...node.data, campaignName: campaign, senderEmail: m.sender, title: m.subject, body: m.html, templateId: null });
  };
  return (
    <PanelShell title="Email" type="SEND_EMAIL" width="full" readOnly={readOnly} id={node.id} onClose={onClose} onDelete={onDelete} onConfirm={confirm}>
      <Campaign readOnly={readOnly} value={campaign} onChange={setCampaign} />
      <Group>
        <b>메시지</b>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
          <EmailFields m={m} set={(p) => setM((x) => ({ ...x, ...p }))} />
        </div>
      </Group>
    </PanelShell>
  );
}

// ── In-App (4.6)
export function InAppPanel({ node, readOnly, onClose, onSave, onDelete }: P) {
  const { toast } = useStore();
  const [d, setD] = useState(() => ({ ...node.data }));
  const [picker, setPicker] = useState(!node.data.htmlString && !readOnly);
  const [ttl, setTtl] = useState<{ n: number; unit: 'DAY' | 'HOUR' | 'MINUTE' }>(() => {
    const m = node.data.ttlMinutes as number;
    return m % 1440 === 0 ? { n: m / 1440, unit: 'DAY' } : m % 60 === 0 ? { n: m / 60, unit: 'HOUR' } : { n: m, unit: 'MINUTE' };
  });
  const set = (p: Record<string, unknown>) => setD({ ...d, ...p });
  const confirm = () => {
    if (!String(d.title ?? '').trim()) return toast('인앱 메시지(팝업)의 캠페인 명이 비어있습니다.');
    onSave({ ...d, ttlMinutes: ttl.n * { DAY: 1440, HOUR: 60, MINUTE: 1 }[ttl.unit] });
  };
  return (
    <PanelShell title="In-App Message" type="DISPLAY_IN_APP_MESSAGE" width="full" readOnly={readOnly} id={node.id} onClose={onClose} onDelete={onDelete} onConfirm={confirm}>
      {picker ? (
        <Group>
          <b>
            인앱 메시지 템플릿 선택
            <i style={{ flex: 1 }} />
            <IconButton icon="close" label="닫기" onClick={() => setPicker(false)} />
          </b>
          {(['BOTTOM_SHEET', 'MODAL', 'FULL_SCREEN'] as const).map((t) => (
            <div key={t}>
              <Label>{DISPLAY_LABEL[t]}</Label>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {TEMPLATES.filter((x) => x.model.displayType === t).map((x) => (
                  <button key={x.id} type="button" onClick={() => (set({ htmlString: toHtml(x.model), templateTitle: `${DISPLAY_LABEL[t]} · ${x.title}` }), setPicker(false))} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 6, border: '1px solid var(--border-secondary)', borderRadius: 10, background: 'var(--bg-primary)', cursor: 'pointer' }}>
                    <Thumb html={toHtml(x.model)} size={140} />
                    <span style={{ fontSize: 12 }}>{x.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Group>
      ) : (
        <>
          <Campaign readOnly={readOnly} placeholder="캠페인 명" value={d.title ?? ''} onChange={(title) => set({ title })} />
          <Group>
            <b>
              노출 시점
              <Help>트리거를 지정하면 해당 트리거가 실행될 때 인앱 메시지가 노출됩니다.</Help>
            </b>
            <Radios<string>
              disabled={readOnly}
              value={d.group === null ? 'all' : 'select'}
              options={[
                { value: 'all', label: '모든 트리거' },
                { value: 'select', label: '트리거 선택' },
              ]}
              onChange={(v) => set({ group: v === 'all' ? null : '' })}
            />
            {d.group !== null && (
              <div style={{ width: 320 }}>
                <TextField readOnly={readOnly} placeholder="트리거 입력" value={d.group ?? ''} onChange={(e) => set({ group: e.target.value })} />
              </div>
            )}
            <p style={{ fontSize: 13 }}>
              {d.group ? (
                <>
                  노출 예약 후 <code>{`FlareLane.displayInApp("${d.group}")`}</code> 실행 시 인앱메시지 노출
                </>
              ) : (
                <>
                  노출 예약 후 첫 <code>FlareLane.displayInApp()</code> 실행 시 인앱메시지 노출
                </>
              )}
            </p>
          </Group>
          <Group>
            <b>
              노출 예약 기간
              <Help>노드 진입 시 즉시 노출이 아닌 노출 예약 상태가 됩니다. 이후 유저가 예약 기간 내 노출 그룹 실행 시 인앱메시지가 노출됩니다.</Help>
            </b>
            <Row>
              <div style={{ width: 96 }}>
                <TextField readOnly={readOnly} type="number" min={1} value={String(ttl.n)} onChange={(e) => setTtl({ ...ttl, n: Math.max(1, Number(e.target.value) || 1) })} />
              </div>
              <div style={{ width: 120 }}>
                <Select<'DAY' | 'HOUR' | 'MINUTE'> disabled={readOnly} value={ttl.unit} options={[{ value: 'DAY', label: '일' }, { value: 'HOUR', label: '시간' }, { value: 'MINUTE', label: '분' }]} onChange={(unit) => setTtl({ ...ttl, unit })} />
              </div>
            </Row>
          </Group>
          <Group>
            <b>
              메시지
              <i style={{ flex: 1 }} />
              {!readOnly && <Button onClick={() => setPicker(true)}>템플릿 변경</Button>}
            </b>
            <Row style={{ alignItems: 'flex-start', gap: 16 }}>
              {d.htmlString ? <Thumb html={d.htmlString} size={240} /> : <p>템플릿을 선택해 주세요.</p>}
              <small style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{d.templateTitle ?? ''}</small>
            </Row>
          </Group>
          <Group>
            <b>
              설정
              <Help>인앱메시지가 실제 노출되는 기간 범위를 지정할 수 있습니다.</Help>
            </b>
            <Label>노출 기간</Label>
            <Radios<string> disabled={readOnly} value={d.period ?? 'always'} options={[{ value: 'always', label: '항상' }, { value: 'range', label: '기간 내' }]} onChange={(period) => set({ period })} />
            <Label>노출 대상</Label>
            <Radios<string> disabled={readOnly} value={d.target ?? 'all'} options={[{ value: 'all', label: '모든 기기' }, { value: 'seg', label: '다음 조건 만족 기기' }]} onChange={(target) => set({ target })} />
          </Group>
        </>
      )}
    </PanelShell>
  );
}

// ── Webhook (4.7)
export function WebhookPanel({ node, readOnly, onClose, onSave, onDelete }: P) {
  const { toast, webhooks } = useStore();
  const router = useRouter();
  const [id, setId] = useState<string | null>(node.data.webhookId || null);
  const [vals, setVals] = useState<Record<string, string>>(node.data.values ?? {});
  const w = webhooks.find((x) => x.id === id);
  const keys = w ? [...new Set((w.body.match(/\{\{\s*([\w.]+)\s*\}\}/g) ?? []).map((s) => s.replace(/[{}\s]/g, '')))] : [];
  const confirm = () => {
    if (!w) return toast('웹훅이 비어있습니다.');
    if (keys.some((k) => !vals[k]?.trim())) return toast('웹훅 데이터가 비어있습니다.');
    onSave({ ...node.data, webhookId: w.id, webhookName: w.name, values: vals });
  };
  return (
    <PanelShell title="Webhook" type="EXECUTE_WEBHOOK" width="full" readOnly={readOnly} id={node.id} onClose={onClose} onDelete={onDelete} onConfirm={confirm}>
      <Group>
        <b>웹훅</b>
        <div style={{ width: 420 }}>
          <Select<string> disabled={readOnly} value={id} placeholder="웹훅 선택" options={[...webhooks.map((x) => ({ value: x.id, label: `${x.name} · ${x.url}` })), { value: '__new', label: '+ 새 웹훅' }]} onChange={(v) => (v === '__new' ? router.push('/channel/webhook/new') : setId(v))} />
        </div>
        {w && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, borderRadius: 10, background: 'var(--bg-secondary)', fontSize: 13 }}>
            <b style={{ fontFamily: 'ui-monospace, monospace' }}>{`${w.method} ${w.url}`}</b>
            {w.headers.length > 0 && (
              <div>
                <small style={{ fontWeight: 600 }}>HEADERS</small>
                {w.headers.map((h) => (
                  <div key={h.key} style={{ fontFamily: 'ui-monospace, monospace' }}>{`${h.key}: ${h.value}`}</div>
                ))}
              </div>
            )}
            <pre style={{ margin: 0, height: 200, overflow: 'auto', padding: 10, borderRadius: 8, background: 'var(--bg-primary)', fontSize: 12 }}>{w.body}</pre>
            {keys.map((k) => (
              <Row key={k}>
                <span style={{ width: 160, fontFamily: 'ui-monospace, monospace' }}>{k}</span>
                <div style={{ flex: 1 }}>
                  <VarField readOnly={readOnly} value={vals[k] ?? ''} placeholder="값 입력" onChange={(v) => setVals({ ...vals, [k]: v })} />
                </div>
              </Row>
            ))}
          </div>
        )}
      </Group>
    </PanelShell>
  );
}

// ── Delay (4.8)
export function DelayPanel({ node, readOnly, onClose, onSave, onDelete }: P) {
  const [d, setD] = useState(() => ({ ...node.data }));
  const set = (p: Record<string, unknown>) => setD({ ...d, ...p });
  const hh = `${String(d.hour).padStart(2, '0')}:${String(d.minute).padStart(2, '0')}`;
  return (
    <PanelShell
      title="Delay"
      type="TIME_DELAY"
      width="medium"
      readOnly={readOnly}
      id={node.id}
      onClose={onClose}
      onDelete={onDelete}
      onConfirm={() => onSave(d.type === 'UNTIL' ? { ...d, waitMinutes: 0, targetHour: d.hour, targetMinute: d.minute } : { ...d, waitMinutes: d.n * { DAY: 1440, HOUR: 60, MINUTE: 1 }[d.unit as 'DAY'] })}
    >
      <Radios<string> column gap={16} disabled={readOnly} value={d.type} options={[{ value: 'AFTER', label: '다음 시간 동안 대기' }, { value: 'UNTIL', label: '다음 시간까지 대기' }]} onChange={(type) => set({ type })} />
      {d.type === 'AFTER' ? (
        <Row>
          <div style={{ width: 96 }}>
            <TextField readOnly={readOnly} type="number" min={1} value={String(d.n)} onChange={(e) => set({ n: Math.max(1, Math.floor(Number(e.target.value) || 1)) })} />
          </div>
          <div style={{ width: 120 }}>
            <Select<string> disabled={readOnly} value={d.unit} options={[{ value: 'DAY', label: '일' }, { value: 'HOUR', label: '시간' }, { value: 'MINUTE', label: '분' }]} onChange={(unit) => set({ unit })} />
          </div>
        </Row>
      ) : (
        <>
          <Row>
            <div style={{ width: 72 }}>
              <TextField readOnly={readOnly} type="number" min={0} max={23} value={String(d.hour)} onChange={(e) => set({ hour: Math.min(23, Math.max(0, Number(e.target.value) || 0)) })} />
            </div>
            <small>:</small>
            <div style={{ width: 72 }}>
              <TextField readOnly={readOnly} type="number" min={0} max={59} value={String(d.minute)} onChange={(e) => set({ minute: Math.min(59, Math.max(0, Number(e.target.value) || 0)) })} />
            </div>
          </Row>
          <p style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0, fontSize: 13, color: 'var(--text-tertiary)' }}>
            <Icon name="info" size={16} />
            {`오늘 ${hh}가 이미 지난 경우 내일 ${hh}에 재개됩니다.`}
          </p>
        </>
      )}
    </PanelShell>
  );
}

// ── A/B Test (4.9)
export function AbPanel({ node, readOnly, onClose, onSave, onDelete }: P) {
  const { toast } = useStore();
  const [groups, setGroups] = useState<{ id: string; name: string; pct: number }[]>(node.data.groups);
  const [control, setControl] = useState<number | null>(node.data.control);
  const num = (v: string) => Math.max(0, Math.min(99, Math.floor(Number(v) || 0)));
  const confirm = () => {
    const all = [...groups.map((g) => g.pct), ...(control !== null ? [control] : [])];
    if (all.some((p) => p < 1 || p > 99)) return toast('1 ~ 99 사이의 숫자를 입력해주세요.');
    if (all.reduce((a, b) => a + b, 0) !== 100) return toast('합이 100%가 되어야 합니다.');
    onSave({ ...node.data, groups: groups.map((g) => ({ ...g, name: g.name.trim() })), control });
  };
  return (
    <PanelShell title="A/B Test" type="AB_TEST" width="base" readOnly={readOnly} id={node.id} onClose={onClose} onDelete={onDelete} onConfirm={confirm}>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-tertiary)' }}>대상자를 임의의 그룹으로 나누어 테스트를 진행합니다.</p>
      {groups.map((g, i) => (
        <Row key={g.id}>
          <div style={{ flex: 1 }}>
            <TextField readOnly={readOnly} placeholder="Group Name" maxLength={14} value={g.name} onChange={(e) => setGroups(groups.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
          </div>
          <div style={{ width: 80 }}>
            <TextField readOnly={readOnly} inputMode="numeric" value={String(g.pct)} onChange={(e) => setGroups(groups.map((x, j) => (j === i ? { ...x, pct: num(e.target.value) } : x)))} />
          </div>
          <small>%</small>
          {!readOnly && groups.length + (control !== null ? 1 : 0) >= 3 && <IconButton icon="delete" label="삭제" onClick={() => setGroups(groups.filter((_, j) => j !== i))} />}
        </Row>
      ))}
      {control !== null && (
        <Row>
          <div style={{ flex: 1 }}>
            <TextField readOnly value="미발송 그룹" />
          </div>
          <div style={{ width: 80 }}>
            <TextField readOnly={readOnly} inputMode="numeric" value={String(control)} onChange={(e) => setControl(num(e.target.value))} />
          </div>
          <small>%</small>
          {!readOnly && <span style={{ width: 32 }} />}
        </Row>
      )}
      {!readOnly && (
        <Row style={{ justifyContent: 'space-between' }}>
          <Button disabled={groups.length >= 5} onClick={() => setGroups([...groups, { id: crypto.randomUUID(), name: String.fromCharCode(65 + groups.length), pct: 0 }])}>
            + 그룹 추가
          </Button>
          <Opt $disabled={groups.length < 2} onClick={() => groups.length >= 2 && setControl(control === null ? 0 : null)}>
            <Checkbox checked={control !== null} disabled={groups.length < 2} />
            미발송 그룹 추가
            <Help>미발송 그룹을 대조군으로 설정하여 A/B 테스트를 진행할 수 있습니다.</Help>
          </Opt>
        </Row>
      )}
    </PanelShell>
  );
}

// ── Event Split (4.10)
export function EventSplitPanel({ node, readOnly, onClose, onSave, onDelete, entry }: P) {
  const { toast } = useStore();
  const [d, setD] = useState(() => JSON.parse(JSON.stringify(node.data)));
  const set = (p: Record<string, unknown>) => setD({ ...d, ...p });
  const max = { DAY: 365, HOUR: 8760, MINUTE: 525600 }[d.recentUnit as 'DAY'];
  return (
    <PanelShell title="Event Split" type="SPLIT_BY_EVENT_CONDITIONS" width="wide" readOnly={readOnly} id={node.id} onClose={onClose} onDelete={onDelete} onConfirm={() => (evEmpty(d.event) ? toast('이벤트 상세 조건이 비어있습니다.') : onSave(d))}>
      <Group>
        <b>기준 시점</b>
        <Radios<string> column gap={10} disabled={readOnly} value={d.since} options={[{ value: 'ENTRY', label: '여정 진입 이후부터' }, { value: 'RECENT', label: '전체 기간 중 최근 N일 이내' }]} onChange={(since) => set({ since })} />
        {d.since === 'RECENT' && (
          <Row style={{ paddingLeft: 24 }}>
            <div style={{ width: 96 }}>
              <TextField readOnly={readOnly} type="number" min={1} max={max} value={String(d.recentN)} onChange={(e) => set({ recentN: Math.min(max, Math.max(1, Number(e.target.value) || 1)) })} />
            </div>
            <div style={{ width: 120 }}>
              <Select<string> disabled={readOnly} value={d.recentUnit} options={[{ value: 'DAY', label: '일' }, { value: 'HOUR', label: '시간' }, { value: 'MINUTE', label: '분' }]} onChange={(recentUnit) => set({ recentUnit })} />
            </div>
          </Row>
        )}
      </Group>
      <Group>
        <b>이벤트 조건</b>
        <Row>
          <small>다음 이벤트가</small>
          <div style={{ width: 96 }}>
            <Select<string> disabled={readOnly} value={d.op} options={[['EQ', '='], ['NOT_EQ', '≠'], ['LT', '<'], ['LTE', '≤'], ['GT', '>'], ['GTE', '≥']].map(([v, l]) => ({ value: v, label: l }))} onChange={(op) => set({ op })} />
          </div>
          <div style={{ width: 80 }}>
            <TextField readOnly={readOnly} type="number" min={0} max={10} value={String(d.count)} onChange={(e) => set({ count: Math.min(10, Math.max(0, Number(e.target.value) || 0)) })} />
          </div>
          <small>회 발생</small>
        </Row>
        <EventRow readOnly={readOnly} entryEvent={entry?.data.event?.name} value={d.event} onChange={(event) => set({ event })} />
      </Group>
    </PanelShell>
  );
}

// ── Segment Split (4.11)
export function SegmentSplitPanel({ node, readOnly, onClose, onSave, onDelete }: P) {
  const { toast } = useStore();
  const [seg, setSeg] = useState<string | null>(node.data.segment);
  return (
    <PanelShell title="Segment Split" type="SPLIT_BY_SEGMENT_CONDITIONS" width="wide" readOnly={readOnly} id={node.id} onClose={onClose} onDelete={onDelete} onConfirm={() => (seg ? onSave({ ...node.data, segment: seg }) : toast('세그먼트 상세 조건이 비어있습니다.'))}>
      <Group>
        <b>세그먼트</b>
        <SegmentPick readOnly={readOnly} value={seg} onChange={setSeg} />
      </Group>
    </PanelShell>
  );
}

// ── Trigger Event (4.12)
export function TriggerPanel({ node, readOnly, onClose, onSave, onDelete }: P) {
  const [type, setType] = useState<string>(node.data.event.type);
  const [rows, setRows] = useState<{ key: string; value: string }[]>(node.data.event.data);
  return (
    <PanelShell
      title="Trigger Event"
      type="TRIGGER_EVENT"
      width="medium"
      readOnly={readOnly}
      id={node.id}
      onClose={onClose}
      onDelete={onDelete}
      onConfirm={() => (rows.some((r) => !r.key || !r.value) ? window.alert('비어있는 이벤트 데이터가 있습니다.') : onSave({ ...node.data, event: { type, data: rows } }))}
    >
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-tertiary)' }}>다음 이벤트를 발생시킵니다.</p>
      <div style={{ width: 320 }}>
        <Select<string> disabled={readOnly} value={type || null} placeholder="이벤트 선택" options={events.filter((e) => !e.name.startsWith('@')).map((e) => ({ value: e.name, label: e.name }))} onChange={setType} />
      </div>
      {type &&
        rows.map((r, i) => (
          <Row key={i}>
            <TextField readOnly={readOnly} placeholder="Key" value={r.key} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} />
            <TextField readOnly={readOnly} placeholder="Value" value={r.value} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
            {!readOnly && <IconButton icon="delete" label="삭제" onClick={() => setRows(rows.filter((_, j) => j !== i))} />}
          </Row>
        ))}
      {type && !readOnly && (
        <LinkBtn type="button" disabled={rows.length >= 5} onClick={() => setRows([...rows, { key: '', value: '' }])}>
          + 이벤트 데이터 추가
        </LinkBtn>
      )}
    </PanelShell>
  );
}

// ── Update Tags (4.13)
export function TagsPanel({ node, readOnly, onClose, onSave, onDelete }: P) {
  const router = useRouter();
  const [rows, setRows] = useState<{ key: string; value: string }[]>(node.data.tags.length ? node.data.tags : [{ key: '', value: '' }]);
  return (
    <PanelShell
      title="Update Tags"
      type="UPDATE_TAG"
      width="medium"
      readOnly={readOnly}
      id={node.id}
      onClose={onClose}
      onDelete={onDelete}
      onConfirm={() => (rows.some((r) => !r.key || !r.value) ? window.alert('비어있는 태그값이 있습니다.') : onSave({ ...node.data, tags: rows }))}
    >
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-tertiary)' }}>유저 및 기기의 태그를 업데이트합니다.</p>
      {rows.map((r, i) => (
        <Row key={i}>
          <div style={{ width: 220 }}>
            <Select<string>
              disabled={readOnly}
              value={r.key || null}
              placeholder="태그 선택"
              options={[...userTags.filter((t) => t === r.key || !rows.some((x) => x.key === t)).map((t) => ({ value: t, label: t })), { value: '__new', label: '+ 새 태그' }]}
              onChange={(key) => (key === '__new' ? router.push('/data-management?n=t') : setRows(rows.map((x, j) => (j === i ? { ...x, key } : x))))}
            />
          </div>
          <div style={{ flex: 1 }}>
            <VarField readOnly={readOnly} placeholder="Value" value={r.value} onChange={(value) => setRows(rows.map((x, j) => (j === i ? { ...x, value } : x)))} />
          </div>
          {!readOnly && <IconButton icon="delete" label="삭제" onClick={() => setRows(rows.filter((_, j) => j !== i))} />}
        </Row>
      ))}
      {!readOnly && (
        <LinkBtn type="button" disabled={rows.length >= 5} onClick={() => setRows([...rows, { key: '', value: '' }])}>
          + 태그 추가
        </LinkBtn>
      )}
    </PanelShell>
  );
}

// ── 발송 설정 (3.3)
const HOURS = Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: `${h}:00` }));
export function SendOptionsPanel({ value, readOnly, onClose, onSave }: { value: Settings; readOnly: boolean; onClose: () => void; onSave: (s: Settings) => void }) {
  const [s, setS] = useState<Settings>(value);
  const set = (p: Partial<Settings>) => setS({ ...s, ...p });
  const blocked = (h: number) => (s.dnd.start > s.dnd.end ? h >= s.dnd.start || h < s.dnd.end : h >= s.dnd.start && h < s.dnd.end);
  return (
    <PanelShell title="발송 설정" type="ENTRY" titleIcon="tune" width="base" readOnly={readOnly} onClose={onClose} onConfirm={() => onSave(s)}>
      <Group>
        <b>재진입 정책 설정</b>
        <Radios<Settings['entryPolicy']>
          column
          gap={10}
          disabled={readOnly}
          value={s.entryPolicy}
          options={[
            { value: 'Once', label: '재진입 불가' },
            { value: 'ReEntryAfterCompletion', label: '여정 종료 후 재진입 허용' },
            { value: 'ReEntry', label: '시작 조건 만족 시마다 재진입 허용 (이벤트 전용)' },
          ]}
          onChange={(entryPolicy) => set({ entryPolicy })}
        />
        {s.entryPolicy === 'ReEntryAfterCompletion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 24 }}>
            <Label>재진입 주기</Label>
            <Opt onClick={() => !readOnly && set({ reMode: null })}>
              <input type="radio" readOnly checked={s.reMode === null} /> 즉시
            </Opt>
            <Row>
              <input type="radio" readOnly checked={s.reMode !== null} onClick={() => !readOnly && set({ reMode: s.reUnit === 'DAY' ? 'endOfDays' : 'minutes' })} />
              <div style={{ width: 80 }}>
                <TextField readOnly={readOnly} type="number" value={String(s.reValue)} onChange={(e) => set({ reValue: Math.min(s.reUnit === 'DAY' ? 90 : 2160, Math.max(s.reUnit === 'DAY' ? 0 : 1, Number(e.target.value) || 0)) })} />
              </div>
              <div style={{ width: 150 }}>
                <Select<'DAY' | 'HOUR'> disabled={readOnly} value={s.reUnit} options={[{ value: 'DAY', label: '일 (23:59까지)' }, { value: 'HOUR', label: '시간' }]} onChange={(reUnit) => set({ reUnit, reMode: s.reMode === null ? null : reUnit === 'DAY' ? 'endOfDays' : 'minutes' })} />
              </div>
            </Row>
          </div>
        )}
      </Group>
      <Group>
        <b>발송 설정</b>
        <Row>
          <Toggle checked={s.ignoreCapping} disabled={readOnly} label="메시지 발송 빈도 제한" onChange={(ignoreCapping) => set({ ignoreCapping })} />
          <span style={{ fontSize: 14 }}>메시지 발송 빈도 제한</span>
          <Help>알림톡은 발송 빈도 제한이 항상 무시되어, 위 설정과 관계없이 발송됩니다.</Help>
        </Row>
      </Group>
      <Group>
        <b>방해 금지 시간대</b>
        <Row>
          <div style={{ width: 110 }}>
            <Select<string> disabled={readOnly} value={String(s.dnd.start)} options={HOURS} onChange={(v) => set({ dnd: { ...s.dnd, start: Number(v) } })} />
          </div>
          <small>~</small>
          <div style={{ width: 110 }}>
            <Select<string> disabled={readOnly} value={String(s.dnd.end)} options={HOURS} onChange={(v) => set({ dnd: { ...s.dnd, end: Number(v) } })} />
          </div>
        </Row>
        <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden' }}>
          {Array.from({ length: 24 }, (_, h) => (
            <i key={h} style={{ flex: 1, background: blocked(h) ? '#ef4444' : '#2f54eb', opacity: 0.8 }} />
          ))}
        </div>
        <Row style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          <span>0</span>
          <i style={{ flex: 1 }} />
          <span style={{ color: '#2f54eb' }}>■ 발송</span>
          <span style={{ color: '#ef4444' }}>■ 미발송</span>
          <i style={{ flex: 1 }} />
          <span>24</span>
        </Row>
        <Label>메시지 발송 시점이 방해 금지 시간대에 포함된 경우</Label>
        <Radios<'DELAY' | 'CANCEL'>
          column
          gap={8}
          disabled={readOnly}
          value={s.dnd.handling}
          options={[
            { value: 'DELAY', label: '다음 가능 시간으로 발송 재예약' },
            { value: 'CANCEL', label: '발송 취소 및 현재 여정 종료' },
          ]}
          onChange={(handling) => set({ dnd: { ...s.dnd, handling } })}
        />
      </Group>
    </PanelShell>
  );
}

// ── 전환 이벤트 설정 (3.4)
export function ConversionPanel({ value, readOnly, onClose, onSave }: { value: Conv | null; readOnly: boolean; onClose: () => void; onSave: (c: Conv | null) => void }) {
  const [c, setC] = useState<Conv>(value ?? initialConv('CLICK'));
  const confirm = () => {
    if (c.on && c.items.some((i) => !i.event)) return window.alert('전환 이벤트를 선택해주세요.');
    if (c.on && c.items.some((i) => i.filters.some((f) => !f[0] || !f[2]))) return window.alert('전환 이벤트 필터를 선택해 주세요.');
    onSave(c.on ? c : null);
  };
  return (
    <PanelShell title="전환 이벤트 설정" type="ENTRY" titleIcon="flag" width="wide" readOnly={readOnly} onClose={onClose} onConfirm={confirm}>
      <ConversionSection value={c} sendOnly={false} readOnly={readOnly} onChange={setC} />
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-tertiary)' }}>
        카카오 메시지와 문자는 <b>발송 기반</b>, 인앱 메시지는 <b>클릭 기반</b> 측정 기준을 사용합니다.
      </p>
    </PanelShell>
  );
}

export const PANEL: Record<Exclude<NodeType, 'ENTRY'>, (p: P) => ReactNode> = {
  SEND_NOTIFICATION: PushPanel,
  SEND_ALIMTALK: AlimtalkPanel,
  SEND_FRIENDTALK: FriendtalkPanel,
  SEND_SMS: SmsPanel,
  SEND_EMAIL: EmailPanel,
  DISPLAY_IN_APP_MESSAGE: InAppPanel,
  EXECUTE_WEBHOOK: WebhookPanel,
  TIME_DELAY: DelayPanel,
  AB_TEST: AbPanel,
  SPLIT_BY_EVENT_CONDITIONS: EventSplitPanel,
  SPLIT_BY_SEGMENT_CONDITIONS: SegmentSplitPanel,
  TRIGGER_EVENT: TriggerPanel,
  UPDATE_TAG: TagsPanel,
};
export { LABEL };
