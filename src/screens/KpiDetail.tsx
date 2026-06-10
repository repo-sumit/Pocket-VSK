import { useNavigate, useParams } from "react-router-dom";
import type { KpiRecord, Level } from "@/types";
import { useScope, useKpiRecord, useKpiCascade, useKpiMetrics, useFramework } from "@/hooks";
import { useT, type Lang } from "@/i18n";
import { cn } from "@/lib/cn";
import { rag, deltaToneClass } from "@/lib/colors";
import { locNum, getWorkingDateLabel, formatValue } from "@/lib/format";
import { peerAvg, peerLevelOf } from "@/lib/peer";
import { buildTrend, trendTitleKey, cadenceOf, getLastUpdatedLabel } from "@/lib/trend";
import { gradeFor, GSQAC_BANDS } from "@/config/ratingBands";
import { Card, SectionLabel, EmptyNA } from "@/components/ui/atoms";
import { TrendChart } from "@/components/ui/TrendChart";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { FrequencyBadge } from "@/components/ui/DataBadges";
import { ValueDisplay } from "@/components/ui/ValueDisplay";
import { FrequencyDelta } from "@/components/ui/FrequencyDelta";
import { NPlusOneLine } from "@/components/ui/NPlusOneLine";
import { Database } from "@/components/ui/Icon";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { BackLink } from "@/components/layout/PageHeader";

