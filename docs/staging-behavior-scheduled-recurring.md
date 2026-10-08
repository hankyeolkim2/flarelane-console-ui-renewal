# 스테이징 콘솔 동작 명세 - 예약된 메시지(5채널) · 반복 발송 메시지

- 출처: `https://staging-console.flarelane.com` 공개 번들 JS(buildId `Q-tOYo7BMgpuoKSGYkmC0`, `/404` HTML의 `__NEXT_DATA__`로 재확인) + `/locales/ko/*.json` 정적 분석. 로그인·API 호출 없음 (2026-10-08).
- 문자열은 ko 로케일 값을 그대로 인용. `ns:key`는 번역 네임스페이스와 키.
- API 경로는 `https://staging-service-api.flarelane.com/v1/projects/{projectId}` 기준 상대경로 (보낸 메시지 명세와 같은 axios 인스턴스).
- 상세 화면의 메시지·대상·분석 섹션은 보낸 메시지 상세와 **같은 컴포넌트**를 `detailPageType`만 바꿔 씀 → 겹치는 부분은 `staging-behavior-sent-history.md`(이하 "보낸 메시지 명세") 절 번호로 참조.

---

## 0. 라우트

| 채널 | 예약 목록 | 예약 상세 | 예약 수정 | 사이드바 링크 |
|---|---|---|---|---|
| 푸시 | `/push/scheduled-messages` | `/push/scheduled-messages/[scheduledNotificationId]` | `…/[scheduledNotificationId]/edit` | `/push/scheduled-messages?p=1` |
| 알림톡 | `/alimtalk/scheduled-messages` | `/alimtalk/scheduled-messages/[id]` | `…/[id]/edit` | `/alimtalk/scheduled-messages?p=1` |
| 브랜드메시지 | `/friendtalk/scheduled-messages` | `/friendtalk/scheduled-messages/[id]` | `…/[id]/edit` | `/friendtalk/scheduled-messages?p=1` |
| SMS | `/sms/scheduled-messages` | `/sms/scheduled-messages/[id]` | `…/[id]/edit` | `/sms/scheduled-messages?p=1` |
| 이메일 | `/email/scheduled-messages` | `/email/scheduled-messages/[id]` | `…/[id]/edit` | `/email/scheduled-messages` (쿼리 없음) |

반복 발송: 목록 `/recurring-messages` (사이드바 "자동화 메시지" 카테고리의 `recurringMessages` = "반복 발송 메시지"). 채널별 상세 `/recurring-messages/{push|alimtalk|friendtalk|sms|email}/[id]`, 수정 `/recurring-messages/{channel}/[id]/edit`. **반복 발송 전용 "새로 만들기" 라우트는 없음** - 각 채널 `/{channel}/new-message?config=recurring`을 씀.

- 메뉴 노출: 알림톡·브랜드메시지·SMS는 `onlyKo`(보낸 메시지 명세 0장과 동일).

---

## 1. 예약 목록 - 공통 구조 (5채널 동일 레이아웃)

5채널 모두 같은 레이아웃 컴포넌트 + 같은 쿼리 훅을 쓴다. 행 카드만 채널별(1.5).

### 1.1 헤더
- 좌측 제목: `common:scheduledMessages` = "예약된 메시지"
- 우측: 검색 입력(placeholder `sentHistory:search.placeholder` = "캠페인명, 제목, 내용, ID 검색", `maxLength=100`, 폭 420px) + **"검색"** 버튼(`common:button.search`, size xs).
  - 보낸 메시지와 달리 **발신 환경 드롭다운 없음**, 검색 버튼 disabled 처리 없음(로딩 중이거나 입력값 trim이 현재 검색어와 같으면 클릭해도 무시).
  - 입력에서 Enter → 검색 실행(같은 훅).

### 1.2 상태 탭
- 탭 3개(순서 고정): **"대기 중"**(`WAITING`) · **"발송 완료"**(`REQUESTED`) · **"실패"**(`FAILED`). 라벨 = `common:{STATUS}`.
- 표기: `대기 중(3)` - 라벨 바로 뒤 괄호, **공백 없음**. 숫자 = 응답 `meta[STATUS]`.
- `STARTED`("발송 중")는 쿼리로는 유효하지만 **탭이 없음**.
- 탭 클릭 → `{ p: 1, st: 탭 }`으로 push (**검색어 `sk`는 버려짐**).

### 1.3 URL 쿼리 · 검증 · 리다이렉트
- `p` = 페이지(1부터), `st` = 상태(기본 `WAITING`), `sk` = 검색어(`encodeURIComponent`, 읽을 때 decode).
- 프로젝트 로드 후 검증: `p`가 숫자 아님 / 0·없음 / 500 초과, 또는 `st`가 `WAITING|STARTED|REQUESTED|FAILED`가 아니면 → `router.push({ p: 1, st: "WAITING" })` (검색어 버림).
  - 즉 사이드바 `?p=1` 진입도 `st`가 없으므로 기본값으로 읽혀 통과하고, 쿼리 없이 들어온 이메일(`/email/scheduled-messages`)은 `p` 없음 → `?p=1&st=WAITING`으로 교체.
- 검색 실행: `trim` 결과가 현재 검색어와 같으면 무시. 다르면 `{ p: 1, st: 현재, sk: 새 값 }` push (빈 문자열이면 `sk` 생략 = 검색 해제).
- 페이지 변경: `{ p: n, st: 현재, sk: 현재 }` push (검색어 유지).

