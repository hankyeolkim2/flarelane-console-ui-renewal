import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Button from '@/components/ui/Button';
import Icon from '@/components/Icon';
import IconButton from '@/components/ui/IconButton';
import InlineName, { type InlineNameHandle } from '@/components/ui/InlineName';
import { Anchor, Menu, MenuItem } from '@/components/ui/Menu';
import { ConfirmModal } from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { BorderTabs } from '@/components/ui/Tabs';
import AnalyticsSearch from '@/components/analytics/AnalyticsSearch';
import CreateMenu from '@/components/analytics/CreateMenu';
import { boardName, formatEdited, LIMITS, ME, type Board } from '@/lib/analytics';
import { useStore } from '@/lib/store';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma 「분석 보드 — 목록 — 1440」(1265:2134) + 스테이징 목록 동작(docs/staging-behavior-analytics.md).
type Sort = 'updatedAt' | 'createdAt';

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  h1 { margin: 0; ${text('display-xs', 'semibold')}; color: ${color('text-primary')}; }
  > span { ${text('text-md', 'medium')}; color: ${color('text-tertiary')}; }
  > i { flex: 1; }
`;

const TabsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  > i { flex: 1; }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Table = styled.div`
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  box-shadow: ${shadow.xs};
  overflow: hidden;
`;

const cols = `grid-template-columns: minmax(0, 1fr) 180px 180px 52px;`;

const HeadRow = styled.div`
  display: grid;
  ${cols}
  border-bottom: 1px solid ${color('border-secondary')};
  > div { display: flex; align-items: center; height: 39px; padding: 0 20px; ${text('text-xs', 'semibold')}; color: ${color('text-quaternary')}; }
`;

const Row = styled.div`
  display: grid;
  ${cols}
  border-bottom: 1px solid ${color('border-secondary')};
  cursor: pointer;
  transition: background-color 0.1s linear;
  &:last-of-type { border-bottom: 0; }
  &:hover { background: ${color('bg-secondary')}; }
  > div { display: flex; align-items: center; min-width: 0; height: 63px; padding: 0 20px; }
  > div:last-of-type { padding: 0 12px 0 20px; justify-content: flex-end; }
