import { useRef, useState } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Badge, { type BadgeColor } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { Dialog } from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import TextField from '@/components/ui/TextField';
import { Help } from '@/components/channel/ChannelShell';
import DataTable from '@/components/channel/DataTable';
import TestDeviceModal from '@/components/channel/TestDeviceModal';
import PushPreview, { type PreviewOS } from '@/components/preview/PushPreview';
import { pushMessages, sourceLabel, SOURCES, type Platform, type Source } from '@/lib/sent';
import { pushTemplates, type PushTemplate } from '@/lib/templates';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';
import { ChipInput, HELP, HelpHtml, Label, Opt, PlatformSelect, Row, VarField } from './parts';

// 푸시 「메시지」 섹션 필드 · 미리보기 · 테스트 발송 · 최근 메시지 / 템플릿 / AI 모달 — docs 2.4 ~ 2.7, 2.12.
export type PushMsg = { title: string; body: string; url: string; image: string; uploaded: boolean; advanced: boolean; buttons: { label: string; link: string }[]; data: { key: string; value: string }[] };
export const initialPushMsg = (): PushMsg => ({ title: '', body: '', url: '', image: '', uploaded: false, advanced: false, buttons: [], data: [] });
export const fromMessage = (m: { title?: string; body: string; url?: string; imageUrl?: string; buttons?: { label: string; link: string }[]; data?: Record<string, string> }): PushMsg => ({
  title: m.title ?? '',
  body: m.body,
  url: m.url ?? '',
  image: m.imageUrl ?? '',
  uploaded: false,
  advanced: !!(m.buttons?.length || (m.data && Object.keys(m.data).length)),
  buttons: m.buttons ?? [],
  data: Object.entries(m.data ?? {}).map(([key, value]) => ({ key, value })),
});

const Field = styled.div`
  display: flex;
  flex-direction: column;
`;
const Pair = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr) 32px;
  gap: 8px;
  align-items: center;
