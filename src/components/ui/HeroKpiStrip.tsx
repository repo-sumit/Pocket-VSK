import type { ReactNode } from "react";
import type { KpiRecord, Level, RagStatus } from "@/types";
import { cn } from "@/lib/cn";
import { rag, deltaToneClass } from "@/lib/colors";
import { formatValue, formatDelta, locNum, pct } from "@/lib/format";
import { peerAvg, peerGapOf, peerLevelOf } from "@/lib/peer";
import { buildTrend } from "@/lib/trend";
import { gradeFor, GSQAC_BANDS } from "@/config/ratingBands";
import { useT } from "@/i18n";
import { isImproving, statusFromGrade } from "@/engine";
import { Card, StatusDot } from "./atoms";
import { Sparkline } from "./Sparkline";
import { RatingBadge } from "./RatingBadge";
import { FrequencyBadge } from "./DataBadges";

/**
 * "What to act on" — the official green-flagged HERO indicators (config-driven
 * via `kpi.hero`): intervention levers, not vanity numbers. Ordered most-at-risk
 * first. ONE card anatomy, reused across all of them and aligned:
 *   row 1  label (2-line, fixed height) + frequency chip (top-right) + status dot
 *   row 2  ONE dominant value (neutral; grade badge for GSQAC; green/red for a cycle delta)
 *   row 3  ONE supporting line (vs {level} avg / vs target / % of enrolled / vs last cycle)
 *   row 4  micro-viz pinned to the base (sparkline for daily, compliance bar for monthly %)
 * Colour is reserved for status (the dot), grade (the badge) and trend (the delta).
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
  records, level, enrolment, onOpen,
}: { records: KpiRecord[]; level: Level; enrolment?: number; onOpen?: (rec: KpiRecord) => void }) {
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
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-2">
        <p className="section-title !mb-0">{t("ogm.heroKpis")}</p>
        <span className="text-2xs text-neutral-400">{t("ogm.heroKpisHint")}</span>
      </div>
      <div className="grid grid-cols-2 items-stretch gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {heroes.map((rec) => (
          <HeroTile key={rec.kpi.id} rec={rec} level={level} enrolment={enrolment} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function HeroTile({
  rec, level, enrolment, onOpen,
}: {
  rec: KpiRecord;
  level: Level;
  enrolment?: number;
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

  // N+1 comparison — for level/rate indicators (%/score). At State (no parent) and
  // for genuinely period-to-period cadences only, fall back to vs-previous-period.
  // Skipped for counts/ratios, cycle deltas, and GSQAC (no real next-level baseline).
  const showPeer = (kpi.unit === "%" || kpi.unit === "score") && !isContextDelta && !kpi.id.startsWith("sq_");
  const peerLevel = peerLevelOf(level);
  const peer = showPeer && peerLevel ? peerGapOf(v, peerAvg(kpi.id, level), kpi.direction) : null;
  const allowPrevFallback = kpi.frequency === "Daily" || kpi.frequency === "Weekly" || kpi.frequency === "Monthly";
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

  // ── ONE supporting line ──
  let supporting: ReactNode = null;
  if (peer && peerLevel) {
    supporting = (
      <>
        {t(`levels.${peerLevel}`)} {locNum(Math.round(peer.peer), lang)}{kpi.unit === "%" ? "%" : ""} ·{" "}
        <span className={cn("font-semibold", peer.ahead ? "text-rag-greenText" : "text-rag-redText")}>
          {formatDelta(peer.gap, kpi.unit === "%" ? "%" : "score", lang)} {peer.ahead ? t("scorecard.ahead") : t("scorecard.behind")}
        </span>
        {kpi.id === "ret_reenroll" && <> · {t("ogm.vsTarget")}</>}
      </>
    );
  } else if (showPeer && !peerLevel && allowPrevFallback && rec.deltaWoW != null) {
    supporting = (
      <>
        {t("ogm.vsPrevPeriod")}{" "}
        <span className={cn("font-semibold", isImproving(rec.trend, kpi.direction) ? "text-rag-greenText" : rec.deltaWoW === 0 ? "text-neutral-400" : "text-rag-redText")}>
          {formatDelta(rec.deltaWoW, kpi.unit === "%" ? "%" : "score", lang)}
        </span>
        {kpi.id === "ret_reenroll" && <> · {t("ogm.vsTarget")}</>}
      </>
    );
  } else if (kpi.id === "ret_reenroll") {
    supporting = t("ogm.vsTarget");
  } else if (isContextDelta) {
    supporting = t("scorecard.vsLastCycle");
  } else if (kpi.unit === "count") {
    supporting = chronicRate != null ? `${pct(chronicRate, lang)} ${t("ogm.ofEnrolled")}` : t("ogm.studentsCount");
  } else if (kpi.unit === "ratio") {
    supporting = t("ogm.perMonthMax2");
  }

  // ── micro-viz: a frequency-appropriate mini trend for every hero ──
  const trendPts = buildTrend(rec, lang).points.map((p) => p.value);
  const microViz = trendPts.length > 1 ? <Sparkline data={trendPts} color={c.hex} width={120} height={24} /> : null;

  return (
    <Card
      as="button"
      onClick={() => onOpen?.(rec)}
      className="card-pad group flex h-full w-full flex-col gap-2 text-left transition-shadow hover:shadow-raised"
    >
      {/* label + freq chip + status dot (fixed-height label keeps value baselines aligned) */}
      <div className="flex items-start justify-between gap-1.5">
        <span className="flex min-h-[2.3em] min-w-0 items-start gap-1.5">
          <StatusDot status={ds} className="mt-[3px] shrink-0" />
          <span title={name} className="line-clamp-2 text-2xs font-semibold leading-tight text-neutral-600">{name}</span>
        </span>
        <FrequencyBadge frequency={kpi.frequency} className="shrink-0" />
      </div>

      {/* one dominant value */}
      <div className="min-w-0">{valueEl}</div>

      {/* one supporting line */}
      {supporting != null && <span className="block truncate text-2xs text-neutral-400">{supporting}</span>}

      {/* micro-viz, pinned to the base so it aligns across the strip */}
      {microViz && <div className="mt-auto flex h-6 items-end pt-1">{microViz}</div>}
    </Card>
  );
}
