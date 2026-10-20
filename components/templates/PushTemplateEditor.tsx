import { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Badge, { type BadgeColor } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Floating from '@/components/ui/Floating';
import IconButton from '@/components/ui/IconButton';
import { MenuItem } from '@/components/ui/Menu';
import { ConfirmModal, Dialog } from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import TextField from '@/components/ui/TextField';
import Icon from '@/components/Icon';
import { KV, Stat, StatTiles } from '@/components/channel/ChannelShell';
import { DetailHeader, Section as DSection, Cards } from '@/components/sent/Detail';
import { MsgCols, PreviewCol } from '@/components/sent/MessageLayout';
import PushPreview from '@/components/preview/PushPreview';
import { Cols, Foot, Head, invisibleAlert } from '@/components/newmsg/PushNewMessage';
import { ConversionSection, convError, initialConv, Label, Opt, PlatformSelect, Section, type Conv } from '@/components/newmsg/parts';
import { AiModal, fromMessage, initialPushMsg, PushFields, PushPreviewPanel, TestSend, type PushMsg } from '@/components/newmsg/push';
import Checkbox from '@/components/ui/Checkbox';
import { fmt, pct, PLATFORM_LABEL, won, type Platform } from '@/lib/sent';
import { CATEGORY_COLORS, categories, emitTemplates, pushTemplates, type PushTemplate, type TemplateCategory } from '@/lib/templates';
import { useStore } from '@/lib/store';
import { useLeaveGuard } from '@/lib/useLeaveGuard';
import { Platforms } from './PushTemplateList';

// 푸시 템플릿 새로 만들기 · 수정 · 상세 — docs 8.2.
const ALL: Platform[] = ['android', 'ios', 'webDesktop', 'webMobile'];
const COLOR_LABEL: Record<string, string> = { gray: '회색', brand: '남색', success: '초록', error: '빨강', warning: '노랑', sky: '하늘', orange: '주황', indigo: '인디고', purple: '보라' };

function CategoryModal({ edit, onClose, toast }: { edit?: TemplateCategory; onClose: (c?: TemplateCategory) => void; toast: (s: string) => void }) {
  const [name, setName] = useState(edit?.name ?? '');
  const [c, setC] = useState<string | null>(edit?.color ?? null);
  return (
    <Dialog
      title={edit ? '카테고리 수정' : '새 카테고리'}
      onClose={() => onClose()}
      footer={
        <>
          <Button size="md" onClick={() => onClose()}>
            취소
          </Button>
          <Button
            hierarchy="primary"
            size="md"
            onClick={() => {
              if (!name.trim() || !c) return toast('카테고리 이름과 색을 모두 입력해 주세요.');
              if (edit) {
                Object.assign(edit, { name: name.trim(), color: c });
                toast('카테고리가 추가되었습니다.'); // 스테이징 로케일 그대로(신규/수정 문구가 뒤바뀐 상태)
                return onClose(edit);
              }
              const n = { id: `c${Date.now()}`, name: name.trim(), color: c };
              categories.push(n);
              toast('카테고리가 수정되었습니다.');
              onClose(n);
            }}
          >
            {edit ? '수정' : '추가'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <TextField placeholder="카테고리 이름" value={name} onChange={(e) => setName(e.target.value)} />
        <Select<string>
          value={c}
          placeholder="카테고리 색상 선택"
          options={CATEGORY_COLORS.map((x) => ({ value: x, label: COLOR_LABEL[x] ?? x }))}
          onChange={setC}
        />
        {c && (
          <span>
            <Badge color={c as BadgeColor}>{name || '미리보기'}</Badge>
          </span>
        )}
      </div>
    </Dialog>
  );
}

function CategorySelect({ value, onChange, toast }: { value: TemplateCategory | undefined; onChange: (c: TemplateCategory | undefined) => void; toast: (s: string) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<null | 'new' | TemplateCategory>(null);
  const [, force] = useState(0);
  return (
    <>
      <button ref={ref} type="button" onClick={() => setOpen((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', height: 36, padding: '0 12px', border: '1px solid var(--border-primary)', borderRadius: 8, background: 'var(--bg-primary)', cursor: 'pointer', fontSize: 14, color: value ? 'var(--text-primary)' : 'var(--text-placeholder)' }}>
        <span style={{ flex: 1, textAlign: 'left' }}>{value ? <Badge color={value.color as BadgeColor}>{value.name}</Badge> : '카테고리 선택'}</span>
        <Icon name="keyboard_arrow_down" size={20} />
      </button>
      <Floating anchorRef={ref} open={open} onClose={() => setOpen(false)} width={320} offset={4}>
        <div style={{ padding: '4px 0' }}>
          {categories.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '4px 8px 4px 14px', cursor: 'pointer' }} onClick={() => (onChange(c), setOpen(false))}>
              <span style={{ flex: 1 }}>
                <Badge color={c.color as BadgeColor}>{c.name}</Badge>
              </span>
              <IconButton icon="edit" size="xs" label="수정" onClick={(e) => (e.stopPropagation(), setModal(c), setOpen(false))} />
              <IconButton
                icon="delete"
                size="xs"
                label="삭제"
                onClick={(e) => {
                  e.stopPropagation();
                  categories.splice(categories.indexOf(c), 1);
                  if (value?.id === c.id) onChange(undefined);
                  force((n) => n + 1);
                }}
              />
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border-secondary)', marginTop: 4, paddingTop: 4 }}>
            <MenuItem icon="add" label="새 카테고리" onClick={() => (setModal('new'), setOpen(false))} />
          </div>
        </div>
      </Floating>
      {modal && (
        <CategoryModal
          edit={modal === 'new' ? undefined : modal}
          toast={toast}
          onClose={(c) => {
            if (c) onChange({ ...c });
            setModal(null);
          }}
        />
      )}
    </>
  );
}

type Form = { name: string; category?: TemplateCategory; platforms: Platform[]; msg: PushMsg; conv: Conv; ignoreCapping: boolean };
const fromTemplate = (t?: PushTemplate): Form =>
  t
    ? {
        name: t.name,
        category: t.category,
        platforms: t.targetPlatforms,
        msg: fromMessage(t),
        conv: t.conversion ? { on: true, items: [{ event: t.conversion.event, filters: [], basis: t.conversion.basis, n: t.conversion.hours / 24, unit: 'DAY' }] } : initialConv('CLICK'),
        ignoreCapping: t.ignoreCapping,
      }
    : { name: '', platforms: ALL, msg: initialPushMsg(), conv: initialConv('CLICK'), ignoreCapping: false };

export function PushTemplateForm({ t }: { t?: PushTemplate }) {
  const router = useRouter();
  const { toast } = useStore();
  const allow = useLeaveGuard();
  const [f, setF] = useState<Form>(() => fromTemplate(t));
  const set = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }));
  const [modal, setModal] = useState<null | 'ai' | 'test' | 'confirm'>(null);
  const write = () => {
    const now = '2026.10.08 23:00:00';
    const data = {
      name: f.name.trim(),
      category: f.category,
      title: f.msg.title || undefined,
      body: f.msg.body,
      url: f.msg.url || undefined,
      imageUrl: f.msg.image || undefined,
      buttons: f.msg.buttons.length ? f.msg.buttons : undefined,
      data: f.msg.data.length ? Object.fromEntries(f.msg.data.map((d) => [d.key, d.value])) : undefined,
      targetPlatforms: f.platforms,
      ignoreCapping: f.ignoreCapping,
      conversion: f.conv.on && f.conv.items[0].event ? { event: f.conv.items[0].event, hours: f.conv.items[0].n * (f.conv.items[0].unit === 'DAY' ? 24 : 1), basis: f.conv.items[0].basis } : undefined,
      updatedAt: now,
    };
    allow();
    if (t) {
      Object.assign(t, data);
      emitTemplates();
      toast('템플릿이 수정되었습니다.');
      router.push(`/push/templates/${t.id}`);
    } else {
      pushTemplates.unshift({ ...data, id: String(1300 + pushTemplates.length), createdAt: now, sent: 0, clicked: 0, converted: 0, amount: 0 });
      emitTemplates();
      toast('템플릿이 추가되었습니다.');
      router.push('/push/templates');
    }
  };
  const save = () => {
    if (!f.name.trim()) return toast('템플릿 이름을 입력해 주세요.');
    if (!f.msg.body.trim()) return toast('메시지 내용을 입력해 주세요.');
    if ([f.msg.title, f.msg.body, f.msg.url].some(invisibleAlert)) return;
    const ce = convError(f.conv);
    if (ce) return window.alert(ce);
    if (t) setModal('confirm');
    else write();
  };
  return (
    <>
      <Head>
        <h1>{t ? '템플릿 수정' : '새 템플릿'}</h1>
      </Head>
      <Cols>
        <div>
          <Section n={1} title="정보">
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 12 }}>
              <div>
                <Label>이름</Label>
                <TextField placeholder="템플릿 이름" value={f.name} onChange={(e) => set({ name: e.target.value })} />
              </div>
              <div>
                <Label>카테고리</Label>
                <CategorySelect value={f.category} toast={toast} onChange={(category) => set({ category })} />
              </div>
            </div>
            <div>
              <Label>발송 플랫폼</Label>
              <PlatformSelect value={f.platforms} toast={toast} onChange={(platforms) => set({ platforms: platforms as Platform[] })} />
            </div>
          </Section>
          <Section
            n={2}
            title="메시지"
            actions={
              <Button hierarchy="primary" iconLeading="auto_awesome" onClick={() => setModal('ai')}>
                AI
              </Button>
            }
          >
            <PushFields value={f.msg} toast={toast} onChange={(msg) => set({ msg })} />
          </Section>
          <Section n={3} title="전환 이벤트 설정">
            <ConversionSection value={f.conv} sendOnly={false} onChange={(conv) => set({ conv })} />
            <Opt onClick={() => set({ ignoreCapping: !f.ignoreCapping })}>
              <Checkbox checked={f.ignoreCapping} />
              현재 설정된 발송 빈도 제한 무시 (1일 최대 3개, 1주 최대 10개)
            </Opt>
          </Section>
          <Foot>
            <Button size="md" onClick={() => router.push(`/push/templates/${t?.id ?? ''}`)}>
              취소
            </Button>
            <Button hierarchy="primary" size="md" onClick={save}>
              저장
            </Button>
          </Foot>
        </div>
        <PushPreviewPanel msg={f.msg} onTest={() => setModal('test')} />
      </Cols>
      {modal === 'ai' && (
        <AiModal
          onClose={() => setModal(null)}
          onPick={(c) => {
            set({ msg: { ...f.msg, title: c.title, body: c.body, image: c.image } });
            setModal(null);
          }}
        />
      )}
      {modal === 'test' && <TestSend msg={f.msg} platformsFixed={f.platforms} toast={toast} onClose={() => setModal(null)} />}
      {modal === 'confirm' && (
        <ConfirmModal title="템플릿을 수정하시겠습니까?" description="템플릿을 사용하여 발송 예약된 메시지가 있다면 해당 내용도 함께 변경됩니다." cancelLabel="취소" confirmLabel="확인" onClose={() => setModal(null)} onConfirm={write} />
      )}
    </>
  );
}

