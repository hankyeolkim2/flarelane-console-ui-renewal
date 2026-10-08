import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import Select, { type Option } from '@/components/ui/Select';
import TextField from '@/components/ui/TextField';
import { Card } from '@/components/channel/ChannelShell';
import { PageTitle } from '@/components/sent/SentList';
import { emitAudience, hasEventOrCsv, OP_LABEL, segments, TYPE_LABEL, type Condition } from '@/lib/audience';
import { events, userTags, deviceTags } from '@/lib/catalog';
import { abbrNum } from '@/lib/sent';
import { useStore } from '@/lib/store';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 새 세그먼트 · 세그먼트 수정 — Figma 「새 세그먼트」(1152:15679) + docs/staging-behavior-users-devices.md 7장.
// 그룹(또는) 최대 10 · 그룹 안 조건(그리고) 최대 20 · 이벤트 하위 조건 최대 3. 추정 수 = 바뀐 뒤 3초. 저장 시 화면 검사 없음, 「취소」는 이탈 확인 없이 목록으로.
// ⚠ 조건 유형 목록 · 유형별 선택지는 스테이징이 서버(GET /configs)에서 받아 와 번들에 없음 → 아래 VALID 는 로케일 라벨 기준으로 짐작한 값.
type Valid = (string[] | 'STRING')[];
const CMP = ['EQ', 'NOT_EQ', 'GT', 'GTE', 'LT', 'LTE'];
const VALID: Record<string, Valid> = {
  USER_ID: [['EQ', 'NOT_EQ', 'EXIST', 'NOT_EXIST', 'CSV'], 'STRING'],
  TAG: ['STRING', ['EQ', 'NOT_EQ', 'GT', 'GTE', 'LT', 'LTE', 'EXIST', 'NOT_EXIST', 'CONTAINS_ANY_OF', 'CONTAINS_NONE_OF', 'AFTER', 'BEFORE', 'AFTER_HOURS', 'REMAIN_HOURS', 'IN_THE_LAST_N_HOURS'], 'STRING'],
  PLATFORM: [['EQ', 'NOT_EQ'], ['app', 'android', 'ios', 'web', 'webDesktop', 'webMobile']],
  TEST_DEVICE: [['true', 'false']],
  SUBSCRIBED: [['true', 'false']],
  SMS_UNSUBSCRIBED: [['true', 'false']],
  BROWSER: [['EQ', 'NOT_EQ'], 'STRING'],
  APP_VERSION: [CMP, 'STRING'],
  OS_VERSION: [CMP, 'STRING'],
  SDK_VERSION: [CMP, 'STRING'],
  CREATED_AT_WITHIN_HOURS: [['EQ', 'NOT_EQ'], 'STRING'],
  LAST_ACTIVE_AT_WITHIN_HOURS: [['EQ', 'NOT_EQ'], 'STRING'],
  LAST_DEVICE_ACTIVATED_AT_WITHIN_HOURS: [['EQ', 'NOT_EQ'], 'STRING'],
  COUNTRY: [['EQ', 'NOT_EQ'], 'STRING'],
  LANGUAGE: [['EQ', 'NOT_EQ'], 'STRING'],
  BIRTHDAY: [['EQ']],
  PHONE_NUMBER: [['EQ', 'NOT_EQ', 'EXIST', 'NOT_EXIST'], 'STRING'],
  AGE: [CMP, 'STRING'],
};
const USER_TYPES = ['USER_ID', 'TAG', 'EVENT', 'CREATED_AT_WITHIN_HOURS', 'LAST_DEVICE_ACTIVATED_AT_WITHIN_HOURS', 'COUNTRY', 'LANGUAGE', 'BIRTHDAY', 'SMS_UNSUBSCRIBED', 'PHONE_NUMBER', 'AGE'];
const DEVICE_TYPES = ['PLATFORM', 'TEST_DEVICE', 'USER_ID', 'TAG', 'EVENT', 'BROWSER', 'APP_VERSION', 'OS_VERSION', 'SDK_VERSION', 'SUBSCRIBED', 'CREATED_AT_WITHIN_HOURS', 'LAST_ACTIVE_AT_WITHIN_HOURS', 'COUNTRY', 'LANGUAGE'];
const TIME_TYPES = new Set(['CREATED_AT_WITHIN_HOURS', 'LAST_ACTIVE_AT_WITHIN_HOURS', 'LAST_DEVICE_ACTIVATED_AT_WITHIN_HOURS']);
const TAG_TIME = new Set(['AFTER_HOURS', 'REMAIN_HOURS', 'IN_THE_LAST_N_HOURS']);
const EVENT_INIT = ['', 'IN_THE_LAST_N_HOURS', '1', '', 'EQ', '1', []] as unknown as string[];

