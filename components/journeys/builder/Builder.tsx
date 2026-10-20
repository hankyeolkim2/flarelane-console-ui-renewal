import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import type { Conv } from '@/components/newmsg/parts';
import { arrange, canConnect, defaults, emptyGraph, fromSimple, longest, newId, outputs, toSimple, validate, type Arrow, type BNode, type Graph, type NodeType } from '@/lib/builder';
import { emitJourneys, journeys, type Journey } from '@/lib/journeys';
import { useStore } from '@/lib/store';
import { useLeaveGuard } from '@/lib/useLeaveGuard';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';
import BuilderCanvas from './BuilderCanvas';
import { ConversionPanel, EntryPanel, PANEL, SendOptionsPanel } from './Panels';
import AiImprove from './AiImprove';

// 고객 여정 빌더 — docs/staging-behavior-journey-builder.md. 신규 /journeys/new · 수정 /journeys/[id]/edit.
// 기본 = 전체화면(사이드바를 덮음), ESC 로 해제. 저장 성공 시 토스트 없이 상세로.
const Full = styled.div<{ $full: boolean }>`
  ${(p) => (p.$full ? 'position: fixed; inset: 0; z-index: 45;' : 'position: relative; height: calc(100vh - 64px);')}
  display: flex;
  flex-direction: column;
  background: ${color('bg-primary')};
  ${(p) => (p.$full ? '' : `border: 1px solid ${color('border-secondary')}; border-radius: ${radius.xl}px; overflow: hidden;`)}
  > header { display: flex; align-items: center; gap: 8px; height: 60px; padding: 0 16px; border-bottom: 1px solid ${color('border-secondary')}; background: ${color('bg-primary')}; }
  > header > input { width: 360px; height: 36px; padding: 0 10px; border: 1px solid transparent; border-radius: ${radius.md}px; font: inherit; ${text('text-lg', 'semibold')}; color: ${color('text-primary')}; }
  > header > input:hover, > header > input:focus { border-color: ${color('border-primary')}; outline: none; }
  > header > i { flex: 1; }
  > div { position: relative; flex: 1; min-height: 0; display: flex; }
`;
const Banner = styled.div`
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(10, 13, 18, 0.75);
  color: #fff;
  ${text('text-sm', 'medium')};
  pointer-events: none;
  animation: fade 0.5s ease 4s forwards;
  @keyframes fade { to { opacity: 0; } }
`;
const AiBtn = styled.button<{ $on: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid ${(p) => (p.$on ? 'transparent' : color('border-primary'))};
  border-radius: ${radius.md}px;
  background: ${(p) => (p.$on ? 'linear-gradient(135deg, #3C79FF, #B54DFF)' : color('bg-primary'))};
  color: ${(p) => (p.$on ? '#fff' : '#7c3aed')};
  box-shadow: ${shadow.xs};
  cursor: pointer;
`;
export const Title = styled.h1`
  margin: 0 0 16px;
  ${text('display-xs', 'semibold')};
  color: ${color('text-primary')};
`;

type Side = { kind: 'node'; id: string } | { kind: 'send' } | { kind: 'conv' } | null;

export default function Builder({ journey }: { journey?: Journey }) {
  const router = useRouter();
  const { toast } = useStore();
  const allow = useLeaveGuard();
  const [name, setName] = useState(journey?.name ?? '');
  const [g, setG] = useState<Graph>(() => (journey ? JSON.parse(JSON.stringify(journey.editor ?? fromSimple(journey.nodes))) : emptyGraph()));
  const [side, setSide] = useState<Side>(null);
  const [full, setFull] = useState(true);
  const [focus, setFocus] = useState(0);
  const [ai, setAi] = useState(false);
  const readOnly = !!journey?.lastActivatedAt;
  const locked = readOnly || ai;
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !full) return;
      if (document.querySelector('[role=dialog][aria-modal], [data-floating]')) return;
      setFull(false);
      setFocus((n) => n + 1);
    };
    window.addEventListener('keyup', key);
    return () => window.removeEventListener('keyup', key);
  }, [full]);
  // 처음 열 때 저장된 좌표가 겹치면 정렬
  useEffect(() => {
    if (journey && !journey.editor) setG((x) => ({ ...x, nodes: arrange(x) }));
  }, [journey]);

  const node = side?.kind === 'node' ? g.nodes.find((n) => n.id === side.id) : undefined;
  const add = (type: NodeType, x: number, y: number) => {
    const n: BNode = { id: newId(), type, x, y, data: defaults(type) as BNode['data'] };
    setG({ ...g, nodes: [...g.nodes, n] });
  };
  const connect = (from: string, index: number, exec: Arrow['exec'], to: string) => {
    if (!canConnect(g, from, to)) return;
    const next = { ...g, arrows: [...g.arrows, { id: newId(), from, to, index, exec }] };
    if (longest(next) > 15) return toast('액션은 연속으로 최대 15개까지 연결할 수 있습니다.');
    setG(next);
  };
  const copy = (id: string) => {
    const n = g.nodes.find((x) => x.id === id)!;
    const data = JSON.parse(JSON.stringify(n.data));
    if (n.type === 'AB_TEST') data.groups = data.groups.map((x: { id: string }) => ({ ...x, id: newId() }));
    setG({ ...g, nodes: [...g.nodes, { ...n, id: newId(), x: n.x + 280, data }] });
  };
  const save = () => {
    if (readOnly) return;
    const err = validate(g, { smsSender: true, kakaoSender: true });
    if (err) return toast(err);
    allow();
    const nodes = toSimple(g);
    let id = journey?.id;
    if (journey) Object.assign(journey, { name, editor: g, nodes, entry: entryOf(g) });
    else {
      id = `jr-${Date.now()}`;
      journeys.unshift({ id, name, active: false, createdAt: '2026.10.08', entries: 0, conversions: 0, amount: 0, entry: entryOf(g), nodes, editor: g });
    }
    emitJourneys();
    router.push(`/journeys/${id}`);
  };

  const body = (
    <Full $full={full} data-cover={full || undefined}>
      <header>
        <IconButton icon="arrow_back" label="뒤로" onClick={() => router.push('/journeys')} />
        <input id="journey-name" aria-label="여정 이름" placeholder="새 여정 이름 입력" value={name} readOnly={readOnly} onChange={(e) => setName(e.target.value)} />
        <i />
        {journey && !ai && (
          <AiBtn type="button" $on={false} aria-label="AI 개선" title="고객 여정 자동화 개선 추천" onClick={() => setAi(true)}>
            <Icon name="auto_awesome" size={20} />
          </AiBtn>
        )}
        {journey && ai && (
          <AiBtn type="button" $on aria-label="AI 개선" onClick={() => setAi(false)}>
            <Icon name="auto_awesome" size={20} />
          </AiBtn>
        )}
        <Button hierarchy="tertiary" onClick={() => router.push(journey ? `/journeys/${journey.id}` : '/journeys')}>
          취소
        </Button>
        <Button hierarchy="primary" disabled={ai} onClick={save}>
          저장
        </Button>
      </header>
      <div>
        {full && (
          <Banner key={String(full)}>
            <Icon name="keyboard" size={18} />
            혹은 ESC키를 누르면 전체 화면 모드가 종료됩니다.
          </Banner>
        )}
        <BuilderCanvas
          g={g}
          readOnly={locked}
          selected={node?.id ?? null}
          fullscreen={full}
          focusKey={focus}
          emailEnabled
          onChange={setG}
          onOpen={(id) => setSide({ kind: 'node', id })}
          onAdd={add}
          onConnect={connect}
          onCopy={copy}
          onArrange={() => setG({ ...g, nodes: arrange(g) })}
          onFullscreen={() => (setFull(!full), setFocus((n) => n + 1))}
          onSide={(k) => setSide(side?.kind === k ? null : { kind: k })}
        />
        {node &&
          (() => {
            const props = {
              key: node.id,
              node,
              readOnly: locked,
              entry: g.nodes.find((n) => n.type === 'ENTRY'),
              onClose: () => setSide(null),
              onSave: (data: BNode['data']) => {
                // A/B 그룹을 지우면 그 갈래 화살표도 지움
                let arrows = g.arrows;
                if (node.type === 'AB_TEST') {
                  const keep = (data.groups as { id: string }[]).map((x) => (node.data.groups as { id: string }[]).findIndex((y) => y.id === x.id));
                  arrows = arrows.filter((a) => a.from !== node.id || keep.includes(a.index)).map((a) => (a.from === node.id ? { ...a, index: keep.indexOf(a.index) } : a));
                }
                setG({ ...g, arrows, nodes: g.nodes.map((n) => (n.id === node.id ? { ...n, data } : n)) });
                setSide(null);
              },
              onDelete: () => {
                setG({ nodes: g.nodes.filter((n) => n.id !== node.id), arrows: g.arrows.filter((a) => a.from !== node.id && a.to !== node.id), settings: g.settings, conv: g.conv });
                setSide(null);
              },
            };
            if (node.type === 'ENTRY') return <EntryPanel {...props} key={node.id} />;
            const P = PANEL[node.type];
            return <P {...props} key={node.id} />;
          })()}
        {side?.kind === 'send' && <SendOptionsPanel value={g.settings} readOnly={locked} onClose={() => setSide(null)} onSave={(settings) => (setG({ ...g, settings }), setSide(null))} />}
        {side?.kind === 'conv' && <ConversionPanel value={g.conv as Conv | null} readOnly={locked} onClose={() => setSide(null)} onSave={(conv) => (setG({ ...g, conv }), setSide(null))} />}
        {ai && journey && <AiImprove g={g} onApply={(next) => setG(next)} onClose={() => setAi(false)} />}
      </div>
    </Full>
  );
  return full ? (
    body
  ) : (
    <>
      <Title>{journey ? '고객 여정 자동화 수정' : '새 고객 여정 자동화'}</Title>
      {body}
    </>
  );
}

function entryOf(g: Graph): Journey['entry'] {
  const e = g.nodes.find((n) => n.type === 'ENTRY')!;
  return e.data.entryType === 'EVENT' ? { kind: 'EVENT', event: e.data.event?.name || '-', target: e.data.target === 'SEG' ? e.data.segment ?? '-' : '모든 유저' } : { kind: 'SEGMENT', segment: e.data.segment ?? '-' };
}
export { outputs };
