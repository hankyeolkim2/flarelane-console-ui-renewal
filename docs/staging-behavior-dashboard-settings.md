# 기기 및 발송 현황 · 프로젝트 · 고객 데이터 연동 · 결제 - 스테이징 동작 메모 (2026-10-08)

스테이징 콘솔 공개 번들(buildId `Q-tOYo7BMgpuoKSGYkmC0`, 404 페이지 `__NEXT_DATA__`로 재확인)과 로케일 파일(`/locales/ko/common.json`, `dashboard.json`, `dashboard-help.json`, `project.json`, `project-help.json`, `member.json`, `data-management.json`, `billing.json`, `newMessage.json`)에서 읽은 동작. 로그인·API 호출 없이 정적 파일만 봤다. 프로토타입은 이 동작을 따르고, 모양은 Figma 시안을 따른다.

- 문구는 「」 안에 그대로 옮김. `{{x}}`는 치환 값. 오타도 원문 그대로(예: 「맴버 초대하기」).
- API는 `https://staging-service-api.flarelane.com/v1` 기준이고 거의 모두 `/projects/{projectId}`가 앞에 붙는다(아래는 그 뒤 경로만). 예외는 따로 적음.
- 공통 에러 처리: 서버 `message`를 빨간 토스트로, 응답이 없으면 「인터넷 연결을 확인해 주세요.」. 성공 토스트가 없다고 적힌 저장은 조용히 다시 불러오기만 한다.
- 날짜 표기 함수: 기본 `yyyy.LL.dd HH:mm:ss`(값 없으면 「-」). 숫자는 `toLocaleString("ko-KR")`(0/빈 값은 「0」). 비율은 `(100×값).toFixed(2)`.
- `m_blur` 클래스가 붙은 값(멤버 이메일, 프로젝트 ID, 결제 정보 등)은 화면 녹화 도구용 가림 처리 대상. 프로토타입에선 그냥 보이게 둬도 됨.

## 주소 (빌드 매니페스트 기준)
| 주소 | 화면 |
|---|---|
| `/dashboard` | 기기 및 발송 현황 |
| `/dashboard/message-rank` | 가장 클릭률 높은 메시지(콘솔) 전체 보기 |
| `/dashboard/message-rank/api` | 가장 클릭률 높은 메시지(API) 전체 보기 |
| `/project` | 프로젝트 설정 |
| `/project/advanced-settings` | 고급 설정 |
| `/project/console-usage-log` | 콘솔 이용 기록 (이 문서 범위 밖) |
| `/data-management` | 고객 데이터 연동 (`?n=e` 이벤트 추가 모달, `?n=t` 태그 추가 모달 바로 열림) |
| `/billing` | 결제 |
| `/billing/receipt/[receiptId]?pid={projectId}` | 결제 영수증(새 탭) |

- 모든 페이지가 `getServerSideProps`를 가짐 → 서버 쪽 리다이렉트 여부는 번들로 알 수 없음. 비로그인 접근은 `/auth/login`으로 307.
- 왼쪽 메뉴
  - 「데이터 리포트」 그룹: 「기기 및 발송 현황」(`/dashboard`) · 「분석 보드」
  - 「설정」 그룹: 「프로젝트」(`/project`) · 「고객 데이터 연동」(`/data-management`) · 「채널」 · 「결제」(`/billing`) · 「실험실」
  - 「결제」는 `shouldAdmin` → 현재 유저가 멤버 목록에서 관리자가 아니고 마스터 계정도 아니면 메뉴 자체가 안 보임.
  - 선택 상태 = 현재 경로에 메뉴 href(쿼리 제외)가 포함되면 선택.

---

## 공통 부품

### 기간 선택(날짜 범위 피커)
- 닫힌 상태: 너비 224px 밑줄 입력 모양, 텍스트 「yyyy-MM-dd ~ yyyy-MM-dd」 + 오른쪽 달력 아이콘. 열려 있으면 글자 진한색 + 밑줄 브랜드색.
- 클릭 → 팝오버(바깥 클릭 = 취소)
  - 왼쪽: 인라인 달력(범위 선택, `maxDate` = 오늘, `minDate` = 아래 플랜 제한)
  - 「기간설정」 프리셋: 「오늘」 · 「어제」 · 「최근 7일」 · 「최근 30일」 · 「최근 90일」 · 「최근 1년」 (지금 범위와 같으면 굵게)
  - 「날짜」: 시작/종료 입력 2개(placeholder `yyyy-MM-dd`, 숫자만 받아 자동으로 `-` 삽입, 최대 10자) 사이 「~」
    - 10자가 됐는데 날짜가 아니면 「날짜 형식이 올바르지 않습니다」 · 시작 > 종료면 「시작일이 종료일보다 늦을 수 없습니다」 (빨간 글씨)
    - 오늘 이후는 오늘로, 최소일 이전은 최소일로 자동 보정
  - 버튼 「취소」(secondary xs) · 「확인」(xs) - 확인은 두 날짜가 다 있고 에러가 없고 입력이 반쯤(1~9자)이 아닐 때만 활성
  - 맨 아래 브라우저 시간대 이름(예: `Asia/Seoul`)
- `excludeToday` 옵션: 켜면 프리셋 끝 날짜가 어제(「최근 7일」 = 7일 전 ~ 어제). 끄면 오늘까지.
- `enablePlanDateRange` 옵션(플랜 제한)
  - 최소일 = 오늘 - 플랜 일수: STARTER 30 · TEAM(_YEAR) 365 · BUSINESS/ENTERPRISE/BASIC/DEVELOPER/TRIAL 3650 · EXPIRED 0. 플랜 모르면 STARTER.
  - 플랜 순위가 TEAM 미만이면 「최근 90일」 · 「최근 1년」 비활성(커서 not-allowed, 클릭 무시). 툴팁·배지 없음.

### 도움말 아이콘
- 라벨 옆 (?) 아이콘, 마우스 올리면 HTML 툴팁(링크 가능). 클릭 동작 없음.

