import { useRef, useState, type ReactNode } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { Dialog } from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import TextField from '@/components/ui/TextField';
import { Help } from '@/components/channel/ChannelShell';
import { BrandPreview, type BrandModel } from '@/components/preview/KakaoPreview';
import { FRIENDTALK_TYPE, type FriendtalkMessage } from '@/lib/sent';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';
import { HELP, HelpHtml, Label, LabeledToggle, Radios, Row, VarField } from './parts';
import type { EditMode } from './parts';
import Shell, { KakaoTestSend, kakaoZero, PreviewCard } from './Shell';

// 브랜드메시지(친구톡) 새 메시지 — docs 4장. 유형(FI/FW/FL/FA/FC)마다 필드 · 한도가 다르고, 유형을 바꾸면 내용 초기화.
type Kind = 'FI' | 'FW' | 'FL' | 'FA' | 'FC';
type Btn = { kind: 'WL' | 'AL'; name: string; mobile: string; pc: string; android: string; ios: string };
type Item = { image: string; link: string; text: string };
type Car = { image: string; title: string; text: string; price: string; discount: string; rate: string; extra: string; buttons: Btn[] };
type M = { kind: Kind; picker: boolean; targeting: 'M' | 'N' | 'I'; isAd: boolean; age: boolean; image: string; imageLink: string; text: string; buttons: Btn[]; header: string; items: Item[]; intro: { on: boolean; image: string; title: string; text: string; link: string }; cars: Car[]; tab: number; more: { on: boolean; link: string } };

export type FtM = M;
const car = (): Car => ({ image: '', title: '', text: '', price: '', discount: '', rate: '', extra: '', buttons: [] });
export const ftFresh = (k: Kind = 'FI') => fresh(k);
const fresh = (kind: Kind, keep?: Pick<M, 'targeting' | 'isAd' | 'age'>): M => ({
  kind,
  picker: false,
  targeting: keep?.targeting ?? 'I',
  isAd: kind === 'FL' || kind === 'FA' || kind === 'FC' ? true : keep?.isAd ?? true,
  age: keep?.age ?? false,
  image: '',
  imageLink: '',
  text: '',
  buttons: [],
  header: '',
  items: kind === 'FL' ? [0, 1, 2].map(() => ({ image: '', link: '', text: '' })) : [],
  intro: { on: false, image: '', title: '', text: '', link: '' },
  cars: kind === 'FA' || kind === 'FC' ? [car(), car()] : [],
  tab: 0,
  more: { on: false, link: '' },
});
const LIMIT: Record<Kind, { text: number; buttons: number; btnName: number }> = { FI: { text: 400, buttons: 5, btnName: 14 }, FW: { text: 76, buttons: 2, btnName: 8 }, FL: { text: 30, buttons: 2, btnName: 8 }, FA: { text: 50, buttons: 2, btnName: 8 }, FC: { text: 180, buttons: 2, btnName: 8 } };
// 설명은 스테이징에서 확인된 기본 텍스트형만 넣음(나머지 문구 미확인)
const KINDS: [Kind, string, string][] = [
  ['FI', '기본 텍스트형', '이미지, 버튼 첨부가 가능한\n기본형 메시지입니다.'],
  ['FW', '와이드 이미지형', ''],
  ['FL', '와이드 리스트형', ''],
  ['FA', '캐러셀 커머스형', ''],
  ['FC', '캐러셀 피드형', ''],
];

