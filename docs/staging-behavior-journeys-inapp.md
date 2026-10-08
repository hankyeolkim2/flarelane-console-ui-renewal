# 스테이징 콘솔 동작 명세 - 고객 여정 자동화 · 인앱 메시지(팝업)

- 출처: `https://staging-console.flarelane.com` 공개 번들 JS(buildId `Q-tOYo7BMgpuoKSGYkmC0`, 404 페이지 `__NEXT_DATA__`로 재확인) + `/locales/ko/{automation,in-app-message,common,segment,aiAgent,testDevice}.json` 정적 분석 (로그인·API 호출 없음, 2026-10-08)
- 문자열은 ko 로케일 값을 그대로 인용. `ns:key` 표기는 번역 네임스페이스와 키.
- API 경로는 모두 `https://staging-service-api.flarelane.com/v1/projects/{projectId}` 기준 상대경로.
- 날짜 파라미터 공통 형식(`z()` 헬퍼): `gte=yyyy-MM-dd`, `lte=yyyy-MM-dd`, `timeZone=<브라우저 tz.guess()>`.
- 기본 데이터 기간(`kb()`): **오늘 포함 최근 30일** (`[startOfDay(today-30), endOfDay(today)]`).

---

## 0. 라우트 (build manifest 확인)

| 라우트 | 화면 | 페이지 모듈 |
|---|---|---|
| `/journeys` | 여정 목록 | 10389 |
| `/journeys/pre-built` | 새 자동화 생성(추천 여정) | 810 |
| `/journeys/new` | 빌더(신규) | 60610 |
| `/journeys/[journeyId]` | 여정 상세(읽기 전용 캔버스 + 분석) | 81392 |
| `/journeys/[journeyId]/edit` | 빌더(수정) | 11227 |
| `/in-app` | 인앱 메시지 목록 | 96015 |
| `/in-app/templates` | 인앱 템플릿 선택 (페이지, 모달 아님) | 64269 |
| `/in-app/new` | 인앱 생성 (`?templateId=`) | 62949 |
| `/in-app/[iamId]` | 인앱 상세 = 생성 폼 `readonly` + 통계 | 62949(`readonly`) |
| `/in-app/[iamId]/edit` | 인앱 수정 | 62949 |

- 사이드바: `common:automatedMessages`="자동화 메시지" > `common:automations`="고객 여정 자동화"(`/journeys`, `isRecommend` 추천 배지) / `common:channels`="채널" > `common:inapp`="인앱 메시지 (팝업)"(`/in-app`, 하위 메뉴 없음).
- 세 화면 모두 `__N_SSP`(서버사이드 props) 페이지.

---

## 1. 고객 여정 자동화 목록 `/journeys`

### 1.1 헤더 (wide 레이아웃)
- 좌: 제목 `automation:category.automations`="고객 여정 자동화" + 도움말 아이콘(호버 툴팁, `automation:help.title`: "<a href=docs…/automations>고객 여정 자동화</a>를 통해 구매 등 유저의 최종 목표 달성을 이끌어낼 수 있도록 시나리오 기반의 메시지 발송 자동화가 가능합니다." 링크 새 탭).
- 우(gap 30px):
  1. 라벨 `automation:dataRangeFilter`="데이터 기간 필터"(gray500, 14px/500) + 기간 버튼(달력 아이콘 + `yyyy-MM-dd - yyyy-MM-dd`, 컨테이너 `row-reverse`). 클릭 시 범위 달력 팝오버(§1.8).
  2. 버튼 `automation:new`="새 자동화"(primary, size xs) → `router.push("/journeys/pre-built")`. **모바일에서는 숨김**.
- 헤더 아래 검색 입력(폭 420): 돋보기 아이콘(포커스/값 있으면 blue500, 아니면 gray400), placeholder `automation:search.placeholder`="여정명 검색", `maxLength=100`.

### 1.2 URL 쿼리
| 키 | 의미 | 검증 |
|---|---|---|
| `tab` | `active` \| `paused` \| `draft` \| `archived` | 목록에 없으면 `active`로 간주(URL은 안 바꿈) |
| `gte`, `lte` | 데이터 기간(ISO 문자열, `toISOString()`) | Date 파싱 실패 → 기본값. `gte > lte`면 둘 다 기본 30일로 |
| `sk` | 검색어 | trim |

- 모든 갱신은 `router.replace(..., {shallow:true})`. 값이 `""`/빈 배열이면 키 삭제.
- 검색: 입력 300ms 디바운스 후 `sk` 반영, Enter 시 즉시 반영. trim 결과가 현재와 같으면 무시.

### 1.3 진입 로직
1. `GET /automations` (파라미터 없음) → `data.data: Automation[]`.
2. **배열이 비면 `router.push("/journeys/pre-built")`** (목록 화면을 보여주지 않음).
3. `tab` 쿼리가 유효하지 않고, 활성/일시중지(=한 번이라도 활성화된) 여정이 0개이며 임시저장이 1개 이상이면 → `tab=draft`로 자동 전환.

### 1.4 상태 탭 (검색 중에는 숨김)
- 순서·라벨(텍스트 + ` (` + 개수 + `)`): `active` "활성화" · `paused` "일시중지" · `draft` "임시저장" · `archived` "아카이브됨" (`automation:` 동일 키).
- 분류(클라이언트):
  - active: `active === true`
  - paused: `!active && lastActivatedAt && !archivedAt`
  - archived: `!active && archivedAt`
  - draft: `!active && !lastActivatedAt`
