"use client";

import * as React from "react";
import {
  Copy,
  Question,
  ShieldCheck,
  Shield,
  UserCircle,
  UserGear,
  PaperPlaneTilt,
  SignOut,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable, type ColumnDef } from "@/components/common/data-table";
import {
  RowActionMenu,
  type RowAction,
} from "@/components/common/row-action-menu";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

/* ── 작은 조각 ───────────────────────────────── */

function HelpHint({ text }: { text: string }) {
  return (
    <span title={text} className="inline-flex cursor-help">
      <Question className="size-3.5 text-gray-400" weight="bold" />
    </span>
  );
}

function IconButton({
  icon: Icon,
  label,
}: {
  icon: typeof Copy;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="hover:bg-overlay-hover inline-flex size-9 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors"
    >
      <Icon className="size-4" />
    </button>
  );
}

/** 연한 회색 박스 (설정 값 표시용) */
function AccentBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border rounded-md border bg-gray-50 p-4 text-sm">
      {children}
    </div>
  );
}

/**
 * <SettingCard> — "제목 + 내용 / 우측 하단 수정 버튼" 설정 카드 공통 패턴.
 * 프로젝트 설정 페이지의 카드 1~4 가 공유.
 */
function SettingCard({
  title,
  actions,
  children,
  editVariant = "outline",
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  editVariant?: "default" | "outline";
}) {
  return (
    <SectionCard title={title} actions={actions}>
      <div className="space-y-4">{children}</div>
      <div className="mt-5 flex justify-end">
        <Button variant={editVariant} size="sm">
          수정
        </Button>
      </div>
    </SectionCard>
  );
}

/**
 * 미설정/설정 같은 2지선다 라디오 + (두번째 선택 시) 상세 박스 패턴.
 * 카드 2~4 가 공유.
 */
function ChoiceSetting({
  title,
  options,
  defaultValue,
  detail,
}: {
  title: string;
  options: [{ v: string; l: string }, { v: string; l: string }];
  defaultValue: string;
  detail: React.ReactNode;
}) {
  const [val, setVal] = React.useState(defaultValue);
  return (
    <SettingCard title={title}>
      <RadioGroup
        value={val}
        onValueChange={(v) => setVal(v as string)}
        className="gap-3"
      >
        {options.map((o) => (
          <label
            key={o.v}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <RadioGroupItem value={o.v} />
            <span className="text-body">{o.l}</span>
          </label>
        ))}
      </RadioGroup>
      {val === options[1].v && detail && <AccentBox>{detail}</AccentBox>}
    </SettingCard>
  );
}

/* ── 카드 5: 멤버 더미 ───────────────────────── */

type Member = {
  email: string;
  pending?: boolean;
  role: "관리자" | "멤버";
  twofa: boolean;
  joined: string;
};

const MEMBERS: Member[] = [
  { email: "hankyeol@flarelane.demo", role: "관리자", twofa: true, joined: "2024-03-12" },
  { email: "jiwon.park@flarelane.demo", role: "관리자", twofa: true, joined: "2024-05-21" },
  { email: "seoyeon.kim@flarelane.demo", role: "멤버", twofa: false, joined: "2024-08-03" },
  { email: "minho.lee@flarelane.demo", role: "멤버", twofa: true, joined: "2024-09-17" },
  { email: "yuna.choi@flarelane.demo", role: "멤버", twofa: false, joined: "2024-11-02" },
  { email: "junseo.kang@flarelane.demo", role: "멤버", twofa: true, joined: "2025-01-14" },
  { email: "dahye.jung@flarelane.demo", role: "멤버", twofa: false, joined: "2025-02-28" },
  { email: "woojin.han@flarelane.demo", role: "관리자", twofa: true, joined: "2025-03-19" },
  { email: "soyoung.oh@flarelane.demo", role: "멤버", twofa: true, joined: "2025-04-22" },
  { email: "taeyang.shin@flarelane.demo", pending: true, role: "멤버", twofa: false, joined: "2025-05-30" },
  { email: "haeun.yoon@flarelane.demo", role: "멤버", twofa: false, joined: "2025-06-08" },
  { email: "jihu.moon@flarelane.demo", pending: true, role: "멤버", twofa: false, joined: "2026-01-11" },
  { email: "narae.seo@flarelane.demo", role: "멤버", twofa: true, joined: "2026-03-04" },
];

const MEMBER_ACTIONS: RowAction[] = [
  { label: "역할 변경", icon: UserGear },
  { label: "재초대", icon: PaperPlaneTilt },
  { label: "내보내기", icon: SignOut, danger: true },
];

const memberColumns: ColumnDef<Member>[] = [
  {
    accessorKey: "email",
    header: "이메일",
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <UserCircle className="size-6 shrink-0 text-gray-300" weight="fill" />
        <span className="text-body">{row.original.email}</span>
        {row.original.pending && (
          <StatusBadge tone="warning">대기중</StatusBadge>
        )}
      </div>
    ),
  },
  { accessorKey: "role", header: "역할" },
  {
    accessorKey: "twofa",
    header: "2차 인증",
    cell: ({ row }) =>
      row.original.twofa ? (
        <span className="text-success inline-flex items-center gap-1.5 text-sm">
          <ShieldCheck className="size-4" weight="fill" />
          활성화
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
          <Shield className="size-4" />
          비활성
        </span>
      ),
  },
  {
    accessorKey: "joined",
    header: "등록일",
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">
        {row.original.joined}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    meta: { align: "right" },
    cell: () => <RowActionMenu items={MEMBER_ACTIONS} />,
  },
];

