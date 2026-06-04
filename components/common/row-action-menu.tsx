"use client";

import type { Icon } from "@phosphor-icons/react";
import { DotsThree } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type RowAction = {
  label: string;
  icon: Icon;
  onSelect?: () => void;
  /** 파괴적 액션 — danger(빨강) 색 + 일반 액션과 구분선으로 분리 */
  danger?: boolean;
};

/**
 * <RowActionMenu> — 테이블/카드 행의 ⋯ 더보기 메뉴 공통 패턴.
 * 각 항목 왼쪽 아이콘, danger 항목은 빨강 + 위에 구분선으로 일반 액션과 분리.
 * 세그먼트 / 이벤트·태그 관리 / 멤버 등 모든 행 메뉴가 공유한다.
 */
export function RowActionMenu({
  items,
  align = "end",
}: {
  items: RowAction[];
  align?: "start" | "center" | "end";
}) {
  const normal = items.filter((i) => !i.danger);
  const danger = items.filter((i) => i.danger);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="더보기"
        onClick={(e) => e.stopPropagation()}
        className="hover:bg-overlay-hover inline-flex size-7 items-center justify-center rounded-md text-gray-500 transition-colors outline-none"
      >
        <DotsThree className="size-5" weight="bold" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-40">
        <DropdownMenuGroup>
          {normal.map((a) => (
            <DropdownMenuItem key={a.label} onClick={a.onSelect}>
              <a.icon className="size-4" />
              {a.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {danger.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {danger.map((a) => (
                <DropdownMenuItem
                  key={a.label}
                  onClick={a.onSelect}
                  className="text-danger"
                >
                  <a.icon className="size-4" />
                  {a.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