- 탭 스타일: 선택 = 흰 배경 + brand500 테두리, 비선택 = gray100 배경. 모바일 margin-bottom 24px.
- **검색 중(`sk` 있음)**: 탭 숨김, 전체 여정 중 `name`에 검색어(소문자 포함)가 있는 것만 표시(탭 무시).

### 1.5 행(카드) 구성 - 페이지네이션 없음(전체 렌더)
| 영역 | 내용 |
|---|---|
| 상태 배지 | 점 + 라벨. 색: active=green / paused=yellow / archived=blue / draft=gray |
| 이름 | `name` |
| 메타 줄 | `common:createdAt`="생성 시간"`: yyyy.LL.dd` · (아카이브 아님 & (`lastActivatedAt` 또는 `scheduledStartAt`)) `활성화: {시작} ~ {종료}` · (아카이브) `아카이브됨: yyyy.LL.dd` |
| 지표 3칸 | `automation:ab.entriesTotal`="진입 여정" / `automation:ab.conversionTotal`="전환 여정" / `common:conversion.total`="구매 총액" |
| ⋯ 버튼 | §1.6 |

- 활성 기간 표기: 시작 = `scheduledStartAt ?? lastActivatedAt`, 종료 = `scheduledEndAt ?? (active ? 없음 : lastPausedAt)`, 형식 `yyyy.LL.dd HH:mm`(scheduleTimeZone 있으면 그 tz 기준). 종료 없으면 `automation:schedule.unset`="미지정".
- 지표 값: 진입/전환은 축약(`<1000` 그대로, `K`/`M`/`B` 소수 2자리), 1000 이상이면 호버 시 전체 숫자 툴팁(`toLocaleString("ko-KR")`). 전환 여정 옆 `" (x.x%)"`(= 전환/진입). 구매 총액은 통화 포맷(프로젝트 `purchaseConversionConfig.currency` 있으면 `Intl` 통화, 없으면 ko 브라우저 `₩`+콤마, 그 외 `＄`).
- 지표 로딩: 행이 뷰포트에 들어오면 **500~2000ms 랜덤 지연 후** `GET /conversions/automations?id&gte&lte&timeZone` (캐시). 로딩 중 22px 스켈레톤. 임시저장(`lastActivatedAt` 없음)은 요청 없이 0.
- 행 클릭 → 미리보기 드로어(§1.7). 목록 로딩 중이면 리스트 위 스피너 오버레이. 빈 목록 → 빈 상태 일러스트 + `common:noData`="데이터가 없습니다".

### 1.6 ⋯ 메뉴 (popper, 바깥 클릭 닫힘)
표시 조건과 순서:
1. 아카이브 아님 & active → "일시중지" / 아카이브 아님 & !active → "활성화" (`automation:pause`/`activate`)
2. "복제" (`replicate`) - 항상
3. "아카이브" (`archive`) - `!active && !archivedAt && lastActivatedAt`(=일시중지 상태)
4. "아카이브 해제" (`unarchive`) - `!active && archivedAt`
5. "삭제" (`delete`, 빨간 글씨) - 항상

공통 확인 모달(`ConfirmModal`): 버튼 `common:button.cancel`="취소"(secondary md) · `common:button.confirm`="확인"(primary md, 삭제는 destructive), ESC 닫힘, 배경 클릭 닫힘.

| 항목 | 모달 제목 / 본문 | 확인 시 | 이후 |
|---|---|---|---|
| 일시중지 | "정말 일시중지하시겠습니까?" / (빈 본문) + 소제목 "발송 대기 중인 메시지는 어떻게 할까요?" + 라디오 "기존 여정대로 정상 발송"(`PROCESS`) · "발송 취소 및 여정 종료"(`EXIT`). 기본값 = `handlingOnPause ?? "PROCESS"` | `PATCH /automations/{id}/status {status:"pause", handlingOnPause}` | 목록 재조회 + `tab=paused` |
| 활성화 | "정말 활성화하시겠습니까?" / "활성화 이후에는 변경이 불가능합니다. 변경이 필요할 경우 여정을 복제하세요." | `PATCH …/status {status:"active"}` | 재조회 + `tab=active` |
| 복제 | "정말 복제하시겠습니까?" / "이 여정으로 1개의 복제본을 생성합니다." | `POST automations/{id}/replicate` | `router.push("/journeys/{newId}/edit")` |
| 아카이브 | "정말 아카이브하시겠습니까?" / "해당 자동화가 아카이브 상태로 보관되며, 언제든 아카이브 상태를 되돌릴 수 있습니다." | `PATCH …/status {status:"archive"}` | 재조회 + `tab=archived` |
| 아카이브 해제 | **모달 없음**(즉시) | `PATCH …/status {status:"pause"}` | 재조회 + `tab=paused` |
| 삭제 | "정말 삭제하시겠습니까?" / "현재 활성화 상태인 경우, 비활성화 상태로 전환이 필요합니다." | `DELETE automations/{id}` | 재조회(탭 유지) |

- **성공 토스트 없음**(번들상 위 동작 모두 toast 호출 없음).

