"use client";

import * as React from "react";
import {
  Sparkle,
  BracketsCurly,
  Question,
  CaretRight,
  CaretDown,
  AndroidLogo,
  AppleLogo,
  Monitor,
  DeviceMobile,
  UploadSimple,
  DownloadSimple,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/common/page-header";
import { StepCard } from "@/components/common/step-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ── 작은 조각 ───────────────────────────────── */

function HelpHint({ text }: { text: string }) {
  return (
    <span title={text} className="inline-flex cursor-help">
      <Question className="size-3.5 text-gray-400" weight="bold" />
    </span>
  );
}

/** 우측 끝 {} 변수 버튼이 달린 입력칸 (박스형) */
function VarInput({
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <div className="relative">
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 pr-10 text-sm outline-none focus-visible:ring-[3px]"
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
      )}
      <button
        type="button"
        title="변수 삽입"
        className={cn(
          "hover:bg-overlay-hover absolute right-1.5 flex size-6 items-center justify-center rounded text-gray-400 transition-colors",
          // 한 줄 input: 세로 가운데 / textarea: 우측 상단
          multiline ? "top-2" : "top-1/2 -translate-y-1/2",
        )}
      >
        <BracketsCurly className="size-4" />
      </button>
    </div>
  );
}

const TARGET_TABS = [
  { k: "segment", l: "기기 세그먼트" },
  { k: "userId", l: "유저 ID" },
  { k: "device", l: "기기" },
  { k: "file", l: "파일 업로드" },
] as const;

/* ── 플랫폼별 알림 미리보기 ─────────────────────── */

type NotifProps = { title: string; content: string };
const SITE = "junyeongchoi.github.io";

/** 앱 푸시 — Android */
function AndroidNotif({ title, content }: NotifProps) {
  return (
    <div className="bg-surface border-border rounded-xl border p-3 shadow-sm">
      <div className="mb-1.5 flex items-center gap-2">
        <div className="size-5 rounded bg-gray-300" />
        <span className="text-[11px] text-gray-500">App name · now</span>
      </div>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-title truncate text-sm font-semibold">
            {title || "제목"}
          </p>
          <p className="line-clamp-2 text-xs text-gray-600">
            {content || "내용"}
          </p>
        </div>
        <div className="size-10 shrink-0 rounded bg-gray-200" />
      </div>
    </div>
  );
}

/** 앱 푸시 — iOS (둥근 모서리 + 부드러운 그림자) */
function IosNotif({ title, content }: NotifProps) {
  return (
    <div className="rounded-2xl bg-white/95 p-3 shadow-lg backdrop-blur">
      <div className="flex gap-2.5">
        <div className="size-9 shrink-0 rounded-[10px] bg-gray-300" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
              App Name
            </span>
            <span className="text-[10px] text-gray-400">now</span>
          </div>
          <p className="text-title truncate text-sm font-semibold">
            {title || "제목"}
          </p>
          <p className="line-clamp-2 text-xs text-gray-600">
            {content || "내용"}
          </p>
        </div>
        <div className="size-10 shrink-0 rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}

/** 웹 푸시 — Windows (각진 토스트) */
function WindowsToast({ title, content }: NotifProps) {
  return (
    <div className="rounded-md border border-gray-300 bg-[#f3f3f3] p-3 shadow-md">
      <div className="flex gap-2.5">
        <div className="size-8 shrink-0 rounded bg-gray-300" />
        <div className="min-w-0 flex-1">
          <p className="text-title truncate text-sm font-semibold">
            {title || "제목"}
          </p>
          <p className="line-clamp-2 text-xs text-gray-600">
            {content || "내용"}
          </p>
          <p className="mt-1 text-[10px] text-gray-400">{SITE} · Chrome</p>
        </div>
        <div className="size-9 shrink-0 rounded bg-gray-200" />
      </div>
    </div>
  );
}

/** 웹 푸시 — macOS (둥근 + 반투명 배너) */
function MacToast({ title, content }: NotifProps) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white/90 p-3 shadow-lg backdrop-blur">
      <div className="flex gap-2.5">
        <div className="size-9 shrink-0 rounded-[10px] bg-gray-300" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] text-gray-500">{SITE}</p>
          <p className="text-title truncate text-sm font-semibold">
            {title || "제목"}
          </p>
          <p className="line-clamp-2 text-xs text-gray-600">
            {content || "내용"}
          </p>
        </div>
      </div>
    </div>
  );
}