`;

const NameCell = styled.div`
  flex-direction: column;
  align-items: flex-start !important;
  justify-content: center;
  > * { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  > span:first-of-type, > input { ${text('text-sm', 'medium')}; color: ${color('text-primary')}; }
  > small { ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
`;

const Plain = styled.div`
  ${text('text-sm', 'medium')};
  color: ${color('text-primary')};
  > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

const Skeleton = styled.div`
  display: grid;
  ${cols}
  border-top: 1px solid ${color('border-secondary')};
  > div { display: flex; align-items: center; height: 63px; padding: 0 20px; }
  > div > i { display: block; width: 60%; height: 12px; border-radius: 6px; background: ${color('bg-tertiary')}; }
`;

const EmptyBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 64px 24px;
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  box-shadow: ${shadow.xs};
  > span { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: ${radius.lg}px; border: 1px solid ${color('border-primary')}; box-shadow: ${shadow['xs-skeuomorphic']}; color: ${color('fg-secondary')}; }
  > p { margin: 0; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
`;

function BoardRow({ board, onOpen, onDelete }: { board: Board; onOpen: () => void; onDelete: () => void }) {
  const { renameBoard } = useStore();
  const nameRef = useRef<InlineNameHandle>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState(false);
  return (
    <Row role="link" onClick={() => !nameRef.current?.isEditing && onOpen()}>
      <NameCell>
        <InlineName ref={nameRef} name={board.name} fallback="제목 없음" onSave={(n) => renameBoard(board.id, n)} />
        <small>{board.reportsCount}개의 통계</small>
      </NameCell>
      <Plain suppressHydrationWarning>{formatEdited(board.updatedAt)}</Plain>
      <Plain title={board.createdBy}>
        <span>{board.createdBy}</span>
      </Plain>
      <div onClick={(e) => e.stopPropagation()}>
        <Anchor ref={menuRef}>
          <IconButton icon="more_horiz" size="sm" label="더보기" onClick={() => setMenu((v) => !v)} />
          <Menu open={menu} onClose={() => setMenu(false)} anchorRef={menuRef} width={160} align="end">
            <MenuItem label="이름 수정" onClick={() => { setMenu(false); setTimeout(() => nameRef.current?.startEdit()); }} />
            <MenuItem label="삭제" destructive onClick={() => { setMenu(false); onDelete(); }} />
          </Menu>
        </Anchor>
      </div>
    </Row>
  );
}

export default function AnalyticsBoards() {
  const router = useRouter();
  const { boards, deleteBoard, createBoard, toast } = useStore();
  const [mine, setMine] = useState(false);
  const [sort, setSort] = useState<Sort>('updatedAt');
  const [visible, setVisible] = useState(LIMITS.firstPage);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  const list = useMemo(() => {
    const l = boards.filter((b) => !mine || b.createdBy === ME);
    return [...l].sort((a, b) => b[sort].localeCompare(a[sort]));
  }, [boards, mine, sort]);

  // 탭 · 정렬이 바뀌면 처음 10개부터 다시
  useEffect(() => setVisible(LIMITS.firstPage), [mine, sort]);

  const hasMore = visible < list.length;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMore) {
        setLoadingMore(true);
        setTimeout(() => {
          setVisible((v) => v + LIMITS.nextPage);
          setLoadingMore(false);
        }, 400);
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadingMore, visible]);

  const target = boards.find((b) => b.id === deleteId);

  return (
    <>
      <Head>
        <h1>분석 보드</h1>
        <span>{list.length}개 보드</span>
        <i />
        <CreateMenu />
      </Head>
      <AnalyticsSearch />
      <Section>
        <TabsRow>
          <BorderTabs
            items={[
              { value: 'all', label: '전체', count: boards.length },
              { value: 'mine', label: '내가 만든', count: boards.filter((b) => b.createdBy === ME).length },
            ]}
            value={mine ? 'mine' : 'all'}
            onChange={(v) => setMine(v === 'mine')}
          />
          <i />
          <Select<Sort>
            width={160}
            value={sort}
            onChange={setSort}
            options={[
              { value: 'updatedAt', label: '최근 편집순' },
              { value: 'createdAt', label: '최근 생성순' },
            ]}
          />
        </TabsRow>
        {list.length === 0 ? (
          <EmptyBox>
            <span>
              <Icon name="create_new_folder" size={24} />
            </span>
            <p>보드를 생성하고 통계를 관리해 보세요.</p>
            <Button hierarchy="primary" iconLeading="add" onClick={() => router.push(`/analytics-boards/${createBoard().id}`)}>
              보드 생성
            </Button>
          </EmptyBox>
        ) : (
          <Table>
            <HeadRow>
              <div>보드명</div>
              <div>최근 편집일</div>
              <div>생성자</div>
              <div />
            </HeadRow>
            {list.slice(0, visible).map((b) => (
              <BoardRow key={b.id} board={b} onOpen={() => router.push(`/analytics-boards/${b.id}`)} onDelete={() => setDeleteId(b.id)} />
            ))}
            {hasMore && (
              <Skeleton ref={sentinel}>
                <div><i /></div>
                <div><i /></div>
                <div><i /></div>
                <div />
              </Skeleton>
            )}
          </Table>
        )}
      </Section>
      {target && (
        <ConfirmModal
          title="보드를 삭제하시겠습니까?"
          description="보드 삭제시 보드에 포함된 모든 통계가 삭제되며, 복구 불가합니다."
          cancelLabel="취소"
          confirmLabel="삭제"
          destructive
          onClose={() => setDeleteId(null)}
          onConfirm={() => {
            deleteBoard(target.id);
            setDeleteId(null);
            toast(`${boardName(target)} 보드가 삭제되었습니다.`);
          }}
        />
      )}
    </>
  );
}