export function PushTemplateDetail({ t }: { t: PushTemplate }) {
  const router = useRouter();
  const [del, setDel] = useState(false);
  return (
    <>
      <DetailHeader
        backHref="/push/templates"
        title="템플릿 상세 정보"
        actions={
          <>
            <Button size="md" hierarchy="destructive-secondary" onClick={() => setDel(true)}>
              삭제
            </Button>
            <Button size="md" hierarchy="primary" iconLeading="edit" onClick={() => router.push(`/push/templates/${t.id}/edit`)}>
              수정
            </Button>
          </>
        }
      />
      <Cards>
        <DSection title="정보">
          <KV
            rows={[
              ['카테고리', t.category ? <Badge color={t.category.color as BadgeColor}>{t.category.name}</Badge> : '-', '이름', t.name],
              ['생성 시간', t.createdAt, '최근 수정 시간', t.updatedAt],
              ['발송 플랫폼', <span key="p" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Platforms list={t.targetPlatforms} />{t.targetPlatforms.map((p) => PLATFORM_LABEL[p]).join(', ')}</span>],
            ]}
          />
        </DSection>
        <DSection title="메시지">
          <MsgCols>
            <KV
              rows={[
                ['제목', t.title || '-'],
                ['내용', <span key="b" style={{ whiteSpace: 'pre-wrap' }}>{t.body}</span>],
                ['URL', t.url || '-'],
                ['이미지', t.imageUrl ? <img key="i" src={t.imageUrl} alt="" style={{ maxWidth: 160, borderRadius: 6 }} /> : '-'],
                ['버튼', t.buttons?.map((b) => `${b.label} (${b.link})`).join(', ') || '-'],
                ['데이터', t.data ? <pre key="d" style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(t.data, null, 4)}</pre> : '-'],
              ]}
            />
            <PreviewCol>
              <small>미리보기</small>
              <PushPreview os="android" title={t.title ?? ''} body={t.body} url={t.url ?? 'https://flarelane.com'} image={t.imageUrl} buttons={t.buttons?.map((b) => b.label)} />
            </PreviewCol>
          </MsgCols>
        </DSection>
        <DSection title="전환 이벤트 설정">
          {t.conversion ? (
            <KV rows={[['이벤트', t.conversion.event, '기여 기간', `${t.conversion.hours / 24} 일`], ['전환 측정 기준', t.conversion.basis === 'CLICK' ? '클릭 기반' : '발송 기반']]} />
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-tertiary)' }}>설정된 전환 이벤트가 없습니다.</p>
          )}
        </DSection>
        <DSection title="분석">
          <StatTiles cols={4}>
            <Stat label="발송" value={fmt(t.sent)} />
            <Stat label="클릭" value={fmt(t.clicked)} sub={pct(t.clicked, t.sent)} />
            <Stat label="전환" value={fmt(t.converted)} sub={pct(t.converted, t.clicked)} />
            <Stat label="구매 총액" value={won(t.amount)} />
          </StatTiles>
        </DSection>
      </Cards>
      {del && (
        <ConfirmModal
          destructive
          title="템플릿을 삭제하시겠습니까?"
          description="삭제된 템플릿은 복구할 수 없습니다."
          cancelLabel="취소"
          confirmLabel="삭제"
          onClose={() => setDel(false)}
          onConfirm={() => {
            pushTemplates.splice(pushTemplates.indexOf(t), 1);
            emitTemplates();
            router.push('/push/templates');
          }}
        />
      )}
    </>
  );
}
