import type {
  DomainDef,
  DomainScore,
  Entity,
  FrameworkConfig,
  KpiDef,
  KpiRecord,
  Period,
  RagStatus,
  RatingBand,
  SubDomainScore,
  Trend,
} from "@/types";
import type { RawSeries } from "@/data/provider";
import type { Role } from "@/types";
import { gradeFor } from "@/config/ratingBands";
import { kpiApplies, kpiAppliesAtLevel } from "@/config/applicability";
import { kpiStatus, normalizedScore, statusFromGrade } from "./rag";
import { kpiStory } from "./story";

const EPS = 0.4;

/** Enrich a raw value series into the full per-KPI tile (the OGM shape). */
export function buildKpiRecord(kpi: KpiDef, entity: Entity, raw: RawSeries, periods: Period[]): KpiRecord {
  const valsByPeriod = new Map(raw.series.map((s) => [s.period, s.value]));
  const ordered = periods.map((p) => ({ period: p.id, value: valsByPeriod.get(p.id) ?? null }));
  const lastIdx = ordered.length - 1;
  const value = ordered[lastIdx]?.value ?? null;
  const prevWeek = ordered[lastIdx - 1]?.value ?? null;
  const prevMonth = ordered[Math.max(0, lastIdx - 4)]?.value ?? null;

  const deltaWoW = value != null && prevWeek != null ? round1(value - prevWeek) : null;
  const deltaMoM = value != null && prevMonth != null ? round1(value - prevMonth) : null;

  const trend = computeTrend(ordered, deltaWoW);
  const status = kpiStatus(value, kpi, raw.benchmark);
  const achievement = normalizedScore(value, kpi, raw.benchmark);
  const series = ordered.filter((s): s is { period: string; value: number } => s.value != null);

  const story = kpiStory({ kpi, value, benchmark: raw.benchmark, deltaWoW, status, trend });

  return {
    kpi,
    entityId: entity.id,
    level: entity.level,
    period: periods[lastIdx]?.id ?? "",
    value,
    benchmark: raw.benchmark,
    achievement,
    prevWeek,
    prevMonth,
    deltaWoW,
    deltaMoM,
    trend,
    status,
    series,
    remark: story.en,
    remark_gu: story.gu,
  };
}

function computeTrend(ordered: { value: number | null }[], deltaWoW: number | null): Trend {
  if (deltaWoW != null) {
    if (deltaWoW > EPS) return "up";
    if (deltaWoW < -EPS) return "down";
    return "flat";
  }
  const nums = ordered.map((o) => o.value).filter((v): v is number => v != null);
  if (nums.length < 2) return "flat";
  const slope = nums[nums.length - 1] - nums[0];
  if (slope > EPS) return "up";
  if (slope < -EPS) return "down";
  return "flat";
}

/** Indicators that fold into a score: % and 0–100 score (lower-is-better is
 *  inverted by normalizedScore). count/hours and `context` deltas (improvement/
 *  reduction %s) are CONTEXT — shown, not averaged. */
function isScored(kpi: KpiDef): boolean {
  return (kpi.unit === "%" || kpi.unit === "score") && !kpi.context;
}

/** weighted mean of a record set's normalized (0–100) scores; null if none scored. */
function meanScore(records: KpiRecord[]): number | null {
  const scored = records
    .filter((r) => isScored(r.kpi))
    .map((r) => ({ s: normalizedScore(r.value, r.kpi, r.benchmark), w: r.kpi.weight ?? 1 }))
    .filter((x): x is { s: number; w: number } => x.s != null);
  if (!scored.length) return null;
  const wsum = scored.reduce((a, x) => a + x.w, 0);
  return round1(scored.reduce((a, x) => a + x.s * x.w, 0) / (wsum || 1));
}

/**
 * Domain score (4A):
 *  • OUTPUT (School Quality) → the GSQAC overall, displayed as-is (the `score`
 *    indicator), NOT averaged with the improvement %.
 *  • domain WITH sub-domains (Administration) → mean of its sub-domain scores;
 *    each sub-domain = weighted mean of its scored indicators.
 *  • domain WITHOUT sub-domains → weighted mean of its scored indicators.
 */
