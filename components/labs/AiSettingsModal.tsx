import { useState } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Select from '@/components/ui/Select';
import { Help } from '@/components/channel/ChannelShell';
import { chat, emitChat } from '@/lib/chat';
import { useStore } from '@/lib/store';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 「AI 설정」 모달 — docs labs 1-2. 프로젝트 탭(4칸) · 개인 탭(답변 톤 · 개인 지침), 「저장」은 두 탭을 한 번에.
const Back = styled.div`
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(10, 13, 18, 0.6);
`;
const Box = styled.div`
  display: flex;
  flex-direction: column;
  width: min(1000px, 100%);
  max-height: calc(100vh - 48px);
  border-radius: ${radius.xl}px;
  background: ${color('bg-primary')};
  box-shadow: ${shadow.xl};
  overflow: hidden;
  > header { display: flex; align-items: center; gap: 8px; padding: 20px 24px 0; }
  > header > b { flex: 1; font-size: 20px; font-weight: 600; color: ${color('text-primary')}; }
  > header > span { display: inline-flex; color: ${color('fg-brand-primary')}; }
  > nav { display: flex; gap: 20px; padding: 12px 24px 0; border-bottom: 1px solid ${color('border-secondary')}; }
  > nav > button { display: inline-flex; align-items: center; gap: 6px; padding: 10px 0; border: 0; border-bottom: 2px solid transparent; background: none; ${text('text-sm', 'medium')}; color: ${color('text-tertiary')}; cursor: pointer; }
  > nav > button[aria-selected='true'] { border-bottom-color: ${color('fg-brand-primary')}; font-weight: 700; color: ${color('text-brand-secondary')}; }
  > section { flex: 1; overflow: auto; display: flex; flex-direction: column; gap: 20px; padding: 24px; background: ${color('bg-secondary')}; }
  > footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid ${color('border-secondary')}; }
`;
const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  > div { display: flex; align-items: center; gap: 4px; ${text('text-sm', 'semibold')}; color: ${color('text-secondary')}; }
  > div > i { flex: 1; }
  > div > small { ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
  > div > small[data-max] { color: ${color('text-error-primary')}; }
  > textarea { width: 100%; padding: 12px 14px; border: 1px solid ${color('border-primary')}; border-radius: 10px; background: ${color('bg-primary')}; resize: none; font: inherit; ${text('text-sm', 'regular')}; color: ${color('text-primary')}; }
  > textarea:focus { outline: none; border-color: ${color('border-brand')}; }
`;

function Area({ label, help, max, h, value, onChange, placeholder }: { label: string; help: string; max: number; h: number; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <Field>
      <div>
        {label}
        <Help>{help}</Help>
        <i />
        <small data-max={value.length >= max ? '' : undefined}>{`${value.length}/${max}`}</small>
      </div>
      <textarea style={{ height: h }} maxLength={max} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

const TONES = [
  ['PROFESSIONAL', 'Professional', '정확하고 신뢰감 있게'],
  ['FRIENDLY', 'Friendly', '편안하고 이해하기 쉽게'],
  ['CHALLENGER', 'Challenger', '날카롭게 검토하고 반론까지'],
] as const;

export default function AiSettingsModal({ onClose }: { onClose: () => void }) {
  const { toast } = useStore();
  const [tab, setTab] = useState<'project' | 'me'>('project');
  const [p, setP] = useState({ ...chat.settings });
  const [me, setMe] = useState({ ...chat.me });
  const [busy, setBusy] = useState(false);
  const save = () => {
    if (busy) return;
    setBusy(true);
    setTimeout(() => {
      toast(p.id ? '수정되었습니다.' : '생성되었습니다.');
      chat.settings = { ...p, id: p.id ?? 'ai-1' };
      chat.me = me;
      emitChat();
      setBusy(false);
      onClose();
    }, 400);
  };
  return (
    <Back data-cover onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <Box role="dialog" aria-label="AI 설정">
        <header>
          <span>
            <Icon name="smart_toy" size={24} />
          </span>
          <b>AI 설정</b>
          <IconButton icon="close" label="닫기" onClick={onClose} />
        </header>
        <nav role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'project'} onClick={() => setTab('project')}>
            <Icon name="folder" size={18} />
            프로젝트
          </button>
          <button type="button" role="tab" aria-selected={tab === 'me'} onClick={() => setTab('me')}>
            <Icon name="person" size={18} />
            개인
          </button>
        </nav>
        <section>
          {tab === 'project' ? (
            <>
              <Area label="서비스명" help="서비스명을 알려주세요. AI가 직접 회사와 서비스에 대한 정보를 수집합니다." max={100} h={48} value={p.serviceName} onChange={(serviceName) => setP({ ...p, serviceName })} />
              <Area label="서비스 설명" help="우리 서비스가 무엇인지, 누구를 위한 것인지 설명해주세요. AI가 브랜드와 고객을 이해하는 데 사용됩니다. 타겟 고객, 주요 제품/서비스, 핵심 가치를 포함하면 좋습니다." max={2000} h={140} value={p.serviceDescription} onChange={(serviceDescription) => setP({ ...p, serviceDescription })} />
              <Area label="비즈니스 목표" help="현재 마케팅에서 가장 중요한 목표는 무엇인가요? AI가 캠페인 제안 시 이 목표에 맞게 최적화합니다. 신규 고객 확보, 재구매 유도, 앱 활성화 등 구체적으로 작성해주세요." max={2000} h={140} value={p.businessTarget} onChange={(businessTarget) => setP({ ...p, businessTarget })} />
              <Area label="필수적 지침" help="AI가 반드시 따라야 할 규칙이나 금지 사항을 작성해주세요. 브랜드 톤앤매너, 사용/금지 표현, 법적 필수 고려사항 등을 포함합니다. 일관된 브랜드 경험을 위해 구체적으로 작성해주세요." max={2000} h={140} value={p.mandatoryGuidelines} onChange={(mandatoryGuidelines) => setP({ ...p, mandatoryGuidelines })} />
            </>
          ) : (
            <>
              <Field as="div">
                <div>답변 톤</div>
                <div style={{ width: 360, fontWeight: 400 }}>
                  <Select<typeof me.tone> value={me.tone} options={TONES.map(([v, n, d]) => ({ value: v, label: `${n} · ${d}` }))} onChange={(tone) => setMe({ ...me, tone })} />
                </div>
              </Field>
              <Area
                label="개인 지침"
                help="AI가 나에게 답할 때 지켜줬으면 하는 것을 적어주세요. 같은 프로젝트라도 나의 대화에만 적용되고 다른 팀원에게는 적용되지 않습니다. 프로젝트의 필수적 지침과 부딪히면 프로젝트 쪽을 따릅니다."
                max={250}
                h={96}
                value={me.instructions}
                placeholder="예: 수치는 표로 보여주고, 근거가 된 조회 조건을 함께 알려주세요"
                onChange={(instructions) => setMe({ ...me, instructions })}
              />
            </>
          )}
        </section>
        <footer>
          <Button size="md" hierarchy="tertiary" onClick={onClose}>
            취소
          </Button>
          <Button size="md" hierarchy="primary" onClick={save}>
            저장
          </Button>
        </footer>
      </Box>
    </Back>
  );
}
