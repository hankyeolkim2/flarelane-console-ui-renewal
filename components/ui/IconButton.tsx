import type { ButtonHTMLAttributes } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { color, radius, shadow } from '@/styles/tokens';
import { secondaryShadow } from '@/styles/effects';

// Figma `Buttons/Button utility` — xs 28(아이콘 16) · sm 32(아이콘 20), 모서리 6.
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: string;
  size?: 'xs' | 'sm';
  hierarchy?: 'tertiary' | 'secondary';
  label: string;
};

const Base = styled.button<{ size: 'xs' | 'sm'; hierarchy: 'tertiary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${(p) => (p.size === 'xs' ? 28 : 32)}px;
  height: ${(p) => (p.size === 'xs' ? 28 : 32)}px;
  padding: 0;
  border: ${(p) => (p.hierarchy === 'secondary' ? `1px solid ${color('border-primary')}` : '0')};
  border-radius: ${radius.sm}px;
  background: ${(p) => (p.hierarchy === 'secondary' ? color('bg-primary') : 'transparent')};
  box-shadow: ${(p) => (p.hierarchy === 'secondary' ? secondaryShadow : 'none')};
  color: ${color('fg-quaternary')};
  cursor: pointer;
  transition: background-color 0.1s linear, color 0.1s linear;
  &:hover:not(:disabled), &[data-hover] { background: ${color('bg-primary_hover')}; color: ${color('fg-quaternary_hover')}; }
  &:focus-visible { outline: none; box-shadow: ${shadow['focus-ring']}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export default function IconButton({ icon, size = 'sm', hierarchy = 'tertiary', label, ...rest }: Props) {
  return (
    <Base type="button" aria-label={label} title={label} size={size} hierarchy={hierarchy} {...rest}>
      <Icon name={icon} size={size === 'xs' ? 16 : 20} />
    </Base>
  );
}
