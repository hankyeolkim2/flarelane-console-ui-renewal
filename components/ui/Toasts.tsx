import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { useStore } from '@/lib/store';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 성공 알림 — 화면 오른쪽 위에 붙음(시안 규칙: 토스트는 위 · 오른쪽 여백 없이).
const Stack = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  pointer-events: none;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 320px;
  max-width: 400px;
  padding: 16px;
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.xl}px;
  box-shadow: ${shadow.lg};
  pointer-events: auto;
  ${text('text-sm', 'semibold')};
  color: ${color('text-primary')};
  > span:first-of-type { display: inline-flex; color: ${color('fg-success-primary')}; }
  > p { flex: 1; margin: 0; }
  > button { display: inline-flex; padding: 0; border: 0; background: none; color: ${color('fg-quaternary')}; cursor: pointer; }
`;

export default function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <Stack aria-live="polite">
      {toasts.map((t) => (
        <Item key={t.id} role="status">
          <span>
            <Icon name="check" size={20} />
          </span>
          <p>{t.text}</p>
          <button type="button" aria-label="닫기" onClick={() => dismissToast(t.id)}>
            <Icon name="close" size={20} />
          </button>
        </Item>
      ))}
    </Stack>
  );
}