export default function KpiDetail() {
  const { kpiId } = useParams();
  const { entity, currentId } = useScope();
  const fw = useFramework();
  const rec = useKpiRecord(kpiId, currentId);
  const cascade = useKpiCascade(kpiId, currentId);
  const metricRecs = useKpiMetrics(kpiId, currentId); // [] for single-metric indicators
  const { t, tn, lang } = useT();
  const navigate = useNavigate();

  if (!rec || !entity) return null;
  const kpi = rec.kpi;
  const c = rag(rec.status);
  const na = rec.value == null;
  const domain = fw.domains.find((d) => d.id === kpi.domain_id);
  const isGsqac = kpi.id.startsWith("sq_");
  const isContextDelta = kpi.displayStrategy === "delta_cycle";
  const isMulti = metricRecs.length > 0;
  const peerLevel = peerLevelOf(entity.level);

  const name = tn(kpi.name, kpi.name_gu);

  // frequency-aware trend (history + cadence + delta-vs-one-period-back).
  // snapshot/cycle indicators (kpi.noTrend, e.g. SAT1/SAT2) get no trend chart — a cycle context only.
  const trend = na || kpi.noTrend ? null : buildTrend(rec, lang);

  // the "current value" / last-updated label, derived from the indicator's frequency (§3):
  // Daily → "As on {working date}" · Monthly → "Jun 2026" · SAT1/SAT2 → "Sep 2025" / "Mar 2026" ·
  // Yearly → "2026" · else → "Latest available".
  const cadence = trend?.cadence ?? cadenceOf(kpi.frequency);
  const luLabel = getLastUpdatedLabel(kpi, new Date(), lang);
  const currentLabel =
    cadence === "daily" ? t("kpi.asOn", { date: luLabel || getWorkingDateLabel(new Date(), lang) })
      : luLabel ? luLabel
        : cadence === "monthly" ? t("kpi.currentMonth")
          : cadence === "twice" ? t("kpi.currentCycle")
            : cadence === "half" ? t("kpi.currentHalf")
              : cadence === "yearly" ? t("kpi.currentYear")
                : t("kpi.latestAvailable");

  // N+1 — the immediate parent (next level up): its real name (from the read-only
  // ancestor cascade) + the parent-level score (peerAvg, absolute — never per-school).
  const parentRow = cascade.length >= 2 ? cascade[cascade.length - 2] : null;
  const parentName = parentRow ? (lang === "gu" && parentRow.entity.name_gu ? parentRow.entity.name_gu : parentRow.entity.name) : undefined;
  const parentScore = peerLevel ? peerAvg(kpi.id, entity.level) : null;
  // main value colour follows delta direction (up=green / down=red, direction-aware), neutral when flat; GSQAC keeps its own treatment
  const valueTone = isGsqac ? undefined : kpi.suppressDelta ? "text-neutral-900" : trend?.delta ? deltaToneClass(trend.delta, kpi.direction) : "text-neutral-900";

  return (
    <ScreenContainer>
      <BackLink label={t("common.back")} onClick={() => navigate(-1)} />

      {/* header + current value */}
      <Card className="card-pad">
        <div className="min-w-0">
          {domain && <p className="text-xs font-semibold text-primary-600">{tn(domain.name, domain.name_gu)}</p>}
          <h1 className="text-lg font-extrabold text-neutral-900">{name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <FrequencyBadge frequency={kpi.frequency} />
            {/* the period caption below the value already encodes the schedule month
                (e.g. "Sep 2025"), so the raw scheduleNote chip is not repeated here. */}
            <span className="inline-flex max-w-full items-center gap-1 truncate text-2xs text-neutral-400" title={kpi.data_source}>
              <Database size={11} className="shrink-0" /> <span className="truncate">{kpi.data_source}</span>
            </span>
          </div>
        </div>

        {isMulti ? (
          // ── multi-metric summary: a clean divided row (no nested cards), one cell per metric ──
          <div className="mt-4 grid grid-cols-1 divide-y divide-line/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {metricRecs.map((mr) => (
              <MetricSummary key={mr.kpi.id} rec={mr} level={entity.level} parentName={parentName} lang={lang} />
            ))}
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3">
            <div className="min-w-0">
              <SectionLabel>{currentLabel}</SectionLabel>
              {isGsqac && !na ? (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-4xl font-extrabold tnum text-neutral-900">{locNum(Math.round(rec.value as number), lang)}</span>
                  <RatingBadge grade={gradeFor(rec.value as number, GSQAC_BANDS).grade} size="md" />
                </div>
              ) : (
                <ValueDisplay value={rec.value} unit={kpi.unit} status={rec.status} direction={kpi.direction} isDelta={isContextDelta} lang={lang} size="xl" naLabel={t("common.na")} toneClass={valueTone} className="mt-1 block" />
              )}
              {/* N+1 — next level up: parent name + parent-level score (absolute, no ± delta) */}
              <NPlusOneLine parentName={parentName} value={parentScore} unit={kpi.unit} lang={lang} signed={isContextDelta} className="mt-1.5 !text-xs !text-neutral-500" />
            </div>
            {/* single delta tag, wording derived from the indicator's frequency. Suppressed for
                as-on-date indicators (e.g. SAT reports downloaded) — they show "As on {date}" above. */}
            {trend && !isContextDelta && !kpi.suppressDelta && (
              <FrequencyDelta variant="pill" delta={trend.delta} unit={kpi.unit} direction={kpi.direction} cadence={trend.cadence} lang={lang} />
            )}
          </div>
        )}
      </Card>

      {/* TREND */}
      {isMulti ? (
        // one trend panel per metric — never a single chart that hides the other metrics (§10)
        metricRecs.map((mr) => <MetricTrendCard key={mr.kpi.id} rec={mr} lang={lang} />)
      ) : na ? (
        <EmptyNA hint={t("kpi.noData")} />
      ) : !kpi.noTrend && trend ? (
        <Card className="card-pad">
          <SectionLabel>{t(trendTitleKey(trend.cadence))}</SectionLabel>
          <div className="mt-2">
            <TrendChart points={trend.points} unit={kpi.unit} color={c.hex} cadence={trend.cadence} lang={lang} />
          </div>
        </Card>
      ) : null}

      {/* HOW IT'S CALCULATED */}
      {isMulti ? (
        <Card className="card-pad">
          <SectionLabel>{t("kpi.formula")}</SectionLabel>
          <dl className="mt-2 space-y-2.5">
            {metricRecs.map((mr) => (
              <div key={mr.kpi.id}>
                <dt className="text-xs font-bold text-neutral-800">{tn(mr.kpi.name, mr.kpi.name_gu)}</dt>
                <dd className="text-sm text-neutral-600">{mr.kpi.formula}</dd>
              </div>
            ))}
          </dl>
          {kpi.dataLagNote && <p className="mt-2 text-2xs text-neutral-400">{kpi.dataLagNote}</p>}
        </Card>
      ) : kpi.formula ? (
        <Card className="card-pad">
          <SectionLabel>{t("kpi.formula")}</SectionLabel>
          <p className="mt-2 text-sm text-neutral-700">{kpi.formula}</p>
          {kpi.dataLagNote && <p className="mt-2 text-2xs text-neutral-400">{kpi.dataLagNote}</p>}
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

/** Compact summary tile for one sub-metric: label · value · N+1 · direction-aware delta. */
function MetricSummary({ rec, level, parentName, lang }: { rec: KpiRecord; level: Level; parentName?: string; lang: Lang }) {
  const { tn } = useT();
  const kpi = rec.kpi;
  const na = rec.value == null;
  const trend = na ? null : buildTrend(rec, lang);
  const delta = trend?.delta ?? null;
  const peer = peerLevelOf(level) ? peerAvg(kpi.id, level) : null;
  const tone = na ? "text-rag-naText" : delta ? deltaToneClass(delta, kpi.direction) : "text-neutral-900";
  return (
    <div className="py-2.5 sm:px-4 sm:py-0 sm:first:pl-0">
      <span className="block text-2xs font-semibold uppercase tracking-wide text-neutral-400">{tn(kpi.name, kpi.name_gu)}</span>
      <span className={cn("mt-0.5 block text-2xl font-extrabold tnum", tone)}>{na ? "—" : formatValue(rec.value, kpi.unit, lang)}</span>
      <NPlusOneLine parentName={parentName} value={peer} unit={kpi.unit} lang={lang} className="mt-0.5" />
      {delta != null && delta !== 0 && (
        <FrequencyDelta delta={delta} unit={kpi.unit} direction={kpi.direction} cadence={trend!.cadence} lang={lang} className="mt-1" />
      )}
    </div>
  );
}

/** One trend chart panel per sub-metric (so no metric's trend is hidden — §10). */
function MetricTrendCard({ rec, lang }: { rec: KpiRecord; lang: Lang }) {
  const { t, tn } = useT();
  if (rec.value == null) return null;
  const trend = buildTrend(rec, lang);
  if (trend.points.length < 2) return null;
  const c = rag(rec.status);
  return (
    <Card className="card-pad">
      <SectionLabel>{tn(rec.kpi.name, rec.kpi.name_gu)} · {t(trendTitleKey(trend.cadence))}</SectionLabel>
      <div className="mt-2">
        <TrendChart points={trend.points} unit={rec.kpi.unit} color={c.hex} cadence={trend.cadence} lang={lang} height={180} />
      </div>
    </Card>
  );
}
