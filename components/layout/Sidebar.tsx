import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { nav, isUnder, type NavItem } from '@/lib/nav';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma `Sidebar`(927:44594) — 펼침 280 / 접힘 68. 메뉴 목록만 스크롤, 로고 · 프로젝트 카드 · 하단 고정.

const Outer = styled.aside<{ collapsed: boolean }>`
  position: sticky;
  top: 0;
  flex-shrink: 0;
  width: ${(p) => (p.collapsed ? 68 : 280)}px;
  height: 100vh;
  padding: 4px 0 4px 4px;
  transition: width 0.2s ease;
`;

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  box-shadow: ${shadow.xs};
  overflow: hidden;
`;

const Header = styled.div<{ collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${(p) => (p.collapsed ? 'center' : 'space-between')};
  padding: ${(p) => (p.collapsed ? '17px 0 9px' : '17px 12px 17px 20px')};
`;

// Figma `Logo wrap` 109×20 — 글자 바닥선이 정수 픽셀(16)에 오도록 로고를 위로 0.374 올림
const Logo = styled.span`
  position: relative;
  display: block;
  flex-shrink: 0;
  width: 109px;
  height: 20px;
  img { position: absolute; display: block; }
  img:first-of-type { left: 0; top: -0.374px; }
  img:last-of-type { left: 20px; top: 2.96px; }
`;

const UtilityButton = styled.button<{ size?: number }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${(p) => p.size ?? 32}px;
  height: ${(p) => p.size ?? 32}px;
  padding: 0;
  border: 0;
  border-radius: ${radius.sm}px;
  background: transparent;
  color: ${color('fg-quaternary')};
  cursor: pointer;
  &:hover { background: ${color('bg-primary_hover')}; color: ${color('fg-quaternary_hover')}; }
  &:focus-visible { outline: none; box-shadow: ${shadow['focus-ring']}; }
`;

const ProjectWrap = styled.div<{ collapsed: boolean }>`
  padding: ${(p) => (p.collapsed ? '0 0 9px' : '0 8px 16px')};
  display: flex;
  justify-content: center;
`;

const ProjectCard = styled.button<{ collapsed: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  width: ${(p) => (p.collapsed ? '40px' : '100%')};
  padding: ${(p) => (p.collapsed ? '4px' : '12px 11px')};
  justify-content: ${(p) => (p.collapsed ? 'center' : 'flex-start')};
  border: ${(p) => (p.collapsed ? '0' : `1px solid ${color('border-secondary')}`)};
  border-radius: ${radius.xl}px;
  background: ${color('bg-primary_alt')};
  text-align: left;
  cursor: pointer;
  &:hover { background: ${color('bg-primary_hover')}; }
`;

const ProjectIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: ${radius.sm}px;
  background: ${color('bg-brand-solid')};
  color: ${color('text-white')};
  ${text('text-sm', 'semibold')};
`;

const ProjectText = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  span:first-of-type { ${text('text-xs', 'regular')}; color: ${color('text-quaternary')}; }
  span:last-of-type { ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
`;

const ProjectSwitch = styled.span`
  position: absolute;
  top: 7px;
  right: 7px;
  display: inline-flex;
  padding: 6px;
  color: ${color('fg-quaternary')};
`;

const Scroll = styled.nav`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const Subheading = styled.div`
  padding: 0 16px 4px;
  ${text('text-xs', 'bold')};
  color: ${color('text-quaternary')};
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 12px 20px;
`;

const Divider = styled.div`
  padding: 0 12px 16px;
  &::after { content: ''; display: block; height: 1px; background: ${color('border-secondary')}; }
`;

const itemBase = (current: boolean) => `
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-height: 38px;
  margin: 1px 0;
  padding: 8px;
  border: 0;
  border-radius: ${radius.sm}px;
  background: ${current ? color('bg-secondary') : color('bg-primary')};
  color: ${current ? color('text-secondary_hover') : color('text-tertiary')};
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.1s linear, color 0.1s linear;
  & [data-nav-icon] { transition: color 0.1s linear; }
  &:hover {
    background: ${current ? color('bg-secondary_hover') : color('bg-primary_hover')};
    color: ${color('text-secondary_hover')};
  }
  &:hover [data-nav-icon] { color: ${color('fg-primary')}; }
  &:focus-visible { outline: none; box-shadow: ${shadow['focus-ring']}; }
`;

const ItemLink = styled(Link)<{ current: number; collapsed: number }>`
  ${(p) => itemBase(!!p.current)};
  justify-content: ${(p) => (p.collapsed ? 'center' : 'flex-start')};
`;

const ItemButton = styled.button<{ current: boolean; collapsed: boolean }>`
  ${(p) => itemBase(p.current)};
  justify-content: ${(p) => (p.collapsed ? 'center' : 'flex-start')};
`;

const Label = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  ${text('text-sm', 'semibold')};
  white-space: nowrap;
`;

const ItemIcon = styled.span<{ active: boolean }>`
  display: inline-flex;
  color: ${(p) => (p.active ? color('fg-primary') : color('fg-quaternary'))};
`;

const Chevron = styled.span<{ open: boolean }>`
  display: inline-flex;
  color: ${color('fg-quaternary')};
  transform: rotate(${(p) => (p.open ? 90 : 0)}deg);
  transition: transform ${(p) => (p.open ? '0.2s ease-out' : '0.15s ease-in')};
`;

const SubLink = styled(Link)<{ current: number }>`
  ${(p) => itemBase(!!p.current)};
  padding-left: 46px; /* 상위 글자(38)보다 8 더 들여씀 */
  ${text('text-sm', 'medium')};
`;

