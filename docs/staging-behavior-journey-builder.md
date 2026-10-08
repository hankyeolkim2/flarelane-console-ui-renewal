# 스테이징 콘솔 동작 명세 - 고객 여정 빌더 (`/journeys/new`, `/journeys/[journeyId]/edit`)

- 출처: `https://staging-console.flarelane.com` 공개 번들 JS(buildId `Q-tOYo7BMgpuoKSGYkmC0`, 404 페이지 `__NEXT_DATA__`로 재확인) + `/locales/ko/{automation,common,aiAgent,in-app-message,kakao,sms,email,newMessage,segment}.json` 정적 분석. 로그인·API 호출 없음 (2026-10-08).
- 분석 대상 모듈: 신규 페이지 60610, 수정 페이지 11227, 캔버스 96803(청크 7845, `next/dynamic` + `ssr:false`로 지연 로드), 저장 훅 78498, 변환·검증 36785, 노드 기본값 65192.
- 문자열은 ko 로케일 값을 그대로 인용. `ns:key` = 번역 네임스페이스:키. 로케일에 없는 문자열은 "(하드코딩)".
- 피드백 표기: **토스트** = `error`/`success` 토스트, **alert/confirm** = 브라우저 `window.alert` / `window.confirm`.
- API 경로는 `https://staging-service-api.flarelane.com/v1/projects/{projectId}` 기준 상대경로.
- 이 문서는 `staging-behavior-journeys-inapp.md` §4(빌더 요약)를 대체·확장한다. 목록·상세·여정 예약 모달은 그 문서 §1~§3, 새 메시지와 공유하는 메시지 에디터 내부는 `staging-behavior-new-message-templates.md`를 따른다.

---

## 0. 한눈에

| | `/journeys/new` | `/journeys/[journeyId]/edit` |
|---|---|---|
| 초기 데이터 | ENTRY 노드 1개(`entryType:"EVENT"`, 조건 비어 있음) + 기본 설정(§3.3) | `GET /automations/{id}` 로 복원. 실패하면 `router.push("/journeys")` |
| 캔버스 옵션 | 통계·전환 데이터·분석 끔. 편집 가능 | 한 번도 활성화 안 됨(`lastActivatedAt` 없음) → 신규와 같음 / 활성화 이력 있음 → 읽기 전용(§1.6) |
| `isUserAutomation` | 항상 `true` | 응답의 `isUserAutomation` |
| 저장 | `POST /automations` | `PATCH /automations/{id}` |
| AI 개선 버튼 | 없음 | 있음(§5) |

---

## 1. 페이지 골격

### 1.1 헤더
- 전체화면이 **아닐 때만** 카테고리 제목 표시: 신규 `automation:category.newAutomation`="새 고객 여정 자동화" / 수정 `category.editAutomation`="고객 여정 자동화 수정".
- 좌측: ← 뒤로 아이콘(두 페이지 모두 `/journeys`) + 이름 입력(`id="journey-name"`, `aria-label` = `journeyNameLabel`="여정 이름", placeholder `placeholder.title`="새 여정 이름 입력"). 길이 제한·빈 값 검증 **없음**.
- 우측 버튼(순서대로):

| 버튼 | 신규 | 수정 |
|---|---|---|
| AI 개선 아이콘 버튼(텍스트 없음) | - | 전역 AI 채팅 패널이 닫혀 있을 때만 노출. 열린 상태면 강조 스타일(§5) |
| tertiary xs `exit`="취소" | → `/journeys` | → `/journeys/{id}` (상세) |
| primary xs `save`="저장" | 저장 중 로딩 | 저장 중 로딩, **AI 개선 패널이 열려 있으면 disabled** |

### 1.2 전체화면 모드
- 두 페이지 모두 **기본값 = 전체화면**. 전체화면 = 뷰포트 기준 `position:fixed; top:0; left:0; z-index:99999` 오버레이(사이드바·GNB를 덮음). 우측에 AI 채팅이 도킹돼 있으면 그 폭만큼 비켜 줌.
- 전체화면 동안 상단 중앙에 검은 반투명 알약 배너(아이콘 + `alert.fullscreen`="혹은 ESC키를 누르면 전체 화면 모드가 종료됩니다."). **4초 뒤 0.5초간 페이드아웃**.
- **ESC**(keyup) → 전체화면 해제 + 시작 노드로 화면 재정렬. 다시 켜는 키보드 단축키는 없음.
- 캔버스 좌하단 아이콘 버튼 3개(32×32, 호버 시 검은 툴팁, 툴팁 문구 모두 영문 하드코딩):
  1. "Find Entry" - 시작 노드를 화면 중앙 상단으로(노드 3개 이상이면 배율 0.75, 아니면 1).
  2. "Arrange" - 자동 정렬(드래그 불가 모드면 숨김). 레벨별 세로 300px 간격, 연결 안 된 노드는 시작 노드 오른쪽 +500px부터 한 줄 5개 격자.
  3. "Fullscreen" / "Exit Fullscreen" - 토글.
- 모바일 폭: 전체를 덮는 안내 "Mobile access is not supported." / "Please use a PC to access this page." (하드코딩).

### 1.3 이탈 방지
- 진입 시 `routeChangeStart`에 `window.confirm(common:alert.checkEscape)` = "변경사항이 저장되지 않았습니다. 페이지를 벗어나시겠습니까?" 연결. 취소 → 이동 중단. `beforeunload`도 같은 문구.
- 헤더 ←/취소, 웹훅 "+ 새 웹훅", 이벤트 셀렉트 "+ 새 이벤트" 등 **모든 내부 이동에 적용**. 저장 성공 직전에만 해제.

### 1.4 저장 검증 순서 (실패 시 저장 중단)
"저장" 클릭 → 캔버스 좌표를 편집 데이터에 동기화 → 아래 순서.

| # | 조건 | 피드백 |
|---|---|---|
| 1 | 화살표가 하나도 들어오지 않는 노드(ENTRY 제외)가 있음 / 화살표 대상 노드가 없음 | 토스트 `alert.action_conn`="연결되지 않은 액션이 있습니다." |
| 2 | A/B Test 노드의 (미발송 그룹 제외) 그룹 중 연결 안 된 것이 있음 (구버전 `AB` 노드는 두 갈래 중 하나라도 비면) | 토스트 `alert.ab_action_conn`="AB액션은 모두 연결하여야 합니다." |
| 3 | ENTRY의 `entryType` 없음 | 토스트 `error.emptyType`="시작 조건을 먼저 선택해야 합니다." (신규 기본값이 `EVENT`라 보통 안 걸림) |
| 4 | 액션 내용 검사(아래) | 토스트 `error.invalidAction`="메시지 내용이 비어있습니다." 또는 아래 특수 메시지 |

4번 액션 검사 - 하나라도 걸리면 실패, 메시지는 마지막으로 설정된 특수 메시지 또는 기본 문구:

