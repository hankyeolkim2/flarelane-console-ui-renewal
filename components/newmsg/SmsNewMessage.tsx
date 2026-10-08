import { useRef, type ReactNode } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import TextField from '@/components/ui/TextField';
import SmsPreview from '@/components/preview/SmsPreview';
import type { SmsMessage } from '@/lib/sent';
import { Label, LabeledToggle, Row, VarField } from './parts';
import type { EditMode } from './parts';
import Shell, { KakaoTestSend, kakaoZero, PreviewCard } from './Shell';

// 문자 새 메시지 — docs 5장. 광고 ON 이면 머리/꼬리 문구 붙인 전체 텍스트로 바이트 · 유형 계산.
const SENDER = '플레어레인';
const UNSUB = '080-000-0000';
export type SmsM = M;
type M = { isAd: boolean; title: string; body: string; image: string };
export const smsInitial = (): M => ({ ...initial });
const initial: M = { isAd: true, title: '', body: '', image: '' };
const PH = `1. SMS : 단문 메세지 (90 바이트, 띄어쓰기 포함)

2. LMS : 이미지가 첨부되지 않은 장문 메세지 (2,000 바이트, 띄어쓰기 포함)

3. MMS : 이미지를 포함한 장문 메세지 (2,000 바이트, 띄어쓰기 포함_jpg,jpeg 파일 300kb)

* 개인화 메시지를 발송하면 LMS로 차감 후, 실제 발송 결과에 따라 비용이 재조정됩니다.`;

export const full = (m: M) => (m.isAd ? `(광고) [${SENDER}]\n${m.body}\n무료수신거부: ${UNSUB}` : m.body);
const bytes = (s: string) => [...s].reduce((a, c) => a + (c.charCodeAt(0) < 128 ? 1 : 2), 0);
const typeOf = (m: M): SmsMessage['type'] => (m.image ? 'MMS' : m.title || bytes(full(m)) > 90 || /\{\{|\{%/.test(m.body) ? 'LMS' : 'SMS');
const strip = (b: string) => b.replace(/^\(광고\) \[[^\]]*\]\s*/, '').replace(/\s*무료수신거부: .*$/, '');

export function SmsFields({ m, set }: { m: M; set: (p: Partial<M>) => void }) {
  const file = useRef<HTMLInputElement>(null);
  const t = typeOf(m);
  return (
    <>
      <Row>
        <LabeledToggle checked={m.isAd} onChange={(isAd) => set({ isAd })} label="광고성 메시지" />
      </Row>
      {t !== 'SMS' && (
        <div>
          <Label>제목</Label>
          <VarField ariaLabel="제목" value={m.title} placeholder="제목" maxLength={40} onChange={(title) => set({ title: title.slice(0, 40) })} />
        </div>
      )}
      <div>
        <Label>
          내용 <Badge color={t === 'SMS' ? 'gray' : t === 'LMS' ? 'brand' : 'purple'}>{t}</Badge>
        </Label>
        <VarField ariaLabel="내용" multi minHeight={240} value={m.body} maxLength={1000} placeholder={PH} onChange={(body) => set({ body })} />
        <small style={{ display: 'block', marginTop: 6, textAlign: 'right', fontSize: 12, color: 'var(--text-tertiary)' }}>{`${bytes(full(m)).toLocaleString('ko-KR')}/2000 byte`}</small>
      </div>
      <div>
        <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <Label style={{ margin: 0 }}>이미지</Label>
          <Button iconLeading="upload" onClick={() => file.current?.click()}>
            업로드
          </Button>
        </Row>
        {m.image && (
          <TextField readOnly value="업로드됨" trailing={<IconButton icon="close" size="xs" label="이미지 삭제" onClick={() => set({ image: '' })} />} />
        )}
        <input
          ref={file}
          hidden
          type="file"
          accept="image/jpg,image/jpeg"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) set({ image: URL.createObjectURL(f) });
          }}
        />
      </div>
    </>
  );
}

export const smsAsMsg = (m: M) => asMsg(m);
const asMsg = (m: M) => ({ type: typeOf(m), title: m.title || undefined, body: full(m), isAd: m.isAd, image: m.image || undefined }) as SmsMessage;

export default function SmsNewMessage({ recurring, copy, edit }: { recurring: boolean; copy?: SmsMessage; edit?: EditMode }) {
  return (
    <Shell<M>
      ch="sms"
      recurring={recurring}
      edit={edit}
      initial={initial}
      copy={copy && { campaign: copy.campaignName, target: copy.target, conversions: copy.conversions, ignoreCapping: copy.ignoreCapping, msg: { isAd: copy.isAd, title: copy.title ?? '', body: strip(copy.body), image: copy.image ?? '' } }}
      renderMsg={(m, set) => <SmsFields m={m} set={set} />}
      preview={(m, test) => (
        <PreviewCard>
          <header>미리보기</header>
          <SmsPreview m={asMsg(m)} />
          <Button full iconLeading="send" onClick={test}>
            테스트 발송
          </Button>
        </PreviewCard>
      )}
      test={(_, close) => <KakaoTestSend ch="sms" onClose={close} />}
      check={(m) => {
        if (!m.body.trim()) {
          window.alert('메시지 내용을 입력해 주세요.');
          return false;
        }
        const bad = [...`${m.title}${m.body}`].filter((c) => /[\u{1F300}-\u{1FAFF}]/u.test(c));
        if (bad.length) return window.confirm(`문자 메시지에서 사용할 수 없는 문자가 있습니다.\n내용: ${bad.join(' ')}\n* 해당 글자는 "?, �" 등으로 표시될 수 있습니다.\n\n발송하시겠습니까?`);
        return true;
      }}
      invisible={(m) => [m.title, m.body]}
      msgRows={(m) => [
        ['광고성 메시지', m.isAd ? 'TRUE' : 'FALSE'],
        ['내용', full(m)],
        ...(m.image ? ([['이미지', <img key="i" src={m.image} alt="" style={{ maxWidth: 160, borderRadius: 6 }} />]] as [string, ReactNode][]) : []),
      ]}
      build={(m, base) => ({ ...base, ...kakaoZero, ...asMsg(m) })}
    />
  );
}
