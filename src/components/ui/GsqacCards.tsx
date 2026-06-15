import { cn } from "@/lib/cn";
import { rag, GSQAC_BAND_HEX } from "@/lib/colors";
import { locNum } from "@/lib/format";
import type { Level } from "@/types";
import { peerLevelOf } from "@/lib/peer";
import { useT, type Lang } from "@/i18n";
import { GSQAC_OVERALL, gsqacGrade, gsqacStatus, gsqacCompareValue, gsqacParentValue, type GsqacArea, type GsqacSubdomain, type GsqacIndicator } from "@/config/gsqac";
import { useCompare } from "@/components/compare/CompareContext";
import { Card } from "./atoms";
import { RatingBadge } from "./RatingBadge";
import { CardChevron } from "./kpiCardParts";
import { ChildComparisonBars, type ChildBar } from "./ComparisonBars";
import { Award } from "./Icon";

/**
 * Embedded GSQAC Compare chart — the same pattern as `KpiCompareSection`, but GSQAC
 * scores live in a self-contained config (not the provider), so it builds the bars
 * from `gsqacCompareValue` (deterministic, §4) instead of `useKpiChildSeries`. Renders
 * NOTHING until Compare is applied (cards stay compact), then shows the selected N-1
 * child units in percent (§5), worst-first, via the shared `ChildComparisonBars`.
 */
export function GsqacCompareSection({ seedKey, base, lang, className }: { seedKey: string; base: number; lang: Lang; className?: string }) {
  const { childLevel, applied, selected } = useCompare();
  const { t, tn } = useT();
  // GSQAC is school-level accreditation — valid child compares are State→District→
  // Block→Cluster→School only. Below school (grade/section) has no GSQAC data, so
  // show no chart there (§1). Also nothing before Compare is applied.
  if (!childLevel || !applied || childLevel === "grade" || childLevel === "section") return null;
  const bars: ChildBar[] = selected.map((e) => {
    const value = gsqacCompareValue(e.id, seedKey, base);
    return { id: e.id, label: tn(e.name, e.name_gu), value, status: gsqacStatus(value) };
  });
  if (!bars.length) return null;
  return (
    <div className={cn("mt-3 border-t border-line/60 pt-3", className)}>
      {/* §6 — GSQAC bars use the grade-scale colour of each bar's score (green→red),
          not the neutral brand fill that non-GSQAC domains use. */}
      <ChildComparisonBars
        title={t("compare.chartTitle", { level: t(`levels.${childLevel}`) })}
        bars={bars}
        unit="%"
        lang={lang}
        maxValue={100}
        fillFor={(b) => GSQAC_BAND_HEX[gsqacGrade(b.value as number)]}
      />
    </div>
  );
}

/** N+1 parent-comparison pill for GSQAC cards — same look as DomainInsightCard's
 *  N1Chip (level word + value, no "avg", §11). Renders nothing at State / leaf. */
function GsqacN1Pill({ level, seedKey, base, lang }: { level?: Level; seedKey: string; base: number; lang: Lang }) {
  const { t } = useT();
  const parentLevel = level ? peerLevelOf(level) : null;
  const value = gsqacParentValue(parentLevel, seedKey, base);
  if (!parentLevel || value == null) return null;
  return (
    <span className="mt-2.5 inline-flex w-fit items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 ring-1 ring-primary-200">
      <span className="text-xs font-bold text-primary-700">{t(`levels.${parentLevel}`)}</span>
      <span className="text-base font-extrabold tnum text-primary-700">{locNum(value, lang)}%</span>
    </span>
  );
}

/** Overall GSQAC score card — % · grade · marks out of 1000. */
export function GsqacOverallCard({ lang, level }: { lang: Lang; level?: Level }) {
  const { t } = useT();
  const grade = gsqacGrade(GSQAC_OVERALL.percent);
  const c = rag(gsqacStatus(GSQAC_OVERALL.percent));
  return (
    <Card className="card-pad">
      <div className="flex items-center gap-4">
        <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", c.soft)}>
          <Award size={24} className={c.text} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-2xs font-bold uppercase tracking-wide text-neutral-400">{t("gsqac.overall")}</p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className={cn("text-3xl font-extrabold tnum leading-none", c.text)}>{locNum(GSQAC_OVERALL.percent, lang)}%</span>
            <span className="text-xs font-semibold text-neutral-500">{locNum(GSQAC_OVERALL.got, lang)} / {locNum(GSQAC_OVERALL.max, lang)}</span>
          </div>
          <p className="mt-1 text-2xs text-neutral-400">{t("gsqac.framework")}</p>
        </div>
        <RatingBadge grade={grade} size="md" className="shrink-0" />
      </div>
      <GsqacN1Pill level={level} seedKey="gsqac_overall" base={GSQAC_OVERALL.percent} lang={lang} />
      <GsqacCompareSection seedKey="gsqac_overall" base={GSQAC_OVERALL.percent} lang={lang} />
    </Card>
  );
}

