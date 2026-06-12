import { cn } from "@/lib/cn";
import type { DomainScore, KpiRecord, Level, Unit } from "@/types";
import { accent } from "@/lib/colors";
import { peerAvg, peerLevelOf } from "@/lib/peer";
import { getLastUpdatedLabel } from "@/lib/trend";
import { displayFrequency } from "@/lib/displayPolicy";
import { formatKpiCardTitlePhrase, formatValue, getSingleMetricValueSuffix } from "@/lib/format";
import { useT, type Lang } from "@/i18n";
import { Card } from "./atoms";
import { Icon } from "./Icon";
import { RatingBadge } from "./RatingBadge";
import { ValueDisplay } from "./ValueDisplay";
import { FrequencyDelta } from "./FrequencyDelta";
import { CardChevron } from "./kpiCardParts";
import { ChildComparisonBars, type ChildBar } from "./ComparisonBars";

/**
 * N+1 comparison as a prominent pill — "vs State · 62" (§11). Compares to the next
 * level UP, labelled by the LEVEL word (not the entity name). Bolder + higher
 * contrast than the old muted text line.
 */
function N1Chip({
  label,
  value,
  unit,
  lang,
  avg,
}: {
  label?: string | null;
  value: number | null;
  unit: Unit;
  lang: Lang;
  /** §22: append "avg" when the compared figure is an average (percent/score). */
  avg?: boolean;
}) {
  const { t } = useT();
  if (!label || value == null) return null;
  return (
    <span className="mt-2.5 inline-flex w-fit items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 ring-1 ring-primary-200">
      <span className="text-xs font-bold text-primary-700">
        {t("common.vs")} {label}
        {avg ? ` ${t("common.avg")}` : ""}
      </span>
      <span className="text-base font-extrabold tnum text-primary-700">
        {formatValue(value, unit, lang)}
      </span>
    </span>
  );
}

/**
 * Home domain card — the full-width insight tile used on the scorecard home.
 * One card per domain: a clickable head (icon · name · date · headline KPI ·
 * N+1 · policy-gated delta) that drills into the domain, plus an embedded,
 * horizontally-scrolling child-unit bar chart (the in-context "who needs
 * attention?", replacing the old standalone strip). Count heroes read as one
 * sentence; % / ratio heroes keep value + label. GSQAC adds a grade badge and
 * its allowed year-on-year delta. No source, no line graph.
 *
 * The outer element is a <div> (not a button): the head and each bar are their
 * own buttons, so drilling the domain and drilling a child unit stay distinct.
 */
