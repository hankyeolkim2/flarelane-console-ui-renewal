import { useState } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { Dialog } from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { MinimalTabs } from '@/components/ui/Tabs';
import TextField from '@/components/ui/TextField';
import type { EmailMessage } from '@/lib/sent';
import { emailPresets, emailSenders, emailTemplates } from '@/lib/templates';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';
import { Label, Row, VarField } from './parts';
import type { EditMode } from './parts';
import Shell, { kakaoZero } from './Shell';

// 이메일 새 메시지 — docs 6장. 미리보기 열 없음, 본문은 템플릿 선택 → 편집(전체 화면 에디터)으로 만듦.
type M = { html: string; templateId: string | null; sender: string | null; subject: string; modal: null | 'pick' | 'preview' | 'edit' };
export type EmM = M;
export const emInitial = (): M => ({ ...initial });
const initial: M = { html: '', templateId: null, sender: null, subject: '', modal: null };
export const summary = (html: string) => html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);

const Add = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 48px 16px;
  border: 1px dashed ${color('border-primary')};
  border-radius: ${radius.lg}px;
  background: ${color('bg-primary')};
  ${text('text-sm', 'semibold')};
  color: ${color('text-tertiary')};
  cursor: pointer;
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  &:hover { border-color: ${color('border-brand')}; }
`;
export const Frame = ({ html, w = 600, h = 260, scale = 0.5 }: { html: string; w?: number; h?: number; scale?: number }) => (
  <div style={{ position: 'relative', width: w * scale, height: h, overflow: 'hidden', borderRadius: 8, border: '1px solid var(--border-secondary)', background: '#fff', flexShrink: 0 }}>
    <iframe title="이메일" srcDoc={html} sandbox="allow-same-origin" style={{ width: w, height: h / scale, border: 0, transform: `scale(${scale})`, transformOrigin: '0 0', pointerEvents: 'none' }} />
  </div>
);
const Thumb = styled.button<{ $on: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px;
  border: 1px solid ${(p) => (p.$on ? color('border-brand') : color('border-secondary'))};
  outline: ${(p) => (p.$on ? `1px solid ${color('border-brand')}` : 'none')};
  border-radius: ${radius.md}px;
  background: ${color('bg-primary')};
  cursor: pointer;
  text-align: left;
  > span { ${text('text-xs', 'medium')}; color: ${color('text-secondary')}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

export function EmailTemplatePicker({ quickOnly, onClose, onPick }: { quickOnly?: boolean; onClose: () => void; onPick: (html: string, templateId: string | null) => void }) {
  const [tab, setTab] = useState<'quick' | 'mine'>('quick');
  const list = tab === 'quick' ? emailPresets.map((p) => ({ id: p.id, name: p.name, html: p.html })) : emailTemplates.map((t) => ({ id: t.id, name: t.name, html: t.html }));
  const [sel, setSel] = useState<string | null>(null);
  const cur = list.find((x) => x.id === sel);
  return (
    <Dialog
      title={quickOnly ? '기본 제공 템플릿으로 시작하기' : '템플릿 선택'}
      width={960}
      onClose={onClose}
      footer={
        <>
          <Button size="md" onClick={onClose}>
            취소
          </Button>
          <Button hierarchy="primary" size="md" disabled={!cur} onClick={() => cur && onPick(cur.html, tab === 'mine' ? cur.id : null)}>
            선택
          </Button>
        </>
      }
    >
      {!quickOnly && (
        <div style={{ marginBottom: 16 }}>
          <MinimalTabs<'quick' | 'mine'>
            items={[
              { value: 'quick', label: '빠른 시작' },
              { value: 'mine', label: '내 템플릿' },
            ]}
            value={tab}
            onChange={(t) => {
              setTab(t);
              setSel(null);
            }}
          />
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10, alignContent: 'start', maxHeight: 460, overflow: 'auto' }}>
          {list.map((x) => (
            <Thumb key={x.id} type="button" $on={sel === x.id} onClick={() => setSel(x.id)}>
              <Frame html={x.html} h={150} scale={0.2} />
              <span>{x.name}</span>
            </Thumb>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Label>템플릿 미리보기</Label>
          {cur ? <Frame html={cur.html} h={460} scale={320 / 600} /> : <p style={{ margin: 0, padding: 48, textAlign: 'center', fontSize: 14, color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', borderRadius: 8 }}>템플릿 미리보기</p>}
        </div>
      </div>
    </Dialog>
  );
}

export function EmailPreviewModal({ html, subject, onClose }: { html: string; subject: string; onClose: () => void }) {
  const [mobile, setMobile] = useState(false);
  return (
    <Dialog
      title="이메일 미리보기"
      width={760}
      onClose={onClose}
      actions={
        <Row>
          <IconButton icon="desktop_windows" label="데스크탑" hierarchy={mobile ? 'tertiary' : 'secondary'} onClick={() => setMobile(false)} />
          <IconButton icon="smartphone" label="모바일" hierarchy={mobile ? 'secondary' : 'tertiary'} onClick={() => setMobile(true)} />
        </Row>
      }
    >
      <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>{subject || '(제목 없음)'}</p>
      <div style={{ display: 'flex', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: 8, padding: 16 }}>
        <iframe title="이메일 미리보기" srcDoc={html} sandbox="allow-same-origin" style={{ width: mobile ? 375 : 680, height: 520, border: 0, background: '#fff', borderRadius: 6 }} />
      </div>
    </Dialog>
  );
}

// 전체 화면 에디터 — 스테이징은 Unlayer. 프로토타입은 HTML 편집 + 실시간 미리보기.
const Editor = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  background: ${color('bg-secondary')};
  > header { display: flex; align-items: center; gap: 8px; height: 60px; padding: 0 20px; background: ${color('bg-primary')}; border-bottom: 1px solid ${color('border-secondary')}; box-shadow: ${shadow.xs}; }
  > header > b { flex: 1; ${text('text-md', 'semibold')}; color: ${color('text-primary')}; }
  > div { flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; padding: 16px; min-height: 0; }
  > div > textarea { width: 100%; height: 100%; padding: 16px; border: 1px solid ${color('border-secondary')}; border-radius: ${radius.lg}px; font: 13px/1.5 ui-monospace, monospace; resize: none; }
  > div > iframe { width: 100%; height: 100%; border: 1px solid ${color('border-secondary')}; border-radius: ${radius.lg}px; background: #fff; }
`;