`;

export function PushFields({ value, onChange, locked, toast }: { value: PushMsg; onChange: (v: PushMsg) => void; locked?: boolean; toast: (s: string) => void }) {
  const set = (p: Partial<PushMsg>) => onChange({ ...value, ...p });
  const file = useRef<HTMLInputElement>(null);
  const ph = (s: string) => (locked ? '' : s);
  return (
    <>
      <Field>
        <Label>제목</Label>
        <VarField ariaLabel="제목" readOnly={locked} value={value.title} placeholder={ph('제목 (선택)')} onChange={(title) => set({ title })} />
      </Field>
      <Field>
        <Label>
          내용 <em>*</em>
        </Label>
        <VarField ariaLabel="내용" multi readOnly={locked} value={value.body} placeholder={ph('내용 (필수)')} onChange={(body) => set({ body })} />
      </Field>
      <Field>
        <Label>URL</Label>
        <VarField ariaLabel="URL" readOnly={locked} value={value.url} placeholder={ph('https://abc.com/xyz (선택)')} onChange={(url) => set({ url })} />
      </Field>
      <Field>
        <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <Label style={{ margin: 0 }}>이미지</Label>
          {!locked && (
            <Button iconLeading="upload" onClick={() => file.current?.click()}>
              {value.image ? '이미지 변경' : '업로드'}
            </Button>
          )}
        </Row>
        {(value.image || !locked) && (
          <TextField
            aria-label="이미지 URL"
            readOnly={locked || value.uploaded}
            value={value.uploaded ? '업로드됨' : value.image}
            placeholder={ph('https://abc.com/image.png (선택)')}
            onChange={(e) => set({ image: e.target.value })}
            trailing={
              value.uploaded && !locked ? (
                <IconButton icon="close" size="xs" label="이미지 삭제" onClick={() => set({ image: '', uploaded: false })} />
              ) : undefined
            }
          />
        )}
        <input
          ref={file}
          hidden
          type="file"
          accept="image/jpg,image/jpeg,image/png"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            if (f.size > 3 * 1024 * 1024) return toast('이미지 크기가 너무 큽니다. (3MB 이하 허용)');
            set({ image: URL.createObjectURL(f), uploaded: true });
          }}
        />
      </Field>
      <Row style={{ justifyContent: 'flex-end' }}>
        <Button hierarchy="tertiary" iconTrailing={value.advanced ? 'keyboard_arrow_up' : 'keyboard_arrow_down'} onClick={() => set(value.advanced ? { advanced: false, buttons: locked ? value.buttons : [], data: [] } : { advanced: true })}>
          고급 설정
        </Button>
      </Row>
      {value.advanced && (
        <>
          <Field>
            <Label>버튼</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {value.buttons.map((b, i) => (
                <Pair key={i} style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) 32px' }}>
                  <VarField ariaLabel="Label" readOnly={locked} value={b.label} placeholder={ph('Label')} onChange={(label) => set({ buttons: value.buttons.map((x, j) => (j === i ? { ...x, label } : x)) })} />
                  <VarField ariaLabel="Link" readOnly={locked} value={b.link} placeholder={ph('Link')} onChange={(link) => set({ buttons: value.buttons.map((x, j) => (j === i ? { ...x, link } : x)) })} />
                  {!locked && <IconButton icon="remove" label="삭제" onClick={() => set({ buttons: value.buttons.filter((_, j) => j !== i) })} />}
                </Pair>
              ))}
              {!locked && value.buttons.length < 2 && (
                <Row style={{ justifyContent: 'flex-end' }}>
                  <Button iconLeading="add" onClick={() => set({ buttons: [...value.buttons, { label: '', link: '' }] })}>
                    버튼
                  </Button>
                </Row>
              )}
            </div>
          </Field>
          <Field>
            <Label>데이터</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {value.data.map((d, i) => (
                <Pair key={i}>
                  <TextField aria-label="Key" placeholder="Key" value={d.key} onChange={(e) => set({ data: value.data.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)) })} />
                  <TextField aria-label="Value" placeholder="Value" value={d.value} onChange={(e) => set({ data: value.data.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                  <IconButton icon="remove" label="삭제" onClick={() => set({ data: value.data.filter((_, j) => j !== i) })} />
                </Pair>
              ))}
              <Row style={{ justifyContent: 'flex-end' }}>
                <Button iconLeading="add" onClick={() => set({ data: [...value.data, { key: '', value: '' }] })}>
                  데이터
                </Button>
              </Row>
            </div>
          </Field>
        </>
      )}
    </>
  );
}

// ── 미리보기 패널
const Card = styled.aside`
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 15px;
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  box-shadow: ${shadow.xs};
  > header { display: flex; align-items: center; gap: 4px; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
`;
const Seg = styled.div`
  display: inline-flex;
  padding: 3px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.md}px;
  background: ${color('bg-secondary')};
  > button { height: 30px; padding: 0 16px; border: 0; border-radius: ${radius.sm}px; background: none; ${text('text-sm', 'semibold')}; color: ${color('text-quaternary')}; cursor: pointer; white-space: nowrap; }
  > button[aria-selected='true'] { background: ${color('bg-primary')}; color: ${color('text-secondary')}; box-shadow: ${shadow.xs}; outline: 1px solid ${color('border-primary')}; }
