import type { KpiRecord, Level } from "@/types";
import { valueToneClass } from "@/lib/colors";
import { peerAvg, peerLevelOf } from "@/lib/peer";
import { buildTrend, getLastUpdatedLabel } from "@/lib/trend";
import { getSingleMetricValueSuffix, formatValue } from "@/lib/format";
import { shouldShowCardDelta, displayFrequency } from "@/lib/displayPolicy";
import { useT, type Lang } from "@/i18n";
import { FrequencyDelta } from "./FrequencyDelta";
import { KpiCardShell, KpiCardHeader, KpiInlineRow } from "./kpiCardParts";
import { KpiCompareSection } from "./KpiCompareSection";

/**
 * Single-metric KPI tile — compact, graph-free: header (title + frequency·date
 * chip) · one inline value row with the N+1 peer comparison (+ allowed delta)
 * right-aligned. The value row never repeats the card title: a count KPI shows a
 * short unit-noun suffix ("4.7K students absent"); percent/score/visit cards show
 * just the bare value ("96.3%", "1.8"). Shares the same `KpiInlineRow` grammar as
 * multi-metric cards so single/multi cards align across the grid. No source, no
 * metric-type labels, no "Parent avg". Date context lives in the header chip only.
 */
export function KpiCard({
  rec, name, onClick, lang = "en", level, parentName,
}: { rec: KpiRecord; name: string; onClick?: () => void; lang?: Lang; level?: Level; parentName?: string }) {
  const { t } = useT();
  const kpi = rec.kpi;
  const na = rec.value == null;
  const showDelta = !na && shouldShowCardDelta(kpi);
  const trend = showDelta ? buildTrend(rec, lang) : null;
  const peerScore = level && peerLevelOf(level) ? peerAvg(kpi.id, level) : null;
  const isGsqac = kpi.id.startsWith("sq_");
  // value colour (§10): ONLY GSQAC scores follow RAG status. Every other KPI number
  // stays neutral black — delta is the separate coloured signal, not the value.
  const valueTone = na
    ? "text-rag-naText"
    : isGsqac
      ? valueToneClass(rec.status)
      : "text-neutral-900";
  const lastUpdated = getLastUpdatedLabel(kpi, new Date(), lang) || null;
  // N+1 comparison vs the next level UP (e.g. "vs State", "vs District") — the level
  // word, not the entity name (§11). parentName presence still gates it.
  const parentLevel = level ? peerLevelOf(level) : null;
  const hasPeer = !na && !!parentName && peerScore != null && !!parentLevel;
  // N+1 comparison pill — level word + value only (no "avg", no entity name), §11.
  const peerStr = hasPeer ? `${t(`levels.${parentLevel}`)} · ${formatValue(peerScore, kpi.unit, lang)}` : "";
  // short suffix (count KPIs) or "" (percent/score/visits show the bare value) —
  // never the full title, which already sits in the header.
  const suffix = getSingleMetricValueSuffix(kpi.id, lang);

  return (
    <KpiCardShell onClick={onClick} compare={<KpiCompareSection kpi={kpi} />}>
      <KpiCardHeader title={name} frequency={displayFrequency(kpi)} context={lastUpdated} chevron={!!onClick} />

      {/* inline value (+ short suffix) · N+1 comparison (+ allowed delta) right-aligned */}
      <div className="mt-2">
        <KpiInlineRow
          descriptor
          value={na ? t("common.na") : formatValue(rec.value, kpi.unit, lang)}
          label={suffix}
          valueTone={valueTone}
          peerLabel={hasPeer ? peerStr : null}
          delta={trend && trend.delta != null && trend.delta !== 0 ? (
            <FrequencyDelta delta={trend.delta} unit={kpi.unit} direction={kpi.direction} cadence={trend.cadence} lang={lang} />
          ) : null}
        />
      </div>
      {na && <span className="mt-1 block text-2xs text-neutral-400">{t("common.notTracked")}</span>}
    </KpiCardShell>
  );
}
