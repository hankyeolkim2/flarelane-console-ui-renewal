import { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import { Anchor, Menu, MenuDivider, MenuItem } from '@/components/ui/Menu';
import { useStore } from '@/lib/store';

// 「생성」 — 인사이트 · 퍼널 = 새 통계 편집으로 이동, 보드 = 이름 없는 보드를 바로 만들고 그 보드로 이동.
export default function CreateMenu() {
  const router = useRouter();
  const { createBoard } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const go = (type: 'INSIGHT' | 'FUNNEL') => {
    setOpen(false);
    router.push(`/analytics-reports/new?type=${type}`);
  };
  return (
    <Anchor ref={ref}>
      <Button hierarchy="primary" size="md" iconLeading="add" iconTrailing={open ? 'keyboard_arrow_up' : 'keyboard_arrow_down'} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        생성
      </Button>
      <Menu open={open} onClose={() => setOpen(false)} anchorRef={ref} width={280} align="end">
        <MenuItem icon="show_chart" label="인사이트" description="이벤트의 발생 현황과 추이 분석" onClick={() => go('INSIGHT')} />
        <MenuItem icon="funnel" label="퍼널" description="단계별 전환율과 이탈률 분석" onClick={() => go('FUNNEL')} />
        <MenuDivider />
        <MenuItem
          icon="create_new_folder"
          label="보드"
          onClick={() => {
            setOpen(false);
            const b = createBoard();
            router.push(`/analytics-boards/${b.id}`);
          }}
        />
      </Menu>
    </Anchor>
  );
}
