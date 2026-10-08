import { useState } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import { AlimtalkPreview } from '@/components/preview/KakaoPreview';
import type { AlimtalkMessage } from '@/lib/sent';
import { alimtalkTemplates, varsOf, type AlimtalkTemplate } from '@/lib/templates';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';
import { Label, VarField } from './parts';
import Shell, { KakaoTestSend, kakaoZero, PreviewCard } from './Shell';

// 알림톡 새 메시지 — docs 3장. 검수 완료 템플릿을 골라야 발송 가능, 템플릿의 #{변수}마다 값 입력.
type M = { t: AlimtalkTemplate | null; vars: Record<string, string>; detail: boolean; picker: boolean };
const initial: M = { t: null, vars: {}, detail: false, picker: false };

const Add = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 40px 16px;
  border: 1px dashed ${color('border-primary')};
  border-radius: ${radius.lg}px;
  background: ${color('bg-primary')};
  ${text('text-sm', 'semibold')};
  color: ${color('text-tertiary')};
  cursor: pointer;
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  &:hover { border-color: ${color('border-brand')}; }
`;
const Info = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  row-gap: 8px;
  padding: 14px 16px;
  border-radius: ${radius.md}px;
  background: ${color('bg-secondary')};
  > dt { ${text('text-sm', 'medium')}; color: ${color('text-tertiary')}; }
  > dd { margin: 0; ${text('text-sm', 'regular')}; color: ${color('text-primary')}; }
`;
const VarRow = styled.div`
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  > span { ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; font-family: ui-monospace, monospace; }
`;
const Pick = styled.button<{ $on: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  padding: 11px 14px;
  border: 1px solid ${(p) => (p.$on ? color('border-brand') : color('border-secondary'))};
  outline: ${(p) => (p.$on ? `1px solid ${color('border-brand')}` : 'none')};
  border-radius: ${radius.md}px;
  background: ${color('bg-primary')};
  text-align: left;
  cursor: pointer;
  > small { ${text('text-xs', 'medium')}; color: ${color('text-tertiary')}; }
  > b { ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
`;

const asMsg = (m: M) =>
  ({
    ...(m.t ?? { templateContent: '', buttons: [], emphasis: 'NONE', messageType: 'BA' }),
    templateContent: m.t ? Object.entries(m.vars).reduce((s, [k, v]) => s.split(k).join(v || k), m.t.templateContent) : '템플릿을 선택해 주세요.',
    interpolations: m.vars,
  }) as unknown as AlimtalkMessage;

function TemplatePicker({ onClose, onPick }: { onClose: () => void; onPick: (t: AlimtalkTemplate) => void }) {
  const list = alimtalkTemplates.filter((t) => t.inspection === 'COM');
  const [p, setP] = useState(1);
  const [sel, setSel] = useState<AlimtalkTemplate | null>(null);
  return (
    <Dialog
      title="템플릿 선택"
      width={800}
      onClose={onClose}
      footer={
        <>
          <Button size="md" onClick={onClose}>
            취소
          </Button>
          <Button hierarchy="primary" size="md" disabled={!sel} onClick={() => sel && onPick(sel)}>
            확인
          </Button>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.slice((p - 1) * 5, p * 5).map((t) => (
            <Pick key={t.id} type="button" $on={sel?.id === t.id} onClick={() => setSel(t)}>
              <small>{t.templateCode}</small>
              <b>{t.templateName}</b>
            </Pick>
          ))}
          <div style={{ marginTop: 4 }}>
            <Pagination page={p} pages={Math.ceil(list.length / 5)} onChange={setP} />
          </div>
        </div>
        <div>
          <Label>미리보기</Label>
          {sel ? <AlimtalkPreview m={asMsg({ ...initial, t: sel })} /> : <p style={{ margin: 0, padding: 40, textAlign: 'center', fontSize: 14, color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', borderRadius: 8 }}>템플릿을 선택해 주세요</p>}
        </div>
      </div>
    </Dialog>
  );
}

function Fields({ m, set }: { m: M; set: (p: Partial<M>) => void }) {
  const pick = (t: AlimtalkTemplate) => set({ t, picker: false, vars: Object.fromEntries(varsOf(t).map((k) => [k, ''])) });
  return (
    <>
      {m.t ? (
        <>
          <Info>
            <dt>카테고리</dt>
            <dd>{`${m.t.categoryGroup} > ${m.t.category}`}</dd>
            <dt>템플릿 이름</dt>
            <dd>{m.t.templateName}</dd>
            <dt>템플릿 코드</dt>
            <dd>{m.t.templateCode}</dd>
          </Info>
          {Object.keys(m.vars).length > 0 && (
            <div>
              <Label>개인화 변수 설정</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.keys(m.vars).map((k) => (
                  <VarRow key={k}>
                    <span>{k}</span>
                    <VarField ariaLabel={k} value={m.vars[k]} placeholder="값 입력" onChange={(v) => set({ vars: { ...m.vars, [k]: v } })} />
                  </VarRow>
                ))}
              </div>
            </div>
          )}
          <div>
            <Button hierarchy="tertiary" iconTrailing={m.detail ? 'keyboard_arrow_up' : 'keyboard_arrow_down'} onClick={() => set({ detail: !m.detail })}>
              템플릿 상세
            </Button>
            {m.detail && (
              <Info style={{ marginTop: 8 }}>
                <dt>강조유형</dt>
                <dd>{{ NONE: '기본형', TEXT: '강조 표기형', IMAGE: '이미지형', ITEM_LIST: '아이템 리스트형' }[m.t.emphasis]}</dd>
                <dt>메시지 유형</dt>
                <dd>{{ BA: '기본형', EX: '부가 정보형', AD: '채널 추가형', MI: '복합형' }[m.t.messageType]}</dd>
                <dt>내용</dt>
                <dd style={{ whiteSpace: 'pre-wrap' }}>{m.t.templateContent}</dd>
                {m.t.templateExtra && (
                  <>
                    <dt>부가 정보</dt>
                    <dd>{m.t.templateExtra}</dd>
                  </>
                )}
                <dt>버튼</dt>
                <dd style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {m.t.buttons.map((b) => (
                    <Badge key={b.name}>{`${b.type} · ${b.name}`}</Badge>
                  ))}
                </dd>
              </Info>
            )}
          </div>
        </>
      ) : (
        <Add type="button" onClick={() => set({ picker: true })}>
          <span>
            <Icon name="add" size={28} />
          </span>
          템플릿 선택
        </Add>
      )}
      {m.picker && <TemplatePicker onClose={() => set({ picker: false })} onPick={pick} />}
    </>
  );
}

export default function AlimtalkNewMessage({ recurring, copy }: { recurring: boolean; copy?: AlimtalkMessage }) {
  const ct = copy && alimtalkTemplates.find((t) => t.templateCode === copy.templateCode);
  return (
    <Shell<M>
      ch="alimtalk"
      recurring={recurring}
      initial={initial}
      copy={copy && { campaign: copy.campaignName, msg: { t: ct ?? null, vars: ct ? Object.fromEntries(varsOf(ct).map((k) => [k, copy.interpolations[k] ?? ''])) : {}, detail: false, picker: false } }}
      msgActions={(_, set) => <Button onClick={() => set({ picker: true })}>템플릿 선택</Button>}
      renderMsg={(m, set) => <Fields m={m} set={set} />}
      preview={(m, test) => (
        <PreviewCard>
          <header>미리보기</header>
          <AlimtalkPreview m={asMsg(m)} />
          <Button full iconLeading="send" onClick={test}>
            테스트 발송
          </Button>
        </PreviewCard>
      )}
      test={(_, close) => <KakaoTestSend ch="alimtalk" onClose={close} />}
      disabled={(m) => !m.t}
      check={() => true}
      invisible={(m) => Object.values(m.vars)}
      msgRows={(m) => [
        ['템플릿 이름', m.t?.templateName ?? '-'],
        ['템플릿 코드', m.t?.templateCode ?? '-'],
        ...(Object.keys(m.vars).length ? ([['개인화 변수 설정', Object.entries(m.vars).map(([k, v]) => `${k}: ${v}`).join('\n')]] as [string, string][]) : []),
      ]}
      build={(m, base) => ({ ...base, ...kakaoZero, ...m.t!, ...asMsg(m), id: base.id, createdAt: base.createdAt })}
    />
  );
}
