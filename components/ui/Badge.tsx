import styled from '@emotion/styled';
import { color, type ColorToken } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma `Badge` sm · Pill color — 높이 22, 모서리 full, utility 50 / 200 / 700.
const palette = {
  gray: 'neutral',
  brand: 'brand',
  success: 'green',
  error: 'red',
  warning: 'yellow',
} as const;

export type BadgeColor = keyof typeof palette;

const Pill = styled.span<{ c: BadgeColor }>`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  height: 22px;
  padding: 0 7px;
  border-radius: 9999px;
  border: 1px solid ${(p) => color(`utility-${palette[p.c]}-200` as ColorToken)};
  background: ${(p) => color(`utility-${palette[p.c]}-50` as ColorToken)};
  color: ${(p) => color(`utility-${palette[p.c]}-700` as ColorToken)};
  ${text('text-xs', 'medium')};
  white-space: nowrap;
`;

export default function Badge({ color: c = 'gray', children }: { color?: BadgeColor; children: string }) {
  return <Pill c={c}>{children}</Pill>;
}
