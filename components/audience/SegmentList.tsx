import { useEffect, useReducer, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Floating from '@/components/ui/Floating';
import { MenuItem } from '@/components/ui/Menu';
import { ConfirmModal } from '@/components/ui/Modal';
import { Help } from '@/components/channel/ChannelShell';
import { EmptyList, PageTitle } from '@/components/sent/SentList';
import { InfoChip } from './parts';
import { describe, emitAudience, segments, subscribeAudience, type Condition, type Segment } from '@/lib/audience';
import { abbrNum } from '@/lib/sent';
import { useStore } from '@/lib/store';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 세그먼트 목록(유저 · 기기) — Figma 「세그먼트」(1108:9976 · 1108:11714) + docs/staging-behavior-users-devices.md 5장.
// 검색 · 페이지 없음, 기본 세그먼트 먼저 + 나머지 이름순. 인원 수는 행이 보이면 0.5~2초 뒤 불러옴. 행 클릭 = 상세.
const Card = styled.div`
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  box-shadow: ${shadow.xs};
  overflow: hidden;
  > header { display: flex; justify-content: space-between; padding: 10px 76px 10px 20px; background: ${color('bg-secondary')}; border-bottom: 1px solid ${color('border-secondary')}; ${text('text-xs', 'semibold')}; color: ${color('text-quaternary')}; }
`;

const Row = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 20px;
  cursor: pointer;
  transition: background-color 0.1s linear;
  & + & { border-top: 1px solid ${color('border-secondary')}; }
  &:hover { background: ${color('bg-secondary')}; }
  > div:first-of-type { display: flex; align-items: center; gap: 8px; min-height: 32px; }
  > div:first-of-type > b { flex: 1; min-width: 0; ${text('text-sm', 'medium')}; color: ${color('text-primary')}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  > div:first-of-type > small { display: inline-flex; align-items: center; gap: 4px; ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
  > div:first-of-type > em { min-width: 56px; text-align: right; font-style: normal; ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; font-variant-numeric: tabular-nums; }
`;

export const CondBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  border-radius: ${radius.md}px;
  background: ${color('bg-secondary')};
  ${text('text-sm', 'regular')};
  color: ${color('text-secondary')};
  div > b { font-weight: 600; color: ${color('text-primary')}; margin-right: 6px; }
  div > span[data-op] { color: ${color('text-brand-secondary')}; }
  > small { ${text('text-xs', 'regular')}; color: ${color('text-quaternary')}; }
`;

export function Conditions({ filters }: { filters: Condition[][] }) {
  return (
    <CondBox>
      {filters.map((g, gi) => (
        <div key={gi} style={{ display: 'contents' }}>
          {gi > 0 && <small style={{ fontSize: 12, lineHeight: '18px', color: 'var(--text-quaternary)' }}>또는</small>}
          {g.map((c, ci) => {
            const [label, v] = describe(c);
            const op = /^(가 존재|이 오늘|입니다|아닙니다)/.test(v);
            return (
              <div key={ci}>
                <b>{label}</b>
                <span data-op={op ? '' : undefined}>{v}</span>
              </div>
            );
          })}
        </div>
      ))}
    </CondBox>
  );
}

// 행이 화면에 들어오면 0.5~2초 뒤 인원 수(60초 캐시)
const cache = new Map<string, number>();
export function LazyCount({ s, full }: { s: Segment; full?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState<number | null>(cache.get(s.id) ?? null);
  useEffect(() => {
    if (n !== null || !ref.current) return;
    let t: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      t = setTimeout(() => {
        const v = s.count ?? 0;
        cache.set(s.id, v);
        setN(v);
      }, 500 + ((s.id.length * 211) % 1500));
    });
    io.observe(ref.current);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, [n, s]);
  return <span ref={ref}>{n === null ? <Icon name="progress_activity" size={16} /> : n ? (full ? n.toLocaleString('ko-KR') : abbrNum(n)) : '-'}</span>;
}

function RowMenu({ s, base, onDelete }: { s: Segment; base: string; onDelete: () => void }) {
  const router = useRouter();
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const isDefault = s.type === 'DEFAULT';
  const detail = `${base}/${s.id}/${s.targetType === 'User' ? 'users' : 'devices'}`;
  return (
    <span onClick={(e) => e.stopPropagation()}>
      <button ref={ref} type="button" aria-label="더 보기" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, border: 0, borderRadius: 8, background: 'transparent', color: 'var(--fg-quaternary)', cursor: 'pointer' }}>
        <Icon name="more_horiz" size={20} />
      </button>
      <Floating anchorRef={ref} open={open} onClose={() => setOpen(false)} width={160} offset={4}>
        <div style={{ padding: '4px 0' }}>
          <MenuItem label={s.targetType === 'User' ? '유저 정보' : '기기 정보'} onClick={() => router.push(detail)} />
          {!isDefault && <MenuItem label="복제" onClick={() => router.push(`${base}/new?copySegmentId=${s.id}`)} />}
          {!isDefault && <MenuItem label="수정" onClick={() => router.push(`${base}/${s.id}/edit`)} />}
          {!isDefault && (
            <MenuItem
              label="삭제"
              destructive
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            />
          )}
        </div>
      </Floating>
    </span>
  );
}

export function DeleteSegmentModal({ s, onClose, onDone }: { s: Segment; onClose: () => void; onDone: () => void }) {
  const { toast } = useStore();
  return (
    <ConfirmModal
      title="세그먼트를 삭제하시겠습니까?"
      description="삭제된 세그먼트는 복구할 수 없습니다."
      cancelLabel="취소"
      confirmLabel="삭제"
      destructive
      onClose={onClose}
      onConfirm={() => {
        const i = segments.findIndex((x) => x.id === s.id);
        if (i >= 0) segments.splice(i, 1);
        emitAudience();
        onClose();
        toast('세그먼트가 삭제되었습니다.');
        onDone();
      }}
    />
  );
}

export default function SegmentList({ target }: { target: 'User' | 'Device' }) {
  const router = useRouter();
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => subscribeAudience(rerender), []);
  const [del, setDel] = useState<Segment | null>(null);
  const base = target === 'User' ? '/user-segments' : '/segments';
  const own = segments.filter((s) => s.targetType === target);
  const list = [...own.filter((s) => s.type === 'DEFAULT'), ...own.filter((s) => s.type !== 'DEFAULT').sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))];
  return (
    <>
      <PageTitle>
        <h1>세그먼트</h1>
        <Help>세그먼트를 사용하면 다양한 기준으로 세밀하게 대상을 분류한 메시지 발송 및 분석이 가능합니다.</Help>
        <i />
        <Button hierarchy="primary" size="md" iconLeading="add" onClick={() => router.push(`${base}/new`)}>
          새 세그먼트
        </Button>
      </PageTitle>
      <Card>
        <header>
          <span>이름</span>
          <span>{target === 'User' ? '유저 수' : '기기 수'}</span>
        </header>
        {list.length === 0 && <EmptyList />}
        {list.map((s) => (
          <Row key={s.id} role="link" onClick={() => router.push(`${base}/${s.id}/${target === 'User' ? 'users' : 'devices'}`)}>
            <div>
              {s.type === 'DEFAULT' && <Badge color="brand">기본</Badge>}
              <InfoChip label="ID" tip={s.id} />
              <b>{s.name}</b>
              {s.lastSyncedMin !== undefined && (
                <small>
                  {s.lastSyncedMin === null ? '동기화 전' : s.lastSyncedMin > 600 ? '동기화 대기중' : `${s.lastSyncedMin}분 전 동기화됨`}
                  <Help>세그먼트 내 이벤트 집계는 실시간에 가깝게 반영되지만, 최대 0 ~ 30분 이내의 지연이 발생할 수 있습니다.</Help>
                </small>
              )}
              <em>
                <LazyCount s={s} />
              </em>
              <RowMenu s={s} base={base} onDelete={() => setDel(s)} />
            </div>
            {s.type !== 'DEFAULT' && s.filters.length > 0 && <Conditions filters={s.filters} />}
          </Row>
        ))}
      </Card>
      {del && <DeleteSegmentModal s={del} onClose={() => setDel(null)} onDone={() => undefined} />}
    </>
  );
}
