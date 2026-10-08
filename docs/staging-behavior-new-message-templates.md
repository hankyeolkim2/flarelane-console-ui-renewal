# 스테이징 콘솔 동작 명세 - 새 메시지(5채널) · 템플릿(푸시/알림톡/이메일)

- 출처: `https://staging-console.flarelane.com` 공개 번들 JS(buildId `Q-tOYo7BMgpuoKSGYkmC0`, 404 페이지 `__NEXT_DATA__`로 재확인) + `/locales/ko/*.json` 정적 분석. 로그인·API 호출 없음 (2026-10-08).
- 문자열은 ko 로케일 값을 그대로 인용. `ns:key` = 번역 네임스페이스:키. 로케일에 없는 하드코딩 문자열은 "(하드코딩)"으로 표시.
- API 경로는 `https://staging-service-api.flarelane.com/v1/projects/{projectId}` 기준 상대경로(axios 인스턴스가 baseURL에 `/projects/{id}`를 붙임).
- 피드백 표기: **토스트** = 우측 토스트(`success`/`error`/`info`), **alert/confirm** = 브라우저 `window.alert` / `window.confirm`.
- 서버 오류 공통: 응답 바디에 `message`가 있으면 그 문자열 그대로 에러 토스트(401·403·`EXPIRED` 제외). 네트워크 끊김은 "인터넷 연결을 확인해 주세요."(`common:alert.error.connect`).
- 예약/반복 **수정** 화면(`messagePageType = scheduled | recurring`)은 같은 컴포넌트를 쓰며 `staging-behavior-scheduled-recurring.md`에서 다룸. 이 문서는 `new`만.

---

## 0. 라우트 (빌드 매니페스트 기준)

| 화면 | 라우트 | 비고 |
|---|---|---|
| 푸시 새 메시지 | `/push/new-message` | |
| 알림톡 새 메시지 | `/alimtalk/new-message` | 메뉴 `onlyKo` |
| 브랜드메시지(친구톡) 새 메시지 | `/friendtalk/new-message` | 메뉴 `onlyKo` |
| SMS 새 메시지 | `/sms/new-message` | 메뉴 `onlyKo` |
| 이메일 새 메시지 | `/email/new-message` | |
| 푸시 템플릿 | `/push/templates`, `/push/templates/new`, `/push/templates/[templateId]`, `/push/templates/[templateId]/edit` | |
| 알림톡 템플릿 | `/alimtalk/templates`, `/alimtalk/templates/new`, `/alimtalk/templates/[id]`, `/alimtalk/templates/[id]/edit` | 사이드바 링크 `/alimtalk/templates?isp=COM` |
| 이메일 템플릿 | `/email/templates`, `/email/templates/new`, `/email/templates/[id]`, `/email/templates/[id]/edit` | |

### 0.1 새 메시지 쿼리 파라미터 (5채널 공통)

| 쿼리 | 동작 |
|---|---|
| `?copyMessageId={id}` | 프로젝트·projectDetail 로드 후 원본 메시지를 `GET` 해서 폼 채움(채널별 엔드포인트 6장). 로딩 중 전체 스피너. |
| `?config=recurring` | 진입 시 반복 발송 설정을 기본값으로 켬(2.9). 상단 "임시 저장" 카운트 버튼·하단 "임시 저장" 버튼 숨김(이메일은 상단 버튼은 유지), 주 버튼 라벨 "저장". |
| `?draftId={id}` | 임시 저장본 복원(2.11). 복원 후 URL에서 `draftId`만 `history.replaceState`로 제거. |
| `?templateId=` | **새 메시지에는 없음.** `templateId`는 `/push/templates/[templateId]` 라우트 파라미터로만 쓰임. 템플릿은 화면 안의 "템플릿 선택" 모달로만 적용. |

- 이메일 템플릿 "복제"는 `/email/templates/new?copyMessageId={templateId}` (8.3).

---

## 1. 화면 공통 골격 (5채널)

- 헤더: 좌측 제목 **"새 메시지"**(푸시·이메일 `newMessage:category`, 알림톡·브랜드메시지 `kakao:newMessage`, SMS `sms:newMessage` - 모두 같은 문자열) + 그 오른쪽 **"임시 저장 N"** 버튼(secondary·xs, 라벨 "임시 저장"(`common:button.tempSave`) 뒤에 브랜드색 숫자 = 저장본 개수). 반복 발송 모드에서는 숨김(이메일 제외).
- 본문은 **번호 매긴 섹션 박스**(원형 번호 + 제목 + 우측 보조 버튼) 5개, 순서 고정:
  1. "캠페인 명"(`common:campaignName`)
  2. "대상"(`newMessage:audience` / `common:audience`)
  3. "메시지"(`newMessage:message` / `common:message`)
  4. "전환 이벤트 설정"(`newMessage:setConversionConfigs` 등)
  5. "발송 설정"(`newMessage:sendOptions` / `common:sendOptions`)
- 하단 버튼 줄(우측 정렬, gap 12px): **"임시 저장"**(xl, secondary - 이메일만 tertiary) · **주 버튼**(xl) = "발송"(`common:button.send`) 또는 반복/예약이면 "저장"(`common:button.save`).
- 페이지 이탈 확인: 진입 시 `routeChangeStart` + `beforeunload` 훅 등록. 다른 페이지로 이동 시 `window.confirm("변경사항이 저장되지 않았습니다. 페이지를 벗어나시겠습니까?")`(`common:alert.checkEscape`), 취소하면 이동 중단. 발송 성공 직후 해제.
- 캠페인 명 입력: placeholder **"캠페인 명 (선택)"**(`common:placeholder.campaign`), 길이 제한 없음, id `campaign-name`.

---

## 2. 푸시 새 메시지 (`/push/new-message`) - 기준 명세

### 2.1 레이아웃
- 2열: 좌측 폼(대상 영역 폭 `calc(100% - 400px)`), 메시지 섹션은 폼 + 우측 미리보기 열(320px, 모바일에서 숨김).
- 섹션 3 "메시지" 우측 보조 버튼 3개(좌→우): **"AI"**(brand xs, 아이콘 `auto_awesome`) · **"최근 발송 메시지"**(`newMessage:recentMessage`, secondary xs, 템플릿 적용 중 disabled) · **"템플릿 선택"**(`newMessage:useATemplate`, secondary xs). 템플릿 적용 후에는 라벨이 **"템플릿 수정"**(`newMessage:editTemplate`) + 우측 X 아이콘이 되고, 클릭하면 **템플릿 해제**(모달 안 열림).

### 2.2 섹션 2 "대상"
- 제목 옆 도움말(?) = `message-help:help.audience`: "메시지 발송 대상을 지정합니다.<br /><br /> - 세그먼트: 여러 기기 대상으로 그룹 발송합니다. 세그먼트를 다수 선택하는 경우 각 세그먼트를 OR 조건으로 연결합니다.<br /> - 유저 ID: … - 기기: 기기별 고유한 기기ID를 대상으로 단일 발송합니다."
- **대상 탭**(세그먼트 컨트롤, 탭 폭 150px, 선택 시 브랜드 배경·흰 글자·굵게): **"기기 세그먼트"**(`segment`, 기본) · **"유저 ID"**(`userId`) · **"기기"**(`device`) · **"파일 업로드"**(`csv`). 탭 변경 시 대상 값 전부 초기화(템플릿 미적용이면 플랫폼도 4개 전체로).
- 탭별 입력:

| 탭 | UI |
|---|---|
| 기기 세그먼트 | 라벨 **"포함"**(`common:include`) + 세그먼트 피커. 아래 **"제외"**(`common:exclude`, tertiary sm, 화살표 아이콘) 토글 → 펼치면 제외 세그먼트 피커. 제외값이 있으면 화살표 없이 항상 펼침. 그 아래 **"고급 설정"**(`common:button.advancedSetting`) 토글 → 체크박스 **"무작위 일부 발송"**(`common:targetSelectRate`) + 숫자 입력(1~100, 기본 10, 정수, 100 초과는 100) + "%" + 도움말 "전체 대상자 중 랜덤하게 추출한 n%를 대상으로 알림을 발송합니다." 고급 설정을 접으면 비율 해제. |
| 유저 ID | 소제목 **"발송 플랫폼"**(`common:targetPlatform`) + 플랫폼 선택(2.3) → 소제목 **"유저 ID"** → 칩 입력(placeholder "유저 ID 입력") |
| 기기 | 칩 입력(placeholder "기기 입력") |
| 파일 업로드 | 드롭존(2.2.2) + 우측(320px) 파일 가이드 패널 |

