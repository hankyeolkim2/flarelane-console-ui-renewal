import { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import AiSettingsModal from '@/components/labs/AiSettingsModal';
import { chat } from '@/lib/chat';
import type { Graph } from '@/lib/builder';
import { useStore } from '@/lib/store';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';

// AI 개선 패널(수정 화면) — docs journey-builder 5장. 추천 목록 → 카드 실행 → 변경 내용 · 적용 전/후 · 추천 이유 · 적용.
// 「적용」은 편집 데이터만 바꾸고 저장하지 않음(「저장」을 눌러야 함).
const Box = styled.aside`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 7;
  display: flex;
  flex-direction: column;
  width: 440px;
  background: ${color('bg-primary')};
  border-left: 1px solid ${color('border-secondary')};
  > header { display: flex; align-items: center; gap: 6px; padding: 14px 16px; border-bottom: 1px solid ${color('border-secondary')}; ${text('text-sm', 'semibold')}; }
  > header > span { display: inline-flex; color: #7c3aed; }
  > header > i { flex: 1; }
  > section { flex: 1; overflow: auto; display: flex; flex-direction: column; gap: 12px; padding: 16px; }
  > section > small { ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
  > section > h3 { display: flex; align-items: center; gap: 8px; margin: 0; ${text('text-lg', 'semibold')}; }
  > section > h3 > i { flex: 1; }
`;
const Card = styled.div<{ $open: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid ${(p) => (p.$open ? 'transparent' : color('border-secondary'))};
  border-radius: ${radius.lg}px;
  background: ${(p) => (p.$open ? `linear-gradient(${color('bg-primary')}, ${color('bg-primary')}) padding-box, linear-gradient(135deg, #3C79FF, #B54DFF) border-box` : color('bg-primary'))};
  ${(p) => (p.$open ? 'border: 1.5px solid transparent;' : '')}
  > button[data-head] { display: flex; align-items: flex-start; gap: 8px; padding: 0; border: 0; background: none; text-align: left; cursor: pointer; }
  > button[data-head] > div { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  > button[data-head] b { ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  > button[data-head] span { ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
  > div[data-result] { display: flex; flex-direction: column; gap: 8px; padding: 12px; border-radius: ${radius.md}px; background: ${color('bg-secondary')}; ${text('text-sm', 'regular')}; }
  > div[data-result] > b { display: flex; align-items: center; ${text('text-sm', 'semibold')}; }
  > div[data-result] > b > i { flex: 1; }
  ul { margin: 0; padding-left: 18px; }
`;
const Seg = styled.span`
  display: inline-flex;
  padding: 2px;
  border-radius: 8px;
  background: ${color('bg-tertiary')};
  > button { padding: 2px 8px; border: 0; border-radius: 6px; background: none; ${text('text-xs', 'semibold')}; color: ${color('text-tertiary')}; cursor: pointer; }
  > button[aria-pressed='true'] { background: ${color('bg-primary')}; color: ${color('text-primary')}; }
`;

type Rec = { id: string; title: string; description: string; changes: string[]; reason: string; apply: (g: Graph) => Graph };
const RECS: Rec[] = [
  {
    id: 'r1',
    title: '방해 금지 시간대 적용',
    description: '심야 시간 발송을 피해 수신 거부를 줄입니다.',
    changes: ['발송 설정 › 방해 금지 시간대를 22:00 ~ 8:00 으로 설정', '방해 금지 시간대에 걸리면 다음 가능 시간으로 발송 재예약'],
    reason: '최근 30일 동안 밤 10시 이후 발송분의 수신 거부율이 다른 시간대보다 2.3배 높았습니다.',
    apply: (g) => ({ ...g, settings: { ...g.settings, dnd: { start: 22, end: 8, handling: 'DELAY' } } }),
  },
  {
    id: 'r2',
    title: '첫 메시지 전 대기 시간 줄이기',
    description: '진입 직후 반응이 높은 구간에 메시지를 보냅니다.',
    changes: ['Delay › 대기 시간을 12 시간으로 변경'],
    reason: '이 여정 진입 유저의 62%가 진입 후 12시간 안에 앱을 다시 열었습니다.',
    apply: (g) => ({ ...g, nodes: g.nodes.map((n) => (n.type === 'TIME_DELAY' ? { ...n, data: { ...n.data, type: 'AFTER', n: 12, unit: 'HOUR', waitMinutes: 720 } } : n)) }),
  },
  {
    id: 'r3',
    title: '구매 전환 측정 추가',
    description: '여정 성과를 구매 기준으로 확인할 수 있게 합니다.',
    changes: ['전환 이벤트 설정 › purchase_completed, 클릭 기반, 3일'],
    reason: '전환 이벤트가 설정되어 있지 않아 여정이 매출에 준 영향을 확인할 수 없습니다.',
    apply: (g) => ({ ...g, conv: { on: true, items: [{ event: 'purchase_completed', filters: [], basis: 'CLICK', n: 3, unit: 'DAY' }] } }),
  },
];

export default function AiImprove({ g, onApply, onClose }: { g: Graph; onApply: (g: Graph) => void; onClose: () => void }) {
  const { toast } = useStore();
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [after, setAfter] = useState(false);
  const [vote, setVote] = useState<Record<string, 'like' | 'dislike' | undefined>>({});
  const [settings, setSettings] = useState(false);
  const base = useRef(g);
  const reload = () => {
    setLoading(true);
    setOpen(null);
    setTimeout(() => setLoading(false), 1800);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reload, []);
  const busy = loading || !!running;
  const close = () => {
    if (busy) return;
    if (!window.confirm('고객 여정 자동화 개선 추천이 초기화됩니다. 그래도 닫으시겠습니까?')) return;
    if (after) onApply(base.current);
    onClose();
  };
  const run = (r: Rec) => {
    if (running) return;
    if (after) onApply(base.current);
    setAfter(false);
    setRunning(r.id);
    setTimeout(() => {
      setRunning(null);
      setOpen(r.id);
    }, 1500);
  };
  return (
    <Box aria-label="고객 여정 자동화 개선 추천">
      <header>
        <span>
          <Icon name="auto_awesome" size={18} />
        </span>
        FlareLane AI
        <i />
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <IconButton icon="settings" label="AI 설정" onClick={() => setSettings(true)} />
          {!chat.settings.id && <i style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: 3, background: 'var(--fg-error-primary)' }} />}
        </span>
        <IconButton icon="close" label="닫기" disabled={busy} onClick={close} />
      </header>
      <section>
        <small>여정을 분석하여 최적화 방안을 제안합니다</small>
        <h3>
          고객 여정 자동화 개선 추천
          <i />
          {!busy && (
            <Button iconLeading="refresh" onClick={reload}>
              다시 생성
            </Button>
          )}
        </h3>
        {loading ? (
          <p style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: 14, color: 'var(--text-tertiary)' }}>
            <Icon name="progress_activity" size={18} />
            여정 구성과 최근 성과를 살펴보고 있어요
          </p>
        ) : (
          RECS.map((r) => (
            <Card key={r.id} $open={open === r.id}>
              <button type="button" data-head="" onClick={() => (open === r.id ? setOpen(null) : run(r))}>
                <div>
                  <b>
                    {r.title} {running === r.id && <Icon name="progress_activity" size={14} />}
                  </b>
                  <span>{r.description}</span>
                </div>
                <Icon name={open === r.id ? 'keyboard_arrow_up' : 'keyboard_arrow_down'} size={20} />
              </button>
              {open === r.id && (
                <>
                  <div data-result="">
                    <b>
                      변경 내용
                      <i />
                      <Seg>
                        <button type="button" aria-pressed={!after} onClick={() => (setAfter(false), onApply(base.current))}>
                          적용 전
                        </button>
                        <button type="button" aria-pressed={after} onClick={() => (setAfter(true), onApply(r.apply(base.current)))}>
                          적용 후
                        </button>
                      </Seg>
                    </b>
                    <ul>
                      {r.changes.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div data-result="">
                    <b>추천 이유</b>
                    {r.reason}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IconButton icon="thumb_up" size="xs" label="좋아요" onClick={() => setVote({ ...vote, [r.id]: vote[r.id] === 'like' ? undefined : 'like' })} style={vote[r.id] === 'like' ? { color: 'var(--fg-brand-primary)' } : undefined} />
                    <IconButton icon="thumb_down" size="xs" label="싫어요" onClick={() => setVote({ ...vote, [r.id]: vote[r.id] === 'dislike' ? undefined : 'dislike' })} style={vote[r.id] === 'dislike' ? { color: 'var(--fg-brand-primary)' } : undefined} />
                    <i style={{ flex: 1 }} />
                    <Button
                      hierarchy="primary"
                      onClick={() => {
                        const next = r.apply(base.current);
                        base.current = next;
                        onApply(next);
                        setAfter(false);
                        toast('추천 적용이 완료되었습니다.');
                        reload();
                      }}
                    >
                      적용
                    </Button>
                  </div>
                </>
              )}
            </Card>
          ))
        )}
      </section>
      {settings && <AiSettingsModal onClose={() => setSettings(false)} />}
    </Box>
  );
}
