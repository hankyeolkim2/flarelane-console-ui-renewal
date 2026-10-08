import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Modal';
import TextField from '@/components/ui/TextField';
import { alimtalkMessages, emailMessages, friendtalkMessages, smsMessages, type Conversion, type Target } from '@/lib/sent';
import { scheduled, type ChannelKey } from '@/lib/scheduled';
import { recurringMessages } from '@/lib/recurring';
import { segments } from '@/lib/audience';
import { useStore } from '@/lib/store';
import { useLeaveGuard } from '@/lib/useLeaveGuard';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';
import { ConversionSection, convError, drafts, DraftsModal, editTitle, sendFromEdit, targetFrom, type EditMode, initialConv, initialSend, initialTarget, Label, now, recurringRows, Row, Section, SendConfirm, SendSection, sendSummary, TargetSection, targetEmpty, targetSummary, useEstimate, Radios, type ConfirmBlock, type Conv, type SendState, type TargetState } from './parts';
import { Cols, DraftBtn, Foot, Head, invisibleAlert } from './PushNewMessage';

// 알림톡 · 브랜드메시지 · 문자 · 이메일 새 메시지 공용 틀 — 푸시와 같은 5섹션(docs 3 ~ 6장 「푸시 대비 차이」).
// 채널마다 「메시지」 섹션 · 미리보기 · 검증 · 확인 모달 메시지 행 · 저장 모양만 넘김.
type Ch = Exclude<ChannelKey, 'push'>;
export type Base = { id: string; source: 'console'; campaignName?: string; createdAt: string; ignoreCapping: boolean; target: Target; conversions: Conversion[]; canExport: true };
export const kakaoZero = { selected: 0, sent: 0, capped: 0, unsubscribed: 0, failed: 0, usedPoints: 0, convertedUniqueUser: 0, roas: 0, failure: {} };

export type ShellProps<M> = {
  ch: Ch;
  recurring: boolean;
  initial: M;
  copy?: { campaign?: string; msg: M; target?: Target; conversions?: Conversion[]; ignoreCapping?: boolean };
  edit?: EditMode;
  msgActions?: (m: M, set: (p: Partial<M>) => void) => ReactNode;
  renderMsg: (m: M, set: (p: Partial<M>) => void) => ReactNode;
  preview?: (m: M, openTest: () => void) => ReactNode;
  extraTarget?: (m: M, set: (p: Partial<M>) => void) => ReactNode;
  disabled?: (m: M) => boolean;
  check: (m: M) => boolean;
  invisible?: (m: M) => string[];
  msgRows: (m: M) => [string, ReactNode][];
  targetRows?: (m: M) => [string, string][];
  build: (m: M, base: Base, mode: SendState['mode']) => { id: string; createdAt: string };
  convLocked?: (m: M) => boolean;
  test?: (m: M, close: () => void) => ReactNode;
  draftTertiary?: boolean;
  draftsInRecurring?: boolean;
  demoDraft?: (m: M) => M;
};

const SENT: Record<Ch, { unshift: (x: never) => number }> = { alimtalk: alimtalkMessages, friendtalk: friendtalkMessages, sms: smsMessages, email: emailMessages } as never;

