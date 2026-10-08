import { forwardRef, useImperativeHandle, useRef, useState, type CSSProperties } from 'react';
import styled from '@emotion/styled';
import { color, radius } from '@/styles/tokens';

// 이름 바로 수정 (스테이징 목록 · 보드 · 카드의 「이름 수정」 = 그 자리에서 입력칸으로 바뀜).
// Enter · 바깥 클릭 = 저장, Esc = 취소. 빈 값이면 이름 없음(「제목 없음」 등)으로 저장.
export type InlineNameHandle = { startEdit: () => void; isEditing: boolean };

const Input = styled.input`
  width: 100%;
  min-width: 0;
  margin: -2px -6px;
  padding: 2px 6px;
  border: 1px solid ${color('border-brand')};
  border-radius: ${radius.xs}px;
  background: ${color('bg-primary')};
  font: inherit;
  color: inherit;
  outline: none;
`;

type Props = { name: string | null; fallback: string; onSave: (name: string | null) => void; maxLength?: number; style?: CSSProperties; className?: string };

const InlineName = forwardRef<InlineNameHandle, Props>(function InlineName({ name, fallback, onSave, maxLength = 100, style, className }, ref) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const editingRef = useRef(false);

  useImperativeHandle(ref, () => ({
    startEdit: () => {
      setDraft(name ?? '');
      editingRef.current = true;
      setEditing(true);
    },
    get isEditing() {
      return editingRef.current;
    },
  }), [name]);

  const finish = (save: boolean) => {
    if (!editingRef.current) return;
    editingRef.current = false;
    setEditing(false);
    if (save) {
      const v = draft.trim();
      if (v !== (name ?? '')) onSave(v ? v : null);
    }
  };

  if (editing) {
    return (
      <Input
        autoFocus
        value={draft}
        maxLength={maxLength}
        placeholder={fallback}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setDraft(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') finish(true);
          if (e.key === 'Escape') finish(false);
        }}
        onBlur={() => finish(true)}
        style={style}
        className={className}
      />
    );
  }
  return (
    <span style={style} className={className}>
      {name || fallback}
    </span>
  );
});

export default InlineName;
