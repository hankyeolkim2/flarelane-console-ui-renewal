# 스테이징 콘솔 동작 명세 - 보낸 메시지 (5채널 목록·상세)

- 출처: `https://staging-console.flarelane.com` 공개 번들 JS(buildId `Q-tOYo7BMgpuoKSGYkmC0`) + `/locales/ko/*.json` 정적 분석 (로그인·API 호출 없음, 2026-10-08)
- 문자열은 ko 로케일 값을 그대로 인용. `ns:key` 표기는 번역 네임스페이스와 키.
- API 경로는 모두 `https://staging-service-api.flarelane.com/v1/projects/{projectId}` 기준 상대경로(axios 인스턴스가 baseURL에 `/projects/{currentProject.id}`를 붙임). 헤더: `Authorization: Bearer …`, `x-flarelane-lang: ko`.

---

## 0. 라우트

| 채널 | 목록 | 상세 | 사이드바 링크(목록) |
|---|---|---|---|
| 푸시 | `/push/sent-history` | `/push/sent-history/[notificationId]` | `/push/sent-history?p=1&s=console` |
| 알림톡 | `/alimtalk/sent-history` | `/alimtalk/sent-history/[id]` | `/alimtalk/sent-history` |
| 브랜드메시지(friendtalk) | `/friendtalk/sent-history` | `/friendtalk/sent-history/[id]` | `/friendtalk/sent-history` |
| SMS | `/sms/sent-history` | `/sms/sent-history/[id]` | `/sms/sent-history` |
| 이메일 | `/email/sent-history` | `/email/sent-history/[id]` | `/email/sent-history` |

- 알림톡·브랜드메시지·SMS 메뉴는 `onlyKo`(한국어 로케일에서만 노출).
- 푸시 상세의 동적 세그먼트 이름만 `notificationId`, 나머지는 `id`.

---

## 1. 목록 - 공통 구조 (알림톡·브랜드메시지·SMS·이메일)

네 채널은 같은 레이아웃 컴포넌트를 쓴다. 푸시는 별도 구현(2장).

### 1.1 헤더
- 좌측 제목: `common:sentHistory` = "보낸 메시지"
- 우측(왼→오):
  1. **발신 환경 드롭다운** (Select). 표시값 = 현재 소스 번역. 옵션 4개(순서 고정): "콘솔"(`console`) · "API"(`api`) · "테스트"(`testDevice`) · "시스템"(`system`). **"전체" 옵션 없음.** 선택된 항목에 선택 표시. 로딩 중에는 readonly(테두리 없는 텍스트로 표시, 클릭 무시).
  2. **검색 입력**: placeholder `sentHistory:search.placeholder` = "캠페인명, 제목, 내용, ID 검색", `maxLength=100`.
  3. **"검색" 버튼** (size xs): 로딩 중이거나 `입력값.trim() === 현재 검색어`이면 disabled.
- 검색 입력에 포커스된 상태에서 Enter(keyup) → 검색 실행.

### 1.2 URL 쿼리 & 상태
- `p` = 페이지(1부터), `s` = 발신 환경 이름(`console|api|testDevice|system`), `sk` = 검색어(`encodeURIComponent`).
- 진입 시 검증: `p`가 숫자가 아니거나 0/없음/500 초과, 또는 `s`가 목록에 없으면 → `router.push({ s: "console", p: 1 })`로 교체(검색어 버림). 즉 `/alimtalk/sent-history` 첫 진입은 `?s=console&p=1`로 리다이렉트.
- 기본 발신 환경 = `console`.
- 검색 실행: `trim` 후 현재 검색어와 같으면 아무것도 안 함. 다르면 `{ p: 1, s: 현재, sk: 새 검색어 }`로 push (빈 문자열이면 `sk` 제거 → 검색 해제).
- 드롭다운 선택: `{ s: 선택값, p: 1 }` (검색어는 **유지 안 됨** - `sk` 미포함).
- 페이지 변경: `{ p: n, s: 현재, sk: 현재 }`.
- 검색 입력값은 URL `sk`가 바뀔 때 동기화.

### 1.3 리스트 & 페이지네이션
- 페이지당 **10개** (`per: 10`), 페이지 번호 버튼 **5개** 노출, 최대 **500페이지**(전체 건수를 `min(total, 500*10)`으로 잘라 계산).
- 이전/다음 화살표만 있음(처음/마지막 버튼 숨김 `hideFirstLastPages`).
- 로딩 중: 기존 리스트 위에 원형 스피너 오버레이. 페이지네이션 옆에도 로딩 표시.
- **빈 상태**: 로딩이 끝났고 0건이면 리스트 영역 대신 회색 문서+돋보기 일러스트(93x90 SVG) + "데이터가 없습니다"(`common:noData`). 0건일 때 페이지네이션은 렌더되지만 내용 없음.
- 정렬 UI 없음(서버 기본 정렬, 최신순으로 추정).
- 무한 스크롤 아님(페이지네이션).

### 1.4 행(카드) 구성
가로 한 줄 카드. 왼→오:
1. **발신 환경 배지**: 텍스트 = 번역("콘솔"/"API"/"테스트"/"시스템"), 색 = console 보라(purple), api 초록(green), testDevice 노랑(yellow), system 파랑(blue1). 너비 83px.
2. **내용 블록** (채널별 1.5 참조): subtitle(1줄) / title(1줄) / body(기본 3줄, 일부 2줄) 말줄임.
3. **날짜**: 라벨 "발송 시간"(`common:table.sentAt`) + `yyyy.LL.dd HH:mm:ss`(로컬 시간). 값 없으면 "-".
4. **통계 테이블** (알림톡·브랜드메시지·SMS):
   - 1행 헤더: "전체 유저"(`allUsers`) | "발송 유저"(`sentUsers`)
   - 1행 값: `selected` | `sent`
   - 2행 헤더: "전환 유저"(`convertUsers`) | "ROAS"
   - 2행 값: `convertedUniqueUser` | `Number((roas*100).toFixed(2)) + "%"`
   - 숫자 표기: 1,000 미만 그대로, 이상은 축약(`1.23K`, `4.5M`, `1.2B`, 소수 2자리 버림). 1,000 이상 값에 마우스 올리면 툴팁으로 전체 숫자(`toLocaleString("ko-KR")`, 예 "12,345").
   - 이메일은 다른 통계(1.5.4).
