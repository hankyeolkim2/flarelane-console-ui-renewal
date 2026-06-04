"use client";

import * as React from "react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/* ── 더미 데이터 ─────────────────────────────── */

type User = {
  userId: string;
  name: string;
  phone: string;
  lastSeen: string;
  tags: Record<string, string>;
};

const D = "-";

const USERS: User[] = [
  { userId: "CU00071054", name: "박지훈", phone: "010-2841-5573", lastSeen: "약 1시간 전", tags: { recent_checkin_date: "12345", sports_category: "1", region: "Seoul", vip: "true" } },
  { userId: "ycp47", name: D, phone: D, lastSeen: "3시간 전", tags: {} },
  { userId: "testUser003", name: D, phone: D, lastSeen: "8일 전", tags: { env: "test", group: "B" } },
  { userId: "jhpark", name: "박정현", phone: "010-9920-1184", lastSeen: "어제", tags: { region: "Busan", signup_channel: "organic", vip: "false" } },
  { userId: "temp_1", name: D, phone: D, lastSeen: "12일 전", tags: {} },
  { userId: "temp_2", name: D, phone: D, lastSeen: "한 달 전", tags: {} },
  { userId: "kimsy-", name: "김서연", phone: "010-3372-8810", lastSeen: "약 2시간 전", tags: { region: "Incheon", vip: "true", tier: "gold", points: "5200" } },
  { userId: "CU00068821", name: D, phone: D, lastSeen: "5일 전", tags: { last_purchase: "2026-05-21" } },
  { userId: "guest_9f2a", name: D, phone: D, lastSeen: "방금 전", tags: {} },
  { userId: "user_88231", name: "이민호", phone: D, lastSeen: "2개월 전", tags: { status: "dormant", region: "Daegu" } },
  { userId: "demo01", name: D, phone: "010-1102-4456", lastSeen: "7개월 전", tags: { plan: "free" } },
  { userId: "CU00071102", name: "최유나", phone: "010-5538-2290", lastSeen: "4일 전", tags: { region: "Seoul", vip: "true", age_band: "30s" } },
  { userId: "abckim", name: D, phone: D, lastSeen: "약 30분 전", tags: {} },
  { userId: "sleepy_panda", name: D, phone: D, lastSeen: "1년 이상", tags: { status: "dormant", last_seen_days: "400" } },
  { userId: "parkjh-", name: "박준혁", phone: "010-7741-0098", lastSeen: "6일 전", tags: { signup_channel: "ad", region: "Gwangju" } },
];

/* 태그 버튼 + JSON 팝오버 */
function TagPopover({ data }: { data: Record<string, string> }) {
  const isEmpty = Object.keys(data).length === 0;
  return (
    <Popover>
      <PopoverTrigger className="border-input hover:border-gray-300 inline-flex h-[var(--control-height-sm)] items-center rounded-lg border px-2.5 text-xs text-gray-600 transition-colors outline-none">
        태그
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="border-border w-auto min-w-[200px] gap-0 border p-3"
      >
        {isEmpty ? (
          <p className="text-muted-foreground text-xs">태그 없음</p>
        ) : (
          <pre className="font-mono text-xs leading-relaxed whitespace-pre text-gray-700">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </PopoverContent>
    </Popover>
  );
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "userId",
    header: "유저 ID",
    cell: ({ row }) => (
      <span className="text-title font-medium">{row.original.userId}</span>
    ),
  },
  { accessorKey: "name", header: "이름" },
  {
    accessorKey: "phone",
    header: "전화번호",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.phone}</span>
    ),
  },
  {
    accessorKey: "lastSeen",
    header: "마지막 접속 시간",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.lastSeen}</span>
    ),
  },
  {
    id: "tags",
    header: "태그",
    enableSorting: false,
    cell: ({ row }) => <TagPopover data={row.original.tags} />,
  },
  {
    id: "detail",
    header: "",
    enableSorting: false,
    meta: { align: "right" },
    cell: () => (
      <Button variant="outline" size="sm" className="leading-none">
        상세 정보
      </Button>
    ),
  },
];

/* ── 페이지 ──────────────────────────────────── */

export default function AllUsersPage() {
  const [query, setQuery] = React.useState("");

  return (
    <div className="space-y-6">
      <PageHeader
        title="전체 유저"
        actions={
          <div className="flex items-center gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="User ID 검색"
              className="w-56"
            />
            <Button>검색</Button>
          </div>
        }
      />

      {/* 리스트만 흰 카드로 감쌈. p-3 패딩이 셀 px-3 + 알약 호버 여백과 맞물림 */}
      <div className="bg-surface border-border rounded-lg border p-3">
        <DataTable
          columns={columns}
          data={USERS}
          globalFilter={query}
          onGlobalFilterChange={setQuery}
          pageSize={10}
          striped
        />
      </div>
    </div>
  );
}