`;

const APP = [
  ['android', 'Android'],
  ['ios', 'iOS'],
] as const;
const WEB = [
  ['android', 'Android (Mobile)'],
  ['windows', 'Windows (Desktop)'],
  ['macos', 'Mac OS (Desktop)'],
] as const;

export function PushPreviewPanel({ msg, onTest }: { msg: PushMsg; onTest: () => void }) {
  const [kind, setKind] = useState<'app' | 'web'>('app');
  const [dev, setDev] = useState<string>('android');
  const os = (dev === 'ios' ? 'android' : dev) as PreviewOS;
  return (
    <Card>
      <header>
        미리보기
        <Help>
          <HelpHtml html={HELP.preview} />
        </Help>
      </header>
      <Row>
        <Seg role="tablist">
          {(['app', 'web'] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kind === k}
              onClick={() => {
                setKind(k);
                setDev('android');
              }}
            >
              {k === 'app' ? '앱 푸시' : '웹 푸시'}
            </button>
          ))}
        </Seg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Select<string> value={dev} options={(kind === 'app' ? APP : WEB).map(([v, l]) => ({ value: v, label: l }))} onChange={setDev} />
        </div>
      </Row>
      <div style={{ width: '100%' }}>
        <PushPreview os={os} title={msg.title || (kind === 'web' ? 'FlareLane' : '')} body={msg.body} url={msg.url || 'https://flarelane.com'} />
      </div>
      <Button full iconLeading="send" onClick={onTest}>
        테스트 기기로 발송
      </Button>
    </Card>
  );
}

// ── 테스트 발송 (2.7)
const Pick = styled.button<{ $on: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  border: 1px solid ${(p) => (p.$on ? color('border-brand') : color('border-secondary'))};
  outline: ${(p) => (p.$on ? `1px solid ${color('border-brand')}` : 'none')};
  border-radius: ${radius.lg}px;
  background: ${color('bg-primary')};
  ${text('text-sm', 'semibold')};
  color: ${color('text-secondary')};
  cursor: pointer;
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  > i { position: absolute; top: 10px; right: 10px; display: inline-flex; color: ${color('fg-brand-primary')}; }
`;

export function TestSend({ msg, platformsFixed, onClose, toast }: { msg: { body: string }; platformsFixed?: Platform[]; onClose: () => void; toast: (s: string) => void }) {
  const [step, setStep] = useState<'select' | 'user' | 'device'>('select');
  const [pick, setPick] = useState<'user' | 'device' | null>(null);
  const [uid, setUid] = useState('');
  const [pf, setPf] = useState<string[]>(platformsFixed ?? ['android', 'ios', 'webDesktop', 'webMobile']);
  const done = () => {
    if (!msg.body.trim()) return toast('메시지 내용을 입력해 주세요.');
    toast('메시지가 성공적으로 발송되었습니다.');
    onClose();
  };
  if (step === 'device') return <TestDeviceModal filter={() => true} onClose={onClose} onSend={(ids) => (ids.length ? done() : toast('테스트 기기를 선택해 주세요.'))} />;
  if (step === 'user')
    return (
      <Dialog
        title="테스트 발송"
        width={560}
        onClose={onClose}
        footer={
          <>
            <Button size="md" onClick={onClose}>
              닫기
            </Button>
            <Button
              hierarchy="primary"
              size="md"
              disabled={!uid.trim()}
              onClick={() => {
                if (!/^user_/.test(uid.trim())) return window.alert(`유저ID: "${uid.trim()}"에 등록된 기기가 없습니다.\n앱 또는 웹에서 푸시 알림 허용을 해주세요.`);
                done();
              }}
            >
              발송
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-tertiary)' }}>실제 메시지 발송 전 내용을 검토하고, 사전에 오류를 방지할 수 있습니다.</p>
          <div>
            <Label>유저 ID</Label>
            <Row>
              <div style={{ flex: 1 }}>
                <TextField value={uid} placeholder="유저 ID 입력 후 조회 버튼을 눌러주세요" onChange={(e) => setUid(e.target.value)} />
              </div>
              <Button disabled={!uid.trim()} onClick={() => window.open(`/all-users?q=${encodeURIComponent(uid.trim())}`, '_blank')}>
                조회
              </Button>
            </Row>
          </div>
          <div>
            <Label>플랫폼</Label>
            <PlatformSelect value={pf} readOnly={!!platformsFixed} onChange={setPf} toast={toast} />
          </div>
        </div>
      </Dialog>
    );
  return (
    <Dialog
      title="테스트 환경 선택"
      width={520}
      onClose={onClose}
      actions={
        <Button hierarchy="tertiary" iconTrailing="open_in_new" onClick={() => window.open('/push/sent-history?p=1&s=testDevice', '_blank')}>
          테스트 발송 내역
        </Button>
      }
      footer={
        <>
          <Button size="md" onClick={onClose}>
            취소
          </Button>
          <Button hierarchy="primary" size="md" disabled={!pick} onClick={() => pick && setStep(pick)}>
            확인
          </Button>
        </>
      }
    >
      <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-tertiary)' }}>테스트 진행하기 위한 발송 방법을 선택해주세요.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {(
          [
            ['user', '유저 ID', 'person'],
            ['device', '테스트 기기', 'smartphone'],
          ] as const
        ).map(([k, l, ic]) => (
          <Pick key={k} type="button" $on={pick === k} onClick={() => setPick(k)}>
            <span>
              <Icon name={ic} size={28} />
            </span>
            {l}
            {pick === k && (
              <i>
                <Icon name="check_circle" size={20} />
              </i>
            )}
          </Pick>
        ))}
      </div>
    </Dialog>
  );
}

