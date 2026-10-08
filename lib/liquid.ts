// 개인화 변수(Liquid) 도우미 — 웹훅 · 메시지 편집기 공용. docs/staging-behavior-channel.md 「개인화 변수 모달」 · 「BODY」.
import { userTags } from './catalog';

export const VAR_RE = /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/g;

export type Variable = { name: string; desc: string };

// 스테이징 기본 속성 8개 + 숨김 아닌 태그(tags.*)
export const BASE_VARIABLES: Variable[] = [
  { name: 'phoneNumber', desc: '전화번호' },
  { name: 'name', desc: '이름' },
  { name: 'email', desc: '이메일' },
  { name: 'country', desc: '국가' },
  { name: 'language', desc: '언어' },
  { name: 'dob', desc: '생년월일' },
  { name: 'timeZone', desc: '시간대' },
  { name: 'userId', desc: '유저 ID' },
];
const TAG_DESC: Record<string, string> = { grade: '회원 등급', name: '(데이터 연동되어 자동 추가됨)' };
export const VARIABLES: Variable[] = [...userTags.map((t) => ({ name: `tags.${t}`, desc: TAG_DESC[t] ?? '' })), ...BASE_VARIABLES];

export const liquid = (name: string, fallback: string) => `{{ ${name} | default: "${fallback.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}" }}`;

// 문자열을 [일반, 변수] 조각으로 — 변수 조각은 주황 글자로 그림
export function splitVars(s: string): { text: string; v: boolean }[] {
  const out: { text: string; v: boolean }[] = [];
  let last = 0;
  for (const m of s.matchAll(VAR_RE)) {
    if (m.index! > last) out.push({ text: s.slice(last, m.index), v: false });
    out.push({ text: m[0], v: true });
    last = m.index! + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last), v: false });
  return out;
}

// 변수 자리를 999로 바꿔 JSON 검사 — 빈 본문은 정상. 틀리면 오류 줄 번호(1부터).
export function checkJson(body: string): { ok: true } | { ok: false; line: number } {
  if (!body.trim()) return { ok: true };
  const replaced = body.replace(VAR_RE, '999');
  try {
    JSON.parse(replaced);
    return { ok: true };
  } catch (e) {
    const msg = String((e as Error).message);
    const lm = msg.match(/line (\d+)/);
    if (lm) return { ok: false, line: Number(lm[1]) };
    const pm = msg.match(/position (\d+)/);
    const pos = pm ? Number(pm[1]) : replaced.length;
    return { ok: false, line: replaced.slice(0, pos).split('\n').length };
  }
}

// 변수를 보존한 채 4칸 들여쓰기로 정리 — 파싱 실패면 null
export function formatJson(body: string): string | null {
  const vars: string[] = [];
  const marked = body.replace(VAR_RE, (m) => {
    vars.push(m);
    return String(987650000 + vars.length - 1);
  });
  try {
    let out = JSON.stringify(JSON.parse(marked), null, 4);
    vars.forEach((v, i) => {
      out = out.split(String(987650000 + i)).join(v);
    });
    return out;
  } catch {
    return null;
  }
}

// 헤더·본문에 쓰인 변수 중 기본 속성 · tags.* · entry_event.data 를 뺀 나머지 (테스트 발송 DATA 칸)
export function customVars(...sources: string[]): string[] {
  const base = new Set([...BASE_VARIABLES.map((v) => v.name), 'tags']);
  const found = new Set<string>();
  for (const s of sources)
    for (const m of s.matchAll(/\{\{\s*([\w.]+)/g)) {
      const n = m[1];
      if (base.has(n) || n.startsWith('tags.') || n.startsWith('entry_event.data')) continue;
      found.add(n);
    }
  return [...found];
}