### 1.7 미리보기 드로어 (행 클릭)
- 우측 슬라이드 패널(slidein/slideout, 닫기 100ms 지연), 뒤 반투명 배경 `rgba(0,4,22,0.2)`. 배경 클릭·X 버튼(`aria-label`="닫기")으로 닫힘.
- 패널 폭: 시작 액션이 2개면 `wide`.
- 구성(위→아래):
  1. 제목 = 여정 `name`.
  2. 지표 3칸(목록과 같은 라벨: 진입 여정 / 전환 여정 / 구매 총액). 전환 여정은 값 + 별도 줄로 비율. 로딩 중 스켈레톤.
  3. 캔버스 미리보기(읽기 전용: 툴바·드래그·편집·클릭·통계·분석 모두 비활성). 높이 `calc(100% - 115px)`.
  4. 캔버스 하단 토글 "통계"(`automation:stat`) 스위치 - 켜면 `GET /automations/{id}?gte&lte&timeZone` + `GET /conversions/automations/{id}?…` 로 노드별 통계 표시. 로딩 중 토글 disabled + 스피너.
  5. 하단 버튼 "자세히보기"(`automation:viewDetail`, size xl) → 현재 데이터 기간을 `sessionStorage["flarelane_journey_analytics_dates"]`에 저장 후 `/journeys/{id}`.
- 캔버스의 시작(ENTRY) 노드 클릭 → 시작 조건 모달(버튼 없음, 배경/ESC로 닫힘):
  - 세그먼트형(`entryType:"SEGMENT"`): "시작 조건" / "대상 세그먼트에 포함될 때 진입" / 세그먼트 필터 칩(`isUserAutomation`이면 `entryConditions.userSegment`, 아니면 `segment`) / (유저 자동화) "비회원 기기 포함 여부" → "미포함"·"포함"·"비회원 기기만" / "종료 조건" / "진입 조건을 만족하지 않게될 때 여정 종료".
  - 이벤트형(`EVENT`): "시작 조건" / "진입 대상"(필터 또는 "모든 유저") / "비회원 기기 포함 여부" / "다음 이벤트가 발생할 때 여정 진입" + 이벤트 조건 목록(이벤트명, `키 연산자 값`, OR 그룹 사이 "또는") / 종료 이벤트 있으면 "종료 조건" + "다음 이벤트가 발생할 때 여정 종료".

### 1.8 기간 달력 팝오버 (공유 컴포넌트)
- 좌측 "기간설정" 프리셋: "오늘" · "어제" · "최근 7일" · "최근 30일" · "최근 90일" · "최근 1년".
- 우측 "날짜": 시작/종료 텍스트 입력(placeholder `yyyy-MM-dd`) + 달력(최대 오늘, `allowFutureDates`면 제한 없음).
- 오류: "날짜 형식이 올바르지 않습니다" · "시작일이 종료일보다 늦을 수 없습니다". 버튼 "취소" / "확인".
- **플랜 게이트**(`enablePlanDateRange`인 곳만 - 인앱 상세): 플랜 순위 `STARTER<TEAM<BUSINESS…`, TEAM 미만이면 "최근 90일"/"최근 1년" 비활성(`not-allowed`), 선택 가능한 최소일 = 오늘 - 플랜 보관일(STARTER 30 / TEAM 365 / BUSINESS·ENTERPRISE·TRIAL 등 3650). 여정 목록에는 적용 안 됨.

---

## 2. 새 자동화 `/journeys/pre-built` ("새 자동화" 버튼의 목적지)

- 헤더: "새 고객 여정 자동화 생성"(`automation:prebuilt.title`) + 도움말(§1.1과 동일) + tertiary sm 버튼 "나만의 자동화 만들기" → `/journeys/new`.
- AI 카드(우측 AI 채팅 패널이 닫혀 있을 때만): 아이콘 + "FlareLane AI를 통한 고객 여정 자동화" / "AI가 프로젝트 데이터를 분석해 여정을 생성합니다." 클릭 → AI 세션 생성(POST) 후 우측 500px 패널.
  - 패널: 제목 "새 고객 여정 자동화 생성", 부제 "프로젝트 데이터를 분석해 최적의 자동화 여정을 제안합니다.", 프롬프트 입력 placeholder "어떤 고객 여정 자동화를 생성할까요?"(최대 6줄, 빈 값이면 전송 버튼 disabled), 추천 프롬프트 칩(클릭 시 입력에 채움).
  - 추천 카드: 제목·설명·"진입조건"·"추천이유"·"예상효과" + 피드백(좋아요/싫어요), 하단 "처음으로". 카드 클릭 → 미리보기 모달(제목 기본 "자동화 제목", 하단 "이 여정으로 시작") → 생성 후 `/journeys/{id}/edit`.
- 섹션: "추천 고객 여정 자동화"(`section:"base"`) · "커머스"(`section:"commerce"`). 카드 = 이미지(60px) + 제목 + 설명 + (`created`면) 배지 "사용중"(`common:inUse`). 로딩 중 각 섹션 스켈레톤 3장.
- 카드 클릭 → §1.7 드로어 재사용: 제목 = 예시 `title`, 부제 = `description`, **지표·통계 토글 없음**, 하단 버튼 "이 여정으로 시작"(`automation:newCampaign`) → `POST /automation-examples/{id}` → `/journeys/{newId}/edit`. ENTRY 노드 클릭 시 시작 조건 모달 동일.

---

## 3. 여정 상세 `/journeys/[journeyId]`

> 캔버스 내부(노드 패널·분석 패널)는 범위 밖. 헤더와 진입/모달만 기술.

