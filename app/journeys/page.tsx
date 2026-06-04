"use client";

import * as React from "react";
import { Plus, PencilSimple, Copy, Pause, Trash } from "@phosphor-icons/react";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { DateRangePicker } from "@/components/common/date-range-picker";
import {
  RowActionMenu,
  type RowAction,
} from "@/components/common/row-action-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ── 더미 데이터 ─────────────────────────────── */

type Journey = {
  name: string;
  created: string;
  activated: string;
  entry: number;
  conv: number; // 전환 건수
  purchase: number; // 구매 총액(원)
};

const JOURNEYS: Journey[] = [
  { name: "자동화 인앱 다운로드 테스트", created: "2026-05-12 14:20", activated: "2026-05-12 15:01", entry: 1240, conv: 744, purchase: 3720000 },
  { name: "1-AB-TEST-GROUP 구매", created: "2026-05-09 10:05", activated: "2026-05-09 11:30", entry: 880, conv: 264, purchase: 1320000 },
  { name: "장바구니 이탈 리마인드", created: "2026-04-28 09:12", activated: "2026-04-28 09:40", entry: 2150, conv: 430, purchase: 5160000 },
  { name: "신규 가입 환영 시리즈", created: "2026-04-15 16:45", activated: "2026-04-15 17:00", entry: 3320, conv: 1162, purchase: 2324000 },
  { name: "첫 구매 감사 쿠폰", created: "2026-05-01 13:30", activated: "2026-05-01 14:10", entry: 560, conv: 196, purchase: 980000 },
  { name: "휴면 고객 재활성화", created: "2026-03-22 11:00", activated: "2026-03-22 11:25", entry: 4100, conv: 328, purchase: 1640000 },
];

const won = (v: number) => `₩${v.toLocaleString()}`;
const rate = (conv: number, entry: number) =>
  entry === 0 ? "0.0" : ((conv / entry) * 100).toFixed(1);

/* ── 컬럼 정의 ───────────────────────────────── */

const columns: ColumnDef<Journey>[] = [
  {
    id: "status",
    header: "상태",
    enableSorting: false,
    cell: () => (
      <StatusBadge tone="success" dot>
        활성화
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
    accessorKey: "created",
    header: "생성 시간",
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">
        {row.original.created}
      </span>
    ),
  },
  {
    accessorKey: "activated",
    header: "활성화 시간",
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">
        {row.original.activated}
      </span>
    ),
  },
  {
    accessorKey: "entry",
    header: "진입 여정",
    meta: { align: "right" },
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.entry.toLocaleString()}</span>
    ),
  },
  {
    accessorKey: "conv",
    header: "전환 여정",
    meta: { align: "right" },
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.conv.toLocaleString()}{" "}
        <span className="text-muted-foreground">
          ({rate(row.original.conv, row.original.entry)}%)
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
    cell: () => <RowActionMenu items={JOURNEY_ACTIONS} />,
  },
];

const JOURNEY_ACTIONS: RowAction[] = [
  { label: "수정", icon: PencilSimple },
  { label: "복제", icon: Copy },
  { label: "일시중지", icon: Pause },
  { label: "삭제", icon: Trash, danger: true },
];

/* ── 탭 ──────────────────────────────────────── */

const TABS = [
  { key: "active", label: "활성화", count: 6 },
  { key: "paused", label: "일시중지", count: 83 },
  { key: "draft", label: "임시저장", count: 87 },
  { key: "archived", label: "아카이브됨", count: 0 },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ── 페이지 ──────────────────────────────────── */

export default function JourneysPage() {
  const [tab, setTab] = React.useState<TabKey>("active");
  // 데모: 활성화 탭에만 더미 데이터, 나머지는 빈 상태
  const data = tab === "active" ? JOURNEYS : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="고객 여정 자동화"
        hint="고객 행동에 따라 메시지를 자동 발송하는 여정을 관리합니다"
        actions={
          <Button>
            <Plus className="size-[17px]" />새 자동화
          </Button>
        }
      />

      <div>
        {/* 탭 바 — 영역 구분선(gray-200) */}
        <div className="border-border flex items-center gap-1 border-b">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "-mb-px border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                  active
                    ? "border-brand text-brand"
                    : "border-transparent text-gray-500 hover:text-gray-700",
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "ml-1.5 tabular-nums",
                    active ? "text-brand" : "text-gray-400",
                  )}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 테이블 — 내장 툴바(좌측 검색 + 우측 기간 필터) 사용 */}
        <DataTable
          columns={columns}
          data={data}
          pageSize={10}
          className="mt-6"
          searchColumn="name"
          searchPlaceholder="자동화 이름 검색"
          toolbarRight={<DateRangePicker />}
        />
      </div>
    </div>
  );
}
