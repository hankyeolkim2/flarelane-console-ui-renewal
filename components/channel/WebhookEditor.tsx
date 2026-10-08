import { forwardRef, useImperativeHandle, useRef, useState, type KeyboardEvent } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import PersonalizeModal from './PersonalizeModal';
import { checkJson, formatJson, splitVars } from '@/lib/liquid';
import { METHODS, type Method } from '@/lib/webhooks';
import { color, radius, shadow } from '@/styles/tokens';
import { secondaryShadow } from '@/styles/effects';
import { text } from '@/styles/typography';

// Figma 「채널 — 새 웹훅」(1322:1695) · 「웹훅 상세」(1324:2) 의 안쪽 테두리 패널 — URL · HEADERS · BODY.
// 편집: URL · Key · Value 는 `Input field` Trailing button(`{}` = data_object), BODY = 줄 번호 코드칸 240(서식 · `{}` 버튼).
// 읽기 전용(상세): 메서드 + 주소 글자, HEADERS 2칸 표(0줄 = 「-」), BODY 코드칸 160. 변수 `{{ … }}` 는 text-warning-primary.
export type Draft = { method: Method; url: string; headers: { key: string; value: string }[]; body: string };

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
`;

const Sec = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  > h4 { margin: 0; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const V = styled.span`
  color: ${color('text-warning-primary')};
`;

export function Vars({ s }: { s: string }) {
  return (
    <>
      {splitVars(s).map((p, i) => (p.v ? <V key={i}>{p.text}</V> : <span key={i}>{p.text}</span>))}
    </>
  );
}

// ── 변수 입력칸 (한 줄, Enter 막힘, 오른쪽에 붙은 `{}` 버튼)
const VarBox = styled.div<{ w?: number }>`
  display: flex;
  ${(p) => (p.w ? `width: ${p.w}px; flex-shrink: 0;` : 'flex: 1; min-width: 0;')}
  height: 36px;
  border-radius: ${radius.md}px;
  box-shadow: ${shadow.xs};
  > input {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0 11px;
    border: 1px solid ${color('border-primary')};
    border-right: 0;
    border-radius: ${radius.md}px 0 0 ${radius.md}px;
    background: ${color('bg-primary')};
    outline: none;
    ${text('text-sm', 'regular')};
    color: ${color('text-primary')};
  }
  > input::placeholder { color: ${color('text-placeholder')}; }
  > input:focus { border-color: ${color('border-brand')}; border-right: 1px solid ${color('border-brand')}; }
  > button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    border: 1px solid ${color('border-primary')};
    border-radius: 0 ${radius.md}px ${radius.md}px 0;
    background: ${color('bg-primary')};
    color: ${color('fg-quaternary')};
    cursor: pointer;
  }
  > button:hover { background: ${color('bg-primary_hover')}; color: ${color('fg-quaternary_hover')}; }
`;

type Insertable = { insert: (s: string) => void };

const VarInput = forwardRef<Insertable, { value: string; onChange: (v: string) => void; placeholder: string; width?: number; onVar: (target: Insertable) => void }>(function VarInput({ value, onChange, placeholder, width, onVar }, ref) {
  const input = useRef<HTMLInputElement>(null);
  const api: Insertable = {
    insert: (s) => {
      const el = input.current;
      const a = el?.selectionStart ?? value.length;
      const b = el?.selectionEnd ?? value.length;
      onChange(value.slice(0, a) + s + value.slice(b));
      requestAnimationFrame(() => {
        el?.focus();
        el?.setSelectionRange(a + s.length, a + s.length);
      });
    },
  };
  useImperativeHandle(ref, () => api);
  return (
    <VarBox w={width}>
      <input ref={input} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
      <button type="button" aria-label="개인화 변수" onClick={() => onVar(api)}>
        <Icon name="data_object" size={20} />
      </button>
    </VarBox>
  );
});

// ── 코드칸
const Code = styled.div<{ h: number; $invalid: boolean }>`
  position: relative;
  display: flex;
  height: ${(p) => p.h}px;
  border: 1px solid ${(p) => (p.$invalid ? color('border-error') : color('border-secondary'))};
  border-radius: ${radius.md}px;
  background: ${color('bg-primary')};
  overflow: hidden;
  &:focus-within { border-color: ${(p) => (p.$invalid ? color('border-error') : color('border-brand'))}; }
