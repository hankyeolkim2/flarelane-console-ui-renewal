import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/**
 * <MetricCard> — 아이콘 + 라벨 + 큰 숫자.
 * 대시보드의 기기/구독 현황 같은 지표 표시에 사용.
 */
export function MetricCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon?: Icon;
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border bg-surface flex items-center gap-3 rounded-lg border px-4 py-3",
        className,
      )}
    >
      {Icon && (
        <span className="bg-brand-subtle text-brand flex size-9 shrink-0 items-center justify-center rounded-md">
          <Icon className="size-4.5" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-muted-foreground truncate text-xs">{label}</p>
        <p className="text-title text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}