/** 휴대폰 프레임 (앱 푸시) */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto h-[420px] w-[240px] rounded-[2rem] border-[6px] border-gray-900 bg-gradient-to-b from-gray-200 to-gray-300 p-3">
      <div className="mt-10">{children}</div>
    </div>
  );
}

/** 데스크탑 프레임 (웹 푸시) — 토스트를 모서리에 배치 */
function DesktopFrame({
  corner,
  children,
}: {
  corner: "top-right" | "bottom-right";
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto h-[260px] w-full overflow-hidden rounded-lg border border-gray-300 bg-gradient-to-br from-slate-400 to-slate-600 p-3">
      <div
        className={cn(
          "absolute w-[210px]",
          corner === "top-right" ? "top-3 right-3" : "right-3 bottom-3",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/* ── 페이지 ──────────────────────────────────── */

export default function NewMessagePage() {
  const [campaign, setCampaign] = React.useState("");
  const [targetTab, setTargetTab] =
    React.useState<(typeof TARGET_TABS)[number]["k"]>("segment");
  const [platforms, setPlatforms] = React.useState({
    aos: true,
    ios: true,
    desktop: true,
    mobile: true,
  });
  const [excludeOpen, setExcludeOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [conversion, setConversion] = React.useState("none");
  const [sendTime, setSendTime] = React.useState("now");
  const [ignoreLimit, setIgnoreLimit] = React.useState(false);
  const [previewMode, setPreviewMode] = React.useState<"app" | "web">("app");
  const [appPlatform, setAppPlatform] = React.useState<"android" | "ios">(
    "android",
  );
  const [webPlatform, setWebPlatform] = React.useState<"windows" | "macos">(
    "windows",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="새 메시지"
        actions={
          <span className="text-muted-foreground text-sm tabular-nums">
            임시 저장 0
          </span>
        }
      />

      {/* 바깥 카드 없이: 좌측 단계 카드 스택 + 우측 고정 미리보기 */}
      <div className="flex items-start gap-6">
        {/* ── 좌: 단계별 카드 ── */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* 1 캠페인 명 */}
          <StepCard n={1} title="캠페인 명">
            <Input
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="캠페인 명 (선택)"
            />
          </StepCard>

          {/* 2 대상 */}
          <StepCard n={2} title="대상" hint="메시지를 받을 대상을 선택합니다">
            <div className="border-border flex items-center gap-1 border-b">
              {TARGET_TABS.map((t) => {
                const active = targetTab === t.k;
                return (
                  <button
                    key={t.k}
                    onClick={() => setTargetTab(t.k)}
                    className={cn(
                      "-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "border-brand text-brand"
                        : "border-transparent text-gray-500 hover:text-gray-700",
                    )}
                  >
                    {t.l}
                  </button>
                );
              })}
            </div>

            {/* 기기 세그먼트 탭 */}
            {targetTab === "segment" && (
              <>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-body w-10 shrink-0 text-sm font-medium">
                    포함
                  </span>
                  <Select>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="세그먼트 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 기기</SelectItem>
                      <SelectItem value="active">활성 기기</SelectItem>
                      <SelectItem value="subscribed">알림 구독 기기</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <button
                    onClick={() => setExcludeOpen((v) => !v)}
                    className="hover:bg-overlay-hover -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-2 text-left transition-colors"
                  >
                    <span className="text-body w-10 shrink-0 text-sm font-medium">
                      제외
                    </span>
                    <span className="text-muted-foreground flex-1 text-sm">
                      제외할 대상 선택 (선택)
                    </span>
                    {excludeOpen ? (
                      <CaretDown className="size-4 text-gray-400" />
                    ) : (
                      <CaretRight className="size-4 text-gray-400" />
                    )}
                  </button>
                  {excludeOpen && (
                    <div className="flex items-center gap-3 pt-2 pl-[52px]">
                      <Select>
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="제외 세그먼트 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unsub">미구독 기기</SelectItem>
                          <SelectItem value="test">테스트 기기</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button className="text-link text-sm hover:underline">
                    고급 설정
                  </button>
                  <span className="text-muted-foreground text-sm tabular-nums">
                    추정 기기 수: 0
                  </span>
                </div>
              </>
            )}

            {/* 유저 ID 탭 */}
            {targetTab === "userId" && (
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <p className="text-body text-sm font-medium">발송 플랫폼</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border-border space-y-2.5 rounded-md border bg-gray-50 p-3">
                      <p className="text-muted-foreground text-xs">앱 푸시</p>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={platforms.aos}
                          onCheckedChange={(c) =>
                            setPlatforms((p) => ({ ...p, aos: Boolean(c) }))
                          }
                        />
                        <AndroidLogo className="size-4 text-gray-500" />
                        <span className="text-body">Android</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={platforms.ios}
                          onCheckedChange={(c) =>
                            setPlatforms((p) => ({ ...p, ios: Boolean(c) }))
                          }
                        />
                        <AppleLogo className="size-4 text-gray-500" />
                        <span className="text-body">iOS</span>
                      </label>
                    </div>
                    <div className="border-border space-y-2.5 rounded-md border bg-gray-50 p-3">
                      <p className="text-muted-foreground text-xs">웹 푸시</p>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={platforms.desktop}
                          onCheckedChange={(c) =>
                            setPlatforms((p) => ({ ...p, desktop: Boolean(c) }))
                          }
                        />
                        <Monitor className="size-4 text-gray-500" />
                        <span className="text-body">Desktop</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={platforms.mobile}
                          onCheckedChange={(c) =>
                            setPlatforms((p) => ({ ...p, mobile: Boolean(c) }))
                          }
                        />
                        <DeviceMobile className="size-4 text-gray-500" />
                        <span className="text-body">Mobile</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-body text-sm font-medium">
                    유저 ID
                  </label>
                  <Input placeholder="유저 ID 입력" />
                  <div className="flex justify-end pt-0.5">
                    <button className="text-link inline-flex items-center gap-1 text-sm hover:underline">
                      CSV 파일 업로드
                      <span title="CSV로 유저 ID를 일괄 업로드합니다">
                        <Question className="size-3.5" weight="bold" />
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 기기 탭 */}
            {targetTab === "device" && (
              <div className="space-y-1.5 pt-1">
                <Input placeholder="기기 입력" />
                <div className="flex justify-end pt-0.5">
                  <span className="text-muted-foreground text-sm tabular-nums">
                    추정 기기 수: 0
                  </span>
                </div>
              </div>
            )}

            {/* 파일 업로드 탭 */}
            {targetTab === "file" && (
              <div className="grid grid-cols-1 gap-4 pt-1 md:grid-cols-2">
                <div className="border-border hover:border-gray-300 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors">
                  <UploadSimple className="size-8 text-gray-400" />
                  <p className="text-body mt-3 text-sm">
                    이곳을 클릭하거나, 파일을 드래그해서 업로드 해주세요.
                  </p>
                  <p className="text-muted-foreground mt-1.5 text-xs">
                    지원 형식: XLSX, CSV / 최대 첨부 가능 용량 50 MB
                  </p>
                </div>
                <div className="space-y-3">
                  <a className="text-link inline-flex items-center gap-1 text-sm hover:underline">
                    파일 가이드 바로가기
                    <ArrowSquareOut className="size-3.5" />
                  </a>
                  <div className="border-border space-y-2 rounded-md border bg-gray-50 p-4">
                    <p className="text-title text-sm font-semibold">
                      샘플 파일 다운로드 TIP
                    </p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      메시지 입력 후 샘플 파일 다운로드하면 메시지 맞춤형 파일을
                      다운받을 수 있습니다.
                    </p>
                    <Button size="sm">
                      <DownloadSimple className="size-4" />
                      샘플 파일 다운로드
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </StepCard>

          {/* 3 메시지 */}
          <StepCard
            n={3}
            title="메시지"
            headerRight={
              <div className="flex items-center gap-2">
                <Button size="sm">
                  <Sparkle className="size-4" weight="fill" />
                  AI
                </Button>
                <Button variant="outline" size="sm">
                  최근 발송 메시지
                </Button>
                <Button variant="outline" size="sm">
                  템플릿 선택
                </Button>
              </div>
            }
          >
            <VarInput
              value={title}
              onChange={setTitle}
              placeholder="제목 (선택)"
            />
            <VarInput
              value={content}
              onChange={setContent}
              placeholder="내용 (필수)"
              multiline
            />
            <VarInput
              value={url}
              onChange={setUrl}
              placeholder="https://abc.com/xyz (선택)"
            />
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <span className="text-body text-sm font-medium">이미지</span>
                <Button variant="outline" size="sm">
                  업로드
                </Button>
              </div>
              <button className="text-link text-sm hover:underline">
                고급 설정
              </button>
            </div>
          </StepCard>

          {/* 4 전환 이벤트 설정 */}
          <StepCard n={4} title="전환 이벤트 설정">
            <RadioGroup
              value={conversion}
              onValueChange={(v) => setConversion(v as string)}
              className="gap-3"
            >
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <RadioGroupItem value="none" />
                <span className="text-body">미설정</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <RadioGroupItem value="set" />
                <span className="text-body">설정</span>
              </label>
            </RadioGroup>
          </StepCard>

          {/* 5 발송 설정 */}
          <StepCard n={5} title="발송 설정">
            <div className="flex items-center gap-3">
              <span className="text-body w-28 shrink-0 text-sm font-medium">
                알림 만료 기간
              </span>
              <Input defaultValue="3" className="w-16 text-center" />
              <Select defaultValue="day">
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour">시간</SelectItem>
                  <SelectItem value="day">일</SelectItem>
                  <SelectItem value="week">주</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-3 pt-2">
              <span className="text-body w-28 shrink-0 pt-1 text-sm font-medium">
                발송 시간
              </span>
              <RadioGroup
                value={sendTime}
                onValueChange={(v) => setSendTime(v as string)}
                className="gap-3"
              >
                {[
                  ["now", "지금 발송"],
                  ["schedule", "예약 발송"],
                  ["repeat", "반복 발송"],
                ].map(([v, l]) => (
                  <label
                    key={v}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <RadioGroupItem value={v} />
                    <span className="text-body">{l}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <label className="flex cursor-pointer items-center gap-2 pt-2 text-sm">
              <Checkbox
                checked={ignoreLimit}
                onCheckedChange={(c) => setIgnoreLimit(Boolean(c))}
              />
              <span className="text-body">
                현재 설정된 발송 빈도 제한 무시 (1일 동안 최대 30개 메시지)
              </span>
              <HelpHint text="이 메시지는 발송 빈도 제한에서 제외됩니다" />
            </label>
          </StepCard>

          {/* 하단 액션 — 카드들 아래, 우측 */}
          <div className="flex justify-end gap-2">
            <Button variant="outline">임시 저장</Button>
            <Button>발송</Button>
          </div>
        </div>

        {/* ── 우: 미리보기 (고정) ── */}
        <div className="bg-surface border-border sticky top-8 w-[340px] shrink-0 rounded-lg border p-6">
          <div className="mb-4 flex items-center gap-1.5">
            <h2 className="text-title text-sm font-semibold">미리보기</h2>
            <HelpHint text="실제 발송 시 기기에 표시되는 모습입니다" />
          </div>

          <div className="mb-4 flex items-center gap-2">
            <div className="border-border flex h-[var(--control-height-sm)] items-center rounded-lg border p-0.5">
              {(["app", "web"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPreviewMode(m)}
                  className={cn(
                    "h-full rounded-md px-3 text-xs font-medium transition-colors",
                    previewMode === m
                      ? "bg-brand text-white"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                >
                  {m === "app" ? "앱 푸시" : "웹 푸시"}
                </button>
              ))}
            </div>
            {previewMode === "app" ? (
              <Select
                value={appPlatform}
                onValueChange={(v) => setAppPlatform(v as "android" | "ios")}
              >
                <SelectTrigger size="sm" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="android">Android</SelectItem>
                  <SelectItem value="ios">iOS</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={webPlatform}
                onValueChange={(v) => setWebPlatform(v as "windows" | "macos")}
              >
                <SelectTrigger size="sm" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="windows">Windows</SelectItem>
                  <SelectItem value="macos">macOS</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 플랫폼별 미리보기 */}
          {previewMode === "app" ? (
            <PhoneFrame>
              {appPlatform === "android" ? (
                <AndroidNotif title={title} content={content} />
              ) : (
                <IosNotif title={title} content={content} />
              )}
            </PhoneFrame>
          ) : (
            <DesktopFrame
              corner={webPlatform === "macos" ? "top-right" : "bottom-right"}
            >
              {webPlatform === "windows" ? (
                <WindowsToast title={title} content={content} />
              ) : (
                <MacToast title={title} content={content} />
              )}
            </DesktopFrame>
          )}

          <Button variant="outline" className="mt-4 w-full">
            테스트 기기로 발송
          </Button>
        </div>
      </div>
    </div>
  );
}
