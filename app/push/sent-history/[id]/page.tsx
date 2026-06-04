"use client";

import Link from "next/link";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  ArrowLeft,
  Copy,
  Question,
  ChartDonut,
  SquaresFour,
  FileXls,
} from "@phosphor-icons/react";
import { SectionCard } from "@/components/common/section-card";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ── 더미 데이터 ─────────────────────────────── */

type Platform = {
  label: string;
  color: string;
  sent: number;
  click: number;
  pending: number;
  limited: number;
  deleted: number;
  failed: number;
};

// 같은 블루 계열의 명도 단계 (메인 #2E6FE0 → 가장 연한 단계)
const PLATFORMS: Platform[] = [
  { label: "앱 (안드로이드)", color: "#2e6fe0", sent: 7200, click: 1080, pending: 0, limited: 0, deleted: 12, failed: 8 },
  { label: "앱 (iOS)", color: "#5c8ae6", sent: 3100, click: 520, pending: 0, limited: 2, deleted: 4, failed: 3 },
  { label: "웹 (데스크탑)", color: "#8aacec", sent: 1800, click: 180, pending: 0, limited: 0, deleted: 0, failed: 1 },
  { label: "웹 (모바일)", color: "#b9cdf4", sent: 740, click: 40, pending: 0, limited: 0, deleted: 0, failed: 0 },
];

const totalSent = PLATFORMS.reduce((s, p) => s + p.sent, 0);
const totalClick = PLATFORMS.reduce((s, p) => s + p.click, 0);
const sum = (k: keyof Platform) =>
  PLATFORMS.reduce((s, p) => s + (p[k] as number), 0);

const rate = (part: number, whole: number) =>
  whole === 0 ? "0.0" : ((part / whole) * 100).toFixed(1);

/* ── 작은 조각 ───────────────────────────────── */

function HelpHint({ text }: { text: string }) {
  return (
    <span title={text} className="inline-flex cursor-help">
      <Question className="size-3.5 text-gray-400" weight="bold" />
    </span>
  );
}

function KV({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 text-sm">
      <dt className="text-muted-foreground flex w-32 shrink-0 items-center gap-1 pt-px">
        {label}
        {hint && <HelpHint text={hint} />}
      </dt>
      <dd className="text-body min-w-0 flex-1 break-words">
        {children || <span className="text-gray-300">—</span>}
      </dd>
    </div>
  );
}

type StatusStats = Pick<Platform, "pending" | "limited" | "deleted" | "failed">;

/* 발송 → 상태별 구간 (전달=navy, 대기=gray-300, 제한됨=amber, 삭제=gray-400, 실패=danger) */
function statusSegments(sent: number, s: StatusStats) {
  const delivered = sent - s.pending - s.limited - s.deleted - s.failed;
  return [
    { label: "전달", value: Math.max(delivered, 0), color: "var(--chart-1)" },
    { label: "대기", value: s.pending, color: "#c8c8d0" },
    { label: "제한됨", value: s.limited, color: "var(--color-warning)" },
    { label: "삭제", value: s.deleted, color: "#a0a0aa" },
    { label: "실패", value: s.failed, color: "var(--color-danger)" },
  ];
}

/* 상태를 색상 구간으로 표현한 누적 가로 막대 */
function SegmentedBar({
  sent,
  stats,
  className,
}: {
  sent: number;
  stats: StatusStats;
  className?: string;
}) {
  const segs = statusSegments(sent, stats).filter((s) => s.value > 0);
  return (
    <div
      className={cn(
        "flex h-2 w-full overflow-hidden rounded-full bg-gray-100",
        className,
      )}
    >
      {segs.map((s) => (
        <div
          key={s.label}
          title={`${s.label} ${s.value.toLocaleString()}`}
          // 비율(flex-grow)대로 폭을 나누되, 작은 값도 최소 3px 보장
          style={{
            flexGrow: s.value,
            flexBasis: 0,
            minWidth: "3px",
            background: s.color,
          }}
          className="h-full first:rounded-l-full last:rounded-r-full"
        />
      ))}
    </div>
  );
}

/* 막대와 같은 색 점을 단 상태 범례 */
function StatusList({
  sent,
  stats,
  className,
}: {
  sent: number;
  stats: StatusStats;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-x-4 gap-y-1 text-xs", className)}>
      {statusSegments(sent, stats).map((s) => (
        <span key={s.label} className="inline-flex items-center gap-1.5">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ background: s.color }}
          />
          <span className="text-muted-foreground">{s.label}</span>
          <span className="text-body tabular-nums">
            {s.value.toLocaleString()}
          </span>
        </span>
      ))}
    </div>
  );
}

