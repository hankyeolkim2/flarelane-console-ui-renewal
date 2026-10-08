// AI 채팅(실험실) 상태 — docs/staging-behavior-labs.md 2장. 스테이징은 socket.io(/chat), 프로토타입은 모듈 상태 + 가짜 스트리밍.
import { useEffect, useReducer } from 'react';

export type Widget =
  | { kind: 'table'; title: string; columns: string[]; rows: (string | number)[][] }
  | { kind: 'segment_conditions'; targetType: string; groups: string[][] }
  | { kind: 'question'; intro?: string; questions: { q: string; options: string[] }[]; answered?: boolean }
  | { kind: 'plan_document'; title: string; rows: [string, string][]; steps: string[]; status: 'proposed' | 'running' | 'done' | 'stopped'; cursor: number };
export type Msg = { id: string; role: 'user' | 'assistant'; content: string; steps: string[]; widgets: Widget[]; thinking?: number; status?: 'streaming' | 'done' | 'stopped' | 'failed'; stepLabel?: string };
export type Session = { id: string; title: string; updatedAt: string; messages: Msg[] };
export type Reminder = { id: string; title: string; detail: string; remindAt: string };

const read = (k: string, d: string) => {
  try {
    return localStorage.getItem(k) ?? d;
  } catch {
    return d;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* 무시 */
  }
};

export const chat = {
  ready: false,
  launcher: false,
  open: false,
  exp: false,
  plan: false,
  listOpen: true,
  sid: null as string | null,
  sessions: [
    { id: 's-2', title: '지난주 푸시 성과 정리', updatedAt: '2026.10.08 10:12:00', messages: [{ id: 'm1', role: 'user', content: '지난주 푸시 성과 정리해줘', steps: [], widgets: [] }, { id: 'm2', role: 'assistant', content: '지난주(10/1~10/7) 앱 푸시는 **12건** 발송, 평균 클릭률은 **8.4%** 였어요.\n- 가장 반응이 좋은 메시지는 「가을 시즌 오프」(클릭률 11.2%)\n- 저녁 8시 발송분이 오전보다 1.6배 높았어요.', steps: ['발송 내역 조회', '채널별 집계'], widgets: [], thinking: 7, status: 'done' }] },
    { id: 's-1', title: '이탈 위험 세그먼트', updatedAt: '2026.10.03 16:40:00', messages: [] },
    { id: 's-0', title: '알림톡 템플릿 문구 검토', updatedAt: '2026.09.20 11:00:00', messages: [] },
  ] as Session[],
  reminders: [{ id: 'r1', title: '주간 성과 리포트 확인', detail: '지난주 캠페인 성과를 정리하고 다음 주 발송 계획에 반영하기', remindAt: '2026.10.08 09:00:00' }] as Reminder[],
  settings: { serviceName: '', serviceDescription: '', businessTarget: '', mandatoryGuidelines: '', id: null as string | null },
  me: { tone: 'FRIENDLY' as 'PROFESSIONAL' | 'FRIENDLY' | 'CHALLENGER', instructions: '' },
};

const listeners = new Set<() => void>();
export const emitChat = () => listeners.forEach((f) => f());
export function useChat() {
  const [, force] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!chat.ready) {
      chat.ready = true;
      chat.launcher = read('flarelane_chat_launcher', 'false') === 'true';
      chat.open = chat.launcher && read('flarelane_chat_open', 'false') === 'true';
      chat.exp = read('flarelane_chat_exp', 'false') === 'true';
      chat.sid = read('flarelane_chat_sid', '') || null;
      if (!chat.sessions.some((s) => s.id === chat.sid)) chat.sid = null;
      emitChat();
    }
    listeners.add(force);
    return () => {
      listeners.delete(force);
    };
  }, []);
  return chat;
}
export function setChat(p: Partial<typeof chat>) {
  Object.assign(chat, p);
  if (!chat.launcher) chat.open = false;
  write('flarelane_chat_launcher', String(chat.launcher));
  write('flarelane_chat_open', String(chat.open));
  write('flarelane_chat_exp', String(chat.exp));
  write('flarelane_chat_sid', chat.sid ?? '');
  emitChat();
}

export const NOW_STR = '2026.10.08 23:00:00';
export const groupOf = (d: string) => (d.slice(0, 10) === NOW_STR.slice(0, 10) ? '오늘' : d >= '2026.10.01' ? '지난 7일' : '이전');