| 노드 | 실패 조건 | 특수 메시지 |
|---|---|---|
| Push | `body` 없음 | - |
| Webhook | `webhookId` 없음 | - |
| Kakao Alimtalk | `templateId` 없음 | 카카오 발신 프로필이 0개면 `NO_SENDER_PROFILE`="카카오 발신 프로필이 없습니다." |
| Kakao BrandMessage | `senderId` 없음 | 발신 프로필 0개면 같은 문구 |
| SMS | `body` 없음 또는 프로젝트 `smsSenderNumber` 없음 | 발신 번호가 없으면 `NO_SENDER_NUMBER`="SMS 발신 번호가 없습니다." |
| Email | `senderEmail`·`title`·`body` 중 하나라도 없음 | - |
| In-App Message | `htmlString` 없음 | - |
| Segment Split | `segment`·`userSegment` 둘 다 없음 | - |
| Event Split | 이벤트 조건 0개 | - |
| Trigger Event | 이벤트 타입 없음 | - |
| Update Tags | 태그 0개 | - |

- 위 외의 노드별 메시지(이벤트/세그먼트 조건 비어 있음, 웹훅 데이터, 인앱 캠페인 명, 개인화 변수 등)는 **저장 시점이 아니라 각 패널의 "확인" 시점**에 뜬다(§3, §4).
- 여정 이름 빈 값, 시작 조건의 이벤트 비어 있음(`event: []`)은 클라이언트에서 막지 않음.

### 1.5 저장 요청 · 이후
- 신규 `POST /automations`, 수정 `PATCH /automations/{id}` (페이로드 §6.2). 수정 성공 시 해당 여정 캐시 키(`/conversions/automations/{id}`, `/automations/{id}`) 삭제.
- 성공 → 이탈 방지 해제 → **토스트 없이** `/journeys/{응답 data.id}`(상세)로 이동.
- 실패 → `console.error`만(화면 처리 없음, 서버 메시지 토스트는 공통 axios 인터셉터 몫 - new-message 문서 서두 참조).

### 1.6 수정 페이지 - 활성화 이력 있는 여정
- 좌측 툴박스 숨김, 노드 드래그·연결·복제·삭제 불가, 패널은 열리지만 읽기 전용(하단 "닫기" 버튼만 + `ID: {액션 id}` 표시).
- "저장"을 눌러도 아무 동작 없음(버튼은 활성 모양 그대로).
- 통계·분석 옵션은 끄지 않아 하단 "통계" 토글과 노드 패널의 "메시지 정보/메시지 분석"(또는 "상세 정보/진입 분석") 탭이 보이지만 기간·통계 데이터를 넘기지 않음(실제 표시는 상세 화면 `/journeys/[id]`의 몫).
- 저장된 편집기 JSON이 없거나 서버 액션과 어긋나면 노드를 재구성하고 첫 진입 시 자동 정렬.

### 1.7 전역 AI 채팅 연동 (참고)
- 빌더가 편집 가능할 때 전역 AI 에이전트 채팅에 "노드 추가/수정/삭제, 노드 패널 열기, 전환 이벤트 설정, 발송 설정(DND·`handlingOnPause`·`entryPolicy`) 변경" 핸들러를 등록. 채팅이 노드를 추가하면 자동 정렬, 노드 열기 요청이면 해당 패널을 연다. 채팅 UI 자체는 이 문서 범위 밖.

---

## 2. 캔버스 모델

### 2.1 노드 타입

| 내부 `type` | 툴박스/카드 표기(하드코딩 영문) | 그룹 | 기본값(드롭 직후) | 출력 핸들 |
|---|---|---|---|---|
| `ENTRY` | 카드 제목 "다음 이벤트가 발생할 때" / "다음 조건을 만족할 때" (`whenEventOccurs`/`whenSegmentOccurs`) | - | `entryType:"EVENT"`, 조건 전부 비어 있음 | 1개(`ENTRY`, 회색) |
| `SEND_NOTIFICATION` | "Push" | Channels | `body:""`, `data:{}`, `waitMinutes:0` | 성공(파랑) · 실패(빨강) |
| `SEND_ALIMTALK` | "Kakao Alimtalk" | Channels (ko 로케일만) | `templateId:""` | 성공 · 실패 |
| `SEND_FRIENDTALK` | "Kakao BrandMessage" | Channels (ko만) | `messageType:"FI"`, `isAdvertisement:true`, `isAdultContent:false`, `shouldSendPushAlarm:true`, `targeting:"I"` | 성공 · 실패 |
| `SEND_SMS` | "SMS" | Channels (ko만) | `body:""`, `isAdvertisement:true` | 성공 · 실패 |
| `SEND_EMAIL` | "Email" | Channels | 모두 빈 문자열. **프로젝트 `emailChannelEnabled`가 아니면 비활성** + 툴팁 `action.emailDisabled`="이메일 채널이 활성화된 프로젝트에서만 사용할 수 있습니다." | 성공 · 실패 |
| `DISPLAY_IN_APP_MESSAGE` | "In-App Message" | Channels | `ttlMinutes:4320`(3일), `editorType:"gui"`, html 비어 있음 | 1개(회색) |
| `EXECUTE_WEBHOOK` | "Webhook" | Channels | `webhookId:""` | 성공 · 실패 |
| `TIME_DELAY` | "Delay" | Flows | `type:"AFTER"`, `waitMinutes:60` | 1개(회색) |
| `AB_TEST` | "A/B Test" | Flows | 그룹 A 50% · B 50%, 미발송 그룹 없음 | 미발송 아닌 그룹마다 1개(회색) |
| `SPLIT_BY_EVENT_CONDITIONS` | "Event Split" | Flows | `event:[]` | "Yes"(파랑) · "No"(빨강) |
| `SPLIT_BY_SEGMENT_CONDITIONS` | "Segment Split" | Flows | 세그먼트 없음 | "Yes" · "No" |
| `TRIGGER_EVENT` | "Trigger Event" | Flows | `event:{type:"",data:{}}` | 1개(회색) |
| `UPDATE_TAG` | "Update Tags" | Flows | `tags:{}` | 1개(회색) |
| `AB` (구버전) | 카드 "A {n}%" / "B {n}%" | 툴박스에 **없음**(기존 데이터에서만) | `split:[50,50]` | 2개 |

- 툴박스 순서: **Channels** = Push · Kakao Alimtalk · Kakao BrandMessage · SMS · Email · In-App Message · Webhook / **Flows** = Delay · A/B Test · Event Split · Segment Split · Trigger Event · Update Tags. 섹션 제목 "Channels"/"Flows"도 하드코딩 영문. 항목 = 색 아이콘 칩 + 라벨.
- 핸들 색: 성공 `brand400`, 실패 `red600`, 시작·기본 `gray500`. Delay·Trigger Event·Update Tags·In-App·A/B Test에서 나가는 화살표는 회색, 텍스트 없음.
- 빌더에는 "Exit/종료" 노드가 없다. 출력이 연결되지 않은 노드에서 여정이 끝난다.

