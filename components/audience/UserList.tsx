import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import { ConfirmModal, Dialog } from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import TextField from '@/components/ui/TextField';
import DataTable from '@/components/channel/DataTable';
import { EmptyList, PageTitle } from '@/components/sent/SentList';
import { InfoChip, Json, KVBox, sortedJson, SubTitle } from './parts';
import { users, type User } from '@/lib/audience';
import { ago } from '@/lib/time';
import { useMounted } from '@/lib/useMounted';

// 전체 유저 · 세그먼트 유저 — Figma 「전체 유저」(1106:8346) · 상세 모달(1107:8878) + docs/staging-behavior-users-devices.md 2장.
// 쿼리 p · sk(값 검증 없음), 페이지당 20. 검색은 「검색」 버튼만(Enter 없음), 유저 ID 정확 일치. 행 클릭 = 상세 모달.
const PER = 20;
const hidden = new Set<string>();

function UserDetail({ u, onClose, onDeleted }: { u: User; onClose: () => void; onDeleted: () => void }) {
  const [ask, setAsk] = useState(false);
  const ts = (s?: string) => (s ? `${s} (${ago(s)})` : '-');
  return (
    <>
      <Dialog
        title="상세 정보"
        width={560}
        onClose={onClose}
        footer={
          <div style={{ marginRight: 'auto' }}>
            <Button hierarchy="destructive-secondary" size="md" iconLeading="delete" onClick={() => setAsk(true)}>
              삭제
            </Button>
          </div>
        }
      >
        <SubTitle>기본 정보</SubTitle>
        <KVBox
          rows={[
            ['유저 ID', u.userId],
            ['국가/언어', `${u.country || '-'} / ${u.language || '-'}`],
            ['이름', u.name || '-'],
            ['전화번호', u.phoneNumber || '-'],
            ['이메일', u.email || '-'],
            ['생일/시간대', `${u.dob || '-'} / ${u.timeZone || '-'}`],
          ]}
        />
        <SubTitle>상태 및 활동</SubTitle>
        <KVBox
          rows={[
            ['문자 수신 거부', u.smsUnsubscribedAt ? ago(u.smsUnsubscribedAt) : '-'],
            ['생성 시간', ts(u.createdAt)],
            ['최근 수정 시간', ts(u.updatedAt)],
            ['마지막 접속 시간', u.lastDeviceActivatedAt ? ago(u.lastDeviceActivatedAt) : '-'],
          ]}
        />
        <SubTitle>태그</SubTitle>
        <Json style={{ maxHeight: 300 }}>{sortedJson(u.tags)}</Json>
      </Dialog>
      {ask && (
        <ConfirmModal
          title="유저를 삭제하시겠습니까?"
          description="삭제한 이후 해당 정보는 복구할 수 없습니다."
          cancelLabel="취소"
          confirmLabel="삭제"
          destructive
          onClose={() => setAsk(false)}
          onConfirm={() => {
            setAsk(false);
            // 스테이징: 1초 뒤 목록에서 숨기고 다시 불러옴, 토스트 없음
            setTimeout(() => {
              hidden.add(u.userId);
              onDeleted();
            }, 1000);
          }}
        />
      )}
    </>
  );
}

export default function UserList({ title = '전체 유저', pool = users }: { title?: string; pool?: User[] }) {
  const router = useRouter();
  const mounted = useMounted();
  const page = Math.max(1, Number(router.query.p) || 1);
  const sk = typeof router.query.sk === 'string' ? router.query.sk : '';
  const [input, setInput] = useState(sk);
  const [open, setOpen] = useState<User | null>(null);
  const [tags, setTags] = useState<User | null>(null);
  const [, setTick] = useState(0);
  useEffect(() => setInput(sk), [sk]);
  if (!mounted) return null;
  const list = pool.filter((u) => !hidden.has(u.userId) && (!sk || u.userId === sk));
  const rows = list.slice((page - 1) * PER, page * PER);
  const push = (q: Record<string, string | number>) => router.push({ pathname: router.pathname, query: { ...router.query, ...q } });
  return (
    <>
      <PageTitle>
        <h1>{title}</h1>
      </PageTitle>
      <div style={{ display: 'flex', gap: 8 }}>
        <TextField
          icon="search"
          placeholder="유저 ID"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          trailing={
            sk ? (
              <button type="button" aria-label="지우기" style={{ display: 'inline-flex', padding: 0, border: 0, background: 'none', color: 'var(--fg-quaternary)', cursor: 'pointer' }} onClick={() => push({ p: 1, sk: '' })}>
                ×
              </button>
            ) : undefined
          }
        />
        <Button onClick={() => push({ p: 1, sk: input })}>검색</Button>
      </div>
      <DataTable
        card
        columns={[
          { label: '유저 ID', width: '260px' },
          { label: '이름', width: '160px' },
          { label: '전화번호', width: '160px' },
          { label: '마지막 접속 시간', width: '180px' },
          { label: '태그', width: '96px' },
          { label: '', width: 'minmax(0,1fr)', align: 'right' },
        ]}
        rows={rows.map((u) => ({
          key: u.userId,
          onClick: () => setOpen(u),
          cells: [
            u.userId,
            u.name || '-',
            u.phoneNumber || '-',
            u.lastDeviceActivatedAt ? ago(u.lastDeviceActivatedAt) : '-',
            <InfoChip key="t" label="태그" tip={<pre style={{ margin: 0, font: 'inherit', whiteSpace: 'pre-wrap' }}>{sortedJson(u.tags)}</pre>} onClick={() => setTags(u)} />,
            <Button key="d" hierarchy="tertiary" onClick={(e) => { e.stopPropagation(); setOpen(u); }}>
              상세 정보
            </Button>,
          ],
        }))}
        empty={<EmptyList />}
        footer={list.length > 0 && <Pagination page={page} pages={Math.min(500, Math.ceil(list.length / PER))} onChange={(n) => push({ p: n })} />}
      />
      {open && <UserDetail u={open} onClose={() => setOpen(null)} onDeleted={() => { setOpen(null); setTick((n) => n + 1); }} />}
      {tags && (
        <Dialog title="태그" onClose={() => setTags(null)}>
          <Json style={{ height: 500 }}>{sortedJson(tags.tags)}</Json>
        </Dialog>
      )}
    </>
  );
}
