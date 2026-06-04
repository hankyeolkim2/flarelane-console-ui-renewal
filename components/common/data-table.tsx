"use client";

import * as React from "react";
import {
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type ColumnFiltersState,
  type RowData,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

/* 컬럼 정렬(align) 옵션 — 숫자/금액 컬럼 우측 정렬 등에 사용 */
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: "left" | "right" | "center";
  }
}

const alignClass = (align?: "left" | "right" | "center") =>
  align === "right" ? "text-right" : align === "center" ? "text-center" : "";
import {
  ArrowsDownUp,
  ArrowUp,
  ArrowDown,
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type { ColumnDef };

/**
 * <DataTable> — TanStack Table 기반 공통 테이블.
 * 정렬(헤더 클릭) / 전역 검색 / 페이지네이션 / 행 선택을 지원한다.
 * 모든 페이지가 이 컴포넌트 하나를 재사용한다.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  globalFilter,
  onGlobalFilterChange,
  searchColumn,
  searchPlaceholder = "검색",
  toolbarRight,
  pageSize = 10,
  enablePagination = true,
  enableRowSelection = false,
  emptyMessage = "데이터가 없습니다",
  striped = false,
  onRowClick,
  className,
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** 외부에서 검색어를 제어할 때 사용 (생략 시 내부 미사용) */
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  /** 지정 시 툴바 좌측에 검색 입력창을 렌더하고 이 컬럼 기준으로 필터링 */
  searchColumn?: string;
  searchPlaceholder?: string;
  /** 툴바 우측 영역 (기간 필터 등). searchColumn 또는 이 값이 있으면 툴바 표시 */
  toolbarRight?: React.ReactNode;
  pageSize?: number;
  enablePagination?: boolean;
  enableRowSelection?: boolean;
  emptyMessage?: string;
  /** 데이터 많고 빈 값 많은 리스트용 — 옅은 행 구분선(gray-100) + 넉넉한 행 높이 */
  striped?: boolean;
  /** 행 클릭 시 동작 (상세 페이지 이동 등). 지정 시 행에 포인터 커서 */
  onRowClick?: (row: TData) => void;
  className?: string;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
      columnFilters,
      ...(globalFilter !== undefined ? { globalFilter } : {}),
    },
    enableRowSelection,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
    initialState: { pagination: { pageSize } },
  });

  const rows = table.getRowModel().rows;

  const searchCol = searchColumn ? table.getColumn(searchColumn) : undefined;
  const searchValue = (searchCol?.getFilterValue() as string) ?? "";
  const showToolbar = Boolean(searchCol || toolbarRight);

  return (
    <div className={cn("w-full", className)}>
      {showToolbar && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {searchCol && (
              <div className="relative w-64">
                <MagnifyingGlass className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchValue}
                  onChange={(e) => searchCol.setFilterValue(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="pr-8 pl-8"
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => searchCol.setFilterValue("")}
                    aria-label="검색어 지우기"
                    className="hover:bg-overlay-hover absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 items-center justify-center rounded text-gray-400 transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
          {toolbarRight && (
            <div className="flex items-center gap-2">{toolbarRight}</div>
          )}
        </div>
      )}

      {/* 카드 없는 리스트 테이블 (Notion/Linear 방식):
          행 사이 구분선 없이 넉넉한 상하 패딩(여백)으로 행을 구분하고,
          호버는 안쪽 알약형(둥근 모서리) 틴트. 헤더 아래 구분선 한 줄만 유지.
          모든 셀 좌우 패딩 px-3(12px) 통일로 컬럼 세로 정렬 + 텍스트 여백 확보. */}
      <Table className="[&_td:first-child]:rounded-l-lg [&_td:last-child]:rounded-r-lg [&_td]:px-3 [&_th]:px-3">
        <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow
                key={hg.id}
                className="border-gray-100 hover:bg-transparent!"
              >
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const align = header.column.columnDef.meta?.align;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "text-muted-foreground h-10 text-xs font-medium",
                        alignClass(align),
                      )}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="hover:text-title -mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {sorted === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="size-3.5" />
                          ) : (
                            <ArrowsDownUp className="size-3.5 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                  className={cn(
                    // shadcn 기본 행 호버(hover:bg-muted/50)를 !important 로 끄고
                    // 셀 단위 navy 오버레이만 남김 (twMerge가 커스텀색 muted를 못 지워서 강제)
                    "group/row hover:bg-transparent! data-[state=selected]:bg-brand-subtle!",
                    onRowClick && "cursor-pointer",
                    // striped: 옅은 구분선(gray-100) + 넉넉한 행 높이 (zebra 없음)
                    striped ? "border-gray-100" : "border-0",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "text-body group-hover/row:bg-overlay-hover text-sm",
                        striped ? "py-[18px]" : "py-4",
                        alignClass(cell.column.columnDef.meta?.align),
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent!">
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-28 text-center text-sm"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

      {enablePagination && rows.length > 0 && (
        <div className="mt-3 flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            총 {table.getFilteredRowModel().rows.length}개 중{" "}
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}
            –
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length,
            )}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <CaretLeft className="size-4" />
              이전
            </Button>
            {/* 페이지 숫자 — 최대 5개, 현재 페이지 주변으로 슬라이딩, 현재=navy */}
            {(() => {
              const pageCount = table.getPageCount() || 1;
              const current = table.getState().pagination.pageIndex;
              let start = Math.max(0, current - 2);
              const end = Math.min(pageCount, start + 5);
              start = Math.max(0, end - 5);
              return Array.from({ length: end - start }, (_, k) => start + k).map(
                (p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={p === current ? "default" : "ghost"}
                    onClick={() => table.setPageIndex(p)}
                    className="w-8 tabular-nums"
                  >
                    {p + 1}
                  </Button>
                ),
              );
            })()}
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              다음
              <CaretRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