5. **⋯ 버튼** (tertiary sm, 아이콘 `more_horiz`, aria "더 보기"): 클릭 시 팝오버 메뉴 토글. 메뉴 항목 1개: **"복제"**(`common:button.copy`) → `/{channel}/new-message?copyMessageId={id}` 이동. 바깥 클릭으로 닫힘. 이벤트 전파 차단(행 클릭 안 됨).
   - 보낸 메시지 목록에서는 상태 배지·예약 메뉴(상세 정보/수정/예약 취소/재시도)는 **렌더되지 않음** (status/sendAfter를 넘기지 않음).

- **행 클릭**: `/{channel}/sent-history/{id}`로 이동. Ctrl/⌘ 클릭 시 `window.open`(새 탭).

### 1.5 채널별 행 내용·데이터 매핑

#### 1.5.1 알림톡 (`GET /alimtalk`)
- 내용: `camp` = `campaignName`, `title` = `templateName`, `body` = `templateContent`
- 통계: total=`selected||0`, sent=`sent||0`, 전환=`convertedUniqueUser||0`, roas=`roas||0`

#### 1.5.2 브랜드메시지 (`GET /friendtalk`)
- 내용(body 최대 2줄): `subtitle` = 메시지 유형 번역(`kakao:{messageType}`: FI/FT "기본 텍스트형", FW "와이드 이미지형", FL "와이드 리스트형", FA "캐러셀 커머스형", FC "캐러셀 피드형"), `title` = `campaignName||""`, `body` = `text ?? items[0].title ?? ""`
- 통계: sent=`sent||0` 등 알림톡과 동일

#### 1.5.3 SMS (`GET /sms`)
- 내용: `title` = `campaignName||""`, `body` = `body`
- 발송 유저 = `sentSMS + sentLMS + sentMMS + max(pending, 0)`
- 나머지 동일

#### 1.5.4 이메일 (`GET /emails`)
- 내용(body 최대 2줄): `title` = `campaignName||""`, `body` = 이메일 `title`(제목)
- 통계 블록(테이블 대신 6칸 가로 나열, 각 칸 라벨/값):
  - "발송 시간" - `createdAt` 포맷
  - "발송"(`chart.sent`) - `delivered`
  - "실패"(`chart.failedTotal`) - `failed + aborted`
  - "읽음"(`email:stat.readTotal`) - `opened`
  - "전환"(`email:stat.convertedTotal`) - `converted`
  - "구매 총액"(`conversion.total`) - `purchaseAmount`를 통화 포맷(프로젝트 `purchaseConversionConfig.currency`가 있으면 `Intl.NumberFormat("en",{style:"currency"})`, 없으면 브라우저 언어 ko면 "₩", 아니면 "＄" + `toLocaleString("ko-KR")`)
- 행 클릭 → `/email/sent-history/{id}`, ⋯ → "복제" → `/email/new-message?copyMessageId={id}`

### 1.6 목록 API (GET)
| 채널 | 엔드포인트 | params |
|---|---|---|
| 알림톡 | `GET /alimtalk` | `senderSource`, `page`, `per=10`, `searchKeyword`(없으면 생략) |
| 브랜드메시지 | `GET /friendtalk` | 동일 |
| SMS | `GET /sms` | 동일 |
| 이메일 | `GET /emails` | `page`(기본 1), `senderSource`, `searchKeyword`, `per=10` |
- 응답: `{ data: [...], meta: { totalCount } }`. 실패 시 빈 배열·0건.

---

## 2. 목록 - 푸시 (`/push/sent-history`)

### 2.1 헤더
- 제목 "보낸 메시지"(`sentHistory:category`)
- 플랜이 BUSINESS 미만(EXPIRED/STARTER/TEAM/TEAM_YEAR)이면 제목 옆 업그레이드 배지: `sentHistory-help:help.upgrade` = "최근 {{value}}일 이내 내역만 조회 가능" (STARTER 30, TEAM 365, EXPIRED 0). 배지는 가격 페이지 링크(새 탭), hover 툴팁 "플랜 업그레이드 필요".
- 우측: **"CSV로 내보내기"** 버튼(tertiary, 아이콘 `download`) → CSV 내보내기 모달(2.6).

### 2.2 필터 영역
1. 검색 입력(placeholder "캠페인명, 제목, 내용, ID 검색", maxLength 100) + "검색" 버튼(**disabled 처리 없음**). Enter로도 실행.
   - 검색 실행 시: 검색어 동일하면 무시. 다르면 **기간을 최근 30일로 리셋**(오늘-30일 00:00:00 ~ 오늘 23:59:59) 후 `{gte, lte, sk}` 반영, `p=1`.
2. 라벨 행 3개:
   - **"기간"**(`common:period`): 날짜 범위 피커(2.3). 변경 시 `{gte, lte}` ISO 반영, 검색어 유지, `p=1`.
   - **"플랫폼"**(`common:platform`): 체크박스 2개 "웹 (전체)"(`web`) · "앱 (전체)"(`mobile`). 기본 둘 다 체크. 마지막 하나를 해제하려 하면 `window.alert("최소 하나 이상 선택해주세요.")`. 변경 시 `f=web,mobile` 형태, 검색어 유지, `p=1`.
   - **"발송 환경"**(`common:table.source`): 라디오 5개 "전체"(`all`) · "콘솔" · "API" · "테스트" · "시스템". 기본 **"콘솔"**. 변경 시 `s=`, 검색어 유지, `p=1`. 로딩 중 disabled.