- 진입: `sessionStorage["flarelane_journey_analytics_dates"]`가 있으면 그 기간으로 시작 후 키 삭제, 없으면 기본 30일. `GET /automations/{id}?gte&lte&timeZone` 실패 시 `/journeys`로 이동.
- 기본 **전체화면 모드**(헤더의 카테고리 제목 "고객 여정 자동화" 숨김). 캔버스: 툴바·드래그·편집 비활성(읽기 전용), 통계·분석 표시.
- 헤더 좌: ← 뒤로(→ `/journeys`) · 이름 · 상태 배지(§1.5 색) · (아카이브 아님) 활성 기간 텍스트.
- 헤더 우:
  - 임시저장(한 번도 활성화 안 됨): 안내 텍스트 "최초 활성화 이후 수정 불가" + tertiary xs "수정" → `/journeys/{id}/edit`.
  - 활성화 이력 있음: tertiary xs "제목 수정" → 이름이 입력란으로 바뀜(placeholder "새 여정 이름 입력"), 버튼이 "저장"으로 → 저장(PATCH) 후 보기 모드.
  - 스플릿 버튼(primary xs): 본 버튼 "일시중지"(active) / "활성화"(그 외) → §1.6과 같은 활성화/일시중지 모달 → `PATCH /automations/{id}/status` 후 재조회. ▼(`aria-label`="더 보기") 메뉴: "여정 예약".
- **여정 예약 모달**: 제목 "여정 예약" / 설명 "활성화 이후에는 여정 수정이 불가능합니다."
  - "타임존": 타임존 선택(기본 `scheduleTimeZone ?? 브라우저 tz`).
  - "시작일": 라디오 "수동 시작" / "예약하기"(선택 시 날짜 + 시:분 입력, 기본 = 지금+1분, 최소 오늘). 여정이 이미 active면 이 행 비활성.
  - "종료일": 라디오 "수동 종료" / "예약하기"(기본 = 시작+1시간, 과거면 지금+1분) + 소제목 "발송 대기 중인 메시지" 라디오 "기존 여정대로 정상 발송"(기본) · "발송 취소 및 여정 종료".
  - 오류(인라인 빨간 글씨): "시작일은 현재 시간 이후로 선택해주세요." · "종료일은 시작일 이후로 선택해주세요."
  - 버튼: "취소"(secondary) · "저장"(저장 중 disabled, 배경 클릭 막힘) → `PUT /automations/{id}/schedule {startAt, endAt, timeZone, handlingOnEnd}` → 캐시 삭제 후 재조회.
- 캔버스 상단 "여정 분석" 패널(요약): 기간 필터, "전체 통계"(진입 여정 / 전환 여정 / 전환율 / 구매 총액), "여정 일별 통계" 차트(+CSV 다운로드), 노드 패널 탭 "메시지 정보"/"메시지 분석" 또는 "상세 정보"/"진입 분석". 통계 내보내기는 `POST /automations/{id}/stats/export {reason, gte, lte, timeZone}`(다운로드 사유 모달 경유).

---

## 4. 여정 빌더 `/journeys/new`, `/journeys/[journeyId]/edit`

| | `/journeys/new` | `/journeys/[id]/edit` |
|---|---|---|
| 카테고리 제목(전체화면 해제 시) | "새 고객 여정 자동화" | "고객 여정 자동화 수정" |
| 좌측 | ← 뒤로 → `/journeys` · 이름 입력(`aria-label`="여정 이름", placeholder "새 여정 이름 입력") | 동일 |
| 우측 버튼 | tertiary xs "취소" → `/journeys` · primary xs "저장" | (AI 채팅 닫혀 있을 때) AI 개선 아이콘 버튼 · "취소" → `/journeys/{id}` · "저장"(AI 패널 열려 있으면 disabled) |
| 기본 모드 | 전체화면 | 전체화면 |

- 이탈 방지: 라우트 변경 시 `window.confirm("변경사항이 저장되지 않았습니다. 페이지를 벗어나시겠습니까?")`(`common:alert.checkEscape`), 취소하면 이동 중단. `beforeunload`도 같은 문구. 저장 성공 시 해제.
- 저장 검증(실패 시 **error 토스트**): "시작 조건을 먼저 선택해야 합니다." · "AB액션은 모두 연결하여야 합니다." · "연결되지 않은 액션이 있습니다." · 액션별 검증 메시지(예: "메시지 내용이 비어있습니다.", "이벤트 상세 조건이 비어있습니다.", "세그먼트 상세 조건이 비어있습니다.", "웹훅이 비어있습니다.", "인앱 메시지(팝업)의 캠페인 명이 비어있습니다.", "개인화 변수를 모두 입력해주세요.", "카카오 발신 프로필이 없습니다.", "SMS 발신 번호가 없습니다." 등; 기본값 "메시지 내용이 비어있습니다.").
- 저장 성공: 신규 `POST /automations`, 수정 `PATCH /automations/{id}` → **토스트 없이** `/journeys/{id}`(상세)로 이동.
- 수정 페이지: 한 번이라도 활성화된 여정은 캔버스 읽기 전용, "저장"을 눌러도 아무 동작 없음.
- 수정 페이지 AI 개선 패널: 제목 "고객 여정 자동화 개선 추천", 부제 "여정을 분석하여 최적화 방안을 제안합니다", 카드 "변경 내용"·"추천 이유"·"적용 전"·"적용 후", 버튼 "적용"·"재시도하기". 결과가 있는 상태에서 닫으면 `window.confirm("고객 여정 자동화 개선 추천이 초기화됩니다. 그래도 닫으시겠습니까?")`(하드코딩 한국어).
- 캔버스 공통 알림 예: "혹은 ESC키를 누르면 전체 화면 모드가 종료됩니다." · "액션은 연속으로 최대 15개까지 연결할 수 있습니다."