/** One GSQAC area score card (Teaching & Learning, …): score · grade · sub-domain count. */
export function GsqacAreaCard({ area, lang, level, onOpen }: { area: GsqacArea; lang: Lang; level?: Level; onOpen: () => void }) {
  const { t, tn } = useT();
  const grade = gsqacGrade(area.percent);
  const c = rag(gsqacStatus(area.percent));
  const n = area.subdomains.length;
  return (
    <Card className="card-pad">
      <button onClick={onOpen} className="group flex w-full flex-col text-left">
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 text-sm font-bold leading-snug text-neutral-900">{tn(area.name, area.name_gu)}</span>
          <CardChevron className="mt-0.5" />
        </div>
        <div className="mt-2 flex items-center gap-2.5">
          <span className={cn("text-2xl font-extrabold tnum leading-none", c.text)}>{locNum(area.percent, lang)}%</span>
          <RatingBadge grade={grade} size="sm" />
        </div>
        <div className="mt-2 flex items-center gap-2 text-2xs font-medium text-neutral-400">
          <span>{n === 1 ? t("gsqac.subdomainsOne", { n: locNum(n, lang) }) : t("gsqac.subdomains", { n: locNum(n, lang) })}</span>
          <span>·</span>
          <span className="tnum">{t("gsqac.outOf", { got: locNum(area.got, lang), max: locNum(area.max, lang) })}</span>
        </div>
      </button>
      <GsqacN1Pill level={level} seedKey={area.key} base={area.percent} lang={lang} />
      <GsqacCompareSection seedKey={area.key} base={area.percent} lang={lang} />
    </Card>
  );
}

/** A GSQAC sub-domain navigation card — score · grade · indicator count · chevron.
 *  Tapping opens the sub-domain page (indicator cards). Supports embedded Compare. */
export function GsqacSubdomainCard({ sub, lang, level, onOpen }: { sub: GsqacSubdomain; lang: Lang; level?: Level; onOpen: () => void }) {
  const { t, tn } = useT();
  const c = rag(gsqacStatus(sub.score));
  const grade = gsqacGrade(sub.score);
  const n = sub.indicators.length;
  return (
    <Card className="card-pad">
      <button onClick={onOpen} className="group flex w-full flex-col text-left">
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 text-sm font-bold leading-snug text-neutral-900">{tn(sub.name, sub.name_gu ?? sub.name)}</span>
          <CardChevron className="mt-0.5" />
        </div>
        <div className="mt-2 flex items-center gap-2.5">
          <span className={cn("text-2xl font-extrabold tnum leading-none", c.text)}>{locNum(sub.score, lang)}%</span>
          <RatingBadge grade={grade} size="sm" />
        </div>
        <div className="mt-2 text-2xs font-medium text-neutral-400">{locNum(n, lang)} {t("scorecard.indicators")}</div>
      </button>
      <GsqacN1Pill level={level} seedKey={sub.id} base={sub.score} lang={lang} />
      <GsqacCompareSection seedKey={sub.id} base={sub.score} lang={lang} />
    </Card>
  );
}

/** A GSQAC indicator card — SAME layout as the sub-domain card (title top-left ·
 *  chevron top-right · large score + grade badge below), so the Indicators list reads
 *  as full cards, not thin rows. Tapping opens the KPI detail page (/app/kpi/:id).
 *  Supports the same embedded grade-coloured Compare chart. */
export function GsqacIndicatorCard({ indicator, lang, level, onOpen }: { indicator: GsqacIndicator; lang: Lang; level?: Level; onOpen: () => void }) {
  const c = rag(gsqacStatus(indicator.score));
  const grade = gsqacGrade(indicator.score);
  return (
    <Card className="card-pad">
      <button onClick={onOpen} className="group flex w-full flex-col text-left">
        <div className="flex items-start justify-between gap-2">
          <span className="line-clamp-2 min-w-0 text-sm font-bold leading-snug text-neutral-900">{indicator.name}</span>
          <CardChevron className="mt-0.5" />
        </div>
        <div className="mt-2 flex items-center gap-2.5">
          <span className={cn("text-2xl font-extrabold tnum leading-none", c.text)}>{locNum(indicator.score, lang)}%</span>
          <RatingBadge grade={grade} size="sm" />
        </div>
      </button>
      <GsqacN1Pill level={level} seedKey={indicator.id} base={indicator.score} lang={lang} />
      <GsqacCompareSection seedKey={indicator.id} base={indicator.score} lang={lang} />
    </Card>
  );
}
