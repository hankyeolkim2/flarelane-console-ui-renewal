import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Floating from '@/components/ui/Floating';
import IconButton from '@/components/ui/IconButton';
import { HoverTip } from '@/components/ui/Tooltip';
import { answerQuestions, chat, emitChat, groupOf, runPlan, send, setChat, stop, streaming, useChat, type Msg, type Widget } from '@/lib/chat';
import { color, radius, shadow } from '@/styles/tokens';
import { text } from '@/styles/typography';
import AiSettingsModal from './AiSettingsModal';

// AI 채팅 패널(전역) — docs/staging-behavior-labs.md 2장. 「AI 에이전트」 토글을 켜야 런처가 보임.
// 도킹(오른쪽 480, 본문을 밀어냄) · 전체 화면(왼쪽 메뉴 접힘 + 대화 목록 260). ⌘/Ctrl+E 열기 → 전체 화면, ⌘/Ctrl+P 플랜모드.
export const PANEL_W = 480;
const MAX = 8000;

const Launcher = styled.div`
  position: fixed;
  right: calc(24px + var(--cover-gutter, 0px));
  bottom: 24px;
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  > button[data-main] { display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 52px; border: 0; border-radius: 50%; background: linear-gradient(135deg, #2f54eb, #7c3aed); color: #fff; box-shadow: ${shadow.lg}; cursor: pointer; }
  > button[data-chip] { max-width: 260px; padding: 8px 14px; border: 1px solid ${color('border-secondary')}; border-radius: 999px; background: ${color('bg-primary')}; box-shadow: ${shadow.md}; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;
const Panel = styled.aside<{ $exp: boolean }>`
  position: fixed;
  top: 4px;
  bottom: 4px;
  right: calc(4px + var(--cover-gutter, 0px));
  ${(p) => (p.$exp ? 'left: 72px;' : `width: ${PANEL_W}px;`)}
  z-index: 40;
  display: flex;
  background: ${color('bg-primary')};
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  box-shadow: ${shadow.lg};
  overflow: hidden;