---

## 5. 인앱 메시지 목록 `/in-app`

### 5.1 헤더
- 좌: 제목 `in-app-message:category`="인앱 메시지" + 설명 `listDesc`="템플릿 별 상세한 통계 확인이 가능합니다."
- 우: primary xs "새 인앱 메시지"(`button.new`) → `/in-app/templates`.

### 5.2 URL 쿼리 / 상태
| 키 | 의미 | 기본 |
|---|---|---|
| `gte`, `lte` | 노출 기간 필터(ISO) | 최근 30일(검증 규칙 §1.2와 동일) |
| `status` | 콤마 구분 `temp,active,paused` | 쿼리 없으면 `localStorage["flarelane_inAppStatus"]`(JSON 배열), 그것도 없으면 `["active","temp"]` |
| `sk` | 검색어 | 300ms 디바운스, Enter 즉시, maxLength 100 |

- 상태 변경 시 localStorage에도 저장. 갱신은 `router.replace(shallow)`.
- 데이터: `GET /in-app-messages/grouped?gte&lte&timeZone&statuses=active,temp` → `[{ group, list:[…], activeCount, totalCount }]`. 실패 시 `[]`.

### 5.3 레이아웃 (좌 필터 레일 + 우 그룹 목록)
- 데이터 0건 & 로딩 → 스피너만. 데이터 0건 & 로딩 끝 → 빈 상태("데이터가 없습니다")만, **필터 레일도 표시 안 됨**.
- 좌측 레일(위→아래):
  1. 검색 입력 placeholder "캠페인명 검색"(`search.placeholder`).
  2. "노출 기간"(`displayPeriod`) + 기간 버튼(미래 날짜 허용).
  3. "상태"(`status`) + 칩 3개(순서 고정): "임시 저장"(temp, gray) · "활성화"(active, green) · "일시 중단"(paused, orange) (`common:status.*`). 선택 = 색 배경 + 색 점, 해제 = 점 gray300. 토글 방식. 마지막 1개를 해제하려 하면 해제하지 않고 빨간 경고 "상태 태그는 최소 1개 이상 선택해주세요" 표시(다음 클릭에 사라짐).
  4. "노출 그룹"(`displayGroup`) 목록: 항목 = 그룹명 + `활성화 {activeCount} | 전체 {totalCount}`. 필터 결과 0건인 그룹은 회색·클릭 불가. 클릭 → 해당 그룹 섹션으로 부드럽게 스크롤 + 섹션 테두리 brand400·그림자 강조 3초. 목록이 넘치면 하단 페이드.
- 우측: 그룹별 섹션(필터 결과 0건 그룹은 섹션 숨김).
  - 섹션 헤더: 그룹명(트리거) · 필터 아이콘 + `{n}건 필터링 ({"총"} {totalCount}건)` (`items`="건", `filtering`="필터링", `total`="총").
  - 검색 중 결과 없음 → 우측 영역에 빈 상태 일러스트. 검색은 클라이언트에서 `title` 포함 여부로 필터.
- 페이지네이션 없음. 재조회 중에는 레일 위 스피너 오버레이.

### 5.4 인앱 카드(행)
- 좌측 135×135 썸네일: 1000×1000 iframe(`srcDoc=htmlString`, `containerConfig` 스타일, sandbox `allow-same-origin`)을 0.135 배율. 뷰포트 근접(rootMargin 300px) 후 250ms 지나면 렌더, 그 전에는 플레이스홀더.
- 제목 줄: 상태 칩(`displayStatus`) · `title` · (`dataFilterConditions` 있으면) "filter" 배지 - 호버 툴팁에 `dataKey 연산자 value` 줄바꿈 목록.
- 우측 ⋯(§5.5).
- 정보 3블록(세로 구분선):
  1. "우선순위"(높음/중간/낮음; 0/1/2) · "생성 시간"(`yyyy.LL.dd`) · "노출 기간" = `yyyy.LL.dd ~ yyyy.LL.dd` 또는 "항상". `isExpired`면 제목이 "기간 만료"로 바뀌고 빨간색.
  2. "노출"(displayedTotal) · "클릭"(clickedTotal, 보조 `클릭/노출 %`) · "클릭 유저"(clickedUniqueUser, 보조 `clickedRateUniqueUser%`).
  3. "구매 총액"(purchaseAmount, 통화) · "전환"(convertedTotal, 보조 `전환/클릭 %`) · "전환 유저"(convertedUniqueUser, 보조 `convertedRateUniqueUser%`).
- 숫자는 K/M/B 축약, 1000 이상 호버 시 전체 숫자. 통계 로딩 중 16×60 스켈레톤.
- 통계: 카드가 보이면 `GET /in-app-messages/{id}/stats-summary?gte&lte&timeZone`(캐시, 실패 시 0). `displayStatus==="temp"`면 요청 없이 0. 기간 변경 시 재요청.
- 카드 클릭 → `router.push({pathname:"/in-app/{id}", query:{gte,lte}})`. Ctrl/Cmd 클릭 → 새 탭 `/in-app/{id}?gte=…&lte=…`.