### 1.4 리스트 · 페이지네이션 · 빈 상태
- 요청: `GET {endpoint}?status={st}&searchKeyword={sk|생략}&page={p}&per=10`. 폴링 없음(목록은 진입/쿼리 변경 시에만 로드).
- 응답: `{ data: [...], meta: { WAITING, STARTED, REQUESTED, FAILED, totalCount } }`. 실패 시 빈 배열 + meta 전부 0.
- 페이지네이션: 10개/페이지, 페이지 버튼 5개, 최대 500페이지, `itemsTotal = meta[st]`. **처음/마지막(«, ») 버튼 있음**(보낸 메시지와 달리 `hideFirstLastPages` 안 씀) + 이전/다음.
- 로딩 중: 기존 리스트 위 스피너 오버레이, 페이지네이션 옆 로딩 표시.
- **빈 상태**: 로딩 끝 + 0건 → 문서·돋보기 일러스트 + "데이터가 없습니다"(`common:noData`). **0건이면 페이지네이션 숨김.**

### 1.5 행(카드) - 공통 요소
카드 왼→오: ① 배지 묶음 ② 내용 블록 ③ 날짜 ④ 통계 ⑤ ⋯ 메뉴.
1. **배지**: 발신 환경 배지(보낸 메시지 명세 1.4-1과 동일: 콘솔 보라/API 초록/테스트 노랑/시스템 파랑, 83px) + **상태 배지**(83px, `padding 3px 12px`, radius 8px, 글자색 = 상태색, 배경 = 상태색 + 알파 `1a`).
   - 상태색: WAITING 노랑(yellow) "대기 중" · STARTED 보라(purple) "발송 중" · REQUESTED 초록(green) "발송 완료" · FAILED 빨강(red) "실패".
2. **날짜**: 라벨 "예약 날짜"(`common:table.sendAfter`) + `sendAfter`를 `yyyy.LL.dd HH:mm:ss`(브라우저 로컬). 없으면 "-".
3. 통계 테이블/숫자 표기는 보낸 메시지 명세 1.4-4와 동일(채널별 차이는 1.6).

### 1.6 채널별 행 내용·데이터 매핑

| 채널 | 엔드포인트 | 응답 행에서 읽는 위치 | 내용 블록 (subtitle / title / body) | 통계 |
|---|---|---|---|---|
| 푸시 | `/scheduled-notifications` | `row.notification` | 미리보기 블록: 캠페인명 / 제목 / 본문 + `url`·`imageUrl` 있으면 링크·이미지 아이콘 | "발송"=`sentTotal` · "클릭"=`convertedTotal`(클릭률%) · "전환"=`conversionTotal`(전환율%, 분모 sentTotal) · "구매 총액"=통화포맷 `purchaseAmountTotal` |
| 알림톡 | `/scheduled-kakao-alimtalk` | `row.kakaoAlimtalk` | - / `campaignName`(camp) + `templateName` / `templateContent` | 전체 유저=`selected` · 발송 유저=`sent` · 전환 유저=`convertedUniqueUser` · ROAS=`roas` |
| 브랜드메시지 | `/scheduled-kakao-friendtalk` | `row.kakaoFriendtalk` | `kakao:{messageType}`(예 "와이드 이미지형") / `campaignName` / `text ?? items[0].title` (본문 2줄) | 알림톡과 동일 필드 |
| SMS | `/scheduled-sms` | `row.sms` | - / `campaignName` / `body` | 전체 유저=`selected` · 발송 유저=`sentSMS+sentLMS+sentMMS+max(pending,0)` · 전환 유저=`convertedUniqueUser` · ROAS |
| 이메일 | `/scheduled-emails` | `row.email` | - / `campaignName` / `email.title` (본문 2줄) | 정보 그리드: "예약 날짜"=`row.sendAfter` · "발송"=`delivered` · "실패"=`failed+aborted` · "읽음"=`opened` · "전환"=`converted` · "구매 총액"=`purchaseAmount` |

- 푸시만 추가 행: **"플랫폼"**(`common:platform`) - 안드로이드/iOS/웹데스크탑/웹모바일 아이콘. 표시 조건: `selectedAndroid>0` 또는 `targetPlatforms`에 `android` 포함 (ios·webDesktop·webMobile 동일 규칙).
- 푸시 전환 수치는 **카드가 화면에 보일 때 500~2000ms 랜덤 지연 후** `GET /notifications/{notification.id}/conversion-stats` 로드(캐시). 로딩 중 스켈레톤.
- 브랜드메시지 `messageType` 라벨: FT·FI "기본 텍스트형", FW "와이드 이미지형", FL "와이드 리스트형", FA "캐러셀 커머스형", FC "캐러셀 피드형".

### 1.7 행 클릭 (Ctrl/⌘ 클릭은 `window.open` 새 탭)

| 채널 | 예약 상세로 가는 조건 | 그 외 → 보낸 메시지 상세 |
|---|---|---|
| 알림톡·브랜드메시지·SMS | `status`가 있고 `REQUESTED`·`STARTED`가 **아님** (WAITING, FAILED) | `/{channel}/sent-history/{row.id}` |
| 이메일 | `REQUESTED`·`STARTED`가 아님 | `/email/sent-history/{row.id}` |
| 푸시 | `status !== "REQUESTED"` (STARTED도 예약 상세로 감) | `REQUESTED`이고 `notification.id`가 있으면 `/push/sent-history/{notification.id}` |

