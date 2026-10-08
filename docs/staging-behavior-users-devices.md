# 스테이징 콘솔 동작 명세 - 대상 (유저 · 기기 · 세그먼트 · 테스트 기기)

- 출처: `https://staging-console.flarelane.com` 공개 번들 JS(buildId `Q-tOYo7BMgpuoKSGYkmC0`, `/_next/static/<buildId>/_buildManifest.js`로 라우트·청크 확인) + `/locales/ko/{common,segment,segment-help,testDevice,device-help}.json` 정적 분석. 로그인·API 호출 없음 (2026-10-08).
- 문구는 「」 안에 ko 로케일 값을 그대로 옮김. `ns:key`는 번역 네임스페이스·키. `{{x}}`는 치환 값.
- API는 `https://staging-service-api.flarelane.com/v1/projects/{projectId}` 기준 상대 경로(axios 인터셉터가 `/projects/{currentProject.id}`를 붙임). 헤더 `Authorization: Bearer …`, `x-flarelane-lang: ko`.
- 이 영역 화면들에는 **요금제 배지/플랜 제한 코드가 없다**(plan·badge·upgrade 참조 없음). 카페24 연동 여부(`projectDetail.cafe24Id`)에 따라 쿠폰 관련 UI만 켜지고 꺼진다.

---

## 0. 라우트 · 사이드바

| 주소 | 화면 | 페이지 모듈 |
|---|---|---|
| `/all-users` | 전체 유저 | 55272 |
| `/user-segments` | 유저 세그먼트 목록 | 64801 (`isUserSegment`) |
| `/user-segments/new` | 새 유저 세그먼트 (복제 시 `?copySegmentId=`) | 15264 |
| `/user-segments/[segmentId]/edit` | 유저 세그먼트 수정 | 15264 |
| `/user-segments/[segmentId]/users` | 유저 세그먼트 상세 = 상세 카드 + 유저 목록 | **55272 재사용**(segmentId 있으면 상세 모드) |
| `/all-devices` | 전체 기기 | 29261 |
| `/segments` | 기기 세그먼트 목록 | 64801 |
| `/segments/new` | 새 기기 세그먼트 | 15264 |
| `/segments/[segmentId]/edit` | 기기 세그먼트 수정 | 15264 |
| `/segments/[segmentId]/devices` | 기기 세그먼트 상세 = 상세 카드 + 기기 목록 | 26910 |
| `/test-devices` | 테스트 기기 | 46790 |

- `/user-segments/[id]`, `/segments/[id]` 단독 페이지는 **없다**. 목록 행 클릭 시 `/users` · `/devices` 하위로 감.
- 사이드바(대상 그룹) 구조 - `common:audience`「대상」
  - 「유저」(`/users`) → 하위「세그먼트」`/user-segments`, 「전체 유저」`/all-users`
  - 「기기」(`/devices`) → 하위「세그먼트」`/segments`, 「테스트 기기」`/test-devices`, 「전체 기기」`/all-devices`
- 모든 페이지 `getServerSideProps` 있음(`__N_SSP`). 비로그인 GET은 307 → `/auth/login`.
- 레이아웃: `wide` 레이아웃(전체 유저·전체 기기·테스트 기기·세그먼트 상세), 흰 카드(padding 34px, radius 7px, 그림자 `0 2px 6px rgba(0,0,0,.05)`) 안에 제목 줄(heading4) + 본문.

---

## 1. 공통 컴포넌트 동작

### 1.1 테이블
- 헤더 행: caption 크기, gray400 글자, 흰 배경, 아래 gray200 선. 헤더 옆 도움말(?) 아이콘은 `helpTranslateKey`가 있는 열만(툴팁 = HTML).
- 로딩 중: 행 대신 가운데 스피너(기존 데이터 숨김).
- 빈 상태: 회색 문서+돋보기 일러스트(93×90) + 「데이터가 없습니다」(`common:noData`). 테스트 기기 추가 모달 안에서는 글자 없이 일러스트만.
- 행: paragraph1, 아래 gray200 선, hover 배경 gray50. `rowOnClick`이 있을 때만 pointer.
- 방금 추가/수정된 행(`added: true`)은 배경 `rgba(82,124,189,0.05)`로 강조(새로고침 전까지 유지).

### 1.2 페이지네이션
- 이전/다음 화살표만(처음/끝 숨김), 번호 버튼 **5개**, 최대 **500페이지**(전체 건수를 `min(total, 500*per)`로 잘라 계산). 0건이면 페이지네이션 자체를 렌더하지 않음. 로딩 중이면 옆에 로딩 표시.
- 페이지당: 유저 목록 **20** (`DN`), 기기 목록 **20** (`fu`).

### 1.3 날짜·숫자 포맷
- 일반 날짜: `yyyy.LL.dd HH:mm:ss`(로컬), 값 없으면 「-」.
- 상대 시간: date-fns `formatDistance(…, {addSuffix:true, locale: ko})` → 예 「약 3시간 전」, 「5분 전」.
- 세그먼트 인원 수(목록·추정치): 축약형. 1,000 미만 그대로, 이상은 소수 2자리 내림 + `K`/`M`/`B` (예 12,345 → 「12.34K」).
- 상세 카드 인원 수: `toLocaleString("ko-KR")` (예 「12,345」).

### 1.4 모달 공통
- 반투명 배경 + 가운데 흰 박스. 배경 클릭으로 닫힘(처리 중에는 막힘), ESC 닫힘.
- 확인형 모달 버튼: 왼쪽「취소」(secondary) / 오른쪽 확인 버튼(삭제는 destructive 빨강). 처리 중 확인 버튼 로딩 스피너.
- 토스트: 우상단, 성공(초록)/에러(빨강). 서버 오류 메시지 처리는 다른 화면 문서와 동일(별도 성공 토스트가 없는 액션은 조용히 끝남).

