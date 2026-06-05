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
  Trend,
} from "@/types";
import type { RawSeries } from "@/data/provider";
import { gradeFor } from "@/config/ratingBands";
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

/** Domain % = weighted mean of its KPIs' normalized scores (NA excluded). */
export function buildDomainScore(domain: DomainDef, records: KpiRecord[], bands: RatingBand[]): DomainScore {
  const scored = records
    .map((r) => ({ r, s: normalizedScore(r.value, r.kpi, r.benchmark), w: r.kpi.weight ?? 1 }))
    .filter((x): x is { r: KpiRecord; s: number; w: number } => x.s != null);

  let percent: number | null = null;
  let grade: string | null = null;
  if (scored.length) {
    const wsum = scored.reduce((a, x) => a + x.w, 0);
    percent = round1(scored.reduce((a, x) => a + x.s * x.w, 0) / (wsum || 1));
    grade = gradeFor(percent, bands).grade;
  }
  const status = percent == null ? "na" : statusFromGrade(gradeFor(percent, bands).group);
  return {
    domain,
    percent,
    grade,
    status,
    weightage: domain.weightage,
    contribution: percent != null ? round1(domain.weightage * percent) : 0,
    records,
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

/** Overall = Σ(weightage × domain%) over scored domains, renormalised so
 *  all-NA domains don't drag the result; mapped to a letter grade.
 *  Returns NA (null) when no weighted domain has data at this level. */
export function buildOverall(domainScores: DomainScore[], bands: RatingBand[]): OverallResult {
  const scored = domainScores.filter((d) => d.weightage > 0 && d.percent != null);
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

/** Score any entity to a single overall % (used by leaderboards / cascade). */
export function scoreEntity(
  fw: FrameworkConfig,
  entity: Entity,
  getSeries: (e: Entity, k: KpiDef) => RawSeries,
  periods: Period[],
): { percent: number | null; result: OverallResult; domainScores: DomainScore[] } {
  const domainScores = fw.domains.map((domain) => {
    const recs = fw.kpis
      .filter((k) => k.domain_id === domain.id)
      .map((k) => buildKpiRecord(k, entity, getSeries(entity, k), periods));
    return buildDomainScore(domain, recs, fw.rating_bands);
  });
  const result = buildOverall(domainScores, fw.rating_bands);
  return { percent: result.percent, result, domainScores };
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}
