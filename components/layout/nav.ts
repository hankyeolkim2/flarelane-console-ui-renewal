import {
  SquaresFour,
  TreeStructure,
  Repeat,
  ChatCenteredText,
  ChatCircle,
  ChatDots,
  EnvelopeSimple,
  DeviceMobileCamera,
  Users,
  Devices,
  FolderSimple,
  Database,
  Broadcast,
  type Icon,
} from "@phosphor-icons/react";

export type NavChild = {
  label: string;
  href: string;
};

export type NavItem = {
  label: string;
  icon: Icon;
  /** 하위 항목이 없는 단일 메뉴는 href 로 직접 이동 */
  href?: string;
  /** 하위 항목이 있으면 아코디언으로 펼쳐짐 (href 대신 children) */
  children?: NavChild[];
};

export type NavGroup = {
  /** 그룹 라벨. null 이면 라벨 없이 상단에 노출 */
  label: string | null;
  items: NavItem[];
};

/** 실제로 구현된(이동 가능한) 경로. 나머지 메뉴는 사이드바에서 disabled 처리. */
export const BUILT_ROUTES = new Set<string>([
  "/dashboard",
  "/journeys",
  "/recurring-messages",
  "/all-users",
  "/user-segments",
  "/data-management",
  "/project",
  "/push/new-message",
  "/push/sent-history",
]);

/** 채널 메뉴 공통 하위 4개 (base 경로만 바꿔 재사용) */
const channelChildren = (base: string): NavChild[] => [
  { label: "새 메시지", href: `${base}/new-message` },
  { label: "템플릿", href: `${base}/templates` },
  { label: "보낸 메시지", href: `${base}/sent-history` },
  { label: "예약된 메시지", href: `${base}/scheduled` },
];

/**
 * 사이드바 메뉴 구조. 기존 콘솔의 정보 구조를 그대로 유지한다.
 * 하위 페이지는 아직 미구현이라 링크는 임시(구조/동작 확인용).
 */
export const NAV: NavGroup[] = [
  {
    label: null,
    items: [
      { label: "대시보드", href: "/dashboard", icon: SquaresFour },
      { label: "고객 여정 자동화", href: "/journeys", icon: TreeStructure },
      { label: "반복 발송 메시지", href: "/recurring-messages", icon: Repeat },
    ],
  },
  {
    label: "채널",
    items: [
      {
        label: "푸시 알림",
        icon: ChatCenteredText,
        children: channelChildren("/push"),
      },
      {
        label: "카카오 알림톡",
        icon: ChatCircle,
        children: channelChildren("/kakao-alimtalk"),
      },
      {
        label: "카카오 브랜드메시지",
        icon: ChatCircle,
        children: channelChildren("/kakao-brand"),
      },
      { label: "문자", icon: ChatDots, children: channelChildren("/sms") },
      {
        label: "이메일",
        icon: EnvelopeSimple,
        children: channelChildren("/email"),
      },
      { label: "인앱 메시지 (팝업)", href: "/in-app", icon: DeviceMobileCamera },
    ],
  },
  {
    label: "대상",
    items: [
      {
        label: "유저",
        icon: Users,
        children: [
          { label: "세그먼트", href: "/user-segments" },
          { label: "전체 유저", href: "/all-users" },
        ],
      },
      {
        label: "기기",
        icon: Devices,
        children: [
          { label: "세그먼트", href: "/devices/segments" },
          { label: "테스트 기기", href: "/devices/test" },
          { label: "전체 기기", href: "/devices/all" },
        ],
      },
    ],
  },
  {
    label: "설정",
    items: [
      { label: "프로젝트", href: "/project", icon: FolderSimple },
      { label: "고객 데이터 연동", href: "/data-management", icon: Database },
      { label: "채널", href: "/settings/channels", icon: Broadcast },
    ],
  },
];
