import type { KpiRecord, Level } from "@/types";
import { deltaToneClass } from "@/lib/colors";
import { formatValue } from "@/lib/format";
import { peerAvg, peerLevelOf } from "@/lib/peer";
import { buildTrend, getLastUpdatedLabel } from "@/lib/trend";
import { useKpiMetrics } from "@/hooks";
import { useT, type Lang } from "@/i18n";
import { FrequencyDelta } from "./FrequencyDelta";
import { KpiCardShell, KpiCardHeader, KpiMetricRow, KpiSourceLine } from "./kpiCardParts";
import { KpiCard } from "./KpiCard";

/**
 * Multi-metric indicator card (SAT1/SAT2/ORF/CET/CGMS) — a compact, graph-free score
 * table on the shared KPI-card shell. Each metric is one `KpiMetricRow` (label, then
 * value · N+1 · delta in three aligned columns), divided by hairlines, with one muted
 * source line at the foot. No sparklines (charts live on the KPI detail page). Lower-
 * is-better metrics (e.g. "Below hierarchy avg") still go green when they fall.
 */
export function MultiMetricKpiCard({
  rec, metrics, name, onClick, lang = "en", level, parentName,
}: {
  rec: KpiRecord;
  metrics: KpiRecord[];
  name: string;
  onClick?: () => void;
  lang?: Lang;
  level?: Level;
  parentName?: string;
}) {
  const { t } = useT();
  const kpi = rec.kpi;
  const lastUpdated = getLastUpdatedLabel(kpi, new Date(), lang);

  return (
    <KpiCardShell onClick={onClick}>
      <KpiCardHeader title={name} frequency={kpi.frequency} context={lastUpdated} />

      <div className="mt-2 divide-y divide-line/60">
        {metrics.length ? (
          metrics.map((m) => <MetricRow key={m.kpi.id} rec={m} level={level} parentName={parentName} lang={lang} />)
        ) : (
          <span className="block py-2 text-2xs text-neutral-400">{t("common.notTracked")}</span>
        )}
      </div>

      <KpiSourceLine label={t("common.source")} source={kpi.data_source} />
    </KpiCardShell>
  );
}

/** Computes one metric's value/N+1/delta and renders it through the shared row. */
function MetricRow({
  rec, level, parentName, lang,
}: { rec: KpiRecord; level?: Level; parentName?: string; lang: Lang }) {
  const { tn } = useT();
  const kpi = rec.kpi;
  const na = rec.value == null;
  const trend = na ? null : buildTrend(rec, lang);
  const delta = trend?.delta ?? null;
  const peer = level && peerLevelOf(level) ? peerAvg(kpi.id, level) : null;
  const tone = na ? "text-rag-naText" : delta ? deltaToneClass(delta, kpi.direction) : "text-neutral-900";

  return (
    <KpiMetricRow
      label={tn(kpi.name, kpi.name_gu)}
      value={na ? "—" : formatValue(rec.value, kpi.unit, lang)}
      valueTone={tone}
      parentLabel={parentName && peer != null ? `${parentName} · ${formatValue(peer, kpi.unit, lang)}` : null}
      delta={delta != null && delta !== 0 ? (
        <FrequencyDelta delta={delta} unit={kpi.unit} direction={kpi.direction} cadence={trend!.cadence} lang={lang} />
      ) : null}
    />
  );
}

/**
 * Selector used wherever a KPI tile is rendered: a multi-metric indicator (kpi.metrics)
 * renders the MultiMetricKpiCard with its provider-driven sub-metric records; everything
 * else falls back to the standard single-value KpiCard. The hook is always called (with
 * an undefined id for single-metric KPIs) so hook order stays stable.
 */
export function KpiCardAuto({
  rec, name, onClick, lang = "en", level, parentName, currentId,
}: {
  rec: KpiRecord;
  name: string;
  onClick?: () => void;
  lang?: Lang;
  level?: Level;
  parentName?: string;
  currentId?: string | null;
}) {
  const isMulti = !!rec.kpi.metrics?.length;
  const metrics = useKpiMetrics(isMulti ? rec.kpi.id : undefined, currentId);
  if (isMulti && metrics.length) {
    return <MultiMetricKpiCard rec={rec} metrics={metrics} name={name} onClick={onClick} lang={lang} level={level} parentName={parentName} />;
  }
  return <KpiCard rec={rec} name={name} onClick={onClick} lang={lang} level={level} parentName={parentName} />;
}
