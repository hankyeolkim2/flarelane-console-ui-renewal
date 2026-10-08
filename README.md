# FlareLane 콘솔 프로토타입

콘솔 DS 개편 시안(Figma `mINbfbhobp3GOZKmHDWs9C` 「페이지별 개편 작업」)을 실제로 눌러볼 수 있게 만든 껍데기 프로토타입.

- Next.js (Pages Router) + Emotion — 프로덕션 콘솔과 같은 스택
- 데이터 = 스테이징 화면 값을 옮긴 더미, 저장·발송 같은 실제 동작 없음
- 색 · 간격 · 모서리 · 그림자 = Figma 변수 값 그대로 (`styles/tokens.ts`), 글자 = Figma 텍스트 스타일 (`styles/typography.ts`)
- 아이콘 = Figma `ms` 세트(Material Symbols Rounded 300)에서 내려받은 SVG (`public/icons`)

```bash
npm install
npm run dev
```