### 5.5 ⋯ 메뉴 (tertiary xs 아이콘 버튼 `aria-label`="더 보기", `more_horiz`)
| 항목(순서) | 조건 | 확인 | 동작 / 결과 |
|---|---|---|---|
| "일시중지" | `status==="active"` | 네이티브 `confirm("일시중지하시겠습니까?")` | `POST /in-app-messages/{id}/pause` → 목록 재조회 |
| "활성화" | `status==="paused"` | `confirm("활성화하시겠습니까?")` | `POST …/{id}/active` → 재조회 |
| "수정" | 항상 | 없음 | `/in-app/{id}/edit` |
| "복제" | 항상 | 확인 모달 "정말 복제하시겠습니까?" / "이 인앱 메시지로 1개의 복제본을 생성합니다." (취소/확인, 진행 중 배경 클릭 막힘) | `POST …/{id}/replicate` → `/in-app/{newId}/edit` |
| "삭제"(빨강) | 항상 | `confirm("삭제하시겠습니까?")` | `DELETE /in-app-messages/{id}` → **success 토스트 "인앱 메시지가 삭제되었습니다."** → 재조회 |

- 메뉴 클릭은 카드 클릭으로 전파되지 않음(stopPropagation).

---

## 6. 인앱 템플릿 선택 `/in-app/templates`
- 제목 "인앱 메시지 템플릿 선택"(`category.template`). 로딩 중 전체 스피너 오버레이.
- 데이터 `GET /in-app-messages/templates` → `[{id, title, displayType, htmlString}]`, `displayType`별로 묶고 `id` 오름차순.
- 섹션 순서: "Bottom Sheet"(`BOTTOM_SHEET`) · "Modal"(`MODAL`) · "Full Screen"(`FULL_SCREEN`) · "Custom"(고정 카드 1개, 제목 "HTML").
- 카드: 390×844 iframe을 2/3 배율(260×562.67, sandbox 빈 값) + 하단 제목. 클릭 → `/in-app/new?templateId={id}`, Custom → `?templateId=html`.

---

## 7. 인앱 생성·수정·상세 `/in-app/new` · `/in-app/[iamId]/edit` · `/in-app/[iamId]`

### 7.1 진입·리다이렉트
- `iamId` 있음(수정/상세): `GET /in-app-messages/{id}?gte&lte&timeZone`(기간은 URL `gte/lte`, 없으면 30일). 실패/없음 → `/in-app`.
- 신규: `templateId` 없음 → `/in-app`. `templateId=html` → 빈 HTML 스켈레톤 + HTML(코드) 모드. 그 외 → 템플릿 목록에서 찾아 `htmlString` 사용, 못 찾으면 `/in-app`.
- 이탈 방지: 신규·수정에서만(상세 readonly 제외) §4와 같은 confirm/beforeunload. 저장 성공 시 해제.

### 7.2 헤더
- ← 뒤로 → `/in-app`(현재 `gte`/`lte` 쿼리 유지).
- 제목: 신규 "새 인앱 메시지"(`category.newInApp`) / 수정·상세 "인앱 메시지".
- (수정·상세, 데이터 로드 후) 우측 기간 버튼 - **플랜 게이트 적용**(§1.8). 변경 시 같은 GET 재요청.

### 7.3 폼 섹션 (위→아래)
1. **캠페인 명** - 라벨 `common:campaignName`="캠페인 명", 입력 placeholder "인앱 메시지 제목". 상세에서는 readOnly + 우측 secondary xl 버튼 "일시중지"(active) / "활성화"(그 외).
   - 상세에서 "활성화": `confirm("활성화하시겠습니까?")` → `POST …/active` → 재조회. "일시중지": **확인 없이** `POST …/pause` → 재조회.
2. **노출 시점** - 라벨 "노출 시점" + 도움말 "인앱메시지 노출 시점은 고객사가 직접 제어합니다.<br/>서비스 내 원하는 타이밍에 displayInApp('트리거_이름') 함수를 실행하도록 코드를 삽입하세요. 입력한 트리거 조건과 일치하는 함수 실행 시점에 인앱메시지가 노출됩니다."
   - 트리거(=노출 그룹) 입력 placeholder "트리거 입력" + tertiary sm 버튼 `+`아이콘 "필터"(`common:plusFilter`). 조건 최대 **3개**(3개면 disabled).
   - 조건 행: 데이터 키 입력 · 연산자 선택(`=` `≠` `>` `≥` `<` `≤` "이 중에 하나" "포함" "포함하지 않음", 기본 `=`) · 값 입력 · 삭제 아이콘(마지막 1개 삭제 시 조건 `null`).
   - 안내 줄(i 아이콘): `FlareLane.displayInApp("{트리거}") 실행 시 인앱메시지 노출`.
3. **통계** (상세만) - §7.5.
4. **메시지** (`common:message`) - 에디터 §7.4.
5. **설정** (`config`)
   - "우선순위": 선택 "높음"(0) / "중간"(1, 기본) / "낮음"(2).
   - "노출 기간": 라디오 "항상"(start/end 없음, 기본) / "기간 내"(선택 시 시작=종료=지금) → 날짜 선택 + 시(0-23)·분(0-59) 숫자 입력 ×2, 사이 "~", 끝에 타임존 표시. 상세에서는 `yyyy.LL.dd HH:mm:ss ~ … tz` 텍스트.
   - "노출 대상": 라디오 "모든 기기"(null, 기본) / "다음 조건 만족 기기" → 세그먼트 필터 빌더(이벤트 필터 제외).
   - "전환 이벤트 설정": 라디오 "미설정" / "설정" → 이벤트 탭("이벤트", "이벤트 2"…, 드래그 정렬, + 추가), 이벤트 선택·하위 조건, "기여 기간" 입력, 안내 "{{conversionTrigger}} 후 {{기여기간}} 내 {이벤트} 이벤트 발생 시 전환으로 측정됩니다."(인앱 기준 = "클릭").
