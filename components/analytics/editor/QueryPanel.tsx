import { useEffect, useRef, useState, type ReactNode } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import Floating from '@/components/ui/Floating';
import { HoverTip } from '@/components/ui/Tooltip';
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

// 도움말 (?) — 툴팁은 화면 맨 위층에 띄움(조건 패널 스크롤 영역에 잘리지 않게), 최대 폭 240, 안에 가이드 링크
function Help({ children }: { children: ReactNode }) {
  return (
    <HoverTip content={children}>
      <span style={{ display: 'inline-flex', color: 'var(--fg-quaternary)', cursor: 'help' }}>
        <Icon name="help" size={16} />
      </span>
    </HoverTip>
  );
}

// 집은 블록 = utility-brand-300 테두리 + shadow-lg (Figma 「split by 추가」 10.21 신규 DS 시안 · 스테이징과 같은 단)
const Card = styled.div<{ lifted?: boolean }>`
  border: 1px solid ${(p) => (p.lifted ? color('utility-brand-300') : color('border-secondary'))};
  border-radius: ${radius.md}px;
  background: ${color('bg-primary')};
  ${(p) => (p.lifted ? `box-shadow: ${shadow.lg}; position: relative; z-index: 2; cursor: grabbing;` : '')}
  /* 호버하면 손잡이가 나타나되 자리는 원래 비어 있던 곳 — 내용은 움직이지 않음 */
  &:hover [data-drag-handle] { opacity: 1; }
  &:hover [data-swap] > [data-no] { opacity: 0; }
`;