### 2.2 노드 추가 · 연결 · 복제 · 삭제
- **추가 = 드래그 앤 드롭만**(+ 버튼/메뉴 없음). 좌측 툴박스 항목을 캔버스에 놓으면 그 위치에 연결 안 된 노드 생성. 툴박스 위에서 놓으면 취소. 읽기 전용이면 드롭 무시.
- **연결**: 노드 아래 작은 핸들(사각형 안 마름모)을 끌어 대상 노드 위에 겹치면 대상이 하이라이트, 놓으면 화살표 생성. 이미 연결된 출력에는 핸들이 보이지 않음. 연결 불가 대상:
  - 이미 들어오는 화살표가 있는 노드(노드당 입력 1개),
  - ENTRY 노드,
  - 출발 노드의 부모(바로 되돌아가는 연결),
  - A/B Test(·구버전 AB)에서 다른 A/B Test/AB로.
- **연속 15개 제한**: 연결 후 시작 노드부터 가장 긴 경로의 "카운트 대상" 노드 수가 15 초과면 연결 취소 + 토스트 `alert.treeMaxLevel`="액션은 연속으로 최대 15개까지 연결할 수 있습니다." 카운트 대상 = Push · Webhook · In-App · Alimtalk · SMS · Email · Event Split · Segment Split · Trigger Event · Update Tags (**BrandMessage · Delay · A/B Test는 세지 않음**).
- **화살표 삭제**: 화살표에 호버하면 빨간 원 × → 클릭 즉시 삭제(확인 없음).
- **노드 복제**: 노드 호버 시 오른쪽에 복사 아이콘 → 클릭하면 같은 내용의 새 노드를 오른쪽 옆에 생성(연결 없음, A/B 그룹 id 재발급). ENTRY·화살표·읽기 전용에선 없음.
- **노드 삭제**: 노드 패널 하단 "삭제" → `confirm(automation:delete.action)`="액션을 삭제합니다." → 노드와 붙은 화살표 함께 삭제. ENTRY·발송 설정·전환 패널엔 삭제 버튼 없음.
- 노드 클릭 → 해당 패널 열림(다른 패널은 닫힘). 패널이 열린 노드는 캔버스에서 하이라이트.

### 2.3 노드 카드 요약 텍스트
| 노드 | 카드 내용 |
|---|---|
| ENTRY | 이벤트형: 첫 이벤트명(가운데 정렬). 세그먼트형: 필터 라벨 + 값 줄 목록, 그룹 사이 "OR" |
| Push | "Push" · (구버전 대기 있으면 `c-send-d/h/m` "{{v}}일 동안 대기 후 발송") · 캠페인 명 · 제목 · 본문 · "발송 플랫폼" 아이콘 |
| Alimtalk / SMS / BrandMessage / Email | 채널명 · 캠페인 명 · 본문(BrandMessage는 메시지 타입 + text/header, Email은 제목) |
| In-App | "In-App Message" · 캠페인 명 · `in-app-message:expirationPeriod`"노출 예약 기간: {v} {단위}" |
| Delay | "Delay" · "{v} {일/시간/분}" 또는 "HH:MM 까지" |
| Event Split | "Event Split" · `c.event.action.entry`="여정 진입 이후부터\n{{event}} {{operator}} {{n}} 회 발생" 또는 `c.event.action`="최근 {{time}}{{interval}} 이내\n…" |
| Trigger Event / Update Tags | 이벤트 타입 / 태그 목록 |
| A/B Test | 그룹명 + "{n}%" 줄 |

### 2.4 노드 패널 공통 (우측 슬라이드)
- 흰 배경, 왼쪽 테두리 gray200, 슬라이드 인/아웃 0.1s(닫기 75ms 지연). 폭: 기본 **520px** / medium **620px** / wide **900px** / full **calc(100% - 240px)**.
- 하단 버튼: (편집 가능) secondary xl destructive "삭제"(`common:button.delete`) · 우상단 X(`aria-label`="닫기") · primary xl "확인"(`button.confirm`, 처리 중 로딩) / (읽기 전용) "닫기" 하나 + `ID: {id}`.
- "확인" = 패널 값 검증 후 편집 데이터에 반영하고 닫힘. 서버 호출 없음(이미지 업로드 제외).
- 구버전 데이터에서 `waitMinutes`가 0이 아니면 Push·Webhook·Event Split·Segment Split 패널 맨 위에 "대기 시간"(`waitTime`) 행이 추가로 보임(새 노드에선 안 보임). 설명: Push·Webhook = `settings.desc.dnd`="다음 시간만큼 기다린 후 종료 조건을 만족했는지 확인합니다.", 분기 = `settings.con.dnd`="다음 시간만큼 기다린 후 조건을 만족했는지 확인합니다."

| 패널 | 폭 |
|---|---|
| 시작 조건, Event Split, Segment Split, 전환 이벤트 설정 | wide |
| Delay, Trigger Event, Update Tags | medium |
| Push, Alimtalk, BrandMessage, SMS, Email, In-App, Webhook | full |
| A/B Test, 발송 설정, 구버전 AB | 기본 |

### 2.5 캔버스 좌측 버튼 묶음
- 캔버스 왼쪽 세로 가운데에 툴박스(높이 478, 넘치면 스크롤) + 흰 카드(160×40 버튼들):
  - "통계"(`stat`) 토글 - 빌더에서는 숨김(통계 옵션 꺼짐).
  - "여정 분석"(`analytics.title`) - 빌더에서는 숨김.
  - **"전환 이벤트 설정"**(`button.conversion`) → §3.4 패널 토글.
  - **"발송 설정"**(`sendOptions`) → §3.3 패널 토글.
- AI 개선 미리보기 중 바뀐 항목이 있으면 해당 버튼·ENTRY 카드·노드·화살표에 보라-파랑 그라디언트(`#3C79FF → #B54DFF`) 테두리(§5).

---

## 3. 시작 조건 · 발송 설정 · 전환 이벤트

### 3.1 시작 조건 패널 (ENTRY 노드 클릭, wide, 삭제 버튼 없음)
- 상단 유형 카드 2개(72px 아이콘 + 라벨): **"이벤트 기반"**(`eventBased`, `EVENT`) / **"세그먼트 기반"**(`segmentBased`, `SEGMENT`). 다른 유형을 누르면 입력값 전부 초기화(진입 이벤트 1행, "모든 유저", 종료 이벤트 없음, 비회원 옵션 "미포함"). 읽기 전용이면 전환 불가.

**이벤트 기반**
| 행 | 내용 |
|---|---|
| "진입 대상"(`entry.target`) | 라디오 "모든 유저"(`everyUser`, 기본) / "다음 조건 만족 유저"(`segmentUser`) → 세그먼트 필터 빌더(§3.2). 이 경우 필터 목록에서 CSV · PLATFORM · SDK_VERSION · APP_VERSION · OS_VERSION · WEB_BROWSER · EVENT 제외 |
| "비회원 기기 포함 여부"(유저 자동화만) | 도움말 `entry.anonymousUsersFilter.helpText`="유저 ID가 없는 비회원 기기를 포함할지 설정합니다." · 셀렉트 "미포함"(`EXCLUDE`, 기본) / "포함"(`INCLUDE`) / "비회원 기기만"(`ANONYMOUS_DEVICE_ONLY`) |
| "진입 시점"(`entry.point`) | 설명 "다음 이벤트가 발생할 때 여정 진입"(`entry.point.eventDesc`) + 이벤트 행 1개(§3.2). 이벤트 추가("그리고") 버튼 없음, 행 삭제 불가, 필터 최대 3개, 연산자 9종(아래) |
| "종료 조건"(`slide.exit.title`) | 설명 "다음 이벤트가 발생할 때 여정 종료"(`stopEventOccurs`). 비어 있으면 링크 "+ 종료 이벤트 추가"(`addEvent`) (읽기 전용이면 "종료 조건이 없어 모든 메시지 발송"(`noEvent`)). 이벤트 그룹마다 아래 "또는", 마지막에 secondary xs "또는"(`common:OR`) 버튼 - 그룹 1~4개일 때만(최대 5개). 각 그룹 = 이벤트 1개 + 필터 최대 3개 + 삭제 아이콘 |

