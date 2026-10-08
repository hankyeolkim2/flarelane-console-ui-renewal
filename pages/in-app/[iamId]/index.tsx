import { useEffect } from 'react';
import { useRouter } from 'next/router';
import InAppEditor from '@/components/inapp/InAppEditor';
import { inApps } from '@/lib/inapp';

export default function InAppDetail() {
  const router = useRouter();
  const m = inApps.find((x) => x.id === router.query.iamId);
  useEffect(() => {
    if (router.isReady && !m) router.replace('/in-app');
  }, [router, m]);
  if (!router.isReady || !m) return null;
  return <InAppEditor key={m.id} mode="detail" initial={m} />;
}
