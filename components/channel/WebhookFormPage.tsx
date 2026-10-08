import { useState } from 'react';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import TextField from '@/components/ui/TextField';
import { Card, ChannelShell } from './ChannelShell';
import { WebhookForm, type Draft } from './WebhookEditor';
import { useStore } from '@/lib/store';
import { useLeaveGuard } from '@/lib/useLeaveGuard';
import type { Webhook } from '@/lib/webhooks';

// 새 웹훅 · 웹훅 수정 공용 — Figma 「채널 — 새 웹훅」(1322:1695). 머리 카드 = 이름 (필수) + 취소(Secondary) · 저장(Primary).
// 스테이징: 화면 검사 없음(이름 빈칸도 저장), 저장 → 상세, 취소 → 목록(수정 화면에서도). Key 와 Value 가 모두 있는 헤더 줄만 저장.
export default function WebhookFormPage({ initial }: { initial?: Webhook }) {
  const router = useRouter();
  const { saveWebhook } = useStore();
  const allow = useLeaveGuard();
  const [name, setName] = useState(initial?.name ?? '');
  const [draft, setDraft] = useState<Draft>(
    initial ? { method: initial.method, url: initial.url, headers: initial.headers, body: initial.body } : { method: 'GET', url: '', headers: [{ key: '', value: '' }], body: '' },
  );
  const save = () => {
    const id = initial?.id ?? `wh-${Date.now().toString(36)}`;
    saveWebhook({
      id,
      name,
      ...draft,
      headers: draft.headers.filter((h) => h.key && h.value),
      success30: initial?.success30 ?? 0,
      fail30: initial?.fail30 ?? 0,
      logs: initial?.logs ?? [],
    });
    allow();
    router.push(`/channel/webhook/${id}`);
  };
  return (
    <ChannelShell current="webhook" title={initial ? '웹훅 수정' : '새 웹훅'}>
      <Card>
        <div style={{ display: 'flex', gap: 8 }}>
          <TextField placeholder="이름 (필수)" value={name} onChange={(e) => setName(e.target.value)} />
          <Button
            onClick={() => {
              allow();
              router.push('/channel/webhook');
            }}
          >
            취소
          </Button>
          <Button hierarchy="primary" onClick={save}>
            저장
          </Button>
        </div>
        <WebhookForm draft={draft} onChange={setDraft} />
      </Card>
    </ChannelShell>
  );
}
