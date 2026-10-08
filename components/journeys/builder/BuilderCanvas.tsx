import { useEffect, useRef, useState, type MouseEvent as RME } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { CHANNELS, FLOWS, ICON, LABEL, outputs, summary, type Arrow, type BNode, type Graph, type NodeType } from '@/lib/builder';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 여정 빌더 캔버스 — docs journey-builder 2장. 툴박스 끌어 놓기로 노드 추가, 노드 아래 핸들을 끌어 연결, 화살표 호버 × 로 삭제, 노드 호버 복사.
// 배경 끌기 = 이동, 휠 = 이동(Ctrl/⌘ + 휠 = 확대/축소).
export const NW = 240;
export const NH = 104;

const Wrap = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background-color: ${color('bg-secondary')};
  background-image: radial-gradient(${color('border-primary')} 1px, transparent 1px);
  background-size: 20px 20px;
  cursor: grab;
  &[data-panning] { cursor: grabbing; }
`;
const Card = styled.div<{ $sel: boolean; $entry: boolean }>`
  position: absolute;
  width: ${NW}px;
  height: ${NH}px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid ${(p) => (p.$sel ? color('border-brand') : color('border-secondary'))};
  outline: ${(p) => (p.$sel ? `2px solid ${color('border-brand')}` : 'none')};
  border-radius: ${radius.lg}px;
  background: ${color('bg-primary')};
  box-shadow: ${shadow.sm};
  cursor: pointer;
  user-select: none;
  > header { display: flex; align-items: center; gap: 6px; ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  > header > span { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 6px; color: #fff; flex-shrink: 0; }
  > p { margin: 0; ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  > p[data-empty] { color: ${color('text-error-primary')}; }
  > button[data-copy] { position: absolute; top: 6px; right: -34px; display: none; width: 28px; height: 28px; align-items: center; justify-content: center; border: 1px solid ${color('border-secondary')}; border-radius: 8px; background: ${color('bg-primary')}; color: ${color('fg-quaternary')}; cursor: pointer; }
  &:hover > button[data-copy] { display: inline-flex; }
`;
const Handle = styled.i<{ $c: string }>`
  position: absolute;
  bottom: -7px;
  width: 14px;
  height: 14px;
  margin-left: -7px;
  border: 2px solid ${(p) => p.$c};
  border-radius: 3px;
  background: ${color('bg-primary')};
  cursor: crosshair;
  &::after { content: ''; position: absolute; inset: 3px; transform: rotate(45deg); background: ${(p) => p.$c}; }
`;
const HLabel = styled.small<{ $c: string }>`
  position: absolute;
  bottom: -26px;
  transform: translateX(-50%);
  ${text('text-xs', 'semibold')};
  color: ${(p) => p.$c};
  white-space: nowrap;
  pointer-events: none;
`;
const Tools = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 8px;
  > div { width: 200px; padding: 10px; border: 1px solid ${color('border-secondary')}; border-radius: ${radius.lg}px; background: ${color('bg-primary')}; box-shadow: ${shadow.md}; }
  > div[data-box] { max-height: 478px; overflow: auto; }
  > div > small { display: block; margin: 6px 4px; ${text('text-xs', 'semibold')}; color: ${color('text-quaternary')}; }
  > div > button { display: flex; align-items: center; gap: 8px; width: 100%; height: 40px; padding: 0 8px; border: 0; border-radius: 8px; background: none; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; cursor: pointer; }
  > div > button:hover { background: ${color('bg-primary_hover')}; }
`;
const Item = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: 8px;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
  cursor: grab;
  &:hover { background: ${color('bg-primary_hover')}; }
  > span { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; color: #fff; }
`;
const Corner = styled.div`
  position: absolute;
  left: 16px;
  bottom: 16px;
  z-index: 3;
  display: flex;
  gap: 6px;
  > span { position: relative; }
  > span > button { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 1px solid ${color('border-secondary')}; border-radius: 8px; background: ${color('bg-primary')}; color: ${color('fg-secondary')}; box-shadow: ${shadow.xs}; cursor: pointer; }
  > span > em { position: absolute; bottom: 38px; left: 50%; transform: translateX(-50%); display: none; padding: 4px 8px; border-radius: 6px; background: #0a0d12; color: #fff; font-style: normal; font-size: 12px; white-space: nowrap; }
  > span:hover > em { display: block; }
`;

type Props = {
  g: Graph;
  readOnly: boolean;
  selected: string | null;
  fullscreen: boolean;
  onChange: (g: Graph) => void;
  onOpen: (id: string) => void;
  onAdd: (type: NodeType, x: number, y: number) => void;
  onConnect: (from: string, index: number, exec: Arrow['exec'], to: string) => void;
  onCopy: (id: string) => void;
  onArrange: () => void;
  onFullscreen: () => void;
  onSide: (k: 'conv' | 'send') => void;
  emailEnabled: boolean;
  focusKey: number;
};

export default function BuilderCanvas({ g, readOnly, selected, fullscreen, onChange, onOpen, onAdd, onConnect, onCopy, onArrange, onFullscreen, onSide, emailEnabled, focusKey }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, z: 1 });
  const [panning, setPanning] = useState(false);
  const [link, setLink] = useState<{ from: string; index: number; exec: Arrow['exec']; x: number; y: number } | null>(null);
  const [hoverArrow, setHoverArrow] = useState<string | null>(null);
  const drag = useRef<{ kind: 'pan' | 'node'; id?: string; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);

  // 시작 노드 찾기(Find Entry)
  const findEntry = () => {
    const e = g.nodes.find((n) => n.type === 'ENTRY');
    const el = wrap.current;
    if (!e || !el) return;
    const z = g.nodes.length >= 3 ? 0.75 : 1;
    setView({ z, x: el.clientWidth / 2 - (e.x + NW / 2) * z, y: 60 - e.y * z });
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(findEntry, [focusKey]);

  const world = (cx: number, cy: number) => {
    const r = wrap.current!.getBoundingClientRect();
    return { x: (cx - r.left - view.x) / view.z, y: (cy - r.top - view.y) / view.z };
  };
  useEffect(() => {
    const move = (e: MouseEvent) => {
      const d = drag.current;
      if (link) {
        const p = world(e.clientX, e.clientY);
        setLink({ ...link, x: p.x, y: p.y });
        return;
      }
      if (!d) return;
      const dx = e.clientX - d.sx;
      const dy = e.clientY - d.sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
      if (d.kind === 'pan') setView((v) => ({ ...v, x: d.ox + dx, y: d.oy + dy }));
      else if (d.moved && !readOnly) onChange({ ...g, nodes: g.nodes.map((n) => (n.id === d.id ? { ...n, x: d.ox + dx / view.z, y: d.oy + dy / view.z } : n)) });
    };
    const up = (e: MouseEvent) => {
      if (link) {
        const p = world(e.clientX, e.clientY);
        const t = g.nodes.find((n) => p.x >= n.x && p.x <= n.x + NW && p.y >= n.y && p.y <= n.y + NH);
        if (t) onConnect(link.from, link.index, link.exec, t.id);
        setLink(null);
      }
      const d = drag.current;
      if (d?.kind === 'node' && !d.moved && d.id) onOpen(d.id);
      drag.current = null;
      setPanning(false);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  });
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect();
        setView((v) => {
          const z = Math.min(2, Math.max(0.3, v.z * (e.deltaY > 0 ? 0.9 : 1.1)));
          const cx = e.clientX - r.left;
          const cy = e.clientY - r.top;
          return { z, x: cx - ((cx - v.x) / v.z) * z, y: cy - ((cy - v.y) / v.z) * z };
        });
      } else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, []);

  const handlePos = (n: BNode, i: number) => {
    const outs = outputs(n);
    return { x: n.x + (NW * (i + 1)) / (outs.length + 1), y: n.y + NH };
  };
  const path = (x1: number, y1: number, x2: number, y2: number) => {
    const c = Math.max(40, Math.abs(y2 - y1) / 2);
    return `M ${x1} ${y1} C ${x1} ${y1 + c}, ${x2} ${y2 - c}, ${x2} ${y2}`;
  };
  const tool = (t: NodeType) => {
    const disabled = t === 'SEND_EMAIL' && !emailEnabled;
    return (
      <Item
        key={t}
        draggable={!disabled}
        title={disabled ? '이메일 채널이 활성화된 프로젝트에서만 사용할 수 있습니다.' : undefined}
        style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
        onDragStart={(e) => {
          e.dataTransfer.setData('application/x-node', t);
          e.dataTransfer.effectAllowed = 'copy';
        }}
      >
        <span style={{ background: ICON[t][1] }}>
          <Icon name={ICON[t][0]} size={16} />
        </span>
        {LABEL[t]}
      </Item>
    );
  };

  return (
    <Wrap
      ref={wrap}
      data-panning={panning ? '' : undefined}
      onMouseDown={(e: RME) => {
        if (e.target !== e.currentTarget && !(e.target as HTMLElement).dataset.world) return;
        drag.current = { kind: 'pan', sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, moved: false };
        setPanning(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const t = e.dataTransfer.getData('application/x-node') as NodeType;
        if (!t || readOnly) return;
        if ((e.target as HTMLElement).closest('[data-tools]')) return;
        const p = world(e.clientX, e.clientY);
        onAdd(t, p.x - NW / 2, p.y - NH / 2);
      }}
    >
      <div data-world="" style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 1, transformOrigin: '0 0', transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }}>
        <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', width: 1, height: 1 }}>
          {g.arrows.map((a) => {
            const f = g.nodes.find((n) => n.id === a.from);
            const t = g.nodes.find((n) => n.id === a.to);
            if (!f || !t) return null;
            const s = handlePos(f, a.index);
            const col = outputs(f)[a.index]?.[1] ?? '#717680';
            const d = path(s.x, s.y + 7, t.x + NW / 2, t.y);
            const mx = (s.x + t.x + NW / 2) / 2;
            const my = (s.y + t.y) / 2;
            return (
              <g key={a.id} onMouseEnter={() => setHoverArrow(a.id)} onMouseLeave={() => setHoverArrow(null)}>
                <path d={d} stroke="transparent" strokeWidth={14} fill="none" />
                <path d={d} stroke={col} strokeWidth={2} fill="none" markerEnd="url(#arr)" />
                {hoverArrow === a.id && !readOnly && (
                  <g style={{ cursor: 'pointer' }} onClick={() => onChange({ ...g, arrows: g.arrows.filter((x) => x.id !== a.id) })}>
                    <circle cx={mx} cy={my} r={11} fill="#dc2626" />
                    <path d={`M ${mx - 4} ${my - 4} L ${mx + 4} ${my + 4} M ${mx + 4} ${my - 4} L ${mx - 4} ${my + 4}`} stroke="#fff" strokeWidth={2} />
                  </g>
                )}
              </g>
            );
          })}
          {link &&
            (() => {
              const f = g.nodes.find((n) => n.id === link.from)!;
              const s = handlePos(f, link.index);
              return <path d={path(s.x, s.y + 7, link.x, link.y)} stroke="#2f54eb" strokeDasharray="6 4" strokeWidth={2} fill="none" />;
            })()}
          <defs>
            <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#98a2b3" />
            </marker>
          </defs>
        </svg>
        {g.nodes.map((n) => {
          const s = summary(n);
          const outs = outputs(n);
          const title = n.type === 'ENTRY' ? (n.data.entryType === 'EVENT' ? '다음 이벤트가 발생할 때' : '다음 조건을 만족할 때') : LABEL[n.type];
          const hovered = link && link.from !== n.id;
          return (
            <Card
              key={n.id}
              $sel={selected === n.id || !!hovered}
              $entry={n.type === 'ENTRY'}
              style={{ left: n.x, top: n.y, borderColor: hovered ? 'var(--border-brand)' : undefined }}
              onMouseDown={(e) => {
                e.stopPropagation();
                drag.current = { kind: 'node', id: n.id, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y, moved: false };
              }}
            >
              <header>
                <span style={{ background: ICON[n.type][1] }}>
                  <Icon name={ICON[n.type][0]} size={14} />
                </span>
                {title}
              </header>
              {s.length ? s.slice(0, 3).map((x, i) => <p key={i}>{x}</p>) : <p data-empty="">노드를 열어 설정</p>}
              {n.type !== 'ENTRY' && !readOnly && (
                <button type="button" data-copy="" aria-label="복제" onMouseDown={(e) => e.stopPropagation()} onClick={() => onCopy(n.id)}>
                  <Icon name="content_copy" size={16} />
                </button>
              )}
              {outs.map(([label, c, exec], i) => {
                const used = g.arrows.some((a) => a.from === n.id && a.index === i);
                const left = (NW * (i + 1)) / (outs.length + 1);
                return (
                  <div key={i}>
                    {label && <HLabel $c={c} style={{ left }}>{label}</HLabel>}
                    {!used && !readOnly && (
                      <Handle
                        $c={c}
                        style={{ left }}
                        aria-label="연결"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const p = world(e.clientX, e.clientY);
                          setLink({ from: n.id, index: i, exec, x: p.x, y: p.y });
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </Card>
          );
        })}
      </div>
      <Tools data-tools="">
        {!readOnly && (
          <div data-box="">
            <small>Channels</small>
            {CHANNELS.map(tool)}
            <small>Flows</small>
            {FLOWS.map(tool)}
          </div>
        )}
        <div>
          <button type="button" onClick={() => onSide('conv')}>
            <Icon name="flag" size={18} />
            전환 이벤트 설정
          </button>
          <button type="button" onClick={() => onSide('send')}>
            <Icon name="tune" size={18} />
            발송 설정
          </button>
        </div>
      </Tools>
      <Corner>
        <span>
          <button type="button" aria-label="Find Entry" onClick={findEntry}>
            <Icon name="my_location" size={18} />
          </button>
          <em>Find Entry</em>
        </span>
        {!readOnly && (
          <span>
            <button type="button" aria-label="Arrange" onClick={onArrange}>
              <Icon name="account_tree" size={18} />
            </button>
            <em>Arrange</em>
          </span>
        )}
        <span>
          <button type="button" aria-label={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'} onClick={onFullscreen}>
            <Icon name={fullscreen ? 'close_fullscreen' : 'open_in_full'} size={18} />
          </button>
          <em>{fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</em>
        </span>
      </Corner>
    </Wrap>
  );
}