export default function Shell<M>(p: ShellProps<M>) {
  const router = useRouter();
  const { toast } = useStore();
  const allow = useLeaveGuard();
  const [campaign, setCampaign] = useState(p.copy?.campaign ?? '');
  const [target, setTarget] = useState<TargetState>(() => (p.copy?.target ? targetFrom(p.copy.target) : initialTarget()));
  const [msg, setMsg] = useState<M>(p.copy?.msg ?? p.initial);
  const [conv, setConv] = useState<Conv>(() =>
    p.copy?.conversions?.length ? { on: true, items: p.copy.conversions.map((c) => ({ event: c.eventType, filters: [], basis: p.ch === 'email' ? c.basis ?? 'CLICK' : 'SEND', n: c.hours % 24 ? c.hours : c.hours / 24, unit: c.hours % 24 ? 'HOUR' : 'DAY' })) } : initialConv('SEND'),
  );
  const [send, setSend] = useState<SendState>(() => ({ ...sendFromEdit(p.edit, initialSend(p.recurring)), ignoreCapping: !!p.copy?.ignoreCapping }));
  const [modal, setModal] = useState<'drafts' | 'test' | 'confirm' | null>(null);
  const [draftId, setDraftId] = useState<string>();
  const count = useEstimate(target);
  const setM = (x: Partial<M>) => setMsg((m) => ({ ...m, ...x }));
  const kind = p.ch === 'email' ? 'email' : 'kakao';
  const sendOnly = p.ch !== 'email';
  const label = send.mode === 'now' ? '발송' : '저장';
  const showDrafts = !p.edit && (!p.recurring || p.draftsInRecurring);
  const disabled = p.disabled?.(msg) ?? false;

  const saveDraft = () => {
    const title = campaign.trim();
    const payload = { campaign, target, msg, conv, send };
    const d = drafts.find((x) => x.id === draftId);
    if (d) Object.assign(d, { title, savedAt: now(), payload });
    else {
      const id = `d-${Date.now()}`;
      drafts.unshift({ id, channel: p.ch, title, savedAt: now(), payload });
      setDraftId(id);
    }
    toast(`"${title || '제목 없음'}"이 저장되었습니다.`);
  };

  const submit = () => {
    if (count === null) return;
    if (targetEmpty(target)) return window.alert('대상을 선택해 주세요.');
    const ce = convError(conv);
    if (ce) return window.alert(ce);
    if (!p.check(msg)) return;
    if ((p.invisible?.(msg) ?? []).some(invisibleAlert)) return;
    if (p.edit) return confirmed();
    setModal('confirm');
  };

  const confirmed = () => {
    allow();
    const name = (id: string) => segments.find((s) => s.id === id)?.name ?? id;
    const base: Base = {
      id: p.edit?.id ?? crypto.randomUUID(),
      source: 'console',
      campaignName: campaign || undefined,
      createdAt: now(),
      ignoreCapping: send.ignoreCapping,
      target:
        target.tab === 'segment'
          ? { kind: 'segment', include: target.include.filter((g) => g.length).map((g) => g.map((x) => ({ name: name(x) }))), exclude: target.exclude.flat().length ? target.exclude.filter((g) => g.length).map((g) => g.map((x) => ({ name: name(x) }))) : undefined }
          : target.tab === 'csv'
            ? { kind: 'csv', file: target.file!.name }
            : { kind: 'ids', label: target.tab === 'userId' ? '유저 ID' : target.tab === 'email' ? '이메일' : '전화번호', ids: target.ids },
      conversions: conv.on ? conv.items.map((c, i) => ({ id: `nc${i}`, eventType: c.event, basis: c.basis, filters: c.filters.map(([k, o, v]) => `${k} ${o === 'EQ' ? '=' : o} ${v}`), hours: c.n * (c.unit === 'DAY' ? 24 : 1), candidate: 0, converted: 0 })) : [],
      canExport: true,
    };
    const m = p.build(msg, base, send.mode);
    if (p.edit) {
      if (p.edit.kind === 'scheduled') {
        const it = (scheduled[p.ch] as { id: string; sendAfter: string; m: unknown }[]).find((x) => x.id === p.edit!.id);
        const at = `${send.date.replace(/-/g, '.')} ${String(send.hour).padStart(2, '0')}:${String(send.minute).padStart(2, '0')}:00`;
        if (it) Object.assign(it, { m: { ...m, createdAt: at }, sendAfter: at });
        toast('성공적으로 반영되었습니다.');
        router.push(p.ch === 'email' ? '/email/scheduled-messages' : `/${p.ch}/scheduled-messages/${p.edit.id}`);
      } else {
        const r = recurringMessages.find((x) => x.id === p.edit!.id);
        if (r) Object.assign(r, { m: { ...m, id: r.m.id, source: 'system' }, config: send.recurring });
        toast('성공적으로 반영되었습니다.');
        router.push(`/recurring-messages/${p.ch}/${p.edit.id}`);
      }
      return;
    }
    if (draftId) drafts.splice(drafts.findIndex((d) => d.id === draftId), 1);
    if (send.mode === 'now') {
      SENT[p.ch].unshift(m as never);
      toast('메시지가 성공적으로 발송되었습니다.');
      router.push(`/${p.ch}/sent-history/${m.id}`);
    } else if (send.mode === 'at') {
      const at = `${send.date.replace(/-/g, '.')} ${String(send.hour).padStart(2, '0')}:${String(send.minute).padStart(2, '0')}:00`;
      (scheduled[p.ch] as { unshift: (x: never) => number }).unshift({ id: m.id, status: 'WAITING', sendAfter: at, m: { ...m, createdAt: at } } as never);
      toast('메시지가 발송 예약되었습니다.');
      router.push(`/${p.ch}/scheduled-messages`);
    } else {
      recurringMessages.unshift({ id: `rec-${p.ch}-${Date.now()}`, ch: p.ch, active: false, createdAt: now(), config: send.recurring, m: { ...m, source: 'system' } as never, history: [] });
      toast('반복 발송 메시지가 저장되었습니다.');
      router.push({ pathname: '/recurring-messages', query: { status: 'draft' } }, '/recurring-messages');
    }
  };

  const tabName = { segment: '유저 세그먼트', userId: '유저 ID', device: '기기', csv: '파일 업로드', phone: '전화번호', email: '이메일' }[target.tab];
  const showCount = target.tab === 'segment' || target.tab === 'userId';
  const blocks: ConfirmBlock[] = [
    { title: '캠페인 명', rows: campaign ? [['캠페인 명', campaign]] : [] },
    {
      title: '대상',
      rows: [
        [tabName, targetSummary(target)],
        ...(target.exclude.flat().length ? ([['제외된 세그먼트', targetSummary({ ...target, include: target.exclude })]] as [string, string][]) : []),
        ...(p.targetRows?.(msg) ?? []),
        ...(showCount ? ([['추정 유저 수', (count ?? 0).toLocaleString('ko-KR')]] as [string, string][]) : []),
      ],
    },
    { title: '메시지', rows: p.msgRows(msg) },
    {
      title: '전환 이벤트 설정',
      rows: conv.on
        ? conv.items.flatMap((c, i): [string, string][] => [
            [`이벤트${i ? ` ${i + 1}` : ''}`, c.event],
            ['기여 기간', `${c.n} ${c.unit === 'DAY' ? '일' : '시간'}`],
            ['전환 측정 기준', c.basis === 'CLICK' ? '클릭 기반' : '발송 기반'],
            ...(c.filters.length ? ([['이벤트 필터', c.filters.map(([k, o, v]) => `${k} ${o === 'EQ' ? '=' : o} ${v}`).join('\n')]] as [string, string][]) : []),
          ])
        : [],
    },
    { title: '발송 설정', rows: [['발송 시간', sendSummary(send)], ['발송 빈도 제한 무시', send.ignoreCapping ? 'TRUE' : 'FALSE'], ...recurringRows(send)] },
  ];

  const left = (
    <div>
      <Section n={1} title="캠페인 명">
        <TextField id="campaign-name" placeholder="캠페인 명 (선택)" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
      </Section>
      <Section n={2} title="대상" help="메시지 발송 대상을 지정합니다. 세그먼트: 여러 유저 대상으로 그룹 발송합니다. 세그먼트를 다수 선택하는 경우 각 세그먼트를 OR 조건으로 연결합니다.">
        <TargetSection channel={kind} value={target} count={count} toast={toast} onChange={setTarget} />
        {p.extraTarget?.(msg, setM)}
      </Section>
      <Section n={3} title="메시지" actions={p.msgActions?.(msg, setM)}>
        {p.renderMsg(msg, setM)}
      </Section>
      <Section n={4} title="전환 이벤트 설정">
        <ConversionSection value={conv} sendOnly={sendOnly} readOnly={p.convLocked?.(msg)} onChange={setConv} />
      </Section>
      <Section n={5} title="발송 설정">
        <SendSection value={send} ttl={false} capping="1일 최대 3개, 1주 최대 10개" onChange={setSend} />
      </Section>
      <Foot>
        {p.edit ? (
          <Button size="md" onClick={() => router.push(p.edit!.kind === 'scheduled' ? `/${p.ch}/scheduled-messages` : '/recurring-messages')}>
            취소
          </Button>
        ) : (
          !p.recurring && (
            <Button size="md" hierarchy={p.draftTertiary ? 'tertiary' : 'secondary'} onClick={saveDraft}>
              임시 저장
            </Button>
          )
        )}
        <Button hierarchy="primary" size="md" disabled={disabled} onClick={submit}>
          {count === null ? <Icon name="progress_activity" size={18} /> : p.edit ? '수정' : label}
        </Button>
      </Foot>
    </div>
  );

  return (
    <>
      <Head>
        <h1>{editTitle(p.edit)}</h1>
        {showDrafts && (
          <DraftBtn type="button" onClick={() => setModal('drafts')}>
            임시 저장 <b>{drafts.filter((d) => d.channel === p.ch).length}</b>
          </DraftBtn>
        )}
      </Head>
      {p.preview ? (
        <Cols>
          {left}
          {p.preview(msg, () => setModal('test'))}
        </Cols>
      ) : (
        <Single>{left}</Single>
      )}
      {modal === 'drafts' && (
        <DraftsModal
          channel={p.ch}
          current={draftId}
          onClose={() => setModal(null)}
          onLoad={(d) => {
            const x = d.payload as { campaign: string; target: TargetState; msg: M; conv: Conv; send: SendState } | null;
            if (x) {
              setCampaign(x.campaign);
              setTarget(x.target);
              setMsg(x.msg);
              setConv(x.conv);
              setSend(x.send);
            }
            setDraftId(d.id);
            setModal(null);
          }}
        />
      )}
      {modal === 'test' && p.test?.(msg, () => setModal(null))}
      {modal === 'confirm' && <SendConfirm blocks={blocks} label={label} onClose={() => setModal(null)} onConfirm={confirmed} />}
    </>
  );
}

