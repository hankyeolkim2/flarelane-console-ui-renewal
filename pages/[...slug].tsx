import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import { PageTitle } from '@/components/layout/AppLayout';
import Icon from '@/components/Icon';
import { findNav } from '@/lib/nav';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 아직 만들지 않은 화면 — 메뉴 이름만 보여주는 자리.
const Card = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 64px 24px;
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  box-shadow: ${shadow.xs};
  text-align: center;
`;

const Featured = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: ${radius.lg}px;
  border: 1px solid ${color('border-primary')};
  box-shadow: ${shadow['xs-skeuomorphic']};
  color: ${color('fg-secondary')};
`;

const Title = styled.p`
  margin: 0;
  ${text('text-md', 'semibold')};
  color: ${color('text-primary')};
`;

const Desc = styled.p`
  margin: 0;
  ${text('text-sm', 'regular')};
  color: ${color('text-tertiary')};
`;

export default function Placeholder() {
  const router = useRouter();
  const path = router.asPath.split('?')[0];
  const found = findNav(path);
  const title = found?.item.label ?? '페이지';
  const sub = found?.leaf?.label;

  return (
    <>
      <PageTitle>{title}</PageTitle>
      <Card>
        <Featured>
          <Icon name={found?.item.icon ?? 'dashboard'} size={24} />
        </Featured>
        <div>
          <Title>{sub ? `${title} · ${sub}` : title}</Title>
          <Desc>아직 만들지 않은 화면이에요.</Desc>
        </div>
      </Card>
    </>
  );
}
