// 세그먼트 조건 편집기용 목록 — 스테이징 /user-segments/new 에서 읽은 값(10-20) + Figma 「새 세그먼트」 예시.
// [확인됨] 태그 이름 · 설명(데이터 관리 태그 목록) · 국가 목록 앞부분(코드 + 한글 이름)
// [임시] 태그 최근 값 · 이벤트 속성 · 속성 값 — 스테이징 API(로그인 필요)에서 못 읽어 Figma 예시(grade = VIP, purchase · price · category = shoes)로 채움.

export type TagItem = { name: string; desc: string; values: string[] };

export const USER_TAGS: TagItem[] = [
  { name: 'grade', desc: '회원 등급', values: ['VIP', 'GOLD', 'SILVER', 'BRONZE'] },
  { name: '가', desc: '(데이터 연동되어 자동 추가됨)', values: ['a', 'b'] },
  { name: '나', desc: '(데이터 연동되어 자동 추가됨)', values: ['1'] },
  { name: '콩', desc: '콩자반', values: ['검은콩', '강낭콩'] },
  { name: '감자', desc: 'test', values: ['1', '2'] },
  { name: '과일', desc: '(AI Generated) 유저가 관심을 보이는 과일 또는 과일 관련 정보', values: ['사과', '바나나', '딸기'] },
  { name: '김밥', desc: '(데이터 연동되어 자동 추가됨)', values: ['참치', '야채'] },
  { name: '김장', desc: '(데이터 연동되어 자동 추가됨)', values: [] },
  { name: '나이', desc: '(AI Generated) 유저의 나이', values: ['20', '25', '31', '42'] },
  { name: '성별', desc: '(AI Generated) 유저의 성별', values: ['남성', '여성'] },
  { name: '신참', desc: '(AI Generated) 신규 사용자를 구분하는 값', values: ['true', 'false'] },
  { name: '오잉', desc: '(데이터 연동되어 자동 추가됨)', values: [] },
];

export const DEVICE_TAGS: TagItem[] = [
  { name: '@device_model', desc: '(기본) 기기 모델', values: ['iPhone15,2', 'SM-S918N'] },
  { name: 'landing', desc: '(데이터 연동되어 자동 추가됨)', values: ['sale', 'main'] },
];

export type SegEvent = { name: string; desc?: string; props: Record<string, string[]> };

export const SEG_EVENTS: SegEvent[] = [
  { name: 'purchase', desc: '(기본) 구매 완료', props: { price: ['10000', '29000', '59000'], category: ['shoes', 'bags', 'outer'], product_id: ['P-1001', 'P-2040'] } },
  { name: 'add_to_cart', props: { product_id: ['P-1001', 'P-2040'], quantity: ['1', '2'] } },
  { name: 'begin_checkout', props: { value: ['29000'] } },
  { name: 'app_opened', props: {} },
  { name: 'banner_impression-v1', props: {} },
  { name: 'deferred', props: {} },
  { name: 'email.delivered', props: {} },
  { name: 'soob', props: { w6: ['x', 'y', 'z'], w7: ['k'] } },
  { name: 'blacklist', props: {} },
  { name: 'claude_track_test', props: {} },
];

// 국가 — 스테이징 드롭다운 앞부분 그대로(코드 + 한글 이름)
export const COUNTRIES: [string, string][] = [
  ['US', '미국'], ['KR', '대한민국'], ['CN', '중국'], ['JP', '일본'], ['DE', '독일'], ['BR', '브라질'], ['FR', '프랑스'], ['IT', '이탈리아'],
  ['RU', '러시아'], ['GB', '영국'], ['AU', '오스트레일리아'], ['CA', '캐나다'], ['IN', '인도'], ['MX', '멕시코'], ['ES', '스페인'], ['ID', '인도네시아'],
  ['TR', '튀르키예'], ['NL', '네덜란드'], ['SA', '사우디아라비아'], ['CH', '스위스'], ['SE', '스웨덴'], ['NO', '노르웨이'], ['PL', '폴란드'], ['BE', '벨기에'],
  ['NG', '나이지리아'], ['AR', '아르헨티나'], ['TW', '대만'],
];

// 언어 — 코드 + 한글 이름(스테이징은 Intl.DisplayNames 로 이름을 붙임. 하이드레이션 차이를 피하려고 고정 문자열)
export const LANGUAGES: [string, string][] = [
  ['ko', '한국어'], ['en', '영어'], ['ja', '일본어'], ['zh', '중국어'], ['es', '스페인어'], ['fr', '프랑스어'], ['de', '독일어'], ['it', '이탈리아어'],
  ['pt', '포르투갈어'], ['ru', '러시아어'], ['vi', '베트남어'], ['th', '태국어'], ['id', '인도네시아어'], ['ar', '아랍어'], ['hi', '힌디어'], ['tr', '튀르키예어'],
];
