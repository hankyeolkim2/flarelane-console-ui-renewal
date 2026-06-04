"use client";

import * as React from "react";
import {
  Plus,
  CaretDown,
  PencilSimple,
  Copy,
  Pause,
  Trash,
  ChatCenteredText,
  ChatDots,
  ChatCircle,
  EnvelopeSimple,
  type Icon,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/common/page-header";
import {
  RowActionMenu,
  type RowAction,
} from "@/components/common/row-action-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/* ── 채널 ────────────────────────────────────── */

type ChannelKey = "push" | "sms" | "kakao_at" | "kakao_bm" | "email";

// 채널은 색이 아니라 아이콘으로 구분, 배지는 중성 톤으로 통일
const CHANNELS: { key: ChannelKey; label: string; icon: Icon }[] = [
  { key: "push", label: "푸시 알림", icon: ChatCenteredText },
  { key: "sms", label: "문자", icon: ChatDots },
  { key: "kakao_at", label: "카카오 알림톡", icon: ChatCircle },
  { key: "kakao_bm", label: "카카오 브랜드메시지", icon: ChatCircle },
  { key: "email", label: "이메일", icon: EnvelopeSimple },
];
const CHANNEL = Object.fromEntries(CHANNELS.map((c) => [c.key, c])) as Record<
  ChannelKey,
  (typeof CHANNELS)[number]
>;

/* ── 더미 데이터 ─────────────────────────────── */

type Metric = { label: string; value: string };
type Recurring = {
  channel: ChannelKey;
  campaign: string;
  title: string;
  content: string;
  period: { text: string; danger?: boolean };
  metrics: Metric[]; // 6개 (2행 x 3열)
};

const ITEMS: Recurring[] = [
  {
    channel: "kakao_at",
    campaign: "8월 재구매 유도 알림톡",
    title: "[재구매] 단골 고객님 감사 쿠폰 도착",
    content: "지난 구매 감사합니다. 재구매 시 15% 할인 혜택을 드려요.",
    period: { text: "기간 만료: ~ 2025.08.29", danger: true },
    metrics: [
      { label: "반복 주기", value: "매일 15:10 (Asia/Seoul)" },
      { label: "전체 유저", value: "12,840" },
      { label: "발송 유저", value: "11,920" },
      { label: "발송 종료일", value: "2025.08.29" },
      { label: "전환 유저", value: "312" },
      { label: "ROAS", value: "420%" },
    ],
  },
  {
    channel: "push",
    campaign: "주간 인기 상품 추천",
    title: "이번 주 가장 많이 담은 상품 🔥",
    content: "지금 인기 급상승 상품을 확인하세요.",
    period: { text: "다음 발송 일정: 2026.06.09 09:00" },
    metrics: [
      { label: "반복 주기", value: "매주 월 09:00 (Asia/Seoul)" },
      { label: "발송", value: "48,210" },
      { label: "클릭", value: "6,540" },
      { label: "발송 종료일", value: "무기한" },
      { label: "전환", value: "418" },
      { label: "구매 총액", value: "₩9,360,000" },
    ],
  },
  {
    channel: "sms",
    campaign: "휴면 고객 리마인드 문자",
    title: "[안내] 오랜만이에요, 특별 혜택이 도착했어요",
    content: "30일간 미접속 고객 대상 재방문 유도 메시지입니다.",
    period: { text: "다음 발송 일정: 2026.06.10 11:00" },
    metrics: [
      { label: "반복 주기", value: "매월 1일 11:00 (Asia/Seoul)" },
      { label: "발송", value: "3,200" },
      { label: "클릭", value: "210" },
      { label: "발송 종료일", value: "무기한" },
      { label: "전환", value: "26" },
      { label: "구매 총액", value: "₩1,040,000" },
    ],
  },
  {
    channel: "kakao_bm",
    campaign: "신상품 출시 브랜드메시지",
    title: "✨ 2026 F/W 신상 컬렉션 오픈",
    content: "한정 수량 사전 예약 혜택을 지금 만나보세요.",
    period: { text: "기간 만료: ~ 2026.07.15", danger: true },
    metrics: [
      { label: "반복 주기", value: "매일 20:00 (Asia/Seoul)" },
      { label: "전체 유저", value: "21,450" },
      { label: "발송 유저", value: "20,880" },
      { label: "발송 종료일", value: "2026.07.15" },
      { label: "전환 유저", value: "540" },
      { label: "ROAS", value: "610%" },
    ],
  },
];

const TABS = [
  { key: "active", label: "활성화", count: 4 },
  { key: "paused", label: "일시중지", count: 37 },
  { key: "draft", label: "임시저장", count: 2 },
  { key: "archived", label: "아카이브됨", count: 0 },
] as const;

const ROW_ACTIONS: RowAction[] = [
  { label: "수정", icon: PencilSimple },
  { label: "복제", icon: Copy },
  { label: "일시중지", icon: Pause },
  { label: "삭제", icon: Trash, danger: true },
];

/* ── 페이지 ──────────────────────────────────── */

export default function RecurringMessagesPage() {
  const [tab, setTab] = React.useState<(typeof TABS)[number]["key"]>("active");
  const [channels, setChannels] = React.useState<Record<ChannelKey, boolean>>({
    push: true,
    sms: true,
    kakao_at: true,
    kakao_bm: true,
    email: true,
  });

  const list =
    tab === "active" ? ITEMS.filter((it) => channels[it.channel]) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="반복 발송 메시지"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button>
                  <Plus className="size-[17px]" />새 반복 발송 메시지
                  <CaretDown className="size-3.5" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                {CHANNELS.map((c) => (
                  <DropdownMenuItem key={c.key}>{c.label}</DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* 상단 영역: 채널 필터 + 탭 */}
      <div className="space-y-4">
        {/* 채널 필터 */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-body text-sm font-medium">채널</span>
          {CHANNELS.map((c) => (
            <label
              key={c.key}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={channels[c.key]}
                onCheckedChange={(v) =>
                  setChannels((prev) => ({ ...prev, [c.key]: Boolean(v) }))
                }
              />
              <span className="text-body">{c.label}</span>
            </label>
          ))}
        </div>

        {/* 탭 */}
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
      </div>

      {/* 카드 리스트 (바깥 카드 없이 각 항목 카드) */}
      {list.length ? (
        <div className="space-y-3">
          {list.map((it, i) => {
            const ch = CHANNEL[it.channel];
            return (
              <div
                key={i}
                className="bg-surface border-border rounded-lg border p-5 transition-colors hover:border-gray-300"
              >
                <div className="flex gap-5">
                  {/* 맨 좌측: 상태 (세로 중앙 정렬) */}
                  <div className="flex w-20 shrink-0 items-center">
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="bg-success size-1.5 rounded-full" />
                      활성화
                    </span>
                  </div>

                  {/* 내용: 채널 → 이름 → 제목 → 내용 → 기간 */}
                  <div className="min-w-0 flex-1 space-y-1">
                    {/* 채널 (아이콘 + 이름) */}
                    <div className="text-xs">
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        <ch.icon className="size-3.5 shrink-0" />
                        {ch.label}
                      </span>
                    </div>
                    <p className="text-title font-semibold">{it.campaign}</p>
                    <p className="text-link truncate text-sm">{it.title}</p>
                    <p className="text-body truncate text-sm">{it.content}</p>
                    <p
                      className={cn(
                        "pt-1 text-xs",
                        it.period.danger
                          ? "text-danger"
                          : "text-muted-foreground",
                      )}
                    >
                      {it.period.text}
                    </p>
                  </div>

                  {/* 우: 지표 그리드 — 카드 높이 기준 세로 중앙 정렬 */}
                  <div className="shrink-0 self-center">
                    <div className="grid grid-cols-[11rem_6rem_8rem] gap-x-6 gap-y-3">
                      {it.metrics.map((m) => (
                        <div key={m.label} className="min-w-0">
                          <p className="text-muted-foreground truncate text-xs">
                            {m.label}
                          </p>
                          <p className="text-title truncate text-sm font-medium tabular-nums">
                            {m.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ⋯ */}
                  <div className="shrink-0">
                    <RowActionMenu items={ROW_ACTIONS} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border-border text-muted-foreground rounded-lg border border-dashed py-16 text-center text-sm">
          데이터가 없습니다
        </div>
      )}
    </div>
  );
}
