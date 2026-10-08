import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Badge, { type BadgeColor } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import { CountTabs } from '@/components/ui/Tabs';
import TextField from '@/components/ui/TextField';
import { Help, KV, Stat, StatTiles } from '@/components/channel/ChannelShell';
import { DetailHeader, Section as DSection, Cards } from '@/components/sent/Detail';
import { MsgCols, PreviewCol } from '@/components/sent/MessageLayout';
import { EmptyList, ListCard, PageTitle, SentRow } from '@/components/sent/SentList';
import { AlimtalkPreview } from '@/components/preview/KakaoPreview';
import { Cols, Foot, Head, invisibleAlert } from '@/components/newmsg/PushNewMessage';
import { PreviewCard } from '@/components/newmsg/Shell';
import { Label, LabeledToggle, Radios, Row, Section } from '@/components/newmsg/parts';
import { fmt } from '@/lib/sent';
import { alimtalkTemplates, emitTemplates, INSPECTION_LABEL, SENDER, type AlimtalkTemplate, type Inspection } from '@/lib/templates';
import { useLeaveGuard } from '@/lib/useLeaveGuard';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';
import { useTemplates } from './PushTemplateList';

// 알림톡 템플릿 목록 · 상세(검수 요청) · 새로/수정 — docs 8.5 ~ 8.7.
type Tab = 'COM' | 'REQ' | 'REJ' | 'TMP';
const TABS: Tab[] = ['COM', 'REQ', 'REJ', 'TMP'];
const inTab = (t: AlimtalkTemplate, tab: Tab) => (tab === 'TMP' ? t.inspection === 'TMP' || t.inspection === 'APL' : t.inspection === tab);
const TONE: Record<Inspection, BadgeColor> = { TMP: 'gray', APL: 'gray', REQ: 'warning', COM: 'success', REJ: 'error' };
export const InspectionBadge = ({ i }: { i: Inspection }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
    <Badge color={TONE[i]}>{INSPECTION_LABEL[i]}</Badge>
  </span>
);

export function AlimtalkTemplateList() {
  const router = useRouter();
  useTemplates();
  const q = router.query as { p?: string; isp?: string; sk?: string };
  const isp = (TABS as string[]).includes(q.isp ?? '') ? (q.isp as Tab) : 'COM';
  const page = Math.max(1, Number(q.p) || 1);
  const sk = q.sk ? decodeURIComponent(q.sk) : '';
  const [input, setInput] = useState(sk);
  useEffect(() => setInput(sk), [sk]);
  const k = sk.toLowerCase();
  const match = (t: AlimtalkTemplate) => !k || t.templateName.toLowerCase().includes(k) || t.templateCode.toLowerCase().includes(k);
  const list = alimtalkTemplates.filter((t) => inTab(t, isp) && match(t));
  const push = (x: Record<string, string | number>) => router.push({ pathname: router.pathname, query: Object.fromEntries(Object.entries(x).filter(([, v]) => v !== '')) });
  return (
    <>
      <PageTitle>
        <h1>템플릿</h1>
        <i />
        <Button hierarchy="primary" iconLeading="add" onClick={() => router.push('/alimtalk/templates/new')}>
          새 템플릿
        </Button>
      </PageTitle>
      <CountTabs<Tab> items={TABS.map((t) => ({ value: t, label: `${INSPECTION_LABEL[t]} `, count: alimtalkTemplates.filter((x) => inTab(x, t)).length }))} value={isp} onChange={(t) => push({ isp: t, sk: encodeURIComponent(sk), p: 1 })} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ width: 420 }}>
          <TextField icon="search" placeholder="템플릿명, 코드 검색" maxLength={100} value={input} onChange={(e) => setInput(e.target.value)} onKeyUp={(e) => e.key === 'Enter' && push({ sk: encodeURIComponent(input.trim()), isp, p: 1 })} />
        </div>
        <Button onClick={() => push({ sk: encodeURIComponent(input.trim()), isp, p: 1 })}>검색</Button>
      </div>
      <ListCard>
        {list.length === 0 ? (
          <EmptyList />
        ) : (
          list.slice((page - 1) * 10, page * 10).map((t) => (
            <SentRow
              key={t.id}
              source="console"
              lead={<InspectionBadge i={t.inspection} />}
              topBadge={<small style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{t.templateCode}</small>}
              content={{ title: t.templateName, body: t.templateContent, bodyLines: 2 }}
              cols={[
                [160, [{ label: '생성 시간', value: t.createdAt.slice(0, 16) }]],
                [112, [{ label: '전체 유저', value: fmt(t.stats.selected) }, { label: '전환 유저', value: fmt(t.stats.converted) }]],
                [112, [{ label: '발송 유저', value: fmt(t.stats.sent) }, { label: 'ROAS', value: `${t.stats.roas}%` }]],
              ]}
              href={`/alimtalk/templates/${t.id}`}
              menu={[]}
            />
          ))
        )}
        {list.length > 0 && <Pagination page={page} pages={Math.ceil(list.length / 10)} onChange={(n) => push({ p: n, sk: encodeURIComponent(sk), isp })} />}
      </ListCard>
    </>
  );
}