export function EmailEditor({ title, html, onClose, onDone }: { title: string; html: string; onClose: () => void; onDone: (html: string) => void }) {
  const [v, setV] = useState(html);
  const [test, setTest] = useState(false);
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState('');
  return (
    <Editor data-cover>
      <header>
        <IconButton icon="close" label="닫기" onClick={onClose} />
        <b>{title}</b>
        <Button onClick={() => setTest(true)}>테스트 발송</Button>
        <Button
          hierarchy="primary"
          onClick={() => {
            if (!/수신거부|unsubscribe/i.test(v)) return window.alert('수신거부 링크가 없습니다.');
            onDone(v);
          }}
        >
          완료
        </Button>
      </header>
      <div>
        <textarea aria-label="HTML" value={v} onChange={(e) => setV(e.target.value)} spellCheck={false} />
        <iframe title="편집 미리보기" srcDoc={v} sandbox="allow-same-origin" />
      </div>
      {test && (
        <Dialog
          title="테스트 발송"
          onClose={() => setTest(false)}
          footer={
            <>
              <Button size="md" onClick={() => setTest(false)}>
                취소
              </Button>
              <Button
                hierarchy="primary"
                size="md"
                onClick={() => {
                  if (!from || !to.trim()) return window.alert('빈 값이 존재합니다.');
                  window.alert('발송 되었습니다.');
                  setTest(false);
                }}
              >
                발송
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <Label>발신자 선택</Label>
              <Select<string> value={from} placeholder="발신자 이메일(도메인 주소)" options={emailSenders.map((s) => ({ value: s.email, label: `${s.email} (${s.name})` }))} onChange={setFrom} />
            </div>
            <div>
              <Label>수신 이메일 입력</Label>
              <TextField placeholder="이메일을 입력하세요." value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        </Dialog>
      )}
    </Editor>
  );
}

export function EmailFields({ m, set }: { m: M; set: (p: Partial<M>) => void }) {
  return (
    <>
      {m.html ? (
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: 16, borderRadius: 10, background: 'var(--bg-secondary)' }}>
          <Frame html={m.html} h={320} scale={0.6} />
          <div style={{ position: 'absolute', top: 8, right: 8 }}>
            <IconButton icon="close" label="본문 삭제" hierarchy="secondary" onClick={() => set({ html: '', templateId: null })} />
          </div>
        </div>
      ) : (
        <Add type="button" onClick={() => set({ modal: 'pick' })}>
          <span>
            <Icon name="add_circle" size={28} />
          </span>
          이메일 본문 추가하기
        </Add>
      )}
      <div>
        <Label>발신자 정보</Label>
        <Select<string> value={m.sender} placeholder="발신자 이메일(도메인 주소)" options={emailSenders.map((s) => ({ value: s.email, label: `${s.email} (${s.name})` }))} onChange={(sender) => set({ sender })} />
      </div>
      <div>
        <Label>이메일 제목</Label>
        <VarField ariaLabel="이메일 제목" value={m.subject} placeholder="이메일 제목" onChange={(subject) => set({ subject })} />
      </div>
      {m.html && (
        <Row>
          <small style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary(m.html)}</small>
          <Button onClick={() => set({ modal: 'preview' })}>미리보기</Button>
          <Button onClick={() => set({ modal: 'edit' })}>편집</Button>
        </Row>
      )}
      {m.modal === 'pick' && <EmailTemplatePicker onClose={() => set({ modal: null })} onPick={(html, templateId) => set({ html, templateId, modal: null })} />}
      {m.modal === 'preview' && <EmailPreviewModal html={m.html} subject={m.subject} onClose={() => set({ modal: null })} />}
      {m.modal === 'edit' && <EmailEditor title={m.subject || '이메일 편집'} html={m.html} onClose={() => set({ modal: null })} onDone={(html) => set({ html, modal: null })} />}
    </>
  );
}