### 1.8 ⋯ 메뉴 (예약 전용, 5채널 공용)
- 버튼: tertiary, 아이콘 `more_horiz`. 클릭 시 팝오버 토글, 바깥 클릭으로 닫힘, 이벤트 전파 차단(행 클릭 안 됨). 메뉴 최소폭 120px.
- 항목(위→아래, 조건부):

| 항목 | 노출 조건 | 동작 |
|---|---|---|
| **"상세 정보"** (`common:button.detail`) | 항상 | `REQUESTED`·`STARTED` → `{sentHistoryHref}/{row.id}`, 그 외 → `{scheduledHref}/{row.id}` |
| **"수정"** (`common:button.edit`) | `status === "WAITING"` | `{scheduledHref}/{row.id}/edit` |
| **"예약 취소"** (`common:button.scheduleCancel`, 빨강) | `status === "WAITING"` | 메뉴 닫고 취소 모달(아래) |
| **"재시도"** (`common:retry`, 빨강) | `status !== "WAITING"` **그리고** `sendAfter + 5분 <= 지금` **그리고** 대상 수(`selected`, 푸시는 `notification.selectedTotal`) `=== 0` | 아래 |

- 모바일 미디어쿼리에서는 "수정"·"예약 취소" 항목 숨김.
- 푸시 "상세 정보"는 `REQUESTED/STARTED`일 때도 **예약 id**(`row.id`)로 `/push/sent-history/{row.id}`를 만든다(행 클릭은 `notification.id`를 씀 - 번들 그대로의 차이).
- **예약 취소 모달**(폭 450px 본문, 버튼 우측 정렬): 제목 "예약을 취소하시겠습니까?"(`sentHistory:scheduled.wantDeleteTemplate`), 설명 "취소된 예약은 복구할 수 없습니다."(`sentHistory:scheduled.noRestore`), 버튼 **"닫기"**(secondary) · **"확인"**(destructive, 로딩 표시). 로딩 중 배경 클릭 무시.
  - 확인 → `DELETE {endpoint}/{id}` → 목록 재조회 → 모달 닫기 → 성공 토스트 **"예약이 취소되었습니다."**(`common:alert.successDelete`).
- **재시도**: `window.confirm("발송을 재시도 하시겠습니까?")`(`sentHistory:confirm.retry`) → 확인 시 `POST {endpoint}/{id}/retry` → `window.alert("발송 재시도 요청이 완료되었습니다.")`(`sentHistory:alert.retrySuccess`) → 목록 재조회 → 메뉴 닫기. 진행 중 중복 클릭 무시.
- "복제"(`button.copy`) 항목은 예약 목록에 **없음**(보낸 메시지 목록 전용).

---

## 2. 예약 상세 - 공통 패턴

### 2.1 헤더
- 좌측 뒤로가기 화살표(회색 배경 원형) → 해당 채널 예약 목록(쿼리 없음 → 1.3 규칙으로 `?p=1&st=WAITING`).
- 제목: "예약된 메시지 상세" (`sentHistory:scheduledDetailCategory` / `kakao:detailScheduled` / `sms:detailScheduled` / `email:detailScheduled` - 모두 같은 문자열).
- 헤더에 버튼 없음("메시지 복제"는 보낸 메시지 상세 전용).

### 2.2 섹션 순서
1. **정보**("정보", 푸시는 "발송 정보"(`sentHistory:information`)) 표:
   - "ID" = URL의 id
   - "캠페인 명"(`common:campaignName`) - 값 있을 때만
   - 같은 줄 2칸: **"예약 날짜"**(`table.sendAfter`) | **"발송 환경"**(`table.source`, 큰 배지 96px; 푸시는 라벨 옆 도움말 "메시지가 발송된 환경입니다.")
   - "발송 빈도 제한 무시"(`common:ignoredCapping`) = `TRUE`/`FALSE` - `ignoreFrequencyCapping`이 정의돼 있고 (채널 빈도제한 활성 또는 값이 true)일 때만
   - 푸시 추가 행: "알림 만료 기간", "발송 속도"(`분당 {n}개 메시지 발송`), "무작위 일부 발송"(`rate*100%`) - 보낸 메시지 명세 4.1과 동일 규칙
2. **메시지** - 채널별 읽기전용 편집기 + 미리보기 (보낸 메시지 명세 4.x와 동일). SMS 미리보기의 광고 부가문구는 `detailPageType==="scheduled"`이고 상태가 `REQUESTED`가 아닐 때만 붙음.
3. **유형 & 대상** - 보낸 메시지 명세 3.4와 동일. 단 예약 상세에서는 `targetSnapshots`/`excludeTargetSnapshots`를 넘기지 않음(현재 세그먼트 정의로 표시). 브랜드메시지는 `targeting`이 있으면 "수신자 타겟팅" 행: M "선택한 유저 전체에게 발송 (M)" / N "선택한 유저 중 채널친구를 제외하고 발송 (N)" / I "선택한 유저 중 채널친구에게 발송 (I)".
4. **하단 버튼**(조건 2.4)
5. **분석** - 보낸 메시지 명세 3.5~3.8과 동일 컴포넌트(실패 상세 모달, 전환 이벤트 카드 포함). 실패 상세 API는 보낸 메시지 경로(`/{channel}/{id}/failure` 계열)를 그대로 씀.

