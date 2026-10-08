import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { ConfirmModal, Dialog } from '@/components/ui/Modal';
import DataTable from '@/components/channel/DataTable';
import { deleteRecurring, fmtDate, fmtTime, gmt, nextDates, setRecurringStatus, type Recurring } from '@/lib/recurring';
import { useStore } from '@/lib/store';

// 반복 발송 공용 모달 — docs/staging-behavior-scheduled-recurring.md 4.5 · 4.7. 상태 변경 성공 토스트 없음, 삭제만 토스트.
export type RecurringAction = 'pause' | 'active' | 'archive' | 'delete' | 'dates';

const pad = (n: number) => String(n).padStart(2, '0');

function ActivateModal({ r, onClose, onDone }: { r: Recurring; onClose: () => void; onDone: () => void }) {
  const [date, setDate] = useState<Date | null | undefined>(undefined);
  useEffect(() => {
    const t = setTimeout(() => {
      const d = nextDates(r.config, 1)[0];
      if (!d) {
        onClose();
        window.alert('종료시간을 확인해주세요.');
        return;
      }
      setDate(d);
    }, 400);
    return () => clearTimeout(t);
  }, [r, onClose]);
  return (
    <ConfirmModal
      title="반복 발송 메시지를 활성화하시겠습니까?"
      description="활성화 이후에는 변경이 불가능합니다."
      cancelLabel="취소"
      confirmLabel="확인"
      onClose={onClose}
      onConfirm={() => {
        setRecurringStatus(r.id, 'active');
        onDone();
      }}
    >
      <p style={{ margin: '12px 0 0', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
        발송 예정일:{' '}
        {date === undefined ? (
          <Icon name="progress_activity" size={16} />
        ) : date ? (
          `${fmtDate(date)} ${fmtTime(date)}:00 (${r.config.timeZone})`
        ) : (
          '-'
        )}
      </p>
    </ConfirmModal>
  );
}

export function DatesModal({ r, onClose }: { r: Recurring; onClose: () => void }) {
  const [rows, setRows] = useState<Date[] | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setRows(nextDates(r.config, 5)), 400);
    return () => clearTimeout(t);
  }, [r]);
  return (
    <Dialog title="발송 예정일" width={600} onClose={onClose}>
      {!rows ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24, color: 'var(--fg-quaternary)' }}>
          <Icon name="progress_activity" size={24} />
        </div>
      ) : (
        <DataTable
          columns={[
            { label: '순서', width: '80px' },
            { label: '날짜', width: '160px' },
            { label: '시간', width: 'minmax(0,1fr)' },
          ]}
          rows={rows.map((d, i) => ({ key: String(i), cells: [String(i + 1), fmtDate(d), `${pad(d.getHours())}:${pad(d.getMinutes())} ${gmt(r.config.timeZone)}`] }))}
          empty={<p style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>데이터가 없습니다</p>}
        />
      )}
    </Dialog>
  );
}

export default function RecurringActionModal({ r, action, onClose, onDeleted }: { r: Recurring; action: RecurringAction; onClose: () => void; onDeleted?: () => void }) {
  const { toast } = useStore();
  if (action === 'active') return <ActivateModal r={r} onClose={onClose} onDone={onClose} />;
  if (action === 'dates') return <DatesModal r={r} onClose={onClose} />;
  if (action === 'pause')
    return (
      <ConfirmModal
        title="정말 일시중지하시겠습니까?"
        cancelLabel="취소"
        confirmLabel="확인"
        onClose={onClose}
        onConfirm={() => {
          setRecurringStatus(r.id, 'pause');
          onClose();
        }}
      />
    );
  if (action === 'archive')
    return (
      <ConfirmModal
        title="정말 아카이브하시겠습니까?"
        description="해당 자동화가 아카이브 상태로 보관되며, 언제든 아카이브 상태를 되돌릴 수 있습니다."
        cancelLabel="취소"
        confirmLabel="확인"
        onClose={onClose}
        onConfirm={() => {
          setRecurringStatus(r.id, 'archive');
          onClose();
        }}
      />
    );
  return (
    <ConfirmModal
      title="반복 발송 메시지를 삭제하시겠습니까?"
      description="현재 활성화 상태인 경우, 비활성화 상태로 전환이 필요합니다."
      cancelLabel="취소"
      confirmLabel="확인"
      destructive
      onClose={onClose}
      onConfirm={() => {
        onClose();
        toast('반복 발송 메시지가 삭제되었습니다.');
        if (onDeleted) onDeleted();
        else deleteRecurring(r.id);
      }}
    />
  );
}