### 1.5 칩(Chip) · 툴팁
- 회색 작은 칩(paragraph2). 마우스 올리면 팝오버로 내용 표시. `copyable` 칩은 팝오버에 복사 가능. `onClick` 있는 칩은 hover 시 브랜드색 글자 + brand100 배경, pointer.

### 1.6 CSV 다운로드 사유 모달 (세그먼트 상세·필터의 CSV 파일)
- 제목 「CSV 다운로드」(`csvDownload.title`)
- 라벨 「다운로드 사유 입력」, textarea placeholder 「다운로드 사유를 입력해 주세요.」
- 버튼 「취소」 / 「다운로드」 - 사유가 공백뿐이면 disabled. 확인 시 `reason = trim()`.
- 세그먼트 대상 CSV(상세 카드 다운로드 아이콘):
  1. `POST /users/segment-target-csv` (유저) 또는 `POST /devices/segment-target-csv` (기기) 로 생성 요청. 유저 = `{segmentIds:[[id]], excludeSegmentIds, reason}`, 기기 = `{segmentIdsByConditions, excludeSegmentIdsByConditions, reason}`.
  2. 10초 간격 `GET` 같은 경로(params 동일, reason 제외) 폴링 → `status === "COMPLETED"` 이고 `url` 있으면 그 URL로 파일 다운로드 후 폴링 중단(최대 1000회).
  3. 이미 다른 대상 CSV가 진행 중이면 `window.alert`「이미 CSV 다운로드가 진행중입니다.」
  - 진행 중엔 다운로드 아이콘 버튼 로딩 표시. 완료 토스트 없음.

---

## 2. 전체 유저 `/all-users` (및 세그먼트 유저 `/user-segments/[id]/users`)

### 2.1 헤더
- 제목: 「전체 유저」(`common:allUsers`). segmentId가 있으면 「세그먼트 유저」(`segment:userPageCategory`).
- 오른쪽(왼→오):
  1. 검색 input, 너비 200px, placeholder **「User ID」**(영문 하드코딩). URL `sk`가 비어있지 않을 때만 input 오른쪽 안에 X(지우기) 아이콘 → 클릭 시 input 비우고 `{...query, p:1, sk:""}` push.
  2. 「검색」 버튼(size xs) → `{...query, p:1, sk: 입력값}` push (trim 안 함). **Enter 키 처리 없음**, 버튼만.
- 모바일: 제목 줄이 세로 배치, 검색창 좌측 여백 0.
- segmentId가 있으면 위에 **세그먼트 상세 카드**(5.4)가 먼저 나오고, 56px 간격 아래 유저 카드.

### 2.2 URL 쿼리
- `p` 페이지(기본 1, 숫자 검증·리다이렉트 **없음**), `sk` 검색어(유저 ID 정확 일치 검색), 라우트 `segmentId`.
- 쿼리/프로젝트가 바뀔 때마다 재조회.

### 2.3 데이터
- `POST /users` body `{page, per:20, segmentIds?:[[segmentId]], userIds?:[sk]}` → `data.data`(배열), `data.meta.totalCount`. 실패 시 빈 목록·0건.

### 2.4 테이블 열
| 헤더 | accessor | 너비 | 셀 |
|---|---|---|---|
| 「유저 ID」 | userId | 200 | 텍스트, 없으면「-」(블러 처리 클래스 `m_blur`) |
| 「이름」 | name | 180 | 텍스트/「-」(블러) |
| 「전화번호」 | phoneNumber | 180 | 텍스트/「-」(블러) |
| 「마지막 접속 시간」 | lastDeviceActivatedAt | 184, 가운데 | 상대 시간(「약 n시간 전」)/「-」 |
| 「태그」 | tags | 44, 가운데 | 칩 「태그」: hover 시 정렬된 JSON 팝오버, 클릭 시 태그 모달(행 클릭 전파 막음) |
| 「쿠폰」 | coupon | 66, 가운데 | **카페24 연동 프로젝트에만 열 존재.** 쿠폰 요약(쿠폰 없으면「-」), 칩 클릭 시 쿠폰 모달(쿠폰 있을 때만) |
| (빈 헤더) | more | flex, 오른쪽 | 「상세 정보」 버튼(tertiary sm) |

- **행 클릭 = 유저 상세 모달**(「상세 정보」 버튼과 동일).
- 쿠폰 셀 요약 한 줄: `쿠폰번호 · 「사용」/「미사용」(사용=브랜드색, 미사용=gray500) · yyyy.LL.dd ~ yyyy.LL.dd`.
- 페이지네이션 아래 55px 여백, 1.2 규칙.

### 2.5 태그 모달
- 제목 없음. 읽기 전용 JSON textarea(높이 500), 키 정렬 `JSON.stringify(tags, sortedKeys, 2)`. 닫기는 배경/ESC/X.

### 2.6 쿠폰 모달
- 제목 「쿠폰」(`segment:CAFE24_COUPONS`). 표 헤더 「쿠폰 번호」 「사용 여부」 「발급일」 「만료일」. 날짜 `yyyy.LL.dd HH:mm`. 사용 여부 「사용」(브랜드색)/「미사용」(gray500).

### 2.7 유저 상세 모달
- 열릴 때 `GET /users/{encodeURIComponent(userId)}` (404 무시) → 로딩 중 모달 위 로딩 오버레이. 본문 스크롤 시(>5px) 헤더 아래 그림자.
- 제목 「상세 정보」(heading4), 우상단 X(「닫기」).
- 섹션 「기본 정보」(paragraph1, gray500 소제목) - 2열 라벨/값 표:
  - 「유저 ID」 userId / 「국가/언어」 `country || "-"` + ` / ` + `language || "-"` / 「이름」 / 「전화번호」 / 「이메일」 / 「생일/시간대」 `dob || "-"` / `timeZone || "-"`
