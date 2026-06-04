"use client";

import {
  Copy,
  Eye,
  EyeSlash,
  Plus,
  PencilSimple,
  Trash,
  ArrowClockwise,
  DownloadSimple,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import { DateRangePicker } from "@/components/common/date-range-picker";
import {
  RowActionMenu,
  type RowAction,
} from "@/components/common/row-action-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ── 작은 조각 ───────────────────────────────── */

function CodeBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600">
      {children}
    </span>
  );
}

function IconButton({
  icon: Icon,
  label,
  className,
}: {
  icon: typeof Copy;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        "hover:bg-overlay-hover inline-flex size-7 items-center justify-center rounded-md text-gray-500 transition-colors",
        className,
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

const MANAGE_ACTIONS: RowAction[] = [
  { label: "수정", icon: PencilSimple },
  { label: "숨기기", icon: EyeSlash },
  { label: "삭제", icon: Trash, danger: true },
];

/* ── 섹션 1: 최근 이벤트 ─────────────────────── */

type EventRow = {
  time: string;
  type: string;
  target: string;
  targetId: string;
  data: string;
};

const EVENTS: EventRow[] = [
  { time: "2026-06-04 11:02:31", type: "@first_session", target: "기기", targetId: "d3f1a9c2-7b04-4e6a-9c1f-2a8e5b0c4d77", data: "{}" },
  { time: "2026-06-04 10:58:12", type: "@iam_displayed", target: "유저", targetId: "a17c4e90-2f6b-4d11-8a3e-9c0b7f25d6e1", data: '{"campaign_id":"cmp_8842","variant":"A"}' },
  { time: "2026-06-04 10:41:55", type: "deferred", target: "기기", targetId: "5b9e2c10-6a47-4f8d-b1c3-0e7a4d9f2188", data: '{"reason":"network_timeout","retry":2}' },
  { time: "2026-06-04 09:33:07", type: "@iam_closed", target: "유저", targetId: "e2740af3-1c8d-49b6-a5f2-7d3b6e914c0a", data: '{"campaign_id":"cmp_8830","duration_ms":4200}' },
  { time: "2026-06-04 09:12:48", type: "@push_opened", target: "기기", targetId: "9f6b1d27-3e54-4c0a-92f7-1ab8c5e740d2", data: '{"message_id":"msg_55102"}' },
  { time: "2026-06-03 22:05:19", type: "@first_session", target: "기기", targetId: "4c0a92f7-1ab8-4e54-83d1-6b2e9f0c5a73", data: "{}" },
  { time: "2026-06-03 21:47:33", type: "@session_start", target: "유저", targetId: "7d3b6e91-4c0a-4f2e-91b6-2a8e5b0c4d77", data: '{"source":"organic","platform":"android"}' },
  { time: "2026-06-03 20:18:02", type: "@iam_displayed", target: "기기", targetId: "1ab8c5e7-40d2-4f8d-b1c3-9f6b1d273e54", data: '{"campaign_id":"cmp_8801","variant":"B"}' },
];

const eventColumns: ColumnDef<EventRow>[] = [
  {
    accessorKey: "time",
    header: "생성 시간",
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">
        {row.original.time}
      </span>
    ),
  },
  {
    accessorKey: "type",
    header: "타입",
    cell: ({ row }) => <CodeBadge>{row.original.type}</CodeBadge>,
  },
  { accessorKey: "target", header: "대상" },
  {
    accessorKey: "targetId",
    header: "대상 ID",
    cell: ({ row }) => (
      <span className="block max-w-[180px] truncate font-mono text-xs text-gray-500">
        {row.original.targetId}
      </span>
    ),
  },
  {
    accessorKey: "data",
    header: "데이터",
    cell: ({ row }) => (
      <span className="block max-w-[220px] truncate font-mono text-xs text-gray-600">
        {row.original.data}
      </span>
    ),
  },
  {
    id: "copy",
    header: "",
    enableSorting: false,
    meta: { align: "right" },
    cell: () => <IconButton icon={Copy} label="복사" />,
  },
];

/* ── 섹션 3: 이벤트 / 태그 ──────────────────── */

type NameDesc = { name: string; desc: string };

const EVENT_DEFS: NameDesc[] = [
  { name: "@first_session", desc: "(기본) 플레어레인에 기기가 처음 등록되었을 때" },
  { name: "@session_start", desc: "(기본) 세션이 시작되었을 때" },
  { name: "막걸리", desc: "구매 이벤트" },
  { name: "장바구니에 상품 등록", desc: "(데이터 연동되어 자동 추가됨)" },
  { name: "@iam_displayed", desc: "(기본) 인앱 메시지가 표시되었을 때" },
  { name: "회원가입 완료", desc: "(데이터 연동되어 자동 추가됨)" },
  { name: "결제 완료", desc: "결제가 완료되었을 때" },
];

const TAG_DEFS: NameDesc[] = [
  { name: "콩", desc: "(데이터 연동되어 자동 추가됨)" },
  { name: "감자", desc: "(데이터 연동되어 자동 추가됨)" },
  { name: "과일", desc: "과일" },
  { name: "성별", desc: "(데이터 연동되어 자동 추가됨)" },
  { name: "지역", desc: "123" },
  { name: "age", desc: "(데이터 연동되어 자동 추가됨)" },
  { name: "vip", desc: "VIP 등급 여부" },
];

const manageColumns: ColumnDef<NameDesc>[] = [
  {
    accessorKey: "name",
    header: "이름",
    cell: ({ row }) => (
      <button className="text-link hover:underline">{row.original.name}</button>
    ),
  },
  {
    accessorKey: "desc",
    header: "설명",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.desc}</span>
    ),
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    meta: { align: "right" },
    cell: () => <RowActionMenu items={MANAGE_ACTIONS} />,
  },
];

