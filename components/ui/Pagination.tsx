import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { color, radius } from '@/styles/tokens';
import { secondaryShadow } from '@/styles/effects';
import { text } from '@/styles/typography';

// Figma `Pagination` (Card minimal · 가운데 정렬) — 이전/다음 아이콘 버튼 36 + 숫자 36(현재 = bg-primary_hover · text-secondary).
// 스테이징 규칙: 번호는 5개 묶음(1~5, 6~10 …), 처음/끝 버튼 없음.
const Wrap = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const Nums = styled.div`
  display: flex;
  gap: 2px;
`;

const Num = styled.button<{ $on: boolean }>`
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: ${radius.md}px;
  background: ${(p) => (p.$on ? color('bg-primary_hover') : 'transparent')};
  ${(p) => (p.$on ? text('text-sm', 'semibold') : text('text-sm', 'medium'))};
  color: ${(p) => (p.$on ? color('text-secondary') : color('text-tertiary'))};
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  &:hover { background: ${color('bg-primary_hover')}; color: ${color('text-secondary')}; }
`;

const Arrow = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.md}px;
  background: ${color('bg-primary')};
  box-shadow: ${secondaryShadow};
  color: ${color('fg-quaternary')};
  cursor: pointer;
  &:hover:not(:disabled) { background: ${color('bg-primary_hover')}; color: ${color('fg-quaternary_hover')}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export default function Pagination({ page, pages, onChange, group = 5 }: { page: number; pages: number; onChange: (p: number) => void; group?: number }) {
  if (pages <= 1) return null;
  const start = Math.floor((page - 1) / group) * group + 1;
  const nums = Array.from({ length: Math.min(group, pages - start + 1) }, (_, i) => start + i);
  return (
    <Wrap aria-label="페이지">
      <Arrow type="button" aria-label="이전" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <Icon name="chevron_left" size={20} />
      </Arrow>
      <Nums>
        {nums.map((n) => (
          <Num key={n} type="button" $on={n === page} aria-current={n === page ? 'page' : undefined} onClick={() => n !== page && onChange(n)}>
            {n}
          </Num>
        ))}
      </Nums>
      <Arrow type="button" aria-label="다음" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        <Icon name="chevron_right" size={20} />
      </Arrow>
    </Wrap>
  );
}
