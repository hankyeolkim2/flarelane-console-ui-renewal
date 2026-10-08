import { useEffect, useRef, useState, type ReactNode } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Floating from '@/components/ui/Floating';
import IconButton from '@/components/ui/IconButton';
import Select from '@/components/ui/Select';
import { MinimalTabs } from '@/components/ui/Tabs';
import { segments } from '@/lib/catalog';
import { joinValues, MAX_METRICS, MAX_TARGET_GROUPS, OPERATORS, uid, type EditorState, type Filter, type Metric, type Operator, type TargetBlock } from '@/lib/editor';
import type { ReportType } from '@/lib/analytics';
import { EventSelector, PropertySelector, TargetSelector, ValueSelector, type TargetPick } from './Selectors';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma 「인사이트 편집」 · 「퍼널 편집」 Query panel(372) + 스테이징 쿼리 패널 동작.

const Panel = styled.aside`
  display: flex;
  flex-direction: column;
  width: 372px;
  flex-shrink: 0;
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  overflow: hidden;
`;

const Sections = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 20px 16px;
`;

const Sec = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 20px;
  > h3 { margin: 0; ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  > i { flex: 1; }
`;

const HelpWrap = styled.span`
  position: relative;
  display: inline-flex;
  color: ${color('fg-quaternary')};
  cursor: help;
  > [data-tip] { display: none; position: absolute; left: 50%; top: calc(100% + 6px); transform: translateX(-50%); z-index: 20; width: max-content; max-width: 240px; padding: 8px 12px; border-radius: ${radius.md}px; background: ${color('bg-primary-solid')}; box-shadow: ${shadow.lg}; ${text('text-xs', 'regular')}; color: ${color('text-white')}; white-space: normal; }
  > [data-tip] a { color: ${color('text-white')}; font-weight: 600; }
  &:hover > [data-tip] { display: block; }
`;

function Help({ children }: { children: ReactNode }) {
  return (
    <HelpWrap>
      <Icon name="help" size={16} />
      <span data-tip>{children}</span>
    </HelpWrap>
  );
}

const Card = styled.div<{ lifted?: boolean }>`
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.md}px;
  background: ${color('bg-primary')};
  ${(p) => (p.lifted ? `box-shadow: ${shadow.lg}; position: relative; z-index: 2; cursor: grabbing;` : '')}
`;

const Block = styled.div<{ clickable: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 7px 9px;
  border-radius: ${radius.md}px;
  cursor: ${(p) => (p.clickable ? 'pointer' : 'default')};
  > b { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; ${text('text-sm', 'medium')}; color: ${color('text-primary')}; }
  > b[data-placeholder] { ${text('text-sm', 'regular')}; color: ${color('text-placeholder')}; }
`;

const Handle = styled.span<{ visible: boolean }>`
  display: inline-flex;
  width: 16px;
  flex-shrink: 0;
  color: ${color('fg-quaternary')};
  opacity: ${(p) => (p.visible ? 1 : 0)};
  cursor: grab;
`;

const No = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: ${radius.xs}px;
  background: ${color('bg-secondary')};
  ${text('text-xs', 'semibold')};
  color: ${color('text-secondary')};
`;

const Kind = styled.span`
  flex-shrink: 0;
  padding: 0 6px;
  border-radius: ${radius.xs}px;
  background: ${color('bg-secondary')};
  ${text('text-xs', 'medium')};
  color: ${color('text-tertiary')};
`;

const FilterRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 12px 12px;
`;

const FRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

// 높이 36 (sm) — 테두리 포함
const Segment = styled.div`
  display: flex;
  box-sizing: border-box;
  height: 36px;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.md}px;
  overflow: hidden;
  > button {
    flex: 1;
    height: 34px;
    border: 0;
    background: ${color('bg-primary')};
    ${text('text-sm', 'semibold')};
    color: ${color('text-secondary')};
    cursor: pointer;
    transition: background-color 0.1s linear;
  }
  > button + button { border-left: 1px solid ${color('border-primary')}; }
  > button:hover, > button[aria-pressed='true'] { background: ${color('bg-primary_hover')}; color: ${color('text-secondary_hover')}; }