- 섹션 「상태 및 활동」:
  - 「문자 수신 거부」 smsUnsubscribedAt 상대 시간 또는「-」
  - 「생성 시간」 `yyyy.LL.dd HH:mm:ss (약 n일 전)`
  - 「최근 수정 시간」 동일 형식
  - 「마지막 접속 시간」 lastDeviceActivatedAt 있으면 `날짜 (상대)`, 없으면「-」
- 섹션 「태그」: 읽기 전용 JSON textarea(높이 300).
- 하단 「삭제」 버튼(secondary destructive, 휴지통 아이콘) → 확인 모달:
  - 제목 「유저를 삭제하시겠습니까?」, 본문 「삭제한 이후 해당 정보는 복구할 수 없습니다.」, 버튼 「취소」/「삭제」(빨강, 로딩).
  - 확인: `DELETE /users/{userId}` → 1초 뒤 해당 userId를 목록에서 숨김(메모리 Set) + 목록 재조회 + 모달 닫힘. **성공 토스트 없음.**

---

## 3. 전체 기기 `/all-devices` (및 세그먼트 기기 목록)

### 3.1 헤더
- 제목 「전체 기기」(`common:allDevices`). 세그먼트 상세에서는 「세그먼트 기기」(`segment:devicesPageCategory`).
- 오른쪽(왼→오):
  1. **검색 기준 드롭다운**(너비 120px): 옵션 「유저 ID」 / 「기기 ID」. 초기 표시값 「유저 ID」(내부 값 null → 유저 ID로 간주).
  2. 검색 input(200px, **placeholder 없음**). input에 글자가 있으면 X 아이콘 → 검색 초기화(기준·입력·검색어 모두 비우고 1페이지).
  3. 「검색」 버튼(xs). Enter 처리 없음.
- 검색 실행 규칙: 입력이 빈 문자열이면 초기화. (trim한 입력 = 현재 검색어 && 기준 동일)이면 같은 조건 재조회. 아니면 1페이지 + 기준 확정 + 검색어 저장.
- **URL 쿼리 없음**(페이지·검색 모두 컴포넌트 상태). 새로고침하면 1페이지 초기화.

### 3.2 데이터
- 전체 기기: `GET /devices/search?ignoreSubscribed=true` params `{page, per:20, userIds?:[q] | ids?:[q]}`.
- 세그먼트 기기: `GET /devices/search` params `{segmentIds:[segmentId], page, per:20, …}`.
- 응답 `data.data`(배열), `data.meta.totalCount`.

### 3.3 테이블 열 (전체 기기 · 세그먼트 기기)
| 헤더(도움말) | accessor | 너비 | 셀 |
|---|---|---|---|
| 「플랫폼」(?) | platform | 210 | 플랫폼 아이콘(ios/android/webDesktop/webMobile) + `deviceModel (osVersion)`; 웹은 아래 줄에 browser(paragraph3 gray500) |
| 「생성 시간」(?) | createdAt | 190, 오른쪽 | `yyyy.LL.dd HH:mm:ss` |
| 「마지막 접속 시간」(?) | lastActiveAt | 190, 오른쪽 | 동일 |
| 「유저 ID」(?) | userId | 200, 오른쪽 | 텍스트(블러), 없으면 빈칸 |
| 「테스트 기기」(?) | testDevice | 125, 가운데 | 체크 표시: 참=브랜드색, 거짓=gray200 |
| 「구독」(?) | subscribed | 140, 가운데 | 체크 표시(isSubscribed) |
| (빈) | meta | flex, min 150 | 칩 묶음: 「ID」(복사 가능) · 「태그」(hover JSON, 클릭 태그 모달) · 「앱」(appVersion 있을 때) · 「SDK」(sdkVersion 있을 때) · 「Locale」(국가/언어/시간대 중 하나라도 있을 때; 팝오버 `국가: KR` / `언어: ko`(하이픈 앞만) / `시간대: Asia/Seoul`) · 「쿠폰」(카페24 연동 시) |
| (빈) | menu | - | ⋯ 버튼(「더 보기」) |

- 도움말 문구(`device-help`): 플랫폼 「기기 모델명과 운영체제 버전을 나타냅니다.」 / 생성 「기기가 최초 생성된 시간입니다.」 / 마지막 접속 「기기가 마지막으로 접속한 시간입니다.」 / 유저 ID 「고객사가 관리하는 고유한 유저ID입니다. 자세한 내용은 고객 데이터 연동 가이드를 참고하세요.」(링크) / 테스트 기기 「사내 테스트 발송을 위한 테스트 기기 등록 여부를 나타냅니다.」(링크) / 구독 「기기가 현재 푸시 알림을 수신할 수 있는 상태입니다.」
- **행 클릭 동작 없음**(상세 모달·페이지 없음).

### 3.4 ⋯ 메뉴 (전체 기기)
- 테스트 기기가 아닌 행: 「테스트 기기 추가」 → **별명 설정 모달**(3.5) 열림.
- 테스트 기기인 행: 「테스트 기기 제거」(빨강) → 확인 없이 즉시 `PATCH /devices/{id}` `{isTest:false, testName:null}` → 토스트 「성공적으로 반영되었습니다.」, 행을 응답으로 교체 + `added` 강조. 처리 중 메뉴 항목 자리에 스피너.
- 메뉴 바깥 mousedown 시 닫힘.