- 로딩 중(readonly)에는 검색 입력 변경·필터 변경 무시.

### 2.3 날짜 범위 피커 (공용)
- 트리거: 캘린더 아이콘 + `yyyy-MM-dd - yyyy-MM-dd`. 클릭 시 팝오버.
- 팝오버: 인라인 달력(범위 선택, 미래 날짜 선택 불가, maxDate=오늘) / "기간설정" 프리셋 버튼 "오늘" · "어제" · "최근 7일" · "최근 30일" · "최근 90일" · "최근 1년" (현재 범위와 일치하는 프리셋 강조) / "날짜" 입력 2개(`yyyy-MM-dd` placeholder, 숫자만 입력되면 자동 하이픈, maxLength 10) "~" / 하단 "취소"(secondary xs) · "확인"(xs) / 맨 아래 브라우저 타임존 텍스트(예 `Asia/Seoul`).
- 오류 문구: "날짜 형식이 올바르지 않습니다", "시작일이 종료일보다 늦을 수 없습니다". 오류·미완성 입력이면 "확인" disabled.
- 보낸 메시지 푸시 목록에서는 플랜 기간 제한(`enablePlanDateRange`)을 켜지 않으므로 90일/1년 프리셋도 활성.

### 2.4 URL 쿼리
- `p`, `s`(`all|console|api|testDevice|system`), `f`(`web,mobile` 콤마), `gte`, `lte`(ISO), `sk`.
- 기본: `p=1`, `s=console`, `f=web,mobile`, `gte`=오늘-30일 00:00:00, `lte`=오늘 23:59:59.
- 검증 실패(`p` 비정상/500 초과, `s` 없음·비정상) → `{ s: "console", p: 1, f: 현재 }`로 push.

### 2.5 리스트
- `GET /notifications/search` params: `senderSource`(all이면 생략), `searchKeyword`, `platform`(`f`에 web만 → `web`, mobile만 → `mobile`, 둘 다 → 생략), `gte`, `lte`, `page`, `per=10`.
- 빈 상태: "데이터가 없습니다" 일러스트. **0건이면 페이지네이션 숨김.** 페이지네이션 규칙은 1.3과 동일(10개/5버튼/500페이지).
- 행 구성(왼→오):
  1. 발신 환경 배지
  2. 메시지: `campaignName`(있을 때) / `title`(있을 때) / `body`, 하단에 `url`이 있으면 링크 아이콘, `imageUrl`이 있으면 이미지 아이콘
  3. 메타 2줄: "발송 시간" + `createdAt` / "플랫폼" + 아이콘 나열(android, iOS, 웹 데스크탑, 웹 모바일 - 각각 `selectedXxx > 0` 또는 `targetPlatforms`에 포함 시)
  4. 통계 테이블:
     - 헤더 "발송"(`chart.sent`) | "클릭"(`chart.convert`) → 값 `sentTotal` | `convertedTotal (클릭률%)` (클릭률 = converted/sent, 소수 1자리 "12.3%")
     - 헤더 "전환"(`conversion`) | "구매 총액"(`conversion.total`) → 값 `conversionTotal (전환율%)`(분모 sentTotal) | 통화 포맷 `purchaseAmountTotal`
     - 전환·구매 총액은 **행이 화면에 들어올 때 지연 로드**: 500~2000ms 랜덤 지연 후 `GET /notifications/{id}/conversion-stats` (60초 캐시). 로딩 중 스켈레톤(높이 22).
  5. ⋯ → "복제" → `/push/new-message?copyMessageId={id}`
- 행 클릭 → `/push/sent-history/{id}` (Ctrl/⌘ 새 탭).

### 2.6 CSV 내보내기 모달
- 제목 "CSV 다운로드"
- 정보 2행: "기간" `yyyy-MM-dd ~ yyyy-MM-dd`(현재 필터 기간) / "데이터" `보낸 메시지(콘솔)` 형식(`{category}({발송환경 번역})`)
- "다운로드 사유 입력" 라벨 + textarea(placeholder "다운로드 사유를 입력해 주세요.")
- 버튼: "취소"(secondary) / "다운로드"(사유 공백이면 disabled, 진행 중 로딩)
- 확인 시 `POST /notifications/search/export` `{reason, senderSource, searchKeyword, platform, gte, lte, timeZone, page:1, per:5000}` → 응답 `data.url` 다운로드 → 토스트 "파일 다운로드에 성공했습니다." → 모달 닫힘. (프로토타입은 mock)
- ESC로 닫힘.

---

## 3. 상세 - 공통 패턴

### 3.1 헤더
- 좌측 뒤로가기 화살표(‹) → 해당 채널 목록 경로(쿼리 없이: `/push/sent-history`, `/alimtalk/sent-history`, `/friendtalk/sent-history`, `/sms/sent-history`, `/email/sent-history`). 목록 진입 시 1.2/2.4 규칙대로 기본 쿼리로 리다이렉트됨.
- 제목: "보낸 메시지 상세" (푸시/이메일 `sentHistory:detailPagecategory`, 카카오 `kakao:detail`, SMS `sms:detail` - 모두 같은 문자열)
- 제목 오른쪽 **"메시지 복제"** 버튼(secondary xs, 아이콘 `content_copy`) → `/{channel}/new-message?copyMessageId={id}`.
- 보낸 메시지 상세에는 **취소/수정/삭제 버튼 없음**(예약 상세 전용). 예약 취소 확인 모달("예약을 취소하시겠습니까?" / "취소된 예약은 복구할 수 없습니다.")도 보낸 메시지에서는 열릴 경로 없음.

### 3.2 레이아웃
- 두 영역: `data-detail-section="content"`(정보·메시지·대상) / `data-detail-section="stats"`(분석).
- 첫 로딩(데이터 없음 + 로딩 중): 화면 전체 반투명(opacity 0.4) 오버레이 + 원형 스피너.

