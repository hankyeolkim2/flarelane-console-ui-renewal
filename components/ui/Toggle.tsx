import styled from '@emotion/styled';
import { color, radius, shadow } from '@/styles/tokens';

// Figma `Toggle` sm Default — 36×20, 원 16, 켜짐 = bg-brand-solid.
const Track = styled.button<{ $on: boolean }>`
  position: relative;
  flex-shrink: 0;
  width: 36px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: ${radius.full}px;
  background: ${(p) => (p.$on ? color('bg-brand-solid') : color('bg-tertiary'))};
  cursor: pointer;
  transition: background-color 0.15s ease;
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${(p) => (p.$on ? 18 : 2)}px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${color('fg-white')};
    box-shadow: ${shadow.sm};
    transition: left 0.15s ease;
  }
  &:hover:not(:disabled) { background: ${(p) => (p.$on ? color('bg-brand-solid_hover') : color('bg-quaternary'))}; }
  &:focus-visible { outline: none; box-shadow: ${shadow['focus-ring']}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export default function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return <Track type="button" role="switch" aria-checked={checked} aria-label={label} $on={checked} disabled={disabled} onClick={() => onChange(!checked)} />;
}
