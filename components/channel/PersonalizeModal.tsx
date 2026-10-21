import { useState } from 'react';
import styled from '@emotion/styled';
import Button from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Modal';
import SearchSelect from '@/components/ui/SearchSelect';
import TextField from '@/components/ui/TextField';
import { Field } from './ChannelShell';
import { liquid, VARIABLES } from '@/lib/liquid';
import { color } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 개인화 변수 모달(`{}` 버튼) — 변수 선택 = 셀렉트 박스 + 메뉴 안 검색(스테이징과 같음, 10-21 확인: 이름 · 설명 부분 일치, 직접입력 없음)
// 박스 폭 = 대체 문구 칸과 같은 전체 폭(10-21 사용자). 변수나 대체 문구가 비면 확인 비활성. 확인 → `{{ 변수 | default: "대체문구" }}` 를 돌려줌.
const Guide = styled.a`
  margin-right: auto;
  align-self: center;
  ${text('text-sm', 'semibold')};
  color: ${color('text-brand-secondary')};
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const OPTIONS = VARIABLES.map((v) => ({ value: v.name, label: v.name, sub: v.desc }));

export default function PersonalizeModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (snippet: string) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [fallback, setFallback] = useState('');
  return (
    <Dialog
      title="개인화 변수"
      onClose={onClose}
      footer={
        <>
          <Guide href="https://docs.flarelane.co.kr/personalized-messages" target="_blank" rel="noreferrer">
            개인화 메시지 사용 가이드
          </Guide>
          <Button size="md" onClick={onClose}>취소</Button>
          <Button hierarchy="primary" size="md" disabled={!picked || !fallback} onClick={() => onConfirm(liquid(picked!, fallback))}>
            확인
          </Button>
        </>
      }
    >
      <Field>
        <span data-label>개인화 변수</span>
        <SearchSelect value={picked} options={OPTIONS} placeholder="변수 선택" onChange={setPicked} />
      </Field>
      <Field>
        <label htmlFor="pv-fallback">대체 문구</label>
        <TextField id="pv-fallback" placeholder="값이 없을 때 사용할 문구 입력" value={fallback} onChange={(e) => setFallback(e.target.value)} />
      </Field>
    </Dialog>
  );
}
