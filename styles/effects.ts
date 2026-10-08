// Figma 버튼 효과를 CSS 로 "그려지는 결과 그대로" 옮김.
// Figma 는 안쪽(inside) stroke 를 안쪽 그림자 위에 그린다 → 같은 1px 에 겹친다. CSS border + inset 그림자를 그대로 옮기면
// 테두리 안쪽에 선이 한 줄 더 생겨 두꺼워 보인다(09-23 스테이징 QA 와 같은 문제). Figma 1× 렌더 픽셀로 확인한 값:
//   Secondary  위 #d1d5db · 안 #ffffff · 아래에서 둘째 줄 #f2f2f2 · 맨 아래 #d1d5db
//   Primary    맨 위 #2f4672 · 둘째 #324e84 · 안 #193875 · 아래 둘째 #19366f · 맨 아래 #142b5b (bg-brand-solid 기준)

export const dropXs = '0px 1px 2px 0px rgba(0, 0, 0, 0.05)';

// Secondary · 흰 버튼: 1px 테두리가 안쪽 1px 링(18%)을 덮고, 아래 2px 그림자(5%)는 테두리 위 1px 만 보인다
export const secondaryShadow = `${dropXs}, inset 0px -1px 0px 0px rgba(0, 0, 0, 0.05)`;

// Primary · 진한 버튼: 테두리 없음. 1px 어두운 링(18%) + 아래 2px(5%) + 위에 2px 흰 그라디언트 테두리(::before)
export const primaryShadow = `${dropXs}, inset 0px 0px 0px 1px rgba(0, 0, 0, 0.18), inset 0px -2px 0px 0px rgba(0, 0, 0, 0.05)`;

// `Gradient/skeuemorphic-gradient-border` — 위 흰색 12% → 아래 0%, 안쪽 2px
export const gradientBorder = `
  position: relative;
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 2px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
    pointer-events: none;
  }
`;
