import styled from '@emotion/styled';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma `Slider`(1234:85444) 손잡이 하나짜리 + 오른쪽 값 칩 — 트랙 8 bg-quaternary · 진행 fg-brand-primary · 손잡이 24(bg-primary · border-brand 2 · shadow-md).
// 비활성(읽기 모드) = 진행·손잡이 회색.
const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

const Range = styled.input<{ $pct: number }>`
  flex: 1;
  min-width: 0;
  height: 24px;
  margin: 0;
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  --fill: ${color('fg-brand-primary')};
  --knob: ${color('border-brand')};
  &:disabled { cursor: default; --fill: ${color('fg-quaternary')}; --knob: ${color('border-primary')}; }
  &::-webkit-slider-runnable-track {
    height: 8px;
    border-radius: ${radius.full}px;
    background: linear-gradient(to right, var(--fill) 0 ${(p) => p.$pct}%, ${color('bg-quaternary')} ${(p) => p.$pct}% 100%);
  }
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 24px;
    height: 24px;
    margin-top: -8px;
    border: 2px solid var(--knob);
    border-radius: 50%;
    background: ${color('bg-primary')};
    box-shadow: ${shadow.md};
  }
  &::-moz-range-track { height: 8px; border-radius: ${radius.full}px; background: ${color('bg-quaternary')}; }
  &::-moz-range-progress { height: 8px; border-radius: ${radius.full}px; background: var(--fill); }
  &::-moz-range-thumb { width: 20px; height: 20px; border: 2px solid var(--knob); border-radius: 50%; background: ${color('bg-primary')}; box-shadow: ${shadow.md}; }
  &:focus-visible { outline: none; }
  &:focus-visible::-webkit-slider-thumb { box-shadow: ${shadow['focus-ring']}; }
`;

const Chip = styled.span`
  flex-shrink: 0;
  min-width: 36px;
  padding: 4px 10px;
  border: 1px solid ${color('border-primary')};
  border-radius: 6px;
  background: ${color('bg-primary')};
  ${text('text-sm', 'medium')};
  color: ${color('text-primary')};
  text-align: center;
  font-variant-numeric: tabular-nums;
`;

export default function Slider({ value, min, max, step = 1, unit, disabled, onChange, label }: { value: number; min: number; max: number; step?: number; unit: string; disabled?: boolean; onChange: (v: number) => void; label: string }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <Row>
      <Range type="range" aria-label={label} min={min} max={max} step={step} value={value} disabled={disabled} $pct={pct} onChange={(e) => onChange(Number(e.target.value))} />
      <Chip>
        {step < 1 ? Number(value.toFixed(1)) : value}
        {unit}
      </Chip>
    </Row>
  );
}
