import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import IconButton from '@/components/ui/IconButton';
import { ConfirmModal, Dialog } from '@/components/ui/Modal';
import Radio from '@/components/ui/Radio';
import Select from '@/components/ui/Select';
import Toggle from '@/components/ui/Toggle';
import { ButtonTabs } from '@/components/ui/Tabs';
import TextField from '@/components/ui/TextField';
import { HoverTip } from '@/components/ui/Tooltip';
import { Help } from '@/components/channel/ChannelShell';
import DataTable from '@/components/channel/DataTable';
import PersonalizeModal from '@/components/channel/PersonalizeModal';
import { segments } from '@/lib/audience';
import { events } from '@/lib/catalog';
import { fmtDate, fmtTime, nextDates, periodText, type RecurringConfig } from '@/lib/recurring';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 새 메시지 공용 부품 — Figma 「새 메시지 — C+A 규칙」(1081:18985) 모양 + docs/staging-behavior-new-message-templates.md 1 · 2장.
// 번호 매긴 섹션 5개(캠페인 명 · 대상 · 메시지 · 전환 이벤트 설정 · 발송 설정), 하단 「임시 저장」 · 「발송」/「저장」.

const SectionBox = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 23px;
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  box-shadow: ${shadow.xs};
  > header { display: flex; align-items: center; gap: 8px; min-height: 36px; }
  > header > b { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%; background: ${color('bg-brand-solid')}; ${text('text-xs', 'semibold')}; color: ${color('text-white')}; }
  > header > h2 { margin: 0; ${text('text-lg', 'semibold')}; color: ${color('text-primary')}; }
  > header > i { flex: 1; }
`;

export function Section({ n, title, help, actions, children }: { n: number; title: string; help?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <SectionBox>
      <header>
        <b>{n}</b>
        <h2>{title}</h2>
        {help && <Help>{help}</Help>}
        <i />
        {actions}
      </header>
      {children}
    </SectionBox>
  );
}

export const Label = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
  > em { font-style: normal; color: ${color('text-brand-secondary')}; }
`;

export const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  > small { ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; white-space: nowrap; }
`;

export const Opt = styled.label<{ $disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  ${text('text-sm', 'medium')};
  color: ${(p) => (p.$disabled ? color('text-disabled') : color('text-secondary'))};
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  user-select: none;
`;

export const Note = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 15px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.md}px;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
  > span { display: inline-flex; color: ${color('fg-brand-secondary')}; }
  > b { color: ${color('text-brand-secondary')}; }
`;

export function Radios<T extends string>({ value, options, onChange, gap = 16, disabled, column }: { value: T; options: { value: T; label: ReactNode; disabled?: boolean }[]; onChange: (v: T) => void; gap?: number; disabled?: boolean; column?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: column ? 'column' : 'row', alignItems: column ? 'flex-start' : 'center', flexWrap: 'wrap', gap }}>
      {options.map((o) => (
        <Opt key={o.value} $disabled={disabled || o.disabled} onClick={() => !(disabled || o.disabled) && onChange(o.value)}>
          <Radio checked={value === o.value} disabled={disabled || o.disabled} />
          {o.label}
        </Opt>
      ))}
    </div>
  );
}

// 토글 + 보이는 라벨
export function LabeledToggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <Opt $disabled={disabled} as="span">
      <Toggle checked={checked} disabled={disabled} label={label} onChange={onChange} />
      <span onClick={() => !disabled && onChange(!checked)}>{label}</span>
    </Opt>
  );
}

// ── 개인화 변수 입력칸 (한 줄 / 여러 줄 + 오른쪽 `{}`)
const VarBox = styled.div<{ $multi: boolean; $ro: boolean; $min: number }>`
  position: relative;
  display: flex;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.md}px;
  background: ${(p) => (p.$ro ? color('bg-secondary') : color('bg-primary'))};
  box-shadow: ${(p) => (p.$ro ? 'none' : shadow.xs)};
  &:focus-within { border-color: ${color('border-brand')}; }
  > input, > textarea { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; padding: ${(p) => (p.$multi ? '10px 12px 48px' : '0 12px')}; height: ${(p) => (p.$multi ? 'auto' : '34px')}; min-height: ${(p) => (p.$multi ? `${p.$min}px` : '0')}; resize: vertical; ${text('text-sm', 'regular')}; font-family: inherit; color: ${color('text-primary')}; }
  > input::placeholder, > textarea::placeholder { color: ${color('text-placeholder')}; }
  > button { display: inline-flex; align-items: center; justify-content: center; border: 0; background: ${color('bg-primary')}; color: ${color('fg-quaternary')}; cursor: pointer; }
  > button[data-single] { width: 36px; border-left: 1px solid ${color('border-primary')}; border-radius: 0 ${radius.md}px ${radius.md}px 0; }
  > button[data-multi] { position: absolute; right: 10px; bottom: 10px; width: 36px; height: 36px; border: 1px solid ${color('border-primary')}; border-radius: ${radius.md}px; }
  > button:hover { color: ${color('fg-quaternary_hover')}; }
