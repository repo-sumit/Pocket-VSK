import type { KpiRecord, Level, Unit } from "@/types";
import { deltaToneClass } from "@/lib/colors";
import { peerAvg, peerLevelOf } from "@/lib/peer";
import { buildTrend, getLastUpdatedLabel } from "@/lib/trend";
import { getWorkingDateLabel, formatValue } from "@/lib/format";
import { useT, type Lang } from "@/i18n";
import { ValueDisplay } from "./ValueDisplay";
import { FrequencyDelta } from "./FrequencyDelta";
import { KpiCardShell, KpiCardHeader, KpiContextTile } from "./kpiCardParts";

/** Headline metric label for a single-metric card (keeps the same label rhythm as the
 *  multi-metric rows without inventing data). */
function headlineLabelKey(unit: Unit): string {
  switch (unit) {
    case "%": return "kpi.lblRate";
    case "count": return "kpi.lblCount";
    case "score": return "kpi.lblScore";
    default: return "kpi.lblValue";
  }
}

/**
 * Single-metric KPI tile — compact, graph-free, row-based: header · meta · headline
 * value + delta/as-on · a 2-up Parent-avg / Source footer pinned to the foot. No
 * sparkline (charts live on the KPI detail page); `buildTrend` is used only for the delta.
 */
export function KpiCard({
  rec, name, onClick, lang = "en", level, parentName,
}: { rec: KpiRecord; name: string; onClick?: () => void; lang?: Lang; level?: Level; parentName?: string }) {
  const { t } = useT();
  const kpi = rec.kpi;
  const na = rec.value == null;
  const trend = na || kpi.noTrend ? null : buildTrend(rec, lang);
  const isDelta = kpi.displayStrategy === "delta_cycle";
  const peerScore = level && peerLevelOf(level) ? peerAvg(kpi.id, level) : null;
  const isGsqac = kpi.id.startsWith("sq_");
  const valueTone = isGsqac ? undefined : !kpi.suppressDelta && trend?.delta ? deltaToneClass(trend.delta, kpi.direction) : "text-neutral-900";
  // Meta period label (Daily → date · Monthly → month · Yearly → year/cycle). Encodes the
  // schedule month for SAT1/SAT2, so it is the ONLY period label shown (no duplicate).
  const lastUpdated = kpi.showLastUpdatedOnUi ? getLastUpdatedLabel(kpi, new Date(), lang) : null;
  const asOnLabel = kpi.suppressDelta ? (lastUpdated || getWorkingDateLabel(new Date(), lang)) : null;
  const hasPeer = !na && !!parentName && peerScore != null;
  const peerStr = peerScore != null ? `${parentName} · ${formatValue(peerScore, kpi.unit, lang)}` : "";

  return (
    <KpiCardShell onClick={onClick}>
      <KpiCardHeader title={name} frequency={kpi.frequency} context={asOnLabel ? null : lastUpdated} />

      {/* headline value + delta / as-on */}
      <div className="mt-3">
        <span className="block text-2xs font-semibold uppercase tracking-wide text-neutral-400">{t(headlineLabelKey(kpi.unit))}</span>
        <div className="mt-0.5 flex items-baseline justify-between gap-2">
          <ValueDisplay value={rec.value} unit={kpi.unit} status={rec.status} direction={kpi.direction} isDelta={isDelta} lang={lang} size="lg" toneClass={valueTone} naLabel={t("common.na")} />
          {asOnLabel ? (
            <span className="shrink-0 text-2xs font-semibold text-neutral-400">{t("kpi.asOnShort", { date: asOnLabel })}</span>
          ) : trend && !isDelta && trend.delta != null && trend.delta !== 0 ? (
            <FrequencyDelta delta={trend.delta} unit={kpi.unit} direction={kpi.direction} cadence={trend.cadence} lang={lang} />
          ) : null}
        </div>
      </div>

      {/* footer — Parent avg + Source as two compact columns, pinned to the foot */}
      <div className="mt-auto pt-3">
        {hasPeer ? (
          <div className="grid grid-cols-2 gap-x-3">
            <KpiContextTile label={t("kpi.parentAvgLabel")} value={peerStr} valueTitle={peerStr} />
            <KpiContextTile label={t("common.source")} value={kpi.data_source} valueTitle={kpi.data_source} />
          </div>
        ) : (
          <KpiContextTile label={na ? t("common.na") : t("common.source")} value={na ? t("common.notTracked") : kpi.data_source} valueTitle={kpi.data_source} />
        )}
      </div>
    </KpiCardShell>
  );
}
