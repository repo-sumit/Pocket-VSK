import { cn } from "@/lib/cn";
import type { DomainScore, KpiRecord, Level, Unit } from "@/types";
import { accent, valueToneClass } from "@/lib/colors";
import { peerAvg } from "@/lib/peer";
import { getLastUpdatedLabel } from "@/lib/trend";
import { formatKpiCardTitlePhrase, formatValue } from "@/lib/format";
import { useT, type Lang } from "@/i18n";
import { Card } from "./atoms";
import { Icon, ChevronRight } from "./Icon";
import { RatingBadge } from "./RatingBadge";
import { ValueDisplay } from "./ValueDisplay";
import { FrequencyDelta } from "./FrequencyDelta";
import { ChildComparisonBars, type ChildBar } from "./ComparisonBars";

/**
 * N+1 comparison as a boxed chip — "vs Nargadh · 62" — the prominent, self-contained
 * treatment from the design handoff (replaces the plain muted text line on home
 * domain cards). The entity name + value carry the meaning; "vs" is the only label.
 */
function N1Chip({ parentName, value, unit, lang }: { parentName?: string; value: number | null; unit: Unit; lang: Lang }) {
  const { t } = useT();
  if (!parentName || value == null) return null;
  return (
    <span className="mt-2.5 inline-flex w-fit items-center gap-2 rounded-lg bg-surface-sunken px-3 py-1.5">
      <span className="text-2xs font-semibold text-neutral-400">{t("common.vs")} {parentName}</span>
      <span className="text-sm font-extrabold tnum text-neutral-900">{formatValue(value, unit, lang)}</span>
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
  ds, name, level, heroRec, parentName, gsqacImprovement, outputPercent, parentPercent,
  comparable, comparing, bars, chartTitle, onDrill, onOpenChild,
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

  return (
    <Card className="flex h-full flex-col">
      {/* ── head (drills into the domain) ── */}
      <button onClick={onDrill} className="group/head card-pad flex w-full flex-col gap-2 pb-3 text-left">
        <div className="flex items-start justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2.5">
            <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", a.bg)}>
              <Icon name={ds.domain.icon} className={a.icon} size={18} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-neutral-900">{name}</span>
              <span className="block truncate text-2xs font-medium text-neutral-400">
                {isOutput ? t("scorecard.gsqacScore") : metaLine(heroRec, lang, t)}
              </span>
            </span>
          </span>
          <ChevronRight size={16} className="mt-0.5 shrink-0 text-neutral-300 transition-transform group-hover/head:translate-x-0.5" />
        </div>

        {isOutput
          ? <OutputHead percent={outputPercent ?? null} grade={ds.grade} status={ds.status} improvement={gsqacImprovement ?? null} parentName={parentName} parentPercent={parentPercent ?? null} lang={lang} />
          : <InputHead heroRec={heroRec ?? null} level={level} parentName={parentName} lang={lang} />}
      </button>

      {/* ── embedded comparison — only after Compare is applied (no hint before; card stays compact) ── */}
      {comparable && comparing && (
        <div className="mt-auto border-t border-line/70 px-4 pb-4 pt-3 sm:px-5">
          {hasData ? (
            <ChildComparisonBars title={chartTitle} bars={bars} unit="%" lang={lang} maxValue={100} onOpen={onOpenChild} />
          ) : (
            <p className="py-1 text-2xs text-neutral-400">{t("compare.notTracked")}</p>
          )}
        </div>
      )}
    </Card>
  );
}

/** input-domain headline = the domain's hero indicator, as one inline sentence:
 *  "208 students absent…" / "80.6% SAT reports…" / "1.7 No of CRC/URC Visits…". */
function InputHead({
  heroRec, level, parentName, lang,
}: {
  heroRec: KpiRecord | null;
  level: Level;
  parentName?: string;
  lang: "en" | "gu";
}) {
  if (!heroRec) return null;
  const kpi = heroRec.kpi;
  const value = heroRec.value;
  const unit = kpi.unit;
  const peerScore = level ? peerAvg(kpi.id, level) : null;
  // headline reads in its RAG status colour (green good / red at-risk / neutral else)
  const valueTone = valueToneClass(heroRec.status);
  const phrase = formatKpiCardTitlePhrase(kpi.name, kpi.name_gu, unit, lang);

  return (
    <>
      <p className="line-clamp-3 min-w-0 text-sm font-semibold leading-snug text-neutral-700">
        <span className={cn("mr-1.5 align-baseline text-3xl font-extrabold tnum", valueTone)}>{formatValue(value, unit, lang)}</span>
        {phrase}
      </p>
      <N1Chip parentName={parentName} value={peerScore} unit={unit} lang={lang} />
    </>
  );
}

/** GSQAC (output) headline = score + official grade badge + allowed yearly delta. */
function OutputHead({
  percent, grade, status, improvement, parentName, parentPercent, lang,
}: {
  percent: number | null;
  grade: string | null;
  status: KpiRecord["status"];
  improvement: number | null;
  parentName?: string;
  parentPercent: number | null;
  lang: "en" | "gu";
}) {
  return (
    <>
      <div className="flex items-end justify-between gap-2">
        <span className="flex items-end gap-2">
          <ValueDisplay value={percent} unit="%" status={status} lang={lang} size="lg" />
          {grade && <RatingBadge grade={grade} size="sm" className="mb-0.5" />}
        </span>
        {improvement != null && improvement !== 0 && (
          <FrequencyDelta delta={improvement} unit="%" direction="higher" cadence="yearly" lang={lang} className="pb-1" />
        )}
      </div>
      <N1Chip parentName={parentName} value={parentPercent} unit="%" lang={lang} />
    </>
  );
}

/** "Daily · 10 Jun" / "Monthly · Jun 2026" meta line for an input hero. */
function metaLine(heroRec: KpiRecord | null | undefined, lang: "en" | "gu", t: (k: string) => string): string {
  if (!heroRec) return "";
  const freq = heroRec.kpi.frequency ? t(`ogm.freq.${heroRec.kpi.frequency}`) : "";
  const date = getLastUpdatedLabel(heroRec.kpi, new Date(), lang);
  return [freq, date].filter(Boolean).join(" · ");
}
