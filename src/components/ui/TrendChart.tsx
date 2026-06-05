import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { KpiRecord, Unit } from "@/types";
import { rag } from "@/lib/colors";
import { formatValue } from "@/lib/format";
import type { Lang } from "@/i18n";

/** Full weekly trend line for the KPI detail, with the benchmark reference. */
export function TrendChart({ record, lang = "en", height = 220 }: { record: KpiRecord; lang?: Lang; height?: number }) {
  const color = rag(record.status).hex;
  const data = record.series.map((s) => ({ period: s.period.replace(/^\d+-/, ""), value: s.value }));
  const unit: Unit = record.kpi.unit;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="tc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" vertical={false} />
        <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#828996" }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#828996" }} width={40} />
        {record.benchmark != null && (
          <ReferenceLine
            y={record.benchmark}
            stroke="#7383A5"
            strokeDasharray="4 4"
            label={{ value: `${formatValue(record.benchmark, unit, lang)}`, position: "right", fontSize: 10, fill: "#7383A5" }}
          />
        )}
        <Tooltip
          formatter={(v: number) => [formatValue(v, unit, lang), ""]}
          labelFormatter={(l) => `${lang === "gu" ? "અઠવાડિયું" : "Week"} ${l}`}
          contentStyle={{ borderRadius: 12, border: "1px solid #E2E6EE", fontSize: 12, boxShadow: "0 8px 28px rgba(16,37,74,.12)" }}
        />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill="url(#tc-fill)" dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
