import { useRef, useState } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import Floating from '@/components/ui/Floating';
import { Dialog } from '@/components/ui/Modal';
import TextField from '@/components/ui/TextField';
import { Field } from './ChannelShell';
import { liquid, VARIABLES } from '@/lib/liquid';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 개인화 변수 모달(`{}` 버튼) — 검색형 변수 선택(폭 320 · 최대 높이 300, 이름+설명 부분 일치) + 대체 문구.
// 변수나 대체 문구가 비면 확인 비활성. 확인 → `{{ 변수 | default: "대체문구" }}` 를 돌려줌.
const List = styled.div`
  max-height: 300px;
  overflow-y: auto;
  padding: 4px 0;
`;

const Item = styled.button<{ $on: boolean }>`
  display: flex;
  width: 100%;
  padding: 1px 6px;
  border: 0;
  background: transparent;
  cursor: pointer;
  > span { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 8px 8px 10px; border-radius: ${radius.sm}px; background: ${(p) => (p.$on ? color('bg-primary_hover') : 'transparent')}; text-align: left; }
  > span > b { ${text('text-sm', 'medium')}; color: ${color('text-primary')}; }
  > span > em { flex: 1; min-width: 0; font-style: normal; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  > span > i { display: inline-flex; color: ${color('fg-brand-primary')}; }
  &:hover > span { background: ${color('bg-primary_hover')}; }
`;

const Empty = styled.p`
  margin: 0;
  padding: 12px 16px;
  ${text('text-sm', 'regular')};
  color: ${color('text-tertiary')};
`;

const Guide = styled.a`
  margin-right: auto;
  align-self: center;
  ${text('text-sm', 'semibold')};
  color: ${color('text-brand-secondary')};
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

export default function PersonalizeModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (snippet: string) => void }) {
  const anchor = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const [fallback, setFallback] = useState('');
  const q = query.trim().toLowerCase();
  const list = VARIABLES.filter((v) => !q || `${v.name} ${v.desc}`.toLowerCase().includes(q));
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
        <div ref={anchor} style={{ width: 320 }}>
          <TextField
            icon="search"
            placeholder="변수 선택"
            value={open ? query : picked ?? ''}
            onFocus={() => {
              setQuery('');
              setOpen(true);
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            trailing={<Icon name="keyboard_arrow_down" size={16} />}
          />
        </div>
        <Floating anchorRef={anchor} open={open} onClose={() => setOpen(false)} width={320} placement="bottom-start" offset={4}>
          <List>
            {list.length === 0 && <Empty>검색 결과가 없습니다</Empty>}
            {list.map((v) => (
              <Item
                key={v.name}
                type="button"
                $on={v.name === picked}
                onClick={() => {
                  setPicked(v.name);
                  setOpen(false);
                }}
              >
                <span>
                  <b>{v.name}</b>
                  <em>{v.desc}</em>
                  {v.name === picked && (
                    <i>
                      <Icon name="check" size={16} />
                    </i>
                  )}
                </span>
              </Item>
            ))}
          </List>
        </Floating>
      </Field>
      <Field>
        <label htmlFor="pv-fallback">대체 문구</label>
        <TextField id="pv-fallback" placeholder="값이 없을 때 사용할 문구 입력" value={fallback} onChange={(e) => setFallback(e.target.value)} />
      </Field>
    </Dialog>
  );
}
