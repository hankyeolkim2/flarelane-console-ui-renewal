import { Question } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/**
 * <StepCard> — 번호 매긴 단계 폼 카드.
 * 흰 카드(보더 gray-200, 8px) 헤더에 "1. 제목" 형식의 번호 포함 제목(+도움말)을 두고
 * 본문을 담는다. 채널별 "새 메시지"(푸시/카카오/문자/이메일) 폼이 공유하는 패턴.
 */
export function StepCard({
  n,
  title,
  hint,
  headerRight,
  children,
  className,
}: {
  n: number;
  title: string;
  hint?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "bg-surface border-border rounded-lg border p-6",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-title text-base font-semibold">
            {n}. {title}
          </h2>
          {hint && (
            <span title={hint} className="inline-flex cursor-help">
              <Question className="size-3.5 text-gray-400" weight="bold" />
            </span>
          )}
        </div>
        {headerRight}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
