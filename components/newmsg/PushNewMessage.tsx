import { useState } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import TextField from '@/components/ui/TextField';
import { pushMessages, type Platform, type PushMessage } from '@/lib/sent';
import { scheduled } from '@/lib/scheduled';
import { recurringMessages } from '@/lib/recurring';
import { segments } from '@/lib/audience';
import type { PushTemplate } from '@/lib/templates';
import { useStore } from '@/lib/store';
import { useLeaveGuard } from '@/lib/useLeaveGuard';
import { color } from '@/styles/tokens';
import { text } from '@/styles/typography';
import { ConversionSection, convError, drafts, DraftsModal, initialConv, initialSend, initialTarget, now, PLATFORM_NAME, recurringRows, Section, SendConfirm, SendSection, sendSummary, TargetSection, targetEmpty, targetSummary, useEstimate, type ConfirmBlock, type Conv, type SendState, type TargetState } from './parts';
import { AiModal, fromMessage, initialPushMsg, PushFields, PushPreviewPanel, RecentModal, TemplateModal, TestSend, type PushMsg } from './push';

// 푸시 새 메시지 — Figma 「새 메시지 — C+A 규칙」(1081:18985) + docs/staging-behavior-new-message-templates.md 2장.
export const Cols = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(300px, 32%, 368px);
  gap: 16px;
  align-items: start;
  > div { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
`;
export const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  margin-bottom: 8px;
  > h1 { flex: 1; margin: 0; ${text('display-xs', 'semibold')}; color: ${color('text-primary')}; }
`;
export const DraftBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid ${color('border-primary')};
  border-radius: 14px;
  background: ${color('bg-primary')};
  ${text('text-xs', 'semibold')};
  color: ${color('text-secondary')};
  cursor: pointer;
  > b { color: ${color('text-brand-secondary')}; }
`;
export const Foot = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 8px 0 40px;
`;

const INVISIBLE = new RegExp('[\\u2028\\u200B\\uFEFF\\u00A0]');
export function invisibleAlert(s: string) {
  const i = s.search(INVISIBLE);
  if (i < 0) return false;
  window.alert(`${s.slice(Math.max(0, i - 5), i)} 와 ${s.slice(i + 1, i + 6)} 사이에 보이지 않는 특수문자가 포함되어 있습니다.`);
  return true;
}

type Form = { campaign: string; target: TargetState; msg: PushMsg; conv: Conv; send: SendState; template: PushTemplate | null };
const initialForm = (recurring: boolean): Form => ({ campaign: '', target: initialTarget(), msg: initialPushMsg(), conv: initialConv('CLICK'), send: initialSend(recurring), template: null });

export default function PushNewMessage({ recurring = false, copy }: { recurring?: boolean; copy?: PushMessage }) {
  const router = useRouter();
  const { toast } = useStore();
  const allow = useLeaveGuard();
  const [f, setF] = useState<Form>(() => {
    const base = initialForm(recurring);
    if (!copy) return base;
    return { ...base, campaign: copy.campaignName ?? '', msg: fromMessage(copy), target: { ...base.target, platforms: copy.targetPlatforms } };
  });
  const set = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }));
  const count = useEstimate(f.target);
  const [modal, setModal] = useState<'drafts' | 'recent' | 'template' | 'ai' | 'test' | 'confirm' | null>(null);
  const [draftId, setDraftId] = useState<string | undefined>();
  const locked = !!f.template;
  const sendLabel = f.send.mode === 'now' ? '발송' : '저장';
  const draftCount = drafts.filter((d) => d.channel === 'push').length;

  const applyTemplate = (t: PushTemplate) => {
    setF((x) => ({
      ...x,
      template: t,
      msg: { ...fromMessage(t), data: x.msg.data, advanced: x.msg.advanced || !!t.buttons?.length },
      target: x.target.tab === 'userId' ? { ...x.target, platforms: t.targetPlatforms } : x.target,
      conv: t.conversion ? { on: true, items: [{ event: t.conversion.event, filters: [], basis: t.conversion.basis, n: t.conversion.hours / 24, unit: 'DAY' }] } : x.conv,
      send: { ...x.send, ignoreCapping: t.ignoreCapping },
    }));
    setModal(null);
  };

  const saveDraft = () => {
    const title = f.campaign.trim();
    const d = drafts.find((x) => x.id === draftId);
    if (d) Object.assign(d, { title, savedAt: now(), payload: f });
    else {
      const id = `d-${Date.now()}`;
      drafts.unshift({ id, channel: 'push', title, savedAt: now(), payload: f });
      setDraftId(id);
    }
    toast(`"${title || '제목 없음'}"이 저장되었습니다.`);
  };

  const submit = () => {
    if (count === null) return;
    if (targetEmpty(f.target)) return window.alert('대상을 선택해 주세요.');
    const ce = convError(f.conv);
    if (ce) return window.alert(ce);
    if (!f.msg.body.trim()) return toast('메시지 내용을 입력해 주세요.');
    if ([f.msg.title, f.msg.body, f.msg.url].some(invisibleAlert)) return;
    setModal('confirm');
  };

  const confirmed = () => {
    allow();
    const id = crypto.randomUUID();
    const pf = (f.target.tab === 'userId' ? f.target.platforms : ['android', 'ios', 'webDesktop', 'webMobile']) as Platform[];
    const zero = { sent: 0, clicked: 0, remaining: 0, uninstalled: 0, capped: 0, failed: 0, conversions: 0, amount: 0 };
    const est = count ?? 0;
    const per = Math.floor(est / Math.max(1, pf.length));
    const segName = (sid: string) => segments.find((s) => s.id === sid)?.name ?? sid;
    const m: PushMessage = {
      id,
      source: 'console',
      campaignName: f.campaign || undefined,
      title: f.msg.title || undefined,
      body: f.msg.body,
      url: f.msg.url || undefined,
      imageUrl: f.msg.image || undefined,
      buttons: f.msg.buttons.length ? f.msg.buttons : undefined,
      data: f.msg.data.length ? Object.fromEntries(f.msg.data.map((d) => [d.key, d.value])) : undefined,
      createdAt: now(),
      targetPlatforms: pf,
      stats: Object.fromEntries((['android', 'ios', 'webDesktop', 'webMobile'] as Platform[]).map((p) => [p, { ...zero, sent: f.send.mode === 'now' && pf.includes(p) ? per : 0 }])) as PushMessage['stats'],
      ttlMinutes: f.send.ttl.unit === 'UNTIL' ? undefined : f.send.ttl.n * { DAY: 1440, HOUR: 60, MINUTE: 1 }[f.send.ttl.unit],
      targetSelectionRate: f.target.rate ? f.target.rate / 100 : undefined,
      ignoreCapping: f.send.ignoreCapping,
      target:
        f.target.tab === 'segment'
          ? { kind: 'segment', include: f.target.include.filter((g) => g.length).map((g) => g.map((x) => ({ name: segName(x) }))), exclude: f.target.exclude.flat().length ? f.target.exclude.filter((g) => g.length).map((g) => g.map((x) => ({ name: segName(x) }))) : undefined }
          : f.target.tab === 'csv'
            ? { kind: 'csv', file: f.target.file!.name }
            : { kind: 'ids', label: f.target.tab === 'userId' ? '유저 ID' : '기기', ids: f.target.ids },
      conversions: f.conv.on ? f.conv.items.map((c, i) => ({ id: `nc${i}`, eventType: c.event, basis: c.basis, filters: c.filters.map(([k, o, v]) => `${k} ${o === 'EQ' ? '=' : o} ${v}`), hours: c.n * (c.unit === 'DAY' ? 24 : 1), candidate: 0, converted: 0 })) : [],
      failure: {},
      canExport: true,
    };
    if (draftId) drafts.splice(drafts.findIndex((d) => d.id === draftId), 1);
    if (f.send.mode === 'now') {
      pushMessages.unshift(m);
      toast('메시지가 성공적으로 발송되었습니다.');
      router.push(`/push/sent-history/${id}`);
    } else if (f.send.mode === 'at') {
      const at = `${f.send.date.replace(/-/g, '.')} ${String(f.send.hour).padStart(2, '0')}:${String(f.send.minute).padStart(2, '0')}:00`;
      scheduled.push.unshift({ id, status: 'WAITING', sendAfter: at, m: { ...m, createdAt: at } });
      toast('메시지가 발송 예약되었습니다.');
      router.push('/push/scheduled-messages');
    } else {
      recurringMessages.unshift({ id: `rec-push-${Date.now()}`, ch: 'push', active: false, createdAt: now(), config: f.send.recurring, m: { ...m, source: 'system' }, history: [] });
      toast('반복 발송 메시지가 저장되었습니다.');
      router.push({ pathname: '/recurring-messages', query: { status: 'draft' } }, '/recurring-messages');
    }
  };

  const t = f.target;
  const tabName = { segment: '기기 세그먼트', userId: '유저 ID', device: '기기', csv: '파일 업로드', phone: '전화번호', email: '이메일' }[t.tab];
  const blocks: ConfirmBlock[] = [
    { title: '캠페인 명', rows: f.campaign ? [['캠페인 명', f.campaign]] : [] },
    {
      title: '대상',
      rows: [
        ...(t.tab === 'userId' ? ([['플랫폼', (['android', 'ios', 'webDesktop', 'webMobile'] as const).filter((p) => t.platforms.includes(p)).map((p) => PLATFORM_NAME[p]).join(', ')]] as [string, string][]) : []),
        [tabName, targetSummary(t)],
        ...(t.exclude.flat().length ? ([['제외된 세그먼트', targetSummary({ ...t, include: t.exclude })]] as [string, string][]) : []),
        ...(t.tab !== 'csv' ? ([['추정 기기 수', t.rate ? `${Math.floor(((count ?? 0) * t.rate) / 100).toLocaleString('ko-KR')} (무작위 일부 발송 ${t.rate}%)` : (count ?? 0).toLocaleString('ko-KR')]] as [string, string][]) : []),
      ],
    },
    {
      title: '메시지',
      rows: [
        ['제목', f.msg.title || '-'],
        ['내용', f.msg.body],
        ['URL', f.msg.url || '-'],
        ['이미지', f.msg.image ? <img key="i" src={f.msg.image} alt="" style={{ maxWidth: 160, borderRadius: 6 }} /> : '-'],
        ...(f.msg.buttons.length ? ([['버튼', f.msg.buttons.map((b) => `${b.label} (${b.link})`).join('\n')]] as [string, string][]) : []),
        ...(f.msg.data.length ? ([['데이터', JSON.stringify(Object.fromEntries(f.msg.data.map((d) => [d.key, d.value])), null, 4)]] as [string, string][]) : []),
      ],
    },
    {
      title: '전환 이벤트 설정',
      rows: f.conv.on
        ? f.conv.items.flatMap((c, i): [string, string][] => [
            [`이벤트${i ? ` ${i + 1}` : ''}`, c.event],
            ['기여 기간', `${c.n} ${c.unit === 'DAY' ? '일' : '시간'}`],
            ['전환 측정 기준', c.basis === 'CLICK' ? '클릭 기반' : '발송 기반'],
            ...(c.filters.length ? ([['이벤트 필터', c.filters.map(([k, o, v]) => `${k} ${o === 'EQ' ? '=' : o} ${v}`).join('\n')]] as [string, string][]) : []),
          ])
        : [],
    },
    {
      title: '발송 설정',
      rows: [
        ['발송 시간', sendSummary(f.send)],
        ['알림 만료 기간', f.send.ttl.unit === 'UNTIL' ? '2026.10.08 23:59:00 까지' : `${f.send.ttl.n} ${{ DAY: '일', HOUR: '시간', MINUTE: '분' }[f.send.ttl.unit]}`],
        ['발송 빈도 제한 무시', f.send.ignoreCapping ? 'TRUE' : 'FALSE'],
        ...recurringRows(f.send),
      ],
    },
  ];

  return (
    <>
      <Head>
        <h1>새 메시지</h1>
        {!recurring && (
          <DraftBtn type="button" onClick={() => setModal('drafts')}>
            임시 저장 <b>{draftCount}</b>
          </DraftBtn>
        )}
      </Head>
      <Cols>
        <div>
          <Section n={1} title="캠페인 명">
            <TextField id="campaign-name" placeholder="캠페인 명 (선택)" value={f.campaign} onChange={(e) => set({ campaign: e.target.value })} />
          </Section>
          <Section n={2} title="대상" help="메시지 발송 대상을 지정합니다. 세그먼트: 여러 기기 대상으로 그룹 발송합니다. 세그먼트를 다수 선택하는 경우 각 세그먼트를 OR 조건으로 연결합니다. 유저 ID: 유저 ID 대상으로 발송합니다. 기기: 기기별 고유한 기기ID를 대상으로 단일 발송합니다.">
            <TargetSection channel="push" value={f.target} count={count} toast={toast} onChange={(target) => set({ target: locked && target.tab === 'userId' ? { ...target, platforms: f.template!.targetPlatforms } : target })} />
          </Section>
          <Section
            n={3}
            title="메시지"
            actions={
              <>
                <Button hierarchy="primary" iconLeading="auto_awesome" onClick={() => setModal('ai')}>
                  AI
                </Button>
                <Button disabled={locked} onClick={() => setModal('recent')}>
                  최근 발송 메시지
                </Button>
                {locked ? (
                  <Button iconTrailing="close" onClick={() => set({ template: null })}>
                    템플릿 수정
                  </Button>
                ) : (
                  <Button onClick={() => setModal('template')}>템플릿 선택</Button>
                )}
              </>
            }
          >
            <PushFields value={f.msg} locked={locked} toast={toast} onChange={(msg) => set({ msg })} />
          </Section>
          <Section n={4} title="전환 이벤트 설정">
            <ConversionSection value={f.conv} readOnly={locked} sendOnly={false} onChange={(conv) => set({ conv })} />
          </Section>
          <Section n={5} title="발송 설정">
            <SendSection value={f.send} ttl capping="1일 최대 3개, 1주 최대 10개" onChange={(send) => set({ send })} />
          </Section>
          <Foot>
            {!recurring && (
              <Button size="md" onClick={saveDraft}>
                임시 저장
              </Button>
            )}
            <Button hierarchy="primary" size="md" onClick={submit}>
              {count === null ? <Icon name="progress_activity" size={18} /> : sendLabel}
            </Button>
          </Foot>
        </div>
        <PushPreviewPanel msg={f.msg} onTest={() => setModal('test')} />
      </Cols>
      {modal === 'drafts' && (
        <DraftsModal
          channel="push"
          current={draftId}
          onClose={() => setModal(null)}
          onLoad={(d) => {
            if (d.payload) setF(d.payload as Form);
            else set({ campaign: d.title, msg: { ...initialPushMsg(), title: '[가을 프로모션] 최대 50% 할인', body: '이번 주말까지만 드리는 혜택을 확인하세요.' } });
            setDraftId(d.id);
            setModal(null);
          }}
        />
      )}
      {modal === 'recent' && (
        <RecentModal
          onClose={() => setModal(null)}
          onPick={(m) => {
            set({ template: null, msg: fromMessage(m) });
            setModal(null);
          }}
        />
      )}
      {modal === 'template' && <TemplateModal onClose={() => setModal(null)} onPick={applyTemplate} />}
      {modal === 'ai' && (
        <AiModal
          onClose={() => setModal(null)}
          onPick={(c) => {
            set({ msg: { ...f.msg, title: c.title, body: c.body, image: c.image } });
            setModal(null);
          }}
        />
      )}
      {modal === 'test' && <TestSend msg={f.msg} platformsFixed={f.template?.targetPlatforms} toast={toast} onClose={() => setModal(null)} />}
      {modal === 'confirm' && <SendConfirm blocks={blocks} label={sendLabel} onClose={() => setModal(null)} onConfirm={confirmed} />}
    </>
  );
}
