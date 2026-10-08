import styled from '@emotion/styled';
import { color, shadow } from '@/styles/tokens';

// Figma `Radio` sm — 16 원, 선택 = bg-brand-solid + 가운데 흰 점 6.
const Dot = styled.span<{ $on: boolean; disabled: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid ${(p) => (p.$on ? color('bg-brand-solid') : color('border-primary'))};
  background: ${(p) => (p.$on ? color('bg-brand-solid') : p.disabled ? color('bg-disabled') : color('bg-primary'))};
  box-shadow: ${(p) => (p.$on ? 'none' : shadow.xs)};
  &::after { content: ''; width: 6px; height: 6px; border-radius: 50%; background: ${(p) => (p.$on ? color('fg-white') : 'transparent')}; }
`;

export default function Radio({ checked, disabled = false }: { checked: boolean; disabled?: boolean }) {
  return <Dot aria-hidden $on={checked} disabled={disabled} />;
}
