import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { KpiRecord, Unit } from "@/types";
import { rag } from "@/lib/colors";
import { formatValue } from "@/lib/format";
import { CURRENT_PERIOD } from "@/config";
import type { Lang } from "@/i18n";

/**
 * Frequency-correct trend (KPI detail). The x-axis and point cadence are driven
 * by the indicator's Frequency — NEVER fabricated week numbers:
 *  • Daily   → a ~30-day daily line (the 8 anchor points are densified to 30
 *    days with a tiny deterministic wobble) labelled by date.
 *  • Monthly → one point per month, labelled with MONTH names (Jan, Feb, …).
 * Annual / half-yearly / twice-a-year indicators are NOT charted here — the KPI
 * detail shows a snapshot + cycle delta for those (no fabricated trend line).
 * The Y-axis uses nice, ascending, evenly-spaced rounded ticks with a domain
 * that fits the data (so a flat 88–92% line doesn't float on a 0–100 scale).
 */

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_GU = ["જાન્યુ", "ફેબ્રુ", "માર્ચ", "એપ્રિલ", "મે", "જૂન", "જુલાઈ", "ઑગસ્ટ", "સપ્ટે", "ઑક્ટો", "નવે", "ડિસે"];

export function TrendChart({ record, lang = "en", height = 220 }: { record: KpiRecord; lang?: Lang; height?: number }) {
  const color = rag(record.status).hex;
  const unit: Unit = record.kpi.unit;
  const months = lang === "gu" ? MONTHS_GU : MONTHS_EN;
  const freq = record.kpi.frequency ?? "Daily";
  const isMonthly = freq === "Monthly";
  const anchor = new Date(CURRENT_PERIOD().weekStart);
  const avgLabel = lang === "gu" ? "સરેરાશ" : "Avg";

  const values = record.series.map((s) => s.value);
  const data = isMonthly
    ? values.map((value, i) => {
        const d = new Date(anchor);
        d.setMonth(anchor.getMonth() - (values.length - 1 - i));
        return { x: months[(d.getMonth() + 12) % 12], value };
      })
    : densifyDaily(values, 30).map((value, i, arr) => {
        const d = new Date(anchor);
        d.setDate(anchor.getDate() - (arr.length - 1 - i));
        return { x: `${d.getDate()} ${months[d.getMonth()]}`, value };
      });

  const axisVals = [...values, ...(record.benchmark != null ? [record.benchmark] : [])];
  const { domain, ticks } = niceAxis(axisVals, unit);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
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
          interval={isMonthly ? 0 : "preserveStartEnd"}
          minTickGap={isMonthly ? 0 : 28}
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
        {record.benchmark != null && (
          <ReferenceLine
            y={record.benchmark}
            stroke="#7383A5"
            strokeDasharray="4 4"
            label={{ value: `${avgLabel} ${formatValue(record.benchmark, unit, lang)}`, position: "insideTopLeft", fontSize: 10, fill: "#7383A5" }}
          />
        )}
        <Tooltip
          formatter={(v: number) => [formatValue(v, unit, lang), ""]}
          labelFormatter={(l) => String(l)}
          contentStyle={{ borderRadius: 12, border: "1px solid #E2E6EE", fontSize: 12, boxShadow: "0 8px 28px rgba(16,37,74,.12)" }}
        />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill="url(#tc-fill)" dot={isMonthly ? { r: 3, fill: color } : false} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Linear-interpolate the anchor points to `target` daily samples with a tiny
 *  deterministic wobble, so a daily metric reads as daily (not a smooth ramp). */
function densifyDaily(values: number[], target: number): number[] {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return [];
  if (nums.length >= target) return nums.slice(-target);
  if (nums.length === 1) return Array.from({ length: target }, () => nums[0]);
  const out: number[] = [];
  const n = nums.length;
  for (let i = 0; i < target; i++) {
    const t = (i / (target - 1)) * (n - 1);
    const lo = Math.floor(t), hi = Math.ceil(t), f = t - lo;
    const base = nums[lo] + (nums[hi] - nums[lo]) * f;
    const seed = Math.sin((i + 1) * 12.9898) * 43758.5453;
    const wobble = (seed - Math.floor(seed) - 0.5) * (Math.abs(base) * 0.012 + 0.25);
    out.push(Math.round(Math.max(0, base + wobble) * 100) / 100);
  }
  return out;
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
  lo = Math.max(0, lo);
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