/* ── 페이지 ──────────────────────────────────── */

export default function ProjectPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="프로젝트 설정" />

      {/* 카드 1 — 프로젝트 */}
      <SectionCard
        title={
          <span className="flex items-center gap-2">
            프로젝트
            <StatusBadge tone="brand">ENTERPRISE</StatusBadge>
          </span>
        }
        actions={
          <button className="text-link text-sm hover:underline">
            고급 설정
          </button>
        }
      >
        <div className="space-y-5">
          {/* 프로젝트명 + 시간대 */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-navy-50 text-navy-600 flex size-10 items-center justify-center rounded-lg text-sm font-semibold">
                플
              </span>
              <span className="text-title text-base font-semibold">
                플레어레인 데모
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground inline-flex items-center gap-1">
                대체 시간대 <HelpHint text="예약 발송 등에 사용되는 기준 시간대" />
              </span>{" "}
              <span className="text-body">(GMT+09:00) Asia/Seoul</span>
            </div>
          </div>

          {/* 프로젝트 ID */}
          <div className="space-y-1.5">
            <label className="text-body inline-flex items-center gap-1 text-sm font-medium">
              프로젝트 ID <HelpHint text="API 호출 시 사용하는 프로젝트 식별자" />
            </label>
            <div className="flex max-w-md items-center gap-2">
              <div className="border-input flex h-9 flex-1 items-center rounded-md border bg-gray-50 px-3">
                <span className="truncate font-mono text-sm text-gray-600">
                  3f2a9c10-7b04-4e6a-9c1f-2a8e5b0c4d77
                </span>
              </div>
              <IconButton icon={Copy} label="프로젝트 ID 복사" />
            </div>
          </div>

          {/* APIKEY */}
          <div className="space-y-1.5">
            <label className="text-body inline-flex items-center gap-1 text-sm font-medium">
              APIKEY <HelpHint text="서버 API 인증에 사용하는 비밀 키" />
            </label>
            <div className="flex max-w-md items-center gap-2">
              <div className="border-input flex h-9 flex-1 items-center rounded-md border bg-gray-50 px-3">
                <span className="font-mono text-sm tracking-widest text-gray-600">
                  ••••••••••••••••••••••••
                </span>
              </div>
              <IconButton icon={Copy} label="APIKEY 복사" />
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button size="sm">수정</Button>
        </div>
      </SectionCard>

      {/* 카드 2 — 구매 전환 이벤트 */}
      <ChoiceSetting
        title="구매 전환 이벤트"
        options={[
          { v: "off", l: "미설정" },
          { v: "on", l: "설정" },
        ]}
        defaultValue="on"
        detail={
          <table className="w-full">
            <thead>
              <tr className="text-muted-foreground text-left text-xs">
                <th className="pb-2 font-medium">이벤트</th>
                <th className="pb-2 font-medium">금액 데이터</th>
                <th className="pb-2 font-medium">수량 데이터</th>
                <th className="pb-2 font-medium">통화</th>
                <th className="pb-2 font-medium">기여 기간</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-body tabular-nums">
                <td className="font-mono text-xs">purchase</td>
                <td className="font-mono text-xs">price</td>
                <td className="font-mono text-xs">count</td>
                <td>KRW</td>
                <td>3일</td>
              </tr>
            </tbody>
          </table>
        }
      />

      {/* 카드 3 — 메시지 발송 빈도 제한 */}
      <ChoiceSetting
        title="메시지 발송 빈도 제한"
        options={[
          { v: "unlimited", l: "무제한 발송" },
          { v: "limit", l: "유저별 발송 빈도 제한 설정" },
        ]}
        defaultValue="limit"
        detail={
          <span className="text-body">
            1일 동안 최대 30개의 메시지를 수신합니다.
          </span>
        }
      />

      {/* 카드 4 — 메시지 발송 속도 제한 */}
      <ChoiceSetting
        title="메시지 발송 속도 제한"
        options={[
          { v: "fast", l: "최대한 빠르게 발송" },
          { v: "limit", l: "발송 속도 제한 설정" },
        ]}
        defaultValue="limit"
        detail={
          <span className="text-body">
            분당 1,000,000개의 메시지를 발송합니다.
          </span>
        }
      />

      {/* 카드 5 — 멤버 */}
      <SectionCard
        title="멤버"
        actions={
          <>
            <Button variant="outline" size="sm">
              멤버 권한 설정
            </Button>
            <Button variant="outline" size="sm">
              콘솔 이용 기록
            </Button>
            <Button size="sm">초대하기</Button>
          </>
        }
      >
        <DataTable columns={memberColumns} data={MEMBERS} pageSize={10} />
      </SectionCard>
    </div>
  );
}