// ── 가짜 답변 (키워드로 고름)
function answerFor(text: string, plan: boolean): { steps: string[]; content: string; widgets: Widget[] } {
  if (plan)
    return {
      steps: ['요청 이해', '필요한 정보 정리'],
      content: '플랜을 만들기 전에 몇 가지만 확인할게요.',
      widgets: [{ kind: 'question', intro: '진행하기 전에 확인할게요', questions: [{ q: '이번 캠페인의 목표는 무엇인가요?', options: ['재구매 유도', '신규 가입 전환', '휴면 유저 복귀'] }, { q: '어떤 채널로 보낼까요?', options: ['앱 푸시', '알림톡', '문자'] }] }],
    };
  if (/세그먼트|이탈|대상/.test(text) && !/성과/.test(text))
    return {
      steps: ['유저 데이터 조회', '이탈 신호 분석', '세그먼트 조건 정리'],
      content: '최근 활동이 줄어든 유저를 이렇게 고르면 좋겠어요.\n- 최근 14일 동안 앱에 들어오지 않았고\n- 지난 90일 안에 **1회 이상 구매**한 유저\n\n> [!tip] 조건을 세그먼트 화면에 그대로 옮기면 대상 수를 바로 확인할 수 있어요.',
      widgets: [{ kind: 'segment_conditions', targetType: '유저', groups: [['마지막 접속 일시 14일 전보다 이전', 'purchase_completed 90일 내 1회 이상']] }],
    };
  if (/문구|카피/.test(text))
    return { steps: ['최근 발송 문구 확인', '문구 안 작성'], content: '푸시 문구를 세 가지 안으로 제안해요.\n1. **[오늘만] 장바구니 상품 10% 더 할인** - 구매 직전 유저에게\n2. **{{ name }}님이 찜한 상품이 곧 품절돼요** - 관심 상품이 있는 유저에게\n3. **이번 주말, 가을 신상 먼저 만나보세요** - 신규 유저에게', widgets: [] };
  return {
    steps: ['발송 내역 조회', '채널별 집계', '특이점 확인'],
    content: '최근 7일 동안 보낸 메시지를 채널별로 정리했어요.\n- 앱 푸시 클릭률이 지난주보다 **1.2%p** 올랐어요.\n- 문자는 발송 실패가 3건 있었어요. 수신번호 형식을 확인해 보세요.',
    widgets: [{ kind: 'table', title: '채널별 성과', columns: ['채널', '발송', '클릭/열람', '전환'], rows: [['앱 푸시', 12840, '8.4%', 86], ['알림톡', 1150, '-', 40], ['문자', 320, '-', 12], ['이메일', 5200, '35.0%', 66]] }],
  };
}

let timer: ReturnType<typeof setInterval> | null = null;
export function send(text: string) {
  const content = text.trim();
  if (!content || streaming()) return;
  let s = chat.sessions.find((x) => x.id === chat.sid);
  if (!s) {
    s = { id: `s-${Date.now()}`, title: content.slice(0, 30), updatedAt: NOW_STR, messages: [] };
    chat.sessions.unshift(s);
    chat.sid = s.id;
  }
  s.updatedAt = NOW_STR;
  s.messages.push({ id: `u-${Date.now()}`, role: 'user', content, steps: [], widgets: [] });
  const a = answerFor(content, chat.plan);
  const m: Msg = { id: `a-${Date.now()}`, role: 'assistant', content: '', steps: [], widgets: [], status: 'streaming', stepLabel: '요청 확인 중' };
  s.messages.push(m);
  setChat({});
  let t = 0;
  let i = 0;
  timer = setInterval(() => {
    t += 1;
    if (t <= a.steps.length * 3) {
      if (t % 3 === 1) {
        m.steps.push(a.steps[Math.floor(t / 3)]);
        m.stepLabel = a.steps[Math.floor(t / 3)];
      }
    } else if (i < a.content.length) {
      m.stepLabel = '답변 생성 중';
      i = Math.min(a.content.length, i + 6);
      m.content = a.content.slice(0, i);
    } else {
      m.widgets = a.widgets;
      m.status = 'done';
      m.thinking = Math.round((t * 120) / 1000) + 2;
      clearInterval(timer!);
      timer = null;
    }
    emitChat();
  }, 120);
}
export const streaming = () => !!timer;
export function stop() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
  const s = chat.sessions.find((x) => x.id === chat.sid);
  const m = s?.messages[s.messages.length - 1];
  if (m) {
    m.status = 'stopped';
    if (!m.content) m.content = '답변을 중단했어요.';
  }
  emitChat();
}
export function answerQuestions(w: Extract<Widget, { kind: 'question' }>, answers: string[]) {
  w.answered = true;
  const content = w.questions.map((q, i) => `- ${q.q} → ${answers[i]}`).join('\n');
  const s = chat.sessions.find((x) => x.id === chat.sid)!;
  s.messages.push({ id: `u-${Date.now()}`, role: 'user', content, steps: [], widgets: [] });
  s.messages.push({
    id: `a-${Date.now()}`,
    role: 'assistant',
    content: '답변을 바탕으로 플랜을 만들었어요. 확인하고 승인해 주세요.',
    steps: ['플랜 작성'],
    thinking: 5,
    status: 'done',
    widgets: [{ kind: 'plan_document', title: `${answers[0]} 캠페인`, rows: [['목적', answers[0]], ['성과 확인', '발송 후 7일 전환율'], ['대상', '최근 90일 구매 · 14일 미접속 유저'], ['채널', answers[1]], ['일정', '10월 10일(금) 오후 8시']], steps: ['세그먼트 만들기', '메시지 작성', '예약 발송 설정'], status: 'proposed', cursor: 0 }],
  });
  emitChat();
}
export function runPlan(w: Extract<Widget, { kind: 'plan_document' }>) {
  w.status = 'running';
  w.cursor = 0;
  emitChat();
  const t = setInterval(() => {
    if (w.status !== 'running') return clearInterval(t);
    w.cursor += 1;
    if (w.cursor >= w.steps.length) {
      w.status = 'done';
      clearInterval(t);
    }
    emitChat();
  }, 1500);
}