`;
const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 260px;
  padding: 12px;
  border-right: 1px solid ${color('border-secondary')};
  background: ${color('bg-secondary')};
  > header { display: flex; align-items: center; gap: 6px; ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  > header > i { flex: 1; }
  > input { height: 34px; padding: 0 10px; border: 1px solid ${color('border-primary')}; border-radius: ${radius.md}px; font: inherit; ${text('text-sm', 'regular')}; }
  > div { flex: 1; overflow: auto; display: flex; flex-direction: column; gap: 2px; }
  > div > small { margin: 10px 4px 4px; ${text('text-xs', 'semibold')}; color: ${color('text-quaternary')}; }
`;
const Item = styled.div<{ $on: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-radius: ${radius.sm}px;
  background: ${(p) => (p.$on ? color('bg-tertiary') : 'transparent')};
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
  cursor: pointer;
  > span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  > button { visibility: hidden; }
  &:hover { background: ${color('bg-primary_hover')}; }
  &:hover > button { visibility: visible; }
`;
const Main = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  > header { display: flex; align-items: center; gap: 2px; height: 56px; padding: 0 10px 0 14px; border-bottom: 1px solid ${color('border-secondary')}; }
  > header > i { flex: 1; }
`;
const TitleBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 220px;
  padding: 4px 6px;
  border: 0;
  border-radius: ${radius.sm}px;
  background: none;
  ${text('text-sm', 'semibold')};
  color: ${color('text-primary')};
  cursor: pointer;
  > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &:hover { background: ${color('bg-primary_hover')}; }
`;
const Dot = styled.i`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${color('fg-error-primary')};
`;
const Scroll = styled.div`
  flex: 1;
  overflow: auto;
  > div { max-width: 760px; margin: 0 auto; padding: 20px 18px; display: flex; flex-direction: column; gap: 18px; }
`;
const Home = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-top: 40px;
  > span { display: inline-flex; align-items: center; justify-content: center; width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #2f54eb, #7c3aed); color: #fff; }
  > b { margin-top: 8px; font-size: 20px; font-weight: 700; color: ${color('text-primary')}; }
  > p { margin: 0 0 16px; ${text('text-md', 'regular')}; color: ${color('text-tertiary')}; }
  > div { display: grid; grid-template-columns: 1fr; gap: 8px; width: 100%; max-width: 420px; }
`;
const HomeCard = styled.button<{ $todo?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid ${(p) => (p.$todo ? color('border-brand') : color('border-secondary'))};
  border-radius: ${radius.lg}px;
  background: ${color('bg-primary')};
  text-align: left;
  cursor: pointer;
  > span { display: inline-flex; color: ${color('fg-brand-secondary')}; }
  > div { display: flex; flex-direction: column; gap: 2px; }
  > div > b { ${text('text-sm', 'semibold')}; color: ${color('text-primary')}; }
  > div > small { ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
  &:hover { border-color: ${color('border-brand')}; }
`;
const User = styled.div`
  align-self: flex-end;
  max-width: 82%;
  padding: 10px 14px;
  border-radius: 16px 16px 4px 16px;
  background: ${color('bg-tertiary')};
  ${text('text-sm', 'regular')};
  color: ${color('text-primary')};
  white-space: pre-wrap;
`;
const Ai = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  ${text('text-sm', 'regular')};
  color: ${color('text-primary')};
  line-height: 1.6;
  > [data-step] { display: inline-flex; align-items: center; gap: 6px; ${text('text-sm', 'medium')}; background: linear-gradient(90deg, #7c3aed, #2f54eb, #7c3aed); background-size: 200% 100%; -webkit-background-clip: text; color: transparent; animation: shine 2s linear infinite; }
  @keyframes shine { to { background-position: 200% 0; } }
  p { margin: 0; }
  ul, ol { margin: 0; padding-left: 20px; }
  blockquote { margin: 0; padding: 8px 12px; border-left: 3px solid ${color('fg-brand-secondary')}; border-radius: 4px; background: ${color('bg-brand-primary')}; }
  > button[data-think] { align-self: flex-start; display: inline-flex; align-items: center; gap: 4px; padding: 0; border: 0; background: none; ${text('text-xs', 'medium')}; color: ${color('text-tertiary')}; cursor: pointer; }
`;
const WCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.lg}px;
  background: ${color('bg-primary')};
  > b { ${text('text-sm', 'semibold')}; }
  table { width: 100%; border-collapse: collapse; ${text('text-xs', 'regular')}; }
  th, td { padding: 6px 8px; border-bottom: 1px solid ${color('border-secondary')}; text-align: left; }
  th { color: ${color('text-tertiary')}; font-weight: 600; cursor: pointer; }
`;
const Composer = styled.div`
  width: 100%;
  max-width: 788px;
  margin: 0 auto;
  padding: 10px 14px 14px;
  > div { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; border: 1px solid ${color('border-primary')}; border-radius: 14px; box-shadow: ${shadow.xs}; }
  > div:focus-within { border-color: ${color('border-brand')}; }
  textarea { width: 100%; border: 0; outline: none; resize: none; font: inherit; ${text('text-sm', 'regular')}; max-height: 176px; }
  > div > footer { display: flex; align-items: center; gap: 10px; ${text('text-xs', 'regular')}; color: ${color('text-tertiary')}; }
  > div > footer > i { flex: 1; }
`;
const Send = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: ${color('bg-brand-solid')};
  color: #fff;
  cursor: pointer;
  &:disabled { background: ${color('bg-disabled')}; color: ${color('text-disabled')}; cursor: not-allowed; }
`;

const HOME_CARDS = [
  ['monitoring', '캠페인 성과 보기', '지난 7일간의 발송 결과를 분석합니다', '최근 7일 동안 보낸 메시지의 성과를 채널별로 정리하고, 눈에 띄는 점이 있으면 짚어줘.'],
  ['group', '세그먼트 만들기', '조건에 맞는 세그먼트를 만들어 드립니다', '최근에 활동이 줄어든 유저를 찾아서, 이탈 위험이 있는 대상을 고를 세그먼트 조건을 제안해줘.'],
  ['edit', '메시지 문구 쓰기', '반응이 좋은 메시지 문구를 제안합니다', '지금 보내려는 푸시에 쓸 문구를 두세 가지 안으로 제안하고, 각각 어떤 상황에 맞는지 알려줘.'],
  ['account_tree', '고객 여정 설계', '목표에 맞는 고객 여정을 설계합니다', '달성하려는 목표를 정하고, 거기에 맞는 고객 여정을 어떤 단계로 짜면 좋을지 설계해줘.'],
];
const isMac = () => typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

// 아주 작은 마크다운(굵게 · 목록 · 콜아웃)
function Md({ src }: { src: string }) {
  const bold = (s: string) => s.split(/(\*\*[^*]+\*\*)/).map((x, i) => (x.startsWith('**') && x.endsWith('**') ? <b key={i}>{x.slice(2, -2)}</b> : <Fragment key={i}>{x}</Fragment>));
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const L = list.ordered ? 'ol' : 'ul';
    blocks.push(
      <L key={blocks.length}>
        {list.items.map((x, i) => (
          <li key={i}>{bold(x)}</li>
        ))}
      </L>,
    );
    list = null;
  };
  for (const line of src.split('\n')) {
    const ul = line.match(/^- (.*)/);
    const ol = line.match(/^\d+\. (.*)/);
    if (ul || ol) {
      const ordered = !!ol;
      if (!list || list.ordered !== ordered) {
        flush();
        list = { ordered, items: [] };
      }
      list.items.push((ul ?? ol)![1]);
      continue;
    }
    flush();
    const c = line.match(/^> \[!(caution|insight|tip|good)\] ?(.*)/);
    if (c) blocks.push(<blockquote key={blocks.length}><b>{{ caution: '주의', insight: '짚어둘 것', tip: '팁', good: '권장' }[c[1]]}</b> {bold(c[2])}</blockquote>);
    else if (line.trim()) blocks.push(<p key={blocks.length}>{bold(line)}</p>);
  }
  flush();
  return <>{blocks}</>;
}

function TableW({ w }: { w: Extract<Widget, { kind: 'table' }> }) {
  const [sort, setSort] = useState<{ i: number; asc: boolean } | null>(null);
  const rows = sort ? [...w.rows].sort((a, b) => (a[sort.i] < b[sort.i] ? -1 : 1) * (sort.asc ? 1 : -1)) : w.rows;
  return (
    <WCard>
      <b>{w.title}</b>
      <table>
        <thead>
          <tr>
            {w.columns.map((c, i) => (
              <th key={c} aria-label={`${c} 기준으로 정렬`} onClick={() => setSort({ i, asc: sort?.i === i ? !sort.asc : true })}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((v, j) => (
                <td key={j}>{typeof v === 'number' ? v.toLocaleString('ko-KR') : v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <Button iconLeading="download">CSV 로 내려받기</Button>
      </div>
    </WCard>
  );
}

function QuestionW({ w }: { w: Extract<Widget, { kind: 'question' }> }) {
  const [i, setI] = useState(0);
  const [ans, setAns] = useState<string[]>([]);
  const [free, setFree] = useState('');
  if (w.answered) return null;
  const q = w.questions[i];
  const pick = (v: string) => {
    const next = [...ans];
    next[i] = v;
    setAns(next);
    setFree('');
    if (i < w.questions.length - 1) setI(i + 1);
  };
  return (
    <WCard style={{ borderColor: 'var(--border-brand)' }}>
      <small style={{ fontSize: 12, color: 'var(--text-brand-secondary)', fontWeight: 600 }}>{w.intro ?? '진행하기 전에 확인할게요'}</small>
      <b>{q.q}</b>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {q.options.map((o) => (
          <Button key={o} hierarchy={ans[i] === o ? 'primary' : 'secondary'} onClick={() => pick(o)}>
            {o}
          </Button>
        ))}
      </div>
      <input value={free} placeholder="직접 입력해도 됩니다" onChange={(e) => setFree(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && free.trim() && pick(free.trim())} style={{ height: 34, padding: '0 10px', border: '1px solid var(--border-primary)', borderRadius: 8, font: 'inherit', fontSize: 13 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <IconButton icon="chevron_left" size="xs" label="이전 질문" disabled={i === 0} onClick={() => setI(i - 1)} />
        <small style={{ fontSize: 12 }}>{`${i + 1} / ${w.questions.length}`}</small>
        <IconButton icon="chevron_right" size="xs" label="다음 질문" disabled={i === w.questions.length - 1} onClick={() => setI(i + 1)} />
        <i style={{ flex: 1 }} />
        <Button hierarchy="primary" disabled={w.questions.some((_, j) => !ans[j])} onClick={() => answerQuestions(w, ans)}>
          답변 보내기
        </Button>
      </div>
    </WCard>
  );
}

function PlanW({ w }: { w: Extract<Widget, { kind: 'plan_document' }> }) {
  return (
    <WCard>
      <b style={{ fontSize: 15 }}>{w.title}</b>
      <table>
        <tbody>
          {w.rows.map(([k, v]) => (
            <tr key={k}>
              <th style={{ width: 90, cursor: 'default' }}>{k}</th>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <b>실행</b>
      <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
        {w.steps.map((s, i) => (
          <li key={s} style={{ opacity: w.status === 'running' && i < w.cursor ? 0.5 : 1, fontWeight: w.status === 'running' && i === w.cursor ? 600 : 400 }}>
            {s}
          </li>
        ))}
      </ol>
      <div style={{ padding: 10, borderRadius: 8, background: 'var(--bg-secondary)', fontSize: 12 }}>
        <b>검증</b> 실행 7일 뒤부터 확인 · {w.status === 'proposed' ? '승인하면 예약돼요' : '예약해 뒀어요'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        {w.status === 'proposed' && (
          <>
            <Button hierarchy="primary" onClick={() => runPlan(w)}>
              승인
            </Button>
            <Button onClick={() => ((w.status = 'stopped'), emitChat())}>파기</Button>
          </>
        )}
        {w.status === 'running' && (
          <>
            <span>{`${w.cursor + 1}/${w.steps.length} 단계 진행 중`}</span>
            <Button onClick={() => ((w.status = 'stopped'), emitChat())}>파기</Button>
          </>
        )}
        {w.status === 'done' && <span>플랜을 마쳤습니다</span>}
        {w.status === 'stopped' && <span>파기했습니다</span>}
      </div>
    </WCard>
  );
}

function AiMsg({ m }: { m: Msg }) {
  const [open, setOpen] = useState(false);
  return (
    <Ai>
      {m.status === 'streaming' && (
        <span data-step="">
          <Icon name="auto_awesome" size={16} />
          {m.stepLabel}
        </span>
      )}
      <Md src={m.content} />
      {m.widgets.map((w, i) =>
        w.kind === 'table' ? (
          <TableW key={i} w={w} />
        ) : w.kind === 'segment_conditions' ? (
          <WCard key={i}>
            <b>{`${w.targetType} 기준`}</b>
            {w.groups.map((g, gi) => (
              <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                {gi > 0 && <small>또는</small>}
                {g.map((c, ci) => (
                  <span key={ci}>
                    {ci > 0 && <small style={{ color: 'var(--text-brand-secondary)', fontWeight: 600 }}>그리고 </small>}
                    {c}
                  </span>
                ))}
              </div>
            ))}
            <small style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>대상 수는 세그먼트 화면에서 확인할 수 있어요</small>
          </WCard>
        ) : w.kind === 'question' ? (
          <QuestionW key={i} w={w} />
        ) : (
          <PlanW key={i} w={w} />
        ),
      )}
      {m.status !== 'streaming' && m.thinking !== undefined && (
        <button type="button" data-think="" onClick={() => setOpen(!open)}>
          {m.thinking >= 60 ? `${Math.floor(m.thinking / 60)}분 ${m.thinking % 60}초 생각함` : `${m.thinking}초 생각함`}
          {m.steps.length > 0 && <Icon name={open ? 'keyboard_arrow_up' : 'keyboard_arrow_down'} size={16} />}
        </button>
      )}
      {open &&
        m.steps.map((s) => (
          <small key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-tertiary)' }}>
            <Icon name="check" size={14} />
            {s}
          </small>
        ))}
    </Ai>
  );
}

function Sessions({ onPick, compact }: { onPick: () => void; compact?: boolean }) {
  const [q, setQ] = useState('');
  const list = chat.sessions.filter((s) => !q || s.title.includes(q));
  const del = (id: string, title: string) => {
    if (!window.confirm(`이 대화를 지울까요?\n\n${title}`)) return;
    chat.sessions.splice(chat.sessions.findIndex((s) => s.id === id), 1);
    setChat({ sid: chat.sid === id ? null : chat.sid });
  };
  return (
    <>
      {!compact && <input placeholder="대화 검색" value={q} onChange={(e) => setQ(e.target.value)} />}
      <div>
        {list.length === 0 && <p style={{ margin: 12, fontSize: 13, color: 'var(--text-tertiary)' }}>{q ? '검색 결과가 없습니다' : '대화 내역이 없습니다'}</p>}
        {(['오늘', '지난 7일', '이전'] as const).map((g) => {
          const items = list.filter((s) => groupOf(s.updatedAt) === g);
          if (!items.length) return null;
          return (
            <Fragment key={g}>
              <small>{g}</small>
              {items.map((s) => (
                <Item key={s.id} $on={s.id === chat.sid} onClick={() => (setChat({ sid: s.id }), onPick())}>
                  <span>{s.title}</span>
                  <IconButton icon="delete" size="xs" label="대화 삭제" onClick={(e) => (e.stopPropagation(), del(s.id, s.title))} />
                </Item>
              ))}
            </Fragment>
          );
        })}
      </div>
    </>
  );
}

function Reminders({ onRun }: { onRun: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14 }}>
      <b style={{ fontSize: 14 }}>해야 될 작업</b>
      {chat.reminders.length === 0 && <p style={{ margin: 0, fontSize: 13, color: 'var(--text-tertiary)' }}>해야 될 작업이 없어요</p>}
      {chat.reminders.map((r) => (
        <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
          <b>{r.title}</b>
          <span style={{ color: 'var(--text-tertiary)' }}>{r.detail}</span>
          <small style={{ color: 'var(--text-brand-secondary)', fontWeight: 600 }}>지금 확인할 수 있어요</small>
          <div style={{ display: 'flex', gap: 6 }}>
            <Button
              hierarchy="primary"
              onClick={() => {
                chat.reminders = chat.reminders.filter((x) => x.id !== r.id);
                setChat({ sid: null });
                send(`${r.title}: ${r.detail}`);
                onRun();
              }}
            >
              실행
            </Button>
            <Button onClick={() => ((chat.reminders = chat.reminders.filter((x) => x.id !== r.id)), emitChat())}>폐기</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ChatRoot() {
  const c = useChat();
  const [input, setInput] = useState('');
  const [settings, setSettings] = useState(false);
  const [menu, setMenu] = useState<null | 'title' | 'todo'>(null);
  const titleRef = useRef<HTMLButtonElement>(null);
  const todoRef = useRef<HTMLSpanElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const ta = useRef<HTMLTextAreaElement>(null);
  const s = c.sessions.find((x) => x.id === c.sid);
  const busy = streaming();
  // 단축키
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!chat.launcher || !(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'e') {
        e.preventDefault();
        if (!chat.open) setChat({ open: true, exp: false });
        else if (!chat.exp) setChat({ exp: true });
      } else if (k === 'p') {
        e.preventDefault();
        if (streaming()) return;
        setChat({ plan: !chat.plan, open: true });
      }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  // 맨 아래면 따라 스크롤
  useEffect(() => {
    const el = scroll.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 120) el.scrollTop = el.scrollHeight;
  });
  useEffect(() => {
    if (c.open) ta.current?.focus();
  }, [c.open, c.sid]);
  if (!c.launcher) return null;
  const hour = 23;
  const greet = hour >= 18 || hour < 5 ? '좋은 저녁이에요.' : hour >= 12 ? '안녕하세요.' : '좋은 아침이에요.';
  const tooLong = input.length > MAX;
  const can = !!input.trim() && !tooLong && !busy;
  const submit = (t = input) => {
    if (!t.trim() || busy || t.length > MAX) return;
    send(t);
    setInput('');
  };
  const mod = isMac() ? '⌘' : 'Ctrl';
  if (!c.open)
    return (
      <Launcher>
        {c.reminders.length > 0 && (
          <button type="button" data-chip="" onClick={() => setChat({ open: true })}>
            {`해야 될 작업 · ${c.reminders[0].title}${c.reminders.length > 1 ? ` +${c.reminders.length - 1}` : ''}`}
          </button>
        )}
        <HoverTip content={`FlareLane AI  ${mod} E`}>
          <button type="button" data-main="" aria-label="FlareLane AI" onClick={() => setChat({ open: true, exp: false })}>
            <Icon name="smart_toy" size={28} />
          </button>
        </HoverTip>
      </Launcher>
    );
  const iconBtn = (icon: string, label: string, onClick: () => void, dot?: boolean) => (
    <HoverTip content={label}>
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        <IconButton icon={icon} label={label} onClick={onClick} />
        {dot && <Dot />}
      </span>
    </HoverTip>
  );
  const settingsEmpty = !c.settings.id;
  return (
    <>
      <Panel $exp={c.exp} aria-label="AI 채팅">
        {c.exp && c.listOpen && (
          <List>
            <header>
              <Icon name="smart_toy" size={18} />
              FlareLane AI
              <i />
              <IconButton icon="left_panel_close" size="xs" label="대화 목록 접기" onClick={() => setChat({ listOpen: false })} />
            </header>
            <Button iconLeading="add" full onClick={() => setChat({ sid: null })}>
              새 대화
            </Button>
            <Sessions onPick={() => undefined} />
          </List>
        )}
        <Main>
          <header>
            {c.exp ? (
              <>
                {!c.listOpen && <IconButton icon="left_panel_open" label="대화 목록 열기" onClick={() => setChat({ listOpen: true })} />}
                <i />
                <b style={{ maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14 }}>{s?.title ?? '새 대화'}</b>
                <i />
              </>
            ) : (
              <>
                <TitleBtn ref={titleRef} type="button" onClick={() => setMenu(menu === 'title' ? null : 'title')}>
                  <span>{s?.title ?? '새 대화'}</span>
                  <Icon name="keyboard_arrow_down" size={18} />
                </TitleBtn>
                <Floating anchorRef={titleRef} open={menu === 'title'} onClose={() => setMenu(null)} width={280} offset={4}>
                  <List style={{ width: '100%', border: 0, maxHeight: 360 }}>
                    <Sessions compact onPick={() => setMenu(null)} />
                  </List>
                </Floating>
                <i />
              </>
            )}
            {iconBtn('settings', 'AI 설정', () => setSettings(true), settingsEmpty)}
            <span ref={todoRef}>{iconBtn('notifications', '해야 될 작업', () => setMenu(menu === 'todo' ? null : 'todo'), c.reminders.length > 0)}</span>
            <Floating anchorRef={todoRef} open={menu === 'todo'} onClose={() => setMenu(null)} width={300} offset={4}>
              <Reminders onRun={() => setMenu(null)} />
            </Floating>
            {iconBtn('add', '새 대화', () => setChat({ sid: null }))}
            {iconBtn(c.exp ? 'close_fullscreen' : 'open_in_full', c.exp ? '패널로 보기' : '전체 화면으로 보기', () => setChat({ exp: !c.exp }))}
            {iconBtn('close', '닫기', () => setChat({ open: false }))}
          </header>
          <Scroll ref={scroll}>
            <div>
              {!s || s.messages.length === 0 ? (
                <Home>
                  <span>
                    <Icon name="smart_toy" size={40} />
                  </span>
                  <b>{greet}</b>
                  <p>무엇을 도와드릴까요?</p>
                  <div>
                    {c.reminders.slice(0, 1).map((r) => (
                      <HomeCard key={r.id} $todo type="button" onClick={() => (chat.reminders = chat.reminders.filter((x) => x.id !== r.id), submit(`${r.title}: ${r.detail}`))}>
                        <span>
                          <Icon name="notifications" size={20} />
                        </span>
                        <div>
                          <b>{r.title}</b>
                          <small>{r.detail}</small>
                        </div>
                      </HomeCard>
                    ))}
                    {HOME_CARDS.slice(0, 4 - Math.min(1, c.reminders.length)).map(([ic, t, d, p]) => (
                      <HomeCard key={t} type="button" onClick={() => submit(p)}>
                        <span>
                          <Icon name={ic} size={20} />
                        </span>
                        <div>
                          <b>{t}</b>
                          <small>{d}</small>
                        </div>
                      </HomeCard>
                    ))}
                  </div>
                </Home>
              ) : (
                s.messages.map((m) => (m.role === 'user' ? <User key={m.id}>{m.content}</User> : <AiMsg key={m.id} m={m} />))
              )}
            </div>
          </Scroll>
          <Composer>
            <div>
              <textarea
                ref={ta}
                rows={Math.min(8, Math.max(1, input.split('\n').length))}
                value={input}
                placeholder="무엇이든 물어보세요"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    submit();
                  }
                }}
              />
              <footer>
                <HoverTip content={`먼저 묻고 플랜 한 장을 만듭니다  ${mod} P`}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: busy ? 'not-allowed' : 'pointer' }} onClick={() => !busy && setChat({ plan: !c.plan })}>
                    <Checkbox checked={c.plan} disabled={busy} />
                    플랜모드
                  </label>
                </HoverTip>
                {tooLong ? <span style={{ color: 'var(--text-error-primary)' }}>{`메시지가 너무 길어요. ${MAX.toLocaleString('ko-KR')}자 안으로 줄여 주세요.`}</span> : <span>Enter 전송 · Shift + Enter 줄바꿈</span>}
                <i />
                {input.length >= 7200 && <span>{`${input.length.toLocaleString('ko-KR')} / ${MAX.toLocaleString('ko-KR')}`}</span>}
                {busy ? (
                  <Send type="button" aria-label="중단" onClick={stop}>
                    <Icon name="stop" size={18} />
                  </Send>
                ) : (
                  <Send type="button" aria-label="보내기" disabled={!can} onClick={() => submit()}>
                    <Icon name="arrow_upward" size={18} />
                  </Send>
                )}
              </footer>
            </div>
          </Composer>
        </Main>
      </Panel>
      {settings && (
        <AiSettingsModal
          onClose={() => {
            setSettings(false);
            emitChat();
          }}
        />
      )}
    </>
  );
}
