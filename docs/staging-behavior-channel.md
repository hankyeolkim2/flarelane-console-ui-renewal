# 채널 설정 - 스테이징 동작 메모 (2026-10-08)

스테이징 콘솔 공개 번들(buildId `Q-tOYo7BMgpuoKSGYkmC0`)과 로케일 파일(`/locales/ko/channel.json`, `email.json`, `channel-help.json`, `common.json`)에서 읽은 동작. 화면을 직접 열어 보지는 않았다(로그인 없음). 프로토타입은 이 동작과 똑같이 만들고, 모양은 Figma 시안을 따른다.

- 문구는 「」 안에 그대로 옮김. `{{x}}`는 치환 값.
- API는 모두 `https://staging-service-api.flarelane.com/v1` 기준. 대부분 `/projects/{projectId}` 가 앞에 붙는다(아래 표기는 그 뒤 경로). 예외는 따로 적음.
- 공통 에러 처리: 서버가 `message`를 주면 그 문구를 빨간 토스트로, 응답 자체가 없으면 「인터넷 연결을 확인해 주세요.」. 별도 성공 토스트가 없는 저장은 조용히 다시 불러오기만 한다.

## 주소
| 주소 | 화면 |
|---|---|
| `/channel` | 채널 탭 카드만 있고 선택된 탭·본문 없음 (getServerSideProps가 있어 서버에서 다른 탭으로 보낼 수도 있지만 번들로는 확인 불가) |
| `/channel/mobile` | 앱 푸시 |
| `/channel/web` | 웹 푸시 |
| `/channel/kakao` | 카카오 |
| `/channel/sms` | 문자 |
| `/channel/email` | 이메일 |
| `/channel/webhook` | 웹훅 목록 |
| `/channel/webhook/new` | 새 웹훅 |
| `/channel/webhook/[webhookId]` | 웹훅 상세 |
| `/channel/webhook/[webhookId]/edit` | 웹훅 수정 |

- 왼쪽 메뉴: 설정 그룹 > 「채널」 → `/channel`.

## 공통: 채널 탭 머리
- 제목 「채널」
- 탭 카드(아이콘 + 이름) 순서: 「앱 푸시」 · 「웹 푸시」 · 「카카오」 · 「문자」 · 「이메일」 · 「웹훅」
  - 「카카오」 · 「문자」는 **한국어(ko) 화면에서만** 보임.
  - 선택된 카드 = 브랜드색 1px 테두리 + 파란 그림자, 커서 기본. 나머지 = 회색 아이콘, 클릭 시 해당 주소로 이동. 선택된 카드를 다시 눌러도 아무 일 없음.
  - 웹훅 하위 주소(new/상세/수정)에서도 「웹훅」 카드가 선택 상태.

## 공통: 개발자 초대 카드 (앱 푸시 맨 위, 웹 푸시 미연동 화면·연동 방법 모달)
- 「💡」 + 「도움이 필요하신가요? 개발자 팀원에게 연동 가이드를 전달하세요.」
- 보조 문구(HTML, 링크 새 탭)
  - 웹: 「<a>연동 가이드</a>가 첨부된 초대 메일이 발송됩니다.」 → https://docs.flarelane.com/web-push-integration
  - 앱: 같은 문구 → https://docs.flarelane.com/guide-for-developer
- 이메일 입력 placeholder 「초대할 메일 주소 입력」 + 「발송」(xs) 버튼
  - 빈칸이면 아무 일 없음. 이메일 형식 검사 없음.
  - `POST /members` `{ email, mailType: "setupInstructions", data: { inviterName, projectName, channel: "web"|"mobile", inviteeEmail } }`
  - 성공 → 토스트 「초대 메일이 발송되었습니다.」 + 입력칸 비움. 보내는 동안 버튼 로딩.

## 공통: 도움말 아이콘
- 라벨 옆 (?) 아이콘에 마우스를 올리면 툴팁(HTML, 링크 포함 가능). 클릭 동작 없음.

---

## 앱 푸시 `/channel/mobile`
불러오기: `GET /projects/{id}` 1회 → `fcmV1Payload`, `fcmPayload`(레거시), `apnsPayload` 사용.