export default function EmailNewMessage({ recurring, copy, edit }: { recurring: boolean; copy?: EmailMessage; edit?: EditMode }) {
  return (
    <Shell<M>
      ch="email"
      recurring={recurring}
      edit={edit}
      draftTertiary
      draftsInRecurring
      initial={initial}
      copy={copy && { campaign: copy.campaignName, target: copy.target, conversions: copy.conversions, ignoreCapping: copy.ignoreCapping, msg: { ...initial, html: copy.body, sender: copy.senderEmail, subject: copy.title } }}
      renderMsg={(m, set) => <EmailFields m={m} set={set} />}
      convLocked={(m) => !!m.templateId}
      check={(m) => {
        if (!m.html || !m.subject.trim() || !m.sender) {
          window.alert('빈 값이 존재합니다.');
          return false;
        }
        return true;
      }}
      invisible={(m) => [m.subject]}
      msgRows={(m) => [
        ['발신자 정보', m.sender ?? '-'],
        ['이메일 제목', m.subject],
        ['이메일 본문', <Frame key="f" html={m.html} h={200} scale={0.4} />],
      ]}
      build={(m, base) => ({ ...base, ...kakaoZero, title: m.subject, senderEmail: m.sender!, body: m.html, delivered: 0, pending: 0, aborted: 0, opened: 0, converted: 0, purchaseAmount: 0, softBounced: 0, hardBounced: 0, quotaExceeded: 0 })}
    />
  );
}