export function buildDomainScore(domain: DomainDef, records: KpiRecord[], bands: RatingBand[]): DomainScore {
  let percent: number | null;
  let subScores: SubDomainScore[] = [];

  if (domain.kind === "output") {
    percent = records.find((r) => r.kpi.unit === "score")?.value ?? null; // GSQAC, as-is
  } else if (domain.sub_domains?.length) {
    subScores = domain.sub_domains
      .map((sub) => {
        const recs = records.filter((r) => r.kpi.sub_domain === sub.id);
        const p = meanScore(recs);
        return {
          sub,
          percent: p,
          grade: p == null ? null : gradeFor(p, bands).grade,
          status: p == null ? ("na" as RagStatus) : statusFromGrade(gradeFor(p, bands).group),
          records: recs,
        };
      })
      .filter((ss) => ss.records.length > 0);
    const ps = subScores.map((s) => s.percent).filter((v): v is number => v != null);
    percent = ps.length ? round1(ps.reduce((a, b) => a + b, 0) / ps.length) : null;
  } else {
    percent = meanScore(records);
  }

  const grade = percent == null ? null : gradeFor(percent, bands).grade;
  const status = percent == null ? "na" : statusFromGrade(gradeFor(percent, bands).group);
  return {
    domain,
    percent,
    grade,
    status,
    weightage: domain.weightage,
    contribution: percent != null ? round1(domain.weightage * percent) : 0,
    records,
    subScores,
  };
}

export interface OverallResult {
  /** null ⇒ no weighted domain has data here → explicit NA, not 0/D/red. */
  percent: number | null;
  grade: string | null;
  group: "A" | "B" | "C" | "D" | null;
  status: RagStatus;
  band: RatingBand | null;
}

/** Headline = the INPUT COMPOSITE: Σ(weightage × domain%) over the input
 *  domains only (Attendance 30 · Assessment 30 · Administration 40),
 *  renormalised so NA inputs don't drag it. School Quality (output) is shown
 *  standalone, never folded in. NA when no input domain has data here. */
export function buildOverall(domainScores: DomainScore[], bands: RatingBand[]): OverallResult {
  const scored = domainScores.filter((d) => d.domain.kind !== "output" && d.weightage > 0 && d.percent != null);
  const wsum = scored.reduce((a, d) => a + d.weightage, 0);
  if (wsum === 0 || scored.length === 0) {
    return { percent: null, grade: null, group: null, status: "na", band: null };
  }
  const percent = round1(scored.reduce((a, d) => a + d.weightage * (d.percent as number), 0) / wsum);
  const band = gradeFor(percent, bands);
  return {
    percent,
    grade: band.grade,
    group: band.group ?? "D",
    status: statusFromGrade(band.group),
    band,
  };
}

/** Whether a KPI applies for this (role, level) — role-aware when role given. */
function applies(kpiId: string, level: Entity["level"], role?: Role): boolean {
  return role ? kpiApplies(kpiId, role, level) : kpiAppliesAtLevel(kpiId, level);
}

/** Score any entity to a single overall % (used by leaderboards / cascade).
 *  Only KPIs applicable to the viewing role + level are counted. */
export function scoreEntity(
  fw: FrameworkConfig,
  entity: Entity,
  getSeries: (e: Entity, k: KpiDef) => RawSeries,
  periods: Period[],
  role?: Role,
): { percent: number | null; result: OverallResult; domainScores: DomainScore[] } {
  const domainScores = fw.domains.map((domain) => {
    const recs = fw.kpis
      .filter((k) => k.domain_id === domain.id && applies(k.id, entity.level, role))
      .map((k) => buildKpiRecord(k, entity, getSeries(entity, k), periods));
    return buildDomainScore(domain, recs, fw.rating_bands);
  });
  const result = buildOverall(domainScores, fw.rating_bands);
  return { percent: result.percent, result, domainScores };
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}
