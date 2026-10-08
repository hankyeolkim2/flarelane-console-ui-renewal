import styled from '@emotion/styled';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma `Button group` — 36, 테두리 border-primary, 칸 사이 세로선, 선택 = bg-primary_hover.
const Wrap = styled.div`
  display: inline-flex;
  box-sizing: border-box;
  height: 36px;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.md}px;
  overflow: hidden;
  box-shadow: 0px 1px 2px 0px #0000000d;
  > button {
    padding: 0 14px;
    border: 0;
    background: ${color('bg-primary')};
    ${text('text-sm', 'semibold')};
    color: ${color('text-secondary')};
    white-space: nowrap;
    cursor: pointer;
    transition: background-color 0.1s linear;
  }
  > button + button { border-left: 1px solid ${color('border-primary')}; }
  > button:hover:not(:disabled), > button[aria-pressed='true'] { background: ${color('bg-primary_hover')}; color: ${color('text-secondary_hover')}; }
  > button:disabled { cursor: default; color: ${color('text-disabled')}; }
  > button[aria-pressed='true']:disabled { color: ${color('text-secondary')}; }
`;

export default function ButtonGroup<T extends string>({ items, value, onChange, disabled }: { items: { value: T; label: string }[]; value: T; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <Wrap role="group">
      {items.map((it) => (
        <button key={it.value} type="button" aria-pressed={it.value === value} disabled={disabled} onClick={() => onChange(it.value)}>
          {it.label}
        </button>
      ))}
    </Wrap>
  );
}