**세그먼트 기반**
| 행 | 내용 |
|---|---|
| "진입 대상" + 부제 "대상 세그먼트에 포함될 때 진입"(`entry.point.segmentDesc`) | 세그먼트 필터 빌더(제외 필터 없음, 코호트 포함) |
| "비회원 기기 포함 여부" | 이벤트 기반과 같음(유저 자동화만) |
| "종료 조건" | 고정 문구 "진입 조건을 만족하지 않게될 때 여정 종료"(`segment.finishCondition`) |

**"확인" 검증 순서**
1. 비회원 옵션이 "미포함"이 아니면 진입 대상 필터는 `TAG` · `CREATED_AT_WITHIN_HOURS` · `LAST_DEVICE_ACTIVATED_AT_WITHIN_HOURS` · `COUNTRY_CODE` · `LANGUAGE_CODE` · `USER_ID`만 허용 → 위반 시 토스트 `error.invalidFilter`="비회원 기기가 포함되면 유저 ID, 태그, 최초 생성 시간, 마지막 접속 시간, 국가, 언어 필터만 선택할 수 있습니다." 캔버스의 Segment Split 필터가 위반하면 `error.invalidSegmentSplitFilter`="Segment Split 액션 중 비회원 기기에 사용할 수 없는 필터가 있습니다.\n필터는 …만 선택할 수 있습니다."
2. 이벤트 기반: 진입/종료 이벤트 중 이벤트명 빈 행, 키·연산자·값 중 빈 필터가 있으면 토스트 `error.emptyEvent`="이벤트 상세 조건이 비어있습니다."
3. "다음 조건 만족 유저" 또는 세그먼트 기반: 필터 형식 불량이면 토스트 `error.invalidSegment`="세그먼트 상세 조건이 비어있습니다."
4. 통과 → 반영 후 닫힘. 저장 형태: 이벤트 기반은 `entryConditions{event, segment|userSegment, anonymousDeviceFilterOption}` + 종료 이벤트 있으면 `exitConditions{event, segment:null}`(없으면 `null`). 세그먼트 기반은 `event:null`, `exitConditions:undefined`. 유저 자동화면 필터가 `userSegment`, 아니면 `segment`.

### 3.2 이벤트 행 · 세그먼트 필터 빌더 (공유 컴포넌트)
- **이벤트 행**: 이벤트 검색 셀렉트(하단 "+ 새 이벤트" → `/data-management?n=e`; 이벤트 목록 = `GET /data-management/events?page=1&per=500`) + 링크 "+ 필터"(`plusFilter`, 최대치면 비활성) + (허용 시) 삭제 아이콘.
- **필터 행**: 데이터 키 검색 셀렉트(`…/events/{event}/data/keys`) · 연산자 셀렉트(기본 `=`) · 값 입력/셀렉트(`…/data/keys/{key}/values`, 비면 "전체 중 최근 일부가 표시됩니다.") · ⋮ 메뉴 · 삭제.
  - 연산자: 진입 이벤트 = `=` `≠` `>` `≥` `<` `≤` "이 중에 하나" "포함" "포함하지 않음" / 종료 이벤트·Event Split = 앞의 7개("포함"·"포함하지 않음" 없음).
  - ⋮ 메뉴 항목 `useEntryEvent`="시작 조건 이벤트의 데이터와 비교" - 켜면 값 칸 앞에 `{시작 이벤트명 또는 entry_event}.data.` 접두어 + 자유 입력(`isValueEntryEventDataKey:true`). 진입 이벤트 행에는 메뉴 없음(종료 이벤트·Event Split에서만).
- **세그먼트 필터 빌더**: 세그먼트 생성 화면(`/user-segments/new`)과 같은 모듈. "필터 선택" placeholder, 그룹 내 "그리고", 그룹 간 "또는", CSV 업로드 등. 필터 종류는 앱 설정(`configs.userSegmentFilters` 또는 `segmentFilters`)에서 옴.

### 3.3 발송 설정 패널 ("발송 설정" 버튼, 기본 폭, 삭제 없음)
| 섹션 | 내용 | 기본값 |
|---|---|---|
| "재진입 정책 설정"(`entryPolicy`) | 라디오 "재진입 불가"(`Once`) / "여정 종료 후 재진입 허용"(`ReEntryAfterCompletion`) / "시작 조건 만족 시마다 재진입 허용 (이벤트 전용)"(`ReEntry`; 세그먼트 기반에서도 비활성 처리 없음) | `Once` |
| └ "재진입 주기"(`entry.reAfterComplete.interval`, 두 번째 선택 시) | 라디오 "즉시"(`…interval.immediately`, mode `null`) / (라벨 없는 라디오) 숫자 + 단위 셀렉트 "일 (23:59까지)" · "시간" (분 없음). 시간 1~2160, 일 0~90. 일 → mode `endOfDays`(값 = 일수), 시간 → `minutes`(값 = 분) | 즉시, 입력 기본 1시간 |
| "발송 설정"(`sendOptions`) - 프로젝트에 발송 빈도 제한이 켜져 있을 때만 | "메시지 발송 빈도 제한" + 도움말(`common:ignoreFrequencyCapping.help` + `<br />` + `ignoreFrequencyCapping.alimtalkNote`="알림톡은 발송 빈도 제한이 항상 무시되어, 위 설정과 관계없이 발송됩니다.") + 토글(켜면 무시) | 꺼짐 |
| "방해 금지 시간대"(`settings.dnd`) | 시작/끝 셀렉트 "0:00"~"23:00" 사이 "~" + 0~24시 막대(범례 "발송" 파랑 / "미발송" 빨강) + "메시지 발송 시점이 방해 금지 시간대에 포함된 경우" 라디오 "다음 가능 시간으로 발송 재예약"(`DELAY`) / "발송 취소 및 현재 여정 종료"(`CANCEL`) | 21:00 ~ 8:00, `DELAY` |

- 검증 없음. "확인" 시 `settings.dnd`, `ignoreFrequencyCapping`, `entryPolicy`, `reEntryAfterCompletionMode/Duration` 반영.
- `ignoreFrequencyCapping`은 저장 시 각 메시지 액션 `payload`에 들어감(여정 최상위 필드 아님).
- **빌더에 없는 것**: 여정 예약(시작/종료/타임존)과 일시중지 시 발송 대기 처리(`handlingOnPause`)는 빌더 UI에서 편집 불가(상세 화면의 "여정 예약" 모달 / 목록·상세의 일시중지 모달 - 기존 문서 §1.6·§3). `handlingOnPause`는 저장 페이로드에도 없음(기본값 `PROCESS`는 내부 상태로만 존재).

