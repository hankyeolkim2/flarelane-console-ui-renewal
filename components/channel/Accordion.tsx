import { useState, type ReactNode } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma 「앱 푸시 설정」 acc — 머리 bg-secondary(아이콘 20 · 제목 sm SemiBold · 배지 · 펼침 화살표), 본문 p16·20.
const Box = styled.div`
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  background: ${color('bg-primary')};
  overflow: hidden;
`;

const Head = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 48px;
  padding: 14px 20px;
  border: 0;
  background: ${color('bg-secondary')};
  text-align: left;
  cursor: pointer;
  > span:first-of-type { display: inline-flex; color: ${color('fg-secondary')}; }
  > b { ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  > i { flex: 1; }
  > span:last-of-type { display: inline-flex; color: ${color('fg-quaternary')}; transition: transform 0.2s ease-out; }
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 20px;
`;

export default function Accordion({ icon, title, badge, defaultOpen = true, children }: { icon: string; title: string; badge?: ReactNode; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Box>
      <Head type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span>
          <Icon name={icon} size={20} />
        </span>
        <b>{title}</b>
        {badge}
        <i />
        <span style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
          <Icon name="keyboard_arrow_down" size={20} />
        </span>
      </Head>
      {open && <Body>{children}</Body>}
    </Box>
  );
}