### 3.5 별명 설정 모달 (테스트 기기 추가 / 별명 수정 공용)
- 제목 「테스트 기기 별명」(`testDevice:testName`)
- 라벨 「기기 ID」 + 기기 ID 텍스트(편집 불가)
- 라벨 「별명」 + input placeholder 「별명 입력」 (초기값 빈칸 - 기존 별명을 미리 채우지 않음)
- 버튼 「취소」 / 「확인」(로딩)
- 확인: `PATCH /devices/{id}` `{isTest:true, testName: 입력값 || null}` → 토스트 「성공적으로 반영되었습니다.」, 모달·메뉴 닫힘, 행 교체 + 강조. 별명 검증 없음(빈 값 허용).

---

## 4. 테스트 기기 `/test-devices`

### 4.1 헤더
- 제목 「테스트 기기」(`testDevice:category`), 오른쪽 「추가」 버튼(xs) → 추가 모달 토글. ESC로 닫힘.
- 검색 UI 없음. URL 쿼리 없음.

### 4.2 데이터
- `GET /devices/search` params `{isTest:true, ignoreSubscribed:true, page, per:20}`.

### 4.3 테이블 열
- 3.3과 같고 맨 앞에 「별명」(?, 150px, testName, 브랜드색 글자, 없으면 빈칸) 열 추가. 도움말 「테스트 기기를 식별하기 위한 별명입니다.」
- 열 순서: 별명 · 플랫폼(190) · 생성 시간 · 마지막 접속 시간 · 유저 ID · 테스트 기기 · 구독 · meta · menu.

### 4.4 ⋯ 메뉴
- 「별명 설정」(isTest 행에만) → 3.5 모달.
- 「테스트 기기 제거」(빨강) → 3.4와 동일 즉시 PATCH. 제거된 행은 목록에서 빠지지 않고 테스트 기기 체크가 꺼진 채 강조 표시(재조회 전까지).
- 코드에 기기 삭제 모달(「기기를 삭제하시겠습니까?」 / 「삭제된 기기는 복구할 수 없습니다.」, `DELETE /devices/{id}`, 토스트 「기기가 삭제되었습니다.」)이 있으나 **메뉴에 진입 항목이 없어 도달 불가**. 프로토타입에는 넣지 않는다.

### 4.5 테스트 기기 추가 모달
- 제목 「테스트 기기 추가」
- 검색 줄: 검색 기준 드롭다운(「유저 ID」 기본 / 「기기 ID」) + input(placeholder 없음) + 「검색」(xs, 로딩).
- 검색: 입력이 비면 무시. `GET /devices/search` params `{ignoreSubscribed:true, userIds:[trim] | ids:[trim]}` (page/per 없음).
- 결과 헤더(caption gray400): (체크 26px) · 「플랫폼」(150) · 「마지막 접속 시간」(150) · (칩).
- 결과 행: 체크박스 · 플랫폼(모델 + `(browser)`) · 마지막 접속 `yyyy.LL.dd HH:mm:ss` · 칩 「ID」(복사) / 「태그」(hover JSON). 행 클릭으로 선택 토글.
  - 이미 테스트 기기인 행: 체크된 채 disabled(배경 gray100, 글자 gray500, not-allowed).
  - 결과 없음: 일러스트만(글자 없음). 검색 전에도 같은 빈 상태.
- 버튼 「취소」 / 「추가」 - 선택 0개면 disabled.
- 추가: 선택한 ID마다 `PATCH /devices/{id}` `{isTest:true, testName:null}`(별명 입력칸 없음) → 응답 기기를 목록 맨 위에 `added` 강조로 삽입(중복 제거) → 토스트 「성공적으로 반영되었습니다.」 → 상태 초기화 후 닫힘.
- 모달이 닫히면 기준·입력·결과·선택 초기화.
- 로케일에 「해당 ID의 기기가 없습니다」 「이미 테스트로 등록된 기기입니다」 「{{data.id}}({{data.platform}})를 찾았습니다」 「기기 ID」(placeholder) 키가 있으나 현재 코드에서 **사용 안 함**.

---

## 5. 세그먼트 목록 `/user-segments` · `/segments`

### 5.1 헤더
- 제목 「세그먼트」(`segment:userCategory` / `category`) + 도움말(?) 「세그먼트를 사용하면 다양한 기준으로 세밀하게 대상을 분류한 메시지 발송 및 분석이 가능합니다.」
- 오른쪽 「새 세그먼트」 버튼(xs) → `{현재 asPath}/new`.
- 목록 머리 줄(caption gray400, 아래 선): 왼쪽 「이름」, 오른쪽 「유저 수」(유저) / 「기기 수」(기기).
- 검색·필터·페이지네이션 **없음**(전체를 한 번에 표시).

### 5.2 데이터 · 정렬
- `GET /segments?targetType=User|Device` → `data.data`, `data.meta`.
- 표시 순서: `type === "DEFAULT"` 세그먼트 먼저(원래 순서), 그다음 나머지를 `name.localeCompare` 오름차순.
- 로딩: 가운데 스피너. 0건: 빈 상태 일러스트 + 「데이터가 없습니다」.