### 2.3 "예약 날짜" 값 표기
- `local` = `sendAfter`를 브라우저 로컬로 `yyyy.LL.dd HH:mm:ss`, `tz` = `sendAfter`를 `sendAfterTimeZone`으로 변환한 같은 포맷.
- `local === tz`: 한 줄 `{tz} {sendAfterTimeZone}` (예 `2026.10.09 10:00:00 Asia/Seoul`)
- 다르면 두 줄: `{local} {브라우저 타임존}` / `({tz} {sendAfterTimeZone})`
- `sendAfter`가 없으면 라벨이 "발송 시간"으로 바뀌고 `createdAt` 기준.

### 2.4 하단 버튼 · 예약 취소
- 노출 조건: **`sendAfter`가 현재보다 미래**일 때만(상태 값은 보지 않음). 좌→우 **"예약 취소"**(secondary·destructive·xl) · **"수정"**(xl).
- "수정" → `/{channel}/scheduled-messages/{id}/edit`.
- "예약 취소" → 1.8과 같은 모달(문구·버튼 동일; 브랜드메시지·알림톡은 `kakao:`, SMS는 `sms:` 키지만 문자열 동일) → `DELETE {endpoint}/{id}` → 토스트 "예약이 취소되었습니다." → 목록으로 이동:

| 채널 | 취소 후 이동 |
|---|---|
| 푸시 | `router.replace("/push/scheduled-messages?p=1")` |
| 알림톡·브랜드메시지·SMS·이메일 | `router.push("/{channel}/scheduled-messages")` |

### 2.5 채널별 로드 · 폴링 · 리다이렉트

| 채널 | 상세 GET | 폴링 | 특수 처리 |
|---|---|---|---|
| 푸시 | `GET /scheduled-notifications/{id}` + `GET /notifications/{id}/conversion-details` (둘 다 **예약 id**) | 없음(1회) | 응답 `status === "REQUESTED"` → `/push/sent-history/{data.notification.id}`로 push. 요청 실패 → `/push/scheduled-messages`로 push. 첫 로딩 중 전체 스피너 |
| 알림톡 | `GET /scheduled-kakao-alimtalk/{id}` → `data.kakaoAlimtalk`, `data.conversionEventDetailsByPlatform.total`, `sendAfter`, `sendAfterTimeZone`, `status` | **10초마다 재조회** | 없음 |
| 브랜드메시지 | `GET /scheduled-kakao-friendtalk/{id}` → `data.kakaoFriendtalk` 외 동일 | 10초 | 없음 |
| SMS | `GET /scheduled-sms/{id}` → `data.sms` 외 동일 | 10초 | 없음 |
| 이메일 | `GET /scheduled-emails/{id}` → `data.email`(+`email.conversionEventDetailsByPlatform`) | 없음(1회) | 없음 |

---

## 3. 예약 수정 (`…/scheduled-messages/[id]/edit`)

각 채널 새 메시지 작성 화면을 수정 모드로 재사용.
- 제목: **"예약된 메시지 수정"**(`sentHistory:editScheduledCategory`).
- 진입 로드: 예약 상세 GET 후 **현재 시각 ≥ `sendAfter`면 즉시 `router.replace(예약 목록)`**. 로드 실패 → 예약 목록으로 push.
- 하단 버튼(신규 작성의 "임시 저장"/"발송"/"저장" 대신): **"취소"**(secondary xl → 예약 목록 push) · **"수정"**(xl).
- "수정" 클릭: 입력 검증(신규 작성과 동일 alert들) → 제출 직전에도 `sendAfter`가 지났으면 `replace(예약 목록)` → `PATCH {endpoint}/{id}` → 토스트 **"성공적으로 반영되었습니다."**(`common:alert.requestSuccessfully`) → 이동:

| 채널 | 확인 모달 | 성공 후 이동 |
|---|---|---|
| 푸시 | 있음: "예약된 메시지를 수정하시겠습니까?"(`sentHistory:scheduled.edit`) + "취소"/"확인" | `/push/scheduled-messages` (목록) |
| 알림톡·브랜드메시지·SMS | 없음 | `/{channel}/scheduled-messages/{id}` (상세) |
| 이메일 | 없음 | `/email/scheduled-messages` (목록) |

- 이탈 경고(beforeunload/routeChange 가드)는 번들에서 찾지 못함 → "확인 못 한 것" 참조.

---

## 4. 반복 발송 목록 (`/recurring-messages`)

### 4.1 상태 판정 (목록·상세 공용)
- `active === true` → **active**
- 아니고 `lastActivatedAt` 없음 → **draft**
- 아니고 `archivedAt` 있음 → **archived**, 없으면 **paused**
- 상태 라벨(`automation:`): active "활성화" · paused "일시중지" · draft "임시저장" · archived "아카이브됨"
- 상태 점 색: active `#13fB04` · paused `#f9a004` · archived `#527CBD` · draft `#a3a3a3` (테두리는 같은 색 + `b3` 알파)

