import { useState } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { Help } from '@/components/channel/ChannelShell';
import Canvas from '@/components/journeys/Canvas';
import { PageTitle } from '@/components/sent/SentList';
import { emitJourneys, journeys, PREBUILT } from '@/lib/journeys';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 새 고객 여정 자동화 생성(추천 여정) — docs/staging-behavior-journeys-inapp.md 2장. 카드 클릭 = 미리보기 서랍(지표 · 통계 없음) → 「이 여정으로 시작」 → 수정 화면.
// AI 패널(프롬프트 · 추천 카드)은 프로토타입 범위 밖이라 카드만 둠.
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
`;

const Tile = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 20px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  background: ${color('bg-primary')};
  box-shadow: ${shadow.xs};
  text-align: left;
  cursor: pointer;
  &:hover { border-color: ${color('border-primary')}; }
  > span { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: ${radius.lg}px; background: ${color('bg-brand-primary')}; color: ${color('fg-brand-secondary')}; }
  > b { ${text('text-md', 'semibold')}; color: ${color('text-primary')}; }
  > p { margin: 0; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
`;

const AiCard = styled(Tile)`
  flex-direction: row;
  align-items: center;
  width: 100%;
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.06));
  > div { display: flex; flex-direction: column; gap: 2px; }
  > div > b { ${text('text-md', 'semibold')}; color: ${color('text-primary')}; }
  > div > p { margin: 0; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
`;

const Drawer = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 45;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 680px;
  padding: 20px 24px;
  background: ${color('bg-primary')};
  box-shadow: ${shadow.xl};
  > header { display: flex; align-items: flex-start; gap: 8px; }
  > header > div { flex: 1; }
  > header h2 { margin: 0; ${text('text-lg', 'semibold')}; color: ${color('text-primary')}; }
  > header p { margin: 4px 0 0; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
`;

export default function PreBuilt() {
  const router = useRouter();
  const [open, setOpen] = useState<null | { id: string; title: string; description: string }>(null);
  const flow = journeys[4]?.nodes ?? journeys[0].nodes;
  const section = (title: string, list: typeof PREBUILT.base) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <b style={{ fontSize: 16, fontWeight: 600 }}>{title}</b>
      <Grid>
        {list.map((x) => (
          <Tile key={x.id} type="button" onClick={() => setOpen(x)}>
            <span>
              <Icon name="account_tree" size={24} />
            </span>
            <b>{x.title}</b>
            <p>{x.description}</p>
            {x.created && <Badge color="brand">사용중</Badge>}
          </Tile>
        ))}
      </Grid>
    </div>
  );
  return (
    <>
      <PageTitle>
        <h1>새 고객 여정 자동화 생성</h1>
        <Help>
          <a href="https://docs.flarelane.co.kr/automations" target="_blank" rel="noreferrer">
            고객 여정 자동화
          </a>
          를 통해 구매 등 유저의 최종 목표 달성을 이끌어낼 수 있도록 시나리오 기반의 메시지 발송 자동화가 가능합니다.
        </Help>
        <i />
        <Button hierarchy="tertiary" onClick={() => router.push('/journeys/new')}>
          나만의 자동화 만들기
        </Button>
      </PageTitle>
      <AiCard type="button">
        <span>
          <Icon name="bolt" size={24} />
        </span>
        <div>
          <b>FlareLane AI를 통한 고객 여정 자동화</b>
          <p>AI가 프로젝트 데이터를 분석해 여정을 생성합니다.</p>
        </div>
      </AiCard>
      {section('추천 고객 여정 자동화', PREBUILT.base)}
      {section('커머스', PREBUILT.commerce)}
      {open && (
        <>
          <div data-cover style={{ position: 'fixed', inset: 0, zIndex: 44, background: 'rgba(0,4,22,0.2)' }} onClick={() => setOpen(null)} />
          <Drawer>
            <header>
              <div>
                <h2>{open.title}</h2>
                <p>{open.description}</p>
              </div>
              <IconButton icon="close" label="닫기" onClick={() => setOpen(null)} />
            </header>
            <Canvas nodes={flow} height="calc(100vh - 200px)" />
            <Button
              hierarchy="primary"
              size="md"
              full
              onClick={() => {
                const id = `jr-${Date.now().toString(36)}`;
                journeys.unshift({ ...journeys[0], id, name: open.title, active: false, lastActivatedAt: undefined, lastPausedAt: undefined, archivedAt: undefined, createdAt: '2026.10.08', entries: 0, conversions: 0, amount: 0, nodes: flow, editor: undefined });
                emitJourneys();
                router.push(`/journeys/${id}/edit`);
              }}
            >
              이 여정으로 시작
            </Button>
          </Drawer>
        </>
      )}
    </>
  );
}