const opLabel = (type: string, v: string) => (TIME_TYPES.has(type) ? OP_LABEL[`TIME_${v}`] : type === 'BIRTHDAY' ? OP_LABEL.BIRTHDAY_EQ : undefined) ?? OP_LABEL[v] ?? v;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  border-radius: ${radius.lg}px;
  background: ${color('bg-secondary')};
`;

const Line = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  > div[data-fields] { flex: 1; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-width: 0; }
  > div[data-fields] > span { ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; white-space: nowrap; }
`;

const Remove = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: ${radius.md}px;
  background: transparent;
  color: ${color('fg-quaternary')};
  cursor: pointer;
  &:hover { background: ${color('bg-primary_hover')}; }
`;

const Or = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  ${text('text-xs', 'regular')};
  color: ${color('text-quaternary')};
  &::before, &::after { content: ''; flex: 1; height: 1px; background: ${color('border-secondary')}; }
`;

const Estimate = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 15px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.lg}px;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
  > span { display: inline-flex; color: ${color('fg-quaternary')}; }
  > b { ${text('text-sm', 'semibold')}; color: ${color('text-brand-secondary')}; }
`;

const Label = styled.span`
  display: block;
  margin-bottom: 6px;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
`;

const W = ({ w, children }: { w: number; children: ReactNode }) => <div style={{ width: w, flexShrink: 0 }}>{children}</div>;
const opts = (vals: string[], type: string): Option<string>[] => vals.map((v) => ({ value: v, label: opLabel(type, v) }));

function EventFields({ c, set, eventsList }: { c: Condition; set: (values: string[]) => void; eventsList: string[] }) {
  const v = c.values as unknown as [string, string, string, string, string, string, string[][]];
  const [name, , hours, unitRaw, op, count, subs] = v;
  const unit = unitRaw || (Number(hours) % 24 === 0 && Number(hours) >= 24 ? 'DAY' : 'HOUR');
  const n = unit === 'DAY' ? Number(hours) / 24 : Number(hours);
  const upd = (i: number, x: unknown) => {
    const next = [...v] as unknown[];
    next[i] = x;
    set(next as string[]);
  };
  const props = events.find((e) => e.name === name)?.properties ?? [];
  return (
    <>
      <span>최근</span>
      <W w={56}>
        <TextField type="number" min={1} max={unit === 'DAY' ? 90 : 2160} value={String(n)} onChange={(e) => upd(2, String(Math.max(1, Number(e.target.value) || 1) * (unit === 'DAY' ? 24 : 1)))} />
      </W>
      <W w={76}>
        <Select<string> value={unit} options={[{ value: 'DAY', label: '일' }, { value: 'HOUR', label: '시간' }]} onChange={(u) => { const next = [...v] as unknown[]; next[3] = u; next[2] = String(n * (u === 'DAY' ? 24 : 1)); set(next as string[]); }} />
      </W>
      <span>이내, 다음</span>
      <W w={150}>
        <Select<string> value={name || null} placeholder="이벤트 선택" options={eventsList.map((e) => ({ value: e, label: e }))} onChange={(e) => upd(0, e)} />
      </W>
      <W w={72}>
        <Select<string> value={op} options={CMP.map((o) => ({ value: o, label: OP_LABEL[o], disabled: o === 'LT' && count === '1' }))} onChange={(o) => upd(4, o)} />
      </W>
      <W w={56}>
        <TextField type="number" min={1} max={5} value={count} onChange={(e) => upd(5, String(Math.min(5, Math.max(1, Number(e.target.value) || 1))))} />
      </W>
      <span>회 발생</span>
      {(subs?.length ?? 0) < 3 && (
        <Button hierarchy="tertiary" iconLeading="add" onClick={() => upd(6, [...(subs ?? []), ['', 'EQ', '']])}>
          필터
        </Button>
      )}
      {(subs ?? []).map((sc, i) => (
        <div key={i} style={{ flexBasis: '100%', display: 'flex', gap: 8, alignItems: 'center' }}>
          <W w={150}>
            <Select<string> value={sc[0] || null} placeholder="속성 선택" options={props.map((p) => ({ value: p, label: p }))} onChange={(k) => upd(6, subs.map((x, j) => (j === i ? [k, x[1], x[2]] : x)))} />
          </W>
          <W w={120}>
            <Select<string> value={sc[1]} options={[...CMP, 'INCLUDES'].map((o) => ({ value: o, label: OP_LABEL[o] }))} onChange={(o) => upd(6, subs.map((x, j) => (j === i ? [x[0], o, x[2]] : x)))} />
          </W>
          <W w={180}>
            <TextField value={sc[2]} placeholder="값 입력" onChange={(e) => upd(6, subs.map((x, j) => (j === i ? [x[0], x[1], e.target.value] : x)))} />
          </W>
          <Remove type="button" aria-label="삭제" onClick={() => upd(6, subs.filter((_, j) => j !== i))}>
            <Icon name="remove" size={20} />
          </Remove>
        </div>
      ))}
    </>
  );
}

function Fields({ c, set, target }: { c: Condition; set: (values: string[]) => void; target: 'User' | 'Device' }) {
  const { toast } = useStore();
  if (!c.type) return null;
  if (c.type === 'EVENT') return <EventFields c={c} set={(vals) => { const v = vals as unknown as string[]; if (v[4] === 'LT' && v[5] === '1') return toast("1회 미만(<)은 유효하지 않은 조건입니다. '미만(<)' 조건은 최소 2회부터 설정할 수 있습니다."); set(vals); }} eventsList={events.map((e) => e.name)} />;
  const valid = VALID[c.type] ?? [];
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
      set(next);
    };
    if (Array.isArray(spec)) {
      out.push(
        <W key={i} w={c.type === 'PLATFORM' && i === 1 ? 168 : 164}>
          <Select<string> value={val || null} placeholder="선택" options={opts(spec, c.type)} onChange={upd} />
        </W>,
      );
    } else if (c.type === 'TAG' && i === 0) {
      out.push(
        <W key={i} w={140}>
          <Select<string> value={val || null} placeholder="태그 선택" options={(target === 'User' ? userTags : deviceTags).map((t) => ({ value: t, label: t }))} onChange={upd} />
        </W>,
      );
    } else if (prev === 'CSV') {
      out.push(
        <Button key={i} hierarchy="tertiary" iconLeading="upload" onClick={() => upd('upload/target.csv')}>
          {val ? 'target.csv' : 'CSV 파일 업로드'}
        </Button>,
      );
    } else {
      const hours = TIME_TYPES.has(c.type) || (c.type === 'TAG' && TAG_TIME.has(prev));
      out.push(
        <div key={i} style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TextField value={val} type={hours ? 'number' : 'text'} placeholder={hours ? '' : '값 입력'} onChange={(e) => upd(e.target.value)} />
          {hours && <span>시간</span>}
        </div>,
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
    if (special.length || !filters.flat().every(complete)) return;
    setEstimate((e) => ({ ...e, busy: true }));
    const t = setTimeout(() => setEstimate({ n: 12 + (JSON.stringify(filters).length * 37) % 1800, busy: false }), 3000);
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
      <Card>
        <div style={{ width: 400 }}>
          <Label>이름</Label>
          <TextField id="segment-name" placeholder="세그먼트 이름" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Label style={{ marginBottom: -6 }}>필터</Label>
          {filters.map((g, gi) => (
            <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {gi > 0 && <Or>또는</Or>}
              <Group>
                {g.map((c, ci) => (
                  <Line key={ci}>
                    <div data-fields="">
                      <W w={132}>
                        <Select<string>
                          value={c.type || null}
                          placeholder="필터 선택"
                          options={types.map((t) => ({ value: t, label: TYPE_LABEL[t] }))}
                          onChange={(t) => setCond(gi, ci, { type: t, values: t === 'EVENT' ? [...EVENT_INIT] : [] })}
                        />
                      </W>
                      <Fields c={c} target={target} set={(values) => setCond(gi, ci, { ...c, values })} />
                    </div>
                    {!only && (
                      <Remove type="button" aria-label="삭제" onClick={() => remove(gi, ci)}>
                        <Icon name="remove" size={20} />
                      </Remove>
                    )}
                  </Line>
                ))}
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
        </div>
        <Estimate>
          <span>
            <Icon name="info" size={20} />
          </span>
          {special.length ? (
            `${special.join(', ')}가 포함된 세그먼트 입니다.`
          ) : (
            <>
              {target === 'User' ? '추정 유저 수' : '추정 기기 수'}
              <b>{abbrNum(estimate.n)}</b>
              {estimate.busy && <Icon name="progress_activity" size={16} />}
            </>
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
              Object.assign(src, { name, filters: clean, updatedAt: '2026.10.08 23:00:00' });
              toast('세그먼트가 수정되었습니다.');
            } else {
              segments.push({ id: `seg-${Date.now().toString(36)}`, name, targetType: target, filters: clean, createdAt: '2026.10.08 23:00:00', updatedAt: '2026.10.08 23:00:00', count: estimate.n });
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