### 4.2 헤더
- 제목 "반복 발송 메시지"(`common:recurringMessages`) + 우측 **"새 반복 발송 메시지"**(`recurring-message:recurringNew`, size md, 후행 아이콘 `keyboard_arrow_down`/열리면 `keyboard_arrow_up`).
  - 클릭 → 드롭다운 5항목(순서): "푸시 알림" · "카카오 알림톡" · "카카오 브랜드메시지" · "문자" · "이메일" → `/{push|alimtalk|friendtalk|sms|email}/new-message?config=recurring` push. 바깥 클릭으로 닫힘.
- 그 아래 검색 입력(돋보기 아이콘, 폭 420px, `maxLength=100`, placeholder "캠페인명, 제목, 내용 검색"(`recurring-message:search.placeholder`)). 포커스/값 있으면 아이콘 파란색.

### 4.3 필터 · 탭 · 검색
- **"채널"**(`common:channels`) 체크박스 5개(순서): 푸시 알림(`NOTIFICATION`) · 문자(`SMS`) · 카카오 알림톡(`KAKAO_ALIMTALK`) · 카카오 브랜드메시지(`KAKAO_FRIENDTALK`) · 이메일(`EMAIL`). 처음엔 전부 체크. 마지막 하나를 끄려 하면 `window.alert("최소 하나 이상 선택해주세요.")`(`common:selectOne`). URL에 저장 안 함.
- **상태 탭**(검색 중이 아닐 때만 표시) 순서: 활성화 · 일시중지 · 임시저장 · 아카이브됨. 표기 `활성화 (3)` - **괄호 앞 공백 있음**. 숫자 = 채널 필터 적용 후 상태별 건수.
  - 초기 탭 = `?status=` 값 또는 `active`. 탭 클릭은 로컬 상태만 바꿈(URL 안 바뀜).
- **검색**: 입력 300ms 디바운스 후 `router.replace({ sk })`(shallow), Enter는 즉시 반영. `sk`가 비어있지 않으면 **탭 숨김 + 상태 무관 전체에서** 클라이언트 필터. 대소문자 무시 부분일치 대상: 푸시 campaignName·title·body / SMS campaignName·title·body / 알림톡 campaignName·templateName·templateContent / 브랜드메시지 campaignName·header·text·items[].title·carousel.head.header·content·carousel.list[].header·message / 이메일 campaignName·title.
- 데이터: `GET /recurring-messages` → `data`(배열) **1회 전체 로드, 페이지네이션 없음**. 빈 결과 → "데이터가 없습니다" 일러스트.

### 4.4 카드
- 카드 클릭(Ctrl/⌘ = 새 탭) → `/recurring-messages/{push|alimtalk|friendtalk|sms|email}/{id}` (`type`: NOTIFICATION·KAKAO_ALIMTALK·KAKAO_FRIENDTALK·SMS·EMAIL).
- ① 채널 태그(폭 80px, 브랜드메시지만 100px, 회색 배경 + 채널색 글자/테두리) + 상태(점 + 라벨). 채널색: 푸시 `#FF6A00` · SMS `#152DC8` · 알림톡 `#802522` · 브랜드메시지 green700 · 이메일 `#AA47F6`.
- ② 내용 블록 + 하단 날짜줄:

| 채널 | 내용 (subtitle / title / body, body 줄 수) |
|---|---|
| 푸시 | 미리보기 블록(캠페인명 / 제목 / 본문, url·이미지 아이콘) |
| 알림톡 | camp `campaignName` / `templateName` / `templateContent` (1줄) |
| 브랜드메시지 | `kakao:{messageType}` / `campaignName` / `text ?? items[0].title` (1줄) |
| SMS | - / `campaignName` / `body` (2줄) |
| 이메일 | - / `campaignName` / `email.title` (2줄) |

  - 날짜줄 `{라벨}: {값}`: draft·paused → "생성 시간"(`common:createdAt`): `createdAt` / archived → "아카이브됨": `archivedAt` / active + `nextRunAt` 있음 → "다음 발송 일정": `nextRunAt`을 `recurringConfig.timeZone`으로 변환한 `yyyy.LL.dd HH:mm:ss (Asia/Seoul)` / active + `nextRunAt` 없음 → **빨강** "기간 만료": `~ {endDate yyyy.LL.dd}`(endDate 없으면 "-"). 그 외 포맷 `yyyy.LL.dd HH:mm:ss`.
- ③ 주기 블록: "반복 주기"(`period`) = 주기문구 + 회색 `(Asia/Seoul)` / "발송 종료일"(`recurring.endDate`) = 종료 텍스트(4.6).
- ④ 통계: **카드가 보이면 500~2000ms 랜덤 지연 후** `GET /recurring-messages/{id}/stats` + `GET /conversions/recurring-messages/{id}` 로드.

| 채널 | 통계 |
|---|---|
| 푸시 | "발송"=`stats.sentTotal` · "클릭"=`stats.convertedTotal`(클릭률) · "전환"=`conv.conversionTotal`(전환율, 분모 sentTotal) · "구매 총액"=`conv.purchaseAmountTotal` |
| 알림톡·브랜드메시지 | 전체 유저=`stats.selected` · 발송 유저=`stats.sent` · 전환 유저=`conv.conversionTotal` · ROAS=`conv.roas` |
| SMS | 위와 같되 발송 유저=`sentSMS+sentLMS+sentMMS+max(pending,0)` |
| 이메일 | "발송"=`delivered` · "읽음"=`opened` · "전환"=`conv.conversionTotal` · "구매 총액" |

