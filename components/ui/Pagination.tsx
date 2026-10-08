import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma `Pagination`(웹훅 상세 1324:5650) — 위 테두리 · pt12 pb16 px24, 양끝 Tertiary 「이전」(arrow_back) · 「다음」(arrow_forward),
// 가운데 숫자 36(현재 = bg-primary_hover · text-secondary, 나머지 text-quaternary, 모두 sm Medium).
// 스테이징 규칙: 번호는 5개 묶음(1~5, 6~10 …), 처음/끝 버튼 없음.
const Wrap = styled.nav<{ $bordered: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: ${(p) => (p.$bordered ? '11px 24px 16px' : '0')};
  border-top: ${(p) => (p.$bordered ? `1px solid ${color('border-secondary')}` : '0')};
  > div:first-of-type, > div:last-of-type { flex: 1; display: flex; }
  > div:last-of-type { justify-content: flex-end; }
`;

const Nums = styled.span`
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
  ${text('text-sm', 'medium')};
  color: ${(p) => (p.$on ? color('text-secondary') : color('text-quaternary'))};
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background-color 0.1s linear;
  &:hover { background: ${color('bg-primary_hover')}; }
`;

const Arrow = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 36px;
  padding: 0 12px;
  border: 0;
  border-radius: ${radius.md}px;
  background: transparent;
  ${text('text-sm', 'semibold')};
  color: ${color('text-tertiary')};
  cursor: pointer;
  transition: background-color 0.1s linear;
  > span { color: ${color('fg-quaternary')}; }
  > i { padding: 0 2px; font-style: normal; }
  &:hover:not(:disabled) { background: ${color('bg-primary_hover')}; color: ${color('text-tertiary_hover')}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export default function Pagination({ page, pages, onChange, group = 5, bordered = true }: { page: number; pages: number; onChange: (p: number) => void; group?: number; bordered?: boolean }) {
  if (pages <= 1) return null;
  const start = Math.floor((page - 1) / group) * group + 1;
  const nums = Array.from({ length: Math.min(group, pages - start + 1) }, (_, i) => start + i);
  return (
    <Wrap aria-label="페이지" $bordered={bordered}>
      <div>
        <Arrow type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <Icon name="arrow_back" size={20} />
          <i>이전</i>
        </Arrow>
      </div>
      <Nums>
        {nums.map((n) => (
          <Num key={n} type="button" $on={n === page} aria-current={n === page ? 'page' : undefined} onClick={() => n !== page && onChange(n)}>
            {n}
          </Num>
        ))}
      </Nums>
      <div>
        <Arrow type="button" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          <i>다음</i>
          <Icon name="arrow_forward" size={20} />
        </Arrow>
      </div>
    </Wrap>
  );
}
