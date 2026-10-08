import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';

// 부품 확인용 — Figma 1× 렌더와 픽셀 비교할 때 씀.
export default function DevButtons() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'flex-start', background: '#fff', padding: 24 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <Button hierarchy="primary" iconLeading="add" iconTrailing="keyboard_arrow_down">생성</Button>
        <Button hierarchy="secondary" iconLeading="add">통계 추가</Button>
        <Button hierarchy="tertiary" iconLeading="download">CSV 추출</Button>
        <Button hierarchy="primary" disabled>저장</Button>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Button hierarchy="primary" size="md" iconLeading="add" iconTrailing="keyboard_arrow_down">생성</Button>
        <Button hierarchy="secondary" size="md">취소</Button>
        <IconButton icon="more_horiz" hierarchy="secondary" label="더보기" />
      </div>
    </div>
  );
}