type DonutDatum = { name: string; value: number; color: string };

/* 도넛 호버 툴팁 — 흰 카드 + gray-200 보더 + 8px + 작은 그림자 */
function PieTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: { payload: DonutDatum }[];
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pct = total === 0 ? "0.0" : ((d.value / total) * 100).toFixed(1);
  return (
    <div className="border-border bg-surface flex w-max items-center gap-1.5 rounded-lg border px-3 py-2 text-xs whitespace-nowrap shadow-sm">
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ background: d.color }}
      />
      <span className="text-muted-foreground">{d.name}</span>
      <span className="text-title ml-1 font-medium tabular-nums">
        {d.value.toLocaleString()} ({pct}%)
      </span>
    </div>
  );
}

function Donut({
  data,
  label,
  center,
  total,
}: {
  data: DonutDatum[];
  label: string;
  center: string;
  total: number;
}) {
  const hasData = data.some((d) => d.value > 0);
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative size-[108px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {hasData && (
              <Tooltip
                content={<PieTooltip total={total} />}
                allowEscapeViewBox={{ x: true, y: true }}
                isAnimationActive={false}
                wrapperStyle={{ outline: "none", zIndex: 10 }}
              />
            )}
            <Pie
              data={hasData ? data : [{ name: "", value: 1, color: "#e4e4ea" }]}
              dataKey="value"
              innerRadius={34}
              outerRadius={52}
              paddingAngle={hasData ? 2 : 0}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {(hasData ? data : [{ name: "", value: 1, color: "#e4e4ea" }]).map(
                (d, i) => (
                  <Cell key={i} fill={d.color} />
                ),
              )}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-title text-sm font-semibold tabular-nums">
            {center}
          </span>
        </div>
      </div>
      <span className="text-muted-foreground mt-1 text-xs">{label}</span>
    </div>
  );
}

/* ── 분석 하위 박스 ──────────────────────────── */

/** 분석 내부 영역 제목 (박스 없이 아이콘 + 제목만) */
function SubHeader({
  icon: Icon,
  title,
}: {
  icon: typeof ChartDonut;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="size-4 text-gray-500" />
      <h3 className="text-title text-sm font-semibold">{title}</h3>
    </div>
  );
}

/* ── 페이지 ──────────────────────────────────── */