### 5.3 행
- 배경 gray50, 아래 gray200 선, 기본 세그먼트는 위아래 22px, 그 외 14px/20px 패딩. **행 클릭 → 상세**(`/user-segments/{id}/users` 또는 `/segments/{id}/devices`).
- 첫 줄 왼쪽(왼→오): [기본 세그먼트면 「기본」 배지(brand400 15% 배경, brand500 글자)] · 「ID」 칩(복사 가능, hover 시 ID) · [코호트 필터가 있으면 「Amplitude」(테두리·글자 rgb(25,92,232)) 또는 「Mixpanel」(rgb(110,87,249)) 작은 테두리 배지] · 이름.
- 첫 줄 오른쪽(왼→오):
  - 동기화 상태(`lastSyncedAt` 있을 때; 코호트면 해당 코호트의 lastSyncedAt): 「{{n}}분 전 동기화됨」, 600분 초과 & 비코호트면 「동기화 대기중」, null이면 「동기화 전」 + 도움말 「세그먼트 내 이벤트 집계는 실시간에 가깝게 반영되지만, 최대 0 ~ 30분 이내의 지연이 발생할 수 있습니다.」
  - 인원 수(축약형). **행이 화면에 보일 때만** 500~2000ms 무작위 지연 후 조회, 60초 캐시. 조회 전/중 작은 스피너.
    - 유저: `POST /users/count` `{segmentIds:[[id]]}` → `data.data.count`
    - 기기: `GET /segments/{id}/device-count` → `data.data.count`
  - ⋯ 버튼(클릭 전파 막음).
- 둘째 줄(편집 가능한 세그먼트 = 기본 아님 && 코호트 아님일 때만): gray100 박스에 필터 요약(5.5).

### 5.4 ⋯ 메뉴
| 항목 | 조건 | 동작 |
|---|---|---|
| 「유저 정보」 / 「기기 정보」 | 항상 | 상세로 이동(행 클릭과 같음) |
| 「복제」 | 기본·코호트 아님 | `/…/new?copySegmentId={id}` |
| 「수정」 | 기본·코호트 아님 | `/…/{id}/edit` |
| 「삭제」(빨강) | 기본 아님 | 삭제 모달 |

- 삭제 모달(공용): 본문 제목 「세그먼트를 삭제하시겠습니까?」
  - 일반: 「삭제된 세그먼트는 복구할 수 없습니다.」
  - 코호트(필터에 `COHORT_AMPLITUDE`/`COHORT_MIXPANEL`): 「세그먼트 삭제 전 먼저 분석 툴에서 코호트 연동을 해제해주세요.<br />삭제 시 분석 툴과의 코호트 연결이 해제되며, 재연동하려면 코호트 내보내기를 새롭게 다시 수행해주셔야 합니다.」 + 「삭제하려면 "{{name}}" 을 입력하세요」 + 텍스트 input. 이름 불일치로 삭제 누르면 에러 토스트 「세그먼트 이름이 일치하지 않습니다.」
  - 버튼 「취소」 / 「삭제」(빨강, 로딩; 처리 중 배경 클릭 막힘)
  - 확인: `DELETE /segments/{id}` → 모달 닫힘 → 목록 재조회 → 토스트 「세그먼트가 삭제되었습니다.」

### 5.5 필터 요약 표기 (목록 둘째 줄 · 상세 카드 「필터」 · 편집기 readonly)
- 구조: `filters = [[조건, 조건…], [조건…]]` - 바깥 배열 = **OR 그룹**, 안쪽 = **AND 조건**. 그룹 사이에 「또는」(`common:OR`, caption gray400) 줄.
- 조건 한 줄: `유형 라벨`(gray950) + 값들(brand400). 값 렌더 규칙:
  - 연산자/선택지 키 → `segment:` 번역 (예 「=」, 「가 존재하면」, 「입니다」, 「앱(iOS)」).
  - 시간형 유형(최초 생성 시간·마지막 접속 시간)의 연산자 → `TIME_` 접두 (「최근 ~시간 이내」 / 「~시간 이상 경과」), 숫자 뒤 `[ n 시간 ]`.
  - 생일 → 「이 오늘이면」(`BIRTHDAY_EQ`).
  - 태그 + 시간 연산자(`AFTER_HOURS`·`REMAIN_HOURS`·`IN_THE_LAST_N_HOURS`) 다음 값 → `[ n 시간 ]`.
  - `AFTER`/`BEFORE` 다음 값 → `yyyy-MM-dd HH:mm` + 브라우저 타임존 이름(회색).
  - `CSV` 다음 값(파일 키) → 클릭 가능 링크 → CSV 사유 모달 → `POST /download-csv` `{targetCsvKey, reason}`로 blob 다운로드.
  - 코호트 → 코호트 이름(cohort-sync 목록에서 찾음).
  - 이벤트: 「최근 {n}{일|시간} 이내, 다음 {이벤트명} {연산자}{횟수} 회 발생」 + 하위 조건마다 `키 연산자 값`.
  - 카페24 쿠폰: 줄마다 `{필드} {연산자} {값}` (필드 「쿠폰 번호」「사용 여부」「발급일」「만료일」).

---

## 6. 세그먼트 상세 카드 (`/user-segments/[id]/users`, `/segments/[id]/devices` 상단)

- 카드 제목 「세그먼트 상세 정보」.
- 로딩: 가운데 스피너. 조회 실패/없음: 빈 상태 일러스트 + 「데이터가 없습니다」.
- 데이터: `GET /segments/{id}` → 성공 후 인원 수 조회(유저 `POST /users/count {segmentIds:[[id]]}`, 기기 `GET /segments/{id}/device-count`).
- 소제목 「정보」 + 동기화 상태(lastSyncedAt 있을 때, 상세 날짜형 `yyyy.LL.dd HH:mm:ss (n분 전 동기화됨)`).
- 2열 정보 표(라벨 셀 160px gray 배경, 모바일 115px):
  | 행 | 왼쪽 | 오른쪽 |
  |---|---|---|
  | 1 | 「타이틀」 = name | - |
  | 2 | 「ID」 = id | 「유저 수」/「기기 수」 = `12,345`(조회 중 스피너, 0/없음 「-」) + 수 > 0이면 다운로드 아이콘 버튼(secondary xs, aria 「다운로드」) → 1.6 흐름 |
  | 3 | 「생성 시간」 | 「최근 수정 시간」 (`yyyy.LL.dd HH:mm:ss`) |
  | 4 | 「필터」 = 5.5 요약 | - |