### 3.4 전환 이벤트 설정 패널 ("전환 이벤트 설정" 버튼, wide, 삭제 없음)
- 제목 `newMessage:setConversionConfigs`="전환 이벤트 설정". 새 메시지 §2.8과 같은 컴포넌트(채널 `AUTOMATION_ACTION`).
- 차이: "전환 측정 기준" 라벨 뒤 "(푸시 알림)", 라디오 "클릭 기반"(기본)/"발송 기반", 아래 안내 `automation:conversion.info`="카카오 메시지와 문자는 <span>발송 기반</span>, 인앱 메시지는 <span>클릭 기반</span> 측정 기준을 사용합니다."
- 탭 최대 10개, 필터 최대 3개, 기여 기간 1시간~30일(기본 72시간).
- "확인" 검증 실패는 **alert**: "전환 이벤트를 선택해주세요." / "전환 이벤트 필터를 선택해 주세요." / "기여 기간을 선택해 주세요." "미설정"이면 `conversionConfigs:null`.

---

## 4. 액션 노드 패널

> 메시지 에디터가 새 메시지 화면과 **같은 모듈(같은 청크)**인지 여부를 함께 표기. "공유"면 필드·제한·문구는 `staging-behavior-new-message-templates.md`의 해당 절을 그대로 따른다.

### 4.1 Push (full)
- 제목 줄: 아이콘 + "Push".
- 행: **"캠페인 명"**(`common:campaignName`, placeholder "캠페인 명 (선택)") → **"발송 플랫폼"**(`targetPlatform`, 4개 토글, 기본 android·ios·webDesktop·webMobile 전부) → **"메시지"** + (편집 시) AI 작성 버튼 + 메시지 에디터(제목·본문·URL·이미지·버튼·데이터, **공유** 2.4) + 우측 미리보기(**공유** 2.6, 하단 "테스트 발송") → **"추가 세그먼트"**(`additionalDeviceSegmentFilters`) 라디오 `automation:segAll`="비활성화"(기본) / `segFilter`="활성화" → 세그먼트 필터 빌더(CSV · PLATFORM · SDK/APP/OS_VERSION · WEB_BROWSER · EVENT · COHORT_AMPLITUDE · COHORT_MIXPANEL 제외).
- 개인화 변수: 시작 조건이 이벤트 기반이면 `entry_event.data` 옵션 추가(§4.14).
- "확인" 순서: 본문 없음 → 토스트 `error.emptyMessage`="메시지 내용이 비어있습니다." → 보이지 않는 특수문자 → alert `common:alert.nonPrintableChar` → 추가 세그먼트 형식 불량 → 토스트 `error.invalidAdditionalDeviceSegmentFilters`="추가 세그먼트 상세 조건이 비어있습니다." → 새 이미지 파일이면 업로드 후 반영.
- 테스트 발송 모달(공유 2.7): 성공 토스트 "메시지가 성공적으로 발송되었습니다.", 오류 "메시지 내용을 입력해 주세요." / "테스트 기기를 선택해 주세요."
- **푸시 노드에 "대기 시간"은 새로 설정할 수 없음**(구버전 값이 있을 때만 행 노출).

### 4.2 Kakao Alimtalk (full)
- 새 노드(템플릿 없음)로 패널을 열면 **"템플릿 선택" 모달 자동 오픈**: 좌측 검수 완료(`inspection=COM`) 템플릿 목록(행 = 템플릿 코드 + 이름, 페이지당 5개, 페이지네이션) + 우측 "미리보기". 하나를 골라야 확인 활성.
- 패널 행: "캠페인 명" → "메시지" + secondary 버튼 `kakao:selectTemplate`="템플릿 선택" → (선택 후) "카테고리" · "템플릿 이름" · "템플릿 코드" + 템플릿 본문(읽기 전용, 알림톡 템플릿 컴포넌트 **공유**) + **"개인화 변수 설정"**(`setInterpolations`): 템플릿 변수마다 `키 이름 | 입력칸`(Enter 막힘, 개인화 `{}` 사용 가능). 미선택이면 큰 "+" 박스.
- 우측 "미리보기"(알림톡 미리보기 **공유**) + secondary xs "테스트 발송" → 카카오/SMS 테스트 모달(유저 ID/전화번호 조회형, new-message 3.1과 같은 형태).
- "확인": 템플릿 없으면 무반응 → 빈 변수 → 토스트 "개인화 변수를 모두 입력해주세요."(하드코딩, `automation:error.alimtalkVars`와 같은 문구) → 특수문자 alert → 반영(`campaignName`, `templateId`, `interpolations`).

### 4.3 Kakao BrandMessage (full)
- 행: "캠페인 명" → (타기팅 값이 있으면) 타기팅 선택(BrandMessage 권한 기반) → "메시지"(BrandMessage 에디터 **공유**: 메시지 타입·헤더·본문·이미지·버튼·아이템·캐러셀·광고/성인 여부; `shouldSendPushAlarm`은 항상 true로 고정, 토글 없음) → 우측 "미리보기"(일반/캐러셀) + "테스트 발송".
- "확인": 특수문자 alert → 카카오 발신 프로필 0개면 alert `kakao:alert.noSender`="발신프로필을 먼저 등록해 주세요." → 에디터 자체 검증 → 반영. 발신 프로필은 **목록 첫 번째**(`senderId`)를 자동 사용(선택 UI 없음). 타입 `FI`인데 이미지가 없으면 `FT`로 저장.

### 4.4 SMS (full)
- 에디터는 빌더 전용 모듈(새 메시지 SMS와 문구 계열 동일): `sms:ad`="광고성 메시지" 토글(기본 켜짐) · (LMS/MMS일 때만) `sms:title`="제목"(40자 초과 입력 무시) · `sms:body`="내용" + 타입 배지 SMS/LMS/MMS · 본문 placeholder(하드코딩) "1. SMS : 단문 메세지 (90 바이트, 띄어쓰기 포함) … 3. MMS : … (2,000 바이트, 띄어쓰기 포함_jpg,jpeg 파일 300kb)\n\n* 개인화 메시지를 발송하면 LMS로 차감 후, 실제 발송 결과에 따라 비용이 재조정됩니다." · 바이트 카운터 "{n}/2000 byte"(입력 maxLength 1000) · `sms:image`="이미지" 업로드(`POST /sms/upload-file`).
- 우측 "미리보기"(제목 없으면 "제목없음", 광고면 `(광고) [발신명]` + "무료수신거부: …" 자동 부착) + "테스트 발송".
- "확인": 특수문자 alert → 인코딩 검사 후 사용 불가 문자가 있으면 `confirm("문자 메시지에서 사용할 수 없는 문자가 있습니다.\n제목: …\n내용: …\n* 해당 글자는 \"?, �\" 등으로 표시될 수 있습니다.\n\n발송하시겠습니까?")`(하드코딩) → 반영. **검사에서 취소해도 패널은 닫힘**(반영만 안 됨).
- 발신 번호 유무는 패널에서 확인하지 않고 저장 시(§1.4) 검사.