export function DomainInsightCard({
  ds,
  name,
  level,
  heroRec,
  parentName,
  gsqacImprovement,
  outputPercent,
  parentPercent,
  comparable,
  comparing,
  bars,
  chartTitle,
  onDrill,
  onOpenChild,
}: {
  ds: DomainScore;
  name: string;
  level: Level;
  heroRec?: KpiRecord | null;
  parentName?: string;
  /** GSQAC (output) only: */
  gsqacImprovement?: number | null;
  outputPercent?: number | null;
  parentPercent?: number | null;
  /** embedded Compare chart (hidden until applied): */
  comparable: boolean;
  comparing: boolean;
  bars: ChildBar[];
  chartTitle: string;
  onDrill: () => void;
  onOpenChild?: (id: string) => void;
}) {
  const { t, lang } = useT();
  const a = accent(ds.domain.accent);
  const isOutput = ds.domain.kind === "output";
  const hasData = bars.some((b) => b.value != null);
  // N+1 compares to the next level UP, labelled by the level word ("vs State"), §11
  const parentLevel = peerLevelOf(level);
  const parentLabel =
    parentName && parentLevel ? t(`levels.${parentLevel}`) : null;

  return (
    <Card className="flex h-full flex-col">
      {/* ── head (drills into the domain) ── */}
      <button
        onClick={onDrill}
        className="group card-pad flex w-full flex-col gap-2 pb-3 text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                a.bg,
              )}
            >
              <Icon name={ds.domain.icon} className={a.icon} size={18} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-neutral-900">
                {name}
              </span>
              <span className="block truncate text-2xs font-medium text-neutral-400">
                {isOutput
                  ? t("scorecard.gsqacScore")
                  : metaLine(heroRec, lang, t)}
              </span>
            </span>
          </span>
          <CardChevron className="mt-0.5" />
        </div>

        {isOutput ? (
          <OutputHead
            percent={outputPercent ?? null}
            grade={ds.grade}
            status={ds.status}
            improvement={gsqacImprovement ?? null}
            parentLabel={parentLabel}
            parentPercent={parentPercent ?? null}
            lang={lang}
          />
        ) : (
          <InputHead
            heroRec={heroRec ?? null}
            level={level}
            parentLabel={parentLabel}
            lang={lang}
          />
        )}
      </button>

      {/* ── embedded comparison — only after Compare is applied (no hint before; card stays compact) ── */}
      {comparable && comparing && (
        <div className="mt-auto border-t border-line/70 px-4 pb-4 pt-3 sm:px-5">
          {hasData ? (
            <ChildComparisonBars
              title={chartTitle}
              bars={bars}
              unit="%"
              lang={lang}
              maxValue={100}
              onOpen={onOpenChild}
            />
          ) : (
            <p className="py-1 text-2xs text-neutral-400">
              {t("compare.notTracked")}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

/** input-domain headline = the domain's hero indicator, as one inline sentence:
 *  "208 students absent…" / "80.6% SAT reports…" / "1.7 No of CRCC/URC Visits…". */
function InputHead({
  heroRec,
  level,
  parentLabel,
  lang,
}: {
  heroRec: KpiRecord | null;
  level: Level;
  parentLabel?: string | null;
  lang: "en" | "gu";
}) {
  if (!heroRec) return null;
  const kpi = heroRec.kpi;
  const value = heroRec.value;
  const unit = kpi.unit;
  const peerScore = level ? peerAvg(kpi.id, level) : null;
  // §5: short descriptor ("225 students absent") where defined; otherwise the
  // sentence phrase. §10: the number stays neutral black (no RAG colour on values).
  const suffix = getSingleMetricValueSuffix(kpi.id, lang);
  const phrase = suffix || formatKpiCardTitlePhrase(kpi.name, kpi.name_gu, unit, lang);

  return (
    <>
      <p className="line-clamp-3 min-w-0 text-sm font-semibold leading-snug text-neutral-700">
        <span className="mr-1.5 align-baseline text-3xl font-extrabold tnum text-neutral-900">
          {formatValue(value, unit, lang)}
        </span>
        {phrase}
      </p>
      <N1Chip label={parentLabel} value={peerScore} unit={unit} lang={lang} avg={unit !== "count"} />
    </>
  );
}

/** GSQAC (output) headline = score + official grade badge + allowed yearly delta. */
function OutputHead({
  percent,
  grade,
  status,
  improvement,
  parentLabel,
  parentPercent,
  lang,
}: {
  percent: number | null;
  grade: string | null;
  status: KpiRecord["status"];
  improvement: number | null;
  parentLabel?: string | null;
  parentPercent: number | null;
  lang: "en" | "gu";
}) {
  return (
    <>
      <div className="flex items-end justify-between gap-2">
        <span className="flex items-end gap-2">
          <ValueDisplay
            value={percent}
            unit="%"
            status={status}
            lang={lang}
            size="lg"
          />
          {grade && <RatingBadge grade={grade} size="sm" className="mb-0.5" />}
        </span>
        {improvement != null && improvement !== 0 && (
          <FrequencyDelta
            delta={improvement}
            unit="%"
            direction="higher"
            cadence="yearly"
            lang={lang}
            className="pb-1"
          />
        )}
      </div>
      <N1Chip label={parentLabel} value={parentPercent} unit="%" lang={lang} avg />
    </>
  );
}

/** "Daily · 10 Jun" / "Monthly · Jun 2026" meta line for an input hero. */
function metaLine(
  heroRec: KpiRecord | null | undefined,
  lang: "en" | "gu",
  t: (k: string) => string,
): string {
  if (!heroRec) return "";
  const df = displayFrequency(heroRec.kpi);
  const freq = df ? t(`ogm.freq.${df}`) : "";
  const date = getLastUpdatedLabel(heroRec.kpi, new Date(), lang);
  return [freq, date].filter(Boolean).join(" · ");
}
