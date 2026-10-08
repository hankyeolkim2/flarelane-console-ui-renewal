import Link from 'next/link';
import { useRouter } from 'next/router';
import { pushWithTransition } from '@/lib/viewTransition';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { color } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma `Breadcrumbs` (Type=Text, Divider=Chevron) — 글자 text-quaternary, 호버 text-tertiary_hover, 구분 chevron_right 16.
const Wrap = styled.nav`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  > span { display: inline-flex; color: ${color('fg-quaternary')}; flex-shrink: 0; }
`;

const Crumb = styled(Link)`
  ${text('text-sm', 'semibold')};
  color: ${color('text-quaternary')};
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
  transition: color 0.1s linear;
  &:hover { color: ${color('text-tertiary_hover')}; }
`;

const Last = styled.span`
  ${text('text-sm', 'semibold')};
  color: ${color('text-quaternary')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
`;

export default function Breadcrumbs({ items }: { items: { label: string; href?: string; transition?: boolean }[] }) {
  const router = useRouter();
  return (
    <Wrap aria-label="경로">
      {items.map((it, i) => (
        <span key={i} style={{ display: 'contents' }}>
          {i > 0 && (
            <span>
              <Icon name="chevron_right" size={16} />
            </span>
          )}
          {it.href ? (
            <Crumb
              href={it.href}
              onClick={(e) => {
                if (!it.transition) return;
                e.preventDefault();
                pushWithTransition(router, it.href!);
              }}
            >
              {it.label}
            </Crumb>
          ) : (
            <Last>{it.label}</Last>
          )}
        </span>
      ))}
    </Wrap>
  );
}