`;

export type VarHandle = { insert: (s: string) => void };
export const VarField = forwardRef<VarHandle, { value: string; onChange: (v: string) => void; placeholder?: string; multi?: boolean; readOnly?: boolean; maxLength?: number; ariaLabel?: string; minHeight?: number }>(function VarField({ value, onChange, placeholder, multi = false, readOnly = false, maxLength, ariaLabel, minHeight = 132 }, ref) {
  const el = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const pos = useRef<[number, number]>([value.length, value.length]);
  const api: VarHandle = {
    insert: (s) => {
      const [a, b] = pos.current;
      onChange(value.slice(0, a) + s + value.slice(b));
    },
  };
  useImperativeHandle(ref, () => api);
  const Tag = multi ? 'textarea' : 'input';
  return (
    <VarBox $multi={multi} $ro={readOnly} $min={minHeight}>
      <Tag
        ref={el as never}
        aria-label={ariaLabel}
        value={value}
        readOnly={readOnly}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e: { target: { value: string } }) => onChange(e.target.value)}
        onKeyDown={(e: { key: string; preventDefault: () => void }) => !multi && e.key === 'Enter' && e.preventDefault()}
      />
      {!readOnly && (
        <button
          type="button"
          aria-label="개인화 변수"
          data-single={multi ? undefined : ''}
          data-multi={multi ? '' : undefined}
          onClick={() => {
            pos.current = [el.current?.selectionStart ?? value.length, el.current?.selectionEnd ?? value.length];
            setOpen(true);
          }}
        >
          <Icon name="data_object" size={20} />
        </button>
      )}
      {open && (
        <PersonalizeModal
          onClose={() => setOpen(false)}
          onConfirm={(s) => {
            api.insert(s);
            setOpen(false);
          }}
        />
      )}
    </VarBox>
  );
});

// ── 대상
export type TargetTab = 'segment' | 'userId' | 'device' | 'phone' | 'email' | 'csv';
export type TargetState = { tab: TargetTab; include: string[][]; exclude: string[][]; showExclude: boolean; advanced: boolean; rate: number | null; ids: string[]; file: { name: string; rows: number } | null; platforms: string[] };
export const initialTarget = (): TargetState => ({ tab: 'segment', include: [[]], exclude: [[]], showExclude: false, advanced: false, rate: null, ids: [], file: null, platforms: ['android', 'ios', 'webDesktop', 'webMobile'] });

const ChipBox = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 4px 8px;
  border: 1px solid ${color('border-primary')};
  border-radius: ${radius.md}px;
  box-shadow: ${shadow.xs};
  &:focus-within { border-color: ${color('border-brand')}; }
  > span { display: inline-flex; align-items: center; gap: 4px; padding: 2px 4px 2px 8px; border: 1px solid ${color('border-secondary')}; border-radius: ${radius.sm}px; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
  > span > button { display: inline-flex; padding: 0; border: 0; background: none; color: ${color('fg-quaternary')}; cursor: pointer; }
  > input { flex: 1; min-width: 120px; border: 0; outline: none; ${text('text-sm', 'regular')}; }
`;

export function ChipInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [t, setT] = useState('');
  const add = () => {
    const v = t.trim();
    if (v) onChange([...value, v]);
    setT('');
  };
  return (
    <ChipBox>
      {value.slice(0, 30).map((v, i) => (
        <span key={`${v}-${i}`}>
          {v}
          <button type="button" aria-label="삭제" onClick={() => onChange(value.filter((_, j) => j !== i))}>
            <Icon name="close" size={14} />
          </button>
        </span>
      ))}
      <input value={t} placeholder={placeholder} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())} onBlur={add} />
    </ChipBox>
  );
}

const SegBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.md}px;
  > div[data-line] { display: flex; align-items: center; gap: 8px; ${text('text-sm', 'medium')}; color: ${color('text-primary')}; }
  > div[data-line] > i { flex: 1; }
  > small { ${text('text-xs', 'semibold')}; color: ${color('text-brand-secondary')}; }
  > p { margin: 0; ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
`;

function SegmentPicker({ value, onChange, target, note }: { value: string[][]; onChange: (v: string[][]) => void; target: 'User' | 'Device'; note?: string }) {
  const used = value.flat();
  const opts = segments.filter((s) => s.targetType === target && !used.includes(s.id)).sort((a, b) => (a.type === 'DEFAULT' ? -1 : b.type === 'DEFAULT' ? 1 : a.name < b.name ? -1 : 1));
  const name = (id: string) => segments.find((s) => s.id === id)?.name ?? id;
  const empty = value.every((g) => g.length === 0);
  if (empty)
    return <Select<string> value={null} placeholder="세그먼트 선택" options={opts.map((s) => ({ value: s.id, label: s.name }))} onChange={(id) => onChange([[id]])} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {value.map((g, gi) => (
        <div key={gi} style={{ display: 'contents' }}>
          {gi > 0 && <span style={{ fontSize: 12, color: 'var(--text-quaternary)' }}>또는</span>}
          <SegBox>
            {g.map((id, i) => (
              <div key={id} style={{ display: 'contents' }}>
                {i > 0 && <small>그리고</small>}
                <div data-line="">
                  {name(id)}
                  <i />
                  <IconButton icon="close" size="xs" label="삭제" onClick={() => onChange(value.map((x, j) => (j === gi ? x.filter((y) => y !== id) : x)).filter((x, j) => x.length || j === 0))} />
                </div>
              </div>
            ))}
            {g.length === 0 ? (
              <Select<string> value={null} placeholder="세그먼트 선택" options={opts.map((s) => ({ value: s.id, label: s.name }))} onChange={(id) => onChange(value.map((x, j) => (j === gi ? [...x, id] : x)))} />
            ) : null}
            {note && <p>{note}</p>}
            <Row>
              <AddToGroup opts={opts} onPick={(id) => onChange(value.map((x, j) => (j === gi ? [...x, id] : x)))} label="그리고" />
              {gi === value.length - 1 && <AddToGroup opts={opts} onPick={(id) => onChange([...value, [id]])} label="또는" />}
            </Row>
          </SegBox>
        </div>
      ))}
    </div>
  );
}

function AddToGroup({ opts, onPick, label }: { opts: { id: string; name: string }[]; onPick: (id: string) => void; label: string }) {
  const [on, setOn] = useState(false);
  if (!on)
    return (
      <Button iconLeading="add" onClick={() => setOn(true)}>
        {label}
      </Button>
    );
  return (
    <div style={{ width: 220 }}>
      <Select<string>
        value={null}
        placeholder="세그먼트 선택"
        options={opts.map((s) => ({ value: s.id, label: s.name }))}
        onChange={(id) => {
          onPick(id);
          setOn(false);
        }}
      />
    </div>
  );
}

const Drop = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 28px 16px;
  border: 1px dashed ${color('border-primary')};
  border-radius: ${radius.lg}px;
  background: ${color('bg-primary')};
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
  cursor: pointer;
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  > small { ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
`;

const PLATFORM_OPTS: [string, string, string][] = [
  ['android', 'Android', 'android'],
  ['ios', 'iOS', 'apple'],
  ['webDesktop', 'Desktop', 'desktop_windows'],
  ['webMobile', 'Mobile', 'smartphone'],
];
export const PLATFORM_NAME: Record<string, string> = { android: '앱(안드로이드)', ios: '앱(iOS)', webDesktop: '웹(데스크탑)', webMobile: '웹(모바일)' };

export function PlatformSelect({ value, onChange, toast, readOnly }: { value: string[]; onChange: (v: string[]) => void; toast: (s: string) => void; readOnly?: boolean }) {
  const toggle = (k: string) => {
    if (readOnly) return;
    const next = value.includes(k) ? value.filter((x) => x !== k) : [...value, k];
    if (!next.length) {
      toast('최소 하나 이상의 플랫폼을 선택해주세요.');
      return onChange(PLATFORM_OPTS.map((p) => p[0]));
    }
    onChange(next);
  };
  return (
    <Row style={{ gap: 16, flexWrap: 'wrap' }}>
      <small>앱 푸시</small>
      {PLATFORM_OPTS.slice(0, 2).map(([k, l, ic]) => (
        <Opt key={k} $disabled={readOnly} onClick={() => toggle(k)}>
          <Checkbox checked={value.includes(k)} disabled={readOnly} />
          <Icon name={ic} size={18} />
          {l}
        </Opt>
      ))}
      <i style={{ width: 1, height: 20, background: 'var(--border-secondary)' }} />
      <small>웹 푸시</small>
      {PLATFORM_OPTS.slice(2).map(([k, l, ic]) => (
        <Opt key={k} $disabled={readOnly} onClick={() => toggle(k)}>
          <Checkbox checked={value.includes(k)} disabled={readOnly} />
          <Icon name={ic} size={18} />
          {l}
        </Opt>
      ))}
    </Row>
  );
}

export function TargetSection({ channel, value, onChange, toast, count }: { channel: 'push' | 'kakao' | 'email'; value: TargetState; onChange: (v: TargetState) => void; toast: (s: string) => void; count: number | null }) {
  const set = (p: Partial<TargetState>) => onChange({ ...value, ...p });
  const tabs: { value: TargetTab; label: string }[] =
    channel === 'push'
      ? [
          { value: 'segment', label: '기기 세그먼트' },
          { value: 'userId', label: '유저 ID' },
          { value: 'device', label: '기기' },
          { value: 'csv', label: '파일 업로드' },
        ]
      : [
          { value: 'segment', label: '유저 세그먼트' },
          { value: 'userId', label: '유저 ID' },
          channel === 'email' ? { value: 'email', label: '이메일' } : { value: 'phone', label: '전화번호' },
          { value: 'csv', label: '파일 업로드' },
        ];
  const fileRef = useRef<HTMLInputElement>(null);
  const showCount = value.tab !== 'csv' && (channel === 'push' || (value.tab !== 'phone' && value.tab !== 'email'));
  const note = channel === 'kakao' ? '위 세그먼트 중 전화번호를 보유한 유저' : channel === 'email' ? '위 세그먼트 중 이메일을 보유한 유저' : undefined;
  return (
    <>
      <ButtonTabs<TargetTab> full items={tabs} value={value.tab} onChange={(tab) => onChange({ ...initialTarget(), tab })} />
      {value.tab === 'segment' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <Label>포함</Label>
            <SegmentPicker value={value.include} target={channel === 'push' ? 'Device' : 'User'} note={note} onChange={(include) => set({ include })} />
          </div>
          <div style={{ borderTop: '1px solid var(--border-secondary)', borderBottom: '1px solid var(--border-secondary)', padding: '8px 0' }}>
            <Button hierarchy="tertiary" iconTrailing={value.showExclude || value.exclude.flat().length ? 'keyboard_arrow_up' : 'keyboard_arrow_down'} onClick={() => set({ showExclude: !value.showExclude })}>
              제외
            </Button>
            {(value.showExclude || value.exclude.flat().length > 0) && (
              <div style={{ marginTop: 8 }}>
                <SegmentPicker value={value.exclude} target={channel === 'push' ? 'Device' : 'User'} onChange={(exclude) => set({ exclude })} />
              </div>
            )}
          </div>
          {channel === 'push' && (
            <div>
              <Button hierarchy="tertiary" iconTrailing={value.advanced ? 'keyboard_arrow_up' : 'keyboard_arrow_down'} onClick={() => set({ advanced: !value.advanced, rate: value.advanced ? null : value.rate })}>
                고급 설정
              </Button>
              {value.advanced && (
                <Row style={{ marginTop: 8 }}>
                  <Opt onClick={() => set({ rate: value.rate === null ? 10 : null })}>
                    <Checkbox checked={value.rate !== null} />
                    무작위 일부 발송
                  </Opt>
                  <div style={{ width: 80 }}>
                    <TextField type="number" min={1} max={100} disabled={value.rate === null} value={value.rate === null ? '' : String(value.rate)} onChange={(e) => set({ rate: Math.min(100, Math.max(1, Math.floor(Number(e.target.value) || 1))) })} />
                  </div>
                  <small>%</small>
                  <Help>전체 대상자 중 랜덤하게 추출한 n%를 대상으로 알림을 발송합니다.</Help>
                </Row>
              )}
            </div>
          )}
        </div>
      )}
      {value.tab === 'userId' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {channel === 'push' && (
            <div>
              <Label>발송 플랫폼</Label>
              <PlatformSelect value={value.platforms} onChange={(platforms) => set({ platforms })} toast={toast} />
            </div>
          )}
          <div>
            <Label>유저 ID</Label>
            <ChipInput value={value.ids} placeholder="유저 ID 입력" onChange={(ids) => set({ ids })} />
          </div>
        </div>
      )}
      {(value.tab === 'device' || value.tab === 'phone' || value.tab === 'email') && <ChipInput value={value.ids} placeholder={value.tab === 'device' ? '기기 입력' : value.tab === 'phone' ? '전화번호 입력' : '이메일 입력'} onChange={(ids) => set({ ids })} />}
      {value.tab === 'csv' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 16 }}>
          {value.file ? (
            <Row style={{ padding: '12px 14px', border: '1px solid var(--border-secondary)', borderRadius: 10 }}>
              <Icon name="description" size={24} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <b style={{ fontSize: 14, fontWeight: 600 }}>{value.file.name}</b>
                <small>{`${value.file.rows}행 (12KB)`}</small>
              </div>
              <Button
                hierarchy="destructive-tertiary"
                onClick={() => {
                  window.alert('파일을 삭제하시겠습니까?');
                  set({ file: null });
                }}
              >
                삭제
              </Button>
            </Row>
          ) : (
            <Drop type="button" onClick={() => fileRef.current?.click()}>
              <span>
                <Icon name="upload" size={24} />
              </span>
              이곳을 클릭하거나, 파일을 드래그해서 업로드 해주세요.
              <small>지원 형식: XLSX, CSV / 최대 첨부 가능 용량 50 MB</small>
            </Drop>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              if (f.size > 50 * 1024 * 1024) return window.alert('파일 크기는 50MB를 초과할 수 없습니다.');
              set({ file: { name: f.name, rows: 3 } });
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16, borderRadius: 10, background: 'var(--bg-secondary)', fontSize: 13, color: 'var(--text-secondary)' }}>
            <a href="https://docs.flarelane.co.kr/mobile-push-overview" target="_blank" rel="noreferrer" style={{ color: 'var(--text-brand-secondary)', fontWeight: 600 }}>
              파일 가이드 바로가기
            </a>
            <span>
              <b>샘플 파일 다운로드 TIP</b>
              <br />
              메시지 입력 후 샘플 파일 다운로드하면
              <br />
              메시지 맞춤형 파일을 다운받을 수 있습니다.
            </span>
            <Button>샘플 파일 다운로드</Button>
          </div>
        </div>
      )}
      {showCount && (
        <Row style={{ justifyContent: 'flex-end', color: 'var(--text-brand-secondary)', fontSize: 14, fontWeight: 600 }}>
          {`${channel === 'push' ? '추정 기기 수' : '추정 유저 수'}: `}
          {count === null ? <Icon name="progress_activity" size={16} /> : (value.rate ? Math.floor((value.rate / 100) * count) : count).toLocaleString('ko-KR')}
        </Row>
      )}
    </>
  );
}