// ── 최근 발송 메시지 (2.12)
export function RecentModal({ onClose, onPick }: { onClose: () => void; onPick: (m: (typeof pushMessages)[number]) => void }) {
  const [src, setSrc] = useState<Source>('console');
  const [p, setP] = useState(1);
  const list = pushMessages.filter((m) => m.source === src);
  const sent = (m: (typeof pushMessages)[number]) => Object.values(m.stats).reduce((a, s) => a + s.sent, 0);
  const clicked = (m: (typeof pushMessages)[number]) => Object.values(m.stats).reduce((a, s) => a + s.clicked, 0);
  return (
    <Dialog
      title="메시지 선택"
      width={880}
      onClose={onClose}
      actions={
        <div style={{ width: 160 }}>
          <Select<Source>
            value={src}
            options={SOURCES.map((s) => ({ value: s.value, label: s.label }))}
            onChange={(v) => {
              setSrc(v);
              setP(1);
            }}
          />
        </div>
      }
    >
      <DataTable
        columns={[
          { label: '발송 환경', width: '96px' },
          { label: '메시지', width: 'minmax(0,1fr)' },
          { label: '발송 시간', width: '160px' },
          { label: '발송', width: '72px', align: 'right' },
          { label: '클릭률', width: '72px', align: 'right' },
        ]}
        rows={list.slice((p - 1) * 20, p * 20).map((m) => ({
          key: m.id,
          onClick: () => onPick(m),
          cells: [
            sourceLabel(m.source),
            <div key="m" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <b style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title || '-'}</b>
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.body}</span>
            </div>,
            m.createdAt,
            sent(m).toLocaleString('ko-KR'),
            sent(m) ? `${((clicked(m) / sent(m)) * 100).toFixed(1)}%` : '0%',
          ],
        }))}
        empty={<p style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>데이터가 없습니다</p>}
      />
      {list.length > 20 && (
        <div style={{ marginTop: 12 }}>
          <Pagination page={p} pages={Math.ceil(list.length / 20)} onChange={setP} />
        </div>
      )}
    </Dialog>
  );
}

// ── 템플릿 선택 (2.12)
export function TemplateModal({ onClose, onPick }: { onClose: () => void; onPick: (t: PushTemplate) => void }) {
  const [p, setP] = useState(1);
  return (
    <Dialog title="템플릿 선택" width={760} onClose={onClose}>
      <DataTable
        columns={[
          { label: '이름', width: '240px' },
          { label: '메시지', width: 'minmax(0,1fr)' },
        ]}
        rows={pushTemplates.slice((p - 1) * 5, p * 5).map((t) => ({
          key: t.id,
          onClick: () => onPick(t),
          cells: [
            <div key="n" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              {t.category && <Badge color={t.category.color as BadgeColor}>{t.category.name}</Badge>}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
            </div>,
            <div key="m" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <b style={{ fontSize: 14, fontWeight: 600 }}>{t.title || '-'}</b>
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.body}</span>
            </div>,
          ],
        }))}
        empty={<p style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>데이터가 없습니다</p>}
      />
      <div style={{ marginTop: 12 }}>
        <Pagination page={p} pages={Math.ceil(pushTemplates.length / 5)} onChange={setP} />
      </div>
    </Dialog>
  );
}