6. **하단 버튼**
   - 상세: secondary xl destructive "삭제" → `confirm("삭제하시겠습니까?")` → DELETE → 토스트 "인앱 메시지가 삭제되었습니다." → `router.replace("/in-app")` · primary xl "수정" → `/in-app/{id}/edit`.
   - 신규: "생성" / 수정: "수정".

### 7.4 메시지 에디터
- 상단 툴바: tertiary sm "HTML 복사하기" → 클립보드 복사 후 네이티브 `alert("클립보드에 복사되었습니다.")` · (상세에서만) "테스트 발송" · 미리보기 토글 아이콘 2개(첫째 = 모바일, **기본 선택**; 둘째 = 웹).
- 미리보기 프레임: 모바일 390×844 @0.6398, 웹 1280×1080 @0.5. 영역 640×540.
- 좌측 편집 패널(GUI 모드): HTML의 `data-flarelane-type` 요소별 카드 - "배경"(배경색·닫기 액션 안내 "이 영역을 클릭하여 인앱메시지를 닫으려면 닫기 액션을 추가하세요."), 컨테이너, "이미지"(너비/높이/모서리 곡선), "버튼"(텍스트, 텍스트 크기(px) min 1, 텍스트 굵기 min 100 step 100, 텍스트 색 또는 색, 배경색, 모서리 곡선(px)), 인디케이터. 카드 호버 시 미리보기 요소 하이라이트(파란 테두리).
  - 버튼/배경 액션: 선택 "URL" · "커스텀 액션" · "닫기"(인자 = n일/시간, placeholder "n일 동안 보지 않기", 설명 "* 다시 보지 않기") · "푸시 알림 구독 요청". 이미 추가된 종류는 선택지에서 빠짐. 닫기 인자가 숫자가 아니면 `alert("숫자를 입력해주세요.")`.
  - 체크박스 "클릭 통계 활성화" → 입력 placeholder "클릭ID"(`data-flarelane-clickable-id`).
  - 캐러셀: 마지막 슬라이드 아래 "캐러셀 추가"(최대 6장), 3장 이상일 때 슬라이드별 "캐러셀 삭제". 토글 "캐러셀 설정" → "자동 슬라이드" 스위치, "자동 슬라이드 속도(초)" 숫자(min 1, 기본 5) + "초".
  - "고급 설정"(토글, readonly면 숨김) → "웹 컨테이너 설정": Key 선택(top/left/bottom/right/width/height/z-index/position/transform, placeholder "Key") + Value 입력(placeholder "Value") + 삭제, secondary xs "추가".
- HTML 모드(`editorType:"html"`): textarea(`aria-label`="인앱 HTML") + 고급 설정. 상세에서는 클릭ID별 클릭 통계 카드.
- GUI/HTML 전환 UI는 없음(템플릿 `html` 여부/저장된 `editorType`으로 고정).
- 테스트 발송 모달(공유): "테스트 발송" / "실제 메시지 발송 전 내용을 검토하고, 사전에 오류를 방지할 수 있습니다." · "테스트 기기 선택" 테이블(플랫폼·유저 ID, "<n>개 선택됨") · "발송" → `POST /in-app-messages/{id}/preview {deviceIds}` → 네이티브 `alert("테스트 인앱 메시지가 최우선 노출 예약되었습니다. 해당 기기로 노출 그룹 실행 시 노출됩니다.")` 후 닫힘.

### 7.5 상세 통계 섹션 ("통계")
- 카드 2개: "노출"(전체 숫자) / "클릭"(전체 숫자 + `clickedRateTotal` 소수 1자리 %). 각 카드: 플랫폼 비율 막대 + 범례 "앱(안드로이드)" · "앱(iOS)" · "웹(데스크탑)" · "웹(모바일)" `값 (x.x%)`. `isStatsExportEnabled` & 값>0이면 다운로드 아이콘 버튼(`aria-label`="다운로드", 사유 입력 모달 경유, 타입 `IN_APP_MESSAGE_DISPLAYED_CSV`/`IN_APP_MESSAGE_CLICKED_CSV`).
- 전환 설정이 있으면 전환 이벤트 상세 카드("전환 이벤트", "구매").
- "기간별 노출 및 클릭" 라인 차트: 범례 "노출"(blue300) · "클릭"(blue500), 툴팁 `노출: n` / `클릭: n`. X축 = `dateHistogramStats[].date`.

### 7.6 저장 동작 ("생성"/"수정")
1. HTML에 `FlareLaneIAM.close(n)`이 없으면 `alert("닫기 액션이 없습니다. 닫기 액션을 추가해주세요.")` 후 중단.
2. 시작·종료 초/밀리초 0으로 맞춤. `startDate >= endDate`면 토스트 "노출 기간이 유효하지 않습니다." 후 중단.
3. 페이로드: `{title, htmlString, group, dataFilterConditions(빈 배열이면 null), priority, targetSegmentFilters, conversionConfigs, startDate, endDate, editorType:"html"|"gui", containerConfig}`.
4. 수정: `confirm("수정하시겠습니까?")` → `PATCH /in-app-messages/{id}`. 신규: `POST /in-app-messages {…, status:"paused"}`(신규는 항상 일시중지 상태로 생성).
5. 성공 → `localStorage["inapp-list-{group}"]="1"`, 이탈 방지 해제, `/in-app/{id}`(상세)로 이동. **성공 토스트 없음**.

