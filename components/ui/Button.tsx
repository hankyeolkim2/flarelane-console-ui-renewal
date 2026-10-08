import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { color, shadow } from '@/styles/tokens';
import { gradientBorder, primaryShadow, secondaryShadow } from '@/styles/effects';
import { text } from '@/styles/typography';

// Figma `Buttons/Button` · `Buttons/Button destructive`.
// Figma 테두리는 안쪽(inside)이라 높이를 고정하고, 테두리 있는 종류는 좌우 패딩에서 1px 뺌.
export type ButtonHierarchy = 'primary' | 'secondary' | 'tertiary' | 'destructive-tertiary';
export type ButtonSize = 'sm' | 'md';

const sizes = {
  sm: { h: 36, px: 12, iconOnly: 36 },
  md: { h: 40, px: 14, iconOnly: 40 },
};

const look = {
  primary: `
    background: ${color('bg-brand-solid')};
    color: ${color('text-white')};
    --btn-icon: ${color('fg-white')};
    box-shadow: ${primaryShadow};
    ${gradientBorder}
    &:hover:not(:disabled) { background: ${color('bg-brand-solid_hover')}; }
  `,
  secondary: `
    background: ${color('bg-primary')};
    color: ${color('text-secondary')};
    --btn-icon: ${color('fg-quaternary')};
    border: 1px solid ${color('border-primary')};
    box-shadow: ${secondaryShadow};
    &:hover:not(:disabled) { background: ${color('bg-primary_hover')}; color: ${color('text-secondary_hover')}; --btn-icon: ${color('fg-quaternary_hover')}; }
  `,
  tertiary: `
    background: transparent;
    color: ${color('text-tertiary')};
    --btn-icon: ${color('fg-quaternary')};
    &:hover:not(:disabled) { background: ${color('bg-primary_hover')}; color: ${color('text-tertiary_hover')}; --btn-icon: ${color('fg-quaternary_hover')}; }
  `,
  'destructive-tertiary': `
    background: transparent;
    color: ${color('text-error-primary')};
    --btn-icon: ${color('fg-error-secondary')};
    &:hover:not(:disabled) { background: ${color('bg-error-primary')}; color: ${color('text-error-primary_hover')}; }
  `,
};

const Base = styled.button<{ hierarchy: ButtonHierarchy; size: ButtonSize; iconOnly: boolean; full: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-shrink: 0;
  height: ${(p) => sizes[p.size].h}px;
  ${(p) => (p.iconOnly ? `width: ${sizes[p.size].iconOnly}px;` : '')}
  ${(p) => (p.full ? 'width: 100%;' : '')}
  padding: 0 ${(p) => (p.iconOnly ? 0 : sizes[p.size].px - (p.hierarchy === 'secondary' ? 1 : 0))}px;
  border: 0;
  border-radius: 8px;
  ${text('text-sm', 'semibold')};
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.1s linear, color 0.1s linear;
  ${(p) => look[p.hierarchy]};
  & > [data-btn-icon] { color: var(--btn-icon); transition: color 0.1s linear; }
  & > [data-btn-label] { padding: 0 2px; }
  &:focus-visible { outline: none; box-shadow: ${shadow['focus-ring']}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:disabled > [data-btn-icon] { opacity: 0.6; }
`;

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  hierarchy?: ButtonHierarchy;
  size?: ButtonSize;
  iconLeading?: string;
  iconTrailing?: string;
  icon?: string; // 아이콘만
  full?: boolean;
  children?: ReactNode;
};

export default function Button({ hierarchy = 'secondary', size = 'sm', iconLeading, iconTrailing, icon, full = false, children, ...rest }: Props) {
  const inner = (
    <>
      {(icon || iconLeading) && (
        <span data-btn-icon style={{ display: 'inline-flex' }}>
          <Icon name={(icon || iconLeading)!} size={20} />
        </span>
      )}
      {!icon && children != null && <span data-btn-label>{children}</span>}
      {iconTrailing && (
        <span data-btn-icon style={{ display: 'inline-flex' }}>
          <Icon name={iconTrailing} size={20} />
        </span>
      )}
    </>
  );
  return (
    <Base type="button" hierarchy={hierarchy} size={size} iconOnly={!!icon} full={full} {...rest}>
      {inner}
    </Base>
  );
}
