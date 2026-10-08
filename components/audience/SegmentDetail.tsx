import { useState } from 'react';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { KV } from '@/components/channel/ChannelShell';
import { Section } from '@/components/sent/Detail';
import { ReasonField } from '@/components/sent/Reason';
import DeviceList from './DeviceList';
import { Conditions, DeleteSegmentModal, LazyCount } from './SegmentList';
import UserList from './UserList';
import { devices, segments, users } from '@/lib/audience';

// 세그먼트 상세 = 상세 카드 + 아래 유저/기기 목록 (docs 6장). 기본 세그먼트면 삭제 · 수정 숨김.
export default function SegmentDetail({ target, id }: { target: 'User' | 'Device'; id: string }) {
  const router = useRouter();
  const [del, setDel] = useState(false);
  const [csv, setCsv] = useState(false);
  const s = segments.find((x) => x.id === id && x.targetType === target);
  const base = target === 'User' ? '/user-segments' : '/segments';
  if (!s) return <Section title="세그먼트 상세 정보">데이터가 없습니다</Section>;
  const isDefault = s.type === 'DEFAULT';
  const n = s.count ?? 0;
  return (
    <>
      <Section title="세그먼트 상세 정보">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
          정보
          {typeof s.lastSyncedMin === 'number' && <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-tertiary)' }}>{`2026.10.08 22:47:00 (${s.lastSyncedMin}분 전 동기화됨)`}</span>}
        </div>
        <KV
          rows={[
            ['타이틀', s.name],
            [
              'ID',
              s.id,
              target === 'User' ? '유저 수' : '기기 수',
              <span key="c" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <LazyCount s={s} full />
                {n > 0 && <IconButton icon="download" hierarchy="secondary" size="xs" label="다운로드" onClick={() => setCsv(true)} />}
              </span>,
            ],
            ['생성 시간', s.createdAt, '최근 수정 시간', s.updatedAt],
            ['필터', s.filters.length ? <div style={{ flex: 1, padding: '8px 0' }}><Conditions filters={s.filters} /></div> : '-'],
          ]}
        />
        {!isDefault && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button hierarchy="destructive-secondary" onClick={() => setDel(true)}>
              삭제
            </Button>
            <Button hierarchy="primary" onClick={() => router.push(`${base}/${s.id}/edit`)}>
              수정
            </Button>
          </div>
        )}
      </Section>
      <div style={{ height: 32 }} />
      {target === 'User' ? <UserList title="세그먼트 유저" pool={users.slice(0, Math.max(n, isDefault ? users.length : 0))} /> : <DeviceList mode="segment" title="세그먼트 기기" pool={isDefault ? devices : devices.filter((_, i) => i % 3 === 0)} />}
      {del && <DeleteSegmentModal s={s} onClose={() => setDel(false)} onDone={() => router.replace(base)} />}
      {csv && <ReasonField onClose={() => setCsv(false)} onDownload={() => setCsv(false)} />}
    </>
  );
}
