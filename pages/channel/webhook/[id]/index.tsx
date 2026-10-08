import { useState } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import { ButtonTabs } from '@/components/ui/Tabs';
import TextField from '@/components/ui/TextField';
import { Card, ChannelShell } from '@/components/channel/ChannelShell';
import { Vars, WebhookView } from '@/components/channel/WebhookEditor';
import { customVars } from '@/lib/liquid';
import { useStore } from '@/lib/store';
import { requestText, responseText, type SendLog } from '@/lib/webhooks';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';

// Figma 「채널 — 웹훅 상세 (테스트 발송 · 기록 상세 펼침)」(1324:2) 모양 + docs/staging-behavior-channel.md 「웹훅 상세」 동작.
// 테스트 발송은 처음 접힘(스테이징), 기록 상세 패널은 행을 눌러야 열림. 삭제 → 확인창 → 목록, 토스트 없음.
type Tab = 'all' | 'success' | 'failure' | 'test';
const PER = 10;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  > h3 { flex: 1; min-width: 0; margin: 0; ${text('text-lg', 'semibold')}; color: ${color('text-primary')}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

const Fold = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  text-align: left;
  cursor: pointer;
  > b { flex: 1; ${text('text-md', 'semibold')}; color: ${color('text-primary')}; }
  > span { display: inline-flex; color: ${color('fg-quaternary')}; transition: transform 0.2s ease-out; }
`;

const Body = styled.div`
  display: grid;
  grid-template-columns: 400px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
`;

const List = styled.div`
  border: 1px solid ${color('border-secondary')};
  border-radius: ${radius.xl}px;
  overflow: hidden;
`;

const Row = styled.div<{ $head?: boolean; $on?: boolean }>`
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  & + & { border-top: 1px solid ${color('border-secondary')}; }
  background: ${(p) => (p.$on ? color('bg-secondary') : 'transparent')};
  cursor: ${(p) => (p.$head ? 'default' : 'pointer')};
  transition: background-color 0.1s linear;
  ${(p) => (p.$head ? '' : `&:hover { background: ${color('bg-secondary')}; }`)}
  > div { display: flex; align-items: center; height: ${(p) => (p.$head ? 40 : 63)}px; padding: 0 16px; }
  > div { ${(p) => (p.$head ? text('text-xs', 'semibold') : text('text-sm', 'medium'))}; color: ${(p) => (p.$head ? color('text-quaternary') : color('text-primary'))}; font-variant-numeric: tabular-nums; }
`;

const Detail = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  > small { ${text('text-xs', 'medium')}; color: ${color('text-tertiary')}; word-break: break-all; }
  > h5 { margin: 0; ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; }
  > pre { margin: 0; padding: 12px; border-radius: ${radius.md}px; background: ${color('bg-secondary')}; ${text('text-sm', 'regular')}; font-family: inherit; color: ${color('text-primary')}; white-space: pre-wrap; word-break: break-all; }
`;

const DataRow = styled.div`
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  > span { ${text('text-sm', 'medium')}; color: ${color('text-secondary')}; overflow: hidden; text-overflow: ellipsis; }
`;

export default function WebhookDetail() {
  const router = useRouter();
  const { webhooks, deleteWebhook, saveWebhook } = useStore();
  const w = webhooks.find((x) => x.id === router.query.id);
  const [testOpen, setTestOpen] = useState(false);
  const [subject, setSubject] = useState<'user' | 'device'>('user');
  const [subjectId, setSubjectId] = useState('');
  const [data, setData] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<Tab>('all');
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState<SendLog | null>(null);

  if (!router.isReady) return null;
  if (!w)
    return (
      <ChannelShell current="webhook" title="웹훅 상세 정보">
        <Card>데이터가 없습니다</Card>
      </ChannelShell>
    );

  const extra = customVars(w.url, ...w.headers.flatMap((h) => [h.key, h.value]), w.body);
  const logs = w.logs.filter((l) => (tab === 'success' ? l.ok : tab === 'failure' ? !l.ok : tab === 'test' ? l.test : true));
  const rows = logs.slice((page - 1) * PER, page * PER);
  const go = (t: Tab) => {
    setTab(t);
    setPage(1);
    setPicked(null);
  };

  return (
    <ChannelShell current="webhook" title="웹훅 상세 정보">
      <Card>
        <Head>
          <IconButton icon="arrow_back" label="뒤로" onClick={() => router.push('/channel/webhook')} />
          <h3>{w.name}</h3>
          <Button
            hierarchy="destructive-tertiary"
            onClick={() => {
              if (!window.confirm('정말 삭제하시겠습니까?')) return;
              deleteWebhook(w.id);
              router.push('/channel/webhook');
            }}
          >
            삭제
          </Button>
          <Button hierarchy="primary" onClick={() => router.push(`/channel/webhook/${w.id}/edit`)}>
            수정
          </Button>
        </Head>
        <WebhookView draft={w} />
      </Card>

      <Card>
        <Fold type="button" aria-expanded={testOpen} onClick={() => setTestOpen((v) => !v)}>
          <b>테스트 발송</b>
          <span style={{ transform: testOpen ? 'rotate(180deg)' : 'none' }}>
            <Icon name="keyboard_arrow_down" size={20} />
          </span>
        </Fold>
        {testOpen && (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <Select<'user' | 'device'>
                width={140}
                value={subject}
                options={[
                  { value: 'user', label: 'USER ID' },
                  { value: 'device', label: 'DEVICE ID' },
                ]}
                onChange={(v) => {
                  setSubject(v);
                  setSubjectId('');
                }}
              />
              <TextField aria-label={subject === 'user' ? 'USER ID' : 'DEVICE ID'} placeholder={subject === 'user' ? '유저 ID 입력' : '기기 ID 입력'} value={subjectId} onChange={(e) => setSubjectId(e.target.value)} />
              <Button
                hierarchy="primary"
                disabled={sending}
                onClick={() => {
                  // 스테이징: 화면 검사 없음 → 기록이 생길 때까지 확인 → 기록 탭을 「테스트 발송」 1페이지로
                  setSending(true);
                  setTimeout(() => {
                    const d = new Date();
                    const p = (n: number) => String(n).padStart(2, '0');
                    const log: SendLog = {
                      id: `l${Date.now()}`,
                      ok: !!subjectId,
                      test: true,
                      at: `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`,
                      requestId: crypto.randomUUID(),
                      response: '{}',
                    };
                    saveWebhook({ ...w, logs: [log, ...w.logs], success30: w.success30 + (log.ok ? 1 : 0), fail30: w.fail30 + (log.ok ? 0 : 1) });
                    setSending(false);
                    go('test');
                  }, 1200);
                }}
              >
                {sending ? '발송 중' : '발송'}
              </Button>
            </div>
            {extra.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>DATA</span>
                {extra.map((k) => (
                  <DataRow key={k}>
                    <span>{k}</span>
                    <TextField value={data[k] ?? ''} onChange={(e) => setData({ ...data, [k]: e.target.value })} />
                  </DataRow>
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <ButtonTabs<Tab>
            items={[
              { value: 'all', label: '전체' },
              { value: 'success', label: '발송 성공' },
              { value: 'failure', label: '발송 실패' },
              { value: 'test', label: '테스트 발송' },
            ]}
            value={tab}
            onChange={go}
          />
          <IconButton icon="refresh" hierarchy="secondary" label="새로고침" onClick={() => setPicked(null)} />
        </div>
        <Body>
          <List>
            <Row $head>
              <div>발송 여부</div>
              <div>발송 날짜</div>
            </Row>
            {rows.map((l) => (
              <Row key={l.id} $on={picked?.id === l.id} onClick={() => setPicked(l)}>
                <div>
                  <Badge color={l.ok ? 'success' : 'error'}>{l.ok ? '발송 성공' : '발송 실패'}</Badge>
                </div>
                <div>{l.at}</div>
              </Row>
            ))}
            <Pagination page={page} pages={Math.min(500, Math.ceil(logs.length / PER))} onChange={setPage} />
          </List>
          {picked && (
            <Detail>
              <small>{`REQUEST ID: ${picked.requestId}`}</small>
              <h5>RESPONSE</h5>
              <pre>{responseText(picked)}</pre>
              <h5>REQUEST</h5>
              <pre>
                <Vars s={requestText(w)} />
              </pre>
            </Detail>
          )}
        </Body>
      </Card>
    </ChannelShell>
  );
}