// 대상이 바뀌면 1초 뒤 추정 수
export function useEstimate(t: TargetState) {
  const [n, setN] = useState<number | null>(0);
  const key = JSON.stringify([t.tab, t.include, t.exclude, t.ids, t.platforms]);
  useEffect(() => {
    setN(null);
    const id = setTimeout(() => {
      const inc = t.include.flat().map((x) => segments.find((s) => s.id === x)?.count ?? 120);
      const base = t.tab === 'segment' ? inc.reduce((a, b) => a + b, 0) : t.ids.length * (t.tab === 'userId' ? Math.max(1, t.platforms.length) : 1);
      setN(Math.max(0, base - t.exclude.flat().length * 3));
    }, 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return n;
}

export const targetEmpty = (t: TargetState) => (t.tab === 'segment' ? t.include.flat().length === 0 : t.tab === 'csv' ? !t.file : t.ids.length === 0);
export function targetSummary(t: TargetState) {
  const name = (id: string) => segments.find((s) => s.id === id)?.name ?? id;
  if (t.tab === 'segment') return t.include.filter((g) => g.length).map((g) => g.map(name).join(' 그리고 ')).join(' 또는 ');
  if (t.tab === 'csv') return t.file?.name ?? '';
  return t.ids.join(', ');
}

// ── 전환 이벤트 설정
export type Conv = { on: boolean; items: { event: string; filters: [string, string, string][]; basis: 'CLICK' | 'SEND'; n: number; unit: 'DAY' | 'HOUR' }[] };
export const initialConv = (basis: 'CLICK' | 'SEND'): Conv => ({ on: false, items: [{ event: '', filters: [], basis, n: 3, unit: 'DAY' }] });

const Tabs = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
  border-bottom: 1px solid ${color('border-secondary')};
  > span { display: inline-flex; align-items: center; gap: 4px; }
  > span > button:first-of-type { padding: 12px 0; border: 0; border-bottom: 2px solid transparent; background: none; ${text('text-sm', 'semibold')}; color: ${color('text-quaternary')}; cursor: pointer; }
  > span > button[aria-selected='true'] { border-bottom-color: ${color('fg-brand-primary')}; color: ${color('text-brand-secondary')}; }
  > span > button + button { display: inline-flex; padding: 0; border: 0; background: none; color: ${color('fg-quaternary')}; cursor: pointer; }
`;

export function ConversionSection({ value, onChange, sendOnly, readOnly }: { value: Conv; onChange: (v: Conv) => void; sendOnly: boolean; readOnly?: boolean }) {
  const [tab, setTab] = useState(0);
  const it = value.items[Math.min(tab, value.items.length - 1)];
  const setIt = (p: Partial<Conv['items'][number]>) => onChange({ ...value, items: value.items.map((x, i) => (i === tab ? { ...x, ...p } : x)) });
  const props = events.find((e) => e.name === it.event)?.properties ?? [];
  return (
    <>
      <Radios<string> column disabled={readOnly} value={value.on ? 'on' : 'off'} gap={8} options={[{ value: 'off', label: '미설정' }, { value: 'on', label: '설정' }]} onChange={(v) => onChange({ ...value, on: v === 'on' })} />
      {value.on && (
        <>
          <div style={{ border: '1px solid var(--border-secondary)', borderRadius: 10, background: 'var(--bg-secondary)' }}>
            <Tabs>
              {value.items.map((_, i) => (
                <span key={i}>
                  <button type="button" aria-selected={i === tab} onClick={() => setTab(i)}>
                    {i ? `이벤트 ${i + 1}` : '이벤트'}
                  </button>
                  {value.items.length > 1 && !readOnly && (
                    <button type="button" aria-label="삭제" onClick={() => { onChange({ ...value, items: value.items.filter((_, j) => j !== i) }); setTab(0); }}>
                      <Icon name="close" size={16} />
                    </button>
                  )}
                </span>
              ))}
              {value.items.length < 10 && !readOnly && <IconButton icon="add" size="xs" label="추가" onClick={() => { onChange({ ...value, items: [...value.items, { ...initialConv(sendOnly ? 'SEND' : 'CLICK').items[0] }] }); setTab(value.items.length); }} />}
            </Tabs>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
              <div>
                <Label>이벤트</Label>
                <Row>
                  <div style={{ width: 280 }}>
                    <Select<string> disabled={readOnly} value={it.event || null} placeholder="이벤트 선택" options={events.map((e) => ({ value: e.name, label: e.name }))} onChange={(event) => setIt({ event, filters: [] })} />
                  </div>
                  {!readOnly && (
                    <Button iconLeading="add" disabled={it.filters.length >= 3} onClick={() => setIt({ filters: [...it.filters, ['', 'EQ', '']] })}>
                      필터
                    </Button>
                  )}
                </Row>
              </div>
              {it.filters.map((f, i) => (
                <Row key={i}>
                  <div style={{ width: 240 }}>
                    <Select<string> disabled={readOnly} value={f[0] || null} placeholder="속성 선택" options={props.map((p) => ({ value: p, label: p }))} onChange={(k) => setIt({ filters: it.filters.map((x, j) => (j === i ? [k, x[1], x[2]] : x)) })} />
                  </div>
                  <div style={{ width: 112 }}>
                    <Select<string> disabled={readOnly} value={f[1]} options={[['EQ', '='], ['NOT_EQ', '≠'], ['GT', '>'], ['GTE', '≥'], ['LT', '<'], ['LTE', '≤'], ['INCLUDES', '이 중에 하나']].map(([v, l]) => ({ value: v, label: l }))} onChange={(o) => setIt({ filters: it.filters.map((x, j) => (j === i ? [x[0], o, x[2]] : x)) })} />
                  </div>
                  <div style={{ width: 200 }}>
                    <TextField readOnly={readOnly} placeholder="값 선택" value={f[2]} onChange={(e) => setIt({ filters: it.filters.map((x, j) => (j === i ? [x[0], x[1], e.target.value] : x)) })} />
                  </div>
                  {!readOnly && <IconButton icon="remove" label="삭제" onClick={() => setIt({ filters: it.filters.filter((_, j) => j !== i) })} />}
                </Row>
              ))}
              <div>
                <Label>전환 측정 기준</Label>
                <Radios<'CLICK' | 'SEND'> disabled={readOnly} value={it.basis} options={sendOnly ? [{ value: 'SEND', label: '발송 기반' }] : [{ value: 'CLICK', label: '클릭 기반' }, { value: 'SEND', label: '발송 기반' }]} onChange={(basis) => setIt({ basis })} />
              </div>
              <div>
                <Label>기여 기간</Label>
                <Row>
                  <div style={{ width: 96 }}>
                    <TextField readOnly={readOnly} type="number" min={1} max={it.unit === 'DAY' ? 30 : 720} value={String(it.n)} onChange={(e) => setIt({ n: Math.min(it.unit === 'DAY' ? 30 : 720, Math.max(1, Number(e.target.value) || 1)) })} />
                  </div>
                  <div style={{ width: 120 }}>
                    <Select<'DAY' | 'HOUR'> disabled={readOnly} value={it.unit} options={[{ value: 'DAY', label: '일' }, { value: 'HOUR', label: '시간' }]} onChange={(unit) => setIt({ unit })} />
                  </div>
                </Row>
              </div>
            </div>
          </div>
          <Note>
            <span>
              <Icon name="info" size={20} />
            </span>
            <p style={{ margin: 0 }}>
              {`${it.basis === 'CLICK' ? '클릭' : '발송'} 후 ${it.n}${it.unit === 'DAY' ? '일' : '시간'} 내 `}
              <b style={{ color: 'var(--text-brand-secondary)' }}>{it.event || '이벤트'}</b>
              {' 이벤트 발생 시 전환으로 측정됩니다.'}
            </p>
          </Note>
        </>
      )}
    </>
  );
}
export function convError(c: Conv) {
  if (!c.on) return null;
  if (c.items.some((i) => !i.event)) return '전환 이벤트를 선택해주세요.';
  if (c.items.some((i) => i.filters.some((f) => !f[0] || !f[2]))) return '전환 이벤트 필터를 선택해 주세요.';
  return null;
}

// ── 발송 설정
export type SendState = {
  mode: 'now' | 'at' | 'recurring';
  date: string; // yyyy-MM-dd
  hour: number;
  minute: number;
  tz: string;
  recurring: RecurringConfig;
  ignoreCapping: boolean;
  ttl: { n: number; unit: 'DAY' | 'HOUR' | 'MINUTE' | 'UNTIL' };
};
export const initialSend = (recurring: boolean): SendState => ({
  mode: recurring ? 'recurring' : 'now',
  date: '2026-10-09',
  hour: 0,
  minute: 0,
  tz: 'Asia/Seoul',
  recurring: { periodic: 'DAILY', hour: 23, minute: 0, timeZone: 'Asia/Seoul', start: { type: 'ON_DATE', startDate: '2026.10.08' }, end: { type: 'NEVER' } },
  ignoreCapping: false,
  ttl: { n: 3, unit: 'DAY' },
});
const TZS = ['Asia/Seoul', 'Asia/Tokyo', 'America/New_York', 'Europe/London', 'UTC'];
const OFF: Record<string, string> = { 'Asia/Seoul': '+09:00', 'Asia/Tokyo': '+09:00', 'America/New_York': '-04:00', 'Europe/London': '+01:00', UTC: '+00:00' };
const WD = [['MON', '월'], ['TUE', '화'], ['WED', '수'], ['THU', '목'], ['FRI', '금'], ['SAT', '토'], ['SUN', '일']] as const;

const Num2 = ({ v, max, onChange }: { v: number; max: number; onChange: (n: number) => void }) => (
  <div style={{ width: 64 }}>
    <TextField type="number" min={0} max={max} value={String(v).padStart(2, '0')} onChange={(e) => onChange(Math.min(max, Math.max(0, Number(e.target.value) || 0)))} />
  </div>
);

export function SendSection({ value, onChange, ttl, capping, plan = 'ENTERPRISE' }: { value: SendState; onChange: (v: SendState) => void; ttl: boolean; capping: string | null; plan?: string }) {
  const set = (p: Partial<SendState>) => onChange({ ...value, ...p });
  const r = value.recurring;
  const setR = (p: Partial<RecurringConfig>) => set({ recurring: { ...r, ...p } });
  const [dates, setDates] = useState(false);
  return (
    <>
      {ttl && (
        <div>
          <Label>
            알림 만료 기간
            <Help>발송 성공하였으나 기기가 오프라인 상태 등 알림 노출이 불가한 경우 다음 기간 내 노출을 계속 시도하고 초과 시 알림이 만료됩니다.</Help>
          </Label>
          <Row>
            {value.ttl.unit !== 'UNTIL' && (
              <div style={{ width: 96 }}>
                <TextField type="number" min={1} max={{ DAY: 28, HOUR: 672, MINUTE: 40320 }[value.ttl.unit]} value={String(value.ttl.n)} onChange={(e) => set({ ttl: { ...value.ttl, n: Math.max(1, Number(e.target.value) || 1) } })} />
              </div>
            )}
            <div style={{ width: 120 }}>
              <Select<SendState['ttl']['unit']> value={value.ttl.unit} options={[{ value: 'DAY', label: '일' }, { value: 'HOUR', label: '시간' }, { value: 'MINUTE', label: '분' }, { value: 'UNTIL', label: '까지' }]} onChange={(unit) => set({ ttl: { ...value.ttl, unit } })} />
            </div>
            {value.ttl.unit === 'UNTIL' && (
              <>
                <div style={{ width: 160 }}>
                  <TextField type="date" value="2026-10-08" onChange={() => undefined} />
                </div>
                <small>23 : 59 Asia/Seoul</small>
              </>
            )}
          </Row>
        </div>
      )}
      <div>
        <Label>발송 시간</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Radios<SendState['mode']>
            column
            gap={10}
            value={value.mode}
            onChange={(mode) => set({ mode })}
            options={[
              { value: 'now', label: '지금 발송' },
              {
                value: 'at',
                disabled: plan === 'STARTER',
                label: (
                  <>
                    예약 발송
                    {plan === 'STARTER' && (
                      <HoverTip content="플랜 업그레이드 필요">
                        <span>
                          <Badge color="orange">UPGRADE</Badge>
                        </span>
                      </HoverTip>
                    )}
                  </>
                ),
              },
              { value: 'recurring', label: '반복 발송' },
            ]}
          />
          {value.mode === 'at' && (
            <Row style={{ paddingLeft: 24, flexWrap: 'wrap' }}>
              <small>날짜</small>
              <div style={{ width: 160 }}>
                <TextField type="date" min="2026-10-08" value={value.date} onChange={(e) => set({ date: e.target.value })} />
              </div>
              <small>시간</small>
              <Num2 v={value.hour} max={23} onChange={(hour) => set({ hour })} />
              <small>:</small>
              <Num2 v={value.minute} max={59} onChange={(minute) => set({ minute })} />
              <div style={{ width: 240 }}>
                <Select<string> value={value.tz} options={TZS.map((t) => ({ value: t, label: `(GMT${OFF[t]}) ${t}` }))} onChange={(tz) => set({ tz })} />
              </div>
            </Row>
          )}
          {value.mode === 'recurring' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 24 }}>
              <Row style={{ flexWrap: 'wrap' }}>
                <small>반복 주기</small>
                <div style={{ width: 96 }}>
                  <Select<RecurringConfig['periodic']> value={r.periodic} options={[{ value: 'DAILY', label: '일' }, { value: 'WEEKLY', label: '주' }, { value: 'MONTHLY', label: '월' }]} onChange={(periodic) => setR({ periodic, weekdays: periodic === 'WEEKLY' ? ['MON'] : undefined, daysOfMonth: periodic === 'MONTHLY' ? [1] : undefined })} />
                </div>
                <small>시간</small>
                <Num2 v={r.hour} max={23} onChange={(hour) => setR({ hour })} />
                <small>:</small>
                <Num2 v={r.minute} max={59} onChange={(minute) => setR({ minute })} />
                <small>타임존</small>
                <div style={{ width: 240 }}>
                  <Select<string> value={r.timeZone} options={TZS.map((t) => ({ value: t, label: `(GMT${OFF[t]}) ${t}` }))} onChange={(timeZone) => setR({ timeZone })} />
                </div>
              </Row>
              {r.periodic === 'WEEKLY' && (
                <Row style={{ flexWrap: 'wrap' }}>
                  <small>매주 다음 요일에 반복</small>
                  {WD.map(([k, l]) => (
                    <Opt key={k} onClick={() => setR({ weekdays: r.weekdays?.includes(k) ? r.weekdays.filter((x) => x !== k) : [...(r.weekdays ?? []), k] })}>
                      <Checkbox checked={!!r.weekdays?.includes(k)} />
                      {l}
                    </Opt>
                  ))}
                </Row>
              )}
              {r.periodic === 'MONTHLY' && (
                <div>
                  <small style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>매월 다음 날짜에 반복</small>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, maxWidth: 360 }}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                      const on = !!r.daysOfMonth?.includes(d);
                      const chip = (
                        <button key={d} type="button" onClick={() => setR({ daysOfMonth: on ? r.daysOfMonth!.filter((x) => x !== d) : [...(r.daysOfMonth ?? []), d] })} style={{ width: 36, height: 36, borderRadius: 18, border: `1px solid ${on ? 'var(--border-brand)' : 'var(--border-primary)'}`, background: on ? 'var(--bg-brand-solid)' : 'var(--bg-primary)', color: on ? '#fff' : 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                          {d}
                        </button>
                      );
                      return d >= 29 ? (
                        <HoverTip key={d} content="해당 월에 없는 일자는 그 달의 마지막 날로 예약됩니다. (2월의 30/31일 -> 2월 28일)">
                          {chip}
                        </HoverTip>
                      ) : (
                        chip
                      );
                    })}
                  </div>
                </div>
              )}
              <Row>
                <small>발송 시작일</small>
                <div style={{ width: 160 }}>
                  <TextField type="date" min="2026-10-08" value={(r.start.startDate ?? '2026.10.08').replace(/\./g, '-')} onChange={(e) => setR({ start: { type: 'ON_DATE', startDate: e.target.value.replace(/-/g, '.') } })} />
                </div>
              </Row>
              <Row style={{ flexWrap: 'wrap' }}>
                <small>발송 종료일</small>
                <Radios<string> value={r.end.type} options={[{ value: 'NEVER', label: '무기한' }, { value: 'ON_DATE', label: '기간 선택' }]} onChange={(t) => setR({ end: t === 'NEVER' ? { type: 'NEVER' } : { type: 'ON_DATE', endDate: '2026.10.09' } })} />
                {r.end.type === 'ON_DATE' && (
                  <div style={{ width: 160 }}>
                    <TextField type="date" value={(r.end.endDate ?? '').replace(/\./g, '-')} onChange={(e) => setR({ end: { type: 'ON_DATE', endDate: e.target.value.replace(/-/g, '.') } })} />
                  </div>
                )}
              </Row>
              <div>
                <Button onClick={() => setDates(true)}>예상 발송 일정</Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {capping !== null && (
        <Opt onClick={() => set({ ignoreCapping: !value.ignoreCapping })}>
          <Checkbox checked={value.ignoreCapping} />
          {capping ? `현재 설정된 발송 빈도 제한 무시 (${capping})` : '현재 설정된 발송 빈도 제한 무시'}
        </Opt>
      )}
      {dates && (
        <Dialog title="발송 예정일" width={600} onClose={() => setDates(false)}>
          <DataTable
            columns={[
              { label: '순서', width: '80px' },
              { label: '날짜', width: '160px' },
              { label: '시간', width: 'minmax(0,1fr)' },
            ]}
            rows={nextDates(r, 5).map((d, i) => ({ key: String(i), cells: [String(i + 1), fmtDate(d), `${fmtTime(d)} (GMT${OFF[r.timeZone] ?? '+09:00'}) ${r.timeZone}`] }))}
            empty={<p style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>데이터가 없습니다</p>}
          />
        </Dialog>
      )}
    </>
  );
}

export function sendSummary(s: SendState) {
  if (s.mode === 'now') return '지금 발송';
  if (s.mode === 'at') return `예약 발송 (${s.date} ${String(s.hour).padStart(2, '0')}:${String(s.minute).padStart(2, '0')}:00 - ${s.tz})`;
  return '반복 발송';
}
export const recurringRows = (s: SendState): [string, string][] =>
  s.mode === 'recurring'
    ? [
        ['반복 주기', `${periodText(s.recurring)} (GMT${OFF[s.recurring.timeZone] ?? '+09:00'}) ${s.recurring.timeZone}`],
        ['발송 시작일', s.recurring.start.startDate ?? '-'],
        ['발송 종료일', s.recurring.end.type === 'NEVER' ? '무기한' : s.recurring.end.endDate ?? '-'],
      ]
    : [];

// ── 발송 정보 확인 모달
const Block = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  > b { ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  > dl { margin: 0; display: grid; grid-template-columns: 140px minmax(0, 1fr); border: 1px solid ${color('border-secondary')}; border-radius: ${radius.md}px; overflow: hidden; }
  dt, dd { margin: 0; padding: 10px 14px; ${text('text-sm', 'regular')}; }
  dl > div + div > dt, dl > div + div > dd { border-top: 1px solid ${color('border-secondary')}; }
  dt { background: ${color('bg-secondary')}; color: ${color('text-tertiary')}; }
  dd { color: ${color('text-primary')}; white-space: pre-wrap; word-break: break-all; }
`;

export type ConfirmBlock = { title: string; rows: [string, ReactNode][] };
export function SendConfirm({ blocks, label, onClose, onConfirm }: { blocks: ConfirmBlock[]; label: string; onClose: () => void; onConfirm: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      title="발송 정보 확인"
      width={640}
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button size="md" onClick={onClose} disabled={busy}>
            취소
          </Button>
          <Button
            hierarchy="primary"
            size="md"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setTimeout(onConfirm, 600);
            }}
          >
            {busy ? `${label} 중` : label}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 'calc(100vh - 260px)', overflow: 'auto' }}>
        {blocks
          .filter((b) => b.rows.length)
          .map((b) => (
            <Block key={b.title}>
              <b>{b.title}</b>
              <dl>
                {b.rows.map(([k, v]) => (
                  <div key={k} style={{ display: 'contents' }}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </Block>
          ))}
      </div>
    </Dialog>
  );
}

// ── 임시 저장 (모듈 상태 — 채널별)
export type Draft = { id: string; channel: string; title: string; savedAt: string; payload: unknown };
export const drafts: Draft[] = [{ id: 'd-1', channel: 'push', title: '가을 프로모션 초안', savedAt: '2026.10.07 18:22:10', payload: null }];

export function DraftsModal({ channel, current, onClose, onLoad }: { channel: string; current?: string; onClose: () => void; onLoad: (d: Draft) => void }) {
  const [, force] = useState(0);
  const list = drafts.filter((d) => d.channel === channel);
  return (
    <Dialog title={`임시 저장 ${list.length}`} onClose={onClose}>
      {list.length === 0 ? (
        <p style={{ margin: 0, padding: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-tertiary)' }}>임시 저장된 캠페인이 없습니다.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-secondary)', borderRadius: 8, overflow: 'hidden' }}>
          {list.map((d, i) => (
            <div
              key={d.id}
              role="button"
              onClick={() => {
                if (d.id === current || !window.confirm('저장된 메시지를 불러오시겠습니까?')) return;
                onLoad(d);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderTop: i ? '1px solid var(--border-secondary)' : 0, cursor: 'pointer' }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <b style={{ fontSize: 14, fontWeight: 600 }}>{d.title || '제목 없음'}</b>
                <small style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{`마지막 저장 시간: ${d.savedAt}`}</small>
              </div>
              {d.id === current ? (
                <Badge color="brand">작성중</Badge>
              ) : (
                <IconButton
                  icon="delete"
                  label="삭제"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!window.confirm('캠페인을 삭제하시겠습니까? 삭제된 글은 복구되지 않습니다.')) return;
                    drafts.splice(drafts.indexOf(d), 1);
                    force((n) => n + 1);
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </Dialog>
  );
}

export const now = () => '2026.10.08 23:00:00';
export { ConfirmModal };
