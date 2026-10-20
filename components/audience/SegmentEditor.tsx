import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import Select, { type Option } from '@/components/ui/Select';
import SearchSelect, { type SearchOption } from '@/components/ui/SearchSelect';
import NumberField from '@/components/ui/NumberField';
import DateTimeField from '@/components/ui/DateTimeField';
import TextField from '@/components/ui/TextField';
import { Card } from '@/components/channel/ChannelShell';
import { PageTitle } from '@/components/sent/SentList';
import { emitAudience, hasEventOrCsv, OP_LABEL, segments, TYPE_LABEL, type Condition } from '@/lib/audience';
import { COUNTRIES, DEVICE_TAGS, LANGUAGES, SEG_EVENTS, USER_TAGS } from '@/lib/segmentCatalog';
import { abbrNum } from '@/lib/sent';
import { useStore } from '@/lib/store';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 새 세그먼트 · 세그먼트 수정 — Figma 「새 세그먼트 — 조건 빌더」(1152:15680, 10-20 사용자 간격 수정분) + docs/staging-behavior-users-devices.md 7장.
// 그룹(또는) 최대 10 · 그룹 안 조건(그리고) 최대 20 · 이벤트 속성 필터 최대 3. 추정 수 = 바뀐 뒤 3초. 저장 시 화면 검사 없음, 「취소」는 이탈 확인 없이 목록으로.
// 유저 세그먼트 조건 유형 · 연산자 = 스테이징 /user-segments/new 실측(10-20). 기기 세그먼트는 아직 짐작(서버 /configs 를 못 읽음).
type Valid = (string[] | 'STRING')[];
const CMP6 = ['EQ', 'NOT_EQ', 'GTE', 'LTE', 'GT', 'LT']; // 스테이징 순서 = ≠ ≥ ≤ > <
const TAG_OPS = ['EQ', 'NOT_EQ', 'GTE', 'LTE', 'GT', 'LT', 'INCLUDES', 'CONTAINS_ANY_OF', 'CONTAINS_NONE_OF', 'EXIST', 'NOT_EXIST', 'IN_THE_LAST_N_HOURS', 'AFTER_HOURS', 'REMAIN_HOURS', 'BEFORE', 'AFTER'];
const VALID: Record<string, Valid> = {
  USER_ID: [['EQ', 'CSV'], 'STRING'],
  BIRTHDAY: [['EQ']],
  SMS_UNSUBSCRIBED: [['true', 'false']],
  PHONE_NUMBER: [['EQ', 'NOT_EQ', 'EXIST', 'NOT_EXIST'], 'STRING'],
  TAG: ['STRING', TAG_OPS, 'STRING'],
  CREATED_AT_WITHIN_HOURS: [['NOT_EQ', 'EQ'], 'STRING'],
  LAST_ACTIVE_AT_WITHIN_HOURS: [['NOT_EQ', 'EQ'], 'STRING'],
  LAST_DEVICE_ACTIVATED_AT_WITHIN_HOURS: [['NOT_EQ', 'EQ'], 'STRING'],
  COUNTRY: [['EQ', 'NOT_EQ'], 'STRING'],
  LANGUAGE: [['EQ', 'NOT_EQ'], 'STRING'],
  AGE: [CMP6, 'STRING'],
  // 기기(짐작)
  PLATFORM: [['EQ', 'NOT_EQ'], ['app', 'android', 'ios', 'web', 'webDesktop', 'webMobile']],
  TEST_DEVICE: [['true', 'false']],
  SUBSCRIBED: [['true', 'false']],
  BROWSER: [['EQ', 'NOT_EQ'], 'STRING'],
  APP_VERSION: [CMP6, 'STRING'],
  OS_VERSION: [CMP6, 'STRING'],
  SDK_VERSION: [CMP6, 'STRING'],
};
// 스테이징 드롭다운 순서
const USER_TYPES = ['USER_ID', 'BIRTHDAY', 'SMS_UNSUBSCRIBED', 'PHONE_NUMBER', 'EVENT', 'TAG', 'CREATED_AT_WITHIN_HOURS', 'LAST_DEVICE_ACTIVATED_AT_WITHIN_HOURS', 'COUNTRY', 'LANGUAGE', 'AGE'];
const DEVICE_TYPES = ['PLATFORM', 'TEST_DEVICE', 'USER_ID', 'TAG', 'EVENT', 'BROWSER', 'APP_VERSION', 'OS_VERSION', 'SDK_VERSION', 'SUBSCRIBED', 'CREATED_AT_WITHIN_HOURS', 'LAST_ACTIVE_AT_WITHIN_HOURS', 'COUNTRY', 'LANGUAGE'];
const TIME_TYPES = new Set(['CREATED_AT_WITHIN_HOURS', 'LAST_ACTIVE_AT_WITHIN_HOURS', 'LAST_DEVICE_ACTIVATED_AT_WITHIN_HOURS']);
const TAG_TIME = new Set(['AFTER_HOURS', 'REMAIN_HOURS', 'IN_THE_LAST_N_HOURS']);
const TAG_DATE = new Set(['AFTER', 'BEFORE']);
const MULTI = new Set(['CONTAINS_ANY_OF', 'CONTAINS_NONE_OF']);
const EVENT_INIT = ['', 'IN_THE_LAST_N_HOURS', '1', '', 'EQ', '1', []] as unknown as string[]; // 스테이징 기본값
const valueKind = (op: string) => (TAG_TIME.has(op) ? 'time' : TAG_DATE.has(op) ? 'date' : MULTI.has(op) ? 'multi' : 'plain');
const nowIso = () => new Date(new Date().setSeconds(0, 0)).toISOString();
// 연산자 칸 폭(Figma: 태그 120 · 생일/시간 200, 나머지는 라벨 길이에 맞춤)
const OP_W: Record<string, number> = { TAG: 120, BIRTHDAY: 200, CREATED_AT_WITHIN_HOURS: 200, LAST_ACTIVE_AT_WITHIN_HOURS: 200, LAST_DEVICE_ACTIVATED_AT_WITHIN_HOURS: 200, USER_ID: 180, PHONE_NUMBER: 160, SMS_UNSUBSCRIBED: 120, TEST_DEVICE: 120, SUBSCRIBED: 120, PLATFORM: 120 };

