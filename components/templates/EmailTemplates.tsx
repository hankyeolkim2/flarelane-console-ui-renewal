import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import { DateRangeMenu } from '@/components/ui/DatePicker';
import Button from '@/components/ui/Button';
import Floating from '@/components/ui/Floating';
import IconButton from '@/components/ui/IconButton';
import { MenuItem } from '@/components/ui/Menu';
import { ConfirmModal } from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import TextField from '@/components/ui/TextField';
import { KV } from '@/components/channel/ChannelShell';
import { DetailHeader, Section as DSection, Cards } from '@/components/sent/Detail';
import { EmptyList, PageTitle } from '@/components/sent/SentList';
import { Foot, Head } from '@/components/newmsg/PushNewMessage';
import { ConversionSection, convError, initialConv, Label, Row, Section, type Conv } from '@/components/newmsg/parts';
import { EmailEditor, EmailPreviewModal, EmailTemplatePicker, Frame, summary } from '@/components/newmsg/EmailNewMessage';
import { addDays, TODAY, ymd } from '@/lib/editor';
import { fmt, won } from '@/lib/sent';
import { emailTemplates, emitTemplates, type EmailTemplate } from '@/lib/templates';
import { useStore } from '@/lib/store';
import { useLeaveGuard } from '@/lib/useLeaveGuard';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';
import { useTemplates } from './PushTemplateList';

// 이메일 템플릿 목록 · 새로/수정 · 상세 — docs 8.3 · 8.4.
const RangeBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 14px;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.md}px;
  background: ${color('bg-primary')};
  box-shadow: ${shadow.xs};
  ${text('text-sm', 'semibold')};
  color: ${color('text-secondary')};
  cursor: pointer;
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
`;
const Card = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  box-shadow: ${shadow.xs};
  cursor: pointer;
  &:hover { border-color: ${color('border-primary')}; }
  > b { ${text('text-md', 'semibold')}; color: ${color('text-primary')}; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  > small { ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
  > dl { margin: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; padding-top: 12px; border-top: 1px solid ${color('border-secondary')}; }
  > dl > div > dt { ${text('text-xs', 'medium')}; color: ${color('text-tertiary')}; }
  > dl > div > dd { margin: 0; ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  > nav { position: absolute; top: 16px; right: 16px; }
`;

function TemplateCard({ t, onDelete }: { t: EmailTemplate; onDelete: () => void }) {
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setStats(true), 500 + ((Number(t.id) * 37) % 1500));
    return () => clearTimeout(id);
  }, [t.id]);
  const href = `/email/templates/${t.id}`;
  const v = (n: string) => (stats ? n : '-');
  return (
    <Card role="link" onClick={(e) => (e.metaKey || e.ctrlKey ? window.open(href, '_blank') : router.push(href))}>
      <div style={{ display: 'flex', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: 8, padding: 8 }}>
        <Frame html={t.html} h={180} scale={0.38} />
      </div>
      <b>{t.name}</b>
      <small>{`최근 수정 시간 ${t.createdAt}`}</small>
      <dl>
        <div>
          <dt>발송</dt>
          <dd>{v(fmt(t.stats.sent))}</dd>
        </div>
        <div>
          <dt>실패</dt>
          <dd>{v(fmt(t.stats.failed))}</dd>
        </div>
        <div>
          <dt>읽음</dt>
          <dd>{v(fmt(t.stats.opened))}</dd>
        </div>
        <div>
          <dt>전환</dt>
          <dd>{v(fmt(t.stats.converted))}</dd>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <dt>구매 총액</dt>
          <dd>{v(won(t.stats.amount))}</dd>
        </div>
      </dl>
      <nav ref={ref} onClick={(e) => e.stopPropagation()}>
        <IconButton icon="more_horiz" hierarchy="secondary" label="더 보기" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((x) => !x)} />
        <Floating anchorRef={ref} open={open} onClose={() => setOpen(false)} width={160} offset={4}>
          <div style={{ padding: '4px 0' }}>
            <MenuItem icon="content_copy" label="복제" onClick={() => router.push(`/email/templates/new?copyMessageId=${t.id}`)} />
            <MenuItem icon="edit" label="수정" onClick={() => router.push(`/email/templates/${t.id}/edit`)} />
            <MenuItem icon="delete" label="삭제" destructive onClick={() => (setOpen(false), onDelete())} />
          </div>
        </Floating>
      </nav>
    </Card>
  );
}