### CSV 다운로드 사유 모달 (기기 및 발송 현황 · 최근 이벤트 공통)
- 너비 520px 확인 모달
- 제목 「CSV 다운로드」
- (기간·이름이 있을 때만) 「기간」 `yyyy-MM-dd ~ yyyy-MM-dd` / 「데이터」 {카드 제목}
- 「다운로드 사유 입력」 + 여러 줄 입력(placeholder 「다운로드 사유를 입력해 주세요.」)
- 버튼 「취소」 · 「다운로드」(사유가 공백뿐이면 비활성)
- 다운로드 → 서버가 준 url로 파일 받기 + 토스트 「파일 다운로드에 성공했습니다.」 + 모달 닫힘

### 확인/삭제 모달 기본 버튼
- 확인 모달: 「취소」(secondary) · 「확인」 / 삭제 모달: 「취소」(secondary) · 「삭제」(destructive)

### 표 공통
- 로딩 중 오버레이, 빈 목록은 회색 문서 일러스트 + 「데이터가 없습니다」.

---

## 1. 기기 및 발송 현황 `/dashboard`

### 머리
- 제목 「기기 및 발송 현황」 + 오른쪽 기간 선택
  - 기본값: 30일 전 00:00 ~ **어제** 23:59 (최근 30일, 오늘 제외)
  - `excludeToday` · `enablePlanDateRange` 켜짐 (플랜 = 구독 플랜 `planName`)
- 기간을 바꾸면 아래 카드들이 그 기간으로 다시 불러옴(기기 수 카드 2개는 제외, 처음 1번만).
- 모든 기간 요청 쿼리: `gte=yyyy-MM-dd&lte=yyyy-MM-dd&timeZone={브라우저 시간대}`

### 1-1. 기기 수 카드 2개 (웹 푸시 · 앱 푸시)
- 가로 2칸(모바일 세로). **웹 기기(데스크탑+모바일) 합이 0이면 순서를 뒤집어 앱 푸시가 먼저.**
- 카드마다 제목 → 두 블록
  - 「전체 기기 수」 + 도움말 「현재까지 누적된 전체 생성 기기 수 입니다.」 → 값 2칸
  - 「알림 구독 기기 수」 + 도움말 「전체 기기 중 현재 푸시 알림을 받을 수 있는 기기 수 입니다.」 → 값 2칸
- 값 칸 = 원형 아이콘(파란 20% 배경) + 숫자(heading4, 천단위 쉼표) + 아래 회색 라벨, 두 칸 사이 세로 구분선
  - 「웹 푸시」 카드: 「데스크탑」(webDesktop) · 「모바일」(webMobile)
  - 「앱 푸시」 카드: 「안드로이드」(android) · 「iOS」(ios)
- 데이터: 전체 `GET /stats/all-devices-count`, 구독 `GET /stats/subscribed-devices-count` (기본 0)

### 1-2. 「신규 등록 기기」 카드
- 제목 + 도움말 「선택한 기간 동안 신규 생성 기기 추이입니다.」, 오른쪽 「CSV로 내보내기」(tertiary sm, 다운로드 아이콘)
- 범례 1개: 파란 점 + 「새 기기」 (클릭 동작 없음)
- 면적 선 차트(높이 270px): 파란 선 + 위→아래 그라데이션 채움, 점 1개일 때만 점 표시
  - x축 라벨 = `yyyy-MM-dd (요일)` (ko: 「(월)」 식), 겹치면 자동 생략, 세로선 없음
  - y축 0부터, 최대값 = 데이터 최대 × 1.3 (최소 2), 점선 가로 그리드, 정수 눈금
  - 마우스 올리면 그 위치에 파란 점선 세로선 + 툴팁(진회색 배경, 가운데 정렬): 제목 = 날짜 라벨, 본문 = 값만(굵게)
- 데이터: `GET /stats/new-and-unsubscribed-devices-count` → `data[]{date,new,unsubscribed}` (unsubscribed는 화면에 안 씀). 로딩 전 기본 라벨 7칸 빈값.
- CSV: 사유 모달(데이터 = 「신규 등록 기기」) → `POST /stats/new-and-unsubscribed-devices/export {reason,gte,lte,timeZone}` → `data.url`

### 1-3. 「발송 & 클릭」 카드 + 「발송 시간대별 평균 클릭률」 카드 (가로 2칸)
- 「발송 & 클릭」 + 도움말 「선택한 기간 동안 모든 메시지들의 발송과 클릭 각각의 총합 추이입니다.」, 「CSV로 내보내기」
  - 범례: 연파랑(blue200) 「발송」 · 진파랑(blue700) 「클릭」 (클릭 동작 없음)
  - 선 차트 2개 축: 발송 = 왼쪽 축, 클릭 = 오른쪽 축(클릭 축 최대값은 ×2 가중 → 선이 아래쪽에 그려짐)
  - 툴팁(왼쪽 정렬): 「발송: 1,234」 / 「클릭: 12 (0.97%)」 (%= 그날 클릭/발송)
  - 데이터 `GET /stats/sent-converted-count` → `data[]{date,sent,converted}`
  - CSV: 데이터 = 「발송 & 클릭」 → `POST /stats/sent-and-converted/export`
- 「발송 시간대별 평균 클릭률」 + 도움말 「선택한 기간 동안 모든 메시지들의 발송 시간대별 평균 클릭률 추이입니다.」, 「CSV로 내보내기」
  - 막대 차트(파랑, 막대 폭 70%·최대 16px), 각 막대 칸 전체 높이에 연회색 배경, 호버 칸은 파란 그라데이션
  - x축 = 시(hour) 숫자 「0」~「23」, y축 최대 = 최대 × 1.3 (100 넘지 않음)
  - 툴팁 본문 「12.34%」
  - 데이터 `GET /stats/average-converted-per-hour` → `data[]{hour,average}` (average는 0~1 비율)
  - CSV: 데이터 = 「발송 시간대별 평균 클릭률」 → `POST /stats/average-converted-per-hour/export`

