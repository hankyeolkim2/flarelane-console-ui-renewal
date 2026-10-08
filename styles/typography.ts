import { css } from '@emotion/react';

// Figma 텍스트 스타일(Display 2xl ~ Text xs × Regular/Medium/SemiBold/Bold) 그대로.
const sizes = {
  'display-2xl': [72, 90, '-0.02em'],
  'display-xl': [60, 72, '-0.02em'],
  'display-lg': [48, 60, '-0.02em'],
  'display-md': [36, 44, '0'],
  'display-sm': [30, 38, '0'],
  'display-xs': [24, 32, '0'],
  'text-xl': [20, 30, '0'],
  'text-lg': [18, 28, '0'],
  'text-md': [16, 24, '0'],
  'text-sm': [14, 20, '0'],
  'text-xs': [12, 18, '0'],
} as const;

const weights = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const;

export type TextSize = keyof typeof sizes;
export type TextWeight = keyof typeof weights;

export const text = (size: TextSize, weight: TextWeight = 'regular') => {
  const [fontSize, lineHeight, letterSpacing] = sizes[size];
  return css`
    font-size: ${fontSize}px;
    line-height: ${lineHeight}px;
    letter-spacing: ${letterSpacing};
    font-weight: ${weights[weight]};
  `;
};