export function EmailTemplateList() {
  const router = useRouter();
  useTemplates();
  const sk = (router.query.sk as string) ?? '';
  const [input, setInput] = useState(sk);
  const [page, setPage] = useState(1);
  const [range, setRange] = useState({ from: ymd(addDays(TODAY, -30)), to: ymd(TODAY) });
  const [ro, setRo] = useState(false);
  const rref = useRef<HTMLButtonElement>(null);
  const [del, setDel] = useState<EmailTemplate | null>(null);
  useEffect(() => {
    if (input === sk) return;
    const t = setTimeout(() => {
      router.replace({ pathname: router.pathname, query: input ? { sk: input } : {} }, undefined, { shallow: true });
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [input, sk, router]);
  const list = emailTemplates.filter((t) => !sk || t.name.toLowerCase().includes(sk.toLowerCase()));
  return (
    <>
      <PageTitle>
        <h1>템플릿</h1>
        <i />
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>데이터 기간 필터</span>
        <RangeBtn ref={rref} type="button" aria-haspopup="dialog" aria-expanded={ro} onClick={() => setRo((x) => !x)}>
          <span>
            <Icon name="calendar_month" size={20} />
          </span>
          {`${range.from} – ${range.to}`}
        </RangeBtn>
        <Floating anchorRef={rref} open={ro} onClose={() => setRo(false)} width={808} offset={8} look="calendar">
          <DateRangeMenu range={range} onCancel={() => setRo(false)} onConfirm={(r) => (setRange(r), setRo(false))} />
        </Floating>
        <Button hierarchy="primary" iconLeading="add" onClick={() => router.push('/email/templates/new')}>
          새 템플릿
        </Button>
      </PageTitle>
      <div style={{ width: 420 }}>
        <TextField icon="search" placeholder="템플릿명 검색" maxLength={100} value={input} onChange={(e) => setInput(e.target.value)} />
      </div>
      {list.length === 0 ? (
        <EmptyList />
      ) : (
        <Grid>
          {list.slice((page - 1) * 10, page * 10).map((t) => (
            <TemplateCard key={`${t.id}-${range.from}-${range.to}`} t={t} onDelete={() => setDel(t)} />
          ))}
        </Grid>
      )}
      {list.length > 0 && <Pagination page={page} pages={Math.ceil(list.length / 10)} onChange={setPage} />}
      {del && (
        <ConfirmModal
          destructive
          title="템플릿을 삭제하시겠습니까?"
          description="삭제된 템플릿은 복구할 수 없습니다."
          cancelLabel="취소"
          confirmLabel="삭제"
          onClose={() => setDel(null)}
          onConfirm={() => {
            emailTemplates.splice(emailTemplates.indexOf(del), 1);
            emitTemplates();
            setDel(null);
          }}
        />
      )}
    </>
  );
}

const Add = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 48px 16px;
  border: 1px dashed ${color('border-primary')};
  border-radius: ${radius.lg}px;
  background: ${color('bg-primary')};
  ${text('text-sm', 'semibold')};
  color: ${color('text-tertiary')};
  cursor: pointer;
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
`;

export function EmailTemplateForm({ t, copy }: { t?: EmailTemplate; copy?: EmailTemplate }) {
  const router = useRouter();
  const { toast } = useStore();
  const allow = useLeaveGuard();
  const src = t ?? copy;
  const [name, setName] = useState(src?.name ?? '');
  const [html, setHtml] = useState(src?.html ?? '');
  const [conv, setConv] = useState<Conv>(src?.conversion ? { on: true, items: [{ event: src.conversion.event, filters: [], basis: src.conversion.basis, n: src.conversion.hours / 24, unit: 'DAY' }] } : initialConv('CLICK'));
  const [modal, setModal] = useState<null | 'pick' | 'preview' | 'edit'>(null);
  const save = () => {
    if (!name.trim() || !html) return toast('빈 값이 존재합니다.');
    const ce = convError(conv);
    if (ce) return window.alert(ce);
    allow();
    const c = conv.on ? { event: conv.items[0].event, hours: conv.items[0].n * (conv.items[0].unit === 'DAY' ? 24 : 1), basis: conv.items[0].basis } : undefined;
    let id = t?.id;
    if (t) Object.assign(t, { name: name.trim(), html, conversion: c });
    else {
      id = String(8900 + emailTemplates.length);
      emailTemplates.unshift({ id, name: name.trim(), html, conversion: c, createdAt: '2026.10.08 23:00:00', stats: { sent: 0, failed: 0, opened: 0, converted: 0, amount: 0 } });
    }
    emitTemplates();
    toast('템플릿이 추가되었습니다.');
    router.push(`/email/templates/${id}`);
  };
  return (
    <>
      <Head>
        <h1>{t ? '이메일 템플릿 수정' : '새 이메일 템플릿'}</h1>
      </Head>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 960 }}>
        <Section n={1} title="이름">
          <TextField placeholder="템플릿 이름" value={name} onChange={(e) => setName(e.target.value)} />
        </Section>
        <Section n={2} title="메시지">
          {html ? (
            <>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: 16, borderRadius: 10, background: 'var(--bg-secondary)' }}>
                <Frame html={html} h={320} scale={0.6} />
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  <IconButton icon="close" label="본문 삭제" hierarchy="secondary" onClick={() => setHtml('')} />
                </div>
              </div>
              <Row>
                <small style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary(html)}</small>
                <Button onClick={() => setModal('preview')}>미리보기</Button>
                <Button onClick={() => setModal('edit')}>편집</Button>
              </Row>
            </>
          ) : (
            <Add type="button" onClick={() => setModal('pick')}>
              <span>
                <Icon name="add_circle" size={28} />
              </span>
              이메일 본문 추가하기
            </Add>
          )}
        </Section>
        <Section n={3} title="전환 이벤트 설정">
          <ConversionSection value={conv} sendOnly={false} onChange={setConv} />
        </Section>
        <Foot>
          <Button size="md" onClick={() => router.push('/email/templates')}>
            취소
          </Button>
          <Button hierarchy="primary" size="md" onClick={save}>
            저장
          </Button>
        </Foot>
      </div>
      {modal === 'pick' && <EmailTemplatePicker quickOnly onClose={() => setModal(null)} onPick={(h) => (setHtml(h), setModal(null))} />}
      {modal === 'preview' && <EmailPreviewModal html={html} subject={name} onClose={() => setModal(null)} />}
      {modal === 'edit' && <EmailEditor title={name || '이메일 편집'} html={html} onClose={() => setModal(null)} onDone={(h) => (setHtml(h), setModal(null))} />}
    </>
  );
}

export function EmailTemplateDetail({ t }: { t: EmailTemplate }) {
  const router = useRouter();
  const [del, setDel] = useState(false);
  const [pv, setPv] = useState(false);
  return (
    <>
      <DetailHeader
        backHref="/email/templates"
        title="템플릿 상세 정보"
        actions={
          <>
            <Button size="md" iconLeading="content_copy" onClick={() => router.push(`/email/templates/new?copyMessageId=${t.id}`)}>
              복제
            </Button>
            <Button size="md" hierarchy="destructive-secondary" onClick={() => setDel(true)}>
              삭제
            </Button>
            <Button size="md" hierarchy="primary" iconLeading="edit" onClick={() => router.push(`/email/templates/${t.id}/edit`)}>
              수정
            </Button>
          </>
        }
      />
      <Cards>
        <DSection title="정보">
          <KV rows={[['템플릿 이름', t.name], ['생성 시간', t.createdAt, '최근 수정 시간', t.createdAt]]} />
        </DSection>
        <DSection title="메시지">
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ padding: 16, borderRadius: 10, background: 'var(--bg-secondary)' }}>
              <Frame html={t.html} h={400} scale={0.6} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
              <Label>본문 요약</Label>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>{summary(t.html)}</p>
              <div>
                <Button onClick={() => setPv(true)}>미리보기</Button>
              </div>
            </div>
          </div>
        </DSection>
        <DSection title="전환 이벤트 설정">
          {t.conversion ? (
            <KV rows={[['이벤트', t.conversion.event, '기여 기간', `${t.conversion.hours / 24} 일`], ['전환 측정 기준', t.conversion.basis === 'CLICK' ? '클릭 기반' : '발송 기반']]} />
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-tertiary)' }}>설정된 전환 이벤트가 없습니다.</p>
          )}
        </DSection>
      </Cards>
      {pv && <EmailPreviewModal html={t.html} subject={t.name} onClose={() => setPv(false)} />}
      {del && (
        <ConfirmModal
          destructive
          title="템플릿을 삭제하시겠습니까?"
          description="삭제된 템플릿은 복구할 수 없습니다."
          cancelLabel="취소"
          confirmLabel="삭제"
          onClose={() => setDel(false)}
          onConfirm={() => {
            emailTemplates.splice(emailTemplates.indexOf(t), 1);
            emitTemplates();
            router.push('/email/templates');
          }}
        />
      )}
    </>
  );
}