### 4.5 카드 ⋯ 메뉴
| 항목(`automation:`) | 노출 | 동작 |
|---|---|---|
| "일시중지" | active | 확인 모달 "정말 일시중지하시겠습니까?"(설명 빈 문자열) → `PATCH /recurring-messages/{id}/status {status:"pause"}` |
| "활성화" | paused, draft | 활성화 모달(4.7) → `{status:"active"}` |
| "아카이브" | paused | 모달 "정말 아카이브하시겠습니까?" / "해당 자동화가 아카이브 상태로 보관되며, 언제든 아카이브 상태를 되돌릴 수 있습니다." → `{status:"archive"}` |
| "아카이브 해제" | archived | **모달 없이** 즉시 `{status:"pause"}` |
| "삭제"(빨강) | 항상 | 삭제 모달(4.7) |

- 상태 변경 성공 → 목록 재조회, 메뉴·모달 닫기. **성공 토스트 없음.** 모달 버튼은 "취소"(secondary) · "확인"(primary, 로딩 중 배경 클릭/ESC 무시).

### 4.6 주기·기간 문구 규칙
- 주기: DAILY "매일" / WEEKLY "매주 {월, 수, 금}요일"(요일 MON→SUN 순 정렬, `common:recurring.{MON…}` = 월·화·수·목·금·토·일, ", " 연결) / MONTHLY "매월 {1, 15}일"(숫자 정렬) + 공백 + `HH:mm`(2자리 패딩). 예 `매주 월, 수요일 09:00`.
- 타임존 꼬리: 목록 `(Asia/Seoul)`, 상세 `(GMT{오프셋}) Asia/Seoul`.
- 시작/종료 텍스트: `type==="ON_DATE"`면 `startDate`(없으면 `endDate`)를 `yyyy.LL.dd`, 둘 다 없으면 "-"; 그 외 `recurring-message:recurring.{type}` → NOW "지금부터", NEVER "무기한".

### 4.7 공용 모달
- **활성화 모달**: 제목 "반복 발송 메시지를 활성화하시겠습니까?" / 설명 "활성화 이후에는 변경이 불가능합니다." / 줄 "발송 예정일: {yyyy.LL.dd HH:mm:ss} ({timeZone})"(계산 중 스피너, 없으면 "-"). 열릴 때 `POST /recurring-messages/scheduled-dates {count:1, recurringConfig}`; 결과 0건이면 모달 닫고 `window.alert("종료시간을 확인해주세요.")`. 버튼 "취소" · "확인".
- **삭제 모달**: 제목 "반복 발송 메시지를 삭제하시겠습니까?" / 설명 "현재 활성화 상태인 경우, 비활성화 상태로 전환이 필요합니다." / 버튼 "취소" · "확인"(destructive) → `DELETE /recurring-messages/{id}` → 토스트 **"반복 발송 메시지가 삭제되었습니다."** → 목록: 재조회 / 상세: `router.replace("/recurring-messages")`.
- **예상 발송 일정 모달**(폭 600px): 제목 "발송 예정일" + 닫기 X. 표 헤더 "순서" · "날짜" · "시간", 행 = `POST /recurring-messages/scheduled-dates {count:5, recurringConfig}`의 `scheduledDates`(최대 5) → `1` / `yyyy.MM.dd` / `HH:mm (GMT+오프셋) Asia/Seoul`. 0건이면 "데이터가 없습니다" 일러스트. 로딩 중 스피너.

---

## 5. 반복 발송 상세 (`/recurring-messages/{channel}/[id]`)

### 5.1 로드
- `GET /recurring-messages/{id}` (`data` = 반복 메시지: `id, type, active, lastActivatedAt, archivedAt, nextRunAt, createdAt` + 채널 객체 `notification|kakaoAlimtalk|kakaoFriendtalk|sms|email`(내부에 `recurringConfig`)) 와 `GET /conversions/recurring-messages/{id}/detail` (`conversionEventDetailsByPlatform`)를 병렬 호출.
- **폴링 없음.** 첫 로딩 중 전체 스피너.

### 5.2 헤더
- 뒤로가기 → `/recurring-messages`. 제목 **"반복 발송 메시지 상세"**(`recurring-message:recurringDetail`).
- 제목 옆 버튼(size xs, 상태와 `recurringConfig`가 있을 때): active면 **"일시중지"**(`automation:paused`) → 일시중지 모달(4.5와 같은 문구) → `PATCH …/status {status:"pause"}`; 그 외(paused/draft/archived 모두) **"활성화"** → 활성화 모달(4.7) → `{status:"active"}`. 성공 → 상세 재조회, 토스트 없음.

### 5.3 정보 표 행
1. "ID" / "캠페인 명"(있을 때)
2. 같은 줄: **"다음 발송 일정"**(`recurring-message:nextRunAt`) = `nextRunAt`을 `recurringConfig.timeZone` 기준 `yyyy.LL.dd HH:mm:ss`(없으면 "-") + 회색 `(timeZone)` + tertiary sm 버튼 **"예상 발송 일정"** → 4.7 모달 | "발송 환경" 큰 배지
3. "발송 빈도 제한 무시"(조건부, 2.2와 동일) - 푸시는 같은 줄에 "알림 만료 기간"
4. **"반복 주기"**(`period`) = 주기문구 + 회색 `(GMT…) tz`
5. 같은 줄: **"발송 시작일"**(`recurring.startDate`) | **"발송 종료일"**(`recurring.endDate`) - 4.6 규칙
6. 푸시: "발송 속도" / "무작위 일부 발송"(조건부)