### 3.3 정보 섹션 공통 행
- "ID" - URL의 id
- "캠페인 명"(`common:campaignName`) - `campaignName`이 있을 때만 (이메일은 항상 행 표시)
- 같은 행에 2칸: **"발송 시간"**(`table.sentAt`) = `createdAt`을 `yyyy.LL.dd HH:mm:ss` + 공백 + 브라우저 타임존 이름(예 `2026.10.08 14:03:21 Asia/Seoul`) / **"발송 환경"** = 큰 배지(96px)
- **"발송 빈도 제한 무시"**(`ignoredCapping`) = "TRUE"/"FALSE": 응답에 `ignoreFrequencyCapping`이 존재하고, (프로젝트에서 해당 채널 빈도 제한이 활성이거나 값이 true)일 때만 표시.

### 3.4 대상(“유형 & 대상”) 섹션 공통 (`targetType`별)
- `segment`: "포함"(`include`) 라벨 아래 세그먼트 그룹. 그룹 내 세그먼트 칩 사이 "그리고"(AND), 그룹 사이 "또는"(OR). 각 칩: "세그먼트" 라벨 + 이름(+ 기본 세그먼트면 아이콘). 기본(`type==="DEFAULT"`)이 아닌 칩은 클릭 시 화살표 회전하며 필터 조건 펼침/접힘. 제외 세그먼트가 있으면 "제외"(`exclude`) 블록 추가.
  - 보낸 메시지에서는 `targetSnapshots`/`excludeTargetSnapshots`(발송 시점 스냅샷)가 있으면 그것을 사용, 없으면 `segmentIds`로 `GET /segments?targetType=User`(푸시는 `Device`) 결과에서 찾아 표시.
- `csv` / `xlsx` (또는 `userId` + `targetCsvKey`): 라벨 "파일 업로드"(`button.csv`) 또는 "유저 ID" + 파일명 링크 버튼(아이콘 `description`) → 클릭 시 CSV 사유 모달(3.7) → `POST /download-csv {targetCsvKey, reason}`(blob).
- `userId` / `device` / `phoneNumber` / `email`: 라벨 "유저 ID"/"기기"/"전화번호"/"이메일" + `targetIds` 줄바꿈 목록.

### 3.5 발송 통계 카드 (알림톡·브랜드메시지·SMS 공용)
- 섹션 제목: "분석"(`statistics`)
- 카드 제목: 아이콘 + **"발송 통계"**(`common:sentStatistics`)
- 좌측 **도넛 차트**(Chart.js Doughnut, 범례 숨김, 툴팁 색상칩 없음·값만, 총합 0이면 회색 `#ddd` 단일 조각 + 툴팁 "-") + 우측 범례 목록:
  | 항목 | 라벨 | 값 | 색 |
  |---|---|---|---|
  | sent | "발송" | `sent` | `#BFDBFE` |
  | waiting | "대기" | `selected - sent - (failed+aborted)` | `#feda82` |
  | capped | "제한됨" | `capped` | `#FEB169` |
  | unsubscribed | "수신거부" | `unsubscribed` | `#ff786e` |
  | failedTotal | "실패" | `(failed+aborted) - capped - unsubscribed` | `#4B5563` |
  - **알림톡·브랜드메시지는 "수신거부" 항목을 도넛·범례·총합에서 제외**, SMS는 포함(`isSms`).
  - 범례 각 행: 색 점 + `값(toLocaleString)` + ` (비율%)`(소수 1자리) / 라벨. "실패" 행은 값 > 0일 때 라벨 옆 **"자세히 보기"**(tertiary xs) → 실패 상세 모달(3.6).
- 우측 지표 열:
  - **"발송"** = `sent` (toLocaleString). `sent > 0`이고 발송 대상 CSV가 내보내기 가능할 때 다운로드 아이콘 버튼(secondary xs, aria "다운로드").
    - 가능 조건: `segmentTargetCsvKey`가 있고 `createdAt` 후 30일 이내(보낸 메시지). 클릭 → 사유 모달(3.7) → `POST /{alimtalk|friendtalk|sms}/{id}/segment-target-csv {reason}` → 응답 `data.url` 다운로드.
  - 브랜드메시지에서 `friendSent`/`nonFriendSent`가 숫자면 하위 2행 "친구" · "비친구".
  - **"발송 비용"**(`sendCost`) = 통화 포맷(알림톡·브랜드메시지 `usedPoints`, SMS `usedPointsTotal`).
- 그 아래 전환 이벤트 카드(3.8) - `conversionConfigs`와 상세 데이터가 모두 있고 길이 > 0일 때만.