export default function SentMessageDetailPage() {
  const sentData = PLATFORMS.map((p) => ({
    name: p.label,
    value: p.sent,
    color: p.color,
  }));
  const clickData = PLATFORMS.map((p) => ({
    name: p.label,
    value: p.click,
    color: p.color,
  }));
  const aggStats = {
    pending: sum("pending"),
    limited: sum("limited"),
    deleted: sum("deleted"),
    failed: sum("failed"),
  };

  return (
    <div className="space-y-6">
      {/* 상단 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            href="/push/sent-history"
            aria-label="뒤로"
            className="hover:bg-overlay-hover flex size-8 items-center justify-center rounded-md text-gray-500 transition-colors"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-title text-xl font-semibold tracking-tight">
            보낸 메시지 상세
          </h1>
        </div>
        <Button variant="outline">
          <Copy className="size-4" />
          메시지 복제
        </Button>
      </div>

      {/* 카드 1 — 발송 정보 */}
      <SectionCard title="발송 정보">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <KV label="ID">
            <span className="font-mono text-xs text-gray-600">
              3f2a9c10-7b04-4e6a-9c1f-2a8e5b0c4d77
            </span>
          </KV>
          <KV label="발송 시간">
            <span className="tabular-nums">
              2026.04.30 16:31:02{" "}
              <span className="text-muted-foreground">Asia/Seoul</span>
            </span>
          </KV>
          <KV label="알림 만료 기간">3일</KV>
          <KV label="발송 환경" hint="이 메시지를 발송한 환경">
            <StatusBadge tone="neutral">콘솔</StatusBadge>
          </KV>
          <KV label="발송 빈도 제한 무시">
            <span className="font-mono text-xs text-gray-600">FALSE</span>
          </KV>
        </dl>
      </SectionCard>

      {/* 카드 2 — 메시지 */}
      <SectionCard title="메시지">
        <dl className="space-y-4">
          <KV label="제목">
            {/* 2줄 초과 시 말줄임 */}
            <p className="line-clamp-2 max-w-2xl">
              여름 시즌 한정 혜택! 지금 바로 확인하세요 — 최대 40% 할인 쿠폰과
              무료배송, 오늘 가입하면 추가 적립금 5,000원까지 드리는 역대급
              프로모션을 놓치지 마세요
            </p>
          </KV>
          <KV label="내용">
            <p className="line-clamp-2 max-w-2xl">tes</p>
          </KV>
          <KV label="URL">
            <a className="text-link block max-w-2xl truncate hover:underline">
              https://flarelane.demo/promo/summer-sale?utm_source=push&utm_medium=app&utm_campaign=2026_summer&ref=detail
            </a>
          </KV>
          <KV label="이미지">
            {/* 푸시 이미지 영역 (16:9, 240px) — 실제 첨부 이미지 미리보기 자리 */}
            <div className="border-border w-60 overflow-hidden rounded-lg border">
              <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-[var(--chart-1)] to-navy-800">
                <span className="text-sm font-semibold tracking-wide text-white">
                  ☀ SUMMER SALE
                </span>
              </div>
            </div>
            <p className="text-muted-foreground mt-1.5 text-xs">
              summer-sale-banner.png · 1200×675
            </p>
          </KV>
        </dl>
      </SectionCard>

      {/* 카드 3 — 유형 & 대상 */}
      <SectionCard title="유형 & 대상">
        <dl className="grid grid-cols-1 gap-y-3">
          <KV label="파일 업로드">
            <span className="inline-flex items-center gap-2">
              <FileXls className="size-4 text-gray-400" weight="fill" />
              <span className="text-link">sample-push.xlsx</span>
            </span>
          </KV>
        </dl>
      </SectionCard>

      {/* 카드 4 — 분석 (바깥 카드 1개 + 내부는 디바이더/여백) */}
      <SectionCard title="분석">
        <div>
          {/* 전체 통계 */}
          <SubHeader icon={ChartDonut} title="전체 통계" />
          <div>
            {/* 큰 숫자 */}
            <div className="mb-5 flex gap-8">
              <div>
                <p className="text-muted-foreground text-xs">발송</p>
                <p className="text-title text-2xl font-semibold tabular-nums">
                  {totalSent.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">클릭</p>
                <p className="text-title text-2xl font-semibold tabular-nums">
                  {totalClick.toLocaleString()}{" "}
                  <span className="text-muted-foreground text-base">
                    ({rate(totalClick, totalSent)}%)
                  </span>
                </p>
              </div>
            </div>

            {/* 도넛 + 범례 */}
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex gap-6">
                <Donut
                  data={sentData}
                  label="발송"
                  center={totalSent.toLocaleString()}
                  total={totalSent}
                />
                <Donut
                  data={clickData}
                  label="클릭"
                  center={totalClick.toLocaleString()}
                  total={totalClick}
                />
              </div>
              <ul className="min-w-[240px] flex-1 space-y-1.5 text-sm">
                {PLATFORMS.map((p) => (
                  <li key={p.label} className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: p.color }}
                    />
                    <span className="text-body">{p.label}</span>
                    <span className="text-muted-foreground ml-auto tabular-nums">
                      {p.sent.toLocaleString()} ({rate(p.sent, totalSent)}%)
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 상태 누적 막대 + 범례 (디바이더 없이 여백으로만 구분) */}
            <div className="mt-6 space-y-3">
              <SegmentedBar sent={totalSent} stats={aggStats} />
              <StatusList sent={totalSent} stats={aggStats} />
            </div>
          </div>

          {/* 전체 ↔ 플랫폼별 구분 디바이더 */}
          <div className="border-border my-6 border-t" />

          {/* 플랫폼별 통계 — 카드 없이 2x2, 옅은 디바이더로 구분 */}
          <SubHeader icon={SquaresFour} title="플랫폼별 통계" />
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {PLATFORMS.map((p, i) => (
              <div
                key={p.label}
                className={cn(
                  "py-4 sm:py-5",
                  i % 2 === 0 ? "sm:pr-6" : "sm:border-l sm:border-gray-100 sm:pl-6",
                  i >= 2 && "sm:border-t sm:border-gray-100",
                )}
              >
                <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: p.color }}
                    />
                    <p className="text-title text-sm font-medium">{p.label}</p>
                  </div>
                  <div className="mt-3 flex gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">발송 </span>
                      <span className="text-body font-medium tabular-nums">
                        {p.sent.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">클릭 </span>
                      <span className="text-body font-medium tabular-nums">
                        {p.click.toLocaleString()} ({rate(p.click, p.sent)}%)
                      </span>
                    </div>
                  </div>
                  <SegmentedBar sent={p.sent} stats={p} className="mt-3" />
                  <StatusList sent={p.sent} stats={p} className="mt-2" />
                </div>
              ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
