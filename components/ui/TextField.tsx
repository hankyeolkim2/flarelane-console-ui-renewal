import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma `Input field` sm — 높이 36, 좌우 12, 테두리 border-primary, 포커스 = border-brand, 비활성 = 투명도 50%, 오류 = border-error.
const Box = styled.label<{ $error: boolean; $disabled: boolean; $readOnly: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 36px;
  padding: 0 11px;
  border: 1px solid ${(p) => (p.$error ? color('border-error') : color('border-primary'))};
  border-radius: ${radius.md}px;
  background: ${(p) => (p.$readOnly ? color('bg-secondary') : color('bg-primary'))};
  box-shadow: ${(p) => (p.$readOnly ? 'none' : shadow.xs)};
  opacity: ${(p) => (p.$disabled ? 0.5 : 1)};
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'text')};
  /* 포커스 = 2px(Figma Input field Focused) — 테두리 1 + 안쪽 1, 글자 위치는 그대로 */
  &:focus-within { border-color: ${(p) => (p.$error ? color('border-error') : color('border-brand'))}; box-shadow: inset 0 0 0 1px ${(p) => (p.$error ? color('border-error') : color('border-brand'))}${(p) => (p.$readOnly ? '' : `, ${shadow.xs}`)}; }
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  > input { flex: 1; min-width: 0; height: 100%; border: 0; outline: none; background: transparent; ${text('text-sm', 'regular')}; color: ${color('text-primary')}; }
  > input::placeholder { color: ${color('text-placeholder')}; }
  > input:disabled { cursor: not-allowed; }
`;

export const FieldError = styled.p`
  margin: 6px 0 0;
  ${text('text-sm', 'regular')};
  color: ${color('text-error-primary')};
`;

type Props = InputHTMLAttributes<HTMLInputElement> & { icon?: string; error?: boolean; trailing?: ReactNode };

const TextField = forwardRef<HTMLInputElement, Props>(function TextField({ icon, error = false, trailing, disabled, readOnly, style, className, ...rest }, ref) {
  return (
    <Box $error={error} $disabled={!!disabled} $readOnly={!!readOnly} style={style} className={className}>
      {icon && (
        <span>
          <Icon name={icon} size={16} />
        </span>
      )}
      <input ref={ref} disabled={disabled} readOnly={readOnly} {...rest} />
      {trailing}
    </Box>
  );
});

export default TextField;
