import { useEffect, useReducer, useState } from 'react';
import { useRouter } from 'next/router';
import Icon from '@/components/Icon';
import Badge, { type BadgeColor } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import TextField from '@/components/ui/TextField';
import { Help } from '@/components/channel/ChannelShell';
import { EmptyList, ListCard, PageTitle, SentRow } from '@/components/sent/SentList';
import { HELP, HelpHtml } from '@/components/newmsg/parts';
import { fmt, pct, won, type Platform } from '@/lib/sent';
import { emitTemplates, pushTemplates, subscribeTemplates, type PushTemplate } from '@/lib/templates';

// 푸시 템플릿 목록 — docs 8.1. 검색은 300ms 뒤 ?sk= 갱신(Enter 즉시), 페이지는 URL 아닌 내부 상태. ⋯ 상세 정보 · 수정 · 삭제(모달, 토스트 없음).
export const PLATFORM_ICON: [Platform, string][] = [
  ['webMobile', 'smartphone'],
  ['webDesktop', 'desktop_windows'],
  ['android', 'android'],
  ['ios', 'apple'],
];
export const Platforms = ({ list }: { list: Platform[] }) => (
  <span style={{ display: 'flex', gap: 4, color: 'var(--fg-quaternary)' }}>
    {PLATFORM_ICON.filter(([p]) => (list.length ? list : PLATFORM_ICON.map((x) => x[0])).includes(p)).map(([p, n]) => (
      <Icon key={p} name={n} size={20} />
    ))}
  </span>
);

export function useTemplates() {
  const [, force] = useReducer((n: number) => n + 1, 0);
  useEffect(() => subscribeTemplates(force), []);
}

export default function PushTemplateList() {
  const router = useRouter();
  useTemplates();
  const sk = (router.query.sk as string) ?? '';
  const [input, setInput] = useState(sk);
  const [page, setPage] = useState(1);
  const [del, setDel] = useState<PushTemplate | null>(null);
  useEffect(() => {
    if (input === sk) return;
    const t = setTimeout(() => {
      router.replace({ pathname: router.pathname, query: input ? { sk: input } : {} }, undefined, { shallow: true });
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [input, sk, router]);
  const k = sk.trim().toLowerCase();
  const list = pushTemplates.filter((t) => !k || t.name.toLowerCase().includes(k) || t.id.includes(k));
  const rows = list.slice((page - 1) * 10, page * 10);
  return (
    <>
      <PageTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>템플릿</h1>
            <Help>
              <HelpHtml html={HELP.template} />
            </Help>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-tertiary)' }}>통계는 최근 30일 기준이며, 템플릿별로 더욱 상세한 통계 확인이 가능합니다.</p>
        </div>
        <i />
        <Button hierarchy="primary" iconLeading="add" onClick={() => router.push('/push/templates/new')}>
          새 템플릿
        </Button>
      </PageTitle>
      <div style={{ width: 420 }}>
        <TextField
          icon="search"
          placeholder="템플릿명, ID 검색"
          maxLength={100}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyUp={(e) => {
            if (e.key !== 'Enter') return;
            router.replace({ pathname: router.pathname, query: input ? { sk: input } : {} }, undefined, { shallow: true });
            setPage(1);
          }}
        />
      </div>
      <ListCard>
        {rows.length === 0 ? (
          <EmptyList />
        ) : (
          rows.map((t) => (
            <SentRow
              key={t.id}
              source="console"
              lead={t.category ? <Badge color={t.category.color as BadgeColor}>{t.category.name}</Badge> : <Badge>미분류</Badge>}
              topBadge={<Platforms list={t.targetPlatforms} />}
              content={{ title: t.name, sub: t.title, body: t.body, url: t.url, image: !!t.imageUrl }}
              cols={[
                [160, [{ label: '최근 수정 시간', value: t.updatedAt.slice(0, 16) }, { label: 'ID', value: t.id }]],
                [112, [{ label: '발송', value: fmt(t.sent) }, { label: '전환', value: `${fmt(t.converted)} (${pct(t.converted, t.clicked)})` }]],
                [112, [{ label: '클릭', value: `${fmt(t.clicked)} (${pct(t.clicked, t.sent)})` }, { label: '구매 총액', value: won(t.amount) }]],
              ]}
              href={`/push/templates/${t.id}`}
              menu={[
                { label: '상세 정보', icon: 'info', onClick: () => router.push(`/push/templates/${t.id}`) },
                { label: '수정', icon: 'edit', onClick: () => router.push(`/push/templates/${t.id}/edit`) },
                { label: '삭제', icon: 'delete', destructive: true, onClick: () => setDel(t) },
              ]}
            />
          ))
        )}
        {list.length > 0 && <Pagination page={page} pages={Math.ceil(list.length / 10)} onChange={setPage} />}
      </ListCard>
      {del && (
        <ConfirmModal
          destructive
          title="템플릿을 삭제하시겠습니까?"
          description="삭제된 템플릿은 복구할 수 없습니다."
          cancelLabel="취소"
          confirmLabel="삭제"
          onClose={() => setDel(null)}
          onConfirm={() => {
            pushTemplates.splice(pushTemplates.indexOf(del), 1);
            emitTemplates();
            setDel(null);
          }}
        />
      )}
    </>
  );
}
