"use client";

import * as React from "react";
import {
  Monitor,
  DeviceMobile,
  AndroidLogo,
  AppleLogo,
  Question,
  CaretDown,
  DownloadSimple,
  type Icon,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { DateRangePicker } from "@/components/common/date-range-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  NewDevicesChart,
  SendClickChart,
  HourlyCtrChart,
} from "@/components/dashboard/charts";

/* ── 공통 작은 조각 ───────────────────────────── */

function CsvButton() {
  return (
    <Button variant="outline" size="sm">
      <DownloadSimple className="size-4" />
      CSV로 내보내기
    </Button>
  );
}

function HelpHint({ text }: { text: string }) {
  return (
    <span title={text} className="inline-flex cursor-help">
      <Question className="size-3.5 text-gray-400" weight="bold" />
    </span>
  );
}

/** 기기 지표 한 칸: 배경 없이 큰 숫자(주인공) + 보조 아이콘 + 라벨 */
function DeviceStat({
  icon: IconCmp,
  value,
  label,
}: {
  icon: Icon;
  value: number;
  label: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-title text-[28px] leading-none font-semibold tracking-tight tabular-nums">
        {value.toLocaleString()}
      </p>
      <div className="mt-2.5 flex items-center gap-1.5">
        <IconCmp className="size-4 shrink-0 text-gray-400" />
        <p className="truncate text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function StatGroup({
  title,
  hint,
  items,
}: {
  title: string;
  hint: string;
  items: { icon: Icon; value: number; label: string }[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-medium text-gray-500">{title}</p>
        <HelpHint text={hint} />
      </div>
      {/* 좌(데스크탑/안드로이드) · 우(모바일/iOS) 사이 옅은 세로 구분선 */}
      <div className="divide-border grid grid-cols-2 divide-x">
        {items.map((s, i) => (
          <div key={s.label} className={i === 0 ? "pr-8" : "pl-8"}>
            <DeviceStat {...s} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** 웹/앱 푸시 카드 (섹션 1 내부의 좌우 카드) */
function PushPanel({
  title,
  total,
  subscribed,
}: {
  title: string;
  total: { icon: Icon; value: number; label: string }[];
  subscribed: { icon: Icon; value: number; label: string }[];
}) {
  return (
    <div className="bg-surface border-border rounded-lg border p-7">
      <p className="text-title mb-6 text-sm font-semibold">{title}</p>
      <div className="space-y-7">
        <StatGroup
          title="전체 기기 수"
          hint="해당 채널에 등록된 전체 기기 수"
          items={total}
        />
        {/* 전체 ↔ 구독 그룹 사이 옅은 가로 구분선 */}
        <div className="border-border border-t" />
        <StatGroup
          title="알림 구독 기기 수"
          hint="알림 수신에 동의한 기기 수"
          items={subscribed}
        />
      </div>
    </div>
  );
}

/* ── 섹션 5: 가장 클릭률 높은 메시지 ──────────────── */

type TopMsg = { ctr: number; msg: string; clicks: number };

const TOP_CONSOLE: TopMsg[] = [
  { ctr: 12.4, msg: "여름 시즌 특가 — 최대 40% 할인", clicks: 1820 },
  { ctr: 9.8, msg: "오늘만! 신규 가입 쿠폰이 도착했어요", clicks: 1430 },
  { ctr: 7.5, msg: "장바구니에 담아둔 상품이 기다리고 있어요", clicks: 1120 },
  { ctr: 6.1, msg: "주말 한정 무료배송 이벤트 진행 중", clicks: 890 },
  { ctr: 4.7, msg: "새로운 기능이 업데이트되었습니다", clicks: 540 },
];

const TOP_API: TopMsg[] = [
  { ctr: 14.2, msg: "[자동] 결제가 완료되었습니다", clicks: 2210 },
  { ctr: 10.6, msg: "[자동] 상품이 배송을 시작했어요", clicks: 1680 },
  { ctr: 8.3, msg: "[자동] 구매하신 상품 리뷰를 남겨주세요", clicks: 1240 },
  { ctr: 5.9, msg: "[자동] 포인트가 적립되었습니다", clicks: 760 },
];

const topColumns: ColumnDef<TopMsg>[] = [
  {
    accessorKey: "ctr",
    header: "클릭률",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.index === 0 && <StatusBadge tone="brand">1위</StatusBadge>}
        <span className="text-title font-medium tabular-nums">
          {row.original.ctr}%
        </span>
      </div>
    ),
  },
  {
    accessorKey: "msg",
    header: "메시지",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="line-clamp-1 max-w-[260px]">{row.original.msg}</span>
    ),
  },
  {
    accessorKey: "clicks",
    header: "클릭 합계",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.clicks.toLocaleString()}
      </span>
    ),
  },
];

function TopMessagesCard({
  title,
  data,
}: {
  title: string;
  data: TopMsg[];
}) {
  return (
    <SectionCard
      title={title}
      className="h-full"
      actions={
        <Button variant="ghost" size="sm" className="text-link">
          더 보기
        </Button>
      }
    >
      <DataTable columns={topColumns} data={data} enablePagination={false} />
    </SectionCard>
  );
}

/* ── 섹션 6: 최근 이벤트 (접이식 행) ───────────────── */

function RecentEvents() {
  const [open, setOpen] = React.useState(false);
  return (
    <SectionCard title="최근 이벤트" noPadding>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="hover:bg-overlay-hover flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors"
      >
        <StatusBadge tone="neutral">@first_session</StatusBadge>
        <span className="text-body text-sm">
          새 기기가 처음 등록되었습니다
        </span>
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          2026-05-29 10:31:23
        </span>
        <CaretDown
          className={cn(
            "size-4 shrink-0 text-gray-400 transition-transform",
            open ? "" : "-rotate-90",
          )}
        />
      </button>
      {open && (
        <div className="border-border bg-gray-50 border-t px-5 py-4">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-xs sm:grid-cols-2">
            {[
              ["이벤트 타입", "@first_session"],
              ["대상", "기기"],
              ["대상 ID", "d3f1a9c2-7b04-4e6a-9c1f-2a8e5b0c4d77"],
              ["발생 시간", "2026-05-29 10:31:23"],
              ["플랫폼", "Android"],
              ["앱 버전", "3.12.0"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-body truncate text-right tabular-nums">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </SectionCard>
  );
}

/* ── 페이지 ──────────────────────────────────── */

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="기기 및 발송 현황"
        actions={
          <DateRangePicker
            label=""
            defaultStart="2026-05-02"
            defaultEnd="2026-05-31"
          />
        }
      />

      {/* 섹션 1 — 기기 및 발송 현황 (페이지 제목과 중복되므로 카드 타이틀 없이
          웹 푸시 / 앱 푸시 좌우 패널만 노출) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PushPanel
          title="웹 푸시"
          total={[
            { icon: Monitor, value: 8420, label: "데스크탑" },
            { icon: DeviceMobile, value: 3180, label: "모바일" },
          ]}
          subscribed={[
            { icon: Monitor, value: 2940, label: "데스크탑" },
            { icon: DeviceMobile, value: 1020, label: "모바일" },
          ]}
        />
        <PushPanel
          title="앱 푸시"
          total={[
            { icon: AndroidLogo, value: 12650, label: "안드로이드" },
            { icon: AppleLogo, value: 6310, label: "iOS" },
          ]}
          subscribed={[
            { icon: AndroidLogo, value: 7480, label: "안드로이드" },
            { icon: AppleLogo, value: 3120, label: "iOS" },
          ]}
        />
      </div>

      {/* 섹션 2 — 신규 등록 기기 */}
      <SectionCard title="신규 등록 기기" actions={<CsvButton />}>
        <NewDevicesChart />
      </SectionCard>

      {/* 섹션 3 — 발송 & 클릭 */}
      <SectionCard title="발송 & 클릭" actions={<CsvButton />}>
        <SendClickChart />
      </SectionCard>

      {/* 섹션 4 — 발송 시간대별 평균 클릭률 */}
      <SectionCard title="발송 시간대별 평균 클릭률" actions={<CsvButton />}>
        <HourlyCtrChart />
      </SectionCard>

      {/* 섹션 5 — 가장 클릭률 높은 메시지 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopMessagesCard
          title="가장 클릭률 높은 메시지 (콘솔)"
          data={TOP_CONSOLE}
        />
        <TopMessagesCard
          title="가장 클릭률 높은 메시지 (API)"
          data={TOP_API}
        />
      </div>

      {/* 섹션 6 — 최근 이벤트 */}
      <RecentEvents />
    </div>
  );
}
