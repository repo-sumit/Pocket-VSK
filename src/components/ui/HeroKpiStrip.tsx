import type { ReactNode } from "react";
import type { KpiRecord, Level, RagStatus } from "@/types";
import { cn } from "@/lib/cn";
import { rag, deltaToneClass } from "@/lib/colors";
import { formatValue, formatDelta, locNum, pct } from "@/lib/format";
import { peerAvg, peerLevelOf } from "@/lib/peer";
import { buildTrend } from "@/lib/trend";
import { gradeFor, GSQAC_BANDS } from "@/config/ratingBands";
import { useT } from "@/i18n";
import { statusFromGrade } from "@/engine";
import { Card, StatusDot } from "./atoms";
import { Sparkline } from "./Sparkline";
import { RatingBadge } from "./RatingBadge";
import { NPlusOneLine } from "./NPlusOneLine";
import { FrequencyBadge } from "./DataBadges";

/**
 * "Key indicators" — the official green-flagged HERO indicators (config-driven
 * via `kpi.hero`), most-at-risk first. Full-width horizontal tiles so each
 * indicator's FULL name shows (no truncation): status dot + full name + freq chip
 * + one supporting line on the left; mini trend (desktop) + the dominant value on
 * the right. Colour is reserved for status (the dot), grade (the badge) and the
 * trend delta.
 */
const STATUS_RANK: Record<RagStatus, number> = { red: 0, amber: 1, green: 2, na: 3 };

/** GSQAC (sq_*) status comes from its official GRADE band, not the generic 85/65
 *  RAG — so the status dot can never disagree with the grade badge beside it. */
function heroStatus(rec: KpiRecord): RagStatus {
  if (rec.kpi.id.startsWith("sq_") && rec.value != null) {
    return statusFromGrade(gradeFor(rec.value, GSQAC_BANDS).group ?? "D");
  }
  return rec.status;
}

export function HeroKpiStrip({
  records, level, enrolment, parentName, onOpen,
}: { records: KpiRecord[]; level: Level; enrolment?: number; parentName?: string; onOpen?: (rec: KpiRecord) => void }) {
  const { t } = useT();
  const heroes = records
    .filter((r) => r.kpi.hero && r.value != null)
    .sort((a, b) => {
      const s = STATUS_RANK[heroStatus(a)] - STATUS_RANK[heroStatus(b)];
      if (s !== 0) return s;
      const ach = (a.achievement ?? 101) - (b.achievement ?? 101);
      if (ach !== 0) return ach;
      return a.kpi.sort_order - b.kpi.sort_order;
    });
  if (!heroes.length) return null;

  return (
    <div>
      <p className="section-title mb-2">{t("ogm.heroKpis")}</p>
      <div className="flex flex-col gap-2.5">
        {heroes.map((rec) => (
          <HeroTile key={rec.kpi.id} rec={rec} level={level} enrolment={enrolment} parentName={parentName} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function HeroTile({
  rec, level, enrolment, parentName, onOpen,
}: {
  rec: KpiRecord;
  level: Level;
  enrolment?: number;
  parentName?: string;
  onOpen?: (rec: KpiRecord) => void;
}) {
  const { t, tn, lang } = useT();
  const kpi = rec.kpi;
  const ds = heroStatus(rec);
  const c = rag(ds);
  const v = rec.value as number;
  const strat = kpi.displayStrategy;
  const name = tn(kpi.name, kpi.name_gu);
  const isContextDelta = strat === "delta_cycle";

  // N+1 comparison — the next-level-up entity's NAME + this KPI's score at that level,
  // shown for EVERY indicator (consistent with the domain cards and the KPI cards).
  // Hidden only at State (no parent level) and where there is no published figure.
  const peerLevel = peerLevelOf(level);
  const peerScore = peerLevel ? peerAvg(kpi.id, level) : null;
  const target = (kpi.target ?? "").replace(/[^0-9]/g, "") || "2";
  const chronicRate = kpi.unit === "count" && enrolment && enrolment > 0 ? (v / enrolment) * 100 : null;

  // ── ONE dominant value (neutral; green/red only for a cycle delta, by direction) ──
  const valueEl = isContextDelta ? (
    <span className={cn("text-2xl font-extrabold tnum", deltaToneClass(v, kpi.direction))}>{formatDelta(v, "%", lang)}</span>
  ) : kpi.unit === "ratio" ? (
    <span className="text-2xl font-extrabold tnum text-neutral-900">{locNum(v, lang)}<span className="text-sm font-bold text-neutral-400"> / {locNum(target, lang)}</span></span>
  ) : kpi.id === "sq_gsqac" ? (
    <span className="flex items-center gap-1.5">
      <span className="text-2xl font-extrabold tnum text-neutral-900">{locNum(Math.round(v), lang)}</span>
      <RatingBadge grade={gradeFor(v, GSQAC_BANDS).grade} size="sm" />
    </span>
  ) : (
    <span className="text-2xl font-extrabold tnum text-neutral-900">{formatValue(v, kpi.unit, lang)}</span>
  );

  // ── ONE supporting line: the shared N+1 parent comparison, else a contextual fallback ──
  const hasPeer = peerScore != null && !!parentName;
  let fallback: ReactNode = null;
  if (!hasPeer) {
    if (isContextDelta) fallback = t("scorecard.vsLastCycle");
    else if (kpi.unit === "count") fallback = chronicRate != null ? `${pct(chronicRate, lang)} ${t("ogm.ofEnrolled")}` : t("ogm.studentsCount");
    else if (kpi.unit === "ratio") fallback = t("ogm.perMonthMax2");
  }

  // ── micro-viz: a frequency-appropriate mini trend for every hero ──
  const trendPts = buildTrend(rec, lang).points.map((p) => p.value);
  const microViz = trendPts.length > 1 ? <Sparkline data={trendPts} color={c.hex} width={120} height={24} /> : null;

  return (
    <Card
      as="button"
      onClick={() => onOpen?.(rec)}
      className="card-pad group flex w-full items-center gap-3 text-left transition-shadow hover:shadow-raised"
    >
      <StatusDot status={ds} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold leading-snug text-neutral-800">{name}</span>
          <FrequencyBadge frequency={kpi.frequency} className="shrink-0" />
        </div>
        {hasPeer ? (
          <NPlusOneLine parentName={parentName} value={peerScore} unit={kpi.unit} lang={lang} signed={isContextDelta} className="mt-0.5" />
        ) : fallback != null ? (
          <span className="mt-0.5 block text-2xs text-neutral-400">{fallback}</span>
        ) : null}
      </div>
      {microViz && <div className="hidden shrink-0 items-end sm:flex">{microViz}</div>}
      <div className="shrink-0 text-right">{valueEl}</div>
    </Card>
  );
}
