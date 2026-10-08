import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { color, radius, shadow } from '@/styles/tokens';

// Figma `Checkbox` sm — 16, 모서리 4. 체크 · 부분 = bg-brand-solid + 흰 아이콘.
const Box = styled.span<{ on: boolean; disabled: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: ${radius.xs}px;
  border: 1px solid ${(p) => (p.on ? color('bg-brand-solid') : color('border-primary'))};
  background: ${(p) => (p.on ? color('bg-brand-solid') : p.disabled ? color('bg-disabled') : color('bg-primary'))};
  color: ${color('fg-white')};
  box-shadow: ${(p) => (p.on ? 'none' : shadow.xs)};
`;

const Dash = styled.i`
  display: block;
  width: 8px;
  height: 1.5px;
  border-radius: 1px;
  background: currentColor;
`;

export default function Checkbox({ checked, indeterminate = false, disabled = false }: { checked: boolean; indeterminate?: boolean; disabled?: boolean }) {
  const on = checked || indeterminate;
  return (
    <Box aria-hidden on={on} disabled={disabled}>
      {indeterminate ? <Dash /> : checked ? <Icon name="check" size={12} /> : null}
    </Box>
  );
}