- 오른쪽 아래 버튼(기본 세그먼트면 전체 숨김): 「삭제」(secondary destructive xs) → 5.4 삭제 모달 → `DELETE /segments/{id}` → 토스트 「세그먼트가 삭제되었습니다.」 → 목록으로 `replace`. 「수정」(xs, 코호트 세그먼트면 숨김) → `/…/{id}/edit`.
- 카드 아래 56px 간격으로 유저 목록(2장) 또는 기기 목록(3장, 제목 「세그먼트 기기」).

---

## 7. 세그먼트 생성·수정 `/…/new`, `/…/[id]/edit`

### 7.1 화면 구성
- 제목 「새 세그먼트」(new) / 「세그먼트 수정」(edit). 복제(`?copySegmentId`)도 제목은 「새 세그먼트」.
- 라벨 「이름」 + input(id `segment-name`) placeholder 「세그먼트 이름」.
- 라벨 「필터」 + 조건 편집기(7.2).
- 편집기 아래 추정 수 줄(gray100 배경, gray500 글자):
  - 기본: 「추정 유저 수」/「추정 기기 수」 + 브랜드색 숫자(축약형, 초기 「0」). 계산 중이면 옆에 작은 스피너.
  - 필터에 이벤트 또는 CSV 조건이 있으면 숫자 대신 「{{type}}가 포함된 세그먼트 입니다.」(type은 원문 키 `EVENT`, `CSV`, 둘 다면 `EVENT, CSV`).
- 하단 버튼(xl): 「취소」(secondary) → 목록으로 push (**이탈 확인 없음**), 「저장」(로딩).

### 7.2 진입 · 불러오기
- edit 또는 복제: `GET /segments/{segmentId|copySegmentId}` → 이름·필터 채움. 응답이 `type: "DEFAULT"`면 **`/segments`로 이동**(유저 세그먼트여도 기기 목록으로 감). 복제는 이름도 그대로 복사.
- 초기 필터 `[[{type:"", values:[]}]]` (빈 조건 1개).
- 필터가 바뀔 때마다 `window.scrollTo(0, body.scrollHeight)`(맨 아래로 스크롤).

### 7.3 조건 편집기 구조
- OR 그룹마다 gray100 박스. 박스 안에 AND 조건 줄들 + 박스 아래쪽 「+ 그리고」(tertiary sm, add 아이콘, `common:AND`). 그룹당 조건 **최대 20개**(20개면 버튼 숨김).
- 그룹 사이 「또는」 라벨(마지막 그룹 뒤는 CSS로 숨김).
- 맨 아래 「+ 또는」(secondary sm) - 그룹 **최대 10개**.
- 조건 줄 오른쪽 − 아이콘(삭제, aria 「삭제」). 그룹 1개·조건 1개뿐이면 숨김. 그룹의 마지막 조건을 지우면 그룹 삭제.
- 조건 유형 드롭다운(너비 140px, placeholder 「필터 선택」): 선택지는 **서버 설정** `GET /configs`의 `segmentFilters`(기기) / `userSegmentFilters`(유저) 배열 순서 그대로, 라벨 = `segment:{type}`. 카페24 미연동 프로젝트는 `CAFE24_COUPONS` 제외.
  - 유형 변경 시 values 초기화(`[]`). 이벤트는 `["", "IN_THE_LAST_N_HOURS", "1", "", "EQ", "1", []]`, 쿠폰은 `[["no","EQ",""]]`.
  - 코호트(Amplitude/Mixpanel) 선택 시 **필터 전체를** `[[{type, values:[]}]]`로 교체(단독 조건).
- 유형 라벨(ko): 플랫폼 · 테스트 기기 · 유저 ID · 태그 · 이벤트 · 웹 브라우저 · APP 버전 · OS 버전 · SDK 버전 · 알림 구독 기기 · 최초 생성 시간 · 마지막 접속 시간(`LAST_ACTIVE_AT_WITHIN_HOURS`/`LAST_DEVICE_ACTIVATED_AT_WITHIN_HOURS` 둘 다 같은 문구) · 국가 · 언어 · Amplitude 코호트 · Mixpanel 코호트 · 생일 · 문자 수신 거부 유저 · 전화번호 · 나이 · 쿠폰.