### 3.6 실패 상세 통계 모달 (공용, 폭 600px)
- 헤더: **"실패 상세 통계"**(`failureModal.title`) + 새로고침 아이콘 버튼(aria "새로고침") + 닫기 X.
- 열 때 데이터 로드, 새로고침 버튼은 열람/새로고침 후 **30초간 disabled**. 데이터 30초 캐시.
- 본문: 실패 코드별 행 `라벨 | 값(toLocaleString)` (응답 `{코드: 숫자}`를 그대로 나열, 라벨은 `{ns}:fail.{코드}`). 이메일만 값 뒤 `(비율%)`.
- 마지막 행(강조색): **"총합"**(`fail.total`) + 합계 + 다운로드 아이콘 버튼 → 사유 모달 → 실패 대상 CSV.
- 로딩 중 원형 스피너.
- 채널별 실패 코드 라벨:
  - 푸시(`sentHistory`): PROVIDER_REJECTED "프로바이더 거부 (FCM/APNs/브라우저 서버)", DEVICE_NOT_FOUND "발송 가능한 기기 없음", LIQUID_ABORTED "개인화 문법 중단 ({% abort_message%})", ETC "기타"
  - 알림톡·브랜드메시지(`kakao`): RECEIVING_BLOCKED "채널 차단, 채널 발송 불가", UNABLE_TO_SEND "카카오톡 유저가 아님, 버전 미지원, 휴면 유저", INVALID_PARAMETER "잘못된 값(전화번호 오류/메시지 내용, 설정 오류)", UNSUBSCRIBED "수신거부", UNSUPPORTED_COUNTRY "지원하지 않는 국가", INSUFFICIENT_POINTS "잔여 포인트 부족", FREQUENCY_CAPPED "발송 제한 초과", LIQUID_ABORTED "개인화 문법 중단 ({% abort_message%})", ZERO_TARGET "발송 가능한 대상 없음", ETC "단말기 비활성, 단말기 네트워크 오류 등"
  - SMS(`sms`): UNABLE_TO_SEND "없는 번호, 단말기 서비스 정지(요금 미납 등)", SEND_TIMEOUT "단말기 미응답 (전원 종료, 비행기 모드, 음영 지역 등)", INVALID_PARAMETER "잘못된 전화번호 형식", UNSUBSCRIBED "수신거부", UNSUPPORTED_COUNTRY "지원하지 않는 국가", INSUFFICIENT_POINTS "잔여 포인트 부족", FREQUENCY_CAPPED "발송 제한 초과", LIQUID_ABORTED, ZERO_TARGET "발송 가능한 대상 없음", ETC "통신사 차단, 단말기 네트워크 오류 등"
  - 이메일(`email`, 클라이언트 계산): SOFT_BOUNCED "임시 반송"=`softBounced`, HARD_BOUNCED "영구 반송"=`hardBounced`, QUOTA_EXCEEDED "발송 제한 초과"=`quotaExceeded||0`, DELIVERED_FAILED "발송 실패"=`failed-(soft+hard+quota)`, ETC "기타"=`aborted`

### 3.7 CSV 다운로드 사유 모달 (상세의 모든 다운로드 공통)
- 제목 "CSV 다운로드", "다운로드 사유 입력" + textarea("다운로드 사유를 입력해 주세요."), 버튼 "취소" / "다운로드"(사유 비면 disabled). 기간·데이터 행 없음.
- 확인 → 다운로드 함수 실행 → 끝나면 모달 닫힘. 성공 토스트 없음(파일 다운로드만), 오류는 API 메시지 토스트.

### 3.8 전환 이벤트 카드 (공용)
- 카드 제목: 아이콘 + **"전환 이벤트"**(`conversionConfigs`)
- 표 헤더(6열): "이벤트 명" · "필터" · "측정 기준" · "기여 기간" · "전환" · "구매 총액"
- 행(전환 설정별):
  - 이벤트 명 = `eventType` (+ 프로젝트 구매 이벤트와 같으면 "구매" 배지)
  - 필터 = 하위조건 `eventDataKey {연산자번역} value` 칩(말줄임, hover 툴팁), 없으면 "-" (연산자 예 EQ "=", CONTAINS "포함")
  - 측정 기준 = "발송 기반"(SEND) / "클릭 기반"(CLICK) (설정값 없으면 채널 기본: 푸시·이메일 CLICK, 알림톡·브랜드메시지·SMS SEND)
  - 기여 기간 = `attributionWindowHours`가 24의 배수면 "{n} 일", 아니면 "{n} 시간"
  - 전환 = `conversionTotal(toLocaleString)` + `(전환율%)`(분모 `candidateTotal`), 전환 > 0이면 다운로드 아이콘 → 사유 모달 → `POST /conversions/target-csv {serviceType, id, conversionConfigId, timeZone, reason}` 후 `GET /conversions/target-csv?...` 폴링으로 URL 받아 다운로드
  - 구매 총액 = 구매 이벤트면 통화 포맷, 아니면 "-"
- 푸시 "플랫폼별 통계"의 전환 표는 3열(이벤트 명 · 전환 · 구매 총액).

### 3.9 자동 갱신
- 푸시·알림톡·브랜드메시지·SMS 상세: 진입 시 1회 + **10초마다**(`setInterval 10000`) 상세 GET 재호출(조용히 갱신). 이탈 시 해제.
- 이메일 상세: 진입 시 1회만.

---

## 4. 상세 - 채널별

### 4.1 푸시 (`/push/sent-history/[notificationId]`)
- API: `GET /notifications/{id}`(10초 폴링) + `GET /notifications/{id}/conversion-details`(최초 1회)
- 섹션 "발송 정보"(`sentHistory:information`):
  - ID / 캠페인 명 / 발송 시간 · **발송 환경 + 도움말 아이콘**(hover "메시지가 발송된 환경입니다.")
  - **"알림 만료 기간"**(`ttl`, `ttl`이 있을 때): `ttlDate`가 있으면 `yyyy.LL.dd HH:mm:ss 까지`, 아니면 `ttl/60`분을 "{n} 일"/"{n} 시간"/"{n} 분"(1440·60 배수 기준)
  - 발송 빈도 제한 무시(채널 PUSH)
  - **"발송 속도"**(`rateLimitPerMinute` 있을 때) = "분당 {{n}}개 메시지 발송"
  - **"무작위 일부 발송"**(`newMessage:targetSelectRate`, `targetSelectionRate`가 숫자일 때) = `rate*100` + "%"