그 뒤 메시지 · 유형 & 대상 섹션은 예약 상세(2.2)와 동일.

### 5.4 하단 버튼
- **"삭제"**(secondary·destructive·xl): 상태가 active가 **아닐** 때 → 삭제 모달(4.7).
- **"수정"**(xl): **draft일 때만** → `/recurring-messages/{channel}/{id}/edit`.

### 5.5 분석 섹션
- 보낸 메시지 명세 3.5~3.8 컴포넌트. 차이: 실패 상세 `GET /recurring-messages/{id}/failure`, 실패 CSV는 file-export 잡(`POST /file-exports {type:"{채널}_FAILURE_CSV", payload:{scope:"recurring", scopeId:id, timeZone}}` → `GET /file-exports/{jobId}` 10초 폴링), 발송 대상 CSV 내보내기 없음, 전환 대상 CSV 버튼 없음.

### 5.6 "보낸 메시지" 카드 (상세 하단)
- 제목 "보낸 메시지"(`common:sentHistory`).
- `GET /recurring-messages/{id}/sent-history?per=5&page={n}` → `{ data: [...], meta: { totalCount } }`. 페이지는 **로컬 상태**(URL 아님), 1부터.
- 페이지네이션: 5개/페이지, 버튼 5개, 최대 500페이지, **이전/다음만**(처음/마지막 숨김). `totalCount` 0이면 페이지 버튼 안 그림. 빈 목록 → "데이터가 없습니다".
- 행 = 각 채널 보낸 메시지 행 카드와 같은 모양, 단 **상태 배지·⋯ 메뉴 없음**, 날짜 라벨 "발송 시간" = `createdAt`.
  - 전환 수치는 행이 보이면 500~2000ms 지연 후 `GET /conversions/recurring-messages/{id}/sent-history/{messageId}` → `conversionTotal`(전환 유저), `roas`, `purchaseAmountTotal`.
  - 푸시 행은 `sentTotal/convertedTotal` 통계, 이메일 행은 `delivered/failed/aborted/opened` 그리드(1.6 표와 같은 필드).
  - 행 클릭 → `/{channel}/sent-history/{행 id}` (푸시는 `/push/sent-history/{notification.id}`).

### 5.7 채널별 차이
| | 푸시 | 알림톡·브랜드메시지·SMS | 이메일 |
|---|---|---|---|
| 상세 컴포넌트 | 푸시 상세 공용 | 각 채널 상세 공용(`detailPageType:"recurring"`) | 별도 페이지(헤더 컴포넌트 + 정보/메시지/대상 + 통계) |
| 수정 경로 | `/recurring-messages/push/{id}/edit` | `/recurring-messages/{alimtalk|friendtalk|sms}/{id}/edit` | `/recurring-messages/email/{id}/edit` |
| 실패 CSV type | `PUSH_FAILURE_CSV` | `KAKAO_ALIMTALK_FAILURE_CSV` / `KAKAO_BRAND_MESSAGE_FAILURE_CSV` / (SMS 동일 패턴) | `EMAIL_FAILURE_CSV` |

---

## 6. 반복 발송 생성 · 수정

### 6.1 생성 (`/{channel}/new-message?config=recurring`)
- 작성 화면이 반복 설정 초기값으로 열림: `periodic:"DAILY"`, `daily:{hour:현재시, minute:현재분, interval:1}`, `timeZone`=브라우저 타임존(목록에 없으면 기본값), `start:{type:"ON_DATE", startDate:오늘}`, `end:{type:"NEVER"}`.
- 하단: 반복 설정이 있으면 "임시 저장" 버튼 **숨김**, 주 버튼 라벨 **"저장"**(`button.save`; 예약은 "저장", 즉시 발송은 "발송").
- 저장 성공 → 토스트 **"반복 발송 메시지가 저장되었습니다."**(`common:alert.successRecurringNotification`) → `/recurring-messages?status=draft`로 이동(목록이 "임시저장" 탭으로 열림).
- 참고: 같은 화면에서 예약 발송 성공은 "메시지가 발송 예약되었습니다." → `/{channel}/scheduled-messages`, 즉시 발송은 "메시지가 성공적으로 발송되었습니다." → 보낸 메시지 상세.

### 6.2 수정 (`/recurring-messages/{channel}/[id]/edit`)
- 제목 **"반복 발송 메시지 수정"**(`recurring-message:recurringEdit`).
- 로드: `GET /recurring-messages/{id}` → 채널 객체로 폼 채움 + `recurringConfig` 설정. 실패 → `/recurring-messages` push. (draft 여부 재검사는 진입 시 없음.)
- 하단 "취소"(→ `/recurring-messages`) · "수정". 제출 → `PATCH /recurring-messages/{id}` body `{ notification|kakaoAlimtalk|kakaoFriendtalk|sms|email: dto }` → 토스트 "성공적으로 반영되었습니다." → `/recurring-messages/{channel}/{응답 data.id}`.
- 푸시만 제출 전 확인 모달 "반복 발송 메시지를 수정하시겠습니까?"(`sentHistory:recurring.edit`).

---