// 블록 목록 — 끄는 동안엔 지나가는 블록이 호버로 반응하지 않음(스테이징과 같음)
const SortList = styled.div<{ sorting: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  ${(p) => (p.sorting ? '> * { pointer-events: none; }' : '')}
`;

// 끄는 동안 블록이 놓일 자리 — 집은 블록보다 눈에 덜 띄게 회색 · 연한 점선
const Slot = styled.div`
  position: absolute;
  inset: 0;
  border: 1px dashed ${color('border-secondary')};
  border-radius: ${radius.md}px;
  background: ${color('bg-secondary')};
  pointer-events: none;
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

// 손잡이 — 블록 호버 때만 보임. 자리를 새로 만들지 않아 내용이 움직이지 않음.
// 분석 지표 = 번호 칸(20×20) 위에 겹쳐 번호와 바뀜, 데이터 그룹 = 삭제 버튼 앞 빈자리.
// 손잡이 위 · 끄는 중엔 칩 배경.
const Handle = styled.span<{ show?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: ${radius.xs}px;
  background: ${(p) => (p.show ? color('bg-secondary_hover') : 'transparent')};
  color: ${color('fg-quaternary')};
  opacity: ${(p) => (p.show ? 1 : 0)};
  cursor: ${(p) => (p.show ? 'grabbing' : 'grab')};
  transition: opacity 0.1s linear;
  &:hover { background: ${color('bg-secondary_hover')}; }
`;

// 번호 칸 — 번호와 손잡이가 같은 자리에서 바뀜
const Swap = styled.span`
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  > [data-drag-handle] { position: absolute; inset: 0; }
  > [data-no] { transition: opacity 0.1s linear; }
`;

const No = styled.span<{ picked?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: ${radius.xs}px;
  background: ${(p) => (p.picked ? color('bg-brand-solid') : color('bg-secondary'))};
  ${text('text-xs', 'semibold')};
  color: ${(p) => (p.picked ? color('text-white') : color('text-secondary'))};
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
  &:focus { border-color: ${(p) => (p.error ? color('border-error') : color('border-brand'))}; box-shadow: inset 0 0 0 1px ${(p) => (p.error ? color('border-error') : color('border-brand'))}, ${shadow.xs}; }
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
      <ValueTrigger ref={propRef} type="button" placeholder="속성 선택" aria-haspopup="listbox" aria-expanded={open === 'property'} onClick={() => setOpen('property')} style={{ flex: '0 0 106px' }}>
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
      <ValueTrigger ref={valRef} type="button" placeholder="값 선택" title={label || undefined} aria-haspopup="listbox" aria-expanded={open === 'value'} onClick={() => setOpen(filter.property ? 'value' : 'property')}>
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

// ── 블록 순서 변경 (분석 지표 · 데이터 그룹 공용) ──
// 잡은 블록이 포인터를 따라가고, 다른 블록 가운데를 지나면 자리를 바꿈. 바뀐 자리에는 놓일 자리(Slot)가 남음.
// 2개 이상일 때만 끌 수 있음.
function useSortable<T extends { id: string }>(items: T[], onChange: (next: T[]) => void) {
  const listRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ id: string; dy: number } | null>(null);
  const canDrag = items.length >= 2;
  // 창 이벤트 처리기가 늘 최신 목록을 보게 함
  const latest = useRef({ items, onChange });
  latest.current = { items, onChange };

  // 집기 — 창 mousemove/mouseup 을 바로 붙임(effect 로 미루면 빠른 끌기에서 mouseup 을 놓쳐 집힌 채 남음)
  const pick = (id: string, startY: number, firstY: number) => {
    let base = startY;
    let waitFor: T[] | null = null; // 자리를 바꾼 뒤 다시 그려지기 전엔 한 번 더 바꾸지 않음
    const move = (y: number) => {
      const { items: cur, onChange: change } = latest.current;
      if (waitFor === cur) return setDrag({ id, dy: y - base });
      waitFor = null;
      const list = listRef.current;
      if (!list) return;
      const cards = [...list.children] as HTMLElement[];
      const from = cur.findIndex((m) => m.id === id);
      let to = from;
      cards.forEach((c, i) => {
        if (i === from || i >= cur.length) return;
        const r = c.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        if (i > from && y > mid) to = Math.max(to, i);
        if (i < from && y < mid) to = Math.min(to, i);
      });
      if (to !== from) {
        const h = cards[from].getBoundingClientRect().height + 8;
        const next = [...cur];
        const [m] = next.splice(from, 1);
        next.splice(to, 0, m);
        change(next);
        waitFor = cur;
        base += to > from ? h * (to - from) : -h * (from - to);
      }
      setDrag({ id, dy: y - base });
    };
    const onMove = (e: MouseEvent) => move(e.clientY);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      setDrag(null);
      // 끈 뒤 따라오는 click 이 블록 클릭(이벤트 선택 열기)으로 이어지지 않게 한 번만 막음
      setTimeout(() => window.removeEventListener('click', swallowClick, true), 0);
    };
    window.addEventListener('click', swallowClick, true);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'grabbing';
    setDrag({ id, dy: 0 });
    if (firstY !== startY) move(firstY);
  };

  // 손잡이 = 누르자마자 집음. 블록 줄 나머지(번호 · 이름 · 칩) = 4px 넘게 움직이면 집고, 아니면 평소 클릭.
  // 버튼 · 입력칸에서 누른 건 끌기로 보지 않음.
  const press = (id: string, e: React.MouseEvent) => {
    if (!canDrag || e.button !== 0) return;
    const t = e.target as HTMLElement;
    const onHandle = !!t.closest('[data-drag-handle]');
    if (!onHandle && t.closest('button, input, textarea, [data-own-click]')) return;
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    if (onHandle) {
      e.stopPropagation();
      return pick(id, sy, sy);
    }
    const mv = (ev: MouseEvent) => {
      if (Math.abs(ev.clientX - sx) < 4 && Math.abs(ev.clientY - sy) < 4) return;
      done();
      pick(id, sy, ev.clientY);
    };
    const done = () => {
      window.removeEventListener('mousemove', mv);
      window.removeEventListener('mouseup', done);
    };
    window.addEventListener('mousemove', mv);
    window.addEventListener('mouseup', done);
  };

  return {
    listRef,
    canDrag,
    sorting: !!drag,
    item: (id: string) => ({
      picked: drag?.id === id,
      style: drag?.id === id ? { transform: `translateY(${drag.dy}px)` } : undefined,
      onDragStart: (e: React.MouseEvent) => press(id, e),
    }),
  };
}

function swallowClick(e: MouseEvent) {
  e.stopPropagation();
  e.preventDefault();
  window.removeEventListener('click', swallowClick, true);
}

type SortProps = { canDrag: boolean; sorting: boolean; picked: boolean; style?: React.CSSProperties; onDragStart: (e: React.MouseEvent) => void };

// 집은 블록의 원래 칸 = 놓일 자리. 블록은 그 위로 떠서 포인터를 따라감.
function SortItem({ picked, children }: { picked: boolean; children: ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      {picked && <Slot />}
      {children}
    </div>
  );
}

// ── 분석 지표 블록 (드래그 순서 변경 · 이벤트 교체 · 필터) ──
function MetricBlock({ metric, index, sort, onChangeEvent, onFilters, onRemove }: { metric: Metric; index: number; sort: SortProps; onChangeEvent: (ev: string) => void; onFilters: (f: Filter[]) => void; onRemove: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  return (
    <SortItem picked={sort.picked}>
      <Card lifted={sort.picked} style={sort.style}>
        <Block ref={ref} clickable onClick={() => setOpen(true)} onMouseDown={sort.onDragStart}>
          <Swap data-swap>
            <No data-no picked={sort.picked}>{index + 1}</No>
            {sort.canDrag && !sort.picked && (
              <Handle data-drag-handle onClick={(e) => e.stopPropagation()}>
                <Icon name="drag_indicator" size={16} />
              </Handle>
            )}
          </Swap>
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
    </SortItem>
  );
}

function Metrics({ metrics, onChange }: { metrics: Metric[]; onChange: (m: Metric[]) => void }) {
  const [adding, setAdding] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);
  const sortable = useSortable(metrics, onChange);

  const full = metrics.length + (adding ? 1 : 0) >= MAX_METRICS;
  return (
    <>
      <SortList ref={sortable.listRef} sorting={sortable.sorting}>
        {metrics.map((m, i) => (
          <MetricBlock
            key={m.id}
            metric={m}
            index={i}
            sort={{ canDrag: sortable.canDrag, sorting: sortable.sorting, ...sortable.item(m.id) }}
            onChangeEvent={(ev) => onChange(metrics.map((x) => (x.id === m.id ? { ...x, event: ev, filters: [] } : x)))}
            onFilters={(f) => onChange(metrics.map((x) => (x.id === m.id ? { ...x, filters: f } : x)))}
            onRemove={() => onChange(metrics.filter((x) => x.id !== m.id))}
          />
        ))}
        {adding && (
          <Card>
            <Block ref={addRef} clickable={false}>
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
      </SortList>
      <Button hierarchy="tertiary" iconLeading="add" full disabled={full || sortable.sorting} onClick={() => setAdding(true)}>
        이벤트 추가
      </Button>
    </>
  );
}

// ── 데이터 그룹 (스테이징은 「준비중」 — 순서 변경 시안 확인용으로 블록을 미리 둠) ──
type SplitBlock = { id: string; kind: '세그먼트' | '유저' | '기기'; label: string };
const SPLIT_SEED: SplitBlock[] = [
  { id: 'sp1', kind: '세그먼트', label: 'VIP 고객' },
  { id: 'sp2', kind: '기기', label: '플랫폼' },
];

function SplitRow({ block, sort, onRemove }: { block: SplitBlock; sort: SortProps; onRemove: () => void }) {
  return (
    <SortItem picked={sort.picked}>
      <Card lifted={sort.picked} style={sort.style}>
        <Block clickable={false} onMouseDown={sort.onDragStart} style={sort.canDrag ? { cursor: sort.picked ? 'grabbing' : 'grab' } : undefined}>
          <Kind>{block.kind}</Kind>
          <b>{block.label}</b>
          {sort.canDrag && (
            <Handle data-drag-handle show={sort.picked}>
              <Icon name="drag_indicator" size={16} />
            </Handle>
          )}
          <IconButton icon="close" size="xs" label="삭제" onClick={onRemove} />
        </Block>
      </Card>
    </SortItem>
  );
}

function DataGroups() {
  const [blocks, setBlocks] = useState<SplitBlock[]>(SPLIT_SEED);
  const [adding, setAdding] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);
  const sortable = useSortable(blocks, setBlocks);
  return (
    <>
      {blocks.length > 0 && (
        <SortList ref={sortable.listRef} sorting={sortable.sorting}>
          {blocks.map((b) => (
            <SplitRow key={b.id} block={b} sort={{ canDrag: sortable.canDrag, sorting: sortable.sorting, ...sortable.item(b.id) }} onRemove={() => setBlocks(blocks.filter((x) => x.id !== b.id))} />
          ))}
        </SortList>
      )}
      <div ref={addRef}>
        <Button hierarchy="tertiary" iconLeading="add" full disabled={sortable.sorting} onClick={() => setAdding(true)}>
          속성 추가
        </Button>
      </div>
      <Floating anchorRef={addRef} open={adding} width={680} onClose={() => setAdding(false)}>
        <TargetSelector
          onPick={(p) => {
            setAdding(false);
            if (p.kind === 'EVENT') return;
            const label = p.kind === 'SEGMENT' ? segments.find((s) => s.id === p.segmentId)?.name ?? '' : p.property;
            setBlocks([...blocks, { id: uid('sp'), kind: p.kind === 'SEGMENT' ? '세그먼트' : p.kind === 'USER' ? '유저' : '기기', label }]);
          }}
        />
      </Floating>
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
          </Head>
          <DataGroups />
        </Sec>
      </Sections>
    </Panel>
  );
}
