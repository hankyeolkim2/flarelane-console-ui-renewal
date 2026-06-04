"use client";

import * as React from "react";
import { CalendarBlank, CaretDown, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/* ── 날짜 유틸 (YYYY-MM-DD 문자열은 사전순=시간순이라 문자열 비교 사용) ── */
const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const startOfToday = () => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const PRESETS: { label: string; range: () => { start: string; end: string } }[] =
  [
    { label: "오늘", range: () => ({ start: fmt(startOfToday()), end: fmt(startOfToday()) }) },
    { label: "어제", range: () => { const y = addDays(startOfToday(), -1); return { start: fmt(y), end: fmt(y) }; } },
    { label: "최근 7일", range: () => ({ start: fmt(addDays(startOfToday(), -6)), end: fmt(startOfToday()) }) },
    { label: "최근 30일", range: () => ({ start: fmt(addDays(startOfToday(), -29)), end: fmt(startOfToday()) }) },
    { label: "최근 90일", range: () => ({ start: fmt(addDays(startOfToday(), -89)), end: fmt(startOfToday()) }) },
    { label: "최근 1년", range: () => ({ start: fmt(addDays(startOfToday(), -364)), end: fmt(startOfToday()) }) },
  ];

type Range = { start: string; end: string };

export function DateRangePicker({
  label = "데이터 기간 필터",
  defaultStart = "2026-05-02",
  defaultEnd = "2026-06-01",
  timezone = "Asia/Seoul",
}: {
  label?: string;
  defaultStart?: string;
  defaultEnd?: string;
  timezone?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [applied, setApplied] = React.useState<Range>({
    start: defaultStart,
    end: defaultEnd,
  });
  // 편집 중 임시 값 (확인 시 applied 로 반영)
  const [draft, setDraft] = React.useState<Range>(applied);
  // 다음 클릭이 종료일을 정하는 단계인지
  const [selectingEnd, setSelectingEnd] = React.useState(false);
  const [view, setView] = React.useState<Date>(() =>
    startOfMonth(new Date(defaultStart)),
  );

  // 팝오버 열 때 draft 를 applied 와 동기화
  const onOpenChange = (v: boolean) => {
    if (v) {
      setDraft(applied);
      setSelectingEnd(false);
      setView(startOfMonth(new Date(applied.start)));
    }
    setOpen(v);
  };

  const clickDay = (d: Date) => {
    const s = fmt(d);
    if (!selectingEnd) {
      setDraft({ start: s, end: "" });
      setSelectingEnd(true);
    } else {
      if (s < draft.start) setDraft({ start: s, end: draft.start });
      else setDraft({ start: draft.start, end: s });
      setSelectingEnd(false);
    }
  };

  const applyPreset = (r: Range) => {
    setDraft(r);
    setSelectingEnd(false);
    setView(startOfMonth(new Date(r.start)));
  };

  const confirm = () => {
    // 종료일 미선택 시 시작일과 동일 처리
    const next = draft.end ? draft : { start: draft.start, end: draft.start };
    setApplied(next);
    setOpen(false);
  };

  // 6주(42칸) 그리드
  const gridStart = addDays(view, -startOfMonth(view).getDay());
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center gap-2">
        {label && <span className="text-muted-foreground text-sm">{label}</span>}
        <PopoverTrigger className="border-border hover:border-gray-300 flex h-[var(--control-height)] items-center gap-2 rounded-lg border px-3 text-sm transition-colors">
          <CalendarBlank className="size-4 text-gray-500" />
          <span className="text-body tabular-nums">
            {applied.start} ~ {applied.end}
          </span>
          <CaretDown className="size-3.5 text-gray-400" />
        </PopoverTrigger>
      </div>

      <PopoverContent align="end" className="w-auto gap-0 p-0">
        <div className="flex">
          {/* ── 왼쪽: 캘린더 ── */}
          <div className="w-[280px] p-4">
            {/* 월/연 네비 */}
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
                className="hover:bg-overlay-hover flex size-7 items-center justify-center rounded-md text-gray-500 transition-colors"
                aria-label="이전 달"
              >
                <CaretLeft className="size-4" />
              </button>
              <span className="text-title text-sm font-semibold">
                {view.getMonth() + 1}월 {view.getFullYear()}
              </span>
              <button
                onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
                className="hover:bg-overlay-hover flex size-7 items-center justify-center rounded-md text-gray-500 transition-colors"
                aria-label="다음 달"
              >
                <CaretRight className="size-4" />
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7">
              {WEEKDAYS.map((w, i) => (
                <div
                  key={w}
                  className={cn(
                    "flex h-8 items-center justify-center text-xs font-medium",
                    i === 0 ? "text-red-500" : i === 6 ? "text-navy-600" : "text-gray-400",
                  )}
                >
                  {w}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7">
              {cells.map((d) => {
                const s = fmt(d);
                const inMonth = d.getMonth() === view.getMonth();
                const isStart = s === draft.start;
                const isEnd = draft.end !== "" && s === draft.end;
                const hasRange = draft.end !== "" && draft.start !== draft.end;
                const inRange =
                  hasRange && s > draft.start && s < draft.end;
                const isEndpoint = isStart || isEnd;
                return (
                  <div
                    key={s}
                    className={cn(
                      "flex h-9 items-center justify-center",
                      // 범위 연결용 연한 배경
                      inRange && "bg-navy-50",
                      hasRange && isStart && "bg-navy-50 rounded-l-full",
                      hasRange && isEnd && "bg-navy-50 rounded-r-full",
                    )}
                  >
                    <button
                      onClick={() => clickDay(d)}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full text-sm tabular-nums transition-colors",
                        isEndpoint
                          ? "bg-navy-800 font-medium text-white"
                          : cn(
                              "hover:bg-overlay-hover",
                              inMonth ? "text-gray-700" : "text-gray-400",
                            ),
                      )}
                    >
                      {d.getDate()}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 오른쪽: 프리셋 ── */}
          <div className="border-border w-[132px] border-l p-3">
            <p className="text-muted-foreground mb-2 px-2 text-xs font-medium">
              기간설정
            </p>
            <div className="space-y-0.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p.range())}
                  className="hover:bg-overlay-hover text-body flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── 하단: 입력칸 + 버튼 ── */}
        <div className="border-border border-t p-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground shrink-0 text-xs">날짜</span>
            <Input
              value={draft.start}
              onChange={(e) => setDraft((p) => ({ ...p, start: e.target.value }))}
              className="h-8 w-[110px] text-center text-xs tabular-nums"
            />
            <span className="text-gray-400">~</span>
            <Input
              value={draft.end}
              onChange={(e) => setDraft((p) => ({ ...p, end: e.target.value }))}
              className="h-8 w-[110px] text-center text-xs tabular-nums"
            />
            <span className="ml-auto text-[11px] text-gray-400">{timezone}</span>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button size="sm" onClick={confirm}>
              확인
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