- 섹션 "메시지": 라벨/값 목록 - "제목", "내용", "URL", "이미지"(URL 텍스트, hover 시 이미지 미리보기 팝오버), "버튼"(있을 때 `label(link)` 줄 목록), "데이터"(있을 때 `JSON.stringify(data, null, 4)` 코드블록). **휴대폰 미리보기 없음**(보낸 메시지 상세에는 preview 미전달).
- 섹션 "유형 & 대상": `targetPlatforms`가 있으면 "플랫폼" 행 = android, ios, webDesktop, webMobile 순 정렬 후 "앱(안드로이드), 앱(iOS), 웹(데스크탑), 웹(모바일)" 콤마 연결. `targetType==="userIdCsvUrl"`이면 "CSV" + `targetIds[0]`, 그 외 3.4 (기기 세그먼트 기준).
- 섹션 "분석":
  - **카드 "전체 통계"**(`stat.all`):
    - 지표 2개: **"발송"**(`sentHistory:sent`, 색 `#43a8a3`, 도움말 "성공적으로 발송된 기기 수입니다.") = `sentTotal`, sent > 0 && 내보내기 가능하면 다운로드 아이콘(조건: `segmentTargetCsvKey` 또는 `csvTargetCsvKey` + 30일 이내 → `POST /notifications/{id}/target-csv`) / **"클릭"**(`sentHistory:converted`, 색 `#55c7c1`, 도움말 "알림을 직접 클릭한 기기 수입니다.") = `convertedTotal` + `(클릭률%)`, 클릭 > 0이면 다운로드 아이콘(항상 가능 → `POST /notifications/{id}/user-stats {reason, timeZone}`)
    - 플랫폼 도넛 2개(발송 분포 / 클릭 분포), 색 android `#225DB5`, ios `#3487E9`, webDesktop `#F471A0`, webMobile `#FBB2A2`; 각 도넛 옆 범례 `값 (비율%)` / 플랫폼명
    - 상태 행 4개: "대기"(`#feda82`, 도움말 "발송 대기중인 기기 수입니다.") · "삭제"(`#ff786e`) · "제한됨"(`#ffbb6e`, 도움말 HTML "발송 빈도 제한 설정으로 인해 발송되지 않은 기기 수입니다." - 앞부분 링크 docs.flarelane.co.kr/frequency-capping) · "실패"(`#5c5c5c`, 값 = failed+aborted, > 0이면 "자세히 보기" → 실패 모달, 데이터 `GET /notifications/{id}/failure`)
    - 가로 누적 막대: 발송(안에 클릭 비율 진한 막대 겹침) / 대기 / 제한됨 / 삭제 / 실패 비율. 아래 라벨(0이 아닌 것만): "발송 (+클릭)"(클릭 있으면) · "대기" · "제한됨" · "삭제" · "실패"
    - 전환 이벤트 표(전체, 6열)
  - **카드 "플랫폼별 통계"**(`stat.platform`): 4개 블록(앱(안드로이드)/앱(iOS)/웹(데스크탑)/웹(모바일), 각 아이콘): 발송·클릭(클릭률) 지표, 누적 막대, 상태 4행(도움말·자세히 보기 없음), 플랫폼별 전환 표(3열)
  - 실패 CSV(모달 총합 다운로드): 파일 내보내기 잡 `POST /file-exports {type:"PUSH_FAILURE_CSV", payload:{scope:"campaign", scopeId:id, timeZone, createdAt}, reason}` → `GET /file-exports/{id}` 폴링

### 4.2 알림톡 (`/alimtalk/sent-history/[id]`)
- API: `GET /alimtalk/{id}`(10초 폴링, `data.data` 자체가 메시지, `conversionEventDetailsByPlatform.total` 사용), `GET /alimtalk-template/category`(카테고리명 표시용), 실패 `GET /alimtalk/{id}/failure`
- 섹션 "정보": 공통 행(3.3), 빈도 제한 채널 `KAKAO_ALIMTALK`
- 섹션 "메시지" (좌: 폼, 우: 미리보기)
  - "카테고리": 칩 2개(그룹명 진한 칩 / 카테고리명 연한 칩)
  - "템플릿 이름" `templateName`, "템플릿 코드" `templateCode`
  - readonly 템플릿 폼: "메시지 유형"(BA "기본형" / EX "부가 정보형" / AD "채널 추가형" / MI "복합형"), "강조유형"(NONE "기본형" / TEXT "강조 표기형" / IMAGE "이미지형" / ITEM_LIST "아이템 리스트형"), "제목"/"부제목"(강조 표기형), "내용", "부가 정보", "안내 멘트", "버튼", "이미지", "보안 템플릿" 등 (값은 `templateContent`, `templateTitle`, `templateSubtitle`, `templateExtra`, `buttons`, `templateImageUrl`, `securityFlag`, `templateHeader`, `templateItem`, `templateItemHighlight`)
  - **"개인화 변수 설정"**: `interpolations` 객체의 `키: 값` readonly 입력 목록
  - 우측 **"미리보기"**: 카카오톡 채팅 목업(`/images/KakaoMockupBackground.svg`, 채널 프로필 `KakaoUser.svg`, 배지 `KakaoBadgeLogo.svg`) 안에 알림톡 말풍선
- 섹션 "유형 & 대상": 3.4 (유저 세그먼트)
- 섹션 "분석": 3.5(수신거부 제외) + 3.8. 실패 CSV: `POST /alimtalk/{id}/failure-target-csv {reason, timeZone}`

### 4.3 브랜드메시지 (`/friendtalk/sent-history/[id]`)
- API: `GET /friendtalk/{id}`(10초 폴링), 실패 `GET /friendtalk/{id}/failure`
- 섹션 "정보": 공통 행, 빈도 제한 채널 `KAKAO_BRAND_MESSAGE`
- 섹션 "메시지": readonly 작성 폼(메시지 유형 `messageType` 기본 FW, `header` "타이틀", `text` "내용", `buttons` "버튼", `image` "이미지"/"이미지 링크", `items` 리스트 항목 "리스트 항목 {{n}}", 광고 여부, 성인 콘텐츠, 푸시 알림 여부, 캐러셀(`carousel.head/list/tail`))
  - 우측 "미리보기": FA/FC면 캐러셀 목업(`KakaoCarouselMockupBackground.svg`, 좌우 슬라이드, 더보기 `KakaoCarouselMore.svg`), 그 외 단일 말풍선 목업. 광고면 "(광고)", 발신 프로필 "발신 프로필". 폼과 미리보기의 캐러셀 선택 인덱스 공유.
  - `targeting`이 M 또는 N이면 브랜드메시지 모드(수신거부 문구 "무료수신거부 {{serviceNumber}}" 등)
