"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CaretDown,
  CaretUp,
  CaretUpDown,
  Globe,
  SidebarSimple,
  ShieldCheck,
  BellSimple,
  Headset,
  FileText,
  SignOut,
  Check,
  Question,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { NAV, BUILT_ROUTES, type NavItem } from "./nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PROJECT_NAME = "플레어레인 데모";
const STORAGE_KEY = "sidebar-collapsed";

const ROW_INACTIVE = "text-gray-700 hover:bg-overlay-hover";
const ROW_ACTIVE =
  "bg-sidebar-primary text-sidebar-primary-foreground font-medium";

function rowClass(active: boolean, collapsed: boolean, disabled = false) {
  return cn(
    "group flex items-center rounded-md transition-colors",
    collapsed
      ? "mx-auto size-10 justify-center"
      : "w-full gap-2.5 px-2.5 py-2 text-sm",
    disabled
      ? "cursor-not-allowed text-gray-300"
      : active
        ? ROW_ACTIVE
        : ROW_INACTIVE,
  );
}

function iconClass(active: boolean, disabled = false) {
  return cn(
    "size-[18px] shrink-0 transition-colors",
    active
      ? "text-sidebar-primary-foreground"
      : disabled
        ? "text-gray-300"
        : "text-gray-500",
  );
}

