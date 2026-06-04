"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

/* 차트 색은 토큰(globals.css)에서 가져옴 — UI 네이비와 분리된 차트 전용 팔레트.
   메인=밝은 블루(--chart-1), 보조=앰버(--chart-2). */
const MAIN = "var(--chart-1)"; // 발송/신규 기기 등 메인
const ACCENT = "var(--chart-2)"; // 클릭 등 보조 (앰버)
const GRID = "#e4e4ea"; // gray-200
const AXIS = "#7a7a83"; // gray-500

const axisProps = {
  tick: { fontSize: 12, fill: AXIS },
  tickLine: false,
  axisLine: { stroke: GRID },
} as const;

/* 공통 툴팁 — 흰 카드 + gray-200 보더.
   recharts 가 active/payload/label 을 런타임에 주입하므로 로컬 타입으로 받음. */
type TooltipEntry = { name?: string; value?: number | string; color?: string };
function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-md border px-3 py-2 text-xs shadow-sm">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-title flex items-center gap-1.5">
          <span
            className="inline-block size-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto font-medium tabular-nums">
            {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
            {unit}
          </span>
        </p>
      ))}
    </div>
  );
}

const legendStyle = { fontSize: 12, color: AXIS } as const;

/* ── 섹션 2: 신규 등록 기기 (라인 + 영역) ─────────────── */
const NEW_DEVICES = [
  { d: "5/02", v: 210 }, { d: "5/03", v: 185 }, { d: "5/04", v: 240 },
  { d: "5/05", v: 262 }, { d: "5/06", v: 150 }, { d: "5/07", v: 132 },
  { d: "5/08", v: 290 }, { d: "5/09", v: 312 }, { d: "5/10", v: 276 },
  { d: "5/11", v: 331 }, { d: "5/12", v: 300 }, { d: "5/13", v: 162 },
  { d: "5/14", v: 144 }, { d: "5/15", v: 356 }, { d: "5/16", v: 340 },
  { d: "5/17", v: 322 }, { d: "5/18", v: 296 }, { d: "5/19", v: 361 },
  { d: "5/20", v: 182 }, { d: "5/21", v: 168 }, { d: "5/22", v: 311 },
  { d: "5/23", v: 336 }, { d: "5/24", v: 352 }, { d: "5/25", v: 301 },
  { d: "5/26", v: 287 }, { d: "5/27", v: 176 }, { d: "5/28", v: 158 },
  { d: "5/29", v: 346 },
];

export function NewDevicesChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={NEW_DEVICES} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id="newDevicesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={MAIN} stopOpacity={0.12} />
            <stop offset="100%" stopColor={MAIN} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="d" {...axisProps} interval={2} />
        <YAxis {...axisProps} width={48} />
        <Tooltip content={<ChartTooltip unit="대" />} />
        <Legend wrapperStyle={legendStyle} />
        <Area
          type="monotone"
          dataKey="v"
          name="새 기기"
          stroke={MAIN}
          strokeWidth={1}
          fill="url(#newDevicesFill)"
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── 섹션 3: 발송 & 클릭 (이중 y축 라인) ──────────────── */
const SEND_CLICK = [
  { d: "5/02", send: 18200, click: 920 }, { d: "5/03", send: 15400, click: 760 },
  { d: "5/04", send: 22600, click: 1180 }, { d: "5/05", send: 28800, click: 1520 },
  { d: "5/06", send: 12100, click: 640 }, { d: "5/07", send: 9800, click: 520 },
  { d: "5/08", send: 31200, click: 1740 }, { d: "5/09", send: 34500, click: 1980 },
  { d: "5/10", send: 26700, click: 1410 }, { d: "5/11", send: 37800, click: 2240 },
  { d: "5/12", send: 30100, click: 1660 }, { d: "5/13", send: 13400, click: 710 },
  { d: "5/14", send: 11200, click: 580 }, { d: "5/15", send: 39600, click: 2380 },
  { d: "5/16", send: 35200, click: 2010 }, { d: "5/17", send: 32800, click: 1820 },
  { d: "5/18", send: 27400, click: 1450 }, { d: "5/19", send: 40100, click: 2460 },
  { d: "5/20", send: 16800, click: 880 }, { d: "5/21", send: 14200, click: 690 },
  { d: "5/22", send: 30900, click: 1710 }, { d: "5/23", send: 34000, click: 1930 },
  { d: "5/24", send: 36500, click: 2120 }, { d: "5/25", send: 28300, click: 1490 },
  { d: "5/26", send: 25600, click: 1320 }, { d: "5/27", send: 15100, click: 770 },
  { d: "5/28", send: 12700, click: 620 }, { d: "5/29", send: 38200, click: 2300 },
];

export function SendClickChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={SEND_CLICK} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="d" {...axisProps} interval={2} />
        <YAxis
          yAxisId="left"
          {...axisProps}
          width={52}
          tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          {...axisProps}
          width={44}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={legendStyle} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="send"
          name="발송"
          stroke={MAIN}
          strokeWidth={1}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="click"
          name="클릭"
          stroke={ACCENT}
          strokeWidth={1}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── 섹션 4: 발송 시간대별 평균 클릭률 (막대) ──────────── */
const HOURLY_CTR = [
  8, 6, 5, 4, 5, 7, 12, 20, 30, 42, 51, 55, 48, 52, 58, 60, 57, 50, 44, 35, 28,
  22, 16, 11,
].map((ctr, hour) => ({ hour: `${hour}`, ctr }));

export function HourlyCtrChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={HOURLY_CTR} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="hour" {...axisProps} interval={0} />
        <YAxis
          {...axisProps}
          width={44}
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
          content={<ChartTooltip unit="%" />}
        />
        <Bar dataKey="ctr" name="평균 클릭률" fill={MAIN} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