### 4.5 Email (full)
- 행: "캠페인 명" → "메시지": 발신자/제목 입력부(빌더 전용 탭 셀렉터, 탭 `defaultTemplate`·`customTemplate`) + 본문 편집기(이메일 에디터 **공유**). `email:emailMessage.senderInfo`="발신자 정보"(placeholder "발신자 이메일(도메인 주소)", 확인된 발신 이메일이 없으면 "(확인된 발신자 이메일 없음)"), "이메일 제목", "이메일 본문".
- "확인": 발신자·제목·본문 중 하나라도 비면 alert `email:alert.error.message`="빈 값이 존재합니다." → 반영(`templateId`는 지움).

### 4.6 In-App Message (full)
- 새 노드(gui·html 없음·`inAppMessageId` 없음)로 열면 **템플릿 선택 오버레이 자동 표시**: 제목 "인앱 메시지 템플릿 선택", 섹션 "Bottom Sheet" · "Modal" · "Full Screen" + HTML(커스텀), 닫기 버튼(`GET /in-app-messages/templates`). 고르면 그 HTML로 시작(HTML 카드는 코드 모드).
- 기존 노드인데 html이 없거나 읽기 전용이면 `GET /in-app-messages/{inAppMessageId}`(최근 90일)로 내용을 불러옴(로딩 스피너).
- 행:
  1. **"캠페인 명"** - placeholder "캠페인 명"(선택 문구 없음).
  2. **"노출 시점"** + 도움말(`in-app-message:trigger.help`) - 라디오 "모든 트리거"(`trigger.journey.all`, 기본, group 없음) / "트리거 선택"(`trigger.journey.select`) → 트리거 입력(placeholder "트리거 입력") + "+ 필터"(데이터 조건). 안내 줄: "노출 예약 후 <span>FlareLane.displayInApp(\"{{triggerGroup}}\")</span> 실행 시 인앱메시지 노출" / "노출 예약 후 첫 <span>FlareLane.displayInApp()</span> 실행 시 인앱메시지 노출".
  3. **"노출 예약 기간"**(`expirationPeriod`) + 도움말 "노드 진입 시 즉시 노출이 아닌 노출 예약 상태가 됩니다.<br/>이후 유저가 예약 기간 내 노출 그룹 실행 시 인앱메시지가 노출됩니다." - 숫자 + 일/시간/분, 최소 1, 기본 3일.
  4. **"메시지"** - 인앱 에디터 **공유**(`/in-app/new`와 같은 모듈: GUI/HTML, HTML 복사, 캐러셀, 고급 설정 등 - 기존 문서 §7.4).
  5. **"설정"** - "노출 기간" + 도움말 "인앱메시지가 실제 노출되는 기간 범위를 지정할 수 있습니다." 라디오 "항상" / "기간 내"(타임존 표시 없음) · "노출 대상" 라디오 "모든 기기" / "다음 조건 만족 기기" + 세그먼트 필터.
- 우선순위·전환 이벤트 설정 행 **없음**(여정 전환 설정을 따름). "닫기 액션 없음" 검사도 없음.
- "확인": 캠페인 명 비면 토스트 `error.iamEmptyCampaign`="인앱 메시지(팝업)의 캠페인 명이 비어있습니다." → 시작/종료 초·밀리초 0 → 반영(`title, htmlString, editorType, ttlMinutes, group, dataFilterConditions, startDate, endDate, targetSegmentFilters, containerConfig`).

### 4.7 Webhook (full)
- "웹훅"(`automation:webhook`) 검색 셀렉트: 옵션 = 웹훅 제목 + URL 2줄, 하단 "+ 새 웹훅"(`common:button.newwebhook`) → `/channel/webhook/new`. 선택하면 아래 회색 박스: `{METHOD} {URL}`, (헤더 있으면) "HEADERS" + `키: 값` 줄, 본문 미리보기(읽기 전용 코드 영역, 높이 200), 본문 변수 키-값 표(키 편집·추가·삭제 불가, 값만 입력, 개인화 `{}` 가능).
- "확인": 웹훅 없음 → 토스트 `error.emptyWebhook`="웹훅이 비어있습니다." / 빈 값 → `error.emptyWebhookData`="웹훅 데이터가 비어있습니다."
- 데이터: `GET /webhooks`(목록), `GET /webhooks/{id}`(헤더·본문).

### 4.8 Delay (medium)
- 라디오 그룹:
  - **"다음 시간 동안 대기"**(`delay.after`, `AFTER`, 기본) → 숫자(정수, 최소 1) + 단위 셀렉트 "일" / "시간" / "분". 기본 1시간.
  - **"다음 시간까지 대기"**(`delay.until`, `UNTIL`) → 시(0~23) `:` 분(0~59) 숫자 입력 + 안내(i 아이콘) `delay.info`="오늘 {{targetTime}}가 이미 지난 경우 내일 {{targetTime}}에 재개됩니다."(`HH:MM`).
- 검증 없음. UNTIL이면 `waitMinutes:0` + `targetHour/targetMinute`, AFTER면 `waitMinutes`만.

### 4.9 A/B Test (기본 폭)
- 제목 "A/B Test" + 설명 `ab.desc`="대상자를 임의의 그룹으로 나누어 테스트를 진행합니다."
- 그룹 행: 이름 입력(placeholder "Group Name"(하드코딩), 최대 14자, 앞뒤 공백 제거) · 비율 입력(정수, 99 초과 → 99, 1 미만 → 0) · "%" · (그룹 합계 3개 이상일 때) 삭제 아이콘. 미발송 그룹 행은 이름 고정 "미발송 그룹".
- 하단: secondary xs `ab.add`="+ 그룹 추가"(일반 그룹 5개 미만일 때; 새 이름 C, D, E… , 비율 0) · 체크박스 `ab.controlGroup.add`="미발송 그룹 추가"(일반 그룹 2개 미만이면 비활성) + 도움말 "미발송 그룹을 대조군으로 설정하여 A/B 테스트를 진행할 수 있습니다."
- "확인": 어느 그룹이든 1~99 밖 → 토스트 `ab.alert.range`="1 ~ 99 사이의 숫자를 입력해주세요." / 합계 ≠ 100 → `ab.alert.total`="합이 100%가 되어야 합니다." 삭제한 그룹에 연결된 화살표는 함께 삭제.
- 미발송 그룹은 출력 핸들이 없고 `targetNextActionId:null`로 저장.
- 구버전 `AB` 패널: "그룹A" [n]% / "그룹B" [n]%, 1~99, 한쪽 입력 시 다른 쪽 자동 100-n.

