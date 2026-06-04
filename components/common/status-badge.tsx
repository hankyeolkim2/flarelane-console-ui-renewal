import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "neutral" | "brand";

const TONE: Record<Tone, string> = {
  success: "bg-success-bg text-success-fg",
  warning: "bg-warning-bg text-warning-fg",
  danger: "bg-danger-bg text-danger-fg",
  neutral: "bg-muted text-gray-600",
  brand: "bg-brand-subtle text-brand",
};

/**
 * <StatusBadge> — 구독/미구독, 활성화 등 상태 배지.
 * dot 옵션으로 좌측 상태 점을 표시한다.
 */
export function StatusBadge({
  tone = "neutral",
  dot = false,
  children,
  className,
}: {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        TONE[tone],
        className,
      )}
    >
      {dot && (
        <span className="size-1.5 rounded-full bg-current opacity-80" />
      )}
      {children}
    </span>
  );
}
