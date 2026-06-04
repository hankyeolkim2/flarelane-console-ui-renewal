import { Question } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/** 메인 영역 상단의 페이지 제목 + 우측 액션 영역 */
export function PageHeader({
  title,
  description,
  hint,
  actions,
  className,
}: {
  title: string;
  description?: string;
  /** 제목 옆 도움말(?) 아이콘에 표시할 툴팁 텍스트 */
  hint?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex items-start justify-between gap-4", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <h1 className="text-title text-xl font-semibold tracking-tight">
            {title}
          </h1>
          {hint && (
            <span title={hint} className="inline-flex cursor-help">
              <Question className="size-4 text-gray-400" weight="bold" />
            </span>
          )}
        </div>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
