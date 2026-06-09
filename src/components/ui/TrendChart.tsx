import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Unit } from "@/types";
import type { Cadence } from "@/lib/trend";
import { formatValue } from "@/lib/format";
import type { Lang } from "@/i18n";

/**
 * Frequency-correct trend (KPI detail). Renders the cadence-appropriate point
 * series from `buildTrend` — daily 30-day line, or 5–6 month/cycle/half-year/
 * year points — with month/cycle/year x-labels (never fabricated weeks). The
 * Y-axis uses nice, ascending, evenly-spaced rounded ticks fitted to the data.
 */
export function TrendChart({
  points, unit, benchmark = null, color, cadence, lang = "en", height = 220,
}: {
  points: { x: string; value: number }[];
  unit: Unit;
  benchmark?: number | null;
  color: string;
  cadence: Cadence;
  lang?: Lang;
  height?: number;
}) {
  const isDaily = cadence === "daily";
  const avgLabel = lang === "gu" ? "સરેરાશ" : "Avg";
  const axisVals = [...points.map((p) => p.value), ...(benchmark != null ? [benchmark] : [])];
  const { domain, ticks } = niceAxis(axisVals, unit);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 8, right: 26, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="tc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.24} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" vertical={false} />
        <XAxis
          dataKey="x"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#828996" }}
          interval={isDaily ? "preserveStartEnd" : 0}
          minTickGap={isDaily ? 28 : 0}
          padding={isDaily ? undefined : { right: 8 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#828996" }}
          width={44}
          domain={domain}
          ticks={ticks}
          tickFormatter={(v: number) => trimNum(v)}
        />
        {benchmark != null && (
          <ReferenceLine
            y={benchmark}
            stroke="#7383A5"
            strokeDasharray="4 4"
            label={{ value: `${avgLabel} ${formatValue(benchmark, unit, lang)}`, position: "insideTopLeft", fontSize: 10, fill: "#7383A5" }}
          />
        )}
        <Tooltip
          formatter={(v: number) => [formatValue(v, unit, lang), ""]}
          labelFormatter={(l) => String(l)}
          contentStyle={{ borderRadius: 12, border: "1px solid #E2E6EE", fontSize: 12, boxShadow: "0 8px 28px rgba(16,37,74,.12)" }}
        />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill="url(#tc-fill)" dot={isDaily ? false : { r: 3, fill: color }} activeDot={{ r: 5 }} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function niceStep(raw: number): number {
  if (!(raw > 0)) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return nice * mag;
}

/** Ascending, evenly-spaced, rounded ticks with a domain that fits the data. */
function niceAxis(values: number[], unit: Unit): { domain: [number, number]; ticks: number[] } {
  const nums = values.filter((v) => Number.isFinite(v));
  if (!nums.length) return { domain: [0, 1], ticks: [0, 1] };
  let lo = Math.min(...nums);
  let hi = Math.max(...nums);
  if (lo === hi) { const pad = Math.max(unit === "%" ? 2 : Math.abs(hi) * 0.1, 1); lo -= pad; hi += pad; }
  const pad = (hi - lo) * 0.15;
  lo -= pad; hi += pad;
  if (lo > 0) lo = Math.max(0, lo);
  if (unit === "%") hi = Math.min(100, hi);
  const step = niceStep((hi - lo) / 4);
  const min = Math.floor(lo / step) * step;
  const max = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = min; v <= max + step * 0.001; v += step) ticks.push(Math.round(v * 100) / 100);
  return { domain: [min, max], ticks };
}

function trimNum(v: number): string {
  return (Math.round(v * 100) / 100).toString();
}
