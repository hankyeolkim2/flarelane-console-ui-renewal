import { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { boardName, LIMITS, type Board } from '@/lib/analytics';
import { matches, NAME_MAX } from '@/lib/editor';
import { useStore } from '@/lib/store';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 「통계를 저장할 보드 선택」 — 보드 없이 새로 만든 통계를 저장할 때 (스테이징 2.6).
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(3, 7, 18, 0.7);
`;

const Box = styled.div`
  width: 480px;
  max-width: calc(100vw - 32px);
  background: ${color('bg-primary')};
  border-radius: ${radius['2xl']}px;
  box-shadow: ${shadow.xl};
  > h2 { margin: 0; padding: 20px 24px 12px; ${text('text-lg', 'semibold')}; color: ${color('text-primary')}; }
`;

const Search = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 24px 12px;
  height: 36px;
  padding: 0 11px;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.md}px;
  box-shadow: ${shadow.xs};
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  > input { flex: 1; border: 0; outline: none; background: transparent; ${text('text-sm', 'regular')}; color: ${color('text-primary')}; }
  > input::placeholder { color: ${color('text-placeholder')}; }
`;

const List = styled.div`
  max-height: 348px;
  overflow-y: auto;
  padding: 0 16px 8px;
`;

const Row = styled.button<{ selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 58px;
  padding: 0 12px;
  border: 0;
  border-radius: ${radius.md}px;
  background: ${(p) => (p.selected ? color('bg-brand-primary') : 'transparent')};
  text-align: left;
  cursor: pointer;
  &:hover { ${(p) => (p.selected ? '' : `background: ${color('bg-primary_hover')};`)} }
  > div { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  > div > b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  > div > small { ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
  > em { font-style: normal; ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
`;

const NewRow = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border: 0;
  background: transparent;
  ${text('text-sm', 'semibold')};
  color: ${color('text-brand-secondary')};
  cursor: pointer;
  border-radius: ${radius.md}px;
  &:hover { background: ${color('bg-primary_hover')}; }
`;

const NewInput = styled.input<{ error: boolean }>`
  width: 100%;
  height: 40px;
  padding: 0 11px;
  border: 1px solid ${(p) => (p.error ? color('border-error') : color('border-brand'))};
  border-radius: ${radius.md}px;
  ${text('text-sm', 'regular')};
  outline: none;
`;

const Err = styled.p`
  margin: 6px 0 4px;
  ${text('text-sm', 'regular')};
  color: ${color('text-error-primary')};
`;

const Empty = styled.p`
  margin: 0;
  padding: 24px 12px;
  ${text('text-sm', 'regular')};
  color: ${color('text-tertiary')};
`;

const Foot = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 15px 24px 20px;
  border-top: 1px solid ${color('border-secondary')};
`;

export default function BoardSelectModal({ onClose, onSave }: { onClose: () => void; onSave: (board: Board) => void }) {
  const { boards, createBoardNamed } = useStore();
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState(false);
  const [limit, setLimit] = useState(false);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (limit) setLimit(false);
      else if (!creating) onClose();
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [limit, creating, onClose]);

  const list = useMemo(
    () => [...boards].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).filter((b) => !q || matches(boardName(b), q) || matches(b.createdBy, q)),
    [boards, q],
  );

  return (
    <Overlay onMouseDown={onClose}>
      <Box role="dialog" aria-modal onMouseDown={(e) => e.stopPropagation()}>
        <h2>통계를 저장할 보드 선택</h2>
        <Search>
          <span>
            <Icon name="search" size={16} />
          </span>
          <input autoFocus placeholder="보드 이름, 생성자 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        </Search>
        <List>
          {creating ? (
            <div style={{ padding: '2px 0 8px' }}>
              <NewInput
                autoFocus
                error={error}
                maxLength={NAME_MAX}
                placeholder="새로 생성할 보드"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    setCreating(false);
                    setName('');
                    setError(false);
                  }
                  if (e.key === 'Enter') {
                    const v = name.trim();
                    if (!v) return setError(true);
                    const b = createBoardNamed(v);
                    setSelected(b.id);
                    setQ('');
                    setCreating(false);
                    setName('');
                  }
                }}
                onBlur={() => {
                  if (!error) {
                    setCreating(false);
                    setName('');
                  }
                }}
              />
              {error && <Err>유효하지 않은 이름입니다.</Err>}
            </div>
          ) : (
            <NewRow type="button" onClick={() => setCreating(true)}>
              <Icon name="add" size={20} />
              새 보드 생성
            </NewRow>
          )}
          {list.length === 0 ? (
            <Empty>검색 결과가 없습니다</Empty>
          ) : (
            list.map((b) => (
              <Row key={b.id} type="button" selected={b.id === selected} onClick={() => setSelected(b.id)}>
                <div>
                  <b>{boardName(b)}</b>
                  <small>{b.createdBy}</small>
                </div>
                <em>{b.reportsCount}개의 통계</em>
              </Row>
            ))
          )}
        </List>
        <Foot>
          <Button size="md" onClick={onClose}>
            취소
          </Button>
          <Button
            hierarchy="primary"
            size="md"
            disabled={!selected || creating}
            onClick={() => {
              const b = boards.find((x) => x.id === selected);
              if (!b) return;
              if (b.reportsCount >= LIMITS.reportsPerBoard) return setLimit(true);
              onSave(b);
            }}
          >
            저장
          </Button>
        </Foot>
      </Box>
      {limit && (
        <div onMouseDown={(e) => e.stopPropagation()}>
          <ConfirmModal
            title="이 보드의 통계 개수 제한에 도달했습니다."
            description={`보드당 최대 ${LIMITS.reportsPerBoard}개의 통계를 생성할 수 있습니다. 새 보드를 만들어 통계를 추가해 주세요.`}
            cancelLabel=""
            confirmLabel="확인"
            onClose={() => setLimit(false)}
            onConfirm={() => setLimit(false)}
          />
        </div>
      )}
    </Overlay>
  );
}