`;

const Gutter = styled.div`
  flex-shrink: 0;
  width: 36px;
  padding: 12px 0;
  background: ${color('bg-secondary')};
  overflow: hidden;
  > div { position: relative; height: 20px; ${text('text-sm', 'regular')}; color: ${color('text-quaternary')}; text-align: center; font-variant-numeric: tabular-nums; }
  > div[data-err] { color: ${color('text-error-primary')}; }
  > div[data-err]::before { content: ''; position: absolute; left: 4px; top: 7px; width: 6px; height: 6px; border-radius: 50%; background: ${color('fg-error-secondary')}; }
`;

const Area = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  > pre, > textarea {
    position: absolute;
    inset: 0;
    margin: 0;
    padding: 12px 60px 12px 12px;
    border: 0;
    ${text('text-sm', 'regular')};
    font-family: inherit;
    white-space: pre-wrap;
    word-break: break-all;
    overflow: auto;
    tab-size: 4;
  }
  > pre { color: ${color('text-primary')}; pointer-events: none; }
  > textarea { background: transparent; color: transparent; caret-color: ${color('text-primary')}; resize: none; outline: none; }
  > pre[data-ro] { position: static; height: 100%; pointer-events: auto; }
`;

const CodeBtn = styled.button<{ at: 'top' | 'bottom' }>`
  position: absolute;
  right: 12px;
  ${(p) => (p.at === 'top' ? 'top: 12px;' : 'bottom: 12px;')}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.md}px;
  background: ${color('bg-primary')};
  box-shadow: ${secondaryShadow};
  color: ${color('fg-quaternary')};
  cursor: pointer;
  &:hover { background: ${color('bg-primary_hover')}; color: ${color('fg-quaternary_hover')}; }
`;

const InvalidTag = styled.span`
  position: absolute;
  right: 56px;
  top: 18px;
`;

function lines(s: string) {
  return Math.max(1, s.split('\n').length);
}

function BodyEditor({ value, onChange, onVar }: { value: string; onChange: (v: string) => void; onVar: (t: Insertable) => void }) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const gut = useRef<HTMLDivElement>(null);
  const check = checkJson(value);
  const replace = (a: number, b: number, s: string) => {
    onChange(value.slice(0, a) + s + value.slice(b));
    requestAnimationFrame(() => ta.current?.setSelectionRange(a + s.length, a + s.length));
  };
  const api: Insertable = { insert: (s) => { const el = ta.current; replace(el?.selectionStart ?? value.length, el?.selectionEnd ?? value.length, s); el?.focus(); } };
  const key = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    if (e.key === 'Tab') {
      e.preventDefault();
      replace(el.selectionStart, el.selectionEnd, '    ');
    } else if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      // 윗줄 들여쓰기 유지
      e.preventDefault();
      const lineStart = value.lastIndexOf('\n', el.selectionStart - 1) + 1;
      const indent = value.slice(lineStart).match(/^ */)![0];
      replace(el.selectionStart, el.selectionEnd, `\n${indent}`);
    }
  };
  return (
    <Code h={240} $invalid={!check.ok}>
      <Gutter ref={gut}>
        {Array.from({ length: lines(value) }, (_, i) => (
          <div key={i} data-err={!check.ok && check.line === i + 1 ? '' : undefined}>{i + 1}</div>
        ))}
      </Gutter>
      <Area>
        <pre ref={pre} aria-hidden>
          <Vars s={value} />
          {' '}
        </pre>
        <textarea
          ref={ta}
          aria-label="BODY"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={key}
          onScroll={(e) => {
            if (pre.current) pre.current.scrollTop = e.currentTarget.scrollTop;
            if (gut.current) gut.current.scrollTop = e.currentTarget.scrollTop;
          }}
        />
        {!check.ok && (
          <InvalidTag>
            <Badge color="error">Invalid</Badge>
          </InvalidTag>
        )}
        <CodeBtn type="button" at="top" aria-label="JSON 정리" title="JSON 정리" onClick={() => { const f = formatJson(value); if (f !== null) onChange(f); }}>
          <Icon name="format_list_bulleted" size={20} />
        </CodeBtn>
        <CodeBtn type="button" at="bottom" aria-label="개인화 변수" onClick={() => onVar(api)}>
          <Icon name="data_object" size={20} />
        </CodeBtn>
      </Area>
    </Code>
  );
}

