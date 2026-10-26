import { useEffect, useMemo, useState, type ReactNode } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import { deviceProperties, deviceTags, eventByName, events, propertyValues, RECENT_DAYS, segments, userProperties, userTags } from '@/lib/catalog';
import { MAX_FILTER_VALUES, matches } from '@/lib/editor';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 스테이징 선택기 팝오버 내용 — 이벤트(680) · 속성(360) · 값(360) · 타겟(680). 동작 = 스테이징, 모양 = 신규 DS
// Figma `Analytics event picker` 1729:101326 · `Analytics property picker` 1729:101354 · `Search menu` 1729:32468 (10-19 검색 팝오버 스펙):
// 검색 줄 = DS 인풋 상자(36 · 모서리 8 · 테두리 + 그림자 xs · 열리면 2px 브랜드 포커스) · 구분선 없음 · 사방 8.
// 목록 「상자 맞춤」 = 목록 좌우 4 + 항목 4 → 항목 바탕이 인풋 상자와 같은 8 선. 항목 = `_Select menu item` sm(36 · 모서리 6).

const Head = styled.div`
  padding: 8px;
`;

const Search = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 8px 0 12px;
  border-radius: ${radius.md}px;
  background: ${color('bg-primary')};
  box-shadow: inset 0 0 0 1px ${color('border-primary')}, ${shadow.xs};
  cursor: text;
  &:focus-within { box-shadow: inset 0 0 0 2px ${color('border-brand')}, ${shadow.xs}; }
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  > input { flex: 1; min-width: 0; height: 100%; border: 0; outline: none; background: transparent; ${text('text-sm', 'regular')}; color: ${color('text-primary')}; }
  > input::placeholder { color: ${color('text-placeholder')}; }
`;

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <Head>
      <Search>
        <span>
          <Icon name="search" size={16} />
        </span>
        <input autoFocus value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      </Search>
    </Head>
  );
}

const Body = styled.div<{ h: number }>`
  display: flex;
  height: ${(p) => p.h}px;
`;

const List = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 4px;
  overflow-y: auto;
`;

// 묶음 제목 — xs/Medium text-tertiary, 여백 8/12/4/12(글자가 항목 아이콘과 같은 16 선)
const Label = styled.div`
  flex-shrink: 0;
  padding: 8px 12px 4px;
  ${text('text-xs', 'medium')};
  color: ${color('text-tertiary')};
`;

// `_Select menu item` sm — 바깥 여백 1/4, 안 36 · 좌우 8 · 모서리 6, Hover bg-primary_hover, 선택 = 오른쪽 체크(fg-brand-primary)
const Item = styled.button<{ hl?: boolean; selected?: boolean }>`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  width: calc(100% - 8px);
  height: 36px;
  margin: 1px 4px;
  padding: 0 8px;
  border: 0;
  border-radius: ${radius.sm}px;
  background: ${(p) => (p.hl ? color('bg-primary_hover') : 'transparent')};
  ${text('text-sm', 'medium')};
  color: ${color('text-primary')};
  text-align: left;
  cursor: pointer;
  &:hover:not(:disabled) { background: ${color('bg-primary_hover')}; }
  &:disabled { cursor: not-allowed; color: ${color('text-disabled')}; }
  > span[data-icon] { display: inline-flex; color: ${color('fg-primary')}; } /* 체크박스(span)는 건드리지 않게 아이콘 칸만 */
  > em { flex: 1; min-width: 0; font-style: normal; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  > i { display: inline-flex; color: ${color('fg-brand-primary')}; }
`;