### 4.10 Event Split (wide)
- **"기준 시점"**(`c.event.time.entry.title`): 라디오 "여정 진입 이후부터"(기본) / "전체 기간 중 최근 N일 이내" → 기간 입력(일/시간/분, 최대 365일·8760시간·525600분, 기본 1일).
- **"이벤트 조건"**(`c.event.title`): "다음 이벤트가"(`c.event.1`) [연산자 `=` `≠` `<` `≤` `>` `≥`, 기본 `≥`] [횟수 0~10, 기본 1] "회 발생"(`c.event.2`) + 이벤트 행 1개(필터 최대 3, 행 삭제 불가, ⋮ "시작 조건 이벤트의 데이터와 비교" 가능).
- "확인": 이벤트명·필터 빈 값 → 토스트 `error.emptyEvent`. 출력 "Yes"(조건 만족) / "No".

### 4.11 Segment Split (wide)
- "세그먼트"(`common:segments`) + 세그먼트 필터 빌더(진입 대상과 같은 제외 목록; 유저 자동화면 `USER_ID` 연산자에 `EXIST`·`NOT_EXIST` 추가).
- "확인": 시작 조건이 비회원 포함이면 필터 제한 검사(`error.invalidFilter`) → 형식 불량 `error.invalidSegment`. 출력 "Yes" / "No".

### 4.12 Trigger Event (medium)
- 설명 `triggerEvent.desc`="다음 이벤트를 발생시킵니다." + 이벤트 셀렉트(시스템 이벤트 숨김) + (이벤트 선택 후) `Key` / `Value` 입력 행(placeholder 하드코딩 "Key"/"Value") + 삭제, 링크 "+ 이벤트 데이터 추가"(`addEventData`, 최대 5행).
- "확인": 키나 값이 빈 행 → **alert** `emptyEventData`="비어있는 이벤트 데이터가 있습니다." 이벤트 미선택은 패널에서 막지 않음(저장 시 검사).

### 4.13 Update Tags (medium)
- 설명 `updateTags.desc`="유저 및 기기의 태그를 업데이트합니다." + 행: 태그 검색 셀렉트(이미 고른 키 제외, "+ 새 태그" → `/data-management?n=t`) · 값 입력(placeholder "Value", 개인화 가능) · 삭제. 링크 "+ 태그 추가"(`addTag`, 최대 5행). 열 때 빈 행 1개.
- "확인": 키나 값이 빈 행 → **alert** `emptyTagsData`="비어있는 태그값이 있습니다."

### 4.14 개인화 변수 (여정 전용 동작)
- 입력 컴포넌트·모달은 새 메시지 §2.5와 같음. 여정에서는 **시작 조건이 이벤트 기반일 때** 변수 목록 맨 위에 `entry_event.data`("시작 이벤트 데이터", `common:entryEvent`)가 추가되고, 고르면 **"데이터 키"** 입력(placeholder "데이터 키 입력")이 나타남. 삽입 형식: `{{ entry_event.data.{키} | default: "{대체 문구}" }}`.
- 적용 위치: Push 제목·본문 등, 알림톡 변수값, BrandMessage, SMS 제목·본문, 인앱 에디터, 웹훅 데이터 값, Update Tags 값.

---

## 5. AI 개선 패널 (수정 페이지만)

- **열기**: 헤더 AI 아이콘 버튼 → 캔버스 좌표 동기화 → `POST /ai-agents/automation-improvement/sessions {targetType:"automation", targetId}` → 현재 캔버스로 여정 데이터를 만들어 검증(§1.4와 같은 함수; 실패하면 그 토스트가 뜨고 실행 요청 안 함, 패널도 안 열림) → `POST /ai-agents/sessions/{sessionId}/executions {actionId:"AUTOMATION_IMPROVEMENT_RECOMMEND", input:{automation(editor 제외)}}` → 패널 열림 → `GET /ai-agents/sessions/{sessionId}/executions/{executionId}` 1초 간격 폴링(최대 300회, `SUCCEEDED`/`FAILED`에서 멈춤).
- 패널이 열려 있는 동안 캔버스: 편집·드래그 불가, 노드 클릭(읽기 전용 패널)은 가능, 헤더 "저장" disabled.
- 레이아웃(위→아래):
  - 헤더: "FlareLane AI"(하드코딩) + 로고 · 설정 톱니(→ "AI 설정" 모달; `GET /ai-settings` 결과의 서비스명·설명·목표·지침이 모두 비어 있으면 빨간 점) · X(`aria-label`="닫기", 처리 중 disabled).
  - 부제 `aiAgent:panel.subtitle.improvement`="여정을 분석하여 최적화 방안을 제안합니다".
  - 제목 `panel.title.improvement`="고객 여정 자동화 개선 추천" + (처리 중 아닐 때) "다시 생성"(`button.reload`) 버튼.
  - 처리 중: 서버가 준 진행 메시지(`messages[0]`) + 스피너.
  - 성공: 추천 카드 목록(`result.recommendedActions[]`: `title`, `description`, 펼침 화살표).
- **카드 클릭** → 그 카드의 `actionId`로 실행 요청 + 폴링(카드 제목 옆 스피너). 다른 카드 실행 중엔 클릭 무시.
  - 성공 결과 박스: **"변경 내용"**(`card.changes`) + 우측 토글 "적용 전"/"적용 후"(`card.beforeApply`/`card.afterApply`) + 변경 설명 목록(`improvedAutomation.changes.descriptions`) · **"추천 이유"**(`card.reason`) · 좋아요/싫어요(`POST|DELETE /ai-agents/executions/{id}/feedback {vote:"like"|"dislike"}`) · **"적용"**(`button.apply`).
  - "적용 후" 토글: 캔버스를 개선안으로 바꿔 보여주고, 바뀐 노드·화살표(`changes.actions` CREATE/MODIFY)와 바뀐 설정 버튼(시작 조건 / "전환 이벤트 설정" / "발송 설정")에 그라디언트 강조.
  - 실패 결과: 빨간 아이콘 + `errorMessage` + "재시도하기"(`button.retry`).
- **"적용"** → `POST /ai-agents/executions/{id}/accept` → 토스트 "추천 적용이 완료되었습니다."(하드코딩) → 편집 데이터·설정을 개선안으로 교체 → 같은 세션으로 추천 목록 자동 재요청. **저장은 되지 않음**(패널을 닫고 "저장"해야 함).
- **닫기**(X 또는 헤더 AI 버튼): 처리 중이면 불가. 추천이나 카드 결과가 `SUCCEEDED`인 상태면 `confirm("고객 여정 자동화 개선 추천이 초기화됩니다. 그래도 닫으시겠습니까?")`(하드코딩) → 상태 전부 초기화.

---

## 6. 데이터 · 목업용 GET 엔드포인트

### 6.1 편집기 JSON (`editor` 필드, 문자열로 저장)
- 노드: `{type, id(uuid), data, attr:{x, y}}`. `data`는 §2.1 기본값 + 패널이 채운 값.
- 화살표: `{type:"ARROW", id, attr:{from, to, index, executionType("ENTRY"|"ON_SUCCESS"|"ON_FAILURE"|"DEFAULT"), startLineGap, endLineGap, abGroupId, lineText("Yes"|"No"), color}}`. `index` = 출력 순서(분기 0=Yes/성공, 1=No/실패, A/B는 그룹 순서).