const TypeCard = styled.button<{ $on: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid ${(p) => (p.$on ? color('border-brand') : color('border-secondary'))};
  outline: ${(p) => (p.$on ? `1px solid ${color('border-brand')}` : 'none')};
  border-radius: ${radius.lg}px;
  background: ${color('bg-primary')};
  text-align: left;
  cursor: pointer;
  > i { display: flex; align-items: center; justify-content: center; height: 96px; border-radius: ${radius.md}px; background: ${color('bg-secondary')}; color: ${color('fg-quaternary')}; }
  > b { ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  > span { ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; white-space: pre-line; }
`;
const ICON: Record<Kind, string> = { FI: 'chat', FW: 'image', FL: 'list', FA: 'shopping_bag', FC: 'view_carousel' };

function TypePicker({ value, onClose, onPick }: { value: Kind; onClose: () => void; onPick: (k: Kind) => void }) {
  const [sel, setSel] = useState(value);
  return (
    <Dialog
      title="메시지 유형 선택하기"
      width={880}
      onClose={onClose}
      footer={
        <>
          <Button size="md" onClick={onClose}>
            취소
          </Button>
          <Button hierarchy="primary" size="md" onClick={() => onPick(sel)}>
            확인
          </Button>
        </>
      }
    >
      <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-tertiary)', whiteSpace: 'pre-line' }}>{'다양한 기능의 메시지 유형을 이용해 고객 맞춤형 메시지를 직접 만들어 보세요.\n원하는 유형을 선택하면 작성 화면으로 이동합니다.'}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 12 }}>
        {KINDS.map(([k, l, d]) => (
          <TypeCard key={k} type="button" $on={sel === k} onClick={() => setSel(k)}>
            <i>
              <Icon name={ICON[k]} size={32} />
            </i>
            <b>{l}</b>
            {d && <span>{d}</span>}
          </TypeCard>
        ))}
      </div>
    </Dialog>
  );
}

function ImageField({ value, onChange, hint, required }: { value: string; onChange: (v: string) => void; hint: string; required?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        <Label style={{ margin: 0 }}>
          이미지 {required && <em>*</em>}
        </Label>
        <Button iconLeading="upload" onClick={() => ref.current?.click()}>
          {value ? '이미지 변경' : '업로드'}
        </Button>
      </Row>
      {value ? <TextField readOnly value="업로드됨" trailing={<IconButton icon="close" size="xs" label="이미지 삭제" onClick={() => onChange('')} />} /> : <small style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{hint}</small>}
      <input
        ref={ref}
        hidden
        type="file"
        accept="image/jpg,image/jpeg,image/png"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) onChange(URL.createObjectURL(f));
        }}
      />
    </div>
  );
}

function Buttons({ value, onChange, max, nameMax }: { value: Btn[]; onChange: (v: Btn[]) => void; max: number; nameMax: number }) {
  const setB = (i: number, p: Partial<Btn>) => onChange(value.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <div>
      <Label>버튼</Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {value.map((b, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, border: '1px solid var(--border-secondary)', borderRadius: 8 }}>
            <Row>
              <div style={{ width: 140 }}>
                <Select<Btn['kind']> value={b.kind} options={[{ value: 'WL', label: '웹 링크' }, { value: 'AL', label: '앱 링크' }]} onChange={(kind) => setB(i, { kind })} />
              </div>
              <div style={{ flex: 1 }}>
                <TextField placeholder={`최대 ${nameMax}자`} maxLength={nameMax} value={b.name} onChange={(e) => setB(i, { name: e.target.value })} />
              </div>
              <IconButton icon="remove" label="삭제" onClick={() => onChange(value.filter((_, j) => j !== i))} />
            </Row>
            {b.kind === 'AL' && (
              <Row>
                <TextField placeholder="scheme://" aria-label="Android" maxLength={1000} value={b.android} onChange={(e) => setB(i, { android: e.target.value })} />
                <TextField placeholder="scheme://" aria-label="iOS" maxLength={1000} value={b.ios} onChange={(e) => setB(i, { ios: e.target.value })} />
              </Row>
            )}
            <Row>
              <TextField placeholder="https:// (Mobile)" maxLength={1000} value={b.mobile} onChange={(e) => setB(i, { mobile: e.target.value })} />
              <TextField placeholder="https:// (PC)" maxLength={1000} value={b.pc} onChange={(e) => setB(i, { pc: e.target.value })} />
            </Row>
          </div>
        ))}
        {value.length < max && (
          <Row style={{ justifyContent: 'flex-end' }}>
            <Button iconLeading="add" onClick={() => onChange([...value, { kind: 'WL', name: '', mobile: '', pc: '', android: '', ios: '' }])}>
              버튼
            </Button>
          </Row>
        )}
      </div>
    </div>
  );
}

const Counter = ({ n, max }: { n: number; max: number }) => <small style={{ display: 'block', marginTop: 4, textAlign: 'right', fontSize: 12, color: n > max ? 'var(--text-error-primary)' : 'var(--text-tertiary)' }}>{`${n}/${max}자`}</small>;
const CarTabs = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  > button { height: 32px; padding: 0 12px; border: 1px solid ${color('border-secondary')}; border-radius: ${radius.md}px; background: ${color('bg-primary')}; ${text('text-sm', 'semibold')}; color: ${color('text-quaternary')}; cursor: pointer; }
  > button[aria-selected='true'] { border-color: ${color('border-brand')}; color: ${color('text-brand-secondary')}; }
`;

export function FriendtalkFields({ m, set }: { m: M; set: (p: Partial<M>) => void }) {
  const L = LIMIT[m.kind];
  const ad = (isAd: boolean) => {
    if (!isAd && (m.kind === 'FL' || m.kind === 'FA' || m.kind === 'FC' || m.targeting !== 'I')) return window.alert('해당 메시지 타입은 광고성 메시지입니다.');
    set({ isAd });
  };
  const c = m.cars[m.tab];
  const setC = (p: Partial<Car>) => set({ cars: m.cars.map((x, i) => (i === m.tab ? { ...x, ...p } : x)) });
  let body: ReactNode = null;
  if (m.kind === 'FI' || m.kind === 'FW')
    body = (
      <>
        <ImageField required={m.kind === 'FW'} value={m.image} onChange={(image) => set({ image })} hint={m.kind === 'FI' ? '권장 사이즈: 가로 최소 500px, 2:1 비율 / 지원 파일: jpg, jpeg, png (최대 300KB)' : '권장 사이즈: 가로 800px, 세로 600px / 지원 파일: jpg, jpeg, png (최대 2MB)'} />
        {m.image && (
          <div>
            <Label>이미지 링크</Label>
            <TextField placeholder="https://" value={m.imageLink} onChange={(e) => set({ imageLink: e.target.value })} />
          </div>
        )}
        <div>
          <Label>
            내용 <em>*</em>
          </Label>
          <VarField ariaLabel="내용" multi value={m.text} placeholder="내용 (필수)" onChange={(t) => set({ text: t })} />
          <Counter n={m.text.length} max={L.text} />
        </div>
        <Buttons value={m.buttons} max={L.buttons} nameMax={L.btnName} onChange={(buttons) => set({ buttons })} />
      </>
    );
  if (m.kind === 'FL')
    body = (
      <>
        <div>
          <Label>
            타이틀 <em>*</em>
          </Label>
          <TextField placeholder="최대 20자" maxLength={20} value={m.header} onChange={(e) => set({ header: e.target.value })} />
        </div>
        {m.items.map((it, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, border: '1px solid var(--border-secondary)', borderRadius: 8 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <b style={{ fontSize: 14, fontWeight: 600 }}>{`리스트 항목 ${i + 1}`}</b>
              {i === 3 && (
                <Button hierarchy="destructive-tertiary" onClick={() => set({ items: m.items.slice(0, 3) })}>
                  삭제
                </Button>
              )}
            </Row>
            <ImageField required value={it.image} hint={i === 0 ? '권장 사이즈: 1000×500px' : '권장 사이즈: 500×500px'} onChange={(image) => set({ items: m.items.map((x, j) => (j === i ? { ...x, image } : x)) })} />
            <TextField placeholder="https:// (링크)" value={it.link} onChange={(e) => set({ items: m.items.map((x, j) => (j === i ? { ...x, link: e.target.value } : x)) })} />
            <TextField placeholder={`내용 (최대 ${i === 0 ? 25 : 30}자)`} maxLength={i === 0 ? 25 : 30} value={it.text} onChange={(e) => set({ items: m.items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
          </div>
        ))}
        {m.items.length < 4 && (
          <Row style={{ justifyContent: 'flex-end' }}>
            <Button iconLeading="add" onClick={() => set({ items: [...m.items, { image: '', link: '', text: '' }] })}>
              리스트 항목 추가
            </Button>
          </Row>
        )}
        <Buttons value={m.buttons} max={2} nameMax={8} onChange={(buttons) => set({ buttons })} />
      </>
    );
  if ((m.kind === 'FA' || m.kind === 'FC') && c)
    body = (
      <>
        {m.kind === 'FA' && (
          <div>
            <Row>
              <LabeledToggle checked={m.intro.on} label="인트로" onChange={(on) => set({ intro: { ...m.intro, on } })} />
              <Help>{HELP.intro}</Help>
            </Row>
            {m.intro.on && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <ImageField value={m.intro.image} hint="권장 비율 2:1" onChange={(image) => set({ intro: { ...m.intro, image } })} />
                <TextField placeholder="타이틀" value={m.intro.title} onChange={(e) => set({ intro: { ...m.intro, title: e.target.value } })} />
                <TextField placeholder="내용 (최대 50자)" maxLength={50} value={m.intro.text} onChange={(e) => set({ intro: { ...m.intro, text: e.target.value } })} />
                <TextField placeholder="https:// (링크)" value={m.intro.link} onChange={(e) => set({ intro: { ...m.intro, link: e.target.value } })} />
              </div>
            )}
          </div>
        )}
        <CarTabs role="tablist">
          {m.cars.map((_, i) => (
            <button key={i} type="button" role="tab" aria-selected={i === m.tab} onClick={() => set({ tab: i })}>
              {`캐러셀 ${i + 1}`}
            </button>
          ))}
          {m.cars.length < 6 && (
            <Button iconLeading="add" hierarchy="tertiary" onClick={() => set({ cars: [...m.cars, car()], tab: m.cars.length })}>
              추가하기
            </Button>
          )}
        </CarTabs>
        <ImageField required value={c.image} hint="모든 캐러셀 이미지의 비율이 같아야 합니다." onChange={(image) => setC({ image })} />
        {m.kind === 'FA' ? (
          <>
            <TextField placeholder="상품명" value={c.title} onChange={(e) => setC({ title: e.target.value })} />
            <Row>
              <TextField placeholder="정상 가격" inputMode="numeric" value={c.price} onChange={(e) => setC({ price: e.target.value.replace(/\D/g, '') })} />
              <TextField placeholder="할인 가격" inputMode="numeric" value={c.discount} onChange={(e) => setC({ discount: e.target.value.replace(/\D/g, '') })} />
              <TextField placeholder="할인율 (%)" inputMode="numeric" value={c.rate} onChange={(e) => setC({ rate: e.target.value.replace(/\D/g, '') })} />
            </Row>
            <TextField placeholder="부가 정보" value={c.extra} onChange={(e) => setC({ extra: e.target.value })} />
          </>
        ) : (
          <>
            <TextField placeholder="타이틀" value={c.title} onChange={(e) => setC({ title: e.target.value })} />
            <div>
              <VarField ariaLabel="내용" multi value={c.text} placeholder="내용 (필수)" onChange={(t) => setC({ text: t })} />
              <Counter n={c.text.length} max={180} />
            </div>
          </>
        )}
        <Buttons value={c.buttons} max={2} nameMax={8} onChange={(buttons) => setC({ buttons })} />
        {m.cars.length > 2 && (
          <Row style={{ justifyContent: 'flex-end' }}>
            <Button hierarchy="destructive-tertiary" onClick={() => set({ cars: m.cars.filter((_, i) => i !== m.tab), tab: 0 })}>
              {`캐러셀${m.tab + 1} 삭제`}
            </Button>
          </Row>
        )}
        <div>
          <Row>
            <LabeledToggle checked={m.more.on} label="더보기" onChange={(on) => set({ more: { ...m.more, on } })} />
            <Help>
              <HelpHtml html={HELP.more} />
            </Help>
          </Row>
          {m.more.on && (
            <div style={{ marginTop: 8 }}>
              <TextField placeholder="https://" value={m.more.link} onChange={(e) => set({ more: { ...m.more, link: e.target.value } })} />
            </div>
          )}
        </div>
      </>
    );
  return (
    <>
      <div>
        <Label>메시지 유형</Label>
        <button type="button" onClick={() => set({ picker: true })} style={{ display: 'flex', alignItems: 'center', width: '100%', height: 36, padding: '0 12px', border: '1px solid var(--border-primary)', borderRadius: 8, background: 'var(--bg-primary)', fontSize: 14, color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ flex: 1 }}>{FRIENDTALK_TYPE[m.kind]}</span>
          <Icon name="keyboard_arrow_down" size={20} />
        </button>
      </div>
      {body}
      <Row style={{ gap: 24 }}>
        <Row>
          <LabeledToggle checked={m.isAd} label="광고성 메시지" onChange={ad} />
          <Help>{HELP.ad}</Help>
        </Row>
        <Row>
          <LabeledToggle checked={m.age} label="연령 인증 메시지" onChange={(age) => set({ age })} />
          <Help>
            <HelpHtml html={HELP.age} />
          </Help>
        </Row>
      </Row>
      {m.picker && (
        <TypePicker
          value={m.kind}
          onClose={() => set({ picker: false })}
          onPick={(k) => (k === m.kind ? set({ picker: false }) : set(fresh(k, m)))}
        />
      )}
    </>
  );
}

export const ftAsMsg = (m: M) => asMsg(m);
// 미리보기 = 유형별 모양 그대로(리스트 항목 · 캐러셀 카드 · 인트로 · 더보기까지)
export const ftPreview = (m: M): BrandModel => ({
  kind: m.kind,
  isAd: m.isAd,
  image: m.image,
  text: m.text,
  buttons: m.buttons.map((b) => b.name),
  header: m.header,
  items: m.items,
  intro: m.kind === 'FA' && m.intro.on ? m.intro : null,
  cards: m.cars.map((c) => ({ image: c.image, title: c.title, text: m.kind === 'FA' ? c.extra : c.text, price: c.price, discount: c.discount, rate: c.rate, buttons: c.buttons.map((b) => b.name) })),
  more: m.more.on,
});
const asMsg = (m: M) =>
  ({
    messageType: m.kind === 'FI' && !m.image ? 'FT' : m.kind,
    header: m.kind === 'FL' ? m.header : m.kind === 'FA' || m.kind === 'FC' ? m.cars[0]?.title : undefined,
    text: m.kind === 'FL' ? m.items.map((x) => x.text).filter(Boolean).join('\n') : m.kind === 'FA' ? m.cars[0]?.extra ?? '' : m.kind === 'FC' ? m.cars[0]?.text ?? '' : m.text,
    image: m.image || m.items[0]?.image || m.cars[0]?.image || undefined,
    imageLink: m.imageLink || undefined,
    buttons: (m.kind === 'FA' || m.kind === 'FC' ? m.cars[0]?.buttons ?? [] : m.buttons).map((b) => ({ name: b.name || '버튼', link: b.mobile })),
    isAd: m.isAd,
    targeting: m.targeting,
  }) as FriendtalkMessage;

export function ftCheck(m: M) {
  return check(m);
}
function check(m: M) {
  const fail = (s: string) => (window.alert(s), false);
  const btns = m.kind === 'FA' || m.kind === 'FC' ? m.cars.flatMap((c) => c.buttons) : m.buttons;
  if ((m.kind === 'FA' || m.kind === 'FC') && m.cars.length < 2) return fail('캐러셀은 최소 2개 이상 입력해야 합니다.');
  if ((m.kind === 'FI' || m.kind === 'FW') && !m.text.trim()) return fail('메시지에 빈값이 존재합니다.');
  if (m.kind === 'FC' && m.cars.some((c) => !c.text.trim())) return fail('메시지에 빈값이 존재합니다.');
  if ((m.kind === 'FW' && !m.image) || ((m.kind === 'FA' || m.kind === 'FC') && m.cars.some((c) => !c.image))) return fail('이미지는 필수 값입니다.');
  if (m.kind === 'FL' && (!m.header || m.items.some((x) => !x.text || !x.image))) return fail('메시지 리스트에 빈값이 존재합니다.');
  if (m.kind === 'FA' && m.cars.some((c) => c.price && c.discount && Number(c.discount) >= Number(c.price))) return fail('금액을 확인해 주세요. 판매 가격은 정상가보다 낮게 입력해 주세요.');
  if (btns.some((b) => !b.name || !b.mobile)) return fail('버튼에 빈값이 존재합니다.');
  return true;
}

export default function FriendtalkNewMessage({ recurring, copy, edit }: { recurring: boolean; copy?: FriendtalkMessage; edit?: EditMode }) {
  return (
    <Shell<M>
      ch="friendtalk"
      recurring={recurring}
      edit={edit}
      initial={fresh('FI')}
      copy={
        copy && {
          campaign: copy.campaignName, target: copy.target, conversions: copy.conversions, ignoreCapping: copy.ignoreCapping,
          msg: { ...fresh(copy.messageType === 'FT' ? 'FI' : (copy.messageType as Kind)), targeting: copy.targeting ?? 'I', isAd: copy.isAd, text: copy.text, header: copy.header ?? '', image: copy.image ?? '', buttons: copy.buttons.map((b) => ({ kind: 'WL', name: b.name, mobile: b.link, pc: '', android: '', ios: '' })) },
        }
      }
      extraTarget={(m, set) => (
        <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-secondary)' }}>
          <Label>
            수신자 타겟팅
            <Help>
              <HelpHtml html={HELP.targeting} />
            </Help>
          </Label>
          <Radios<M['targeting']>
            column
            gap={8}
            value={m.targeting}
            onChange={(targeting) => set({ targeting, isAd: targeting === 'I' ? m.isAd : true })}
            options={[
              { value: 'M', label: '선택한 유저 전체에게 발송 (M)', disabled: true },
              { value: 'N', label: '선택한 유저 중 채널친구를 제외하고 발송 (N)', disabled: true },
              { value: 'I', label: '선택한 유저 중 채널친구에게 발송 (I)' },
            ]}
          />
        </div>
      )}
      renderMsg={(m, set) => <FriendtalkFields m={m} set={set} />}
      preview={(m, test) => (
        <PreviewCard>
          <header>미리보기</header>
          <BrandPreview model={ftPreview(m)} />
          <Button full iconLeading="send" onClick={test}>
            테스트 발송
          </Button>
        </PreviewCard>
      )}
      test={(_, close) => <KakaoTestSend ch="friendtalk" onClose={close} />}
      check={check}
      invisible={(m) => [m.text, m.header, ...m.cars.map((c) => c.text)]}
      targetRows={(m) => [['수신자 타겟팅', { M: '선택한 유저 전체에게 발송 (M)', N: '선택한 유저 중 채널친구를 제외하고 발송 (N)', I: '선택한 유저 중 채널친구에게 발송 (I)' }[m.targeting]]]}
      msgRows={(m) => [
        ['메시지 유형', FRIENDTALK_TYPE[m.kind]],
        ...(m.kind === 'FI' || m.kind === 'FW' ? ([['이미지', m.image ? '업로드됨' : '-'], ['내용', m.text]] as [string, string][]) : []),
        ...(m.kind === 'FL' ? ([['타이틀', m.header], ...m.items.map((x, i) => [`리스트 항목 ${i + 1}`, x.text])] as [string, string][]) : []),
        ...(m.kind === 'FA' || m.kind === 'FC' ? (m.cars.map((c, i) => [`캐러셀 ${i + 1}`, [c.title, c.text, c.price && `${Number(c.price).toLocaleString('ko-KR')}원`].filter(Boolean).join('\n')]) as [string, string][]) : []),
        ...((m.kind === 'FA' || m.kind === 'FC' ? m.cars.flatMap((c) => c.buttons) : m.buttons).length ? ([['버튼', (m.kind === 'FA' || m.kind === 'FC' ? m.cars.flatMap((c) => c.buttons) : m.buttons).map((b) => `${b.kind === 'WL' ? '웹 링크' : '앱 링크'} · ${b.name} · ${b.mobile}`).join('\n')]] as [string, string][]) : []),
        ['광고성 메시지', m.isAd ? 'TRUE' : 'FALSE'],
        ['연령 인증 메시지', m.age ? 'TRUE' : 'FALSE'],
      ]}
      build={(m, base) => ({ ...base, ...kakaoZero, ...asMsg(m) })}
    />
  );
}
