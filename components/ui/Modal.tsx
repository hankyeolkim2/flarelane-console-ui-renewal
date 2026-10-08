import { useEffect, type ReactNode } from 'react';
import styled from '@emotion/styled';
import Button from './Button';
import { color, radius, shadow } from '@/styles/tokens';
import { gradientBorder, primaryShadow } from '@/styles/effects';
import { text } from '@/styles/typography';

// Figma 확인 모달(400) — Header 제목 · Body 설명 · Footer 오른쪽 정렬 버튼 2개.
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(3, 7, 18, 0.7);
`;

const Box = styled.div<{ width: number }>`
  width: ${(p) => p.width}px;
  max-width: calc(100vw - 32px);
  background: ${color('bg-primary')};
  border-radius: ${radius['2xl']}px;
  box-shadow: ${shadow.xl};
`;

const Head = styled.div`
  padding: 20px 24px 12px;
  ${text('text-lg', 'semibold')};
  color: ${color('text-primary')};
`;

const Body = styled.div`
  padding: 4px 24px 24px;
  ${text('text-sm', 'regular')};
  color: ${color('text-tertiary')};
`;

const Foot = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 15px 24px 20px;
  border-top: 1px solid ${color('border-secondary')};
`;

export function ConfirmModal({ title, description, confirmLabel, cancelLabel, destructive, onConfirm, onClose, children }: { title: string; description?: string; confirmLabel: string; cancelLabel: string; destructive?: boolean; onConfirm: () => void; onClose: () => void; children?: ReactNode }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [onClose]);
  return (
    <Overlay onMouseDown={onClose}>
      <Box width={400} role="dialog" aria-modal onMouseDown={(e) => e.stopPropagation()}>
        <Head>{title}</Head>
        {(description || children) && <Body>{description}{children}</Body>}
        <Foot>
          <Button size="md" onClick={onClose}>{cancelLabel}</Button>
          <DestructivePrimary destructive={!!destructive} onClick={onConfirm}>{confirmLabel}</DestructivePrimary>
        </Foot>
      </Box>
    </Overlay>
  );
}

const DestructivePrimary = styled.button<{ destructive: boolean }>`
  height: 40px;
  padding: 0 14px;
  border: 0;
  border-radius: 8px;
  ${text('text-sm', 'semibold')};
  color: ${color('text-white')};
  background: ${(p) => (p.destructive ? color('bg-error-solid') : color('bg-brand-solid'))};
  box-shadow: ${primaryShadow};
  ${gradientBorder}
  cursor: pointer;
  transition: background-color 0.1s linear;
  &:hover { background: ${(p) => (p.destructive ? color('bg-error-solid_hover') : color('bg-brand-solid_hover'))}; }
`;
