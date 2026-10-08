import { useEffect } from 'react';
import { useRouter } from 'next/router';
import InAppEditor from '@/components/inapp/InAppEditor';
import { TEMPLATES, type InApp } from '@/lib/inapp';

// 새 인앱 메시지 — templateId 없음/못 찾음 → /in-app, html → 빈 HTML 스켈레톤(HTML 모드)
const SKELETON = '<!doctype html>\n<html>\n<body>\n  <div data-flarelane-type="background" data-flarelane-action="FlareLaneIAM.close(0)"></div>\n</body>\n</html>';

export default function NewInApp() {
  const router = useRouter();
  const tid = router.query.templateId as string | undefined;
  const t = TEMPLATES.find((x) => x.id === tid);
  const ok = tid === 'html' || !!t;
  useEffect(() => {
    if (router.isReady && !ok) router.replace('/in-app');
  }, [router, ok]);
  if (!router.isReady || !ok) return null;
  const initial: InApp = {
    id: `iam-${Date.now().toString(36)}`,
    title: '',
    group: '',
    status: 'paused',
    displayStatus: 'paused',
    priority: 1,
    createdAt: '2026.10.08',
    conditions: null,
    target: 'all',
    conversion: false,
    model: tid === 'html' ? { displayType: 'HTML', html: SKELETON, bg: '', bgActions: [], slides: [], buttons: [], carousel: { auto: false, speed: 5 }, container: [] } : JSON.parse(JSON.stringify(t!.model)),
    stats: { displayed: 0, clicked: 0, clickedUsers: 0, converted: 0, convertedUsers: 0, amount: 0, platform: { android: { displayed: 0, clicked: 0 }, ios: { displayed: 0, clicked: 0 }, webDesktop: { displayed: 0, clicked: 0 }, webMobile: { displayed: 0, clicked: 0 } } },
  };
  return <InAppEditor key={tid} mode="new" initial={initial} />;
}
