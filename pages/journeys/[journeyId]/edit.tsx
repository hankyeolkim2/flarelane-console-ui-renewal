import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Builder from '@/components/journeys/builder/Builder';
import { journeys } from '@/lib/journeys';

// 여정 수정 — 못 찾으면 목록으로
export default function EditJourneyPage() {
  const router = useRouter();
  const j = journeys.find((x) => x.id === router.query.journeyId);
  useEffect(() => {
    if (router.isReady && !j) router.push('/journeys');
  }, [router, j]);
  if (!router.isReady || !j) return null;
  return <Builder key={j.id} journey={j} />;
}
