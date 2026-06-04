"use client";

import * as React from "react";
import {
  Monitor,
  DeviceMobile,
  Robot,
  AppleLogo,
  DownloadSimple,
  Plus,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import { MetricCard } from "@/components/common/metric-card";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* --- 색 스와치 (토큰 확인용) --- */
const NAVY = [
  ["50", "bg-navy-50"],
  ["100", "bg-navy-100"],
  ["200", "bg-navy-200"],
  ["400", "bg-navy-400"],
  ["600", "bg-navy-600"],
  ["700", "bg-navy-700"],
  ["800", "bg-navy-800"],
  ["900", "bg-navy-900"],
];
const GRAY = [
  ["50", "bg-gray-50"],
  ["100", "bg-gray-100"],
  ["200", "bg-gray-200"],
  ["300", "bg-gray-300"],
  ["400", "bg-gray-400"],
  ["500", "bg-gray-500"],
  ["600", "bg-gray-600"],
  ["700", "bg-gray-700"],
  ["800", "bg-gray-800"],
  ["900", "bg-gray-900"],
];

/* --- DataTable 데모용 더미 --- */
type DemoUser = {
  id: string;
  name: string;
  lastSeen: string;
  status: "구독" | "미구독";
};
const DEMO: DemoUser[] = [
  { id: "temp_1", name: "-", lastSeen: "4일 전", status: "구독" },
  { id: "temp_2", name: "-", lastSeen: "12일 전", status: "미구독" },
  { id: "parkjh-", name: "박지훈", lastSeen: "1일 전", status: "구독" },
  { id: "temp_3", name: "-", lastSeen: "한 달 전", status: "미구독" },
  { id: "kimsy-", name: "김서연", lastSeen: "3시간 전", status: "구독" },
];

const COLUMNS: ColumnDef<DemoUser>[] = [
  { accessorKey: "id", header: "유저 ID" },
  { accessorKey: "name", header: "이름" },
  { accessorKey: "lastSeen", header: "마지막 접속" },
  {
    accessorKey: "status",
    header: "상태",
    cell: ({ row }) => (
      <StatusBadge tone={row.original.status === "구독" ? "success" : "neutral"} dot>
        {row.original.status}
      </StatusBadge>
    ),
  },
];

export default function Showcase() {
  const [filter, setFilter] = React.useState("");

  return (
    <div className="space-y-6">
      <PageHeader
        title="UI 리뉴얼 미리보기"
        description="0~1단계 결과 — 디자인 토큰 · 공통 레이아웃 · 공통 컴포넌트. (페이지 구현은 2단계)"
        actions={
          <Button>
            <Plus className="size-[17px]" />
            기본 버튼
          </Button>
        }
      />

      {/* 색 토큰 */}
      <SectionCard title="브랜드 네이비 / 그레이 토큰">
        <div className="space-y-4">
          <div>
            <p className="text-muted-foreground mb-2 text-xs">Navy (강조용)</p>
            <div className="flex flex-wrap gap-2">
              {NAVY.map(([n, bg]) => (
                <div key={n} className="text-center">
                  <div className={`${bg} border-border size-12 rounded-md border`} />
                  <p className="text-muted-foreground mt-1 text-[11px]">{n}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mb-2 text-xs">Gray (배경/텍스트/보더)</p>
            <div className="flex flex-wrap gap-2">
              {GRAY.map(([n, bg]) => (
                <div key={n} className="text-center">
                  <div className={`${bg} border-border size-12 rounded-md border`} />
                  <p className="text-muted-foreground mt-1 text-[11px]">{n}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* MetricCard */}
      <SectionCard title="MetricCard — 아이콘 + 라벨 + 숫자">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard icon={Monitor} label="데스크탑 기기" value={395} />
          <MetricCard icon={DeviceMobile} label="모바일 기기" value={23} />
          <MetricCard icon={Robot} label="안드로이드" value={253} />
          <MetricCard icon={AppleLogo} label="iOS" value={9} />
        </div>
      </SectionCard>

      {/* 배지 + 버튼 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SectionCard title="StatusBadge">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="success" dot>활성화</StatusBadge>
            <StatusBadge tone="success">구독</StatusBadge>
            <StatusBadge tone="neutral">미구독</StatusBadge>
            <StatusBadge tone="warning" dot>대기</StatusBadge>
            <StatusBadge tone="danger">실패</StatusBadge>
            <StatusBadge tone="brand">ENTERPRISE</StatusBadge>
          </div>
        </SectionCard>

        <SectionCard title="버튼 (shadcn + 토큰)">
          <div className="flex flex-wrap items-center gap-2">
            <Button>기본 (navy-800)</Button>
            <Button variant="outline">아웃라인</Button>
            <Button variant="secondary">보조</Button>
            <Button variant="ghost">고스트</Button>
            <Button variant="link" className="text-link">링크</Button>
          </div>
        </SectionCard>
      </div>

      {/* DataTable */}
      <SectionCard
        title="DataTable — 정렬 / 검색 / 페이지네이션"
        actions={
          <>
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="검색…"
              className="w-44"
            />
            <Button variant="outline" size="sm">
              <DownloadSimple className="size-4" />
              CSV로 내보내기
            </Button>
          </>
        }
      >
        <DataTable
          columns={COLUMNS}
          data={DEMO}
          globalFilter={filter}
          onGlobalFilterChange={setFilter}
          pageSize={5}
        />
      </SectionCard>
    </div>
  );
}
