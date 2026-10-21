import { useRef, useState, type ReactNode } from 'react';
import styled from '@emotion/styled';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Floating from '@/components/ui/Floating';
import { MenuItem } from '@/components/ui/Menu';
import { Dialog } from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import TextField from '@/components/ui/TextField';
import { Help } from '@/components/channel/ChannelShell';
import DataTable from '@/components/channel/DataTable';
import { EmptyList, PageTitle } from '@/components/sent/SentList';
import { InfoChip, Json, sortedJson } from './parts';
import { devices, PLATFORM_ICON, type Device } from '@/lib/audience';
import { useStore } from '@/lib/store';
import { color, radius } from '@/styles/tokens';
import { text } from '@/styles/typography';

// 전체 기기 · 테스트 기기 · 세그먼트 기기 — Figma 「전체 기기」(973:36322) · 「테스트 기기」(1107:61117) + docs/staging-behavior-users-devices.md 3 · 4장.
// 쿼리 없음(쪽 · 검색은 화면 상태), 페이지당 20, 행 클릭 동작 없음. 테스트 기기 추가 · 제거 · 별명 = 토스트 「성공적으로 반영되었습니다.」 + 그 행 강조.
const PER = 20;
type Mode = 'all' | 'test' | 'segment';

const Plat = styled.span`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  > span { display: inline-flex; color: ${color('fg-secondary')}; }
  > div { display: flex; flex-direction: column; min-width: 0; }
  > div > small { ${text('text-sm', 'regular')}; color: ${color('text-tertiary')}; }
`;

const Mark = styled.span<{ $on: boolean }>`
  display: inline-flex;
  color: ${(p) => (p.$on ? color('fg-success-secondary') : color('fg-quaternary'))};
  opacity: ${(p) => (p.$on ? 1 : 0.5)};
`;

const More = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: ${radius.md}px;
  background: transparent;
  color: ${color('fg-quaternary')};
  cursor: pointer;
  &:hover { background: ${color('bg-primary_hover')}; }
`;

const Label = styled.span`
  display: block;
  ${text('text-sm', 'medium')};
  color: ${color('text-secondary')};
  margin-bottom: 6px;
