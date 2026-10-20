import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma `Input field` Type=Number counter vertical sm — 높이 36 · 오른쪽 위/아래 단추 칸(구분선 1px).
const Box = styled.div<{ $error: boolean }>`
  display: flex;
  height: 36px;
  border-radius: ${radius.md}px;
  background: ${color('bg-primary')};
  box-shadow: inset 0 0 0 1px ${(p) => (p.$error ? color('border-error') : color('border-primary'))}, ${shadow.xs};
  overflow: hidden;
  &:focus-within { box-shadow: inset 0 0 0 2px ${(p) => (p.$error ? color('border-error') : color('border-brand'))}, ${shadow.xs}; }
  > input { flex: 1; min-width: 0; padding: 0 4px 0 12px; border: 0; outline: none; background: transparent; ${text('text-sm', 'regular')}; color: ${color('text-primary')}; }
  > input::placeholder { color: ${color('text-placeholder')}; }
`;

const Steps = styled.div`
  display: grid;
  grid-template-rows: 1fr 1fr;
  width: 24px;
  margin: 1px 1px 1px 0;
  border-left: 1px solid ${color('border-primary')};
  > button { display: inline-flex; align-items: center; justify-content: center; padding: 0; border: 0; background: transparent; color: ${color('fg-quaternary')}; cursor: pointer; }
  > button + button { border-top: 1px solid ${color('border-primary')}; }
  > button:hover:not(:disabled) { background: ${color('bg-primary_hover')}; color: ${color('fg-quaternary_hover')}; }
  > button:disabled { opacity: 0.4; cursor: not-allowed; }
`;

type Props = { value: string; onChange: (v: string) => void; min?: number; max?: number; width?: number; placeholder?: string; error?: boolean; ariaLabel?: string };

export default function NumberField({ value, onChange, min, max, width = 64, placeholder, error = false, ariaLabel }: Props) {
  const n = Number(value);
  const clamp = (x: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, x));
  const step = (d: number) => onChange(String(clamp((Number.isFinite(n) && value !== '' ? n : (min ?? 0)) + d)));
  return (
    <Box $error={error} style={{ width, flexShrink: 0 }}>
      <input
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        onBlur={() => { if (value !== '') onChange(String(clamp(Number(value)))); }}
        onKeyDown={(e) => { if (e.key === 'ArrowUp') { e.preventDefault(); step(1); } if (e.key === 'ArrowDown') { e.preventDefault(); step(-1); } }}
      />
      <Steps>
        <button type="button" tabIndex={-1} aria-label="늘리기" disabled={max !== undefined && n >= max} onClick={() => step(1)}>
          <Icon name="keyboard_arrow_up" size={14} />
        </button>
        <button type="button" tabIndex={-1} aria-label="줄이기" disabled={min !== undefined && n <= min} onClick={() => step(-1)}>
          <Icon name="keyboard_arrow_down" size={14} />
        </button>
      </Steps>
    </Box>
  );
}