---

## 8. 목업용 GET 엔드포인트 · 응답 필드

| 엔드포인트 | 쓰는 곳 | 응답 `data` 주요 필드 |
|---|---|---|
| `GET /automations` | 여정 목록 | `Automation[]`: `id, name, active, lastActivatedAt, lastPausedAt, archivedAt, createdAt, scheduledStartAt, scheduledEndAt, scheduleTimeZone, scheduledEndHandling, lastActivationReason("SCHEDULED"…), handlingOnPause("PROCESS"\|"EXIT"), entryType("SEGMENT"\|"EVENT"), isUserAutomation, startActions[], editor(JSON 문자열), entryConditions{segment, userSegment, event[][], anonymousDeviceFilterOption}, exitConditions{event}, settings, conversionConfigs, entryPolicy, reEntryAfterCompletionMode, reEntryAfterCompletionDuration` |
| `GET /automations/{id}?gte&lte&timeZone` | 상세·빌더·드로어 통계 | 위 + 액션별 `waiting/sent/clicked/failed/delivered/opened` |
| `GET /conversions/automations?id&gte&lte&timeZone` | 목록 행·드로어 지표 | `{id, entryTotal, conversionTotal, purchaseAmountTotal}` |
| `GET /conversions/automations/{id}?gte&lte&timeZone` | 상세·드로어 통계 | `{total:{id, entryTotal, conversionTotal, purchaseAmountTotal}, byAction:[{id,…}], byABTestAction:[]}` |
| `GET /conversions/automations/{id}/date-histogram?…` | 상세 일별 차트 | (필드 미확인) |
| `GET /conversions/automations/{id}/actions/{actionId}?…` | 노드 분석 | `entryTotal, matched, unmatched` 등 |
| `GET /automation-examples` | 추천 여정 | `{examples:[{id, title, description, imageUrl, section:"base"\|"commerce", created, automation}]}` |
| `GET /in-app-messages/grouped?gte&lte&timeZone&statuses` | 인앱 목록 | `[{group, activeCount, totalCount, list:[{id, title, status, displayStatus("temp"\|"active"\|"paused"), priority(0/1/2), createdAt, startDate, endDate, isExpired, htmlString, containerConfig, dataFilterConditions[][]{dataKey, operator, value}}]}]` |
| `GET /in-app-messages/{id}/stats-summary?gte&lte&timeZone` | 인앱 카드 통계 | `displayedTotal, displayedUniqueUser, clickedTotal, clickedUniqueUser, clickedRateUniqueUser, convertedTotal, convertedUniqueUser, convertedRateUniqueUser, purchaseAmount` |
| `GET /in-app-messages/{id}?gte&lte&timeZone` (`disableStats=true` 옵션) | 인앱 상세·수정 | `id, title, status, htmlString, group, dataFilterConditions, priority, startDate, endDate, targetSegmentFilters, conversionConfigs, editorType, containerConfig, clickStats[{clickableId,…}], dateHistogramStats[{date, displayedTotal, clickedTotal}], devicePlatformStats{android, ios, webDesktop, webMobile:{displayed, clicked}}, displayedTotal, clickedTotal, clickedRateTotal, isStatsExportEnabled, conversionEventDetailsByPlatform{total}` |
| `GET /in-app-messages/templates` | 템플릿 선택·신규 | `[{id, title, displayType("BOTTOM_SHEET"\|"MODAL"\|"FULL_SCREEN"), htmlString}]` |
| `GET /devices/search?isTest=true&ignoreSubscribed=true&page&per` | 인앱 테스트 발송 기기 | (공유 - 기기 문서 참조) |

참고(목업에서 성공만 흉내 낼 쓰기 요청): `PATCH /automations/{id}/status`, `POST automations/{id}/replicate`, `DELETE automations/{id}`, `PUT /automations/{id}/schedule`, `POST/PATCH /automations`, `POST /automation-examples/{id}`, `POST /in-app-messages`, `PATCH|DELETE /in-app-messages/{id}`, `POST /in-app-messages/{id}/{active|pause|replicate|preview}`.

---

## 9. 확인 못 한 것
- 여정 캔버스(모듈 96803) 내부 노드 UI·노드 패널·분석 패널의 세부 레이아웃과 문자열 전체(범위 밖으로 요약만).
- `displayStatus:"temp"`(임시 저장) 인앱이 생기는 경로 - 콘솔 생성 폼은 항상 `status:"paused"`로 생성하므로 서버/여정 연동 측 규칙으로 추정되나 번들로는 확인 불가.
- `date-histogram`·`actions/{actionId}` 응답의 정확한 필드 구조, 액션별 통계 필드가 `GET /automations/{id}` 응답 어디에 붙는지(편집기 데이터 동기화 함수 경유).
- 서버 오류 시 토스트(axios 인터셉터 공통 처리 여부) - 이 화면 코드에는 성공/검증 토스트 외 오류 토스트 호출 없음.
- 플랜에 따른 "새 자동화"·AI 기능 노출 제한(번들상 AI 카드는 AI 채팅 패널 열림 여부로만 숨김; 플랜 배지 없음).
- 각 컴포넌트의 정확한 간격·폰트(Emotion 템플릿 리터럴은 일부만 확인).
- 인앱 상세 전환 이벤트 카드(14890)와 CSV 사유 모달의 세부 문구.
- `localStorage["inapp-list-{group}"]` 플래그를 읽는 곳(이번에 받은 청크 안에서는 쓰기만 있음).