#### 2.2.1 세그먼트 피커
- 빈 행: 검색 가능한 셀렉트, placeholder **"세그먼트 선택"**(`common:placeholder.selectSegment`). 옵션 = `GET /segments?targetType=Device`(유저 채널은 `User`), `type==="DEFAULT"`가 먼저 오고(기본 아이콘) 나머지는 이름순. 이미 다른 칸에서 쓴 id 제외.
- 선택된 항목: 회색 테두리 박스 안에 한 줄씩 `세그먼트명` + 줄 사이 **"그리고"**(`common:AND`, 브랜드색) + 행 끝 X(삭제).
- 박스 하단 버튼(secondary xs): **"그리고"**(같은 그룹에 AND 추가), 마지막 그룹에만 **"또는"**(`common:OR`, 새 OR 그룹). 그룹 사이 텍스트 "또는".
- 알림톡/브랜드메시지/SMS는 박스 안에 회색 문구 **"위 세그먼트 중 전화번호를 보유한 유저"**, 이메일은 **"위 세그먼트 중 이메일을 보유한 유저"**.

#### 2.2.2 칩 입력 · 파일 업로드
- 칩 입력: contentEditable. Enter 또는 blur 시 현재 텍스트를 칩으로 추가(trim). 칩마다 X. 표시 최대 30개(`max:30`, 그 이상은 화면에 안 보임).
- 드롭존(파일 미선택): 업로드 아이콘 + **"이곳을 클릭하거나, 파일을 드래그해서 업로드 해주세요."** / 회색 **"지원 형식: XLSX, CSV / 최대 첨부 가능 용량 50 MB"**. 클릭 시 `accept=".csv,.xlsx"`.
- 파일 선택 후: 파일 카드(아이콘, 파일명, `행수 (용량)`) + 우측 **"삭제"**(tertiary destructive; 클릭 시 `alert("파일을 삭제하시겠습니까?")`(하드코딩, 확인/취소 없음) 후 삭제). 오류가 있으면 카드 빨간 테두리 + 빨간 문구(예 `'행3' 의 2개 에서 중복된 유저 ID가 있습니다.`). 그 아래 **"파일 데이터에서 확인된 변수(n)"** + 부족하면 **", 필요한 변수(n)"**(빨강 점선 칩) + Liquid 오류 시 "Liquid 문법이 올바르지 않습니다." + **"첨부한 파일 미리보기"** 표(최대 50행).
- 첫 열 헤더 규칙: 푸시 `userId`, 알림톡/브랜드/SMS `phoneNumber`, 이메일 `email`.
- 파일 오류 alert: "파일을 읽는 중 오류가 발생했습니다. XLSX 또는 CSV 파일을 업로드해주세요." / "파일 크기는 50MB를 초과할 수 없습니다." / "CSV 파일은 UTF-8 형식이어야 합니다. 다른 인코딩 형식의 파일은 지원되지 않습니다." / `첫번째 열이 "userId"가 아닙니다.`(phoneNumber·email 동일 형식) / "헤더에 빈칸이 있습니다." / "헤더에 중복된 값이 있습니다." / "엑셀 파일에 '날짜' 서식으로 지정된 셀이 포함되어 있습니다. 해당 셀을 '텍스트' 서식으로 변경한 뒤 다시 업로드해 주세요."
- 행 오류 문구: "전화번호 형식에 오류가 있습니다." / "유저 ID 형식에 오류가 있습니다." / "이메일 형식에 오류가 있습니다." / "중복된 유저 ID가 있습니다." / "중복된 전화번호가 있습니다." / "중복된 이메일 주소가 있습니다." / "데이터 합이 1000자를 초과하였습니다" / "데이터가 비어있는 행이 있습니다."
- 파일 가이드 패널: 링크 **"파일 가이드 바로가기"**(ko: `https://docs.flarelane.co.kr/mobile-push-overview`) + 설명 "**샘플 파일 다운로드 TIP**<br />메시지 입력 후 샘플 파일 다운로드하면<br />메시지 맞춤형 파일을 다운받을 수 있습니다." + 버튼 **"샘플 파일 다운로드"**(`POST /csv/sample {channel, format:"xlsx", headers}` → 응답 url 다운로드, 실패 토스트 "샘플 파일 다운로드 중 오류가 발생했습니다.").

#### 2.2.3 추정 수
- 파일 업로드 탭 제외하고 대상 아래 우측 정렬, 브랜드색: **"추정 기기 수: 1,234"**(`common:estimatedDevices`; 유저 채널은 "추정 유저 수"). 로딩 중 스피너.
- 무작위 일부 발송 켜짐: `floor(rate/100 × count)` 표시.
- 세그먼트 탭이고 count>0이면 옆에 다운로드 아이콘 버튼(사유 입력 모달 후 세그먼트 대상 CSV 다운로드).
- 재계산: 대상·제외·플랫폼 변경 시 **1초 디바운스** `POST /notifications/estimated-devices-count`(바디 = 발송 바디의 대상 부분). 대상이 비면 0.
- count ≤ 100인데 무작위 비율이 설정돼 있으면 `alert("무작위 일부 발송 설정은 대상자가 100개 이상인 경우 가능합니다.")` 후 비율 해제.

### 2.3 발송 플랫폼 선택 (유저 ID 탭에서만)
- 2그룹: 캡션 **"앱 푸시"** - 체크박스 "Android", "iOS" / 캡션 **"웹 푸시"** - "Desktop", "Mobile"(아이콘 포함, 항목 폭 150px). 기본 4개 모두 체크.
- 전부 해제되면 info 토스트 **"최소 하나 이상의 플랫폼을 선택해주세요."** + 4개 다시 체크.
- 템플릿 적용 중이면 읽기전용(템플릿의 `notification.targetPlatforms`로 고정).

### 2.4 섹션 3 "메시지" 필드
| 순서 | 라벨 | 입력 | placeholder | 규칙 |
|---|---|---|---|---|
| 1 | "제목"(`common:message.title`) | 한 줄(Enter 막힘), 개인화 `{}` 버튼 | "제목 (선택)" | |
| 2 | "내용"(`message.body`) | 여러 줄, `{}` 버튼 | "내용 (필수)" | 필수 |
| 3 | "URL"(`message.url`) | 한 줄, `{}` 버튼 | "https://abc.com/xyz (선택)" | |
| 4 | "이미지"(`message.image`) | URL 입력 + **"업로드"**/"이미지 변경" 버튼(secondary xs, `image/jpg,jpeg,png`) | - | 업로드 즉시 `POST upload-image`(3MB 초과 시 에러 토스트 "이미지 크기가 너무 큽니다. (3MB 이하 허용)"), 업로드 후 입력값 "업로드됨" 읽기전용 + X로 제거. hover 시 이미지 팝오버 미리보기 |
| 5 | **"고급 설정"** 토글(tertiary sm) | - | - | 접으면 버튼·데이터 모두 비움. 기존 값 있으면 자동 펼침 |
| 5a | "버튼"(`message.buttons`) | 행 = Label 입력 + Link 입력 + X | "Label" / "Link" | 최대 2개, 추가 버튼 **"+ 버튼"**(`button.addButon`) |
| 5b | "데이터"(`message.data`) | 행 = Key + Value + X | "Key" / "Value" | 개수 무제한, **"+ 데이터"** |

- 템플릿 적용 시: 제목/내용/URL/이미지/버튼 읽기전용(placeholder 비움), **데이터만 편집 가능**, 플랫폼·전환 이벤트·빈도 제한 무시 체크박스 읽기전용.
- 입력값의 `{{ }}`/`{% %}` 구간은 하이라이트 표시.

