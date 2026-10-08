import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

// 스테이징 웹훅 새로 만들기 · 수정: 변경 여부와 상관없이 다른 페이지 이동 · 새로고침 · 탭 닫기 때 확인창. 저장 · 취소 버튼은 allow() 뒤 이동.
const MSG = '변경사항이 저장되지 않았습니다. 페이지를 벗어나시겠습니까?';

export function useLeaveGuard() {
  const router = useRouter();
  const allowed = useRef(false);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (allowed.current) return;
      e.preventDefault();
      e.returnValue = MSG;
    };
    const route = (url: string) => {
      if (allowed.current || url === router.asPath) return;
      if (!window.confirm(MSG)) {
        router.events.emit('routeChangeError');
        // Next 권장 방식: 예외로 이동 중단
        throw 'route change aborted';
      }
      allowed.current = true;
    };
    window.addEventListener('beforeunload', before);
    router.events.on('routeChangeStart', route);
    return () => {
      window.removeEventListener('beforeunload', before);
      router.events.off('routeChangeStart', route);
    };
  }, [router]);
  return () => {
    allowed.current = true;
  };
}