const opLabel = (type: string, v: string) => (TIME_TYPES.has(type) ? OP_LABEL[`TIME_${v}`] : type === 'BIRTHDAY' ? OP_LABEL.BIRTHDAY_EQ : undefined) ?? OP_LABEL[v] ?? v;
const opts = (vals: string[], type: string, disabled?: (v: string) => boolean): Option<string>[] => vals.map((v) => ({ value: v, label: opLabel(type, v), disabled: disabled?.(v) }));

// ---------- 스타일 (Figma 1152:15680) ----------
const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 480px;
  max-width: 100%;
`;

const FieldLabel = styled.span`
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
`;

const Filters = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

// 그룹 = bg-secondary r12 · 안쪽 16 · 줄 사이 24(사용자 10-20 간격 수정)
const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px;
  border-radius: ${radius.xl}px;
  background: ${color('bg-secondary')};
`;

const Line = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  > div[data-fields] { flex: 1; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-width: 0; }
  > div[data-fields] > span { ${text('text-sm', 'regular')}; color: ${color('text-secondary')}; white-space: nowrap; }
`;

// 이벤트 속성 필터 줄 = 조건 칸 시작선(유형 칸 160 + 간격 8)에서 시작 — 값 칸 묶음(data-fields) 안에서 줄을 바꿔 그리므로 따로 들여쓰지 않음
const SubRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Or = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
  ${text('text-xs', 'medium')};
  color: ${color('text-tertiary')};
  &::before, &::after { content: ''; flex: 1; height: 1px; background: ${color('border-secondary')}; }
`;

// 추정 수 = Alert(Brand · Floating) — 흰 바탕 · border-primary · r12 · 안쪽 16 · 아이콘 브랜드색
const Estimate = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: ${radius.xl}px;
  background: ${color('bg-primary')};
  box-shadow: inset 0 0 0 1px ${color('border-primary')}, ${shadow.xs};
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
  > i { display: inline-flex; color: ${color('fg-brand-primary')}; }
  > div { display: flex; align-items: center; gap: 8px; }
  > div > b { ${text('text-sm', 'semibold')}; color: ${color('text-brand-secondary')}; }
  > div > span { display: inline-flex; color: ${color('fg-quaternary')}; animation: seg-spin 0.9s linear infinite; }
  @keyframes seg-spin { to { transform: rotate(360deg); } }
`;

const Help = styled.span`
  ${text('text-sm', 'regular')};
  color: ${color('text-tertiary')};
  white-space: normal !important;
