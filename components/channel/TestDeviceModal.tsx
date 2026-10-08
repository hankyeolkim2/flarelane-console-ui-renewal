import { useState } from 'react';
import styled from '@emotion/styled';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import IconButton from '@/components/ui/IconButton';
import { Dialog } from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import DataTable from './DataTable';
import { PLATFORM_LABEL, testDevices, type TestDevice } from '@/lib/devices';
import { color } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 「테스트 기기 선택」 공용 모달 — docs/staging-behavior-channel.md 앱 푸시 · 테스트 기기 모달.
// 페이지당 20 · 번호 5개 · 빈 목록 「데이터가 없습니다」. 선택 0개에서 발송은 아무 일 없음.
const PER = 20;

const Count = styled.span`
  margin-right: auto;
  align-self: center;
  ${text('text-sm', 'medium')};
  color: ${color('text-tertiary')};
  > span { color: ${color('text-brand-secondary')}; ${text('text-sm', 'semibold')}; }
`;

const Empty = styled.div`
  padding: 40px 0;
  text-align: center;
  ${text('text-sm', 'regular')};
  color: ${color('text-tertiary')};
`;

const Scroll = styled.div`
  max-height: min(520px, calc(100vh - 280px));
  overflow-y: auto;
`;

export default function TestDeviceModal({ filter = (d) => d.platform === 'android', onClose, onSend }: { filter?: (d: TestDevice) => boolean; onClose: () => void; onSend: (ids: string[]) => void }) {
  const list = testDevices.filter(filter);
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState<string[]>([]);
  const rows = list.slice((page - 1) * PER, page * PER);
  const toggle = (id: string) => setPicked((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  return (
    <Dialog
      title="테스트 기기 선택"
      width={1000}
      onClose={onClose}
      footer={
        <>
          <Count>
            <span>{picked.length}</span>개 선택됨
          </Count>
          <Button size="md" onClick={onClose}>취소</Button>
          <Button hierarchy="primary" size="md" onClick={() => picked.length && onSend(picked)}>
            발송
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: -4 }}>
        {/* 「추가」 = 스테이징 테스트 기기 추가 모달(프로토타입 미구현) */}
        <Button>추가</Button>
        <IconButton icon="refresh" hierarchy="secondary" label="새로고침" onClick={() => setPage(1)} />
      </div>
      <Scroll>
        <DataTable
          columns={[
            { label: '', width: '52px' },
            { label: '별명', width: 'minmax(0,1.4fr)' },
            { label: '플랫폼', width: '96px' },
            { label: '생성 시간', width: '172px' },
            { label: '마지막 접속 시간', width: '172px' },
            { label: '유저 ID', width: 'minmax(0,1fr)' },
            { label: '구독', width: '80px' },
          ]}
          rows={rows.map((d) => ({
            key: d.id,
            onClick: () => toggle(d.id),
            cells: [
              <Checkbox key="c" checked={picked.includes(d.id)} />,
              d.alias,
              PLATFORM_LABEL[d.platform],
              d.createdAt,
              d.lastActiveAt,
              d.userId,
              <Badge key="s" color={d.subscribed ? 'success' : 'gray'}>{d.subscribed ? '구독' : '미구독'}</Badge>,
            ],
          }))}
          empty={<Empty>데이터가 없습니다</Empty>}
        />
      </Scroll>
      <Pagination page={page} pages={Math.ceil(list.length / PER)} onChange={setPage} />
    </Dialog>
  );
}