### 6.2 저장 페이로드 (POST/PATCH 공통)
`{id(신규는 ENTRY 노드 uuid), name, entryType, entryConditions, exitConditions, startActions[], goalConditions:undefined, editor, settings, conversionConfigs, exampleId, entryPolicy, reEntryAfterCompletionMode, reEntryAfterCompletionDuration}`
- `startActions[]`/`nextActions[]` 재귀: `{id, type, executionType, payload, waitMinutes, splitWeightPercent, nextActions, webhookId, webhook:null}`. 메시지 액션 `payload`에 `ignoreFrequencyCapping`, 알림톡·BrandMessage·SMS·Email·A/B는 `waitMinutes:0` 고정. 구버전 AB는 자식 두 개에 `splitWeightPercent`로 펼쳐짐.

### 6.3 GET 엔드포인트

| 엔드포인트 | 쓰는 곳 | 응답 `data` 주요 필드 |
|---|---|---|
| `GET /automations/{id}` (기간 파라미터 없음) | 수정 페이지 진입 | `id, name, entryType, entryConditions{event[][], segment, userSegment, anonymousDeviceFilterOption}, exitConditions{event}, startActions[](위 구조, 웹훅은 webhook{title,url}), editor(JSON 문자열), settings{dnd{startHour,endHour,handlingType}}, conversionConfigs, handlingOnPause, entryPolicy, reEntryAfterCompletionMode, reEntryAfterCompletionDuration, lastActivatedAt, isUserAutomation, exampleId` |
| `GET /in-app-messages/{id}?gte&lte&timeZone&disableStats=true` | 수정 진입 시 인앱 액션마다(기간 = 오늘) · 인앱 패널(최근 90일) | `title, htmlString, editorType, group, dataFilterConditions, startDate, endDate, targetSegmentFilters, containerConfig, clickStats, isStatsExportEnabled` |
| `GET /in-app-messages/templates` | 인앱 템플릿 오버레이 | `[{id, title, displayType, htmlString}]` |
| `GET /webhooks` · `GET /webhooks/{id}` | 웹훅 패널 | 목록 `[{webhook:{id, title, url, method}}]` / 상세 `webhook.headers`(JSON 문자열), 본문·헤더 변수 |
| `GET /alimtalk-template?page&per=5&inspection=COM&searchKeyword` · `GET /alimtalk-template/{id}` · `GET /alimtalk-template/category` | 알림톡 템플릿 모달·패널 | `templateCode, templateName, templateContent, templateTitle, templateSubtitle, templateExtra, templateMessageType, templateEmphasizeType, buttons, templateImageUrl, templateHeader, templateItem, templateItemHighlight, securityFlag, categoryCode, categoryName`, 목록 `meta.totalCount` |
| `GET /kakao/sender` | 저장 검증·BrandMessage 발신 프로필 | `[{id, …}]` (0개 여부만 사용) |
| `GET /data-management/events?page=1&per=500` · `GET /data-management/tags?page=1&per=500` | 이벤트·태그 셀렉트, 개인화 변수 | `[{id, name, description, hidden, …}]` |
| `GET /data-management/events/{event}/data/keys` · `…/data/keys/{key}/values` | 필터 키·값 | 문자열 배열 |
| `GET /devices/search?isTest=true&ignoreSubscribed=true&page&per` | 푸시 테스트 발송 기기 | 기기 문서 참조 |
| `GET cohort-sync` | 세그먼트 카드 코호트명 | `[{cohortId, cohortName}]` |
| `GET /ai-settings` | AI 패널 설정 점 | `id, serviceName, serviceDescription, businessTarget, mandatoryGuidelines` |
| `GET /ai-agents/sessions/{sessionId}/executions/{executionId}` | AI 개선 폴링 | `id, status("PENDING"|"PROCESSING"|"SUCCEEDED"|"FAILED"), actionId, messages[], errorMessage, result{recommendedActions[{actionId, title, description}], reason, improvedAutomation{automation, changes{descriptions[], actions[{id, type:"CREATE"|"MODIFY"}], configs[{key}]}}}` |
| 프로젝트 상세(공통 훅) | 이메일 노드 활성, SMS 저장 검증, 통화 | `emailChannelEnabled, smsSenderNumber, purchaseConversionConfig{eventType, attributionWindowHours, currency}` |
| 앱 설정(`configs`, 공통) | 세그먼트 필터 종류 | `segmentFilters[], userSegmentFilters[]` (`type, validValues`) |

참고(목업에서 성공만 흉내 낼 쓰기 요청): `POST /automations`, `PATCH /automations/{id}`, `POST /sms/upload-file`, 푸시 이미지 업로드, 테스트 발송들, `POST /ai-agents/automation-improvement/sessions`, `POST /ai-agents/sessions/{id}/executions`, `POST /ai-agents/executions/{id}/accept`, `POST|DELETE /ai-agents/executions/{id}/feedback`.

---

## 7. 기존 문서(`staging-behavior-journeys-inapp.md` §4)와 다른 점
- 저장 시점의 액션 검증 토스트는 "메시지 내용이 비어있습니다." / "카카오 발신 프로필이 없습니다." / "SMS 발신 번호가 없습니다." 세 가지뿐. "이벤트 상세 조건이 비어있습니다.", "세그먼트 상세 조건이 비어있습니다.", "웹훅이 비어있습니다.", "인앱 메시지(팝업)의 캠페인 명이 비어있습니다.", "개인화 변수를 모두 입력해주세요."는 **패널 "확인" 시점** 토스트.
- 검증 순서는 "연결 안 된 액션" → "AB 연결" → "시작 조건 없음" → 액션 내용.
- 노드 추가는 + 버튼이 아니라 좌측 툴박스 드래그 앤 드롭.

---

## 8. 확인 못 한 것
- 캔버스 노드·패널의 정확한 간격·폰트·아이콘 모양(Emotion 스타일 일부만 확인, Konva 캔버스 렌더).
- 서버 저장 실패 시 화면 반응(코드상 `console.error`만; 공통 인터셉터 토스트 여부는 런타임 확인 필요).
- 빈 이벤트 조건(`event: []`)이나 빈 여정 이름으로 저장했을 때 서버 검증 결과.
- AI 개선 최초 추천이 `FAILED`로 끝났을 때 표시(코드상 진행 메시지·카드 둘 다 안 보이고 "다시 생성"만 남음) 및 진행 메시지 실제 문구.
- AI 설정 모달 내부(이 청크 밖), 전역 AI 채팅이 빌더를 편집하는 대화 흐름.
- `GET /automations/{id}` 응답의 `startActions` 안 `webhook` 상세 필드, `conversionConfigs` 정확한 스키마(새 메시지 문서의 전환 설정과 같다고 추정).
- 알림톡·SMS·BrandMessage 테스트 발송 모달의 성공/실패 문구 전체(공유 모듈, new-message 문서 3.1 참고).
- 청크 `2840`(js 404, CSS 전용으로 보임)의 내용.
- 활성화 이력 있는 여정의 수정 화면에서 "통계" 토글·분석 탭을 눌렀을 때 실제 표시(데이터 미전달로 비어 있을 것으로 추정).
- 세그먼트 필터 빌더의 필터 종류·연산자 전체 목록(앱 설정 `configs` 응답에 의존).
