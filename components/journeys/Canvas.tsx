import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import type { JourneyNode } from '@/lib/journeys';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 여정 캔버스 읽기 전용 그림 — 스테이징 캔버스(노드 편집 · 분석 패널)는 범위 밖이라 노드를 세로로 이은 단순화 그림.
const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  border-radius: ${radius.xl}px;
  background-color: ${color('bg-secondary')};
  background-image: radial-gradient(${color('border-primary')} 1px, transparent 1px);
  background-size: 16px 16px;
  overflow: auto;
`;

const Node = styled.button<{ $entry: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 280px;
  padding: 12px 14px;
  border: 1px solid ${(p) => (p.$entry ? color('border-brand') : color('border-secondary'))};
  border-radius: ${radius.lg}px;
  background: ${color('bg-primary')};
  box-shadow: ${shadow.xs};
  text-align: left;
  cursor: ${(p) => (p.$entry ? 'pointer' : 'default')};
  > span { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: ${radius.md}px; background: ${color('bg-brand-primary')}; color: ${color('fg-brand-secondary')}; }
  > div { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  > div > b { ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  > div > small { ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  > em { font-style: normal; ${text('text-xs', 'semibold')}; color: ${color('text-brand-secondary')}; }
`;

const Line = styled.i`
  width: 2px;
  height: 24px;
  background: ${color('border-primary')};
`;

const ICON: Record<JourneyNode['type'], string> = { ENTRY: 'play_circle', MESSAGE: 'send', DELAY: 'schedule', CONDITION: 'account_tree', EXIT: 'check_circle' };

export default function Canvas({ nodes, stats, onEntry, height = 420 }: { nodes: JourneyNode[]; stats?: number[]; onEntry?: () => void; height?: number | string }) {
  return (
    <Wrap style={{ height }}>
      {nodes.map((n, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {i > 0 && <Line />}
          <Node type="button" $entry={n.type === 'ENTRY'} onClick={() => n.type === 'ENTRY' && onEntry?.()}>
            <span>
              <Icon name={ICON[n.type]} size={18} />
            </span>
            <div>
              <b>{n.title}</b>
              {n.detail && <small>{n.detail}</small>}
            </div>
            {stats && <em>{stats[i].toLocaleString('ko-KR')}</em>}
          </Node>
        </div>
      ))}
    </Wrap>
  );
}
