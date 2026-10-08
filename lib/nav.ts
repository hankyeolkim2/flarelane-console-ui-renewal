// 사이드바 메뉴 — 스테이징 콘솔 메뉴 · 주소 그대로.
export type NavLeaf = { label: string; href: string };
export type NavItem = { label: string; icon: string; href?: string; children?: NavLeaf[] };
export type NavSection = { heading: string; items: NavItem[] };

const messageMenu = (base: string, templates: boolean): NavLeaf[] => [
  { label: '새 메시지', href: `/${base}/new-message` },
  ...(templates ? [{ label: '템플릿', href: `/${base}/templates` }] : []),
  { label: '보낸 메시지', href: `/${base}/sent-history` },
  { label: '예약된 메시지', href: `/${base}/scheduled-messages` },
];

export const nav: NavSection[] = [
  {
    heading: '데이터 리포트',
    items: [
      { label: '기기 및 발송 현황', icon: 'dashboard', href: '/dashboard' },
      { label: '분석 보드', icon: 'insert_chart', href: '/analytics-boards' },
    ],
  },
  {
    heading: '자동화 메시지',
    items: [
      { label: '고객 여정 자동화', icon: 'account_tree', href: '/journeys' },
      { label: '반복 발송 메시지', icon: 'autorenew', href: '/recurring-messages' },
    ],
  },
  {
    heading: '채널',
    items: [
      { label: '푸시 알림', icon: 'tooltip_2', children: messageMenu('push', true) },
      { label: '카카오 알림톡', icon: 'kakao_chat', children: messageMenu('alimtalk', true) },
      { label: '카카오 브랜드 메시지', icon: 'kakao_chat', children: messageMenu('friendtalk', false) },
      { label: '문자', icon: 'sms', children: messageMenu('sms', false) },
      { label: '이메일', icon: 'mail', children: messageMenu('email', true) },
      { label: '인앱메시지(팝업)', icon: 'mobile_text_2', href: '/in-app' },
    ],
  },
  {
    heading: '대상',
    items: [
      {
        label: '유저',
        icon: 'user_attributes',
        children: [
          { label: '전체 유저', href: '/all-users' },
          { label: '세그먼트', href: '/user-segments' },
        ],
      },
      {
        label: '기기',
        icon: 'devices',
        children: [
          { label: '전체 기기', href: '/all-devices' },
          { label: '세그먼트', href: '/segments' },
          { label: '테스트 기기', href: '/test-devices' },
        ],
      },
    ],
  },
  {
    heading: '설정',
    items: [
      { label: '프로젝트', icon: 'folder_open', href: '/project' },
      { label: '고객 데이터 연동', icon: 'database', href: '/data-management' },
      { label: '채널', icon: 'data_table', href: '/channel' },
      { label: '결제', icon: 'credit_card', href: '/billing' },
      {
        label: '실험실',
        icon: 'science',
        children: [
          { label: '캘린더', href: '/labs/calendar' },
          { label: 'AI 에이전트', href: '/labs/ai-agent' },
          { label: 'AI 세그먼트', href: '/labs/ai-segment' },
        ],
      },
    ],
  },
];

const isUnder = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

// 현재 주소에 맞는 메뉴 찾기 (페이지 제목 · 사이드바 선택 표시에 씀)
export function findNav(path: string) {
  for (const section of nav) {
    for (const item of section.items) {
      if (item.href && isUnder(path, item.href)) return { item, leaf: undefined };
      const leaf = item.children?.find((c) => isUnder(path, c.href));
      if (leaf) return { item, leaf };
    }
  }
  return undefined;
}

export { isUnder };
