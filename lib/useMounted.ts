import { useEffect, useState } from 'react';

// 정적 주소(쿼리 없음)는 클라이언트 첫 렌더에서 router.isReady 가 이미 true 라 서버 HTML 과 달라짐 → 마운트 뒤에만 그림.
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
