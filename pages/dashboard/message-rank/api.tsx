import { useState } from 'react';
import { DashboardHeader, defaultRange, RankCard } from '@/components/dashboard/Dashboard';

// 가장 클릭률 높은 메시지(API) 전체 보기 — 같은 머리 + 순위 카드 1개(per 20), 「더 보기」 · 뒤로가기 없음(docs 1-6)
export default function MessageRankApi() {
  const [range, setRange] = useState(defaultRange);
  return (
    <>
      <DashboardHeader range={range} onRange={setRange} />
      <RankCard title="가장 클릭률 높은 메시지 (API)" api full />
    </>
  );
}