const HeadTable = styled.div`
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.md}px;
  overflow: hidden;
  > div { display: grid; grid-template-columns: 240px minmax(0, 1fr); }
  > div + div { border-top: 1px solid ${color('border-secondary')}; }
  > div > span { padding: 10px 12px; ${text('text-sm', 'regular')}; color: ${color('text-primary')}; word-break: break-all; }
  > div > span + span { border-left: 1px solid ${color('border-secondary')}; }
`;

const Dash = styled.p`
  margin: 0;
  ${text('text-sm', 'regular')};
  color: ${color('text-tertiary')};
`;

export function WebhookView({ draft }: { draft: Draft }) {
  return (
    <Panel>
      <Sec>
        <h4>URL</h4>
        <Row style={{ gap: 16, alignItems: 'flex-start', ...{ fontSize: 14, lineHeight: '20px' } }}>
          <b style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{draft.method}</b>
          <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>
            <Vars s={draft.url} />
          </span>
        </Row>
      </Sec>
      <Sec>
        <h4>HEADERS</h4>
        {draft.headers.length === 0 ? (
          <Dash>-</Dash>
        ) : (
          <HeadTable>
            {draft.headers.map((h, i) => (
              <div key={i}>
                <span>
                  <Vars s={h.key} />
                </span>
                <span>
                  <Vars s={h.value} />
                </span>
              </div>
            ))}
          </HeadTable>
        )}
      </Sec>
      <Sec>
        <h4>BODY</h4>
        <Code h={160} $invalid={false}>
          <Gutter>
            {Array.from({ length: lines(draft.body) }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </Gutter>
          <Area>
            <pre data-ro style={{ paddingRight: 12 }}>
              <Vars s={draft.body} />
            </pre>
          </Area>
        </Code>
      </Sec>
    </Panel>
  );
}

const IconBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: ${radius.md}px;
  background: transparent;
  color: ${color('fg-quaternary')};
  cursor: pointer;
  &:hover { background: ${color('bg-primary_hover')}; color: ${color('fg-quaternary_hover')}; }
`;

export function WebhookForm({ draft, onChange }: { draft: Draft; onChange: (d: Draft) => void }) {
  const [target, setTarget] = useState<Insertable | null>(null);
  const set = (p: Partial<Draft>) => onChange({ ...draft, ...p });
  const setHeader = (i: number, p: Partial<Draft['headers'][number]>) => set({ headers: draft.headers.map((h, j) => (j === i ? { ...h, ...p } : h)) });
  return (
    <Panel>
      <Sec>
        <h4>URL</h4>
        <Row>
          <Select<Method> width={120} menuWidth={160} value={draft.method} options={METHODS.map((m) => ({ value: m, label: m }))} onChange={(method) => set({ method })} />
          <VarInput value={draft.url} placeholder="https://" onChange={(url) => set({ url })} onVar={setTarget} />
        </Row>
      </Sec>
      <Sec>
        <h4>HEADERS</h4>
        {draft.headers.length === 0 && <Dash>-</Dash>}
        {draft.headers.map((h, i) => (
          <Row key={i}>
            <VarInput width={400} value={h.key} placeholder="Key" onChange={(key) => setHeader(i, { key })} onVar={setTarget} />
            <VarInput value={h.value} placeholder="Value" onChange={(value) => setHeader(i, { value })} onVar={setTarget} />
            <IconBtn type="button" aria-label="삭제" onClick={() => set({ headers: draft.headers.filter((_, j) => j !== i) })}>
              <Icon name="delete" size={20} />
            </IconBtn>
          </Row>
        ))}
        <Row style={{ justifyContent: 'flex-end' }}>
          <Button hierarchy="tertiary" iconLeading="add" onClick={() => set({ headers: [...draft.headers, { key: '', value: '' }] })}>
            추가
          </Button>
        </Row>
      </Sec>
      <Sec>
        <h4>BODY</h4>
        <BodyEditor value={draft.body} onChange={(body) => set({ body })} onVar={setTarget} />
      </Sec>
      {target && (
        <PersonalizeModal
          onClose={() => setTarget(null)}
          onConfirm={(s) => {
            target.insert(s);
            setTarget(null);
          }}
        />
      )}
    </Panel>
  );
}