`;

const ErrorText = styled.p`
  margin: 6px 0 0;
  ${text('text-sm', 'regular')};
  color: ${color('text-error-primary')};
`;

const FileLink = styled.a`
  ${text('text-sm', 'medium')};
  color: ${color('text-brand-secondary')};
  text-decoration: underline;
  cursor: pointer;
`;

const Grow = ({ children, min = 160 }: { children: ReactNode; min?: number }) => <div style={{ flex: 1, minWidth: min }}>{children}</div>;
const W = ({ w, children }: { w: number; children: ReactNode }) => <div style={{ width: w, flexShrink: 0 }}>{children}</div>;
const Remove = ({ onClick }: { onClick: () => void }) => <Button hierarchy="tertiary" icon="remove" aria-label="삭제" onClick={onClick} />;

// ---------- CSV 업로드 (유저 ID 「가 CSV 파일에 포함」) ----------
function CsvUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { toast } = useStore();
  const ref = useRef<HTMLInputElement>(null);
  const onFile = async (f: File) => {
    if (!/\.csv$/i.test(f.name)) return toast('CSV 파일 형식이 올바르지 않습니다.');
    if (f.size > 128 * 1024 * 1024) return toast('CSV 파일은 128MB까지 업로드할 수 있습니다.');
    let txt = '';
    try {
      txt = new TextDecoder('utf-8', { fatal: true }).decode(await f.arrayBuffer());
    } catch {
      window.alert('CSV 파일은 UTF-8 형식이어야 합니다. 다른 인코딩 형식의 파일은 지원되지 않습니다.');
      return;
    }
    if (txt.split(/\r?\n/).filter(Boolean).length > 1_000_000) return toast('CSV 내 라인수가 1,000,000개를 초과했습니다.');
    onChange(f.name);
  };
  if (value) {
    return (
      <>
        <FileLink>{value}</FileLink>
        <Button hierarchy="tertiary" onClick={() => onChange('')}>
          삭제
        </Button>
      </>
    );
  }
  return (
    <>
      <Button hierarchy="tertiary" iconLeading="upload" onClick={() => ref.current?.click()}>
        CSV 파일 업로드
      </Button>
      <Help>A열에 발송할 유저 ID를 입력한 CSV를 업로드하세요.(최대 100만 행, 128MB)</Help>
      <input
        ref={ref}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) onFile(f);
        }}
      />
    </>
  );
}

// ---------- 이벤트 조건 ----------
function EventFields({ c, set }: { c: Condition; set: (values: string[]) => void }) {
  const router = useRouter();
  const v = c.values as unknown as [string, string, string, string, string, string, string[][]];
  const [name, , hours, unitRaw, op, count, subs] = v;
  const unit = unitRaw || (Number(hours) % 24 === 0 && Number(hours) >= 24 ? 'DAY' : 'HOUR');
  const n = unit === 'DAY' ? Math.round(Number(hours) / 24) : Number(hours);
  const upd = (i: number, x: unknown) => {
    const next = [...v] as unknown[];
    next[i] = x;
    set(next as string[]);
  };
  const ev = SEG_EVENTS.find((e) => e.name === name);
  const propOpts: SearchOption[] = Object.keys(ev?.props ?? {}).map((p) => ({ value: p, label: p }));
  const subList = subs ?? [];
  return (
    <>
      <span>최근</span>
      <NumberField width={64} min={1} max={unit === 'DAY' ? 90 : 2160} value={String(n || '')} ariaLabel="기간" onChange={(x) => upd(2, x === '' ? '' : String(Math.max(1, Number(x)) * (unit === 'DAY' ? 24 : 1)))} />
      <W w={88}>
        <Select<string>
          value={unit}
          options={[{ value: 'DAY', label: '일' }, { value: 'HOUR', label: '시간' }]}
          onChange={(u) => {
            const next = [...v] as unknown[];
            next[3] = u;
            next[2] = String(Math.min(u === 'DAY' ? 90 : 2160, Math.max(1, n || 1)) * (u === 'DAY' ? 24 : 1));
            set(next as string[]);
          }}
        />
      </W>
      <span>이내, 다음</span>
      <SearchSelect
        width={180}
        value={name || null}
        placeholder="이벤트 선택"
        options={SEG_EVENTS.map((e) => ({ value: e.name, label: e.name }))}
        action={{ label: '새 이벤트', onClick: () => router.push('/data-management') }}
        onChange={(e) => {
          const next = [...v] as unknown[];
          next[0] = e;
          next[6] = [];
          set(next as string[]);
        }}
      />
      <W w={72}>
        <Select<string> value={op} menuWidth={120} options={opts(CMP6, 'EVENT', (o) => o === 'LT' && count === '1')} onChange={(o) => upd(4, o)} />
      </W>
      <NumberField width={64} min={1} max={5} value={count} ariaLabel="횟수" onChange={(x) => upd(5, x === '' ? '' : String(Math.min(5, Math.max(1, Number(x)))))} />
      <span>회 발생</span>
      {subList.length < 3 && (
        <Button iconLeading="add" onClick={() => upd(6, [...subList, ['', 'EQ', '']])}>
          필터
        </Button>
      )}
      <PropRows subs={subList} propOpts={propOpts} values={(k) => ev?.props[k] ?? []} onChange={(next) => upd(6, next)} />
    </>
  );
}

// 이벤트 속성 필터 줄들 — 값 칸 묶음(flex-wrap)에서 100% 폭을 차지해 아래 줄로(위 줄과 12 = 줄 간격 8 + 4)
function PropRows({ subs, propOpts, values, onChange }: { subs: string[][]; propOpts: SearchOption[]; values: (k: string) => string[]; onChange: (next: string[][]) => void }) {
  if (!subs.length) return null;
  return (
    <div style={{ flexBasis: '100%', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
      {subs.map((sc, i) => (
        <SubRow key={i}>
          <SearchSelect width={160} value={sc[0] || null} placeholder="속성 선택" options={propOpts} emptyText="이 이벤트에 속성이 없습니다" onChange={(k) => onChange(subs.map((x, j) => (j === i ? [k, x[1], ''] : x)))} />
          <W w={88}>
            <Select<string> value={sc[1]} menuWidth={140} options={[...CMP6, 'INCLUDES'].map((o) => ({ value: o, label: OP_LABEL[o] }))} onChange={(o) => onChange(subs.map((x, j) => (j === i ? [x[0], o, x[2]] : x)))} />
          </W>
          <SearchSelect width={160} value={sc[2] || null} placeholder="값 선택" creatable options={values(sc[0]).map((x) => ({ value: x, label: x }))} notice="전체 중 최근 일부가 표시됩니다." onChange={(x) => onChange(subs.map((y, j) => (j === i ? [y[0], y[1], x] : y)))} />
          <Remove onClick={() => onChange(subs.filter((_, j) => j !== i))} />
        </SubRow>
      ))}
    </div>
  );
}

// ---------- 일반 조건 값 칸 (docs 7.4) ----------
function Fields({ c, set, target }: { c: Condition; set: (values: string[]) => void; target: 'User' | 'Device' }) {
  const { toast } = useStore();
  const router = useRouter();
  if (!c.type) return null;
  if (c.type === 'EVENT')
    return (
      <EventFields
        c={c}
        set={(vals) => {
          const v = vals as unknown as string[];
          if (v[4] === 'LT' && v[5] === '1') return toast("1회 미만(<)은 유효하지 않은 조건입니다. '미만(<)' 조건은 최소 2회부터 설정할 수 있습니다.");
          set(vals);
        }}
      />
    );
  const valid = VALID[c.type] ?? [];
  const tags = target === 'User' ? USER_TAGS : DEVICE_TAGS;
  const out: ReactNode[] = [];
  for (let i = 0; i < valid.length; i++) {
    const prev = c.values[i - 1];
    if (prev === 'EXIST' || prev === 'NOT_EXIST') break;
    const spec = valid[i];
    const val = c.values[i] ?? '';
    const upd = (x: string) => {
      const next = [...c.values];
      next[i] = x;
      if (x === 'EXIST' || x === 'NOT_EXIST' || x === 'CSV') next.splice(i + 1);
      // 태그 연산자를 바꿔 값 형식(숫자 시간 · 날짜 · 여러 값 · 보통)이 달라지면 값 칸 비움, ~이후/~이전은 지금 시각으로 채움(docs 7.4)
      else if (c.type === 'TAG' && i === 1 && valueKind(c.values[1] ?? '') !== valueKind(x)) next[2] = TAG_DATE.has(x) ? nowIso() : '';
      else if (prev === 'CSV' || ((c.values[i] === 'CSV' || c.values[i] === 'EXIST' || c.values[i] === 'NOT_EXIST') && Array.isArray(spec))) next.splice(i + 1);
      set(next);
    };
    if (Array.isArray(spec)) {
      const w = c.type === 'PLATFORM' && i === 1 ? 168 : OP_W[c.type] ?? 120;
      out.push(
        <W key={i} w={w}>
          <Select<string> value={val || null} placeholder="선택" menuWidth={c.type === 'TAG' ? 240 : Math.max(w, 160)} options={opts(spec, c.type)} onChange={upd} />
        </W>,
      );
    } else if (c.type === 'TAG' && i === 0) {
      out.push(
        <SearchSelect
          key={i}
          width={160}
          value={val || null}
          placeholder="태그 선택"
          options={tags.map((t) => ({ value: t.name, label: t.name, sub: t.desc }))}
          action={{ label: '새 태그', onClick: () => router.push('/data-management') }}
          onChange={(k) => set([k, c.values[1] ?? '', ''])}
        />,
      );
    } else if (prev === 'CSV') {
      out.push(<CsvUpload key={i} value={val} onChange={upd} />);
    } else if (TIME_TYPES.has(c.type) || (c.type === 'TAG' && TAG_TIME.has(prev))) {
      out.push(<NumberField key={i} width={120} min={1} value={val} ariaLabel="시간" onChange={upd} />, <span key={`${i}u`}>시간</span>);
    } else if (c.type === 'TAG' && TAG_DATE.has(prev)) {
      out.push(<DateTimeField key={i} value={val} onChange={upd} />);
    } else if (c.type === 'TAG') {
      const recent = tags.find((t) => t.name === c.values[0])?.values ?? [];
      const many = MULTI.has(prev) && val.split(',').filter((s) => s.trim()).length > 5;
      out.push(
        <Grow key={i}>
          <SearchSelect
            value={val || null}
            placeholder={MULTI.has(prev) ? '값 입력(쉼표로 구분, 최대 5개)' : '값 선택'}
            creatable
            error={many}
            options={recent.map((x) => ({ value: x, label: x }))}
            notice="전체 중 최근 일부가 표시됩니다."
            emptyText="최근 값이 없습니다. 직접 입력하세요."
            onChange={upd}
          />
          {many && <ErrorText>해당 값은 최대 5개까지 입력 가능합니다.</ErrorText>}
        </Grow>,
      );
    } else if (c.type === 'COUNTRY' || c.type === 'LANGUAGE') {
      const list = c.type === 'COUNTRY' ? COUNTRIES : LANGUAGES;
      out.push(<SearchSelect key={i} width={200} value={val || null} placeholder={c.type === 'COUNTRY' ? '국가 선택' : '언어 선택'} showSub options={list.map(([code, name]) => ({ value: code, label: code, sub: name }))} onChange={upd} />);
    } else if (c.type === 'AGE') {
      out.push(<NumberField key={i} width={120} min={0} value={val} ariaLabel="나이" onChange={upd} />);
    } else {
      out.push(
        <Grow key={i}>
          <TextField value={val} placeholder="값 입력" onChange={(e) => upd(e.target.value)} />
        </Grow>,
      );
    }
  }
  return <>{out}</>;
}

const complete = (c: Condition) => {
  if (!c.type) return false;
  if (c.type === 'EVENT') return !!c.values[0];
  const valid = VALID[c.type] ?? [];
  if (c.values.includes('EXIST') || c.values.includes('NOT_EXIST')) return true;
  return c.values.filter((v) => v !== '' && v !== undefined).length === valid.length;
};

export default function SegmentEditor({ target, id, copyId }: { target: 'User' | 'Device'; id?: string; copyId?: string }) {
  const router = useRouter();
  const { toast } = useStore();
  const base = target === 'User' ? '/user-segments' : '/segments';
  const src = segments.find((s) => s.id === (id ?? copyId));
  const [name, setName] = useState(src?.name ?? '');
  const [filters, setFilters] = useState<Condition[][]>(src?.filters.length ? JSON.parse(JSON.stringify(src.filters)) : [[{ type: '', values: [] }]]);
  const [estimate, setEstimate] = useState<{ n: number; busy: boolean }>({ n: 0, busy: false });
  useEffect(() => {
    // 기본 세그먼트는 고칠 수 없음 → 기기 세그먼트 목록으로(스테이징 그대로)
    if (src?.type === 'DEFAULT') router.replace('/segments');
  }, [src, router]);
  const special = hasEventOrCsv(filters);
  useEffect(() => {
    if (special.length || !filters.flat().every(complete)) {
      setEstimate((e) => ({ ...e, busy: false }));
      return;
    }
    setEstimate((e) => ({ ...e, busy: true }));
    const t = setTimeout(() => setEstimate({ n: 12 + ((JSON.stringify(filters).length * 37) % 1800), busy: false }), 3000);
    return () => clearTimeout(t);
  }, [filters, special.length]);

  const types = target === 'User' ? USER_TYPES : DEVICE_TYPES;
  const setCond = (gi: number, ci: number, c: Condition) => setFilters((f) => f.map((g, i) => (i === gi ? g.map((x, j) => (j === ci ? c : x)) : g)));
  const remove = (gi: number, ci: number) => setFilters((f) => f.map((g, i) => (i === gi ? g.filter((_, j) => j !== ci) : g)).filter((g) => g.length));
  const only = filters.length === 1 && filters[0].length === 1;

  return (
    <>
      <PageTitle>
        <h1>{id ? '세그먼트 수정' : '새 세그먼트'}</h1>
      </PageTitle>
      <Card style={{ gap: 24 }}>
        <Field>
          <FieldLabel>이름</FieldLabel>
          <TextField id="segment-name" placeholder="세그먼트 이름" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Filters>
          <FieldLabel>필터</FieldLabel>
          {filters.map((g, gi) => (
            <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {gi > 0 && <Or>또는</Or>}
              <Group>
                {g.map((c, ci) => {
                  return (
                    <Line key={ci}>
                      <W w={160}>
                        <Select<string>
                          value={c.type || null}
                          placeholder="필터 선택"
                          menuWidth={200}
                          options={types.map((t) => ({ value: t, label: TYPE_LABEL[t] }))}
                          onChange={(t) => {
                            // 코호트는 단독 조건(스테이징) — 이 프로토타입엔 코호트 유형 없음
                            setCond(gi, ci, { type: t, values: t === 'EVENT' ? [...EVENT_INIT] : [] });
                          }}
                        />
                      </W>
                      <div data-fields="">
                        <Fields c={c} target={target} set={(values) => setCond(gi, ci, { ...c, values })} />
                      </div>
                      {!only && <Remove onClick={() => remove(gi, ci)} />}
                    </Line>
                  );
                })}
                {g.length < 20 && (
                  <div>
                    <Button hierarchy="tertiary" iconLeading="add" onClick={() => setFilters((f) => f.map((x, i) => (i === gi ? [...x, { type: '', values: [] }] : x)))}>
                      그리고
                    </Button>
                  </div>
                )}
              </Group>
            </div>
          ))}
          {filters.length < 10 && (
            <div>
              <Button iconLeading="add" onClick={() => setFilters((f) => [...f, [{ type: '', values: [] }]])}>
                또는
              </Button>
            </div>
          )}
        </Filters>
        <Estimate>
          <i>
            <Icon name="info" size={20} />
          </i>
          {special.length ? (
            <div>{`${special.join(', ')}가 포함된 세그먼트 입니다.`}</div>
          ) : (
            <div>
              {target === 'User' ? '추정 유저 수' : '추정 기기 수'}
              <b>{abbrNum(estimate.n)}</b>
              {estimate.busy && (
                <span>
                  <Icon name="progress_activity" size={16} />
                </span>
              )}
            </div>
          )}
        </Estimate>
      </Card>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <Button size="md" onClick={() => router.push(base)}>
          취소
        </Button>
        <Button
          hierarchy="primary"
          size="md"
          onClick={() => {
            const clean = filters.map((g) => g.map((c) => ({ ...c, values: c.values.map((v) => (typeof v === 'string' ? v.trim() : v)) })));
            if (id && src) {
              Object.assign(src, { name, filters: clean, updatedAt: '2026.10.20 10:00:00' });
              toast('세그먼트가 수정되었습니다.');
            } else {
              segments.push({ id: `seg-${Date.now().toString(36)}`, name, targetType: target, filters: clean, createdAt: '2026.10.20 10:00:00', updatedAt: '2026.10.20 10:00:00', count: estimate.n });
              toast('세그먼트가 추가되었습니다.');
            }
            emitAudience();
            router.push(base);
          }}
        >
          저장
        </Button>
      </div>
    </>
  );
}
