import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { useDismiss } from '@/components/ui/Menu';
import { useStore } from '@/lib/store';
import { boardName, formatEdited, LIMITS, reportName } from '@/lib/analytics';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 보드명 · 통계명 · 이벤트 검색 — 입력 0.3초 뒤 검색, 결과 = 보드 · 통계 섞인 목록(최대 7줄 보이고 스크롤).
const Wrap = styled.div`
  position: relative;
  width: 100%;
`;

const Field = styled.label<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 11px;
  border: 1px solid ${(p) => (p.active ? color('border-brand') : color('border-primary'))};
  border-radius: ${radius.md}px;
  background: ${color('bg-primary')};
  box-shadow: ${shadow.xs};
  cursor: text;
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  > input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: none;
    background: transparent;
    ${text('text-sm', 'regular')};
    color: ${color('text-primary')};
  }
  > input::placeholder { color: ${color('text-placeholder')}; }
`;

const Panel = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 30;
  padding: 4px 0;
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary_alt')};
  border-radius: ${radius.md}px;
  box-shadow: ${shadow.lg};
`;

const List = styled.div`
  max-height: ${60 * LIMITS.searchVisibleRows}px;
  overflow-y: auto;
`;

const Empty = styled.p`
  margin: 0;
  padding: 12px 16px;
  ${text('text-sm', 'regular')};
  color: ${color('text-tertiary')};
`;

const Row = styled.button`
  display: flex;
  width: 100%;
  padding: 1px 6px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
  > span {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    height: 58px;
    padding: 0 10px;
    border-radius: ${radius.sm}px;
    transition: background-color 0.1s linear;
  }
  &:hover > span { background: ${color('bg-primary_hover')}; }
`;

const TypeIcon = styled.span<{ accent: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: ${radius.sm}px;
  background: ${(p) => (p.accent ? color('bg-brand-primary') : color('bg-secondary'))};
  color: ${(p) => (p.accent ? color('fg-brand-primary') : color('fg-quaternary'))};
`;

const Texts = styled.span`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  b, small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  b { ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  small { ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
`;

const When = styled.small`
  flex-shrink: 0;
  ${text('text-xs', 'regular')};
  color: ${color('text-tertiary')};
`;

type Result =
  | { type: 'BOARD'; id: string; name: string; sub: string; updatedAt: string }
  | { type: 'INSIGHT' | 'FUNNEL'; id: string; boardId: string; name: string; sub: string; updatedAt: string };

export default function AnalyticsSearch() {
  const router = useRouter();
  const { boards, reports } = useStore();
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  useEffect(() => {
    const k = keyword.trim();
    if (!k) {
      setQuery('');
      return;
    }
    const t = setTimeout(() => setQuery(k), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  const results = useMemo<Result[]>(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    const bs: Result[] = boards
      .filter((b) => boardName(b).toLowerCase().includes(q))
      .map((b) => ({ type: 'BOARD', id: b.id, name: boardName(b), sub: `${b.reportsCount}개의 통계`, updatedAt: b.updatedAt }));
    const rs: Result[] = reports
      .filter((r) => reportName(r).toLowerCase().includes(q) || r.events.some((e) => e.toLowerCase().includes(q)))
      .map((r) => ({ type: r.type, id: r.id, boardId: r.boardId, name: reportName(r), sub: boardName(boards.find((b) => b.id === r.boardId) ?? { name: null }), updatedAt: r.updatedAt }));
    return [...bs, ...rs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [query, boards, reports]);

  const go = (r: Result) => {
    setKeyword('');
    setQuery('');
    setOpen(false);
    router.push(r.type === 'BOARD' ? `/analytics-boards/${r.id}` : `/analytics-boards/${r.boardId}/reports/${r.id}`);
  };

  return (
    <Wrap ref={ref}>
      <Field active={focused || !!keyword}>
        <span>
          <Icon name="search" size={16} />
        </span>
        <input
          value={keyword}
          maxLength={LIMITS.searchMaxLength}
          placeholder="보드명, 통계명, 이벤트 검색"
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => setFocused(false)}
        />
      </Field>
      {open && !!query && (
        <Panel>
          {results.length === 0 ? (
            <Empty>검색 결과가 없습니다</Empty>
          ) : (
            <List>
              {results.map((r) => (
                <Row key={`${r.type}_${r.id}`} type="button" onClick={() => go(r)}>
                  <span>
                    <TypeIcon accent={r.type !== 'BOARD'}>
                      <Icon name={r.type === 'BOARD' ? 'create_new_folder' : r.type === 'INSIGHT' ? 'show_chart' : 'funnel'} size={20} />
                    </TypeIcon>
                    <Texts>
                      <b>{r.name}</b>
                      <small>{r.sub}</small>
                    </Texts>
                    <When>{formatEdited(r.updatedAt)}</When>
                  </span>
                </Row>
              ))}
            </List>
          )}
        </Panel>
      )}
    </Wrap>
  );
}
