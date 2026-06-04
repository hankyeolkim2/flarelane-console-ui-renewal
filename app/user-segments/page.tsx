"use client";

import { Plus, User, Copy, PencilSimple, Trash } from "@phosphor-icons/react";
import { PageHeader } from "@/components/common/page-header";
import { RowActionMenu, type RowAction } from "@/components/common/row-action-menu";
import { Button } from "@/components/ui/button";

/* ── 더미 데이터 ─────────────────────────────── */

type Condition = { key: string; rest: string };
type Segment = {
  name: string;
  users: number;
  conditions: Condition[];
  sync?: string;
};

const SEGMENTS: Segment[] = [
  { name: "124124", users: 0, conditions: [{ key: "태그 감자", rest: "= 44" }] },
  {
    name: "414",
    users: 0,
    conditions: [{ key: "태그 지역", rest: "= Seoul, Incheon, Busan" }],
  },
  { name: "ㅁㅇㄴㄹ", users: 9, conditions: [{ key: "전화번호", rest: "가 존재하면" }] },
  {
    name: "유저 세그먼트",
    users: 26,
    conditions: [{ key: "전화번호", rest: "가 존재하지 않으면" }],
  },
  {
    name: "유저 인크루드",
    users: 0,
    conditions: [
      { key: "유저 ID", rest: "= jhpark" },
      { key: "태그 과일", rest: "이 중에 하나 사과, 바나나, 키위" },
    ],
  },
  {
    name: "이벤트 테스트 v1",
    users: 0,
    conditions: [
      { key: "이벤트", rest: "최근 1시간 이내, 다음 테스트이벤트 ≥ 1회 발생" },
    ],
    sync: "64분 전 동기화됨",
  },
  {
    name: "신규 가입자",
    users: 152,
    conditions: [
      { key: "이벤트", rest: "최근 7일 이내, 회원가입 완료 ≥ 1회 발생" },
    ],
    sync: "5분 전 동기화됨",
  },
  { name: "VIP 고객", users: 38, conditions: [{ key: "태그 vip", rest: "= true" }] },
  { name: "전체 유저 (조건 없음)", users: 1284, conditions: [] },
];

/* ── 더보기 메뉴 항목 ────────────────────────── */

const SEGMENT_ACTIONS: RowAction[] = [
  { label: "유저 정보", icon: User },
  { label: "복제", icon: Copy },
  { label: "수정", icon: PencilSimple },
  { label: "삭제", icon: Trash, danger: true },
];

/* ── 페이지 ──────────────────────────────────── */

export default function UserSegmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="세그먼트"
        hint="조건으로 유저 그룹을 정의해 타겟팅에 사용합니다"
        actions={
          <Button>
            <Plus className="size-[17px]" />새 세그먼트
          </Button>
        }
      />

      {/* 세그먼트 카드 목록 (바깥 카드 없이 각 카드를 페이지에 직접) */}
      <div className="space-y-4">
        {SEGMENTS.map((seg) => {
          const hasDetail = seg.conditions.length > 0;
          return (
            <div
              key={seg.name}
              className="bg-surface border-border rounded-lg border"
            >
              {/* 상단(헤더) */}
              <div className="flex items-center gap-2 px-4 py-3">
                <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-500">
                  ID
                </span>
                <span className="text-title min-w-0 flex-1 truncate font-medium">
                  {seg.name}
                </span>
                <span className="text-body text-sm tabular-nums">
                  {seg.users}
                </span>
                <RowActionMenu items={SEGMENT_ACTIONS} />
              </div>

              {/* 가로 디바이더 + 하단(상세) — 조건 있을 때만 */}
              {hasDetail && (
                <>
                  <div className="border-border border-t" />
                  <div className="px-4 py-3">
                    {seg.sync && (
                      <span className="float-right text-xs text-gray-400">
                        {seg.sync}
                      </span>
                    )}
                    <div className="space-y-1">
                      {seg.conditions.map((c, i) => (
                        <p key={i} className="text-sm">
                          <span className="text-title font-semibold">
                            {c.key}
                          </span>{" "}
                          <span className="text-link">{c.rest}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
