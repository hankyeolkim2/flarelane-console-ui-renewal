import { useState, type ReactNode } from 'react';
import styled from '@emotion/styled';
import Button from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Modal';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// CSV 다운로드 사유 모달(상세의 모든 다운로드 · 푸시 목록 내보내기 공용) — 사유가 비면 「다운로드」 비활성, 진행 중 로딩.
const Area = styled.textarea`
  width: 100%;
  min-height: 96px;
  padding: 9px 13px;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.md}px;
  box-shadow: ${shadow.xs};
  ${text('text-sm', 'regular')};
  font-family: inherit;
  color: ${color('text-primary')};
  resize: vertical;
  outline: none;
  &::placeholder { color: ${color('text-placeholder')}; }
  &:focus { border-color: ${color('border-brand')}; }
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  > span { ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
`;

export function ReasonField({ title = 'CSV 다운로드', info, onClose, onDownload }: { title?: string; info?: ReactNode; onClose: () => void; onDownload: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button size="md" onClick={onClose}>취소</Button>
          <Button
            hierarchy="primary"
            size="md"
            disabled={!reason.trim() || busy}
            onClick={() => {
              setBusy(true);
              setTimeout(() => onDownload(reason), 600);
            }}
          >
            {busy ? '다운로드 중' : '다운로드'}
          </Button>
        </>
      }
    >
      {info}
      <Label>
        <span>다운로드 사유 입력</span>
        <Area autoFocus placeholder="다운로드 사유를 입력해 주세요." value={reason} onChange={(e) => setReason(e.target.value)} />
      </Label>
    </Dialog>
  );
}