function ManageCard({
  title,
  data,
}: {
  title: string;
  data: NameDesc[];
}) {
  return (
    <SectionCard
      title={title}
      actions={
        <>
          <Button variant="ghost" size="sm" className="text-gray-500">
            <Eye className="size-4" />
            숨긴 항목 보기
          </Button>
          <Button size="sm">
            <Plus className="size-[17px]" />
            추가
          </Button>
        </>
      }
    >
      <DataTable columns={manageColumns} data={data} enablePagination={false} />
    </SectionCard>
  );
}

/* ── 페이지 ──────────────────────────────────── */

export default function DataManagementPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="고객 데이터 연동"
        hint="유입되는 이벤트와 이벤트/태그 정의를 관리합니다"
      />

      {/* 섹션 1 — 최근 이벤트 */}
      <SectionCard
        title="최근 이벤트"
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Select defaultValue="userId">
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="userId">유저 ID</SelectItem>
                <SelectItem value="deviceId">기기 ID</SelectItem>
                <SelectItem value="eventId">이벤트 ID</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="ID" className="w-32" />
            <Input placeholder="Event Type" className="w-36" />
            <DateRangePicker
              label=""
              defaultStart="2026-05-28"
              defaultEnd="2026-06-04"
            />
            <IconButton
              icon={ArrowClockwise}
              label="새로고침"
              className="size-[var(--control-height)] rounded-lg"
            />
          </div>
        }
      >
        <div className="mb-3 flex justify-end">
          <Button variant="ghost" size="sm" className="text-link">
            <DownloadSimple className="size-4" />
            CSV로 내보내기
          </Button>
        </div>
        {/* 약 7행 고정 세로 스크롤 */}
        <div className="max-h-[384px] overflow-y-auto">
          <DataTable
            columns={eventColumns}
            data={EVENTS}
            enablePagination={false}
          />
        </div>
      </SectionCard>

      {/* 섹션 2 — 이벤트 내보내기 상태 바 */}
      <div className="bg-surface border-border flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="text-title text-sm font-semibold">
            이벤트 내보내기
          </span>
          <StatusBadge tone="success" dot>
            활성화
          </StatusBadge>
        </div>
        <span className="h-5 w-px bg-border" />
        <div className="text-sm">
          <span className="text-muted-foreground">최근 내보내기 </span>
          <span className="text-body tabular-nums">2026.06.01 19:02:04</span>
        </div>
        <span className="h-5 w-px bg-border" />
        <div className="text-sm">
          <span className="text-muted-foreground">내보내는 이벤트 개수 </span>
          <span className="text-body tabular-nums">24</span>
        </div>
        <Button variant="outline" size="sm" className="ml-auto">
          설정
        </Button>
      </div>

      {/* 섹션 3 — 이벤트 / 태그 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ManageCard title="이벤트" data={EVENT_DEFS} />
        <ManageCard title="태그" data={TAG_DEFS} />
      </div>
    </div>
  );
}
