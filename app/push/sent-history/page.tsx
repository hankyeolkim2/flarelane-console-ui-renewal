"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AndroidLogo, AppleLogo, Globe, Copy } from "@phosphor-icons/react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { DateRangePicker } from "@/components/common/date-range-picker";
import { StatusBadge } from "@/components/common/status-badge";
import {
  RowActionMenu,
  type RowAction,
} from "@/components/common/row-action-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/* ── 더미 데이터 ─────────────────────────────── */

type Platform = "android" | "ios" | "web";
type SentMessage = {
  env: "콘솔" | "API" | "테스트" | "시스템";
  name: string;
  sentAt: string;
  platforms: Platform[];
  sent: number;
  clicks: number;
  conversions: number;
  purchase: number;
};

const MESSAGES: SentMessage[] = [
  { env: "콘솔", name: "재방문 유도", sentAt: "2026-06-04 10:21:08", platforms: ["android", "ios", "web"], sent: 12840, clicks: 1820, conversions: 312, purchase: 4680000 },
  { env: "API", name: "가입 환영", sentAt: "2026-06-03 18:02:55", platforms: ["android", "ios"], sent: 3320, clicks: 742, conversions: 168, purchase: 1344000 },
  { env: "콘솔", name: "쿠폰 발송", sentAt: "2026-06-03 09:40:12", platforms: ["web"], sent: 8810, clicks: 1102, conversions: 96, purchase: 720000 },
  { env: "콘솔", name: "test11", sentAt: "2026-06-02 16:33:47", platforms: ["android"], sent: 0, clicks: 0, conversions: 0, purchase: 0 },
  { env: "테스트", name: "xlsx", sentAt: "2026-06-02 14:10:03", platforms: ["ios"], sent: 4, clicks: 1, conversions: 0, purchase: 0 },
  { env: "콘솔", name: "휴면 알림", sentAt: "2026-06-01 11:25:39", platforms: ["android", "ios", "web"], sent: 21450, clicks: 1530, conversions: 204, purchase: 2856000 },
  { env: "API", name: "신규 소식", sentAt: "2026-05-30 20:48:21", platforms: ["android", "ios"], sent: 6720, clicks: 588, conversions: 41, purchase: 410000 },
  { env: "콘솔", name: "test", sentAt: "2026-05-29 13:07:55", platforms: ["web"], sent: 0, clicks: 0, conversions: 0, purchase: 0 },
  { env: "시스템", name: "tes", sentAt: "2026-05-28 08:52:14", platforms: ["android"], sent: 132, clicks: 18, conversions: 2, purchase: 38000 },
];

const won = (v: number) => `₩${v.toLocaleString()}`;
const rate = (part: number, whole: number) =>
  whole === 0 ? "0.0" : ((part / whole) * 100).toFixed(1);

const PLATFORM_ICON: Record<Platform, typeof Globe> = {
  android: AndroidLogo,
  ios: AppleLogo,
  web: Globe,
};

const SENT_ACTIONS: RowAction[] = [{ label: "복제", icon: Copy }];

const columns: ColumnDef<SentMessage>[] = [
  {
    accessorKey: "env",
    header: "발송 환경",
    cell: ({ row }) => (
      <StatusBadge tone={row.original.env === "API" ? "brand" : "neutral"}>
        {row.original.env}
      </StatusBadge>
    ),
  },
  {
    accessorKey: "name",
    header: "이름",
    cell: ({ row }) => (
      <span className="text-title font-medium">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "sentAt",
    header: "발송 시간",
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">
        {row.original.sentAt}
      </span>
    ),
  },
  {
    id: "platforms",
    header: "플랫폼",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-gray-500">
        {row.original.platforms.map((p) => {
          const Icon = PLATFORM_ICON[p];
          return <Icon key={p} className="size-4" />;
        })}
      </div>
    ),
  },
  {
    accessorKey: "sent",
    header: "발송",
    meta: { align: "right" },
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.sent.toLocaleString()}</span>
    ),
  },
  {
    accessorKey: "clicks",
    header: "클릭",
    meta: { align: "right" },
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.clicks.toLocaleString()}{" "}
        <span className="text-muted-foreground">
          ({rate(row.original.clicks, row.original.sent)}%)
        </span>
      </span>
    ),
  },
  {
    accessorKey: "conversions",
    header: "전환",
    meta: { align: "right" },
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.conversions.toLocaleString()}{" "}
        <span className="text-muted-foreground">
          ({rate(row.original.conversions, row.original.sent)}%)
        </span>
      </span>
    ),
  },
  {
    accessorKey: "purchase",
    header: "구매 총액",
    meta: { align: "right" },
    cell: ({ row }) => (
      <span className="text-title font-medium tabular-nums">
        {won(row.original.purchase)}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    meta: { align: "right" },
    cell: () => <RowActionMenu items={SENT_ACTIONS} />,
  },
];

/* 필터 영역 라벨 행 */
function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-body w-20 shrink-0 text-sm font-medium">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  );
}

/* ── 페이지 ──────────────────────────────────── */

export default function SentHistoryPage() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [web, setWeb] = React.useState(true);
  const [app, setApp] = React.useState(true);
  const [env, setEnv] = React.useState("console");

  return (
    <div className="space-y-6">
      <PageHeader title="보낸 메시지" />

      {/* 필터 영역 */}
      <div className="bg-surface border-border space-y-4 rounded-lg border p-5">
        <div className="flex items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="캠페인명, 제목, 내용, 알림ID로 검색"
            className="max-w-md flex-1"
          />
          <Button>검색</Button>
        </div>

        <FilterRow label="기간">
          <DateRangePicker
            label=""
            defaultStart="2025-06-04"
            defaultEnd="2026-06-04"
          />
        </FilterRow>

        <FilterRow label="플랫폼">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={web}
              onCheckedChange={(c) => setWeb(Boolean(c))}
            />
            <span className="text-body">웹 (전체)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={app}
              onCheckedChange={(c) => setApp(Boolean(c))}
            />
            <span className="text-body">앱 (전체)</span>
          </label>
        </FilterRow>

        <FilterRow label="발송 환경">
          <RadioGroup
            value={env}
            onValueChange={(v) => setEnv(v as string)}
            className="flex flex-row flex-wrap gap-4"
          >
            {[
              ["all", "전체"],
              ["console", "콘솔"],
              ["api", "API"],
              ["test", "테스트"],
              ["system", "시스템"],
            ].map(([v, l]) => (
              <label
                key={v}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <RadioGroupItem value={v} />
                <span className="text-body">{l}</span>
              </label>
            ))}
          </RadioGroup>
        </FilterRow>
      </div>

      {/* 메시지 리스트 (카드 안 테이블) */}
      <div className="bg-surface border-border rounded-lg border p-3">
        <DataTable
          columns={columns}
          data={MESSAGES}
          globalFilter={query}
          onGlobalFilterChange={setQuery}
          pageSize={10}
          onRowClick={() => router.push("/push/sent-history/detail")}
        />
      </div>
    </div>
  );
}