### 7.4 값 입력 렌더 규칙 (일반 유형)
`validValues[i]`(서버)를 순서대로 돌며 칸을 그린다. 직전 값이 `EXIST`/`NOT_EXIST`면 그 뒤 칸은 그리지 않음.
- `validValues[i]`가 배열 → 선택 드롭다운(200px; 옵션 라벨 `segment:` 번역, 시간형은 `TIME_` 접두, 생일은 `BIRTHDAY_` 접두). `EXIST`/`NOT_EXIST`/`CSV` 선택 시 다음 문자열 칸 비움. `AFTER`/`BEFORE`로 바꾸면 다음 칸에 현재 시각 ISO 채움.
- `"STRING"` 칸:
  - 직전이 `CSV` → 「CSV 파일 업로드」 버튼(tertiary sm, 업로드 아이콘) + 도움말(이미지 + 「A열에 발송할 유저 ID를 입력한 CSV를 업로드하세요.(최대 100만 행, 128MB)」). 업로드 후엔 파일명 링크 + 「삭제」. 검증: 128MB 초과 「CSV 파일은 128MB까지 업로드할 수 있습니다.」, UTF-8 아님 alert 「CSV 파일은 UTF-8 형식이어야 합니다. 다른 인코딩 형식의 파일은 지원되지 않습니다.」, 100만 행 초과 「CSV 내 라인수가 1,000,000개를 초과했습니다.」, 기타 「CSV 파일 형식이 올바르지 않습니다.」 (`POST /upload-csv` multipart).
  - 직전이 `AFTER`/`BEFORE` → 날짜 선택 + 시(placeholder 「Hour」, 0~23) `:` 분(「MM」, 0~59) + 브라우저 타임존 이름. 초·밀리초 0, ISO 저장.
  - 태그의 첫 칸 → 태그 키 검색 드롭다운(데이터 관리 태그 목록, 숨김 태그 제외, 이름/설명 검색, 하단 「+ 새 태그」 → `/data-management?n=t`).
  - 코호트 → 코호트 검색 드롭다운(이름 + 회색 cohortId).
  - 국가 → 국가 코드 검색 드롭다운(코드 + 회색 한글 국가명). 언어 → 언어 코드 + `Intl.DisplayNames` 언어명.
  - 태그 값(셋째 칸, 시간 연산자 아닐 때) → 검색형 콤보박스: 최근 값 목록(`GET /data-management/tags/{name}/values`) + 「전체 중 최근 일부가 표시됩니다.」 안내 + 입력 중 「직접입력: {입력}」 항목(Enter로 확정). 연산자가 「다음 중 하나를 포함」/「다음 중 하나를 미포함」이고 쉼표 구분 값이 5개 초과면 빨간 테두리 + 「해당 값은 최대 5개까지 입력 가능합니다.」
  - 그 외 → 텍스트 input. 시간형 유형·태그 시간 연산자면 오른쪽에 「시간」 단위(80px).
- 연산자 라벨(segment ns): `EQ`「=」 `NOT_EQ`「≠」 `GT`「>」 `GTE`「≥」 `LT`「<」 `LTE`「≤」 `EXIST`「가 존재하면」 `NOT_EXIST`「가 존재하지 않으면」 `AFTER`「(기간) ~이후」 `BEFORE`「(기간) ~이전」 `AFTER_HOURS`「(기간) ~시간 이상 경과」 `REMAIN_HOURS`「(기간) ~시간 남음」 `IN_THE_LAST_N_HOURS`「(기간) 최근 ~시간 이내」 `INCLUDES`「이 중에 하나」 `CONTAINS_ANY_OF`「다음 중 하나를 포함」 `CONTAINS_NONE_OF`「다음 중 하나를 미포함」 `CSV`「가 CSV 파일에 포함」 `TIME_EQ`「최근 ~시간 이내」 `TIME_NOT_EQ`「~시간 이상 경과」 `BIRTHDAY_EQ`「이 오늘이면」 `true`「입니다」 `false`「아닙니다」.
- 플랫폼 값 라벨: `app`「앱 (전체)」 `android`「앱(안드로이드)」 `ios`「앱(iOS)」 `web`「웹 (전체)」 `webDesktop`「웹(데스크탑)」 `webMobile`「웹(모바일)」.

### 7.5 이벤트 조건
- 한 줄: 「최근」 [숫자 48px][단위 60px: 「일」/「시간」(분 없음)] 「이내, 다음」 [이벤트 검색 드롭다운(「+ 새 이벤트」 → `/data-management?n=e`, 숨김 이벤트 제외)] [연산자 60px] [횟수 number 1~5] 「회 발생」.
  - 기간: 최소 1, 최대 90일 / 2160시간. 시간 단위로 저장(일×24).
  - 횟수가 1인데 `LT` 선택 상태로 만들면 에러 토스트 「1회 미만(<)은 유효하지 않은 조건입니다. '미만(<)' 조건은 최소 2회부터 설정할 수 있습니다.」; 횟수 1이면 연산자 목록에서 `LT` disabled.
- 오른쪽 「+ 필터」(tertiary sm) - 이벤트 속성 하위 조건 **최대 3개**. 각 줄: [속성 키 검색 드롭다운(`GET …/events/{name}/data/keys`)] [연산자: 「=」「≠」「>」「≥」「<」「≤」「이 중에 하나」] [값 검색 드롭다운(`…/data/keys/{key}/values`, 「직접입력:」 지원)] [− 삭제]. 새 줄 기본 `["", "EQ", ""]`.

### 7.6 카페24 쿠폰 조건
- 줄 = [필드(쿠폰 번호/사용 여부/발급일/만료일)] [연산자] [값] (+ 첫 줄 오른쪽 + 버튼, 둘째 줄부터 − 버튼). 최대 4줄(필드 수).
- 필드별 연산자: 쿠폰 번호 `EQ,NOT_EQ` / 사용 여부 `EQ` / 발급일 `EQ,GTE,LTE,GT,LT,IN_THE_LAST_N_HOURS,AFTER_HOURS,BEFORE,AFTER` / 만료일 `EQ,GTE,LTE,GT,LT,REMAIN_HOURS,BEFORE,AFTER`.
- 값: 쿠폰 번호 = 검색 드롭다운(열 때 `GET /cafe24/coupons`, 직접입력), 사용 여부 = 「사용」/「미사용」, 시간 연산자 = 숫자(≥1) + 「시간」, `BEFORE/AFTER` = 날짜·시각(ISO), 그 외 = 날짜·시각(epoch ms 문자열).

### 7.7 추정 수 계산
- 필터 변경 후 **3초 디바운스**로 `POST /users/count`(유저) 또는 `POST /devices/count`(기기) `{filters}` → `data.data.count`. 실패 시 0.
- 계산 생략(이전 타이머 취소): 이벤트/CSV 포함(7.1 안내문), 또는 미완성 조건이 하나라도 있음(값 개수가 validValues 길이와 다름, EXIST/NOT_EXIST면 하나 적어도 됨; 쿠폰은 모든 줄 필드·연산자·값 채움). 필터가 비면 0.