const Collapse = styled.div<{ open: boolean }>`
  display: grid;
  grid-template-rows: ${(p) => (p.open ? '1fr' : '0fr')};
  transition: grid-template-rows ${(p) => (p.open ? '0.2s ease-out' : '0.15s ease-in')};
  visibility: ${(p) => (p.open ? 'visible' : 'hidden')};
  transition-property: grid-template-rows, visibility;
  transition-delay: 0s, ${(p) => (p.open ? '0s' : '0.15s')};
`;

const SubMenu = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  > div { padding-bottom: 4px; display: flex; flex-direction: column; }
`;

// Smart animate 에서 새로 생기는 레이어 = 투명도 0 → 1
const SubItems = styled.div<{ open: boolean }>`
  opacity: ${(p) => (p.open ? 1 : 0)};
  transition: opacity ${(p) => (p.open ? '0.2s ease-out' : '0.15s ease-in')};
`;

const Footer = styled.div<{ collapsed: boolean }>`
  display: flex;
  flex-direction: ${(p) => (p.collapsed ? 'column' : 'row')};
  align-items: center;
  justify-content: ${(p) => (p.collapsed ? 'center' : 'flex-start')};
  gap: ${(p) => (p.collapsed ? 12 : 10)}px;
  padding: ${(p) => (p.collapsed ? '15px 0 16px' : '15px 12px 16px 16px')};
  border-top: 1px solid ${color('border-secondary')};
`;

const Avatar = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  background: ${color('bg-brand-solid')};
  color: ${color('text-white')};
  ${text('text-xs', 'semibold')};
`;

const Lang = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  padding: 0;
  border: 0;
  background: transparent;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
  cursor: pointer;
  span:last-of-type { color: ${color('fg-quaternary')}; }
`;

function NavGroup({ item, path, collapsed }: { item: NavItem; path: string; collapsed: boolean }) {
  const hasCurrent = !!item.children?.some((c) => isUnder(path, c.href));
  const [open, setOpen] = useState(hasCurrent);
  useEffect(() => {
    if (hasCurrent) setOpen(true);
  }, [hasCurrent]);

  if (item.href) {
    const current = isUnder(path, item.href);
    return (
      <ItemLink href={item.href} current={current ? 1 : 0} collapsed={collapsed ? 1 : 0} title={collapsed ? item.label : undefined}>
        <Label>
          <ItemIcon data-nav-icon active={current}>
            <Icon name={current ? `${item.icon}_filled` : item.icon} size={22} />
          </ItemIcon>
          {!collapsed && item.label}
        </Label>
      </ItemLink>
    );
  }

  return (
    <>
      <ItemButton
        type="button"
        current={collapsed && hasCurrent}
        collapsed={collapsed}
        aria-expanded={open}
        title={collapsed ? item.label : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <Label>
          <ItemIcon data-nav-icon active={open || hasCurrent}>
            <Icon name={collapsed && hasCurrent ? `${item.icon}_filled` : item.icon} size={22} />
          </ItemIcon>
          {!collapsed && item.label}
        </Label>
        {!collapsed && (
          <Chevron open={open}>
            <Icon name="chevron_right" size={16} />
          </Chevron>
        )}
      </ItemButton>
      {!collapsed && (
        <Collapse open={open} aria-hidden={!open}>
          <SubMenu>
            <SubItems open={open}>
              {item.children!.map((c) => (
                <SubLink key={c.href} href={c.href} current={isUnder(path, c.href) ? 1 : 0} tabIndex={open ? 0 : -1}>
                  {c.label}
                </SubLink>
              ))}
            </SubItems>
          </SubMenu>
        </Collapse>
      )}
    </>
  );
}

export default function Sidebar() {
  const router = useRouter();
  const path = router.asPath.split('?')[0];
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Outer collapsed={collapsed}>
      <Panel>
        <Header collapsed={collapsed}>
          {!collapsed && (
            <Logo>
              <img src="/brand/logo-mark.svg" width={13.333} height={20} alt="" />
              <img src="/brand/logo-type.svg" width={88.63} height={13.264} alt="FlareLane" />
            </Logo>
          )}
          <UtilityButton type="button" aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'} onClick={() => setCollapsed((v) => !v)}>
            <Icon name={collapsed ? 'left_panel_open' : 'left_panel_close'} size={20} />
          </UtilityButton>
        </Header>

        <ProjectWrap collapsed={collapsed}>
          <ProjectCard type="button" collapsed={collapsed}>
            <ProjectIcon>j</ProjectIcon>
            {!collapsed && (
              <>
                <ProjectText>
                  <span>Project</span>
                  <span>https://junyeongchoi.github.io</span>
                </ProjectText>
                <ProjectSwitch>
                  <Icon name="unfold_more" size={16} />
                </ProjectSwitch>
              </>
            )}
          </ProjectCard>
        </ProjectWrap>

        <Scroll>
          {nav.map((section, i) => (
            <div key={section.heading}>
              {i > 0 && <Divider />}
              {!collapsed && <Subheading>{section.heading}</Subheading>}
              <Section>
                {section.items.map((item) => (
                  <NavGroup key={item.label} item={item} path={path} collapsed={collapsed} />
                ))}
              </Section>
            </div>
          ))}
        </Scroll>

        <Footer collapsed={collapsed}>
          {collapsed ? (
            <>
              <UtilityButton type="button" aria-label="도움말">
                <Icon name="help" size={20} />
              </UtilityButton>
              <Avatar>한</Avatar>
            </>
          ) : (
            <>
              <Avatar>한</Avatar>
              <Lang type="button">
                <span>한글</span>
                <span>
                  <Icon name="keyboard_arrow_down" size={16} />
                </span>
              </Lang>
              <UtilityButton type="button" aria-label="도움말">
                <Icon name="help" size={20} />
              </UtilityButton>
            </>
          )}
        </Footer>
      </Panel>
    </Outer>
  );
}