- 섹션 "유형 & 대상": `targeting`이 있으면 **"수신자 타겟팅"** 행 = "선택한 유저 전체에게 발송 (M)" / "선택한 유저 중 채널친구를 제외하고 발송 (N)" / "선택한 유저 중 채널친구에게 발송 (I)", 그 아래 3.4
- 섹션 "분석": 3.5(수신거부 제외, 친구/비친구 표시 가능) + 3.8. 실패 CSV `POST /friendtalk/{id}/failure-target-csv`

### 4.4 SMS (`/sms/sent-history/[id]`)
- API: `GET /sms/{id}`(10초 폴링), 실패 `GET /sms/{id}/failure`
- 섹션 "정보": 공통 행, 빈도 제한 채널 `SMS`
- 섹션 "메시지":
  - 좌 readonly 폼: **"광고성 메시지"** 토글(`isAdvertisement`), **"제목"**(type이 SMS가 아닐 때만, `title`), **"내용"** + 유형 배지 "SMS"/"LMS"/"MMS"(`type`, 기본 SMS), **"이미지"**: 첨부(`files[0]`) 있으면 "업로드됨" 텍스트, hover 시 이미지 팝오버. 바이트 카운터는 readonly라 숨김.
  - 우 "미리보기": 휴대폰 목업(`/images/SMSMockupBackground.svg`, 320x382) - 이미지(있으면) / 제목(제목이 있거나 type≠SMS면 표시, 없으면 "제목없음") / 본문 `"[Web발신]\n" + body` (보낸 메시지에서는 광고 문구·수신거부 번호 자동 추가 안 함)
- 섹션 "유형 & 대상": 3.4
- 섹션 "분석": 3.5(**수신거부 포함**) - 발송 = `sentSMS+sentLMS+sentMMS+max(pending,0)`, 발송 비용 = `usedPointsTotal`. 실패 CSV `POST /sms/{id}/failure-target-csv`

### 4.5 이메일 (`/email/sent-history/[id]`)
- API: `GET /emails/{id}` 1회 (폴링 없음). 데이터 오기 전에는 정보 영역에 로딩 스피너.
- 헤더: 3.1과 동일("보낸 메시지 상세" + "메시지 복제")
- 섹션 "정보"(`common:table.information`): ID / 캠페인 명(항상 행) / 발송 시간(두 줄 div: `시간 + 타임존`) · 발송 환경 / 빈도 제한(채널 `EMAIL`)
- 섹션 "메시지":
  - **"발신자 정보"** readonly 드롭다운(`senderEmail`, 확인된 발신 이메일 없으면 "(확인된 발신자 이메일 없음)")
  - **"이메일 제목"** readonly 입력(`title`)
  - 본문: HTML에서 태그 제거한 텍스트 앞 200자 + **"미리보기"**(secondary sm) 버튼 → 모달 "이메일 미리보기" + 제목, 데스크톱/모바일 토글 아이콘 2개, iframe(`srcDoc=body`, sandbox) 렌더. 본문이 비면 이 블록 숨김. readonly라 "편집" 버튼 없음.
- 섹션 "유형 & 대상": 3.4
- 섹션 "분석"(`common:analytics`): 보낸 메시지에서는 기간 피커 없음
  - 카드 "전체 통계": 도넛(수신거부 포함) - 발송 `delivered`, 대기 `pending`, 제한됨 `capped`, 수신거부 `unsubscribed`, 실패 `failed+aborted`(> 0이면 "자세히 보기")
  - 지표: **"발송"** = `delivered`(> 0 && 내보내기 가능 시 다운로드 → `POST /emails/{id}/target-csv`; 조건 `segmentTargetCsvKey`/`csvTargetCsvKey` + 30일 이내) / **"읽음"** = `opened` + `(읽음률%)`(분모 delivered), > 0이면 다운로드(→ `POST /emails/{id}/read-target-csv` 후 `GET /emails/{id}/read-target-csv?timeZone=` 폴링)
  - **발송 비용 없음**
  - 전환 이벤트(`conversionEventDetailsByPlatform.total`)
  - 실패 모달은 비율 표시, 총합 다운로드 `POST /emails/{id}/failure-target-csv`

---

## 5. 공통 vs 채널별 차이

| 항목 | 푸시 | 알림톡 | 브랜드메시지 | SMS | 이메일 |
|---|---|---|---|---|---|
| 목록 필터 | 검색 + 기간 + 플랫폼(웹/앱) + 발송환경 라디오(전체 포함) | 발신환경 드롭다운 + 검색 | 동일 | 동일 | 동일 |
| 기본 발송환경 | console | console | console | console | console |
| "전체" 발송환경 | 있음 | 없음 | 없음 | 없음 | 없음 |
| 기간 필터 | 기본 최근 30일 | 없음 | 없음 | 없음 | 없음 |
| CSV 내보내기(목록) | 있음 | 없음 | 없음 | 없음 | 없음 |
| 플랜 업그레이드 배지 | BUSINESS 미만 | 없음 | 없음 | 없음 | 없음 |
| 0건일 때 페이지네이션 | 숨김 | 빈 렌더 | 빈 렌더 | 빈 렌더 | 빈 렌더 |
| 행 내용 | 캠페인/제목/본문/URL·이미지 아이콘 + 플랫폼 아이콘 | 캠페인/템플릿명/템플릿 내용 | 유형/캠페인/텍스트(2줄) | 캠페인/본문 | 캠페인/이메일 제목(2줄) |
| 행 통계 | 발송·클릭(률)·전환(률)·구매 총액(지연 로드) | 전체/발송/전환 유저·ROAS | 동일 | 동일(발송=SMS+LMS+MMS+대기) | 발송·실패·읽음·전환·구매 총액 |
| ⋯ 메뉴 | 복제 | 복제 | 복제 | 복제 | 복제 |
| 상세 정보 섹션 제목 | 발송 정보 | 정보 | 정보 | 정보 | 정보 |
| 상세 추가 정보 | 발송환경 도움말, 알림 만료 기간, 발송 속도, 무작위 일부 발송 | - | - | - | - |
| 메시지 미리보기 | 없음(라벨/값 목록) | 카카오 목업 | 카카오/캐러셀 목업 | 휴대폰 목업 | 미리보기 모달(iframe) |
| 대상 추가 행 | 플랫폼 | - | 수신자 타겟팅 | - | - |
| 통계 카드 | 전체 통계 + 플랫폼별 통계 | 발송 통계 | 발송 통계(+친구/비친구) | 발송 통계 | 전체 통계 |
| 도넛 수신거부 | 해당 없음(막대) | 제외 | 제외 | 포함 | 포함 |
| 발송 비용 | 없음 | usedPoints | usedPoints | usedPointsTotal | 없음 |
| 클릭/읽음 다운로드 | 클릭(user-stats) | - | - | - | 읽음 |
| 실패 모달 비율 | 없음 | 없음 | 없음 | 없음 | 있음 |
| 폴링 | 10초 | 10초 | 10초 | 10초 | 없음 |