### 7.8 저장
- 클라이언트 검증 **없음**(이름 빈칸도 전송). 문자열 값은 trim.
- new: `POST /segments`, edit: `PATCH /segments/{id}` body `{name, filters, targetType: "User"|"Device"}`.
- 성공: 토스트 「세그먼트가 추가되었습니다.」 / 「세그먼트가 수정되었습니다.」 → 목록으로 push. 실패: 콘솔만(서버 에러 토스트는 공통 처리).

---

## 8. 목업용 GET 엔드포인트 · 응답 필드

| 엔드포인트 | 쓰는 화면 | 읽는 필드 |
|---|---|---|
| `GET ""`(= `/projects/{id}`) | 공통(쿠폰 노출 여부) | `cafe24Id`, `purchaseConversionConfig.eventType` |
| `GET /configs` | 편집기·필터 요약 | `segmentFilters[{type, validValues}]`, `userSegmentFilters[…]`, `countryCodes[{code, kr_name, en_name}]`, `languageCodes[]` |
| `POST /users` *(조회용 POST)* | 전체 유저·세그먼트 유저 | `data[]{userId, name, phoneNumber, lastDeviceActivatedAt, tags{}, collections.cafe24Coupons[{no, isUsed, issuedAt, availableEndAt}]}`, `meta.totalCount` |
| `GET /users/{userId}` | 유저 상세 모달 | `userId, country, language, name, phoneNumber, email, dob, timeZone, smsUnsubscribedAt, createdAt, updatedAt, lastDeviceActivatedAt, tags` |
| `POST /users/count` *(조회용 POST)* | 유저 세그먼트 수·추정 수 | `data.count` |
| `GET /devices/search` | 전체/세그먼트/테스트 기기, 추가 모달 | `data[]{id, platform(ios/android/webDesktop/webMobile), deviceModel, osVersion, browser, createdAt, lastActiveAt, userId, isTest, testName, isSubscribed, tags{}, appVersion, sdkVersion, countryCode, languageCode, timeZone, collections.cafe24Coupons[]}`, `meta.totalCount` |
| `POST /devices/count` *(조회용 POST)* | 기기 추정 수 | `data.count` |
| `GET /segments?targetType=` | 세그먼트 목록 | `data[]{id, name, type("DEFAULT"…), targetType("User"/"Device"), filters[[{type, values}]], lastSyncedAt}`, `meta` |
| `GET /segments/{id}` | 상세 카드·편집기 | `id, name, type, targetType, filters, createdAt, updatedAt, lastSyncedAt` |
| `GET /segments/{id}/device-count` | 기기 세그먼트 수 | `data.count` |
| `GET /cohort-sync` | 코호트 이름·동기화 | `data[]{id, cohortId, cohortName, source("amplitude"/"mixpanel"), lastSyncedAt}` |
| `GET /data-management/events?page=1&per=500` | 이벤트 선택 | `data[]{id, name, description, hidden, readOnly}` |
| `GET /data-management/tags?page=1&per=500` | 태그 키 선택 | 같은 형태 |
| `GET /data-management/tags/{name}/values` | 태그 값 콤보 | `data.values[]` (3분 캐시) |
| `GET /data-management/events/{name}/data/keys` | 이벤트 속성 키 | `data.keys[]` |
| `GET /data-management/events/{name}/data/keys/{key}/values` | 이벤트 속성 값 | `data.values[]` |
| `GET /cafe24/coupons` | 쿠폰 번호 선택 | `data[].no` |
| `GET /users/segment-target-csv` · `GET /devices/segment-target-csv` | CSV 폴링 | `data{status("COMPLETED"…), url}` |

- 변경 API(목업에서는 가짜 처리): `DELETE /users/{userId}`, `PATCH /devices/{id}`(isTest/testName), `DELETE /segments/{id}`, `POST /segments`, `PATCH /segments/{id}`, `POST /upload-csv`, `POST /download-csv`, `POST /{users|devices}/segment-target-csv`.

---

## 9. 확인 못 한 것

- **조건 유형 목록과 각 유형의 연산자·값 선택지(`validValues`)**: `GET /configs` 서버 응답으로 내려와 번들에 없다. 유저/기기 세그먼트에 어떤 유형이 어떤 순서로 나오는지, 플랫폼·테스트 기기·구독 등의 연산자 조합은 실제 화면이나 API 응답으로 확인 필요. (위 라벨 목록은 로케일에 있는 키 전체이며 실제 노출 여부는 모름.)
- 세그먼트 목록 ⋯ 메뉴 항목 클릭이 행의 onClick(상세 이동)으로 **버블링될 수 있는 코드 구조**(메뉴 항목에 stopPropagation 없음). 실제로 「삭제」·「복제」·「수정」을 눌렀을 때 상세로 같이 이동하는지는 화면에서 확인 필요.
- 서버 측 검증 메시지(세그먼트 이름 빈칸·중복, 필터 오류 등) 문구 - 번들에 없음.
- 기본(`DEFAULT`) 세그먼트가 실제로 몇 개·어떤 이름으로 오는지.
- 토스트 표시 시간·위치의 정확한 값(공용 토스트 설정은 다른 문서 참고).
- `getServerSideProps`의 서버 리다이렉트 조건(비로그인 외).
- 블러 클래스(`m_blur`)가 언제 실제로 블러 처리되는지(개인정보 보호 토글로 추정, 이 영역 코드에서는 클래스만 붙임).
- 쿠폰 요약 셀·Locale 칩의 정확한 시각 스타일(styled 템플릿 일부만 확인).