`;

const Field = styled.input<{ error: boolean }>`
  width: 96px;
  height: 36px;
  padding: 0 11px;
  border: 1px solid ${(p) => (p.error ? color('border-error') : color('border-primary'))};
  border-radius: ${radius.md}px;
  box-shadow: ${shadow.xs};
  ${text('text-sm', 'regular')};
  color: ${color('text-primary')};
  outline: none;
  &:focus { border-color: ${(p) => (p.error ? color('border-error') : color('border-brand'))}; }
`;

const ErrorText = styled.p`
  margin: 0;
  ${text('text-sm', 'regular')};
  color: ${color('text-error-primary')};
`;

const Divider = styled.hr`
  margin: 0;
  border: 0;
  border-top: 1px solid ${color('border-secondary')};
`;

const ValueTrigger = styled.button<{ placeholder: string }>`
  flex: 1;
  min-width: 0;
  height: 36px;
  padding: 0 11px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.md}px;
  background: ${color('bg-primary')};
  box-shadow: ${shadow.xs};
  cursor: pointer;
  text-align: left;
  > b { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; ${text('text-sm', 'medium')}; color: ${color('text-primary')}; }
  > b:empty::before { content: attr(data-ph); ${text('text-sm', 'regular')}; color: ${color('text-placeholder')}; }
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
`;

// ── 필터 한 줄: [속성] [연산자] [값] [X] ──
function FilterRow({ event, filter, autoOpen, onChange, onRemove, onAbandon }: { event: string; filter: Filter; autoOpen: 'property' | 'value' | null; onChange: (f: Filter, next?: 'value') => void; onRemove: () => void; onAbandon: () => void }) {
  const propRef = useRef<HTMLButtonElement>(null);
  const valRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState<'property' | 'value' | null>(autoOpen);
  useEffect(() => setOpen(autoOpen), [autoOpen]);
  const label = joinValues(filter.values);
  return (
    <FRow>
      <ValueTrigger ref={propRef} type="button" placeholder="속성 선택" onClick={() => setOpen('property')} style={{ flex: '0 0 106px' }}>
        <b data-ph="속성 선택">{filter.property ?? ''}</b>
        <span><Icon name="keyboard_arrow_down" size={16} /></span>
      </ValueTrigger>
      <Floating anchorRef={propRef} open={open === 'property'} width={360} placement="bottom-start" onClose={() => { setOpen(null); if (!filter.property) onAbandon(); }}>
        <PropertySelector
          event={event}
          current={filter.property}
          onPick={(p) => {
            if (p === filter.property) return setOpen('value');
            onChange({ ...filter, property: p, values: [] }, 'value');
            setOpen('value');
          }}
        />
      </Floating>
      <Select<Operator> width={90} menuWidth={160} value={filter.operator} options={OPERATORS} onChange={(o) => onChange({ ...filter, operator: o })} />
      <ValueTrigger ref={valRef} type="button" placeholder="값 선택" title={label || undefined} onClick={() => setOpen(filter.property ? 'value' : 'property')}>
        <b data-ph="값 선택">{label}</b>
        <span><Icon name="keyboard_arrow_down" size={16} /></span>
      </ValueTrigger>
      <Floating anchorRef={valRef} open={open === 'value' && !!filter.property} width={360} onClose={() => setOpen(null)}>
        {filter.property && (
          <ValueSelector
            property={filter.property}
            initial={filter.values}
            onApply={(v) => {
              onChange({ ...filter, values: v });
              setOpen(null);
            }}
          />
        )}
      </Floating>
      <IconButton icon="close" size="xs" label="필터 삭제" onClick={onRemove} />
    </FRow>
  );
}

function Filters({ event, filters, setFilters, pending, setPending }: { event: string; filters: Filter[]; setFilters: (f: Filter[]) => void; pending: string | null; setPending: (id: string | null) => void }) {
  const [valueFor, setValueFor] = useState<string | null>(null);
  if (!filters.length) return null;
  return (
    <FilterRows onClick={(e) => e.stopPropagation()}>
      {filters.map((f) => (
        <FilterRow
          key={f.id}
          event={event}
          filter={f}
          autoOpen={pending === f.id ? 'property' : valueFor === f.id ? 'value' : null}
          onChange={(nf, next) => {
            setFilters(filters.map((x) => (x.id === f.id ? nf : x)));
            setPending(null);
            if (next === 'value') setValueFor(f.id);
          }}
          onRemove={() => setFilters(filters.filter((x) => x.id !== f.id))}
          onAbandon={() => {
            setPending(null);
            setFilters(filters.filter((x) => x.id !== f.id));
          }}
        />
      ))}
    </FilterRows>
  );
}

// ── 분석 지표 블록 (드래그 순서 변경 · 이벤트 교체 · 필터) ──
function MetricBlock({ metric, index, canDrag, dragging, onDragStart, onChangeEvent, onFilters, onRemove, dragStyle }: { metric: Metric; index: number; canDrag: boolean; dragging: boolean; onDragStart: (e: React.MouseEvent) => void; onChangeEvent: (ev: string) => void; onFilters: (f: Filter[]) => void; onRemove: () => void; dragStyle?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  return (
    <Card lifted={dragging} style={dragStyle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Block ref={ref} clickable onClick={() => setOpen(true)}>
        <Handle visible={canDrag && (hover || dragging)} onMouseDown={(e) => { e.stopPropagation(); if (canDrag) onDragStart(e); }} onClick={(e) => e.stopPropagation()}>
          {canDrag && <Icon name="drag_indicator" size={16} />}
        </Handle>
        <No>{index + 1}</No>
        <b>{metric.event}</b>
        <span data-own-click style={{ display: 'flex', gap: 0 }} onClick={(e) => e.stopPropagation()}>
          <IconButton
            icon="filter_alt"
            size="xs"
            label="필터 추가"
            onClick={() => {
              const f: Filter = { id: uid('f'), property: null, operator: 'EQ', values: [] };
              onFilters([...metric.filters, f]);
              setPending(f.id);
            }}
          />
          <IconButton icon="close" size="xs" label="삭제" onClick={onRemove} />
        </span>
      </Block>
      <Filters event={metric.event} filters={metric.filters} setFilters={onFilters} pending={pending} setPending={setPending} />
      <Floating anchorRef={ref} open={open} width={680} onClose={() => setOpen(false)}>
        <EventSelector
          current={metric.event}
          onPick={(ev) => {
            setOpen(false);
            if (ev !== metric.event) onChangeEvent(ev);
          }}
        />
      </Floating>
    </Card>
  );
}

function Metrics({ metrics, onChange }: { metrics: Metric[]; onChange: (m: Metric[]) => void }) {
  const [adding, setAdding] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ id: string; startY: number; dy: number } | null>(null);
  const canDrag = metrics.length >= 2;

  // 마우스 드래그: 잡은 블록이 포인터를 따라가고, 블록 가운데를 지나면 자리를 바꿈
  useEffect(() => {
    if (!drag) return;
    const move = (e: MouseEvent) => {
      const list = listRef.current;
      if (!list) return;
      const cards = [...list.children] as HTMLElement[];
      const from = metrics.findIndex((m) => m.id === drag.id);
      const y = e.clientY;
      let to = from;
      cards.forEach((c, i) => {
        if (i === from) return;
        const r = c.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        if (i > from && y > mid) to = Math.max(to, i);
        if (i < from && y < mid) to = Math.min(to, i);
      });
      if (to !== from) {
        const h = cards[from].getBoundingClientRect().height + 8;
        const next = [...metrics];
        const [m] = next.splice(from, 1);
        next.splice(to, 0, m);
        onChange(next);
        setDrag((d) => d && { ...d, startY: d.startY + (to > from ? h * (to - from) : -h * (from - to)), dy: y - (d.startY + (to > from ? h * (to - from) : -h * (from - to))) });
      } else setDrag((d) => d && { ...d, dy: y - d.startY });
    };
    const up = () => setDrag(null);
    document.body.style.cursor = 'grabbing';
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [drag, metrics, onChange]);

  const full = metrics.length + (adding ? 1 : 0) >= MAX_METRICS;
  return (
    <>
      <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {metrics.map((m, i) => (
          <MetricBlock
            key={m.id}
            metric={m}
            index={i}
            canDrag={canDrag}
            dragging={drag?.id === m.id}
            dragStyle={drag?.id === m.id ? { transform: `translateY(${drag.dy}px)` } : { transition: 'transform 0.16s cubic-bezier(0.2,0,0,1)' }}
            onDragStart={(e) => { e.preventDefault(); setDrag({ id: m.id, startY: e.clientY, dy: 0 }); }}
            onChangeEvent={(ev) => onChange(metrics.map((x) => (x.id === m.id ? { ...x, event: ev, filters: [] } : x)))}
            onFilters={(f) => onChange(metrics.map((x) => (x.id === m.id ? { ...x, filters: f } : x)))}
            onRemove={() => onChange(metrics.filter((x) => x.id !== m.id))}
          />
        ))}
        {adding && (
          <Card>
            <Block ref={addRef} clickable={false}>
              <Handle visible={false} />
              <No>{metrics.length + 1}</No>
              <b data-placeholder>이벤트 선택</b>
              <IconButton icon="close" size="xs" label="삭제" onClick={() => setAdding(false)} />
            </Block>
            <Floating anchorRef={addRef} open width={680} onClose={() => setAdding(false)}>
              <EventSelector
                onPick={(ev) => {
                  onChange([...metrics, { id: uid('m'), event: ev, filters: [] }]);
                  setAdding(false);
                }}
              />
            </Floating>
          </Card>
        )}
      </div>
      <Button hierarchy="tertiary" iconLeading="add" full disabled={full || !!drag} onClick={() => setAdding(true)}>
        이벤트 추가
      </Button>
    </>
  );
}

// ── 타겟 그룹 ──
function TargetBlockRow({ block, onChange, onRemove }: { block: TargetBlock; onChange: (b: TargetBlock) => void; onRemove: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const seg = block.kind === 'SEGMENT' ? segments.find((s) => s.id === block.segmentId) : undefined;
  return (
    <div>
      <Block ref={ref} clickable onClick={() => setOpen(true)}>
        <Kind>{block.kind === 'EVENT' ? '이벤트' : block.kind === 'SEGMENT' ? '세그먼트' : block.kind === 'USER' ? '유저' : '기기'}</Kind>
        {block.kind === 'SEGMENT' && !seg ? <b data-placeholder>삭제된 세그먼트</b> : <b>{block.kind === 'EVENT' ? block.event : block.kind === 'SEGMENT' ? seg!.name : block.property}</b>}
        <span data-own-click style={{ display: 'flex' }} onClick={(e) => e.stopPropagation()}>
          {block.kind === 'EVENT' && (
            <IconButton
              icon="filter_alt"
              size="xs"
              label="필터 추가"
              onClick={() => {
                const f: Filter = { id: uid('f'), property: null, operator: 'EQ', values: [] };
                onChange({ ...block, filters: [...block.filters, f] });
                setPending(f.id);
              }}
            />
          )}
          <IconButton icon="close" size="xs" label="삭제" onClick={onRemove} />
        </span>
      </Block>
      {block.kind === 'EVENT' && <Filters event={block.event} filters={block.filters} setFilters={(f) => onChange({ ...block, filters: f })} pending={pending} setPending={setPending} />}
      {(block.kind === 'USER' || block.kind === 'DEVICE') && (
        <FilterRows>
          <FRow>
            <Select<Operator> width={90} menuWidth={160} value={block.operator} options={OPERATORS} onChange={(o) => onChange({ ...block, operator: o })} />
            <Field error={false} style={{ flex: 1, width: 'auto' }} placeholder="값 입력" value={block.value} onChange={(e) => onChange({ ...block, value: e.target.value.replace(/,/g, '') })} />
          </FRow>
        </FilterRows>
      )}
      <Floating anchorRef={ref} open={open} width={680} onClose={() => setOpen(false)}>
        <TargetSelector
          onPick={(p) => {
            setOpen(false);
            if (p.kind === 'EVENT' && block.kind === 'EVENT' && p.event === block.event) return;
            onChange(toBlock(p, block.id));
          }}
        />
      </Floating>
    </div>
  );
}

const toBlock = (p: TargetPick, id = uid('t')): TargetBlock =>
  p.kind === 'EVENT' ? { id, kind: 'EVENT', event: p.event, filters: [] } : p.kind === 'SEGMENT' ? { id, kind: 'SEGMENT', segmentId: p.segmentId } : { id, kind: p.kind, property: p.property, operator: 'EQ', value: '' };

function Targets({ targets, onChange }: { targets: EditorState['targets']; onChange: (t: EditorState['targets']) => void }) {
  const [adding, setAdding] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const addRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const full = targets.length + (adding ? 1 : 0) >= MAX_TARGET_GROUPS;
  return (
    <>
      {targets.map((g, gi) => (
        <Card key={g.id}>
          <Block clickable={false}>
            <No>{gi + 1}</No>
            <b>타겟 그룹</b>
            <IconButton icon="filter_alt" size="xs" label="조건 추가" onClick={() => setAddingTo(g.id)} />
            <IconButton icon="close" size="xs" label="그룹 삭제" onClick={() => onChange(targets.filter((x) => x.id !== g.id))} />
          </Block>
          {g.blocks.map((b, bi) => (
            <div key={b.id}>
              {bi > 0 && <Divider />}
              <div style={{ padding: '0 0 0 0' }}>
                <TargetBlockRow
                  block={b}
                  onChange={(nb) => onChange(targets.map((x) => (x.id === g.id ? { ...x, blocks: x.blocks.map((y) => (y.id === b.id ? nb : y)) } : x)))}
                  onRemove={() => {
                    const rest = g.blocks.filter((y) => y.id !== b.id);
                    onChange(rest.length ? targets.map((x) => (x.id === g.id ? { ...x, blocks: rest } : x)) : targets.filter((x) => x.id !== g.id));
                  }}
                />
              </div>
            </div>
          ))}
          {addingTo === g.id && (
            <>
              <Divider />
              <Block ref={blockRef} clickable={false}>
                <b data-placeholder>타겟 선택</b>
                <IconButton icon="close" size="xs" label="삭제" onClick={() => setAddingTo(null)} />
              </Block>
              <Floating anchorRef={blockRef} open width={680} onClose={() => setAddingTo(null)}>
                <TargetSelector
                  onPick={(p) => {
                    onChange(targets.map((x) => (x.id === g.id ? { ...x, blocks: [...x.blocks, toBlock(p)] } : x)));
                    setAddingTo(null);
                  }}
                />
              </Floating>
            </>
          )}
        </Card>
      ))}
      {adding && (
        <Card>
          <Block ref={addRef} clickable={false}>
            <No>{targets.length + 1}</No>
            <b>타겟 그룹</b>
            <IconButton icon="close" size="xs" label="삭제" onClick={() => setAdding(false)} />
          </Block>
          <Floating anchorRef={addRef} open width={680} onClose={() => setAdding(false)}>
            <TargetSelector
              onPick={(p) => {
                onChange([...targets, { id: uid('g'), blocks: [toBlock(p)] }]);
                setAdding(false);
              }}
            />
          </Floating>
        </Card>
      )}
      <Button hierarchy="tertiary" iconLeading="add" full disabled={full} onClick={() => setAdding(true)}>
        타겟 그룹 추가
      </Button>
    </>
  );
}

// ── 전환 인정 기간 (퍼널 + 총 이벤트 수일 때만) ──
function ConversionWindow({ value, onChange }: { value: EditorState['conversionWindow']; onChange: (v: EditorState['conversionWindow']) => void }) {
  const [draft, setDraft] = useState(String(value.value));
  const [error, setError] = useState(false);
  useEffect(() => setDraft(String(value.value)), [value.value]);
  const max = value.unit === 'DAY' ? 30 : 720;
  const commit = () => {
    const n = Number(draft);
    if (!draft || n < 1 || n > max) return setError(true);
    setError(false);
    if (n !== value.value) onChange({ ...value, value: n });
  };
  return (
    <>
      <FRow>
        <Field
          error={error}
          inputMode="numeric"
          value={draft}
          onChange={(e) => /^\d*$/.test(e.target.value) && setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(String(value.value));
              setError(false);
              e.currentTarget.blur();
            }
          }}
          onBlur={commit}
        />
        <Select<'DAY' | 'HOUR'>
          width={80}
          value={value.unit}
          options={[
            { value: 'DAY', label: '일' },
            { value: 'HOUR', label: '시간' },
          ]}
          onChange={(u) => {
            const base = Number(draft) || value.value;
            const lim = u === 'DAY' ? 30 : 720;
            setError(false);
            onChange({ unit: u, value: Math.min(Math.max(base, 1), lim) });
          }}
        />
      </FRow>
      {error && <ErrorText>{value.unit === 'DAY' ? '1~30일까지 적용할 수 있습니다.' : '1~720시간까지 적용할 수 있습니다.'}</ErrorText>}
    </>
  );
}

export default function QueryPanel({ state, onChange }: { state: EditorState; onChange: (s: EditorState) => void }) {
  const set = (patch: Partial<EditorState>) => onChange({ ...state, ...patch });
  return (
    <Panel>
      <div style={{ padding: '16px 16px 0' }}>
        <MinimalTabs<ReportType>
          items={[
            { value: 'INSIGHT', label: '인사이트', icon: 'show_chart' },
            { value: 'FUNNEL', label: '퍼널', icon: 'funnel' },
          ]}
          value={state.type}
          onChange={(t) => set({ type: t })}
        />
      </div>
      <Sections>
        <Sec>
          <Head>
            <h3>분석 지표</h3>
            <Help>
              이벤트(유저 행동)를 지정하여 무엇을 분석할지 설정합니다.{' '}
              <a href="https://flarelane.com/ko/docs/data-analytics/metrics/" target="_blank" rel="noreferrer">가이드</a>
            </Help>
          </Head>
          <Metrics metrics={state.metrics} onChange={(m) => set({ metrics: m })} />
        </Sec>
        <Sec>
          <Head>
            <h3>측정 기준</h3>
          </Head>
          <Segment>
            <button type="button" aria-pressed={state.measurement === 'UNIQUE_USER'} onClick={() => set({ measurement: 'UNIQUE_USER' })}>사용자 수</button>
            <button type="button" aria-pressed={state.measurement === 'TOTAL_COUNT'} onClick={() => set({ measurement: 'TOTAL_COUNT' })}>총 이벤트 수</button>
          </Segment>
        </Sec>
        {state.type === 'FUNNEL' && state.measurement === 'TOTAL_COUNT' && (
          <Sec>
            <Head>
              <h3>전환 인정 기간</h3>
            </Head>
            <ConversionWindow value={state.conversionWindow} onChange={(c) => set({ conversionWindow: c })} />
          </Sec>
        )}
        <Sec>
          <Head>
            <h3>타겟 유저</h3>
            <Help>
              전체 유저 중 어느 집군을 대상으로 집계할지 설정합니다.{' '}
              <a href="https://flarelane.com/ko/docs/data-analytics/target-users/" target="_blank" rel="noreferrer">가이드</a>
            </Help>
          </Head>
          <Targets targets={state.targets} onChange={(t) => set({ targets: t })} />
        </Sec>
        <Sec>
          <Head>
            <h3>데이터 그룹</h3>
            <Help>지표를 특정 속성 기준으로 그룹화해 시각화합니다.</Help>
            <i />
            <Badge color="gray">준비중</Badge>
          </Head>
          <Select value={null} options={[]} onChange={() => {}} placeholder="속성 선택" disabled />
        </Sec>
      </Sections>
    </Panel>
  );
}
