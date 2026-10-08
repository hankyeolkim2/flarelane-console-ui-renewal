import styled from '@emotion/styled';

// public/icons/<name>.svg 를 마스크로 써서 currentColor 로 칠함 (Material Symbols Rounded 300 — Figma `ms` 세트에서 내려받음).
type Props = { name: string; size?: number; className?: string };

const Mask = styled.span<{ src: string; size: number }>`
  display: inline-block;
  flex-shrink: 0;
  width: ${(p) => p.size}px;
  height: ${(p) => p.size}px;
  background-color: currentColor;
  mask: url(${(p) => p.src}) center / contain no-repeat;
  -webkit-mask: url(${(p) => p.src}) center / contain no-repeat;
`;

export default function Icon({ name, size = 20, className }: Props) {
  return <Mask aria-hidden src={`/icons/${name}.svg`} size={size} className={className} />;
}