## 7. 목업용 GET 엔드포인트 · 응답 필드

| 화면 | GET | 읽는 필드 |
|---|---|---|
| 예약 목록 | `/scheduled-notifications` · `/scheduled-kakao-alimtalk` · `/scheduled-kakao-friendtalk` · `/scheduled-sms` · `/scheduled-emails` (`?status&searchKeyword&page&per=10`) | `data[].{id, status, sendAfter, createdAt}` + 채널 객체(1.6 표) / `meta.{WAITING, STARTED, REQUESTED, FAILED, totalCount}` |
| 푸시 카드 전환 | `/notifications/{notificationId}/conversion-stats` | `conversionTotal, purchaseAmountTotal` (기본값 `{id:"",candidateTotal:0,conversionTotal:0,purchaseAmountTotal:0}`) |
| 예약 상세 | `/{예약 엔드포인트}/{id}` | `data.{status, sendAfter, sendAfterTimeZone, conversionEventDetailsByPlatform.total}` + 채널 객체(보낸 메시지 상세와 같은 필드: `campaignName, senderSource, ignoreFrequencyCapping, targetType, segmentIds, excludeSegmentIds, targetIds, conversionConfigs, createdAt`, 채널별 본문·통계 필드) |
| 푸시 예약 상세 | `/scheduled-notifications/{id}`, `/notifications/{id}/conversion-details` | `data.{status, sendAfter, sendAfterTimeZone, notification{…, id, ttl, ttlDate, rateLimitPerMinute, targetSelectionRate, targetPlatforms}}` |
| 반복 목록 | `/recurring-messages` | `data[].{id, type, active, lastActivatedAt, archivedAt, nextRunAt, createdAt}` + 채널 객체`{campaignName, …본문, recurringConfig}` |
| 반복 카드 통계 | `/recurring-messages/{id}/stats` | `sentTotal, convertedTotal, selected, sent, sentSMS, sentLMS, sentMMS, pending, delivered, opened` |
| 반복 카드 전환 | `/conversions/recurring-messages/{id}` | `candidateTotal, conversionTotal, purchaseAmountTotal, roas` |
| 반복 상세 | `/recurring-messages/{id}`, `/conversions/recurring-messages/{id}/detail` | 위 + `conversionEventDetailsByPlatform` |
| 반복 상세 보낸 메시지 | `/recurring-messages/{id}/sent-history?per=5&page=n` | `data[]`(채널 보낸 메시지 행 필드), `meta.totalCount` |
| 보낸 메시지 행 전환 | `/conversions/recurring-messages/{id}/sent-history/{messageId}` | `conversionTotal, roas, purchaseAmountTotal` |
| 실패 상세 | 예약: 보낸 메시지와 같은 경로 / 반복: `/recurring-messages/{id}/failure` | `{코드: 숫자}` |

- `recurringConfig` 모양: `{ periodic: "DAILY"|"WEEKLY"|"MONTHLY", daily:{hour,minute,interval}, weekly:{weekdays:["MON"…], hour, minute}, monthly:{daysOfMonth:[1…31], hour, minute}, timeZone, start:{type:"NOW"|"ON_DATE", startDate?}, end:{type:"NEVER"|"ON_DATE", endDate?} }`.
- GET이 아닌 호출(목업에서 응답만 흉내): `POST /recurring-messages/scheduled-dates {count, recurringConfig}` → `data.scheduledDates[]`(ISO), `PATCH /recurring-messages/{id}/status {status:"active"|"pause"|"archive"}`, `DELETE /recurring-messages/{id}`, `DELETE {예약 엔드포인트}/{id}`, `POST {예약 엔드포인트}/{id}/retry`, `PATCH {예약 엔드포인트}/{id}`, `PATCH /recurring-messages/{id}`.

---

## 8. 확인 못 한 것

- 실제 응답 예시 값(특히 `meta` 카운트가 검색어 적용 전/후 어느 기준인지, 예약 행 `id`와 발송 후 보낸 메시지 `id`가 같은지). 번들은 알림톡·브랜드메시지·SMS·이메일에서 예약 id를 그대로 보낸 메시지 상세 경로에 쓴다.
- 푸시 ⋯ "상세 정보"가 발송 완료 건에서 예약 id로 `/push/sent-history/{id}`를 만드는 것이 의도인지(행 클릭은 `notification.id` 사용).
- 상세 "(GMT{오프셋})"의 정확한 오프셋 문자열 형식(내부 타임존 테이블 값; `+09:00` 형태로 추정되나 미확인).
- 예약/반복 수정 화면의 이탈 경고(변경사항 저장 안 됨 confirm)는 번들 검색으로 찾지 못함 - 없는 것으로 보이나 단정 못 함. 수정 폼 내부 섹션 구성은 새 메시지 작성 화면 명세 범위라 여기서 다루지 않음.
- 반복 상세 SMS 실패 CSV의 `type` 문자열(알림톡·브랜드메시지·푸시·이메일만 직접 확인).
- 반복 목록 탭 "아카이브됨" 필터는 `archivedAt`만 보고, 상태 판정 함수는 `lastActivatedAt`도 요구 - `lastActivatedAt` 없이 `archivedAt`만 있는 데이터가 실제로 생기는지.
- 서버 오류 시 토스트(axios 인터셉터 공통 처리)는 이 화면 코드 밖이라 문구 미확인.
