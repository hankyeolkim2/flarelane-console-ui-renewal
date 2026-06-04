import { Sidebar } from "./sidebar";

/**
 * 모든 페이지가 공유하는 셸: 좌측 고정 사이드바 + 메인 영역.
 * 메인 영역은 gray-50 배경, 페이지 콘텐츠는 카드 단위로 구성.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      {/* scrollbar-gutter: stable — 스크롤바 유무와 무관하게 거터를 항상 예약해
          콘텐츠 폭이 변하지 않게(좌우 밀림 방지) */}
      <main className="bg-page flex-1 overflow-y-auto [scrollbar-gutter:stable]">
        <div className="mx-auto max-w-[1200px] px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