const Reject = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  border: 1px solid ${color('border-error_subtle')};
  border-radius: ${radius.md}px;
  background: ${color('bg-error-primary')};
  ${text('text-sm', 'regular')};
  color: ${color('text-error-primary')};
  > b { ${text('text-sm', 'semibold')}; }
`;

export function AlimtalkTemplateDetail({ t }: { t: AlimtalkTemplate }) {
  const router = useRouter();
  const [comment, setComment] = useState('');
  const [, force] = useState(0);
  const editable = t.inspection === 'TMP' || t.inspection === 'APL' || t.inspection === 'REJ';
  return (
    <>
      <DetailHeader backHref="/alimtalk/templates" title="템플릿 상세 정보" />
      <Cards>
        <DSection title="정보">
          {t.inspection === 'REJ' && (
            <Reject>
              <b>심사 반려되었습니다.</b>
              {t.rejectComment}
            </Reject>
          )}
          <KV
            rows={[
              ['ID', t.id, '발신 프로필', <span key="s">{SENDER.plusFriendId} <span style={{ color: 'var(--text-tertiary)' }}>{SENDER.name}</span></span>],
              ['카테고리', `${t.categoryGroup} > ${t.category}`, '상태', <InspectionBadge key="i" i={t.inspection} />],
              ['템플릿 이름', t.templateName, '템플릿 코드', t.templateCode],
              ['생성 시간', t.createdAt, '최근 업데이트', t.updatedAt],
            ]}
          />
        </DSection>
        <DSection title="메시지">
          <MsgCols>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <KV
                rows={[
                  ['강조유형', { NONE: '기본형', TEXT: '강조 표기형', IMAGE: '이미지형', ITEM_LIST: '아이템 리스트형' }[t.emphasis]],
                  ['메시지 유형', { BA: '기본형', EX: '부가 정보형', AD: '채널 추가형', MI: '복합형' }[t.messageType]],
                  ...(t.templateTitle ? ([['제목', t.templateTitle]] as [string, string][]) : []),
                  ['내용', <span key="c" style={{ whiteSpace: 'pre-wrap' }}>{t.templateContent}</span>],
                  ...(t.templateExtra ? ([['부가 정보', t.templateExtra]] as [string, string][]) : []),
                  ['버튼', t.buttons.map((b) => `${b.type} · ${b.name}`).join('\n') || '-'],
                  ['보안 템플릿', t.security ? '사용' : '사용 안 함'],
                ]}
              />
              {t.inspection === 'REQ' ? (
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-tertiary)' }}>검수 중인 템플릿은 수정이 불가합니다.</p>
              ) : (
                editable && (
                  <div>
                    <Button iconLeading="edit" onClick={() => router.push(`/alimtalk/templates/${t.id}/edit`)}>
                      {t.inspection === 'REJ' ? '재검수 요청' : '수정'}
                    </Button>
                  </div>
                )
              )}
            </div>
            <PreviewCol>
              <small>미리보기</small>
              <AlimtalkPreview m={{ ...t, interpolations: {} } as never} />
            </PreviewCol>
          </MsgCols>
        </DSection>
        {(t.inspection === 'TMP' || t.inspection === 'APL') && (
          <DSection title="검수 요청">
            <div>
              <Label>내용</Label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} style={{ width: '100%', minHeight: 100, padding: 12, border: '1px solid var(--border-primary)', borderRadius: 8, font: 'inherit', fontSize: 14, resize: 'vertical' }} />
            </div>
            <Row style={{ justifyContent: 'flex-end' }}>
              <Button
                hierarchy="primary"
                size="md"
                onClick={() => {
                  if (!window.confirm('검수 요청을 하시겠습니까?')) return;
                  t.inspection = 'REQ';
                  emitTemplates();
                  force((n) => n + 1);
                }}
              >
                검수 요청
              </Button>
            </Row>
          </DSection>
        )}
        {t.inspection === 'COM' && (
          <DSection title="분석">
            <StatTiles cols={4}>
              <Stat label="전체 유저" value={fmt(t.stats.selected)} />
              <Stat label="발송 유저" value={fmt(t.stats.sent)} />
              <Stat label="전환 유저" value={fmt(t.stats.converted)} />
              <Stat label="ROAS" value={`${t.stats.roas}%`} />
            </StatTiles>
          </DSection>
        )}
        {editable && (
          <Row>
            <Button
              size="md"
              hierarchy="destructive-secondary"
              onClick={() => {
                if (!window.confirm('정말 삭제하시겠습니까?')) return;
                alimtalkTemplates.splice(alimtalkTemplates.indexOf(t), 1);
                emitTemplates();
                router.push('/alimtalk/templates');
              }}
            >
              템플릿 삭제
            </Button>
          </Row>
        )}
      </Cards>
    </>
  );
}

// ── 새로 만들기 · 수정
const BTN_TYPES = ['웹 링크', '앱 링크', '채널 추가', '배송 조회', '봇키워드', '메시지 전달', '상담톡 전환', '챗봇 전환', '이미지 보안 전송 플러그인', '개인정보이용 플러그인', '원클릭 결제 플러그인', '비즈폼']; // kakao 로케일 그대로
const CATS: [string, string][] = [
  ['회원', '회원가입'],
  ['회원', '포인트'],
  ['회원', '보안'],
  ['거래', '주문'],
  ['거래', '배송'],
  ['거래', '결제'],
  ['예약', '예약 완료'],
  ['마케팅', '쿠폰'],
];
const Count = ({ n, max }: { n: number; max: number }) => <small style={{ display: 'block', marginTop: 4, textAlign: 'right', fontSize: 12, color: 'var(--text-tertiary)' }}>{`${n}/${max}자`}</small>;
const Area = ({ value, onChange, max, rows = 6, readOnly, placeholder }: { value: string; onChange?: (v: string) => void; max?: number; rows?: number; readOnly?: boolean; placeholder?: string }) => (
  <>
    <textarea readOnly={readOnly} rows={rows} maxLength={max} placeholder={placeholder} value={value} onChange={(e) => onChange?.(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-primary)', borderRadius: 8, font: 'inherit', fontSize: 14, resize: 'vertical', background: readOnly ? 'var(--bg-secondary)' : 'var(--bg-primary)' }} />
    {max && <Count n={value.length} max={max} />}
  </>
);
const F = ({ label, children, help }: { label: string; children: ReactNode; help?: string }) => (
  <div>
    <Label>
      {label}
      {help && <Help>{help}</Help>}
    </Label>
    {children}
  </div>
);

export function AlimtalkTemplateForm({ t }: { t?: AlimtalkTemplate }) {
  const router = useRouter();
  const allow = useLeaveGuard();
  const [f, setF] = useState<AlimtalkTemplate>(
    () =>
      t ? JSON.parse(JSON.stringify(t)) : { id: '', inspection: 'TMP', sender: SENDER.plusFriendId, createdAt: '', updatedAt: '', stats: { selected: 0, sent: 0, converted: 0, roas: 0 }, templateName: '', templateCode: '', categoryGroup: '', category: '', emphasis: 'NONE', messageType: 'BA', templateContent: '', buttons: [], security: false },
  );
  const set = (p: Partial<AlimtalkTemplate>) => setF((x) => ({ ...x, ...p }));
  const save = () => {
    const fail = (s: string) => (window.alert(s), undefined);
    if (f.buttons.length > 5) return fail('버튼은 최대 5개까지 추가 가능합니다.');
    if (f.emphasis === 'ITEM_LIST') {
      if (!f.templateHeader && !f.itemHighlight?.title && !(f.items ?? []).length && !f.templateImage) return fail('아이템 리스트형은 헤더, 아이템 하이라이트, 아이템 리스트, 이미지 중 1개 이상 입력이 필요합니다.');
      if ((f.items ?? []).length < 2) return fail('아이템 리스트는 2개 이상 입력이 필요합니다.');
      if ((f.items ?? []).some((x) => !x.name || !x.desc)) return fail('아이템 리스트의 각 항목은 title, description 모두 입력이 필요합니다.');
    }
    if ([f.templateContent, f.templateTitle ?? '', f.templateExtra ?? ''].some(invisibleAlert)) return;
    allow();
    const now = '2026.10.08 23:00:00';
    const ad = f.messageType === 'AD' || f.messageType === 'MI' ? '채널 추가하고 이 채널의 마케팅 메시지 등을 카카오톡으로 받기' : undefined;
    if (t) {
      Object.assign(t, { ...f, templateAd: ad, updatedAt: now, inspection: t.inspection === 'REJ' ? 'TMP' : t.inspection });
      emitTemplates();
      router.push(`/alimtalk/templates/${t.id}`);
    } else {
      const id = String(5200 + alimtalkTemplates.length);
      alimtalkTemplates.unshift({ ...f, id, templateAd: ad, createdAt: now, updatedAt: now, inspection: 'TMP' });
      emitTemplates();
      router.push(`/alimtalk/templates/${id}`);
    }
  };
  const ad = f.messageType === 'AD' || f.messageType === 'MI';
  const extra = f.messageType === 'EX' || f.messageType === 'MI';
  return (
    <>
      <Head>
        <h1>새 템플릿</h1>
      </Head>
      <Cols>
        <div>
          <Section n={1} title="정보">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <F label="발신 프로필">
                <Select<string> value={f.sender} options={[{ value: SENDER.plusFriendId, label: `${SENDER.plusFriendId} / ${SENDER.name}` }]} onChange={(sender) => set({ sender })} />
              </F>
              <F label="카테고리">
                <Select<string> value={f.category ? `${f.categoryGroup}|${f.category}` : null} placeholder="카테고리 선택" options={CATS.map(([g, c]) => ({ value: `${g}|${c}`, label: `${g} > ${c}` }))} onChange={(v) => set({ categoryGroup: v.split('|')[0], category: v.split('|')[1] })} />
              </F>
              <F label="템플릿 이름">
                <TextField placeholder="템플릿 이름 200자" maxLength={200} value={f.templateName} onChange={(e) => set({ templateName: e.target.value })} />
              </F>
              <F label="템플릿 코드">
                <TextField placeholder="템플릿 코드 20자 (영문, 숫자, -, _)" maxLength={20} value={f.templateCode} onChange={(e) => set({ templateCode: e.target.value.replace(/[^A-Za-z0-9_-]/g, '') })} />
              </F>
            </div>
          </Section>
          <Section n={2} title="메시지">
            <F label="강조유형">
              <Radios<AlimtalkTemplate['emphasis']>
                value={f.emphasis}
                options={[
                  { value: 'NONE', label: '기본형' },
                  { value: 'TEXT', label: '강조 표기형' },
                  { value: 'IMAGE', label: '이미지형' },
                  { value: 'ITEM_LIST', label: '아이템 리스트형' },
                ]}
                onChange={(emphasis) => set({ emphasis, items: emphasis === 'ITEM_LIST' ? f.items ?? [{ name: '', desc: '' }, { name: '', desc: '' }] : undefined })}
              />
            </F>
            <F label="메시지 유형">
              <Radios<AlimtalkTemplate['messageType']>
                value={f.messageType}
                options={[
                  { value: 'BA', label: '기본형' },
                  { value: 'EX', label: '부가 정보형' },
                  { value: 'AD', label: '채널 추가형' },
                  { value: 'MI', label: '복합형' },
                ]}
                onChange={(messageType) => set({ messageType })}
              />
            </F>
            {(f.emphasis === 'IMAGE' || f.emphasis === 'ITEM_LIST') && (
              <F label="이미지">
                <Row>
                  <TextField readOnly value={f.templateImage ? '업로드됨' : ''} placeholder="이미지를 업로드해 주세요" />
                  <Button iconLeading="upload" onClick={() => set({ templateImage: 'uploaded.png' })}>
                    업로드
                  </Button>
                </Row>
              </F>
            )}
            {f.emphasis === 'TEXT' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <F label="제목">
                  <TextField maxLength={50} value={f.templateTitle ?? ''} onChange={(e) => set({ templateTitle: e.target.value })} />
                  <Count n={(f.templateTitle ?? '').length} max={50} />
                </F>
                <F label="부제목">
                  <TextField maxLength={50} value={f.templateSubtitle ?? ''} onChange={(e) => set({ templateSubtitle: e.target.value })} />
                  <Count n={(f.templateSubtitle ?? '').length} max={50} />
                </F>
              </div>
            )}
            {f.emphasis === 'ITEM_LIST' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, border: '1px solid var(--border-secondary)', borderRadius: 10 }}>
                <F label="헤더">
                  <TextField placeholder="최대 16자, 변수 사용 가능" maxLength={16} value={f.templateHeader ?? ''} onChange={(e) => set({ templateHeader: e.target.value })} />
                </F>
                <F label="아이템 하이라이트">
                  <Row>
                    <TextField placeholder="최대 30자(썸네일 추가 시 최대 21자), 변수 사용 가능" maxLength={30} value={f.itemHighlight?.title ?? ''} onChange={(e) => set({ itemHighlight: { title: e.target.value, desc: f.itemHighlight?.desc ?? '' } })} />
                    <TextField placeholder="최대 19자, 변수 사용 가능" maxLength={19} value={f.itemHighlight?.desc ?? ''} onChange={(e) => set({ itemHighlight: { title: f.itemHighlight?.title ?? '', desc: e.target.value } })} />
                  </Row>
                </F>
                <F label="아이템 리스트">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(f.items ?? []).map((it, i) => (
                      <Row key={i}>
                        <div style={{ width: 160 }}>
                          <TextField placeholder="최대 6자, 변수 사용 불가" maxLength={6} value={it.name} onChange={(e) => set({ items: f.items!.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                        </div>
                        <TextField placeholder="최대 23자, 변수 사용 가능" maxLength={23} value={it.desc} onChange={(e) => set({ items: f.items!.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)) })} />
                        <IconButton icon="remove" label="삭제" onClick={() => set({ items: f.items!.filter((_, j) => j !== i) })} />
                      </Row>
                    ))}
                    {(f.items ?? []).length < 10 && (
                      <Row style={{ justifyContent: 'flex-end' }}>
                        <Button iconLeading="add" onClick={() => set({ items: [...(f.items ?? []), { name: '', desc: '' }] })}>
                          아이템 추가
                        </Button>
                      </Row>
                    )}
                  </div>
                </F>
              </div>
            )}
            <F label="내용">
              <Area value={f.templateContent} max={1000} rows={8} placeholder="#{변수} 형식으로 변수를 넣을 수 있습니다." onChange={(templateContent) => set({ templateContent })} />
            </F>
            {extra && (
              <F label="부가 정보">
                <Area value={f.templateExtra ?? ''} max={500} rows={3} onChange={(templateExtra) => set({ templateExtra })} />
              </F>
            )}
            {ad && (
              <F label="안내 멘트">
                <Area readOnly rows={2} value="채널 추가하고 이 채널의 마케팅 메시지 등을 카카오톡으로 받기" />
              </F>
            )}
            <F label="버튼">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {f.buttons.map((b, i) => (
                  <Row key={i}>
                    <div style={{ width: 180 }}>
                      <Select<string> value={b.type} options={BTN_TYPES.map((x) => ({ value: x, label: x }))} onChange={(type) => set({ buttons: f.buttons.map((x, j) => (j === i ? { ...x, type, name: type === '채널 추가' ? '채널 추가' : x.name } : x)) })} />
                    </div>
                    <TextField placeholder="버튼 이름" maxLength={14} value={b.name} onChange={(e) => set({ buttons: f.buttons.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                    <IconButton icon="remove" label="삭제" onClick={() => set({ buttons: f.buttons.filter((_, j) => j !== i) })} />
                  </Row>
                ))}
                <Row style={{ justifyContent: 'flex-end' }}>
                  <Button iconLeading="add" onClick={() => (f.buttons.length >= 5 ? window.alert('버튼은 최대 5개까지 추가 가능합니다.') : set({ buttons: [...f.buttons, { type: '웹 링크', name: '' }] }))}>
                    버튼 추가
                  </Button>
                </Row>
              </div>
            </F>
            <Row>
              <LabeledToggle checked={f.security} label="보안 템플릿" onChange={(security) => set({ security })} />
              <Help>메시지 내용은 모바일 기기에서만 확인 가능하며, …</Help>{/* 뒷부분 문구 미확인(하드코딩) */}
            </Row>
          </Section>
          <Foot>
            <Button size="md" onClick={() => router.push('/alimtalk/templates')}>
              취소
            </Button>
            <Button hierarchy="primary" size="md" onClick={save}>
              저장
            </Button>
          </Foot>
        </div>
        <PreviewCard>
          <header>미리보기</header>
          <AlimtalkPreview m={{ ...f, templateAd: ad ? '채널 추가하고 이 채널의 마케팅 메시지 등을 카카오톡으로 받기' : undefined, interpolations: {} } as never} />
        </PreviewCard>
      </Cols>
    </>
  );
}