### 1-4. 「가장 클릭률 높은 메시지」 카드 2개 (가로 2칸)
- 제목 「가장 클릭률 높은 메시지 (콘솔)」 / 「가장 클릭률 높은 메시지 (API)」 + 도움말 「선택한 기간 동안 모든 메시지들을 메시지 문구 기준으로 분석한 클릭률 순위입니다.<br />발송 총합이 5 이하이거나 클릭 총합이 0인 경우 표시되지 않습니다.」
- 오른쪽 「더 보기」(secondary xs) → `/dashboard/message-rank` / `/dashboard/message-rank/api`
- 표 머리: 「클릭률」(108px, 「12.34%」) · 「메시지」(제목+본문, 줄바꿈 허용) · 「클릭합계」(100px, 오른쪽 정렬)
  - 상위 5행은 클릭합계 옆 순위 배지 「1위」~「5위」: 1위 노랑(#FEC947, 흰 글씨) · 2위 파랑 80% · 3위 파랑 50% · 4·5위 회색100 배경/회색300 글씨
- 모바일: 표 대신 카드 목록(메시지 → 「클릭률」 / 「클릭합계」 + 배지), 빈 목록은 「데이터가 없습니다」
- 행 클릭 동작 없음(커서 기본)
- 데이터 `GET /stats/converted-message-rank?gte&lte&timeZone&senderSource=console|api&per` → `data[]{title,body,average,total}`. 대시보드에선 `per` 미지정(서버 기본 개수).

### 1-5. 「최근 이벤트」 바로가기
- 맨 아래 카드 한 줄: 「최근 이벤트」 + 오른쪽 화살표(180° 회전). 카드 아무 곳 클릭 → `/data-management`.

### 1-6. `/dashboard/message-rank`, `/dashboard/message-rank/api`
- 같은 머리(「기기 및 발송 현황」 + 기간 선택, 기본값·옵션 동일) + 해당 랭킹 카드 1개만, `per=20`, 「더 보기」 없음. 뒤로가기 버튼 없음.

---

## 2. 프로젝트 `/project`

불러오기: `GET /projects/{id}`(프로젝트 상세) + `GET /members`. 카드 순서는 아래와 같음.

### 공통: 수정 버튼 묶음 (카드 오른쪽 아래)
- 읽기 모드: 「수정」(xl) 1개
- 수정 모드: 「취소」(secondary xl) · 「저장」(xl), 저장 중 둘 다 로딩
- 「취소」 = 서버 값을 다시 불러와 읽기 모드로(입력 내용 버림)

### 2-1. 기본 정보 카드
- 왼쪽 위: 프로모션이 `EARLYBIRD`면 얼리버드 배지(svg)
- 제목 「프로젝트」 + 플랜 배지(planName 텍스트), 오른쪽 「고급 설정」(tertiary sm) → `/project/advanced-settings`
- 프로젝트 아바타(이름 기반, 48px)
- 「프로젝트명」 입력(placeholder 「프로젝트명」) - 읽기 모드에선 readOnly
- 「대체 시간대」 + 도움말 「시간대를 알 수 없는 유저를 위한 대체 시간대를 설정합니다.」
  - 검색 가능 셀렉트, 표시 「(GMT+09:00) Asia/Seoul」, 옵션 376개(이름 부분 검색), 읽기 모드 readOnly
  - 값 없으면 브라우저 시간대, 그것도 없으면 `Asia/Seoul`
- 「프로젝트 ID」 + 도움말 「프로젝트를 식별하는 고유한 값입니다.<br />SDK 연동이나 API 사용 시 프로젝트 ID가 필요합니다.」
  - 회색 박스에 ID + 복사 아이콘. 박스나 아이콘 클릭 → 복사 + 토스트 「클립보드에 복사되었습니다.」 (실패 「클립보드로 복사하는 데 실패했습니다.」). 수정 모드와 무관.
- API 키 라벨(아래 「확인 못 한 것」 참고) + 도움말 「REST API 사용 시 HTTP 헤더에 삽입할 인증키입니다.」
  - 박스에 글자 수만큼 「•」를 공백으로 이어 표시, 클릭 → 실제 키 복사 + 같은 토스트
- 저장: 이름이 비면 에러 토스트 「프로젝트명을 입력해 주세요.」 → `PATCH /projects/{id} {name, fallbackTimeZone}` → 다시 불러옴 → 토스트 「프로젝트가 수정되었습니다.」, 상단 프로젝트 이름도 갱신.

### 2-2. 「구매 전환 이벤트」 카드
- 라디오 2개(수정 모드에서만 선택 가능): 「미설정」 · 「설정」
  - 「설정」 처음 고르면 기본값 `{eventType:"", attributionWindowHours:{3,일}, currency:"", priceKey:"", quantityKey:""}`
- 「설정」일 때 입력 5줄 (읽기 모드 readOnly)
  - 「이벤트」: 이벤트 셀렉트(검색 가능, placeholder `purchase`, 숨긴 이벤트 제외). 목록 맨 아래 버튼 「+ 새 이벤트」 → `/data-management?n=e`
  - 「금액 데이터」: 입력 placeholder `price`
  - 「수량 데이터」: 입력 placeholder `quantity`
  - 「통화」: 검색 셀렉트 placeholder `USD`, 옵션 = 국가 코드 설정의 통화 목록(중복 제거)
  - 「기여 기간」: 숫자 입력(48px, 최소 1) + 단위 셀렉트 「일」 · 「시간」 (분 없음, 최대 7일)
- 저장: (이름 검사 동일) → `PATCH /projects/{id} {purchaseConversionConfig: null | {eventType, priceKey, quantityKey, currency, attributionWindowHours: 시간 숫자(일×24)}}` → 토스트 「프로젝트가 수정되었습니다.」
- 서버 값 → 화면: 시간이 24의 배수면 일, 아니면 시간 단위로 표시.

### 2-3. 「메시지 발송 빈도 제한」 카드
- 채널 탭(텍스트 세그먼트, 선택 = 진한 글씨+브랜드 밑줄): 「푸시 알림」 · 「카카오 알림톡」 · 「카카오 브랜드메시지」 · 「문자」 · 「이메일」 - 읽기 모드에서도 전환 가능
- 라디오(수정 모드만): 「무제한 발송」 · 「유저별 발송 빈도 제한 설정」
  - 「유저별…」 선택 시 일 제한 켜짐, 「무제한」 선택 시 일·주 모두 꺼짐
- 제한 켜짐(일 또는 주 active)일 때 2줄: [체크박스] 「1일 동안 최대 」 [숫자 1~70] 「개의 메시지를 수신합니다.」 / [체크박스] 「1주 동안 최대 」 [숫자 1~490] 「개의 메시지를 수신합니다.」
- 저장: 어느 채널이든 일 1~70 · 주 1~490 밖이면 그 채널 탭으로 이동 + 에러 토스트 「빈도 제한 값은 일 1~70, 주 1~490 범위만 가능합니다.」 → `PATCH /projects/{id} {frequencyCappingConfig:{PUSH:{daily:{active,maxCount},weekly:{...}}, KAKAO_ALIMTALK…, KAKAO_BRAND_MESSAGE…, SMS…, EMAIL…}}` → 토스트 「프로젝트가 수정되었습니다.」
- 서버에 frequencyCappingConfig가 없으면 카드 자체를 그리지 않음.

### 2-4. 「메시지 발송 속도 제한」 카드
- 같은 채널 탭
- 라디오(수정 모드만): 「최대한 빠르게 발송」(값 null) · 「발송 속도 제한 설정」(처음 고르면 10000)
- 제한일 때: 「분당 」 [숫자 100~1,000,000, 기본 10000] 「개의 메시지를 발송합니다.」
- 저장: 범위 밖 채널로 탭 이동 + 에러 토스트 「발송 속도는 분당 100 ~ 1,000,000 값만 가능합니다.」 → `PATCH /projects/{id} {throttleConfig:{PUSH:number|null,…}}` → 토스트 「프로젝트가 수정되었습니다.」

### 2-5. 「멤버」 카드
- 오른쪽 버튼: 「멤버 권한 설정」(secondary xs, **현재 유저가 관리자일 때만 활성**) · 「콘솔 이용 기록」(secondary xs → `/project/console-usage-log`) · 「초대하기」(xs)
- 표 머리: 「이메일」 · 「역할」(140px) · 「2차 인증」(80px, 가운데) · 「등록일」(250px, 오른쪽) · ⋯(34px)
  - 이메일 칸: 관리자/멤버 아이콘 + 이메일, 아직 가입 안 한 초대(id 없음)는 회색 배지 「대기중」
  - 역할: 「관리자」 / 「멤버」
  - 2차 인증: 점 아이콘, 켜짐 초록(#20a04f) / 꺼짐 회색
  - 등록일: `yyyy.LL.dd HH:mm:ss`
  - 페이지네이션 없음, 행 클릭 동작 없음
- ⋯ 메뉴(바깥 클릭 닫힘): 「역할 변경」(가입한 멤버만) · 「멤버 삭제」(빨강)

#### 초대 모달 (확인 모달)
- 제목 「맴버 초대하기」, 라벨 「이메일」, 입력 placeholder 「초대할 메일 주소 입력」, 안내 「현재 미가입자일 경우 가입 시점에 자동으로 멤버에 추가됩니다.」
- 「확인」: 빈칸이면 무반응(이메일 형식 검사 없음) → `POST /members {email, data:{inviterName, projectName, inviteeEmail}}` → 목록 새로고침 + 토스트 「초대 메일이 발송되었습니다.」 + 닫힘

#### 역할 변경 모달 (확인 모달)
- 제목 「역할 변경」, 이메일 읽기 전용 입력 + 셀렉트 「관리자」/「멤버」(현재 역할 선택됨)
- 「확인」 → `PATCH /members/{memberId} {admin:boolean}` → 목록 새로고침 + 닫힘(토스트 없음)

#### 멤버 삭제
- 삭제 모달: 제목 「멤버를 삭제하시겠습니까?」, 본문 「해당 멤버는 현재 프로젝트에서 삭제됩니다.」, 「취소」/「삭제」
- 대상이 관리자이고 관리자가 2명 미만이면(또는 서버 400) 삭제 모달 닫고 안내 모달: 「해당 멤버를 삭제할 수 없습니다.」 / 「관리자 1명 이하일 경우 삭제할 수 없습니다.」 / 「확인」
- 정상 → `DELETE /members` body `{email}` → 목록 새로고침(토스트 없음)

#### 멤버 권한 설정 모달 (확인 모달, 버튼 「취소」/「저장」)
- 머리: 「멤버 권한 변경」 + 설명 「관리자는 모든 권한이 활성화되어 있습니다」 + X(aria 「닫기」)
- 불러오기: `GET /permissions`(**프로젝트 경로 없음**, 이름 Admin 제외) + `GET /roles`(이름 `Member` 역할의 권한)
- 리소스별 묶음 머리: 「데이터 조회 권한」(user) · 「다운로드 권한」(csv) · 「MCP 권한」(mcp)
- 행 = 권한 이름 + 체크박스, 순서: 「유저 데이터 보이기(리스트)」 · 「유저 데이터 보이기(상세)」 · 「CSV 다운로드」 · 「MCP 데이터 수정(Read&Write)」 · 「MCP 데이터 조회(Read only)」
  - 수정(write)을 켜면 조회(read)도 자동으로 켜지고, write가 켜진 동안 read 체크박스 비활성
- 「저장」 → `PUT /roles/{roleId} {permissionIds}` → 토스트 「멤버 권한 설정이 완료되었습니다.」 + 닫힘

### 2-6. 프로젝트 삭제
- 맨 아래 「프로젝트 삭제」(secondary destructive)
- 삭제 모달: 제목 「정말 삭제하시겠습니까?」, 「삭제된 프로젝트는 복구할 수 없습니다.」, 「삭제를 원하시면 아래에 <span>"{{projectName}}"</span>을 입력해 주세요.」, 입력칸(placeholder 없음), 「취소」/「삭제」
- 「삭제」: 이름 불일치 → 에러 토스트 「프로젝트명이 일치하지 않습니다.」 / 일치 → `DELETE /projects/{id}` → 프로젝트 목록 다시 불러와 전환 → 토스트 「프로젝트가 삭제되었습니다.」

### 2-7. 고급 설정 `/project/advanced-settings` (참고)
- 머리: 왼쪽 꺾쇠(→ `/project`) + 「고급 설정」
- 탭: 「발송」 · 「유저&기기 관리」 · 「보안」 (로딩 중 전환 막힘)
  - 발송: 체크박스 「푸시 발송 시 동일 유저ID 중복 기기가 있는 경우 최근 접속한 1개 기기에만 발송」
  - 유저&기기 관리: 체크박스 「푸시 발송 후 푸시서버(FCM/APNS)로부터 삭제 피드백 수신 시 기기 즉시 삭제」
  - 보안: 「콘솔 접속을 허용할 IP 접근제어」 + 태그식 IP 입력(placeholder 「IP 주소 입력」, Enter로 추가) + 체크박스 「모든 멤버에 대해 2차 인증 강제 설정 요구」
- 아래 「저장」(xl) - 현재 탭만 저장 → 토스트 「저장되었습니다.」
  - 발송/유저&기기: `PATCH /configs {sendLatestDeviceOnly}` / `{deleteDeviceOnPushFeedback}`
  - 보안: `PUT /project-config {allowedIps}` + `PATCH /configs {enforceMFA}`
- 불러오기: `GET /configs`, 보안 탭 열 때 `GET /project-config`

---

## 3. 고객 데이터 연동 `/data-management`

순서: 머리 → 최근 이벤트 카드 → 이벤트 내보내기 카드 → 이벤트·태그 카드.

### 머리
- 제목 「고객 데이터 연동」 + 도움말 「프로젝트에 연동된 이벤트와 태그 고객 데이터를 관리할 수 있습니다. 자세한 내용은 <a>고객 데이터 연동</a> 가이드를 참고하세요.」(https://docs.flarelane.co.kr/data-management, 새 탭)

### 3-1. 「최근 이벤트」 카드
- 제목 + 도움말 「발생한 이벤트가 최근순으로 최대 50개까지 노출됩니다. 특정 유저ID나 기기ID로 필터링도 가능합니다.」
- 필터 줄
  - 셀렉트 「유저 ID」(기본) / 「기기 ID」
  - 입력 placeholder `ID`
  - 입력 placeholder `Event Type`
  - 기간 선택: 기본 7일 전 00:00 ~ **오늘**(`excludeToday` 꺼짐), 플랜 제한 켜짐
  - 새로고침 아이콘(aria 「새로고침」): 누르면 현재 조건으로 다시 불러오고 5초간 비활성
- **ID·Event Type 입력만 바꿔선 다시 불러오지 않음.** 기간 「확인」 또는 새로고침 때 반영.
- 오른쪽 「CSV로 내보내기」(tertiary xs, 로딩 중 비활성) → 사유 모달(기간·데이터 줄 없음) → `POST /stats/recent-events/export {reason,gte,lte,timeZone,type?,subjectType?,subjectId?,per:1000}` → 토스트 「파일 다운로드에 성공했습니다.」
- 표 머리: 「생성 시간」(180px) · 「타입」(200px) · 「대상」(120px) · 「대상 ID」(200px) · 「데이터」(가변, 최대 385px, 한 줄 가로 스크롤) · 복사 아이콘(34px)
  - 생성 시간 `yyyy.LL.dd HH:mm:ss`, 데이터 = JSON 문자열
  - 복사 아이콘 → 행 전체 JSON 복사 + 「클립보드에 복사되었습니다.」
  - 페이지네이션 없음, 행 클릭 동작 없음
- 데이터 `GET /stats/recent-events?gte&lte&timeZone&type&subjectType=user|device&subjectId` (ID 비었으면 subjectType·subjectId 생략)

### 3-2. 「이벤트 내보내기」 카드
- 한 줄: 「이벤트 내보내기」 + 상태 배지(점 + 「활성화」/「비활성화」) | 「최근 내보내기」 {updatedAt 날짜 또는 「-」} | 「내보내는 이벤트 개수」 {개수 또는 「-」} | 「설정」(tertiary sm)
- 프로젝트 `isCrmEventExportEnabled`가 false면 설정을 불러오지 않음 → 배지 「비활성화」, 값 「-」, 「설정」 비활성. (플랜 배지·툴팁 없음)
- 「설정」 → 모달 「이벤트 데이터 내보내기 설정」
  - 머리 오른쪽 「활성화」 + 토글
  - 「AWS Role ARN」 + 링크 「가이드 바로가기」(https://docs.flarelane.co.kr/export-crm-events) / 입력 placeholder 「AWS Role ARN을 입력해 주세요.」
  - 「AWS S3 Bucket Name」 / placeholder 「S3 Bucket Name을 입력해 주세요.」
  - 「AWS S3 Bucket Prefix」 / placeholder 「AWS S3 Bucket Prefix를 입력해 주세요.」 (최대 512자)
  - 「내보낼 이벤트 선택」: 채널 묶음 「푸시 알림」 · 「문자」 · 「카카오톡」 · 「이메일」 · 「인앱 메시지」, 묶음마다 체크박스(이름 = 이벤트 값, channel이 push/sms/kakao/email/iam으로 시작하는 것)
  - 버튼 「취소」 · 「저장」 - 활성화가 켜져 있으면 ARN·버킷 이름·프리픽스 셋 다 있어야 저장 활성
  - 저장 → `PATCH /crm-event-export-config {isEnabled, destinationRoleArn, destinationBucket, destinationPrefix, eventTypes[]}` → 다시 불러옴 → 토스트 「이벤트 내보내기 설정이 저장되었습니다.」 + 닫힘

### 3-3. 이벤트 · 태그 카드
- 왼쪽 탭 「이벤트」 · 「태그」, 그 옆 「숨긴 항목 보기」(tertiary xs, 아이콘 visibility ↔ visibility_off) - 탭마다 따로 켜짐, 켜면 숨긴 항목도 표시
- 오른쪽 「추가」(xs, 로딩 중 로딩 표시) → 현재 탭 추가 모달
- `?n=e` / `?n=t` 로 들어오면 해당 탭 + 추가 모달 자동 열림
- 데이터: `GET /data-management/events?page=1&per=500`, `GET /data-management/tags?page=1&per=500` (프로젝트·언어가 바뀔 때만 1회, 앱 전역 저장소에 둠). 페이지네이션 없음.

#### 이벤트 표
- 머리: 「이름」(260px) · 「설명」(가변) · 「최근 14일」(150px, 도움말 「최근 14일간의 발생 볼륨과 일별 발생 추이를 보여줍니다.」) · ⋯
  - 이름: 구매 전환 이벤트면 위에 배지 「구매 이벤트」, 숨김이면 앞에 눈 꺼짐 아이콘(16px)
  - 설명: 한 줄 말줄임. 값이 `FLARELANE_AUTO_SYNC`면 회색 「(데이터 연동되어 자동 추가됨)」, 비면 「-」
  - 최근 14일: trends 없으면 「집계 전」, 있으면 합계(1000 미만 그대로, 「1.2k」, 「3.4M」 - 소수 1자리 버림) + 120×24 스파크라인(마지막 점 원)
- 태그 표: 「이름」 · 「설명」 · 「연동률」(140px, 도움말 「전체 유저 중 이 태그 값을 보유한 유저의 비율입니다.」, 「12.3%」 또는 「집계 전」) · ⋯
- ⋯ 메뉴(readOnly 항목은 메뉴 없음): 「숨김」(숨김 아님일 때) / 「숨김 해제」(숨김일 때) · 「수정」 · 「삭제」(빨강, 구매 전환 이벤트는 없음)
- 행 클릭 → 오른쪽 상세 패널(아래). 열린 행은 활성 배경.

#### 숨김 / 숨김 해제
- 숨김: 브라우저 기본 confirm 「이벤트를 숨기시겠습니까?\n숨긴 이벤트는 이벤트 선택 리스트에서 노출되지 않습니다.」(태그는 「태그를 숨기시겠습니까?\n숨긴 태그는 태그 선택 리스트에서 노출되지 않습니다.」) → `PATCH /data-management/events/visibility {name, hidden:true}` (태그 `/data-management/tags/visibility`) → 목록 새로고침
- 숨김 해제: 확인 없이 바로 `{hidden:false}`. 토스트 없음.

#### 상세 패널 (오른쪽 슬라이드, 너비 800px, 배경 어둡게 안 함)
- 머리: 항목 이름 + ⋯ 메뉴(표와 같음) + X(aria 「닫기」)
- 「설명」 {설명 또는 「-」}, 태그면 「연동률」 {값}
- 이벤트: 속성 표 「속성」(160px) · 「설명」(240px) · 「속성값 예시」(examples 앞 3개를 「, 」로) - 없으면 「-」 한 줄
- 태그: 「속성값 예시」 {앞 3개 또는 「-」}
- 아래 「닫기」(xl)

#### 이벤트 추가/수정 모달 (확인 모달)
- 제목 「이벤트 추가」 / 「이벤트 수정」 + X
- 「이벤트」(필수) placeholder 「이벤트 이름을 입력해 주세요.」, 최대 100자, 수정 땐 readOnly
  - 영문·숫자·_ 아니면 포커스 아웃 뒤 빨간 테두리 + 「영문, 숫자, 언더바(_)만 입력할 수 있습니다.」
- 「설명」 placeholder 「어떤 데이터인지 설명해 주세요.」, 최대 500자 (자동 연동 설명이면 빈칸으로 시작)
- 「속성」 + 「추가하기」(tertiary sm, + 아이콘, 100개면 비활성) → 빈 행이 **맨 위**에 추가
  - 행이 있으면 머리 「속성명」 · 「속성 설명」
  - 속성명 placeholder 「예: product_id」(최대 100자, 새로 넣은 키만 같은 규칙 검사, 포커스 아웃 뒤 에러) · 속성 설명 placeholder 「어떤 값인지 설명해 주세요.」(최대 500자) · 삭제 아이콘(do_not_disturb_on, aria 「삭제」)
- 「확인」 비활성 조건: 이름 공백 / (추가 시) 이름 규칙 위반 / 새 키 규칙 위반
- 제출: 추가 `POST /data-management/events {name, description|null, data:[{key, description?}]}`, 수정 `PATCH /data-management/events/{id} {description, data}` (빈 키 제거, 앞뒤 공백 제거) → 목록 새로고침 + 닫힘. 토스트 없음.

#### 태그 추가/수정 모달
- 제목 「태그 추가」 / 「태그 수정」, 「태그」(필수) placeholder 「태그 이름을 입력해 주세요.」, 「설명」 동일, 속성 없음
- 추가 `POST /data-management/tags {name, description}` / 수정 `PATCH /data-management/tags/{id} {description}`

#### 삭제
- 삭제 모달 제목만: 「이벤트를 삭제하시겠습니까?」 / 「태그를 삭제하시겠습니까?」, 「취소」/「삭제」 → `DELETE /data-management/events/{id}` (태그 `/tags/{id}`) → 목록 새로고침. 토스트 없음.

---

## 4. 결제 `/billing`

### 레이아웃 분기
- 현재 프로젝트 `paymentMethod === "STRIPE"` → 「나의 플랜」 카드만.
- 그 밖: ① 「결제 담당자」 · 「결제수단」 가로 2칸 → ② 「나의 플랜」 → ③ 「나의 포인트」 → ④ 「포인트 사용 내역」 → ⑤ 「결제정보」
- 플랜이 `DEVELOPER`면 ①의 두 카드는 빈 div(안 보임).
- 메뉴는 관리자만 보이지만 페이지 자체의 접근 차단 코드는 번들에 없음.

### 4-1. 「결제 담당자」 카드
- 제목 + 「수정」(xs)
- 4줄: 「회사명」 · 「담당자」 · 「이메일」 · 「연락처」 (빈 값이면 빈칸)
- 「수정」 → 확인 모달 「결제 담당자 변경」: 같은 4개 라벨의 입력(placeholder 없음)
  - 「확인」: 하나라도 비면 에러 토스트 「모든 정보를 입력해 주세요.」 → `PATCH /payment/info {companyName, managerName, managerEmail, managerTel}` → 닫힘(토스트 없음). 「취소」 = 입력 되돌림.
- 데이터 `GET /payment/info`

### 4-2. 「결제수단」 카드
- 제목 + 「수정」(xs, 계좌이체면 없음)
- 상태
  - `BANK`: 통장 이미지 + 「Bank」 + 「계좌이체」
  - 카드 없음: 빈 카드 이미지 + 「카드 등록하기」 (이미지 클릭 동작 없음, 등록은 「수정」으로)
  - `IAMPORT_CARD` + 카드 있음: 카드 이미지(앞4 · ●●●● · ●●●● · 뒤4) + 「카드번호」 「1234 - **** - **** - 5678」
- 「수정」 → 확인 모달 「결제수단 변경」: 「카드번호」 4칸(각 4자) · 「유효기간」 `YYYY` / `MM` · 「사업자등록번호 OR 생년월일 (YYMMDD)」 · 「비밀번호」(앞 2자리, placeholder `00`, password)
  - 형식 미달이면 「모든 정보를 입력해 주세요.」 → `PATCH /payment/imp-card-info {data: 암호화 문자열}` (프로토타입: 실제 카드 입력 없이 성공만 흉내)
- 데이터 `GET /payment/card-info` → `cardNumber` (IAMPORT_CARD일 때만)

### 4-3. 「나의 플랜」 카드
- 제목 「나의 플랜」 + (예약 있으면) 「다음 결제일에 '{{scheduledPlanName}}' 플랜으로 변경 예약」
- 오른쪽 「업그레이드」(xs): ko = 채널톡 버튼(`ch-button` 클래스, 자체 onClick 없음), 그 외 언어 = Intercom 메시지 창 열기
- 4칸: 「플랜명」 {planName} · 「기간 내 구독 기기」 {deviceCount 쉼표} · 「예상 결제액」 {KRW 「₩ 12,345」 / USD 「$ 12,345」, 그 외 빈칸} · 「플랜 만료일」 {yyyy-MM-dd 또는 「-」}
- 데이터 `GET /subscription-plan`
- 플랜 변경 모달·결제 완료 모달 코드는 있으나 이 화면에서 여는 경로 없음.

### 4-4. 「나의 포인트」 카드
- 제목 + 「충전하기」(xs) - 결제 담당자 정보와 카드가 둘 다 있어야 활성
- 계산식 3칸(숫자 굴러가는 애니메이션): 「전체 포인트」(balance+reserved) 「-」 「차감 예정」(+도움말 「발송 시 필요한 포인트를 먼저 예약합니다. 발송 성공 시 예약된 포인트가 차감됩니다.」) 「=」 「사용 가능 포인트」(balance)
- 5초마다 `GET /points-v2` 다시 불러옴
- 자동 충전 줄: 토글 + 「자동 충전」 + 설명 + 「* 유료 채널 발송은 사용 가능 포인트로 발송할 수 있습니다.」, 오른쪽 「자동 충전 설정」(xs, 충전하기와 같은 조건)
  - 설명: 꺼짐 「사용 가능 포인트가 설정한 포인트 이하가 될 경우 자동으로 포인트를 충전합니다.」 / 켜짐 「사용 가능 포인트가 {{n}}이하가 될 경우 자동으로 {{nn}}포인트를 충전합니다.」
  - 토글 켜기 → 자동 충전 모달. 끄기 → 브라우저 confirm 「자동 충전 설정을 해제하시겠습니까?\n발송 중 포인트가 부족해질 경우 발송이 중지됩니다.」 → `PATCH /projects/{id} {pointAutoRechargeEnabled:false, …}` → 브라우저 alert 「자동 충전 설정을 해제하였습니다.」
- 충전하기 모달(확인 모달, 확인 버튼 「충전」)
  - 제목 「충전하기」, 카드 이미지 + 「카드번호」
  - 「충전 금액」 버튼 묶음 「100,000」 · 「300,000」 · 「500,000」 · 「직접입력」(누르면 1,000,000 + 숫자 입력, 0~999,999,999)
  - 「<span>₩{{n}}</span>(부가세포함) 결제 후 <span>{{nn}}</span>포인트를 충전합니다.」 (n = 금액 + 10% 버림)
  - 「충전」 → confirm 「포인트를 충전하시겠습니까?」 → `POST /points-v2/charge {amount}` → alert 「충전되었습니다.」 + 닫힘
- 자동 충전 모달(확인 버튼 「설정」)
  - 제목 「자동 충전 설정」, 안내 「사용 가능 포인트보다 충전 포인트가 커야 합니다.」(검사는 안 함)
  - 「사용 가능 포인트 잔액」 「50,000」 · 「100,000」 · 「300,000」 · 「직접입력」 + 「사용 가능 포인트가 <span>{{n}}</span>보다 작으면」
  - 「충전 포인트」 「100,000」 · 「300,000」 · 「500,000」 · 「직접입력」 + 「<span>₩{{n}}</span>(부가세포함)결제 후 <span>{{nn}}</span>포인트를 자동 충전합니다.」
  - 저장된 값이 목록에 없으면 「직접입력」 선택 상태로 열림
  - 「설정」 → `PATCH /projects/{id} {pointAutoRechargeEnabled:true, pointAutoRechargeThreshold, pointAutoRechargeAmount}` → alert 「설정이 저장되었습니다.」

### 4-5. 「포인트 사용 내역」 카드 (제목은 하드코딩 한국어)
- 오른쪽: 단위 셀렉트 「일」(기본) · 「주」 · 「달」 + 기간 선택(기본 최근 30일·어제까지, `excludeToday`, 플랜 제한 없음)
- 범례 3개(**클릭하면 그 계열 켜고 끄기**, 끄면 회색): 「카카오 알림톡」(#F4CE37) · 「카카오 브랜드메시지」(#D67631) · 「문자」(#57BDE2, SMS+LMS+MMS)
- 선 차트(한 축 공유), 툴팁 「카카오 알림톡: 1,234」 식
- 아래 표: 머리 [빈칸] · 「카카오 알림톡」 · 「카카오 브랜드메시지」 · 「문자」 · 「총 사용 포인트」(색 강조 + 도움말 = 단가 목록 「SMS: {단가}원」 · LMS · MMS · 「카카오 알림톡」 · 「브랜드메시지 친구」 · 「브랜드메시지 비친구」)
  - 첫 행 「전체」 합계, 이후 날짜 최신순 `yyyy.MM.dd`
- 데이터 `GET /points-v2/usage?gte&lte&timeZone&interval=days|weeks|months` → `data[]{date, usedPoints{KakaoAlimtalk,KakaoFriendtalk,SMS,LMS,MMS}}`

### 4-6. 「결제정보」 카드
- 탭 「월 결제 내역」(기본) · 「포인트 결제 내역」
- 월 결제 내역
  - 기간 선택 기본 365일 전 ~ 오늘(옵션 없음)
  - 표 「날짜」 · 「수단」(180px: 「신용카드」/「계좌이체」/「-」) · 「금액」(180px, 「12,345 원」) · 「영수증」(100px, 영수증 아이콘 → `billing/receipt/{id}?pid={projectId}` 새 탭, id 없으면 「-」)
  - 페이지네이션 10개씩, 번호 5개, 최대 500페이지, 전체 0건이면 숨김
  - `GET /payment-history?page&per=10&gte&lte&timeZone` → `data[]`, `meta.totalCount`
- 포인트 결제 내역
  - 표 「날짜」 · 「충전 타입」(180px: USER 「사용자」, 그 외 「자동 충전」) · 「충전 포인트」(280px) · 「금액」(280px, 「₩12,345」)
  - 커서 방식: 다음 커서가 있으면 아래 「MORE」(tertiary sm) 버튼으로 이어 붙임
  - `GET /points-v2/history?cursor` → `data[]`, `meta.cursor`

---

## 목업용 GET 엔드포인트 · 응답 필드
| 화면 | GET (프로젝트 경로 뒤) | 쓰는 필드 |
|---|---|---|
| 공통 | `/projects/{id}` | `name, fallbackTimeZone, accessToken, promotion, purchaseConversionConfig{eventType,attributionWindowHours,currency,priceKey,quantityKey}, frequencyCappingConfig{채널:{daily,weekly:{active,maxCount}}}, throttleConfig{채널:number\|null}, isCrmEventExportEnabled, pointAutoRechargeEnabled/Threshold/Amount, unitPriceSMS/LMS/MMS/KakaoAlimtalk/KakaoBrandMessageF/KakaoBrandMessageN` |
| 공통 | `/subscription-plan` | `planName, scheduledPlanName, deviceCount, currency, planPayAmount, expiredAt` |
| 공통(스토어) | 현재 프로젝트 | `id, name, paymentMethod(STRIPE\|BANK\|IAMPORT_CARD)`, 설정 `countryCodes[].currency` |
| 대시보드 | `/stats/all-devices-count`, `/stats/subscribed-devices-count` | `data{android, ios, webDesktop, webMobile}` |
| 대시보드 | `/stats/new-and-unsubscribed-devices-count?gte&lte&timeZone` | `data[]{date(yyyy-MM-dd), new, unsubscribed}` |
| 대시보드 | `/stats/sent-converted-count?…` | `data[]{date, sent, converted}` |
| 대시보드 | `/stats/average-converted-per-hour?…` | `data[]{hour, average(0~1)}` |
| 대시보드 | `/stats/converted-message-rank?…&senderSource=console\|api&per` | `data[]{title, body, average, total}` |
| 프로젝트 | `/members` | `data[]{id(초대 대기면 없음), email, admin, oneTimePasswordMFAEnabled, createdAt}` |
| 프로젝트 | `/v1/permissions`(프로젝트 경로 없음), `/roles` | `data[]{id, name, resource}` / `data[]{id, name, permissions[]{id}}` |
| 고급 설정 | `/configs`, `/project-config` | `sendLatestDeviceOnly, deleteDeviceOnPushFeedback, enforceMFA` / `allowedIps[]` |
| 데이터 연동 | `/stats/recent-events?gte&lte&timeZone&type&subjectType&subjectId` | `data[]{createdAt, type, subjectType, subjectId, data}` |
| 데이터 연동 | `/crm-event-export-config`, `/crm-event-export-config/available-event-types` | `isEnabled, destinationRoleArn, destinationBucket, destinationPrefix, eventTypes[], updatedAt` / `data[]{value, channel}` |
| 데이터 연동 | `/data-management/events?page=1&per=500` | `data[]{id, name, description, data[]{key,description,examples[]}, hidden, readOnly, trends[14]}` |
| 데이터 연동 | `/data-management/tags?page=1&per=500` | `data[]{id, name, description, hidden, readOnly, syncRate(0~1\|null), examples[]}` |
| 결제 | `/payment/info` | `companyName, managerName, managerEmail, managerTel` |
| 결제 | `/payment/card-info` | `cardNumber` |
| 결제 | `/points-v2` | `balance, reserved` |
| 결제 | `/points-v2/usage?…&interval` | `data[]{date, usedPoints{KakaoAlimtalk,KakaoFriendtalk,SMS,LMS,MMS}}` |
| 결제 | `/payment-history?page&per=10&gte&lte&timeZone` | `data[]{id, createdAt, method, amount}`, `meta.totalCount` |
| 결제 | `/points-v2/history?cursor` | `data[]{createdAt, createdBy(USER\|…), chargingPoint, amount, currency}`, `meta.cursor` |

쓰기(목업에선 성공만 흉내): POST `/stats/*/export`(→ `data.url`), PATCH `/projects/{id}`, DELETE `/projects/{id}`, POST/PATCH/DELETE `/members…`, PUT `/roles/{id}`, PATCH `/configs`, PUT `/project-config`, PATCH `/crm-event-export-config`, POST/PATCH/DELETE `/data-management/events…`·`/tags…`, PATCH `…/visibility`, PATCH `/payment/info`, PATCH `/payment/imp-card-info`, POST `/points-v2/charge`.

## 확인 못 한 것
- API 키 라벨: 코드가 `project` 네임스페이스의 `apiKey` 키를 쓰는데 ko·en 로케일 어디에도 없음 → 실제 화면엔 키 이름 「apiKey」가 그대로 보일 가능성이 큼. 스테이징 화면으로 확인 필요.
- 대시보드 랭킹 카드의 기본 표시 개수(`per` 미지정 → 서버 기본값).
- 모든 페이지의 `getServerSideProps` 리다이렉트(권한·플랜에 따른 서버 쪽 이동) - 번들만으로는 알 수 없음.
- 프로젝트 삭제 뒤 어느 프로젝트/주소로 이동하는지(목록 재조회 함수만 확인, 이동 경로 세부는 미확인).
- 서버 검증 문구(이벤트·태그 이름 중복, 초대 이메일 형식 등) - 화면 검사 없이 서버 메시지가 그대로 토스트됨.
- 기여 기간 「시간」 단위의 최대값(일 최대 7만 확인).
- 영수증 페이지(`/billing/receipt/[receiptId]`) 내용 - 범위 밖으로 두고 보지 않음.
- 로케일에만 있고 이 화면 코드에서 안 쓰이는 문구: `project.json`의 「회원 탈퇴 요청」 · 「새 프로젝트」 · 「프로젝트 생성」, `member.json`의 일부 등.
- 실제 픽셀 모양(색·간격)은 이 문서 범위 밖 - Figma 시안 기준.