// ── 카카오 · 문자 테스트 발송 (docs 3.1)
const Bar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.md}px;
  ${text('text-sm', 'medium')};
  > div { height: 8px; border-radius: 4px; background: ${color('bg-tertiary')}; overflow: hidden; }
  > div > i { display: block; height: 100%; background: ${color('bg-brand-solid')}; transition: width 0.8s; }
`;

export function KakaoTestSend({ ch, onClose }: { ch: 'alimtalk' | 'friendtalk' | 'sms'; onClose: () => void }) {
  const [by, setBy] = useState<'user' | 'phone'>('user');
  const [v, setV] = useState('');
  const [state, setState] = useState<null | 'sending' | 'done'>(null);
  return (
    <Dialog
      title="테스트 발송"
      width={560}
      onClose={onClose}
      footer={
        <>
          <a href={`/${ch}/sent-history?s=testDevice&p=1`} target="_blank" rel="noreferrer" style={{ marginRight: 'auto', fontSize: 14, fontWeight: 600, color: 'var(--text-brand-secondary)' }}>
            테스트 발송 내역
          </a>
          <Button size="md" onClick={onClose}>
            닫기
          </Button>
          <Button
            hierarchy="primary"
            size="md"
            disabled={!v.trim() || state === 'sending'}
            onClick={() => {
              window.alert('발송 되었습니다.');
              setState('sending');
              setTimeout(() => setState('done'), 2000);
            }}
          >
            발송
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-tertiary)', whiteSpace: 'pre-line' }}>{'메시지 발송 전에 테스트 발송을 진행할 수 있도록 지원합니다.\n실제 발송 전 메시지 내용을 확인하고, 오류를 사전에 방지할 수 있습니다.'}</p>
        <Radios<'user' | 'phone'>
          value={by}
          options={[
            { value: 'user', label: '유저 ID' },
            { value: 'phone', label: '전화번호' },
          ]}
          onChange={(x) => {
            setBy(x);
            setV('');
          }}
        />
        <div>
          <Label>{by === 'user' ? '유저 ID' : '전화번호'}</Label>
          <Row>
            <div style={{ flex: 1 }}>
              <TextField value={v} placeholder={by === 'user' ? '유저 ID를 입력해 주세요' : '전화번호(+821000000000)를 입력하세요'} onChange={(e) => setV(e.target.value)} />
            </div>
            {by === 'user' && (
              <Button disabled={!v.trim()} onClick={() => window.open(`/all-users?q=${encodeURIComponent(v.trim())}`, '_blank')}>
                조회
              </Button>
            )}
          </Row>
        </div>
        {state && (
          <Bar>
            <Row style={{ justifyContent: 'space-between' }}>
              <span>대기</span>
              <span style={{ color: state === 'done' ? 'var(--text-brand-secondary)' : 'var(--text-tertiary)' }}>{state === 'done' ? '발송 완료' : '발송 중'}</span>
            </Row>
            <div>
              <i style={{ width: state === 'done' ? '100%' : '35%' }} />
            </div>
          </Bar>
        )}
      </div>
    </Dialog>
  );
}

const Single = styled.div`
  max-width: 960px;
  > div { display: flex; flex-direction: column; gap: 16px; }
`;

// 미리보기 열 (카카오 · 문자)
export const PreviewCard = styled.aside`
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 15px;
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  > header { display: flex; align-items: center; gap: 4px; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
`;
