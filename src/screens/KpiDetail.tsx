import { useNavigate, useParams } from "react-router-dom";
import { useScope, useKpiRecord, useKpiCascade, useFramework } from "@/hooks";
import { useT } from "@/i18n";
import { rag } from "@/lib/colors";
import { locNum } from "@/lib/format";
import { peerAvg, peerLevelOf } from "@/lib/peer";
import { buildTrend, trendTitleKey, cadenceOf } from "@/lib/trend";
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
  const { t, tn, lang } = useT();
  const navigate = useNavigate();

  if (!rec || !entity) return null;
  const kpi = rec.kpi;
  const c = rag(rec.status);
  const na = rec.value == null;
  const domain = fw.domains.find((d) => d.id === kpi.domain_id);
  const isGsqac = kpi.id.startsWith("sq_");
  const isContextDelta = kpi.displayStrategy === "delta_cycle";
  const peerLevel = peerLevelOf(entity.level);

  // "Students below hierarchy avg" → substitute the actual N+1 level name (e.g. "cluster")
  const parentLevelLabel = peerLevel ? t(`levels.${peerLevel}`) : null;
  let name = tn(kpi.name, kpi.name_gu);
  if (kpi.id === "asm_below" && parentLevelLabel) {
    name = lang === "gu" ? name.replace("સ્તર", parentLevelLabel) : name.replace(/\bhierarchy\b/i, parentLevelLabel.toLowerCase());
  }

  // frequency-aware trend (history + cadence + delta-vs-one-period-back).
  // snapshot/cycle indicators (kpi.noTrend, e.g. SAT1/SAT2) get no trend chart — a cycle context only.
  const trend = na || kpi.noTrend ? null : buildTrend(rec, lang);

  // the "current value" label, derived from the indicator's frequency/cadence:
  // Daily → latest available date · Monthly → current month · Twice → current cycle ·
  // Half-yearly → current half-year · Yearly → current year · else → latest available.
  const cadence = trend?.cadence ?? cadenceOf(kpi.frequency);
  const latestDate = trend && trend.points.length ? trend.points[trend.points.length - 1].x : null;
  const currentLabel =
    cadence === "daily" ? (latestDate ? t("kpi.latestOn", { date: latestDate }) : t("kpi.latestAvailable"))
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
            <span className="inline-flex max-w-full items-center gap-1 truncate text-2xs text-neutral-400" title={kpi.data_source}>
              <Database size={11} className="shrink-0" /> <span className="truncate">{kpi.data_source}</span>
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3">
          <div className="min-w-0">
            <SectionLabel>{currentLabel}</SectionLabel>
            {isGsqac && !na ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-4xl font-extrabold tnum text-neutral-900">{locNum(Math.round(rec.value as number), lang)}</span>
                <RatingBadge grade={gradeFor(rec.value as number, GSQAC_BANDS).grade} size="md" />
              </div>
            ) : (
              <ValueDisplay value={rec.value} unit={kpi.unit} status={rec.status} direction={kpi.direction} isDelta={isContextDelta} lang={lang} size="xl" naLabel={t("common.na")} className="mt-1 block" />
            )}
            {/* N+1 — next level up: parent name + parent-level score (absolute, no ± delta) */}
            <NPlusOneLine parentName={parentName} value={parentScore} unit={kpi.unit} lang={lang} signed={isContextDelta} className="mt-1.5 !text-xs !text-neutral-500" />
          </div>
          {/* single delta tag, wording derived from the indicator's frequency */}
          {trend && !isContextDelta && (
            <FrequencyDelta variant="pill" delta={trend.delta} unit={kpi.unit} direction={kpi.direction} cadence={trend.cadence} lang={lang} />
          )}
        </div>
      </Card>

      {/* TREND — frequency-correct cadence x-axis; suppressed for snapshot/cycle indicators (no graph) */}
      {na ? (
        <EmptyNA hint={t("kpi.noData")} />
      ) : !kpi.noTrend && trend ? (
        <Card className="card-pad">
          <SectionLabel>{t(trendTitleKey(trend.cadence))}</SectionLabel>
          <div className="mt-2">
            <TrendChart
              points={trend.points}
              unit={kpi.unit}
              benchmark={isGsqac ? null : rec.benchmark}
              color={c.hex}
              cadence={trend.cadence}
              lang={lang}
            />
          </div>
        </Card>
      ) : null}

      {/* HOW IT'S CALCULATED */}
      {kpi.formula && (
        <Card className="card-pad">
          <SectionLabel>{t("kpi.formula")}</SectionLabel>
          <p className="mt-2 text-sm text-neutral-700">{kpi.formula}</p>
          {kpi.dataLagNote && <p className="mt-2 text-2xs text-neutral-400">{kpi.dataLagNote}</p>}
        </Card>
      )}
    </ScreenContainer>
  );
}