/** 접힘 상태일 때만 자식을 우측 툴팁으로 감싼다 */
function ItemTooltip({
  collapsed,
  label,
  children,
}: {
  collapsed: boolean;
  label: string;
  children: React.ReactElement;
}) {
  if (!collapsed) return children;
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [twofa, setTwofa] = React.useState(true);
  const [marketing, setMarketing] = React.useState(false);
  const [language, setLanguage] = React.useState<"ko" | "en">("ko");

  const isChildActive = (item: NavItem) =>
    item.children?.some((c) => pathname === c.href) ?? false;

  // 활성 하위 항목을 가진 아코디언은 기본으로 펼침
  const [open, setOpen] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const group of NAV)
      for (const item of group.items)
        if (item.children && item.children.some((c) => pathname === c.href))
          init[item.label] = true;
    return init;
  });

  // 접힘 상태 복원/저장 (페이지 이동해도 유지)
  React.useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    setMounted(true);
  }, []);
  React.useEffect(() => {
    if (mounted) localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed, mounted]);

  const toggleAccordion = (label: string) =>
    setOpen((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground border-sidebar-border flex h-screen shrink-0 flex-col border-r transition-[width] duration-200 ease-in-out",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* 로고 + 토글 */}
        <div
          className={cn(
            "flex h-14 items-center",
            collapsed ? "justify-center px-0" : "justify-between px-4",
          )}
        >
          {!collapsed && (
            <Image
              src="/dark.svg"
              alt="FlareLane"
              width={136}
              height={28}
              priority
              className="h-[22px] w-auto"
            />
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
            className="hover:bg-overlay-hover flex size-8 items-center justify-center rounded-md text-gray-500 transition-colors"
          >
            <SidebarSimple className="size-5" />
          </button>
        </div>

        {/* 프로젝트 선택 */}
        <div className={cn("pb-3", collapsed ? "px-3" : "px-3")}>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "hover:bg-overlay-hover flex items-center rounded-md transition-colors outline-none",
                collapsed
                  ? "mx-auto size-10 justify-center"
                  : "border-border w-full gap-2 border px-2.5 py-1.5 text-left",
              )}
            >
              <span className="bg-primary flex size-6 shrink-0 items-center justify-center rounded text-xs font-semibold text-white">
                J
              </span>
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] leading-tight font-medium text-gray-400">
                      Project
                    </span>
                    <span className="text-body block truncate text-xs font-medium">
                      {PROJECT_NAME}
                    </span>
                  </span>
                  <CaretUpDown className="size-3.5 shrink-0 text-gray-400" />
                </>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              <DropdownMenuGroup>
                <DropdownMenuLabel>프로젝트 전환</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>{PROJECT_NAME}</DropdownMenuItem>
                <DropdownMenuItem className="text-muted-foreground">
                  + 새 프로젝트
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 메뉴 */}
        <nav className="scrollbar-none flex-1 space-y-5 overflow-y-auto px-3 py-2">
          {NAV.map((group, i) => (
            <div key={group.label ?? `g-${i}`} className="space-y-1">
              {group.label && !collapsed && (
                <p className="px-2.5 pb-1 text-[11px] font-medium tracking-wide text-gray-400 uppercase">
                  {group.label}
                </p>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;

                // 단일 메뉴 (하위 없음)
                if (!item.children) {
                  const active = pathname === item.href;
                  const built = !!item.href && BUILT_ROUTES.has(item.href);

                  // 미구현 → disabled (이동 불가, 회색)
                  if (!built) {
                    return (
                      <ItemTooltip
                        key={item.label}
                        collapsed={collapsed}
                        label={`${item.label} · 준비 중`}
                      >
                        <div
                          aria-disabled="true"
                          title="준비 중"
                          className={rowClass(false, collapsed, true)}
                        >
                          <Icon
                            weight="regular"
                            className={iconClass(false, true)}
                          />
                          {!collapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </div>
                      </ItemTooltip>
                    );
                  }

                  return (
                    <ItemTooltip
                      key={item.label}
                      collapsed={collapsed}
                      label={item.label}
                    >
                      <Link
                        href={item.href ?? "#"}
                        className={rowClass(active, collapsed)}
                      >
                        <Icon
                          weight={active ? "fill" : "regular"}
                          className={iconClass(active)}
                        />
                        {!collapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </Link>
                    </ItemTooltip>
                  );
                }

                // 아코디언 메뉴 (하위 있음)
                const expanded = open[item.label] ?? false;
                const childActive = isChildActive(item);
                // 구현된 하위가 하나도 없으면 부모도 disabled (펼침 불가)
                const parentEnabled = item.children.some((c) =>
                  BUILT_ROUTES.has(c.href),
                );

                if (!parentEnabled) {
                  return (
                    <ItemTooltip
                      key={item.label}
                      collapsed={collapsed}
                      label={`${item.label} · 준비 중`}
                    >
                      <div
                        aria-disabled="true"
                        title="준비 중"
                        className={rowClass(false, collapsed, true)}
                      >
                        <Icon weight="regular" className={iconClass(false, true)} />
                        {!collapsed && (
                          <span className="flex-1 truncate text-left">
                            {item.label}
                          </span>
                        )}
                      </div>
                    </ItemTooltip>
                  );
                }

                return (
                  <div key={item.label}>
                    <ItemTooltip collapsed={collapsed} label={item.label}>
                      <button
                        type="button"
                        onClick={() => {
                          // 접힌 상태에서 누르면 펼치면서 해당 아코디언 오픈
                          if (collapsed) {
                            setCollapsed(false);
                            setOpen((p) => ({ ...p, [item.label]: true }));
                          } else {
                            toggleAccordion(item.label);
                          }
                        }}
                        aria-expanded={expanded}
                        className={cn(
                          rowClass(false, collapsed),
                          childActive && !collapsed && "font-medium text-gray-900",
                        )}
                      >
                        <Icon
                          weight={childActive ? "fill" : "regular"}
                          className={iconClass(childActive)}
                        />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate text-left">
                              {item.label}
                            </span>
                            <CaretDown
                              className={cn(
                                "size-4 shrink-0 text-gray-400 transition-transform",
                                expanded ? "" : "-rotate-90",
                              )}
                            />
                          </>
                        )}
                      </button>
                    </ItemTooltip>

                    {!collapsed && expanded && (
                      <div className="mt-0.5 space-y-0.5 pb-1">
                        {item.children.map((child) => {
                          const cActive = pathname === child.href;
                          const cBuilt = BUILT_ROUTES.has(child.href);

                          // 미구현 하위 → disabled
                          if (!cBuilt) {
                            return (
                              <div
                                key={child.href}
                                aria-disabled="true"
                                title="준비 중"
                                className="flex cursor-not-allowed items-center rounded-md py-1.5 pr-2.5 pl-[38px] text-[13px] text-gray-300"
                              >
                                <span className="truncate">{child.label}</span>
                              </div>
                            );
                          }

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "flex items-center rounded-md py-1.5 pr-2.5 pl-[38px] text-[13px] transition-colors",
                                cActive
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                                  : "text-gray-600 hover:bg-overlay-hover hover:text-gray-700",
                              )}
                            >
                              <span className="truncate">{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* 하단: 프로필 한 줄 (나머지는 팝오버로 통합) */}
        <div className="border-sidebar-border border-t px-3 py-3">
          <Popover>
            <PopoverTrigger
              className={cn(
                "hover:bg-overlay-hover flex items-center rounded-md transition-colors outline-none",
                collapsed
                  ? "mx-auto size-10 justify-center"
                  : "w-full gap-2.5 px-2 py-1.5 text-left",
              )}
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary text-xs text-white">
                  한
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <span className="text-title flex-1 truncate text-sm">
                    한결
                  </span>
                  <CaretUp className="size-3.5 shrink-0 text-gray-400" />
                </>
              )}
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-64 gap-0 p-0">
              {/* 이름 + 이메일 */}
              <div className="px-3 py-3">
                <p className="text-title text-sm font-semibold">김한결</p>
                <p className="text-muted-foreground text-xs">
                  hk.kim@flarelane.com
                </p>
              </div>
              <div className="border-border border-t" />

              {/* 설정 토글 */}
              <div className="p-1.5">
                <div className="flex items-center gap-2 px-2 py-2">
                  <ShieldCheck className="size-4 shrink-0 text-gray-500" />
                  <span className="text-body text-sm">2차 인증</span>
                  <span title="계정 보안을 위한 2단계 인증" className="cursor-help">
                    <Question className="size-3.5 text-gray-400" weight="bold" />
                  </span>
                  <Switch
                    checked={twofa}
                    onCheckedChange={(c) => setTwofa(Boolean(c))}
                    className="ml-auto"
                  />
                </div>
                <div className="flex items-center gap-2 px-2 py-2">
                  <BellSimple className="size-4 shrink-0 text-gray-500" />
                  <span className="text-body text-sm">마케팅 정보 수신설정</span>
                  <Switch
                    checked={marketing}
                    onCheckedChange={(c) => setMarketing(Boolean(c))}
                    className="ml-auto"
                  />
                </div>
              </div>
              <div className="border-border border-t" />

              {/* 고객지원 / 가이드 문서 */}
              <div className="p-1.5">
                <a
                  href="https://www.chatbase.co/Q51RNO6u_rd1W7UiKVCy5/help"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-overlay-hover flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors"
                >
                  <Headset className="size-4 shrink-0 text-gray-500" />
                  <span className="text-body">고객지원</span>
                </a>
                <a
                  href="https://docs.flarelane.co.kr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-overlay-hover flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors"
                >
                  <FileText className="size-4 shrink-0 text-gray-500" />
                  <span className="text-body">가이드 문서</span>
                </a>
              </div>
              <div className="border-border border-t" />

              {/* 로그아웃 */}
              <div className="p-1.5">
                <button className="text-danger hover:bg-overlay-hover flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors">
                  <SignOut className="size-4 shrink-0" />
                  로그아웃
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* 언어 — 접근성상 사이드바에 독립 노출 */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "hover:bg-overlay-hover mt-1 flex items-center rounded-md text-gray-500 transition-colors outline-none",
                collapsed
                  ? "mx-auto size-10 justify-center"
                  : "w-full gap-2.5 px-2 py-1.5 text-left text-xs",
              )}
            >
              <Globe className="size-4 shrink-0" />
              {!collapsed && (
                <span>{language === "ko" ? "한국어" : "English"}</span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-40">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setLanguage("ko")}>
                  한국어
                  {language === "ko" && (
                    <Check className="text-brand ml-auto size-4" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("en")}>
                  English
                  {language === "en" && (
                    <Check className="text-brand ml-auto size-4" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
}
