import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import TextField from '@/components/ui/TextField';
import { EmptyList, ListCard, PageTitle, SentRow, type RowContent, type Stat } from './SentList';
import { MAX_PAGES, PER, SOURCES, type Source } from '@/lib/sent';

// 알림톡 · 브랜드메시지 · 문자 · 이메일 보낸 메시지 목록 공용 — Figma 「보낸 메시지 — 브랜드메시지 · 문자 · 이메일 목록」(1095:23521).
// 머리 줄 → 검색 줄(발송 출처 Select 140 + 검색 Input + 「검색」 Secondary) → 목록 카드(맨 아래 Pagination).
// 스테이징: 쿼리 p · s · sk, 잘못되면 ?s=console&p=1 로 교체. 출처 바꾸면 검색어 버림. 같은 검색어면 검색 버튼 비활성.
export type ChannelItem = { id: string; source: Source; content: RowContent; cols: [number, Stat[]][]; search: (string | undefined)[] };

export default function ChannelSentList({ base, items }: { base: string; items: ChannelItem[] }) {
  const router = useRouter();
  const { p, s, sk } = router.query as { p?: string; s?: string; sk?: string };
  const page = Number(p);
  const source = SOURCES.find((x) => x.value === s)?.value;
  const keyword = sk ?? '';
  const [input, setInput] = useState(keyword);
  useEffect(() => setInput(keyword), [keyword]);

  const invalid = router.isReady && (!source || !Number.isInteger(page) || page < 1 || page > MAX_PAGES);
  useEffect(() => {
    if (invalid) router.replace({ pathname: router.pathname, query: { s: 'console', p: 1 } });
  }, [invalid, router]);
  if (!router.isReady || invalid) return null;

  const k = keyword.trim().toLowerCase();
  const list = items.filter((it) => it.source === source && (!k || it.search.some((f) => f?.toLowerCase().includes(k))));
  const pages = Math.ceil(Math.min(list.length, MAX_PAGES * PER) / PER);
  const rows = list.slice((page - 1) * PER, page * PER);
  const push = (q: Record<string, string | number | undefined>) => router.push({ pathname: router.pathname, query: Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined && v !== '')) });
  const search = () => {
    const t = input.trim();
    if (t === keyword) return;
    push({ p: 1, s: source, sk: t });
  };

  return (
    <>
      <PageTitle>
        <h1>보낸 메시지</h1>
      </PageTitle>
      <div style={{ display: 'flex', gap: 8 }}>
        <Select<Source> width={140} value={source!} options={SOURCES} onChange={(v) => push({ s: v, p: 1 })} />
        <TextField icon="search" placeholder="캠페인명, 제목, 내용, ID 검색" maxLength={100} value={input} onChange={(e) => setInput(e.target.value)} onKeyUp={(e) => e.key === 'Enter' && search()} />
        <Button disabled={input.trim() === keyword} onClick={search}>
          검색
        </Button>
      </div>
      <ListCard>
        {rows.length === 0 ? (
          <EmptyList />
        ) : (
          rows.map((it) => <SentRow key={it.id} source={it.source} content={it.content} cols={it.cols} href={`/${base}/sent-history/${it.id}`} copyHref={`/${base}/new-message?copyMessageId=${it.id}`} />)
        )}
        <Pagination page={page} pages={pages} onChange={(n) => push({ p: n, s: source, sk: keyword })} />
      </ListCard>
    </>
  );
}