### 2.5 개인화 변수 `{}` 모달 (모든 채널 공통 입력 컴포넌트)
- 입력창 우측 아이콘(`/images/PersonalizedValue.svg` 20px). 클릭 시 커서 위치 기억 후 모달.
- 모달 행 1 **"개인화 변수"** - 검색 셀렉트 placeholder **"변수 선택"**. 옵션 = (자동화 시작 이벤트 화면만 `entry_event.data` "시작 이벤트 데이터") + 숨김 아닌 태그 `tags.{name}`(설명, 자동 연동 태그는 "(데이터 연동되어 자동 추가됨)") + 고정 `phoneNumber` "전화번호", `name` "이름", `email` "이메일", `country` "국가", `language` "언어", `dob` "생년월일", `timeZone` "시간대", `userId` "유저 ID". 각 옵션 2줄(이름 / 설명). 태그 목록 = `GET /data-management/tags?page=1&per=500`.
- 행 2 **"대체 문구"** - 텍스트영역 placeholder **"값이 없을 때 사용할 문구 입력"**(Enter 막힘).
- 좌측 하단 링크 **"개인화 메시지 사용 가이드"**(`https://docs.flarelane.co.kr/personalized-messages`), 버튼 "취소" / "확인"(변수·대체문구 둘 다 있어야 활성).
- 확인 → 커서 위치에 `{{ 변수 | default: "대체문구" }}` 삽입(대체문구의 `\`·`"`는 이스케이프).

### 2.6 미리보기 패널 (우측)
- 상단 "미리보기"(`common:preview`) + 도움말(`message-help:help.preview`).
- 탭 2개(필 형태, 좌측 "앱 푸시" / 우측 "웹 푸시"; 활성 탭이 240px로 넓어지고 기기 드롭다운 표시). 기본 **앱 푸시 / Android**.
  - 앱 푸시 기기: `Android`, `iOS`
  - 웹 푸시 기기: `Android (Mobile)`(기본), `Windows (Desktop)`, `Mac OS (Desktop)`. 웹은 제목이 비면 웹푸시 설정의 `siteName`, 사이트 URL·아이콘도 `GET web-push-config`에서.
- 하단 버튼(secondary xs): **"미리보기"**(모바일 폭에서 전체화면 미리보기 모달) · **"테스트 기기로 발송"**(`common:button.sendToTestdevices`).

### 2.7 테스트 발송 (푸시)
1. **"테스트 환경 선택"** 모달(`testSend.select`): 부제 "테스트 진행하기 위한 발송 방법을 선택해주세요.", 우상단 링크 버튼 **"테스트 발송 내역"**(새 창 `/push/sent-history?p=1&s=testDevice`). 카드 2개: **"유저 ID"** · **"테스트 기기"**(선택 시 체크 아이콘). 버튼 "취소" / "확인".
2. **유저 ID 선택 시**: 모달 제목 **"테스트 발송"**, 설명 "실제 메시지 발송 전 내용을 검토하고, 사전에 오류를 방지할 수 있습니다." 행 "유저 ID": 입력(placeholder "유저 ID 입력 후 조회 버튼을 눌러주세요", 지난번 값 localStorage 복원) + **"조회"**(xs, 클릭 시 `GET /users/{id}` → 유저 상세 모달). 행 "플랫폼": 2.3 체크박스. 버튼 **"닫기"** · **"발송"**(입력 비면 disabled).
   - 발송 전에 `POST /notifications/estimated-devices-count`로 기기 수 확인 → 0이면 `alert('유저ID: "{id}"에 등록된 기기가 없습니다.\n앱 또는 웹에서 푸시 알림 허용을 해주세요.')`.
3. **테스트 기기 선택 시**: 모달 제목 **"테스트 기기 선택"** + 우측 **"추가"**(xs, 테스트 기기 추가 모달) · 새로고침 아이콘. 선택 가능 표: 열 **"별명"** · **"플랫폼"** · **"생성 시간"** · **"마지막 접속 시간"** · **"유저 ID"** · **"구독"**(각 헤더 도움말). 20개/페이지. 하단 `<span>N</span>개 선택됨` + "취소" · "발송".
   - 데이터 `GET /devices/search?isTest=true&ignoreSubscribed=true&page&per=20`.
- 검증 토스트: 선택 없음 → "테스트 기기를 선택해 주세요." / 내용 없음 → "메시지 내용을 입력해 주세요." 성공 → 토스트 **"메시지가 성공적으로 발송되었습니다."** + 모달 닫힘. 닫으면 선택·플랫폼 초기화.
- 실제 호출: `POST /notifications` (`senderSource:"testDevice"`, `sendAfter:null`, 전환·세그먼트 제외).

### 2.8 섹션 4 "전환 이벤트 설정" (전 채널 공통 컴포넌트)
- 라디오 **"미설정"**(`common:disable`, 기본) / **"설정"**(`common:enable`).
- 설정 시 회색 박스: 상단 탭 줄(**"이벤트"**, "이벤트 2"…, 최대 10개, `+` 아이콘으로 추가, 비활성 탭에 X, 드래그 정렬) + 선택 탭 내용:
  - **"이벤트"** - 이벤트 검색 셀렉트(시스템 이벤트 `@first_session` 숨김, 하단 **"+ 새 이벤트"** → `/data-management?n=e`) + **"필터"**(tertiary sm, + 아이콘; 최대 3개). 필터 행 = 데이터 키 셀렉트 · 연산자(`=`, `≠`, `>`, `≥`, `<`, `≤`, "이 중에 하나") · 값 셀렉트/입력 · `-` 삭제.
  - **"전환 측정 기준"** - 라디오: 푸시·이메일 **"클릭 기반"**(기본) / **"발송 기반"**; SMS·알림톡·브랜드메시지는 "발송 기반"만.
  - **"기여 기간"** - 숫자 + 단위(일/시간), 최소 1, 최대 30일(720시간), 기본 72시간(=3 일). 구매 전환 이벤트로 지정된 이벤트를 고르면 그 설정 기간.
  - 안내 박스: "{클릭|발송} 후 {3일} 내 <span>{event}</span> 이벤트 발생 시 전환으로 측정됩니다."
- 검증 alert: "전환 이벤트를 선택해주세요." / "전환 이벤트 필터를 선택해 주세요." / "기여 기간을 선택해 주세요."

### 2.9 섹션 5 "발송 설정"
(푸시만) 최상단 **"알림 만료 기간"**(`common:ttl`) + 도움말 "발송 성공하였으나 기기가 오프라인 상태 등 알림 노출이 불가한 경우 다음 기간 내 노출을 계속 시도하고 초과 시 알림이 만료됩니다."
- 숫자 입력 + 단위 셀렉트 **"일" / "시간" / "분" / "까지"**. 기본 `3 일`. 범위 최소 1, 최대 28일/672시간/40320분. "까지" 선택 시 날짜+시:분 입력(오늘 23:59 기본) + 우측에 브라우저 타임존 텍스트.
- 마지막 발송 값을 localStorage(`flarelane_push_ttl`)에 기억해 다음 진입 기본값으로 씀.

공통 **"발송 시간"**(`common:schedule`) 라디오 그룹:
1. **"지금 발송"**(`common:immediately`, 기본)
2. **"예약 발송"**(`common:specificTime`) - STARTER 플랜이면 disabled + 주황 **"UPGRADE"** 배지(hover "플랜 업그레이드 필요"). 선택 시 하위:
   - **"날짜"** 데이트피커 · **"시간"** `HH : mm` 두 칸(0~23, 0~59) · 타임존 검색 셀렉트 `(GMT+09:00) Asia/Seoul` 형식.
   - 초기값: 현재 시각 +1시간(23시면 다음날 0시), 분 = 현재 분, 타임존 = 브라우저 타임존(목록에 없으면 `America/New_York`).
3. **"반복 발송"**(`recurring-message:recurringMessage`) - 선택 시 하위:
   - **"반복 주기"** 셀렉트: "일" / "주" / "월"(DAILY/WEEKLY/MONTHLY). **"시간"** `HH:mm`. **"타임존"** 셀렉트.
   - WEEKLY: "매주 다음 요일에 반복" + 체크박스 월~일. MONTHLY: "매월 다음 날짜에 반복" + 1~31 원형 칩(29~31에 툴팁 "해당 월에 없는 일자는 그 달의 마지막 날로 예약됩니다. (2월의 30/31일 -> 2월 28일)").
   - **"발송 시작일"** 데이트피커(오늘 이후). **"발송 종료일"** 라디오 **"무기한"**(기본) / **"기간 선택"**(기본값 내일, 데이트피커).
   - 버튼 **"예상 발송 일정"**(secondary xs) → 모달 **"발송 예정일"**: 표 "순서 · 날짜 · 시간"(`yyyy.MM.dd`, `HH:mm (GMT+09:00) Asia/Seoul`), 5회분, `POST /recurring-messages/scheduled-dates {count:5, recurringConfig}`. 0건이면 빈 상태.
   - 기본값(`?config=recurring` 진입 포함): 매일, 현재 시:분, interval 1, 브라우저 타임존, 시작일 오늘, 종료 무기한.
- 라디오 간 전환 시 다른 설정은 null로 초기화.
- **빈도 제한 무시 체크박스**: 프로젝트에 해당 채널 빈도 제한(daily/weekly)이 활성일 때만 노출. 라벨 **"현재 설정된 발송 빈도 제한 무시 (1일 최대 {n}개, 1주 최대 {n}개)"**(요약 없으면 "현재 설정된 발송 빈도 제한 무시") + 도움말. 템플릿 적용 시 읽기전용.
- **발송 속도 제한 UI 없음**: 새 메시지 화면에 속도 입력은 없다. 대신 발송 확인 직전 프로젝트 `throttleConfig[채널]`(분당) 기준 24시간 용량(`86400 × floor(rate/60)`)을 넘는 추정 수가 있으면 `alert("현재 설정된 발송 속도 제한이 너무 낮습니다.\n24시간 이상 발송이 지연되는 경우 발송이 중단됩니다.\n예상 미발송 기기 수: {n}")`(확인만 있고 진행은 계속).

### 2.10 하단 버튼 · 발송 흐름
- **"임시 저장"** → 2.11. **주 버튼** 라벨: 반복 또는 예약이면 "저장", 아니면 "발송".
- 주 버튼 클릭 순서:
  1. 추정 수 로딩 중이면 무시.
  2. 대상/파일/전환 검증 → alert(`common:` 키): "대상을 선택해 주세요." / "파일이 올바르지 않습니다. 다시 확인해 주세요."(필요 변수 누락·파일 오류 시, 대상 섹션으로 스크롤) / 전환 오류 3종.
  3. 내용 없음 → **에러 토스트** "메시지 내용을 입력해 주세요."
  4. 보이지 않는 특수문자(U+2028, U+200B, U+FEFF, U+00A0) 포함 시 alert "{…앞5자} 와 {뒤5자…} 사이에 보이지 않는 특수문자가 포함되어 있습니다."
  5. 추정 수 재계산(파일 업로드 제외) → 속도 제한 alert(조건부) → **발송 정보 확인 모달** 오픈.
- **확인 모달**(모바일 전체화면, 로딩 중 배경클릭 무시): 제목 **"발송 정보 확인"**. 블록 순서:
  - "캠페인 명"(값 있을 때)
  - **"대상"**: (유저ID 탭) "플랫폼" = 선택 플랫폼 라벨 `앱(안드로이드), 앱(iOS), 웹(데스크탑), 웹(모바일)` 순 콤마 / 탭 이름 행("기기 세그먼트" 등)에 세그먼트 `A 그리고 B 또는 C`(혹은 ID 칩 목록, 혹은 파일명 + 미리보기 표 50행) / "제외된 세그먼트"(있을 때) / **"추정 기기 수"** `1,234` 또는 `123 (무작위 일부 발송 10%)`.
  - **"메시지"**: "제목" · "내용" · "URL" · "이미지"(썸네일, URL이 이미지가 아니면 "Invalid image") · "버튼"(`라벨 (링크)` 줄바꿈) · "데이터"(JSON 4칸 들여쓰기).
  - **"전환 이벤트 설정"**(설정 시): 이벤트별 "이벤트" / "기여 기간"(`3 일`) / "전환 측정 기준" / "이벤트 필터"(`key = value` 줄).
  - **"발송 설정"**: "발송 시간" = "지금 발송" | "예약 발송 (2026-10-09 10:30:00 - Asia/Seoul)" | "반복 발송"; "알림 만료 기간" = `3 일` 또는 `2026.10.08 23:59:00 까지`; "발송 빈도 제한 무시" = `TRUE`/`FALSE`(빈도 제한 활성 또는 true일 때); 반복이면 "반복 주기" `매일 09:00 (GMT+09:00) Asia/Seoul`(주간 `매주 월, 수요일 HH:mm`, 월간 `매월 1, 15일 HH:mm`) · "발송 시작일" · "발송 종료일"(무기한이면 "무기한").
  - 버튼: **"취소"**(secondary) · **"발송"/"저장"**(로딩 표시).
- 모달 확인 → `POST /notifications`(파일이면 먼저 `POST /notifications/upload-csv`, xlsx면 targetType `xlsx`; 이미지 파일이면 먼저 업로드) → 성공 토스트 + 이동:

| 경우 | 토스트 | 이동 |
|---|---|---|
| 예약 발송 | "메시지가 발송 예약되었습니다." | `/push/scheduled-messages` |
| 반복 발송 | "반복 발송 메시지가 저장되었습니다." | `/recurring-messages?status=draft` (as `/recurring-messages`) |
| 즉시 발송 | "메시지가 성공적으로 발송되었습니다." | `/push/sent-history/{응답 data.id}` |

- 성공 시 선택돼 있던 임시 저장본 삭제(`DELETE /message-drafts/{id}`), 폼 리셋, 이탈 확인 해제. 실패 시 모달 유지·추정 수 초기화.

### 2.11 임시 저장 (5채널 공통)
- 하단 **"임시 저장"** → 현재 폼을 `POST /message-drafts {channel, title: 캠페인명, payload}`(이미 불러온 저장본이면 `PUT /message-drafts/{id}`). 파일 대상이면 파일 먼저 업로드(실패 토스트 "CSV 파일 형식이 올바르지 않습니다."). 성공 토스트 **`"{캠페인명}"이 저장되었습니다.`**(캠페인명 없으면 "제목 없음").
- 헤더 **"임시 저장 N"** → 모달: 제목 **"임시 저장 N"** + X. 목록 행 = 제목(없으면 "제목 없음") / "마지막 저장 시간: yyyy.LL.dd HH:mm:ss". 현재 불러온 행은 우측 **"작성중"** 배지, 나머지는 hover 시 휴지통.
  - 행 클릭 → `confirm("저장된 메시지를 불러오시겠습니까?")` → 복원 후 모달 닫힘.
  - 휴지통 → `confirm("캠페인을 삭제하시겠습니까? 삭제된 글은 복구되지 않습니다.")` → 삭제.
  - 비었을 때: 빈 상태 일러스트 + **"임시 저장된 캠페인이 없습니다."**
- 진입 시 옛 localStorage 저장본(`tempPush_{projectId}` 등)이 있으면 `POST /message-drafts/migrate`로 이관 후 삭제.

### 2.12 기타 진입 동작
- **"최근 발송 메시지"** 모달: 제목 **"메시지 선택"** + 우측 발신 환경 드롭다운(콘솔/API/테스트/시스템, 기본 콘솔). 표 열 "발송 환경" · "메시지" · "발송 시간" · "발송" · "클릭률". `GET /notifications/search?senderSource={type}&page=1&per=20`. 행 클릭 → 템플릿 해제 + 메시지 내용 채움 + 모달 닫힘.
- **"템플릿 선택"** 모달: 제목 "템플릿 선택", 표 열 "이름"(카테고리 배지 + 이름) · "메시지"(제목/본문). 5개/페이지(`GET /templates?page&per=5`). 행 클릭 → 적용(2.4 읽기전용 규칙, 템플릿 플랫폼 반영).
- **"AI"** 모달(최소폭 800): 제목 **"AI 메시지 생성"**, 좌측 "메시지 키워드" / "입력한 키워드를 바탕으로 메시지와 이미지가 생성됩니다. 생성 후 자유롭게 변경이 가능합니다." / 칩 입력(최대 10, 빈 상태 예시 칩 "스니커즈", "15% 세일", "쿠폰", "NIKE") / **"생성"** 버튼 / `사용량/한도`. 우측 카드 목록(이미지·제목·본문·키워드 칩·좋아요/싫어요·hover 시 삭제 → `confirm("생성된 알림을 삭제합니다. 삭제된 알림은 복구할 수 없습니다.")`). 카드 클릭 → 제목·본문·이미지 채움. `GET/POST /ai/notifications`.
- **copyMessageId**: `GET /notifications/{id}`. 대상 타입이 `userIdCsvUrl`이면 `alert("API로 등록한 CSV URL 타입은 API로 수정 가능합니다.")` 후 `/push/sent-history`로 이동. 그 외 대상·TTL·빈도 무시·캠페인명 복원, `templateId`가 있으면 템플릿 적용, 없으면 메시지 내용·전환 설정 복원.

---

## 3. 알림톡 새 메시지 (`/alimtalk/new-message`) - 푸시 대비 차이

- **대상 탭**: **"유저 세그먼트"** · **"유저 ID"** · **"전화번호"**(placeholder "전화번호 입력") · **"파일 업로드"**(첫 열 `phoneNumber`). 고급 설정(무작위 일부 발송) **없음**, 발송 플랫폼 없음.
- 추정 수 라벨 **"추정 유저 수"**, 전화번호·파일 탭에서는 숨김. `POST /users/count {userIds|segmentIds, excludeSegmentIds, hasPhoneNumber:true}`(1초 디바운스).
- 파일 가이드 링크 `https://docs.flarelane.co.kr/kakao-alimtalk-overview#WxG22`; 필요 변수 = 템플릿 개인화 변수 키.
- **섹션 3 "메시지"**: 보조 버튼 **"템플릿 선택"**(`kakao:selectTemplate`)만. 템플릿 없으면 큰 `+` 박스(클릭 시 모달).
  - 템플릿 선택 모달: 제목 "템플릿 선택", 좌측 목록(템플릿 코드 / 이름, 선택 시 브랜드 테두리, 5개/페이지, 처음·끝 버튼 없음) + 우측 "미리보기". 버튼 "취소" / "확인"(선택 전 disabled). **검수 완료(COM)만** 조회(`GET /alimtalk-template?inspection=COM&page&per=5`).
  - 적용 후: **"카테고리"**(그룹 > 이름) / **"템플릿 이름"** / **"템플릿 코드"** 표시, **"개인화 변수 설정"** = 템플릿 제목·본문·버튼 URL·헤더·아이템에서 `#{변수}` 추출한 키마다 한 줄(키 라벨 + 값 입력, `{}` 버튼 사용 가능), 접이식 **"템플릿 상세"**(읽기전용 템플릿 폼).
  - 우측 **"미리보기"**(카카오 말풍선; AD/MI형은 안내 문구 "채널 추가하고 이 채널의 마케팅 메시지 등을 카카오톡으로 받기") + **"테스트 발송"**(secondary xs).
- 섹션 5에 TTL 없음. 전환 측정 기준은 "발송 기반"만.
- 주 버튼 **disabled 조건**: 템플릿 미선택 또는 발신 프로필 0개(`GET /kakao/sender`). 클릭 시 검증 → 발신프로필 없으면 alert "발신프로필을 먼저 등록해 주세요." → 확인 모달(추정 수 재계산 없이 현재 값 사용).
- 확인 모달 "메시지" 블록: "템플릿 이름" | "템플릿 코드"(한 줄 2칸) + "개인화 변수 설정"(`키: 값` 줄).
- 발송: `POST /alimtalk`(파일은 `/alimtalk/upload-csv`; 파일 대상이면 interpolations `{}`로 보냄). 성공 이동: 예약 `/alimtalk/scheduled-messages`, 반복 `/recurring-messages?status=draft`, 즉시 `/alimtalk/sent-history/{id}`. 토스트 문구는 푸시와 동일.
- copyMessageId: `GET /alimtalk/{id}` → 대상(전화번호 CSV)·템플릿(`GET /alimtalk-template/{templateId}`)·변수·전환·빈도 무시 복원.

### 3.1 카카오/SMS 테스트 발송 모달 (알림톡·브랜드메시지·SMS 공통)
- 제목 **"테스트 발송"**, 설명 "메시지 발송 전에 테스트 발송을 진행할 수 있도록 지원합니다.\n실제 발송 전 메시지 내용을 확인하고, 오류를 사전에 방지할 수 있습니다."
- 라디오 **"유저 ID"**(기본) / **"전화번호"**(바꾸면 입력 비움). 유저 ID: 입력(placeholder "유저 ID를 입력해 주세요") + **"조회"**(유저 상세 모달). 전화번호: 입력(placeholder "전화번호(+821000000000)를 입력하세요").
- 버튼 **"닫기"** · **"발송"**. 우측 하단 링크 **"테스트 발송 내역"**(새 창 `/{alimtalk|friendtalk|sms}/sent-history?s=testDevice&p=1`).
- 발송 → 성공 시 `alert("발송 되었습니다.")` → 진행 바 표시(라벨 "대기" + 상태 "발송 중"(회색)/"실패"(빨강)/"발송 완료"(브랜드)), 1초마다 `GET /{alimtalk|friendtalk|sms}/{id}`로 `waiting = selected - sent - (failed+aborted)` 0 될 때까지 폴링. 마지막 입력값/타입 localStorage 기억.

---

## 4. 브랜드메시지(친구톡) 새 메시지 (`/friendtalk/new-message`) - 차이

- 대상: 알림톡과 동일(유저 세그먼트/유저 ID/전화번호/파일 업로드, 추정 유저 수). 대상 아래 **"수신자 타겟팅"** 라디오(도움말 팝오버: 이미지 + "허용 타입: M,N,I (F는 미지원)" 목록 + "타겟팅(M,N) 선택은 승인된 프로젝트만 가능"):
  - "선택한 유저 전체에게 발송 (M)" · "선택한 유저 중 채널친구를 제외하고 발송 (N)" - 발신 프로필 `kakaoBrandMessagePermission`이 false면 disabled
  - "선택한 유저 중 채널친구에게 발송 (I)" - **기본값**
- 발신 프로필은 선택 UI 없이 `GET /kakao/sender` 첫 번째 사용. 없으면 주 버튼 disabled.
- **메시지 편집기**:
  - **"메시지 유형"** 셀렉트(클릭 시 우측 패널) - 패널 제목 **"메시지 유형 선택하기"** + 설명 "다양한 기능의 메시지 유형을 이용해 고객 맞춤형 메시지를 직접 만들어 보세요.\n원하는 유형을 선택하면 작성 화면으로 이동합니다." 카드 5개(`/images/Type_{FI|FW|FL|FA|FC}.svg` 240px + 제목/설명): **"기본 텍스트형"**(이미지, 버튼 첨부가 가능한\n기본형 메시지입니다.) · **"와이드 이미지형"** · **"와이드 리스트형"** · **"캐러셀 커머스형"** · **"캐러셀 피드형"**. 버튼 "취소"/"확인". 유형 변경 시 메시지 내용 초기화(FL은 빈 리스트 항목 3개 생성, FA는 인트로 빈 값 생성).
  - 기본값: **FI**. 기본 텍스트형에 이미지가 없으면 발송 시 `FT`로 전송.
  - 유형별 필드·한도:

| 유형 | 필드 | 본문 최대 | 버튼 최대 | 비고 |
|---|---|---|---|---|
| FI/FT | 이미지(+이미지 링크) · "내용" · "버튼" | 400자 / 100줄 | 5 (이름 "최대 14자") | 이미지 안내 "권장 사이즈: 가로 최소 500px, 2:1 비율 / 지원 파일: jpg, jpeg, png (최대 300KB)" |
| FW | 이미지 · "내용" · "버튼" | 76자 / 6줄 | 2 (이름 "최대 8자") | 이미지 필수, "가로 800px, 세로 600px … (최대 2MB)" |
| FL | "타이틀"(헤더, 최대 20자) · 리스트 항목 3~4개(이미지·링크·내용) · 버튼 | 첫 항목 25자, 이후 30자 / 2줄 | 2 | 첫 항목 이미지 1000×500, 이후 500×500. "+ 리스트 항목 추가", 4번째만 "삭제" |
| FA | "인트로" 토글(이미지·타이틀·내용·링크) · 캐러셀 2~6개(이미지·상품명·정상 가격·할인 가격·할인율·부가 정보·버튼) · "더보기" 토글 | 인트로 내용 50자 | 캐러셀당 2 | 모든 캐러셀 이미지 비율 동일 필수 |
| FC | 캐러셀 2~6개(이미지·타이틀·내용·버튼) · "더보기" 토글 | 180자 / 11줄 | 캐러셀당 2 | "캐러셀은 최소 2개 / 최대 6개까지 설정 가능…" |

  - 버튼 유형: **"웹 링크"**(Mobile/PC URL) · **"앱 링크"**(Android/iOS scheme + Mobile/PC URL). URL 최대 1000자, placeholder `https://` / `scheme://`.
  - 캐러셀 탭: "캐러셀 1"…, 드래그 정렬, **"추가하기"**(최대 6개), 각 "캐러셀{n} 삭제".
  - 하단 토글 2개: **"광고성 메시지"**(기본 ON, 도움말 "광고성 내용이 포함된 경우 체크해 주세요.") - FL·캐러셀형·타겟팅 M/N이면 바꾸려 할 때 `alert("해당 메시지 타입은 광고성 메시지입니다.")`. **"연령 인증 메시지"**(기본 OFF, 도움말).
  - 이미지 업로드: `POST /friendtalk/images/{FI|FW|FL/first|FL/other|FA|FC}`.
- 미리보기: 카카오 목업("(광고)", "발신 프로필", "수신거부 | 홈 > 채널 차단" 또는 브랜드메시지면 "무료수신거부 {serviceNumber}") + "테스트 발송"(3.1).
- 발송 전 검증 alert(`kakao:`): "캐러셀은 최소 2개 이상 입력해야 합니다." / "메시지에 빈값이 존재합니다." / "이미지는 필수 값입니다." / "버튼에 빈값이 존재합니다." / "메시지 리스트에 빈값이 존재합니다." / "금액을 확인해 주세요. 판매 가격은 정상가보다 낮게 입력해 주세요." / "캐러셀 커머스형은 모든 캐러셀 이미지의 비율이 같아야 합니다."(업로드 시)
- 확인 모달 "대상"에 "수신자 타겟팅" 행 추가. "메시지": "메시지 유형" · 유형별 본문(이미지/내용, 타이틀/리스트 항목 n, 인트로/캐러셀 n/더보기) · "버튼"(유형·이름·링크) · "광고성 메시지" `TRUE/FALSE` · "연령 인증 메시지" `TRUE/FALSE`.
- 발송 `POST /friendtalk`(파일 `/friendtalk/upload-csv`). 이동: 예약 `/friendtalk/scheduled-messages`, 반복 `/recurring-messages?status=draft`, 즉시 `/friendtalk/sent-history/{id}`.
- copyMessageId: `GET /friendtalk/{id}`.

---

## 5. SMS 새 메시지 (`/sms/new-message`) - 차이

- 대상: 알림톡과 동일. 파일 가이드 `https://docs.flarelane.co.kr/sms-overview#w9MmL`, 필요 변수 = 제목·본문의 Liquid 변수.
- 주 버튼 disabled: projectDetail `smsSenderNumber` 없음(클릭 경로 alert "발신번호를 먼저 등록해 주세요.").
- **메시지 편집기**(좌) + 미리보기(우):
  1. **"광고성 메시지"** 토글 - **기본 ON**.
  2. **"제목"** - 유형이 LMS/MMS일 때만 노출. 한 줄, 40자 초과 입력은 무시(카운터 없음).
  3. **"내용"** + 유형 배지(**SMS / LMS / MMS**) - 박스형 텍스트영역(최소 높이 204, 최대 1000자). placeholder(하드코딩, 줄바꿈 포함): "1. SMS : 단문 메세지 (90 바이트, 띄어쓰기 포함) … 2. LMS : 이미지가 첨부되지 않은 장문 메세지 (2,000 바이트, 띄어쓰기 포함) … 3. MMS : 이미지를 포함한 장문 메세지 (2,000 바이트, 띄어쓰기 포함_jpg,jpeg 파일 300kb) … * 개인화 메시지를 발송하면 LMS로 차감 후, 실제 발송 결과에 따라 비용이 재조정됩니다." 아래 카운터 **`{bytes}/2000 byte`**.
  4. **"이미지"** - "업로드" 버튼 → `POST /sms/upload-file` → "업로드됨" 칩 + X, hover 미리보기.
- **바이트·유형 계산**: 광고 ON이면 실제 본문 = `"(광고) [{smsSenderName}]\n" + 본문 + "\n무료수신거부: {smsUnsubscribeServiceNumber}"`. 바이트 = ASCII 1, 그 외 2(카운터도 이 전체 텍스트 기준). 유형 = 이미지 있으면 **MMS**, 아니면 (제목 있음 또는 >90바이트 또는 `{{ }}`/`{% %}` 포함) **LMS**, 그 외 **SMS**.
- 미리보기: SMS 목업 배경(320×382) 안에 이미지 + (제목 있거나 SMS 아님이면 제목 줄, 비면 "제목없음") + `"[Web발신]\n" + 위 전체 텍스트`.
- 발송 전 인코딩 검사: `POST sms/validate-encoding {title, body}` → 사용 불가 문자가 있으면 `confirm("문자 메시지에서 사용할 수 없는 문자가 있습니다.\n제목: …\n내용: …\n* 해당 글자는 \"?, �\" 등으로 표시될 수 있습니다.\n\n발송하시겠습니까?")`(하드코딩). 테스트 발송에도 동일.
- 확인 모달 "메시지": "광고성 메시지" `TRUE/FALSE` · "내용"(광고 문구 붙은 전체 텍스트, pre-wrap) · 이미지. (번들상 확인 모달에 제목은 전달되지 않아 "제목" 행이 안 나옴.)
- 발송 `POST /sms`(파일 `/sms/upload-csv`). 이동: 예약 `/sms/scheduled-messages`, 반복 `/recurring-messages?status=draft`, 즉시 `/sms/sent-history/{id}`.
- copyMessageId: `GET /sms/{id}` → 본문에서 광고 머리/꼬리 문구 제거 후 채움, 이미지 `GET /sms/file/{fileId}`.

---

## 6. 이메일 새 메시지 (`/email/new-message`) - 차이

- 대상 탭: **"유저 세그먼트"** · **"유저 ID"** · **"이메일"**(placeholder "이메일 입력") · **"파일 업로드"**(첫 열 `email`). 추정 유저 수는 이메일·파일 탭에서 숨김(`hasEmail:true`). 가이드 `https://docs.flarelane.co.kr/email-overview#csv`.
- **메시지 섹션**(미리보기 열 없음):
  - 본문 카드: 본문이 없으면 점선 박스 ⊕ **"이메일 본문 추가하기"** → 템플릿 선택 모달. 있으면 iframe 축소 미리보기 + 우상단 X(본문·json·templateId 비움).
  - **"발신자 정보"** 검색 셀렉트 placeholder **"발신자 이메일(도메인 주소)"**, 옵션 = `GET /email-domains`의 각 `emailAddresses` → `email (displayName)`. 없으면 "(확인된 발신자 이메일 없음)".
  - **"이메일 제목"** 한 줄(`{}` 버튼), placeholder "이메일 제목".
  - 본문이 있으면 아래 줄: 본문 텍스트 요약(태그 제거 200자) · **"미리보기"**(secondary sm) · **"편집"**(sm).
- **템플릿 선택 모달**: 제목 **"템플릿 선택"**, 탭 **"빠른 시작"**(프리셋, `GET /email-template-presets?page&per=8`) / **"내 템플릿"**(`GET /email-templates?page&per=8`). 좌측 썸네일 그리드(프리셋 이름은 `email:presetTitle.*`: "빈 페이지에서 시작하기", "이미지 포스터형", "종합형1", "종합형2", "아이템 리스트형1/2", "뉴스레터형1/2", "CTA 강조형", "텍스트형"), 우측 미리보기(미선택 시 "템플릿 미리보기"). 버튼 "취소" / **"선택"**. 내 템플릿 선택 시 templateId 연결 + 템플릿 전환 설정 복사 → **전환 이벤트 섹션 읽기전용**.
- **미리보기 모달**: 제목 "이메일 미리보기" + 이메일 제목, 데스크탑/모바일 토글 아이콘, iframe.
- **편집**: 전체화면 Unlayer 이메일 에디터(ko-KR). 상단 바에 편집 제목 · **"테스트 발송"** · **"완료"**. 완료 시 감사(audit) 실패면 에러 토스트 "이메일 템플릿이 유효하지 않습니다."; 푸터 블록·수신거부 링크 없으면 에디터 경고("Footer block이 없습니다." / "수신거부 링크가 없습니다."). 병합 태그 "개인화 변수"는 2.5 모달로 `{{ key | default: "x" | escape }}` 삽입. 이미지 업로드는 `upload-image`.
  - 에디터 내 테스트 발송 모달: "발신자 선택" 셀렉트 + "수신 이메일 입력"(placeholder "이메일을 입력하세요.") → 빈 값이면 alert "빈 값이 존재합니다.", 성공 alert "발송 되었습니다."
- 섹션 5: TTL 없음. 하단 "임시 저장"은 tertiary. 헤더 "임시 저장 N"은 반복 모드에서도 보임.
- 검증: 대상/전환 공통 + 제목·본문·json·발신자 중 빈 값이면 alert **"빈 값이 존재합니다."**
- 확인 모달 "메시지": "발신자 정보" · "이메일 제목" · "이메일 본문"(축소 iframe).
- 발송 `POST /emails`(파일 `/emails/upload-csv`). 이동: 예약 `/email/scheduled-messages`, 반복 `/recurring-messages?status=draft`, 즉시 `/email/sent-history/{id}`.
- copyMessageId: `GET /emails/{id}`.

---

## 7. 채널 비교 요약

| 항목 | 푸시 | 알림톡 | 브랜드메시지 | SMS | 이메일 |
|---|---|---|---|---|---|
| 대상 탭 | 기기 세그먼트/유저 ID/기기/파일 | 유저 세그먼트/유저 ID/전화번호/파일 | 좌동 | 좌동 | 유저 세그먼트/유저 ID/이메일/파일 |
| 추정 라벨 | 추정 기기 수 | 추정 유저 수 | 추정 유저 수 | 추정 유저 수 | 추정 유저 수 |
| 무작위 일부 발송 | O | X | X | X | X |
| 발송 플랫폼 | 유저 ID 탭에서 O | X | X | X | X |
| 미리보기 열 | 앱/웹 푸시 | 카카오 | 카카오 | SMS | 없음(모달) |
| 테스트 발송 | 테스트 기기/유저 ID | 3.1 | 3.1 | 3.1 | 에디터 안 |
| 템플릿 | 푸시 템플릿 모달 | 검수완료 템플릿 필수 | X | X | 프리셋/내 템플릿 |
| TTL | O | X | X | X | X |
| 전환 측정 기준 | 클릭/발송 | 발송 | 발송 | 발송 | 클릭/발송 |
| 주 버튼 disabled | - | 템플릿·프로필 없음 | 프로필 없음 | 발신번호 없음 | - |

---

## 8. 템플릿 화면

### 8.1 푸시 템플릿 목록 (`/push/templates`)
- 헤더 좌: **"템플릿"**(`template:category`) + 도움말(`template-help:help.template`), 아래 회색 **"통계는 최근 30일 기준이며, 템플릿별로 더욱 상세한 통계 확인이 가능합니다."** 헤더 우: **"새 템플릿"**(xs) → `/push/templates/new`.
- 검색: 돋보기 아이콘 입력(폭 420, maxLength 100), placeholder **"템플릿명, ID 검색"**. 입력 300ms 디바운스로 URL `?sk=` 갱신(shallow replace), Enter 즉시. 페이지는 URL이 아닌 내부 상태(검색어 바뀌면 1로).
- 목록 `GET /templates?page&per=10&searchKeyword`. 비면 빈 상태, 로딩 중 스피너. 페이지네이션 10개/5버튼(목록 있을 때만).
- 카드(클릭 → `/push/templates/{id}`): ① 카테고리 배지(색) + 이름 ② 메시지 미리보기(제목/본문/URL·이미지) ③ "최근 수정 시간" `updatedAt` · "플랫폼" 아이콘(targetPlatforms 또는 selected* > 0; 없으면 4개 모두) ④ 통계 2×2: "발송" `sentTotal` · "클릭" `clickedTotal`(%) / "전환" `conversionTotal`(%) · "구매 총액" - 전환 값은 카드가 보일 때 `GET /templates/{id}/conversion-stats?(최근 30일)` ⑤ ⋯ 메뉴.
- ⋯ 메뉴: **"상세 정보"** → `/push/templates/{id}` · **"수정"** → `/push/templates/{id}/edit` · **"삭제"**(빨강) → 모달 "템플릿을 삭제하시겠습니까?" / "삭제된 템플릿은 복구할 수 없습니다." / "취소" · "삭제"(destructive) → `DELETE /templates/{id}` → 목록 재조회(토스트 없음).

### 8.2 푸시 템플릿 생성·수정 (`/push/templates/new`, `/[templateId]/edit`)
- 제목 "새 템플릿" / "템플릿 수정". 좌측 폼 + 우측 미리보기(2.6, "테스트 기기로 발송" 포함 → 2.7 흐름).
- 필드 순서: **"이름"**(placeholder "템플릿 이름") | **"카테고리"** 셀렉트(placeholder "카테고리 선택"; 옵션 = 색 배지, 각 옵션 우측 메뉴 "수정"/"삭제", 맨 아래 **"새 카테고리"**) → **"발송 플랫폼"**(2.3) → **"메시지"** + AI 버튼 → 2.4 메시지 필드(편집 가능) → **"전환 이벤트 설정"**(2.8) → 빈도 제한 무시 체크박스(활성 시).
- 카테고리 모달: 제목 "새 카테고리"/"카테고리 수정", 이름 입력(placeholder "카테고리 이름") + 색 셀렉트(placeholder "카테고리 색상 선택"), 버튼 "취소" · "추가"/"수정". 빈 값 → 에러 토스트 "카테고리 이름과 색을 모두 입력해 주세요." 성공 토스트는 번들/로케일 그대로 **신규 시 "카테고리가 수정되었습니다.", 수정 시 "카테고리가 추가되었습니다."**(키와 문구가 뒤바뀐 상태). 카테고리 삭제는 확인 없이 `DELETE /templateCategories/{id}`.
- 하단 "취소"(→ `/push/templates/{id 또는 빈값}`) · **"저장"**.
- 저장 검증 토스트: "템플릿 이름을 입력해 주세요." / "메시지 내용을 입력해 주세요." / 특수문자 alert.
- 신규: `POST /templates` → 토스트 "템플릿이 추가되었습니다." → `/push/templates`.
- 수정: 확인 모달 "템플릿을 수정하시겠습니까?" + "템플릿을 사용하여 발송 예약된 메시지가 있다면 해당 내용도 함께 변경됩니다." / "취소" · "확인" → `PATCH /templates/{id}` → 토스트 "템플릿이 수정되었습니다." → `/push/templates/{id}`.
- 상세(`/push/templates/[templateId]`): 제목 "템플릿 상세 정보", "정보"(카테고리·이름·생성 시간·최근 수정 시간·발송 플랫폼), "메시지", "전환 이벤트 설정", "분석", 버튼 "삭제"·"수정"(→ `/edit`). 템플릿으로 바로 발송하는 링크는 없음.

### 8.3 이메일 템플릿 목록 (`/email/templates`)
- 헤더 좌 "템플릿", 우측 **"데이터 기간 필터"** 라벨 + 기간 선택(기본 최근 30일) + **"새 템플릿"** → `/email/templates/new`.
- 검색 placeholder **"템플릿명 검색"**(8.1과 같은 검색 동작). `GET /email-templates?page&per=10&timeZone&searchKeyword&(기간)`.
- 카드(클릭/Ctrl 클릭 새 탭 → `/email/templates/{id}`): iframe 썸네일 · 제목(2줄) · "최근 수정 시간"(값은 `createdAt`) · 통계 "발송"/"실패"/"읽음"/"전환"/"구매 총액"(카드 노출 시 500~2000ms 랜덤 지연 후 `GET /email-templates/{id}/stats`).
- ⋯ 메뉴: **"복제"** → `/email/templates/new?copyMessageId={id}` · **"수정"** → `/{id}/edit` · **"삭제"** → 8.1과 같은 삭제 모달 → `DELETE /email-templates/{id}`.

### 8.4 이메일 템플릿 생성·수정
- 제목 **"새 이메일 템플릿"** / **"이메일 템플릿 수정"**. 필드: **"이름"**(placeholder "템플릿 이름") → **"메시지"**(6장 본문 카드 + 미리보기/편집; 추가 모달은 "빠른 시작" 탭만, 제목 "기본 제공 템플릿으로 시작하기") → **"전환 이벤트 설정"**.
- 하단 "취소"(→ `/email/templates`) · "저장". 이름·본문·json 비면 에러 토스트 **"빈 값이 존재합니다."** 성공(신규 `POST`, 수정 `PUT /email-templates/{id}`) 모두 토스트 **"템플릿이 추가되었습니다."** → `/email/templates/{id}`.
- 상세: "템플릿 상세 정보" / "정보"(템플릿 이름·생성 시간·최근 수정 시간) / "메시지" / "전환 이벤트 설정", 버튼 "삭제"·"수정", 복제 동작 동일.

### 8.5 알림톡 템플릿 목록 (`/alimtalk/templates`)
- 헤더 "템플릿" + **"새 템플릿"**(링크 `/alimtalk/templates/new`). 검색: 입력(maxLength 100, placeholder **"템플릿명, 코드 검색"**) + **"검색"** 버튼(Enter 동일).
- **검수 상태 탭**(순서 고정): **"검수 완료 (n)"** `COM`(기본) · **"검수 중 (n)"** `REQ` · **"반려됨 (n)"** `REJ` · **"검수 전 (n)"** `TMP`(TMP+APL 합산). 라벨과 괄호 사이 공백 있음. 숫자 = `meta.countByTemplateInspection`.
- URL: `p`(페이지), `isp`(상태, 무효면 COM), `sk`(encodeURIComponent). 탭 클릭 → `{isp, sk 유지, p=1}` push. 검색 → `{sk, isp 유지, p=1}`. 페이지 → `{p, sk}`.
- `GET /alimtalk-template?page&per=10&inspection&searchKeyword`. 페이지네이션 처음/끝 버튼 없음.
- 행(⋯ 메뉴 없음, 클릭/Ctrl 클릭 → `/alimtalk/templates/{id}`): 상태 배지(아이콘+라벨; 검수 전 회색, 검수 중 앰버, 검수 완료 초록, 반려됨 빨강) · 템플릿 이름 / 본문 · "생성 시간" · 통계 2×2 "전체 유저" `selected` · "발송 유저" `sent` / "전환 유저" `convertedUniqueUser` · "ROAS" `roas%`.

### 8.6 알림톡 템플릿 상세 · 검수 요청 (`/alimtalk/templates/[id]`)
- 헤더: 뒤로가기(→ 목록) + **"템플릿 상세 정보"**.
- **"정보"** 표: "ID" | "발신 프로필"(plusFriendId + 회색 이름) / "카테고리" | "상태"(배지) / "템플릿 이름" | "템플릿 코드" / "생성 시간" | "최근 업데이트". 반려(REJ)면 빨간 박스 **"심사 반려되었습니다."** + 마지막 코멘트 본문.
- **"메시지"**: 읽기전용 템플릿 폼 + "미리보기". 아래 버튼:
  - TMP/APL/REJ: **"수정"**(REJ는 라벨 **"재검수 요청"**) → `/alimtalk/templates/{id}/edit`
  - REQ: 회색 문구 **"검수 중인 템플릿은 수정이 불가합니다."**
- TMP/APL일 때 **검수 요청 카드**: 제목 "검수 요청", "내용" 텍스트영역(코멘트) + **"검수 요청"**(xl) → `confirm("검수 요청을 하시겠습니까?")` → `PATCH /alimtalk-template/{id}/request-inspection`(FormData `comment`; 첨부 상태는 있으나 전송 안 함) → 상세 재조회(토스트 없음).
- COM일 때 **"분석"** 섹션(통계·실패 상세 모달·실패 CSV 다운로드 `GET /alimtalk-template/{id}/failure`).
- TMP/APL/REJ: 하단 **"템플릿 삭제"**(secondary destructive) → `confirm("정말 삭제하시겠습니까?")` → `DELETE /alimtalk-template/{id}` → `/alimtalk/templates`.

### 8.7 알림톡 템플릿 생성·수정 (`/new`, `/[id]/edit` 같은 컴포넌트)
- 제목은 수정 화면에서도 **"새 템플릿"**(번들 그대로).
- 상단 정보: **"발신 프로필"** 셀렉트(옵션 plusFriendId / 이름) · **"카테고리"** 셀렉트 2단(그룹 → 하위 이름; `GET /alimtalk-template/category`) · **"템플릿 이름"**(placeholder "템플릿 이름 200자") · **"템플릿 코드"**(placeholder "템플릿 코드 20자 (영문, 숫자, -, _)").
- **"메시지"** 폼 + 우측 "미리보기":
  - **"강조유형"**: 기본형 / 강조 표기형 / 이미지형 / 아이템 리스트형. **"메시지 유형"**: 기본형 / 부가 정보형 / 채널 추가형 / 복합형.
  - 이미지형·아이템 리스트형: "이미지" 업로드(실패 alert "이미지 업로드에 실패했습니다.").
  - 아이템 리스트형: 헤더·하이라이트·아이템 리스트·요약 하위 폼(placeholder 예 "최대 16자, 변수 사용 가능", "최대 30자(썸네일 추가 시 최대 21자), 변수 사용 가능", "최대 6자, 변수 사용 불가", "최대 14자(숫자, 통화기호, …)").
  - 강조 표기형: "제목" `n/50자`, "부제목" `n/50자`.
  - "내용" 텍스트영역 `n/1000자`(최대 1000).
  - 부가 정보형·복합형: "부가 정보" `n/500자`. 채널 추가형·복합형: "안내 멘트"(고정 문구 읽기전용).
  - "버튼": 행 편집기 + **"+ 버튼 추가"**(최대 5개). 유형 웹 링크/앱 링크/채널 추가/배송 조회/봇키워드/메시지 전달/상담톡 전환/챗봇 전환/플러그인 3종/비즈폼.
  - **"보안 템플릿"** 토글 + 도움말(" 메시지 내용은 모바일 기기에서만 확인 가능하며, …").
- 하단 "취소"(→ `/alimtalk/templates`) · "저장". 검증 alert(하드코딩): "버튼은 최대 5개까지 추가 가능합니다." / 아이템 리스트형 "아이템 리스트형은 헤더, 아이템 하이라이트, 아이템 리스트, 이미지 중 1개 이상 입력이 필요합니다." / "아이템 리스트는 2개 이상 입력이 필요합니다." / "아이템 리스트의 각 항목은 title, description 모두 입력이 필요합니다." / "아이템 요약정보는 아이템 리스트가 존재할 경우에만 사용 가능합니다." / "아이템 요약정보의 title, description 모두 입력이 필요합니다." + 특수문자 alert.
- 저장: 신규 `POST /alimtalk-template`, 수정 `PATCH /alimtalk-template/{id}`(AD·MI형은 `templateAd` 고정 문구 추가, 버튼에 ordering 부여) → 토스트 없이 `/alimtalk/templates/{id}`.

---

## 9. 목업용 GET 엔드포인트 · 응답 필드

(base `…/v1/projects/{projectId}`; 새 메시지 화면이 실제로 읽는 필드만)

| 용도 | 요청 | 쓰는 응답 필드 |
|---|---|---|
| 프로젝트 상세(공통) | `GET ""`(base 자체) | `data.frequencyCappingConfig[PUSH|KAKAO_ALIMTALK|KAKAO_BRAND_MESSAGE|SMS|EMAIL].{daily,weekly}.{active,maxCount}`, `throttleConfig[채널]`, `smsSenderNumber`, `smsSenderName`, `smsUnsubscribeServiceNumber`, `purchaseConversionConfig.{eventType,attributionWindowHours,currency}` |
| 플랜 | `GET /subscription-plan` | `data.planName`(`STARTER`면 예약 발송 잠금) |
| 세그먼트 | `GET /segments?targetType=Device|User` | `data[].{id,name,type}` |
| 추정 기기 수 | `POST /notifications/estimated-devices-count` | `data.count` |
| 추정 유저 수 | `POST /users/count` | `data.count` |
| 유저 조회(테스트) | `GET /users/{userId}` | 유저 상세(404 허용) |
| 태그 / 이벤트 | `GET /data-management/tags?page=1&per=500`, `GET /data-management/events?page=1&per=500` | `data[].{id,name,description,hidden,readOnly}` |
| 이벤트 데이터 키 | `GET /data-management/events/{event}/data/keys` | 전환 필터 키 |
| 웹푸시 설정(미리보기) | `GET web-push-config` | `data.{siteName,originSiteUrl,proxySubdomain,siteIcon}` |
| 테스트 기기 | `GET /devices/search?isTest=true&ignoreSubscribed=true&page&per=20` | `data[].{id,testName,platform,deviceModel,osVersion,browser,createdAt,lastActiveAt,userId,isSubscribed}`, `meta.totalCount` |
| 푸시 템플릿 | `GET /templates?page&per=5|10&searchKeyword`, `GET /templates/{id}` | `data[].{id,name,category{id,name,color},notification{title,body,url,imageUrl,buttons,data,targetPlatforms,ignoreFrequencyCapping},conversionConfigs,updatedAt,createdAt,sentTotal,clickedTotal,selectedAndroid…}`, `meta.totalCount` |
| 템플릿 카테고리 | `GET /templateCategories` | `data[].{id,name,color}` |
| 템플릿 전환 | `GET /templates/{id}/conversion-stats?(기간)` | `data.{conversionTotal,purchaseAmountTotal}` |
| 최근 발송 메시지 | `GET /notifications/search?senderSource&page=1&per=20` | `data[].{id,senderSource,title,body,url,imageUrl,createdAt,sentTotal,failedTotal,selectedTotal,…}` |
| 복제 원본 | `GET /notifications/{id}`, `/alimtalk/{id}`, `/friendtalk/{id}`, `/sms/{id}`, `/emails/{id}` | 각 발송 바디와 같은 필드(`targetType,targetIds,segmentIds,excludeSegmentIds,campaignName,…`) |
| AI 생성 | `GET /ai/notifications?per=50&page=1` | `data[].{id,createdAt,like,hidden,userInput[],notification{title,body,imageUrl}}`, `meta.{usage,limit}` |
| 임시 저장 | `GET /message-drafts?channel=PUSH|KAKAO_ALIMTALK|KAKAO_BRAND_MESSAGE|SMS|EMAIL`, `GET /message-drafts/{id}` | `data[].{id,title,updatedAt}`, 상세 `data.payload` |
| 카카오 발신 프로필 | `GET /kakao/sender` | `data[].{id,plusFriendId,plusFriendName,kakaoBrandMessagePermission}` |
| 알림톡 템플릿 | `GET /alimtalk-template?page&per&inspection&searchKeyword`, `GET /alimtalk-template/{id}`, `GET /alimtalk-template/category` | `data[].{id,templateName,templateCode,templateContent,templateTitle,templateSubtitle,templateExtra,templateImageUrl,templateEmphasizeType,templateMessageType,templateHeader,templateItem,templateItemHighlight,buttons,securityFlag,inspectionStatus,categoryCode,categoryName,plusFriendId,plusFriendName,comments[],createdAt,updatedAt,selected,sent,convertedUniqueUser,roas}`, `meta.{totalCount,countByTemplateInspection{APL,REQ,COM,REJ,TMP}}`; 카테고리 `data[].{code,name,groupName}` |
| SMS 이미지 | `GET /sms/file/{fileId}` | `data.{id,url}` |
| 이메일 발신자 | `GET /email-domains` | `data[].emailAddresses[].{email,displayName}` |
| 이메일 템플릿 | `GET /email-template-presets?page&per=8`, `GET /email-templates?page&per&timeZone&searchKeyword`, `GET /email-templates/{id}`, `GET /email-templates/{id}/stats` | `data[].{id,title,body,json,conversionConfigs,createdAt}`, `meta.totalCount`; stats `{delivered…,failed,read,converted,purchaseAmount}` 계열 |
| 반복 예상 일정 | `POST /recurring-messages/scheduled-dates {count:5,recurringConfig}` | `data.scheduledDates[]`(ISO) |
| 테스트 진행 폴링 | `GET /alimtalk/{id}`, `/friendtalk/{id}`, `/sms/{id}` | `data.{selected,sent|sentTotal,failed,aborted}` |

발송(쓰기) 엔드포인트 참고: `POST /notifications`, `/alimtalk`, `/friendtalk`, `/sms`, `/emails`(+ 각 `/upload-csv`), `POST upload-image`, `POST /sms/upload-file`, `POST /friendtalk/images/{type}`, `POST sms/validate-encoding`, `POST /csv/sample`, `POST|PUT|DELETE /message-drafts`, 템플릿 `POST/PATCH/DELETE /templates`, `/templateCategories`, `/alimtalk-template`, `PATCH /alimtalk-template/{id}/request-inspection`, `POST/PUT/DELETE /email-templates`.

---

## 10. 확인 못 한 것

- 시각 스타일 세부(색 토큰 외 정확한 간격·폰트 크기), 데이트피커 달력 UI, 토스트 노출 시간·위치.
- 유저 상세 모달(테스트 발송 "조회" 결과 화면)의 내용·테스트 발송 버튼 배치.
- 모바일 전체화면 미리보기 모달, 앱/웹 푸시 목업 4종의 정확한 레이아웃.
- 브랜드메시지 캐러셀 커머스형 세부 필드 한도(상품명 30자·부가 정보 34자 상수는 확인, 가격 단위 입력 UI는 미확인), 알림톡 아이템 리스트형 하위 폼 필드별 한도 매핑.
- Unlayer 이메일 에디터 내부 UI(외부 SDK, `projectId 282430`, 버전 1.419.0) 및 에디터 상단 바의 뒤로가기 동작 문구.
- `configs.categoryColors`(카테고리 색 목록)의 출처 API와 색 이름 목록.
- 서버 검증 실패 시 실제 오류 메시지(응답 `message`를 그대로 토스트하므로 서버 의존).
- 페이지 접근 가드(권한·onlyKo 채널을 비한국어에서 직접 열 때) 동작.
- 템플릿 상세 "분석" 섹션(푸시·이메일)의 차트·기간 필터 세부.
- 발송 확인 모달·임시 저장 모달의 모바일 레이아웃 차이.
