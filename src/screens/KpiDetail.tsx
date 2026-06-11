import { useNavigate, useParams } from "react-router-dom";
import type { KpiRecord, Level } from "@/types";
import { useScope, useKpiRecord, useKpiMetrics, useFramework } from "@/hooks";
import { useT, type Lang } from "@/i18n";
import { rag } from "@/lib/colors";
import { resolveMetricLabel } from "@/lib/format";
import { shouldShowSource, displayFrequency } from "@/lib/displayPolicy";
import { buildTrend, trendTitleKey, getLastUpdatedLabel } from "@/lib/trend";
import { Card, SectionLabel, EmptyNA } from "@/components/ui/atoms";
import { TrendChart, MultiTrendChart } from "@/components/ui/TrendChart";
import { FrequencyBadge } from "@/components/ui/DataBadges";
import { Database } from "@/components/ui/Icon";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { BackLink } from "@/components/layout/PageHeader";

/**
 * KPI / indicator detail — the ONLY place source is shown (title meta line),
 * and the only place trend charts live. Every chart carries a clear title.
 * Formula copy resolves "hierarchy" to the current scope level, so the word
 * never reaches the UI.
 */
export default function KpiDetail() {
  const { kpiId } = useParams();
  const { entity, currentId } = useScope();
  const fw = useFramework();
  const rec = useKpiRecord(kpiId, currentId);
  const metricRecs = useKpiMetrics(kpiId, currentId);
  const { t, tn, lang } = useT();
  const navigate = useNavigate();

  if (!rec || !entity) return null;
  const kpi = rec.kpi;
  const c = rag(rec.status);
  const na = rec.value == null;
  const domain = fw.domains.find((d) => d.id === kpi.domain_id);
  const isMulti = metricRecs.length > 0;
  const isGsqac = kpi.id.startsWith("sq_");

  const name = tn(kpi.name, kpi.name_gu);

  const trend = na || kpi.noTrend ? null : buildTrend(rec, lang);
  const luLabel = getLastUpdatedLabel(kpi, new Date(), lang);
  const resolveCopy = (s: string, s_gu?: string) => resolveMetricLabel(s, s_gu ?? s, entity.level, lang);

  return (
    <ScreenContainer>
      <BackLink label={t("common.back")} onClick={() => navigate(-1)} />

      {/* ── compact page header — title + meta (frequency · date · SOURCE) ── */}
      <div className="pb-2">
        {domain && <p className="text-xs font-semibold text-primary-600">{tn(domain.name, domain.name_gu)}</p>}
        <h1 className="mt-0.5 text-xl font-extrabold leading-snug text-neutral-900">{name}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-neutral-400">
          <FrequencyBadge frequency={displayFrequency(kpi)} />
          {luLabel && <span>· {luLabel}</span>}
          {shouldShowSource("detail") && (
            <span className="inline-flex items-center gap-1 truncate" title={kpi.data_source}>
              <Database size={10} className="shrink-0" />
              <span className="truncate">{kpi.data_source}</span>
            </span>
          )}
        </div>
      </div>

      {/* TREND — chart title includes KPI/metric name so graphs are unambiguous.
          GSQAC multi-metric (CET & CGMS) → one chart, one line per sub-metric. */}
      {isMulti ? (
        isGsqac ? (
          <GsqacMultiTrend recs={metricRecs} name={name} level={entity.level} lang={lang} />
        ) : (
          metricRecs.map((mr) => <MetricTrendCard key={mr.kpi.id} rec={mr} level={entity.level} lang={lang} />)
        )
      ) : na ? (
        <EmptyNA hint={t("kpi.noData")} />
      ) : !kpi.noTrend && trend ? (
        <Card className="card-pad">
          <SectionLabel>{t(trendTitleKey(trend.cadence))}: {name}</SectionLabel>
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
                <dt className="text-xs font-bold text-neutral-800">
                  {resolveMetricLabel(mr.kpi.name, mr.kpi.name_gu, entity.level, lang)}
                </dt>
                <dd className="text-sm text-neutral-600">{mr.kpi.formula ? resolveCopy(mr.kpi.formula, mr.kpi.formula_gu) : null}</dd>
              </div>
            ))}
          </dl>
          {kpi.dataLagNote && <p className="mt-2 text-2xs text-neutral-400">{kpi.dataLagNote}</p>}
        </Card>
      ) : kpi.formula ? (
        <Card className="card-pad">
          <SectionLabel>{t("kpi.formula")}</SectionLabel>
          <p className="mt-2 text-sm text-neutral-700">{resolveCopy(kpi.formula)}</p>
          {kpi.dataLagNote && <p className="mt-2 text-2xs text-neutral-400">{kpi.dataLagNote}</p>}
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

/** Categorical line palette for intentional multi-line charts — clearly distinct,
 *  colour-blind-safe pairings (CET deep teal vs CGMS purple, never two greens). */
const MULTI_LINE_HEX = ["#0E7490", "#7C3AED", "#EA580C", "#DB2777"];

/**
 * GSQAC multi-metric trend — all sub-metrics on ONE chart, one line each (e.g. CET
 * & CGMS for the State-Exams domain). Title is "{cadence trend}: {domain name}".
 */
function GsqacMultiTrend({ recs, name, level, lang }: { recs: KpiRecord[]; name: string; level: Level; lang: Lang }) {
  const { t } = useT();
  const series = recs
    .map((mr) => ({ rec: mr, trend: buildTrend(mr, lang) }))
    .filter((s) => s.trend.points.length >= 2);
  if (!series.length) return null;
  const cadence = series[0].trend.cadence;
  return (
    <Card className="card-pad">
      <SectionLabel>{t(trendTitleKey(cadence))}: {name}</SectionLabel>
      <div className="mt-2">
        <MultiTrendChart
          series={series.map((s, i) => ({
            key: s.rec.kpi.id,
            label: resolveMetricLabel(s.rec.kpi.name, s.rec.kpi.name_gu, level, lang),
            color: MULTI_LINE_HEX[i % MULTI_LINE_HEX.length],
            points: s.trend.points,
          }))}
          unit={series[0].rec.kpi.unit}
          cadence={cadence}
          lang={lang}
          height={200}
        />
      </div>
    </Card>
  );
}

/** One trend chart per sub-metric — title is "{resolved metric label} · {cadence}". */
function MetricTrendCard({ rec, level, lang }: { rec: KpiRecord; level: Level; lang: Lang }) {
  const { t } = useT();
  if (rec.value == null) return null;
  const trend = buildTrend(rec, lang);
  if (trend.points.length < 2) return null;
  const c = rag(rec.status);
  const label = resolveMetricLabel(rec.kpi.name, rec.kpi.name_gu, level, lang);
  return (
    <Card className="card-pad">
      <SectionLabel>{label} · {t(trendTitleKey(trend.cadence))}</SectionLabel>
      <div className="mt-2">
        <TrendChart points={trend.points} unit={rec.kpi.unit} color={c.hex} cadence={trend.cadence} lang={lang} height={180} />
      </div>
    </Card>
  );
}