// ── AI 메시지 생성 (2.12)
type AiCard = { id: number; title: string; body: string; image: string; keywords: string[]; like: 0 | 1 | -1 };
const aiCards: AiCard[] = [{ id: 1, title: '가을 맞이 15% 세일', body: '선선한 가을, 인기 스니커즈를 15% 할인된 가격으로 만나보세요.', image: 'https://picsum.photos/seed/fl-ai1/600/300', keywords: ['스니커즈', '15% 세일'], like: 0 }];
const AiItem = styled.div`
  position: relative;
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.lg}px;
  cursor: pointer;
  &:hover { border-color: ${color('border-brand')}; }
  > img { width: 88px; height: 88px; object-fit: cover; border-radius: ${radius.md}px; flex-shrink: 0; }
  > div { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
  > div > b { ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  > div > p { margin: 0; ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
  > div > span { display: flex; flex-wrap: wrap; gap: 4px; }
  > nav { position: absolute; top: 8px; right: 8px; display: flex; }
`;

export function AiModal({ onClose, onPick }: { onClose: () => void; onPick: (c: { title: string; body: string; image: string }) => void }) {
  const [kw, setKw] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [, force] = useState(0);
  const [used, setUsed] = useState(3);
  const gen = () => {
    setBusy(true);
    setTimeout(() => {
      const k = kw.length ? kw : ['스니커즈', '15% 세일', '쿠폰', 'NIKE'];
      aiCards.unshift({ id: Date.now(), title: `${k[0]} 특별 혜택`, body: `지금 ${k.join(', ')} 혜택을 놓치지 마세요. 오늘 자정까지 진행됩니다.`, image: `https://picsum.photos/seed/fl-ai${aiCards.length + 1}/600/300`, keywords: k, like: 0 });
      setUsed((n) => n + 1);
      setBusy(false);
    }, 900);
  };
  return (
    <Dialog title="AI 메시지 생성" width={880} onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(0,1fr)', gap: 24, minHeight: 360 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <Label>메시지 키워드</Label>
            <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-tertiary)' }}>입력한 키워드를 바탕으로 메시지와 이미지가 생성됩니다. 생성 후 자유롭게 변경이 가능합니다.</p>
            <ChipInput value={kw} placeholder={kw.length ? '' : '스니커즈, 15% 세일, 쿠폰, NIKE'} onChange={(v) => setKw(v.slice(0, 10))} />
          </div>
          <Button hierarchy="primary" size="md" iconLeading="auto_awesome" disabled={busy} onClick={gen}>
            {busy ? '생성 중' : '생성'}
          </Button>
          <small style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'right' }}>{`${used}/100`}</small>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflow: 'auto' }}>
          {aiCards.map((c) => (
            <AiItem key={c.id} onClick={() => onPick(c)}>
              <img src={c.image} alt="" />
              <div>
                <b>{c.title}</b>
                <p>{c.body}</p>
                <span>
                  {c.keywords.map((k) => (
                    <Badge key={k}>{k}</Badge>
                  ))}
                </span>
              </div>
              <nav onClick={(e) => e.stopPropagation()}>
                <IconButton icon="thumb_up" size="xs" label="좋아요" onClick={() => ((c.like = c.like === 1 ? 0 : 1), force((n) => n + 1))} style={c.like === 1 ? { color: 'var(--fg-brand-primary)' } : undefined} />
                <IconButton icon="thumb_down" size="xs" label="싫어요" onClick={() => ((c.like = c.like === -1 ? 0 : -1), force((n) => n + 1))} style={c.like === -1 ? { color: 'var(--fg-brand-primary)' } : undefined} />
                <IconButton
                  icon="delete"
                  size="xs"
                  label="삭제"
                  onClick={() => {
                    if (!window.confirm('생성된 알림을 삭제합니다. 삭제된 알림은 복구할 수 없습니다.')) return;
                    aiCards.splice(aiCards.indexOf(c), 1);
                    force((n) => n + 1);
                  }}
                />
              </nav>
            </AiItem>
          ))}
        </div>
      </div>
    </Dialog>
  );
}

export { Opt };