- 제목 「앱 푸시 설정」
- 개발자 초대 카드(앱용)
- 카드 「푸시 인증정보」 + 도움말 「앱 푸시 발송을 위해 각 플랫폼별 인증정보가 필수로 필요합니다.<br />자세한 내용은 <a>개발 가이드</a>를 참고하세요.」(https://docs.flarelane.co.kr/guide-for-developer)
  - 설명 「자세한 내용은 <a>앱 푸시 연동</a> 가이드를 참고하세요」(https://docs.flarelane.co.kr/fcm-setting)
  - 레거시 값(`fcmPayload.serverKey` 또는 `senderId`)이 있으면 한 줄 더: 「기존 FCM API가 지원 종료됨에 따라 새로운 API를 위한 <a>Service Account JSON</a>을 업로드해주셔야 합니다.」
- 아래 접이식 섹션 3개(레거시는 조건부). **처음엔 모두 접힘**, 머리 클릭으로 펼침/접힘, 오른쪽 화살표 회전(펼침 90° / 접힘 270°). 섹션마다 따로 「수정」 모드.

### FCM - Firebase Cloud Messaging (안드로이드 아이콘)
- 읽기 모드
  - 「Sender ID」 입력칸(읽기 전용, placeholder 「Sender ID」)
  - 「Service Account JSON」 라벨 (업로드 버튼 없음)
  - 파일이 있으면 「{filename} 업로드됨」(브랜드색 글자)
  - 버튼: 「테스트 발송」(secondary xs) · 「수정」(xs)
    - 「테스트 발송」: JSON·Sender ID·파일명이 모두 있어야 테스트 기기 모달 열림. 아니면 토스트 「FCM 정보를 모두 입력해 주세요.」
- 수정 모드
  - Sender ID 편집 가능
  - 라벨 옆 「업로드」(xs) → 파일 선택(`.json`만). 읽어서 JSON 파싱(실패 시 조용히 무시), 파일명 저장
  - 「{filename} 업로드됨」 옆 X → 파일 제거(Sender ID는 유지)
  - 버튼: 「취소」(secondary) · 「저장」
    - 저장: JSON·Sender ID·파일명 중 하나라도 없으면 토스트 「FCM 정보를 모두 입력해 주세요.」. 있으면 `PATCH /projects/{id}` `{ fcmV1Payload: { filename, serviceAccountJson, senderId } }` → 읽기 모드. 성공 토스트 없음.
    - 취소: 마지막 저장값으로 되돌리고 읽기 모드. (스테이징 버그: 레거시 `fcmPayload`가 null인 프로젝트에서는 취소가 동작하지 않음 - 프로토타입은 정상 동작으로 만들어도 됨)
- 테스트 기기 모달 (공용 컴포넌트)
  - 제목 「테스트 기기 선택」 + 「추가」(xs, 테스트 기기 추가 모달) + 새로고침 아이콘
  - 표(체크박스 선택): 별명 · 플랫폼 · 생성 시간 · 마지막 접속 시간 · 유저 ID · 구독. **안드로이드 기기만** 보여줌.
  - 페이지당 20, 페이지 번호 5개. 비면 「데이터가 없습니다」
  - 하단: 「<span>{n}</span>개 선택됨」 · 「취소」 · 「발송」(데스크톱) / 「테스트 기기로 발송」(모바일)
  - 발송: 선택 0개면 아무 일 없음. `POST /notifications/check-fcmv1` `{ deviceIds }` → 토스트 「[FCM V1 발송] 기기에서 푸시 알림이 정상 수신되었는지 확인해주세요.」 → `/push/sent-history/{응답 id}`로 이동. 끝나면 선택 비우고 모달 닫힘.
  - 기기 목록: `GET /devices?isTest=true&ignoreSubscribed=true&page=&per=20`

### (Legacy) FCM - Firebase Cloud Messaging + 「지원 종료」 배지
- 레거시 값이 있을 때만 보임.
- 「Server Key」(placeholder 「Server key」), 「Sender ID」 입력칸. 읽기 모드 = 「수정」만.
- 수정 모드 「취소」 · 「저장」. 저장: 둘 다 있어야 함(앞뒤 공백 제거) 아니면 「FCM 정보를 모두 입력해 주세요.」 → `PATCH /projects/{id}` `{ fcmPayload: { serverKey, senderId } }`.

### APNS - Apple Push Notification Service (애플 아이콘)
- 「Key」: 수정 모드에서만 「업로드」(`.p8`, 텍스트로 읽어 key에 넣음). key가 있으면 「업로드됨」 표시, 수정 모드면 옆에 X(제거).
- 「KeyId」(placeholder 「Key ID」) · 「TeamId」(「Team ID」) · 「Bundle Identifier」(「Bundle Identifier」)
- 읽기 모드 = 「수정」만. 수정 모드 = 「취소」 · 「저장」.
- 저장: 4개 모두 있어야 함 아니면 토스트 「APNS 정보를 모두 입력해 주세요.」 → `PATCH /projects/{id}` `{ apnsPayload: { key, keyId, teamId, topic } }`.

---

## 웹 푸시 `/channel/web`
불러오기: `GET /web-push-config`. 응답 `data`가 null이면 **미연동**, 아니면 **연동됨**. 처음 불러오는 중엔 가운데 스피너.

### 미연동 화면
- 제목 「웹 푸시 설정」(연동 방법 버튼 없음)
- 카드1: 개발자 초대 카드(웹용)
- 카드2 「1단계: 웹사이트 정보를 입력하세요.」
  - 알림 미리보기(제목 = 입력한 이름, 내용 「Message is displayed here」, 주소 = 입력 URL)
  - 「웹사이트 이름」 입력 placeholder 「사이트명」
  - 「웹사이트 URL (연동 이후 수정 불가)」 입력 placeholder 「https://www.example.com」
- 카드3 「2단계: 다음 파일을 웹사이트 루트 URL에 업로드하세요.」
  - 「파일 다운로드 (sw.js)」(xl) → 브라우저에서 바로 `sw.js` 내려받기. 내용 한 줄: `importScripts("https://cdn.flarelane.com/ServiceWorker.js");`
  - 「다음 주소에서 접근이 가능해야 합니다:」 + 링크 `{입력 URL의 origin}/sw.js` + 바로가기 아이콘(새 탭). URL이 비었거나 잘못되면 `https://example.com/sw.js`로 보이고 눌러도 이동 안 함.
- 카드4 「3단계: 다음 코드를 웹사이트 내 </body> 태그 전에 추가하세요.」
  - 코드 상자(상자나 복사 아이콘 클릭 → 복사, 토스트 「클립보드에 복사되었습니다.」 / 실패 「클립보드로 복사하는 데 실패했습니다.」)
  ```
  <script src="https://cdn.flarelane.com/WebSDK.js" charset="UTF-8"></script>
  <script> FlareLane.initialize({ projectId: "{projectId}" }); </script>
  ```
- 「완료」(xl, 처리 중 비활성)
  - URL 검사
    - 파싱 실패 → 오류 default
    - https가 아님 → localhost / 127.0.0.1 이면 통과, 아니면 오류 http
    - https인데 origin 그대로(끝 `/` 하나 허용)가 아님 → 오류 default
  - 실패 → 토스트 「웹사이트 정보가 유효하지 않습니다. 에러 메시지를 확인해주세요.」 + 1단계 카드 아래 빨간 문구
    - default: 「유효하지 않은 URL입니다. 다음과 같이 루트 URL의 형태여야 합니다: https://{{host}}」
    - http: 「유효하지 않은 URL입니다. 다음과 같이 https:// 로 시작해야 합니다: https://{{host}}」
    - host = 입력 URL의 host, 못 읽으면 `example.com`
  - 성공 → 1단계 아래 초록 「검증 완료」, `POST /web-push-config` `{ siteName, originSiteUrl }` → 다시 불러와 연동됨 화면으로.
  - 이름은 검사 안 함. 2·3단계의 「파일을 확인할 수 없습니다. 업로드되지 않은 것 같습니다.」 / 「사이트 내 연동 코드를 확인할 수 없습니다.」 / 「검증 완료」 문구는 코드에 있지만 실제로 켜지는 경로가 없음(「연동 여부 검증」 버튼 문구도 미사용).

### 연동됨 화면
- 머리: 「웹 푸시 설정」 + 오른쪽 「연동 방법」(secondary xs) → 연동 방법 모달
- 카드 3개: 기본 설정 → 위젯 설정 → 팝업 설정(`nativePromptConfig.active`가 true면 팝업 설정 숨김)

#### 카드 공통 틀
- 머리: 제목 (+ 위젯/팝업만 「활성화」 + 토글)
  - 토글은 수정 모드와 상관없이 **누르는 즉시** 저장: 현재 저장값에 `active`만 뒤집어 `PATCH /web-push-config` → 다시 불러오기.
  - 토글이 꺼져 있으면 카드 본문(입력·미리보기·버튼) 전체 숨김.
- 본문 왼쪽 = 입력, 오른쪽 = 「미리보기」
- 하단 버튼(xl): 읽기 모드 「수정」 / 수정 모드 「취소」(secondary, 저장 중 비활성) · 「저장」(로딩)
- 취소 = 마지막 저장값으로 되돌리고 읽기 모드. 저장 = PATCH 후 다시 불러오고 읽기 모드. 성공 토스트 없음. 입력값 검사 없음.

#### 이미지 입력칸 (아이콘 · 배지 · 커스텀 이미지 공용)
- 텍스트칸: 이미지 URL을 직접 입력 가능. 파일을 골랐거나 플레어레인 호스팅(imagedelivery.net) 주소면 「업로드됨」으로 표시되고 읽기 전용.
- 오른쪽 버튼(수정 모드에서만)
  - 비어 있거나 외부 URL → 「업로드」(값 있으면 「이미지 변경」), 업로드 아이콘, 파일 형식 `image/jpg,image/jpeg,image/png`
  - 파일 선택됨 / 호스팅 주소 → X 아이콘(비우기)
- 마우스를 올리면 URL이 https 또는 data: 일 때 이미지 미리보기 팝오버
- 실제 업로드는 「저장」 때: 3MB 초과 → 토스트 「이미지 크기가 너무 큽니다. (3MB 이하 허용)」 후 저장 중단. 업로드 `POST /upload-image`(프로젝트 경로 없음, multipart `file`) → 받은 URL로 저장.

#### 기본 설정 (토글 없음)
- 「사이트명」 + 도움말 「메시지에 제목이 없는 경우 사이트명으로 대체됩니다.」 - 수정 가능
- 「사이트 URL (최초 설정 후 변경 불가)」 + 도움말 「플레어레인이 연동되는 정확한 사이트 주소를 입력합니다.」 - 항상 비활성
- 「간접 푸시 서브도메인 (최초 설정 후 변경 불가)」 + 도움말 「플레어레인에 등록할 고유한 서브도메인을 입력합니다.<br />보통 우리 브랜드의 영문명을 넣습니다. (ex.flarelane)」 - `proxySubdomain`이 있을 때만, 값 `{proxySubdomain}.noti.page`, 항상 비활성
- 「아이콘」 - 이미지 입력칸
- 「배지 (안드로이드)」 + 도움말(웹 푸시 가이드 링크) - 이미지 입력칸
- 「구독 완료 시 메시지」 - 토글(active) + 텍스트칸(body). 수정 모드에서만 조작.
- 「'플레어레인 이용중' 로고 삭제」 - 토글. 플랜이 TEAM 미만(STARTER·EXPIRED)이면 라벨 옆 「UPGRADE」 배지(호버 툴팁 「플랜 업그레이드 필요」, 클릭 시 요금제 페이지 새 탭) + 토글 항상 비활성.
- 미리보기: 기기 선택 2개(드롭다운) - 「모바일」(Android) / 「데스크탑」(Windows, Mac OS). 처음 = 모바일·Android, 데스크탑 기본 Windows. 제목=사이트명, 내용=구독 완료 메시지, 아이콘·배지 반영.
- 저장: `PATCH /web-push-config` `{ siteName, siteIcon, siteBadge, welcomeNotificationConfig: { active, body }, hidePromotion }`

#### 위젯 설정 (토글 있음)
- 「색상」 - 색 견본 + HEX 텍스트칸. 수정 모드에서 견본 클릭 → 컬러 피커 팝오버, 텍스트로 직접 입력도 가능.
- 기기 전환 「데스크탑」/「모바일」(처음 데스크탑) - 아래 크기·위치·여백·커스텀 이미지는 기기별로 따로 저장되는 값이고 이 전환으로 어느 쪽을 편집/미리볼지 고름(읽기 모드에서도 전환 가능)
- 체크박스 「모바일에서 노출하지 않기」(수정 모드에서만)
- 「커스텀 이미지」 + 도움말 「화질 개선을 위해 실제 화면에서는 이미지의 1/2 사이즈로 보여집니다.」 - 이미지 입력칸
- 「크기」 슬라이더 0.5~1.5, 0.1 단위, 옆에 「{n}x」. 커스텀 이미지가 있으면 1로 고정·비활성.
- 「위치」 「왼쪽」/「오른쪽」 둘 중 하나
- 「가로」 · 「세로」 슬라이더 1~100, 옆에 「{n}px」
- 「위젯 노출 경로」 + 도움말 「위젯이 노출될 URL 경로를 지정할 수 있습니다. (전체 노출의 경우 /* 추가)」 - 여러 줄 입력, 한 줄에 경로 하나
- 슬라이더·체크박스·textarea는 읽기 모드에서 비활성(회색 트랙)
- 미리보기: 위젯 아이콘을 지정 위치·여백·크기로 배치(커스텀 이미지면 이미지 실제 크기의 1/2)
- 저장: `PATCH /web-push-config` `{ widgetConfig: { active, color, size, position, horizontalMargin, verticalMargin, mobileSize, mobilePosition, mobileHorizontalMargin, mobileVerticalMargin, hideIfMobile, allowedPaths: [줄별 trim·빈 줄 제거], customImageUrl, mobileCustomImageUrl } }`

#### 팝업 설정 (토글 있음)
- 「제목」 · 「내용」(textarea) · 「구독 버튼」 · 「색상」 · 「노출 지연시간 (초)」(숫자, min 0) · 「재시도 간격 (일)」(숫자, min 0, 도움말 「팝업이 닫힌 뒤 다시 열리기까지의 간격을 입력합니다.」) · 「닫기 버튼」
- 미리보기: 「데스크탑」/「모바일」 전환(처음 데스크탑), 팝업 모양에 제목·내용·버튼 문구·색 반영
- 저장: `PATCH /web-push-config` `{ popupConfig: { active, title, body, allowButtonText, closeButtonText, color, retryIntervalDay, waitingTimeSecond } }`

### 연동 방법 모달
- 개발자 초대 카드(웹용) → 구분선 → 「1단계: 다음 파일을 웹사이트 루트 URL에 업로드하세요.」(sw.js 다운로드 + `{originSiteUrl의 origin}/sw.js`) → 「2단계: 다음 코드를 웹사이트 내 </body> 태그 전에 추가하세요.」(코드 복사)
- 오른쪽 위 X(aria 「닫기」), ESC로도 닫힘

---

## 카카오 `/channel/kakao` (ko 전용)
불러오기: `GET /kakao/sender`(발신 프로필 목록, 첫 번째만 사용), `GET /kakao/sender/category`(카테고리 목록), 수신거부 영역은 아래 「수신거부 공통」.

- 제목 「카카오 설정」 + 오른쪽 「발신 프로필 등록」(xs) - **불러오기 끝났고 프로필이 없을 때만** 보임
- 섹션 「발신 프로필」
  - 불러오는 중 = 로딩
  - 프로필 있음 = 읽기 전용 2열 표: 「카카오톡 채널 ID」(plusFriendId) · 「카카오톡 채널 이름」 / 「관리자 휴대폰 번호」 · 「사업자 카테고리」 / 「브랜드메시지 비친구 승인」 = 「YES」 또는 「NO」
  - 없음 = 빈 그림 + 「데이터가 없습니다」
- 섹션 「수신거부」(brand_message) + 「수신거부 웹훅 설정」(수신거부 번호가 있을 때만)

### 발신 프로필 등록 모달
- 바깥 클릭으로 안 닫힘(ESC는 닫힘). 버튼 「취소」(입력 전부 초기화하고 닫기) · 「확인」
- 제목 「발신 프로필 등록」
- 안내(HTML): 「• 카카오는 발신 프로필을 등록하여야 사용할 수 있습니다.<br />• 카카오톡 채널이 없으신 경우 <a>카카오톡 채널 연동 가이드</a> 를 참고해 주세요.<br />• 전화번호는 카카오 채널에 등록된 관리자 전화번호를 입력해 주세요.」 (링크에 href 없음)
- 「카카오톡 채널 ID」 placeholder 「검색용 채널 ID 입력 ex) @flarelane」 - 저장 시 `@`가 없으면 앞에 붙임
- 「사업자 카테고리」 검색형 선택 placeholder 「카테고리 선택」, 목록 최대 높이 170, 검색어가 이름에 들어간 것만
- 「관리자 휴대폰 번호」 placeholder 「숫자만 입력」(숫자 외 글자 즉시 삭제) + 「인증번호 발송」(secondary xs)
  - 채널 ID·카테고리·번호 중 빈 값 → 브라우저 alert 「값을 모두 입력해 주세요.」
  - `POST /kakao/sender/register-token` `{ plusFriendId, categoryCode, phoneNumber }`
  - 성공 → alert 「인증번호가 발송되었습니다.」, 버튼 「발송됨」 비활성, 위 3칸 읽기 전용, 아래 「인증번호 입력」 칸 등장
  - 실패 → alert 「인증번호 발송에 실패했습니다.\n입력 정보를 확인해 주세요.」 (서버 메시지가 있으면 그 문구 alert 먼저)
- 「확인」: 4개(인증번호 포함) 중 빈 값 → alert 「값을 모두 입력해 주세요.」 → `POST /kakao/sender` `{ plusFriendId, categoryCode, categoryName, phoneNumber, token }` → alert 「등록되었습니다.」 (스테이징은 모달이 열린 채 남고 목록도 다시 안 불러옴)

---

## 문자 `/channel/sms` (ko 전용)
불러오기: `GET /projects/{id}` (smsSenderNumber, smsSenderNumberRegisteredAt, smsSenderName, 수신거부 필드)

- 제목 「문자 설정」
- 섹션 「발신번호」
  - 로딩 중 = 로딩
  - 번호 있음 = 「발신번호」 · 「등록일」(yyyy-MM-dd) / 「업체명」(없으면 빈칸). 읽기 전용, 수정 수단 없음.
  - 없음 = 「문자메세지를 발송하기 위해서는 발신 번호 등록이 필요합니다」 + 「발신번호 등록 문의」(xs) → https://docs.flarelane.co.kr/sms-overview 새 탭
- 섹션 「수신거부」(sms) + 「수신거부 웹훅 설정」(수신거부 번호가 있을 때만)

## 수신거부 공통 (카카오 · 문자)
- 섹션 「수신거부」: 「수신거부 번호」(없으면 「-」) · 「등록된 수신거부 수」(없으면 「-」) · 「번호 등록일」(yyyy-MM-dd, 없으면 「-」)
  - 번호·날짜 = 프로젝트의 `smsUnsubscribeServiceNumber(RegisteredAt)` / `brandMessageUnsubscribeServiceNumber(RegisteredAt)`
  - 개수 = `GET /unsubscribe/count?channelType=sms|brand_message|email` → `count`

## 수신거부 웹훅 설정 (문자 · 카카오 · 이메일 공용)
- 제목 「수신거부 웹훅 설정」 + 도움말 「수신거부 리스트에 새롭게 번호가 추가/삭제될 경우 이를 웹훅을 통해 받아볼 수 있습니다. <a>자세히보기</a>」(문자·카카오 = sms-overview#hxRtq, 이메일 = email-overview#hxRtq)
- URL 한 줄 입력 placeholder 「https://example.com/webhook」 - 읽기 모드에선 비활성. 값 = 프로젝트의 `reportSMSUnsubscribedUrl` / `reportBrandMessageUnsubscribedUrl` / `reportEmailUnsubscribedUrl`
- 버튼 1개(xs)
  - 「수정」 → confirm 「수신거부 웹훅 설정을 수정하시겠습니까?」 → 확인 시 편집 가능, 버튼이 「저장」으로
  - 「저장」 → confirm 「수신거부 웹훅 설정을 저장하시겠습니까?\n해당 URL로 수신거부 리포트가 전달됩니다.」
    - 취소 → 편집 모드만 끝남(입력한 값은 그대로 보임, 저장 안 됨)
    - 확인 → `PATCH /unsubscribe/webhook-report-url` `{ url, channelType: "SMS" | "BRAND_MESSAGE" | "EMAIL" }` → 프로젝트 다시 불러오고 읽기 모드. 토스트 없음.
  - 별도 「취소」 버튼 없음. URL 형식 검사 없음.

---

## 이메일 `/channel/email`
불러오기
- `GET /email-channel` → `{ status, metrics: { bouncedRate, complaintRate }, quota: { used, quota, remaining } }`
- `GET /email-channel/status-history` → 이력 배열
- `GET /email-domains` → 도메인 배열(각 `emailAddresses[]`)
- `GET /projects/{id}` (emailChannelEnabled, reportEmailUnsubscribedUrl)
- `GET /unsubscribe/count?channelType=email`

순서: 제목 「이메일」 → 상태 카드 3개 → 발송 상태 이력 → 도메인 및 발신 이메일 → 수신거부 → 수신거부 웹훅 설정

### 상태 카드 3개 (각각 로딩 중엔 스피너)
- 「발송 상태」: 점 + 문구. `CLOSED`=「정상」(초록 점) · `OPEN`=「차단」(빨강) · `HALF_OPEN`=「일부 차단」(빨강)
- 「관리 지표」: 머리 「반송률」 · 「스팸률」, 값 「{n}%」
- 「월 발송량 및 한도」: 큰 글씨 사용량 + 「 / {한도}」, 아래 「남은 발송 가능량: {n}」. 숫자는 천 단위 쉼표.
- 프로젝트 `emailChannelEnabled`가 false면 세 카드 값 모두 「-」(한도는 「 / -」)

### 발송 상태 이력 (표)
- 열: 「발생 시각」(yyyy.LL.dd HH:mm) · 「상태」(배지: 정상 = 파란 글자/연파랑 배경, 그 외 = 빨강 글자/회색 배경) · 「사유」
- 사유 문구
  - reason 없음 → 「이메일 채널 활성화」
  - 라벨: BOUNCE_RATE_EXCEEDED=「반송률」 · COMPLAINT_RATE_EXCEEDED=「스팸률」 · EMAIL_QUOTA_EXCEEDED=「월 발송량」 · SES_QUOTA_EXCEEDED=「발송 한도」
  - 상태 CLOSED(해제) → triggeredBy MANUAL 「{{label}} 수동 해제」, 그 외 「{{label}} 회복으로 자동 해제」
  - 차단인데 value/threshold 없음 → 「{{label}} 기준 초과」
  - 월 발송량·발송 한도 → 「{{label}} {{value}}건 (한도 {{threshold}}건 초과)」
  - 반송률·스팸률 → 「{{label}} {{value}}% (기준 {{threshold}}% 초과)」
- 비면 빈 그림 + 「데이터가 없습니다」

### 도메인 및 발신 이메일
- 머리 오른쪽: 「발신 이메일 추가」(secondary xs) · 「도메인 등록」(xs)
- 표 열: 「도메인」 · 「상태」 · 「등록일」(yyyy.LL.dd) · 「최종 검증일」(yyyy.LL.dd, 없으면 「-」) · ⋯
  - 상태 배지: PENDING 「확인중」(흰 배경·회색 글자·회색 테두리, 호버 툴팁 「도메인 확인 중」 / 「최대 48시간이 소요될 수 있습니다.」) · FAILED 「미확인」(회색 배경·빨강 글자) · SUCCESS 「확인됨」(연한 브랜드 배경·브랜드 글자)
  - 도메인 행 아래에 발신 이메일 줄: 아이콘 + 이메일 + 「({displayName})」(있을 때) + ⋯
- 도메인 ⋯ 메뉴: 「상태 갱신」 · 「DNS 정보」 · 「도메인 삭제」(빨강)
  - 상태 갱신 → `PATCH /email-domains/{id}/verification` → 목록 다시 불러오기 → 토스트 「상태가 갱신되었습니다.」 → 메뉴 닫힘
  - DNS 정보 → DNS 모달
  - 도메인 삭제 → 삭제 확인 모달 「도메인을 삭제하시겠습니까?」 / 「삭제된 도메인은 복구할 수 없습니다.」 · 「취소」 · 「삭제」 → `DELETE /email-domains/{id}` → 토스트 「도메인이 삭제되었습니다.」 → 목록 다시 불러오기, 모달 닫힘
- 이메일 ⋯ 메뉴: 「이메일 삭제」(빨강) → 「이메일을 삭제하시겠습니까?」 / 「삭제된 이메일은 복구할 수 없습니다.」 → `DELETE /email-domains/{id}/addresses/{addressId}` → 토스트 「이메일이 삭제되었습니다.」

#### 도메인 등록 모달
- 제목 「도메인 등록」 + X(「닫기」). 「도메인 주소」 라벨 + 입력 placeholder 「flarelane.com / mail.flarelane.com」
- 입력할 때마다 형식 검사 `^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*\.[a-z]{2,}$`(대소문자 무시). 틀리면 아래 빨간 「올바른 도메인 주소를 입력해주세요.」
- 버튼 「취소」 · 「확인」 - 빈칸·형식 오류·처리 중이면 확인 비활성
- 확인 → `POST /email-domains` `{ domain }` → 목록 다시 불러오기 → 토스트 「도메인이 등록되었습니다.」 → 닫힘

#### 발신 이메일 추가 모달
- 제목 「발신 이메일 추가」 + X
- 「발송자명 (선택)」 입력 placeholder 「수신자에게 표시되는 발신자 이름입니다」
- 「이메일 주소」 · 「도메인」 라벨 아래 한 줄: 아이디 입력 + 「@」 + 도메인 선택(placeholder 「도메인 선택」, 등록된 도메인 전부 - 상태 무관. 0개면 「(확인된 도메인 없음)」)
- 아이디 형식: 영문/숫자로 시작·끝, 중간에 `.!#$%&'*+/=?^_\`{|}~-` 허용. 틀리면 「올바른 이메일 주소를 입력해주세요.」
- 확인 비활성: 처리 중 · 형식 오류 · 도메인 미선택 · 아이디 빈칸
- 확인 → `POST /email-domains/{domainId}/addresses` `{ email: "{아이디}@{도메인}", displayName(공백이면 생략) }` → 목록 다시 불러오기 → 토스트 「이메일이 추가되었습니다.」 → 닫힘

#### DNS 정보 모달
- 제목 「도메인 인증 DNS 설정」 + X
- 불러오기 `GET /email-domains/{id}` → `dnsRecords[]`(type, name, value, verified)
- 표 3개 「CNAME」 · 「TXT」 · 「MX」, 각 열 「Name」 · 「Value」. 칸마다 복사 아이콘(토스트 「클립보드에 복사되었습니다.」). 레코드가 없으면 스피너.
- 버튼 「검사」(secondary, 검사 중 비활성) · 「확인」(닫기)
  - 검사 → `PATCH /email-domains/{id}/verification` → verified=false가 하나라도 있으면 빨간 아이콘 + 「DNS 레코드 설정을 확인해주세요」 + 목록 「Name: {name}」, 없으면 초록 체크 + 「설정이 모두 확인되었습니다」

### 수신거부 (이메일)
- 「등록된 수신거부 수」 + 숫자(없으면 「-」)
- 수가 1 이상이면 오른쪽 다운로드 아이콘 버튼(aria 「다운로드」)
  - → 「CSV 다운로드」 모달: 「다운로드 사유 입력」 + placeholder 「다운로드 사유를 입력해 주세요.」, 「취소」 · 「다운로드」(사유 공백이면 비활성)
  - 다운로드 → `POST /unsubscribe/download-csv` `{ channelType: "email", reason }` → 모달 닫힘 → 10초마다 `GET /unsubscribe/download-csv?channelType=email` 확인, `status: "COMPLETED"` + `url` 오면 파일 내려받기. 진행 중 버튼 로딩.
  - 다른 CSV 다운로드가 진행 중이면 alert 「이미 CSV 다운로드가 진행중입니다.」
- 그 아래 「수신거부 웹훅 설정」(이메일은 항상 보임)

---

## 웹훅 목록 `/channel/webhook`
불러오기: `GET /webhooks` → `[{ webhook: { id, title, method, url }, stats: { successCount, failureCount } }]` (캐시 사용)

- 머리 「웹훅」 + 「새 웹훅」(xs) → `/channel/webhook/new`
- 표 열
  - 「정보」: 1줄 제목 / 2줄 「{method} {url}」
  - 「최근 30일간의 통계」(폭 280): 머리 「성공」 · 「실패」, 값 = 성공 수 / 실패 수 + 「 ({실패율}%)」(소수 1자리). 수는 1,000 이상이면 K/M/B 축약.
  - 상태등(LED): 성공·실패 모두 0 = 회색, 실패율 ≥ 30% = 빨강, 그 외 초록
- 행 전체가 링크 → `/channel/webhook/{id}`
- 로딩 중 스피너, 0개면 빈 그림 + 「데이터가 없습니다」. 페이지네이션 없음.

## 새 웹훅 `/channel/webhook/new` · 웹훅 수정 `/channel/webhook/[id]/edit`
- 페이지 제목: 「새 웹훅」 / 「웹훅 수정」
- 머리 줄: 이름 입력칸(placeholder 「이름 (필수)」) · 「취소」(tertiary xs) · 「저장」(xs)
- 편집기
  - 「URL」: 메서드 선택 + URL 입력(placeholder 「https://」). 메서드 = GET · POST · PUT · PATCH · DELETE · HEAD · OPTIONS, 기본 GET.
  - 「HEADERS」: Key / Value 줄 목록(기본 빈 줄 1개)
    - Key 칸(최대 폭 250)·Value 칸 모두 개인화 입력칸: 한 줄(Enter 막힘), 오른쪽 `{}` 아이콘 → 개인화 변수 모달
    - 줄 끝 X → 그 줄 삭제(마지막 줄도 삭제 가능, 0줄이면 「-」 표시)
    - 아래 「추가」(tertiary sm, + 아이콘) → 빈 줄 추가
  - 「BODY」: JSON 코드 편집기
    - 줄 번호, 문법 강조, `{{ }}`·`{% %}` 변수 강조
    - Tab = 공백 4칸, Enter = 윗줄 들여쓰기 유지(한글 조합 중엔 기본 동작)
    - 변수 자리를 999로 바꿔 JSON 파싱해 보고, 틀리면 테두리 경고 + 오류 줄 번호 옆 표시 + 「Invalid」 배지(빈 본문은 정상). 저장은 막지 않음.
    - `{}` 아이콘 → 개인화 변수 모달(커서 위치에 삽입)
    - 정렬 아이콘 → 변수를 보존한 채 JSON을 들여쓰기 4칸으로 정리(파싱 실패면 무시)
  - 처리 중 로딩 오버레이
- 저장
  - 화면에서 검사 없음(이름 빈칸도 그대로 전송, 오류는 서버 메시지 토스트)
  - 보내는 값: `{ title, url, method, headers, body }`
    - headers = Key가 있고 Value도 있는 줄만 `{key: value}` JSON 문자열. Key 있는 줄이 하나도 없으면 null.
    - body = 비어 있으면 생략
  - 새 웹훅 `POST /webhooks`, 수정 `PATCH /webhooks/{id}` → 목록 캐시 갱신(`GET /webhooks`) → `/channel/webhook/{id}` 상세로 이동
- 취소 → 목록 `/channel/webhook`로 이동(수정 화면에서도 상세가 아니라 목록)
- 나가기 경고: 이 두 화면에서는 **변경 여부와 상관없이** 다른 페이지로 이동·새로고침·탭 닫기 때 confirm 「변경사항이 저장되지 않았습니다. 페이지를 벗어나시겠습니까?」. 저장·취소 버튼은 경고 없이 이동.
- 수정 화면 불러오기: `GET /webhooks/{id}` → `{ webhook: { title, url, method, headers(JSON 문자열), body } }`, headers는 Key/Value 줄로 풀어서 채움(파싱 실패면 0줄)

### 개인화 변수 모달 (`{}` 버튼)
- 「개인화 변수」 검색형 선택(placeholder 「변수 선택」, 폭 320, 최대 높이 300). 항목 = 이름 + 설명, 검색은 이름+설명 부분 일치(대소문자 무시)
  - `tags.{태그명}` - 숨김 아닌 태그 전부, 설명 = 태그 설명(자동 동기화 태그는 「(데이터 연동되어 자동 추가됨)」). `GET /data-management/tags?page=1&per=500`
  - 기본 속성: `phoneNumber` 전화번호 · `name` 이름 · `email` 이메일 · `country` 국가 · `language` 언어 · `dob` 생년월일 · `timeZone` 시간대 · `userId` 유저 ID
- 「대체 문구」 입력 placeholder 「값이 없을 때 사용할 문구 입력」
- 왼쪽 아래 링크 「개인화 메시지 사용 가이드」(https://docs.flarelane.co.kr/personalized-messages)
- 「취소」 · 「확인」 - 변수나 대체 문구가 비면 확인 비활성
- 확인 → 커서 자리에 `{{ 변수 | default: "대체문구" }}` 삽입(대체 문구의 `\`·`"`는 이스케이프), 닫고 커서를 삽입 뒤로

## 웹훅 상세 `/channel/webhook/[id]`
불러오기: `GET /webhooks/{id}`, `GET /webhooks/{id}/execution-logs?page=&per=10&status=&senderSource=`

- 페이지 제목 「웹훅 상세 정보」
- 머리 줄: ← 뒤로(→ `/channel/webhook`) + 웹훅 이름(텍스트) · 「삭제」(tertiary, 빨강) · 「수정」(xs)
  - 삭제 → confirm 「정말 삭제하시겠습니까?」 → `DELETE /webhooks/{id}` → 목록 다시 불러오기 → `/channel/webhook`. 토스트 없음.
  - 수정 → `/channel/webhook/{id}/edit`
- 편집기 읽기 전용: 메서드·URL 고정, HEADERS 줄 고정(X·추가·`{}` 없음, 0줄이면 「-」), BODY 고정(`{}`·정렬 버튼 없음)

### 테스트 발송 (접이식, 처음 접힘)
- 머리: 화살표 아이콘 + 「테스트 발송」, 오른쪽 꺾쇠(펼침 270° / 접힘 180°). 클릭으로 토글.
- 본문
  - 대상 종류 선택 「USER ID」(기본) / 「DEVICE ID」 - 바꾸면 아이디 칸 비움
  - 아이디 입력(placeholder 없음)
  - 「DATA」 - 헤더·본문에 쓰인 Liquid 변수 중 기본 속성(phoneNumber·name·email·country·language·dob·timeZone·userId·tags)·`tags.`·`entry_event.data`를 뺀 나머지가 있을 때만. Key 고정, Value만 입력(추가·삭제 없음)
  - 「발송」(xs, 로딩)
- 발송: 화면 검사 없음 → `POST /webhooks/{id}/test-execute` `{ subjectType: "user" | "device", subjectId, data(값 있는 것만, 없으면 생략) }`
  - 응답에 requestId가 있으면 `GET /webhooks/{id}/execution-logs/{requestId}`를 최대 5번, 12.5초 간격으로 확인(기록이 생길 때까지)
  - 그 뒤 발송 기록 탭을 「테스트 발송」·1페이지로 바꾸고 다시 불러옴

### 발송 기록
- 탭 「전체」 · 「발송 성공」 · 「발송 실패」 · 「테스트 발송」 + 오른쪽 새로고침 아이콘(aria 「새로고침」, 현재 조건 다시 불러오기)
  - 탭 바꾸면 1페이지, 오른쪽 상세 패널 닫힘. 로딩 중엔 탭 클릭 무시.
  - 쿼리: 전체 = 조건 없음 · 발송 성공 `status=SUCCESS` · 발송 실패 `status=FAILURE` · 테스트 발송 `senderSource=Test`
- 표 머리 「발송 여부」 · 「발송 날짜」
  - 행 = 배지(SUCCESS 「발송 성공」 초록 / FAILURE 「발송 실패」 빨강, 배경은 같은 색 10%) + 날짜 yyyy.LL.dd HH:mm:ss
  - 빈 목록 문구 없음(머리만)
- 페이지네이션: 10개씩, 번호 5개, 최대 500페이지. 아래 로딩 오버레이.
- 행 클릭 → 오른쪽 상세 패널
  - 「REQUEST ID: {requestId}」
  - 「RESPONSE」 pre: 첫 줄 「{statusCode} {statusText}」 + 응답 본문(JSON이면 4칸 들여쓰기). errorMessage에 timeout이 들어 있으면 대신 「Network Connection Failed: The request timed out.」
  - 「REQUEST」 pre: 「{method} {url}」 + headers JSON + body JSON(4칸 들여쓰기)

---

## 목업용 API 요약 (GET만)
| 화면 | GET |
|---|---|
| 앱 푸시 | `/projects/{id}`, 테스트 기기 `/projects/{id}/devices?isTest=true&ignoreSubscribed=true&page&per=20` |
| 웹 푸시 | `/projects/{id}/web-push-config` (null = 미연동) |
| 카카오 | `/projects/{id}/kakao/sender`, `/projects/{id}/kakao/sender/category`, `/projects/{id}`, `/projects/{id}/unsubscribe/count?channelType=brand_message` |
| 문자 | `/projects/{id}`, `/projects/{id}/unsubscribe/count?channelType=sms` |
| 이메일 | `/projects/{id}/email-channel`, `/projects/{id}/email-channel/status-history`, `/projects/{id}/email-domains`, `/projects/{id}/email-domains/{domainId}`(DNS 모달), `/projects/{id}`, `/projects/{id}/unsubscribe/count?channelType=email`, `/projects/{id}/unsubscribe/download-csv?channelType=email`(폴링) |
| 웹훅 목록 | `/projects/{id}/webhooks` |
| 웹훅 상세 | `/projects/{id}/webhooks/{wid}`, `/projects/{id}/webhooks/{wid}/execution-logs?page&per=10&status&senderSource`, `/projects/{id}/webhooks/{wid}/execution-logs/{requestId}` |
| 새/수정 웹훅 | 수정만 `/projects/{id}/webhooks/{wid}`; `{}` 모달 `/projects/{id}/data-management/tags?page=1&per=500` |

쓰기(목업에서 성공만 흉내): PATCH `/projects/{id}`, POST/PATCH `/web-push-config`, POST `/upload-image`(프로젝트 경로 없음), POST `/members`, POST `/notifications/check-fcmv1`, POST `/kakao/sender/register-token`, POST `/kakao/sender`, PATCH `/unsubscribe/webhook-report-url`, POST `/unsubscribe/download-csv`, POST/DELETE `/email-domains…`, PATCH `/email-domains/{id}/verification`, POST/PATCH/DELETE `/webhooks…`, POST `/webhooks/{id}/test-execute`.

## 확인 못 한 것
- `/channel` 루트가 서버에서 다른 탭으로 보내는지(SSR) - 번들만으로는 알 수 없음.
- 서버 검증 문구(웹훅 이름·URL 필수 등) - 화면 쪽 검사가 없어 서버가 주는 메시지 그대로 토스트됨.
- STARTER 플랜 웹 푸시 안내(「STARTER 플랜에서는 웹 푸시를 이용할 수 없습니다. 플랜을 업그레이드해주세요.」)와 직접/간접 푸시 설명 문구는 로케일에만 있고 채널 화면 코드에서는 쓰이지 않음.
- 실제 픽셀 모양(색·간격)은 이 문서 범위 밖 - Figma 시안 기준.
