import { cn } from "@/lib/utils";

/**
 * <SectionCard> — 데모의 핵심 공통 컴포넌트.
 * 제목 + 흰색 카드 래퍼. 헤더 우측에는 액션(내보내기 버튼 등)을 배치할 수 있다.
 */
export function SectionCard({
  title,
  actions,
  children,
  className,
  contentClassName,
  noPadding = false,
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  /** 테이블처럼 콘텐츠가 가장자리까지 차야 할 때 본문 패딩 제거 */
  noPadding?: boolean;
}) {
  return (
    <section
      className={cn(
        "bg-surface border-border rounded-lg border",
        className,
      )}
    >
      {title && (
        <header className="flex min-h-[52px] items-center justify-between gap-4 px-5 py-3.5">
          <h2 className="text-title text-sm font-semibold">{title}</h2>
          {actions && (
            <div className="flex items-center gap-2">{actions}</div>
          )}
        </header>
      )}
      <div
        className={cn(
          !noPadding && (title ? "px-5 pb-5" : "p-5"),
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