`;

const HELP = {
  platform: '기기 모델명과 운영체제 버전을 나타냅니다.',
  created: '기기가 최초 생성된 시간입니다.',
  last: '기기가 마지막으로 접속한 시간입니다.',
  user: (
    <>
      고객사가 관리하는 고유한 유저ID입니다. 자세한 내용은{' '}
      <a href="https://docs.flarelane.co.kr/data-integration" target="_blank" rel="noreferrer">
        고객 데이터 연동 가이드
      </a>
      를 참고하세요.
    </>
  ),
  test: (
    <>
      사내 테스트 발송을 위한{' '}
      <a href="https://docs.flarelane.co.kr/test-device" target="_blank" rel="noreferrer">
        테스트 기기
      </a>{' '}
      등록 여부를 나타냅니다.
    </>
  ),
  sub: '기기가 현재 푸시 알림을 수신할 수 있는 상태입니다.',
  alias: '테스트 기기를 식별하기 위한 별명입니다.',
};
const H = ({ label, help }: { label: string; help: ReactNode }) => (
  <>
    {label}
    <Help>{help}</Help>
  </>
);

function RowMenu({ d, mode, onAlias, onRemove }: { d: Device; mode: Mode; onAlias: () => void; onRemove: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <More ref={ref} type="button" aria-label="더 보기" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Icon name="more_horiz" size={20} />
      </More>
      <Floating anchorRef={ref} open={open} onClose={() => setOpen(false)} width={160} offset={4}>
        <div style={{ padding: '4px 0' }}>
          {mode === 'test' && d.isTest && <MenuItem label="별명 설정" onClick={() => { setOpen(false); onAlias(); }} />}
          {mode !== 'test' && !d.isTest && <MenuItem label="테스트 기기 추가" onClick={() => { setOpen(false); onAlias(); }} />}
          {d.isTest && <MenuItem label="테스트 기기 제거" destructive onClick={() => { setOpen(false); onRemove(); }} />}
        </div>
      </Floating>
    </>
  );
}

function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (ids: string[]) => void }) {
  const [by, setBy] = useState<'user' | 'id'>('user');
  const [q, setQ] = useState('');
  const [result, setResult] = useState<Device[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  return (
    <Dialog
      title="테스트 기기 추가"
      width={640}
      onClose={onClose}
      footer={
        <>
          <Button size="md" onClick={onClose}>취소</Button>
          <Button hierarchy="primary" size="md" disabled={!picked.length} onClick={() => onAdd(picked)}>
            추가
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 8 }}>
        <Select<'user' | 'id'> width={120} value={by} options={[{ value: 'user', label: '유저 ID' }, { value: 'id', label: '기기 ID' }]} onChange={setBy} />
        <TextField value={q} onChange={(e) => setQ(e.target.value)} />
        <Button
          onClick={() => {
            const t = q.trim();
            if (!t) return;
            setResult(devices.filter((d) => (by === 'user' ? d.userId === t : d.id === t)));
          }}
        >
          검색
        </Button>
      </div>
      <DataTable
        columns={[
          { label: '', width: '48px' },
          { label: '플랫폼', width: '200px' },
          { label: '마지막 접속 시간', width: '180px' },
          { label: '', width: 'minmax(0,1fr)' },
        ]}
        rows={result.map((d) => ({
          key: d.id,
          onClick: d.isTest ? undefined : () => setPicked((l) => (l.includes(d.id) ? l.filter((x) => x !== d.id) : [...l, d.id])),
          sub: d.isTest,
          cells: [
            <Checkbox key="c" checked={d.isTest || picked.includes(d.id)} disabled={d.isTest} />,
            `${d.deviceModel}${d.browser ? ` (${d.browser})` : ''}`,
            d.lastActiveAt,
            <span key="m" style={{ display: 'flex', gap: 4, overflow: 'hidden' }}>
              <InfoChip label="ID" tip={d.id} />
              <InfoChip label="태그" tip={<pre style={{ margin: 0, font: 'inherit' }}>{sortedJson(d.tags)}</pre>} />
            </span>,
          ],
        }))}
        empty={<EmptyList />}
      />
    </Dialog>
  );
}

export default function DeviceList({ mode, title, pool }: { mode: Mode; title: string; pool?: Device[] }) {
  const { toast } = useStore();
  const [page, setPage] = useState(1);
  const [by, setBy] = useState<'user' | 'id'>('user');
  const [input, setInput] = useState('');
  const [q, setQ] = useState<{ by: 'user' | 'id'; v: string } | null>(null);
  const [alias, setAlias] = useState<Device | null>(null);
  const [aliasText, setAliasText] = useState('');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  const [, force] = useState(0);
  const [tagsOf, setTagsOf] = useState<Device | null>(null);

  const base = pool ?? devices;
  const list = (mode === 'test' ? base.filter((d) => d.isTest || added.includes(d.id)) : base).filter((d) => !q || (q.by === 'user' ? d.userId === q.v : d.id === q.v));
  const rows = list.slice((page - 1) * PER, page * PER);
  const mark = (ids: string[]) => {
    setAdded((l) => [...new Set([...ids, ...l])]);
    toast('성공적으로 반영되었습니다.');
    force((n) => n + 1);
  };
  const search = () => {
    const t = input.trim();
    if (!t) {
      setBy('user');
      setQ(null);
      setPage(1);
      return;
    }
    setQ({ by, v: t });
    setPage(1);
  };

  const columns = [
    ...(mode === 'test' ? [{ label: <H label="별명" help={HELP.alias} />, width: '88px' }] : []),
    { label: <H label="플랫폼" help={HELP.platform} />, width: mode === 'test' ? '156px' : '176px' },
    { label: <H label="생성 시간" help={HELP.created} />, width: '156px' },
    { label: <H label="마지막 접속 시간" help={HELP.last} />, width: '156px' },
    { label: <H label="유저 ID" help={HELP.user} />, width: '100px' },
    { label: <H label="테스트 기기" help={HELP.test} />, width: '104px', align: 'center' as const },
    { label: <H label="구독" help={HELP.sub} />, width: '68px', align: 'center' as const },
    { label: '', width: 'minmax(0,1fr)' },
    { label: '', width: '48px' },
  ];

  return (
    <>
      <PageTitle>
        <h1>{title}</h1>
        <i />
        {mode === 'test' ? (
          <Button hierarchy="primary" size="md" iconLeading="add" onClick={() => setAdding(true)}>
            추가
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Select<'user' | 'id'> width={140} value={by} options={[{ value: 'user', label: '유저 ID' }, { value: 'id', label: '기기 ID' }]} onChange={setBy} />
            <div style={{ width: 240 }}>
              <TextField
                placeholder="검색어 입력"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                trailing={
                  input ? (
                    <button type="button" aria-label="지우기" style={{ display: 'inline-flex', padding: 0, border: 0, background: 'none', color: 'var(--fg-quaternary)', cursor: 'pointer' }} onClick={() => { setInput(''); setBy('user'); setQ(null); setPage(1); }}>
                      <Icon name="close" size={16} />
                    </button>
                  ) : undefined
                }
              />
            </div>
            <Button hierarchy="primary" onClick={search}>
              검색
            </Button>
          </div>
        )}
      </PageTitle>
      <DataTable
        card
        compact
        columns={columns}
        rows={rows.map((d) => ({
          key: d.id,
          added: added.includes(d.id),
          cells: [
            ...(mode === 'test' ? [<span key="a" style={{ color: 'var(--text-brand-secondary)' }}>{d.testName ?? ''}</span>] : []),
            <Plat key="p">
              <span>
                <Icon name={PLATFORM_ICON[d.platform]} size={20} />
              </span>
              <div>
                {`${d.deviceModel} (${d.osVersion})`}
                <small>{d.browser ?? 'App'}</small>
              </div>
            </Plat>,
            d.createdAt,
            d.lastActiveAt,
            d.userId ?? '-',
            <Mark key="t" $on={d.isTest}>
              <Icon name="check" size={20} />
            </Mark>,
            <Mark key="s" $on={d.isSubscribed}>
              <Icon name="check" size={20} />
            </Mark>,
            <span key="m" style={{ display: 'flex', gap: 4, overflow: 'hidden' }}>
              <InfoChip label="ID" tip={d.id} />
              <InfoChip label="태그" tip={<pre style={{ margin: 0, font: 'inherit', whiteSpace: 'pre-wrap' }}>{sortedJson(d.tags)}</pre>} onClick={() => setTagsOf(d)} />
              {d.appVersion && <InfoChip label="앱" tip={d.appVersion} />}
              {d.sdkVersion && <InfoChip label="SDK" tip={d.sdkVersion} />}
              {(d.countryCode || d.languageCode || d.timeZone) && (
                <InfoChip
                  label="Locale"
                  tip={
                    <span style={{ whiteSpace: 'pre-line' }}>{[d.countryCode && `국가: ${d.countryCode}`, d.languageCode && `언어: ${d.languageCode.split('-')[0]}`, d.timeZone && `시간대: ${d.timeZone}`].filter(Boolean).join('\n')}</span>
                  }
                />
              )}
            </span>,
            <RowMenu
              key="mm"
              d={d}
              mode={mode}
              onAlias={() => {
                setAlias(d);
                setAliasText('');
              }}
              onRemove={() => {
                d.isTest = false;
                d.testName = null;
                mark([d.id]);
              }}
            />,
          ],
        }))}
        empty={<EmptyList />}
        footer={list.length > 0 && <Pagination page={page} pages={Math.min(500, Math.ceil(list.length / PER))} onChange={setPage} />}
      />
      {alias && (
        <Dialog
          title="테스트 기기 별명"
          onClose={() => setAlias(null)}
          footer={
            <>
              <Button size="md" onClick={() => setAlias(null)}>취소</Button>
              <Button
                hierarchy="primary"
                size="md"
                onClick={() => {
                  alias.isTest = true;
                  alias.testName = aliasText || null;
                  mark([alias.id]);
                  setAlias(null);
                }}
              >
                확인
              </Button>
            </>
          }
        >
          <div>
            <Label>기기 ID</Label>
            <span style={{ fontSize: 14, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{alias.id}</span>
          </div>
          <div>
            <Label>별명</Label>
            <TextField autoFocus placeholder="별명 입력" value={aliasText} onChange={(e) => setAliasText(e.target.value)} />
          </div>
        </Dialog>
      )}
      {adding && (
        <AddModal
          onClose={() => setAdding(false)}
          onAdd={(ids) => {
            ids.forEach((id) => {
              const d = devices.find((x) => x.id === id);
              if (d) {
                d.isTest = true;
                d.testName = null;
              }
            });
            mark(ids);
            setAdding(false);
          }}
        />
      )}
      {tagsOf && (
        <Dialog title="태그" onClose={() => setTagsOf(null)}>
          <Json style={{ height: 500 }}>{sortedJson(tagsOf.tags)}</Json>
        </Dialog>
      )}
    </>
  );
}