---

## 6. 프로토타입 mock용 GET 엔드포인트 정리

| 화면 | 메서드·경로 | 비고 |
|---|---|---|
| 공통 | `GET /projects/{projectId}` | projectDetail(`purchaseConversionConfig.currency/eventType`, `frequencyCappingConfig`, `smsSenderName`, 플랜) |
| 푸시 목록 | `GET /notifications/search?senderSource&searchKeyword&platform&gte&lte&page&per=10` | `{data, meta.totalCount}` |
| 푸시 목록 행 | `GET /notifications/{id}/conversion-stats` | `{conversionTotal, purchaseAmountTotal, candidateTotal}` |
| 알림톡 목록 | `GET /alimtalk?senderSource&page&per=10&searchKeyword` | |
| 브랜드메시지 목록 | `GET /friendtalk?…` | |
| SMS 목록 | `GET /sms?…` | |
| 이메일 목록 | `GET /emails?page&senderSource&searchKeyword&per=10` | |
| 푸시 상세 | `GET /notifications/{id}` / `GET /notifications/{id}/conversion-details` / `GET /notifications/{id}/failure` | conversion-details는 `{total:[…], android:[…], ios:[…], webDesktop:[…], webMobile:[…]}` |
| 알림톡 상세 | `GET /alimtalk/{id}` / `GET /alimtalk/{id}/failure` / `GET /alimtalk-template/category` | |
| 브랜드메시지 상세 | `GET /friendtalk/{id}` / `GET /friendtalk/{id}/failure` | |
| SMS 상세 | `GET /sms/{id}` / `GET /sms/{id}/failure` | |
| 이메일 상세 | `GET /emails/{id}` | 발신 이메일 옵션은 별도 훅에서 조회(엔드포인트 미확인) |
| 대상 | `GET /segments?targetType=User` (푸시 `Device`) | 스냅샷 없을 때만 |
| 다운로드 폴링 | `GET /file-exports/{id}`, `GET /emails/{id}/read-target-csv`, `GET /conversions/target-csv` | 생성은 POST(프로토타입은 mock) |

### 주요 응답 필드 (화면에서 실제로 읽는 것)
- 푸시 목록 행: `id, senderSource, campaignName, title, body, url, imageUrl, createdAt, selectedAndroid/Ios/WebDesktop/WebMobile, targetPlatforms, sentTotal, convertedTotal`
- 푸시 상세: 위 + `ttl, ttlDate, rateLimitPerMinute, targetSelectionRate, buttons[{label,link}], data, targetType, targetIds, targetCsvKey, segmentIds, excludeSegmentIds, targetSnapshots, excludeTargetSnapshots, segmentTargetCsvKey, csvTargetCsvKey, ignoreFrequencyCapping, conversionConfigs`, 플랫폼별 `{sent|converted|remaining|failed|aborted|uninstalled|capped}{Total|Android|Ios|WebDesktop|WebMobile}`
- 카카오/SMS 목록: `id, senderSource, campaignName, createdAt, selected, sent, convertedUniqueUser, roas` + 알림톡 `templateName, templateContent` / 브랜드 `messageType, text, items[0].title` / SMS `body, sentSMS, sentLMS, sentMMS, pending`
- 카카오/SMS 상세: `selected, sent, capped, unsubscribed, failed, aborted, usedPoints(SMS usedPointsTotal), friendSent, nonFriendSent, conversionConfigs, conversionEventDetailsByPlatform.total[{eventType, conversionConfigId, candidateTotal, conversionTotal, purchaseAmountTotal}]` + 채널별 메시지 필드(4장)
- 이메일 목록: `id, title, createdAt, delivered, failed, aborted, opened, converted, purchaseAmount, senderSource, campaignName`
- 이메일 상세: `delivered, pending, capped, unsubscribed, failed, aborted, opened, softBounced, hardBounced, quotaExceeded, senderEmail, title, body, conversionEventDetailsByPlatform, conversionConfigs, …`

---

## 7. 확인하지 못한 것
- 실제 응답 샘플(호출 금지) - 필드는 프런트 코드가 읽는 이름 기준.
- 서버 정렬 기준(목록 정렬 파라미터를 보내지 않음).
- 알림톡 템플릿 폼·브랜드메시지 작성 폼·카카오 목업의 세부 픽셀 레이아웃(읽기 전용 재사용 컴포넌트라 필드 구성만 정리).
- 이메일 발신자 이메일 옵션 조회 엔드포인트.
- 스타일 값(간격·폰트)은 styled-component CSS를 제외하고 읽어 미기재.
