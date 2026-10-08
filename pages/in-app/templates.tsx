import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { PageTitle } from '@/components/sent/SentList';
import { DISPLAY_LABEL, TEMPLATES, toHtml } from '@/lib/inapp';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 인앱 메시지 템플릿 선택 — Figma 1171:18245 + docs 6장. 유형별 묶음(Bottom Sheet · Modal · Full Screen) + Custom(HTML). 카드 클릭 = /in-app/new?templateId=
const Row = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
`;

const Tile = styled.button`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  > div { position: relative; width: 256px; height: 554px; border: 1px solid ${color('border-secondary')}; border-radius: ${radius.xl}px; background: ${color('bg-secondary')}; box-shadow: ${shadow.xs}; overflow: hidden; }
  > div > iframe { position: absolute; top: 0; left: 0; width: 390px; height: 844px; border: 0; transform: scale(${256 / 390}); transform-origin: 0 0; pointer-events: none; }
  > b { ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; text-align: left; }
  &:hover > div { border-color: ${color('border-brand')}; }
`;

const H = styled.h2`
  margin: 0;
  ${text('text-lg', 'semibold')};
  color: ${color('text-primary')};
`;

export default function InAppTemplates() {
  const router = useRouter();
  return (
    <>
      <PageTitle>
        <h1>인앱 메시지 템플릿 선택</h1>
      </PageTitle>
      {(['BOTTOM_SHEET', 'MODAL', 'FULL_SCREEN'] as const).map((t) => (
        <div key={t} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <H>{DISPLAY_LABEL[t]}</H>
          <Row>
            {TEMPLATES.filter((x) => x.model.displayType === t).map((x) => (
              <Tile key={x.id} type="button" onClick={() => router.push(`/in-app/new?templateId=${x.id}`)}>
                <div>
                  <iframe title={x.title} srcDoc={toHtml(x.model)} sandbox="" tabIndex={-1} />
                </div>
                <b>{x.title}</b>
              </Tile>
            ))}
          </Row>
        </div>
      ))}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <H>Custom</H>
        <Tile type="button" onClick={() => router.push('/in-app/new?templateId=html')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-quaternary)' }}>
            <Icon name="code" size={40} />
          </div>
          <b>HTML</b>
        </Tile>
      </div>
    </>
  );
}