// 오른쪽 상세 — 여백 16/16/16/0 · 사이 12, 이름 md/SemiBold + 아이콘 16(fg-quaternary)
const Detail = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 256px;
  flex-shrink: 0;
  padding: 16px 16px 0;
  border-left: 1px solid ${color('border-secondary')};
  > small { ${text('text-xs', 'medium')}; color: ${color('text-tertiary')}; }
  > b { display: flex; align-items: center; gap: 8px; ${text('text-md', 'semibold')}; color: ${color('text-primary')}; word-break: break-all; }
  > b > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  > hr { width: 100%; margin: 0; border: 0; border-top: 1px solid ${color('border-secondary')}; }
  > div { display: flex; flex-direction: column; gap: 4px; }
  > div > small { ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
  > div > span { ${text('text-sm', 'medium')}; color: ${color('text-primary')}; }
`;

// 결과 없음 · 데이터 없음 — sm/Regular text-tertiary, 좌우 16
const Empty = styled.p`
  margin: auto;
  padding: 12px 16px;
  ${text('text-sm', 'regular')};
  color: ${color('text-tertiary')};
  text-align: center;
  white-space: pre-line;
`;

const NO_DATA = '측정할 데이터가 없습니다.\n데이터를 연동해주세요.';

// ── 이벤트 선택 (폭 680, 본문 388, 오른쪽 상세 256) ──
export function EventSelector({ current, onPick }: { current?: string; onPick: (name: string) => void }) {
  const [q, setQ] = useState('');
  const [hover, setHover] = useState<string | null>(null);
  const list = useMemo(() => events.filter((e) => !q || matches(e.name, q)), [q]);
  const hl = hover ?? list[0]?.name;
  const info = hl ? eventByName(hl) : undefined;
  return (
    <>
      <SearchBox value={q} onChange={setQ} placeholder="이벤트 검색" />
      <Body h={388}>
        {events.length === 0 ? (
          <Empty>{NO_DATA}</Empty>
        ) : list.length === 0 ? (
          <Empty>검색 결과가 없습니다</Empty>
        ) : (
          <>
            <List onMouseLeave={() => setHover(null)}>
              {list.map((e) => (
                <Item key={e.name} type="button" hl={e.name === hl} onMouseEnter={() => setHover(e.name)} onClick={() => onPick(e.name)}>
                  <span data-icon>
                    <Icon name="web_traffic" size={16} />
                  </span>
                  <em>{e.name}</em>
                  {e.name === current && <i><Icon name="check" size={16} /></i>}
                </Item>
              ))}
            </List>
            {info && (
              <Detail>
                <small>이벤트</small>
                <b>
                  <span>
                    <Icon name="web_traffic" size={16} />
                  </span>
                  {info.name}
                </b>
                <hr />
                <div>
                  <small>{`최근 발생 횟수 (${RECENT_DAYS}일)`}</small>
                  <span>{info.recent.toLocaleString('ko-KR')}</span>
                </div>
              </Detail>
            )}
          </>
        )}
      </Body>
    </>
  );
}

// ── 속성 선택 (폭 360, 본문 280) ──
export function PropertySelector({ event, current, onPick }: { event: string; current?: string | null; onPick: (p: string) => void }) {
  const [q, setQ] = useState('');
  const all = eventByName(event)?.properties ?? [];
  const list = all.filter((p) => !q || matches(p, q));
  return (
    <>
      <SearchBox value={q} onChange={setQ} placeholder="속성 검색" />
      <List style={{ height: 280, flex: 'none' }}>
        {all.length === 0 ? (
          <Empty>{NO_DATA}</Empty>
        ) : list.length === 0 ? (
          <Empty>검색 결과가 없습니다</Empty>
        ) : (
          <>
            {!q && <Label>모든 속성</Label>}
            {list.map((p) => (
              <Item key={p} type="button" onClick={() => onPick(p)}>
                <em>{p}</em>
                {p === current && <i><Icon name="check" size={16} /></i>}
              </Item>
            ))}
          </>
        )}
      </List>
    </>
  );
}

// 하단 버튼 줄 — 위 선 · 여백 8(10-19 스펙)
const Foot = styled.div`
  padding: 8px;
  border-top: 1px solid ${color('border-secondary')};
`;

// 목록 아래 안내 — xs/Regular text-tertiary 가운데(Search menu Footer)
const Note = styled.p`
  margin: 0;
  padding: 4px 12px 8px;
  ${text('text-xs', 'regular')};
  color: ${color('text-tertiary')};
  text-align: center;
`;

// ── 값 선택 (폭 360, 높이 486, 적용 눌러야 반영 · 최대 100개 · 전체 선택 3상태 · 검색 0.3초) ──
export function ValueSelector({ property, initial, onApply }: { property: string; initial: string[]; onApply: (v: string[]) => void }) {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [draft, setDraft] = useState<string[]>(initial);
  useEffect(() => {
    if (!q) return setDebounced('');
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  const loaded = (propertyValues[property] ?? []).filter((v) => !debounced || matches(v, debounced));
  const truncated = loaded.length > 100;
  const shown = loaded.slice(0, 100);
  // 이미 고른 값 중 목록에 없는 것 → 맨 위, 그다음 고른 값, 그다음 나머지
  const missing = debounced ? [] : draft.filter((v) => !shown.includes(v));
  const ordered = [...missing, ...shown.filter((v) => draft.includes(v)), ...shown.filter((v) => !draft.includes(v))];
  const full = draft.length >= MAX_FILTER_VALUES;
  const visibleChecked = ordered.filter((v) => draft.includes(v)).length;
  const toggleAll = () => {
    if (visibleChecked === ordered.length) setDraft((d) => d.filter((v) => !ordered.includes(v)));
    else setDraft((d) => [...d, ...ordered.filter((v) => !d.includes(v))].slice(0, MAX_FILTER_VALUES));
  };
  return (
    <div style={{ height: 486, display: 'flex', flexDirection: 'column' }}>
      <SearchBox value={q} onChange={setQ} placeholder="속성값 검색" />
      <List>
        {ordered.length === 0 ? (
          <Empty>{debounced ? '검색 결과가 없습니다' : NO_DATA}</Empty>
        ) : (
          <>
            <Item type="button" onClick={toggleAll}>
              <Checkbox checked={visibleChecked === ordered.length} indeterminate={visibleChecked > 0 && visibleChecked < ordered.length} />
              <em>전체 선택</em>
            </Item>
            {ordered.map((v) => {
              const on = draft.includes(v);
              return (
                <Item key={v} type="button" disabled={!on && full} onClick={() => setDraft((d) => (on ? d.filter((x) => x !== v) : [...d, v]))}>
                  <Checkbox checked={on} disabled={!on && full} />
                  <em>{v}</em>
                </Item>
              );
            })}
            {truncated && <Note>상위 100개만 표시됩니다. 검색으로 좁혀보세요.</Note>}
          </>
        )}
      </List>
      <Foot>
        <Button hierarchy="primary" full onClick={() => onApply(draft)}>
          적용
        </Button>
      </Foot>
    </div>
  );
}

// ── 타겟 선택 (폭 680, 탭 5개, 상세 패널은 전체 · 이벤트 · 세그먼트 탭에서만) ──
export type TargetPick =
  | { kind: 'EVENT'; event: string }
  | { kind: 'SEGMENT'; segmentId: string }
  | { kind: 'USER' | 'DEVICE'; property: string };

type TargetTab = 'ALL' | 'EVENT' | 'SEGMENT' | 'USER' | 'DEVICE';

// 탭 = Horizontal tabs Button gray sm(36 · 좌우 10 · 모서리 6 · 사이 4, 현재 탭 bg-primary_hover), 줄 여백 8/8/8/0 · 구분선 없음
const Tabs = styled.div`
  display: flex;
  gap: 4px;
  padding: 8px 8px 0;
`;

const Tab = styled.button<{ $on: boolean }>`
  height: 36px;
  padding: 0 10px;
  border: 0;
  border-radius: ${radius.sm}px;
  background: ${(p) => (p.$on ? color('bg-primary_hover') : 'transparent')};
  ${text('text-sm', 'semibold')};
  color: ${(p) => (p.$on ? color('text-secondary') : color('text-quaternary'))};
  cursor: pointer;
  &:hover { background: ${color('bg-primary_hover')}; color: ${color('text-secondary')}; }
`;

export function TargetSelector({ onPick }: { onPick: (p: TargetPick) => void }) {
  const [tab, setTab] = useState<TargetTab>('ALL');
  const [q, setQ] = useState('');
  const [hover, setHover] = useState<string | null>(null);
  const f = (s: string) => !q || matches(s, q);
  const evs = events.filter((e) => f(e.name));
  const segs = segments.filter((s) => f(s.name) || f(s.id));
  const uProps = userProperties.filter(f);
  const uTags = userTags.filter(f);
  const dProps = deviceProperties.filter(f);
  const dTags = deviceTags.filter(f);

  type Row = { key: string; icon: string; label: string; pick: TargetPick };
  const sections: { title: string; rows: Row[] }[] = [];
  const evRows = evs.map((e) => ({ key: `e:${e.name}`, icon: 'web_traffic', label: e.name, pick: { kind: 'EVENT', event: e.name } as TargetPick }));
  const segRows = segs.map((s) => ({ key: `s:${s.id}`, icon: 'group', label: s.name, pick: { kind: 'SEGMENT', segmentId: s.id } as TargetPick }));
  const uRows = [...uProps.map((p) => ({ key: `u:${p}`, icon: 'person', label: p, pick: { kind: 'USER', property: p } as TargetPick }))];
  const utRows = uTags.map((p) => ({ key: `ut:${p}`, icon: 'sell', label: p, pick: { kind: 'USER', property: p } as TargetPick }));
  const dRows = dProps.map((p) => ({ key: `d:${p}`, icon: 'devices', label: p, pick: { kind: 'DEVICE', property: p } as TargetPick }));
  const dtRows = dTags.map((p) => ({ key: `dt:${p}`, icon: 'sell', label: p, pick: { kind: 'DEVICE', property: p } as TargetPick }));
  if (tab === 'ALL') {
    sections.push({ title: '이벤트', rows: evRows }, { title: '세그먼트', rows: segRows }, { title: '유저', rows: [...uRows, ...utRows] }, { title: '기기', rows: [...dRows, ...dtRows] });
  } else if (tab === 'EVENT') sections.push({ title: '모든 이벤트', rows: evRows });
  else if (tab === 'SEGMENT') sections.push({ title: '모든 세그먼트', rows: segRows });
  else if (tab === 'USER') sections.push({ title: '유저 속성', rows: uRows }, { title: '유저 태그', rows: utRows });
  else sections.push({ title: '기기 속성', rows: dRows }, { title: '기기 태그', rows: dtRows });
  const visible = sections.filter((s) => s.rows.length);
  const allRows = visible.flatMap((s) => s.rows);
  const hl = hover ?? allRows[0]?.key;
  const showDetail = tab === 'ALL' || tab === 'EVENT' || tab === 'SEGMENT';
  const hlRow = allRows.find((r) => r.key === hl);

  let detail: ReactNode = null;
  if (hlRow?.pick.kind === 'EVENT') {
    const info = eventByName(hlRow.pick.event)!;
    detail = (
      <>
        <small>이벤트</small>
        <b><span><Icon name="web_traffic" size={16} /></span>{info.name}</b>
        <hr />
        <div><small>{`최근 발생 횟수 (${RECENT_DAYS}일)`}</small><span>{info.recent.toLocaleString('ko-KR')}</span></div>
      </>
    );
  } else if (hlRow?.pick.kind === 'SEGMENT') {
    const id = hlRow.pick.segmentId;
    const s = segments.find((x) => x.id === id)!;
    detail = (
      <>
        <small>세그먼트</small>
        <b><span><Icon name="group" size={16} /></span>{s.name}</b>
        <hr />
        <div><small>세그먼트 ID</small><span>{s.id}</span></div>
      </>
    );
  }

  return (
    <>
      <Tabs>
        {(
          [
            ['ALL', '전체'],
            ['EVENT', '이벤트'],
            ['SEGMENT', '세그먼트'],
            ['USER', '유저'],
            ['DEVICE', '디바이스'],
          ] as [TargetTab, string][]
        ).map(([v, l]) => (
          <Tab key={v} type="button" $on={tab === v} onClick={() => { setTab(v); setHover(null); }}>
            {l}
          </Tab>
        ))}
      </Tabs>
      <SearchBox value={q} onChange={setQ} placeholder="이벤트 혹은 속성 검색" />
      <Body h={300}>
        {visible.length === 0 ? (
          <Empty>{q ? '검색 결과가 없습니다' : NO_DATA}</Empty>
        ) : (
          <>
            <List onMouseLeave={() => setHover(null)}>
              {visible.map((s) => (
                <div key={s.title} style={{ display: 'contents' }}>
                  <Label>{s.title}</Label>
                  {s.rows.map((r) => (
                    <Item key={r.key} type="button" hl={r.key === hl} onMouseEnter={() => setHover(r.key)} onClick={() => onPick(r.pick)}>
                      <span data-icon><Icon name={r.icon} size={16} /></span>
                      <em>{r.label}</em>
                    </Item>
                  ))}
                </div>
              ))}
            </List>
            {showDetail && <Detail>{detail}</Detail>}
          </>
        )}
      </Body>
    </>
  );
}
