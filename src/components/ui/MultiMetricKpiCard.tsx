import type { KpiRecord, Level, Role } from "@/types";
import {
  formatValue,
  resolveMetricLabel,
  formatBelowLevelLabel,
} from "@/lib/format";
import { peerAvg, peerLevelOf } from "@/lib/peer";
import { buildTrend, getLastUpdatedLabel } from "@/lib/trend";
import { shouldShowCardDelta, displayFrequency } from "@/lib/displayPolicy";
import { useKpiMetrics } from "@/hooks";
import { useT, type Lang } from "@/i18n";
import { FrequencyDelta } from "./FrequencyDelta";
import { KpiCardShell, KpiCardHeader, KpiInlineRow } from "./kpiCardParts";
import { KpiCompareSection } from "./KpiCompareSection";
import { KpiCard } from "./KpiCard";

/**
 * Multi-metric indicator card (Teacher/Student attendance · att_report · SAT 1/SAT 2/ORF/
 * CET/CGMS · Average CPD Time Per Teacher) — compact, graph-free score table. Each
 * metric is one inline `KpiInlineRow` (value + resolved label · N+1 · policy-gated delta).
 * "% below hierarchy average" resolves to the current scope ("% below block average").
 * No source on cards; charts live on the KPI detail page only.
 */
export function MultiMetricKpiCard({
  rec,
  metrics,
  name,
  onClick,
  lang = "en",
  level,
  parentName,
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
    <KpiCardShell
      onClick={onClick}
      compare={<KpiCompareSection kpi={kpi} />}
      metrics={metrics.length || 1}
    >
      <KpiCardHeader
        title={name}
        frequency={displayFrequency(kpi)}
        context={lastUpdated}
        chevron={!!onClick}
      />

      <div className="mt-2">
        {metrics.length ? (
          metrics.map((m, i) => (
            <MetricRow
              key={m.kpi.id}
              rec={m}
              level={level}
              parentName={parentName}
              lang={lang}
              divider={i > 0}
            />
          ))
        ) : (
          <span className="block py-2 text-2xs text-neutral-400">
            {t("common.notTracked")}
          </span>
        )}
      </div>
    </KpiCardShell>
  );
}

/** One metric row — inline `value + label`, label resolved to the current scope
 *  level, delta only where allowed. Divider drawn above every row after the first. */
function MetricRow({
  rec,
  level,
  parentName,
  lang,
  divider,
}: {
  rec: KpiRecord;
  level?: Level;
  parentName?: string;
  lang: Lang;
  divider?: boolean;
}) {
  const { t } = useT();
  const kpi = rec.kpi;
  const na = rec.value == null;
  const showDelta = !na && shouldShowCardDelta(kpi);
  const trend = showDelta ? buildTrend(rec, lang) : null;
  const delta = trend?.delta ?? null;
  const parentLevel = level ? peerLevelOf(level) : null;
  const peer = parentLevel ? peerAvg(kpi.id, level!) : null;
  // §10: KPI numbers stay neutral black (delta carries the colour, not the value).
  const tone = na ? "text-rag-naText" : "text-neutral-900";
  // §15: the below-average sub-metric row reads "28.6% students below {Level} average" —
  // the value cell shows "28.6%", so the label carries no leading "%" (no doubled percent).
  const isBelowAvg = kpi.id.endsWith("belowHierarchyAvg");
  const label = isBelowAvg
    ? formatBelowLevelLabel(level ?? "school", lang)
    : resolveMetricLabel(kpi.name, kpi.name_gu, level ?? "school", lang);

  return (
    <KpiInlineRow
      divider={divider}
      label={label}
      value={na ? "—" : formatValue(rec.value, kpi.unit, lang)}
      valueTone={tone}
      peerLabel={
        parentName && peer != null && parentLevel
          ? `${t(`levels.${parentLevel}`)} · ${formatValue(peer, kpi.unit, lang)}`
          : null
      }
      delta={
        delta != null && delta !== 0 ? (
          <FrequencyDelta
            delta={delta}
            unit={kpi.unit}
            direction={kpi.direction}
            cadence={trend!.cadence}
            lang={lang}
          />
        ) : null
      }
    />
  );
}

/**
 * Selector: multi-metric indicator → MultiMetricKpiCard; everything else → KpiCard.
 * Hook is always called (with undefined id for single-metric) to preserve stable order.
 */
export function KpiCardAuto({
  rec,
  name,
  onClick,
  lang = "en",
  level,
  parentName,
  currentId,
  role,
}: {
  rec: KpiRecord;
  name: string;
  onClick?: () => void;
  lang?: Lang;
  level?: Level;
  parentName?: string;
  currentId?: string | null;
  role?: Role;
}) {
  const { t } = useT();
  const isMulti = !!rec.kpi.metrics?.length;
  const metrics = useKpiMetrics(isMulti ? rec.kpi.id : undefined, currentId);
  // att_report: a Teacher (no teacher↔class mapping) sees ONLY "Class Sections" — no
  // Schools row — and a teacher-specific title. Principal/officers keep both + full title.
  const teacherAtt = rec.kpi.id === "att_report" && role === "teacher";
  const shownMetrics = teacherAtt ? metrics.filter((m) => m.kpi.id !== "att_report__schools") : metrics;
  const shownName = teacherAtt ? t("kpi.attReportTeacherTitle") : name;
  if (isMulti && shownMetrics.length) {
    return (
      <MultiMetricKpiCard
        rec={rec}
        metrics={shownMetrics}
        name={shownName}
        onClick={onClick}
        lang={lang}
        level={level}
        parentName={parentName}
      />
    );
  }
  return (
    <KpiCard
      rec={rec}
      name={shownName}
      onClick={onClick}
      lang={lang}
      level={level}
      parentName={parentName}
    />
  );
}
