import type {
  Callout,
  CascadeRow,
  DomainScore,
  Entity,
  FrameworkConfig,
  KpiDef,
  KpiRecord,
  LeaderboardEntry,
  Level,
  Period,
  Role,
  Scorecard,
} from "@/types";
import { dataProvider, type RawSeries } from "@/data/provider";
import { gradeFor } from "@/config/ratingBands";
import { kpiApplies, kpiAppliesAtLevel } from "@/config/applicability";
import { buildDomainScore, buildKpiRecord, buildOverall, scoreEntity } from "./score";
import { buildLeaderboard } from "./leaderboard";
import { isImproving } from "./story";
import { kpiCascade, overallCascade } from "./rollup";

export * from "./rag";
export * from "./score";
export * from "./leaderboard";
export * from "./rollup";
export { kpiStory, isImproving } from "./story";

/** binds the provider so engine callers don't thread `getSeries` everywhere. */
const seriesFn = (periods: Period[]) => (e: Entity, k: KpiDef): RawSeries =>
  dataProvider.getValueSeries(e, k, periods);

// ── Scorecard ─────────────────────────────────────────────────────────
/** `role` (the viewing user) hides non-applicable KPIs entirely (§1). */
export function getScorecard(fw: FrameworkConfig, entityId: string, periods: Period[], role?: Role): Scorecard | null {
  const entity = dataProvider.getEntity(entityId);
  if (!entity) return null;
  const getSeries = seriesFn(periods);
  const ok = (kpiId: string, level: Level) => (role ? kpiApplies(kpiId, role, level) : kpiAppliesAtLevel(kpiId, level));

  const domainScores: DomainScore[] = fw.domains.map((domain) => {
    const recs = fw.kpis
      .filter((k) => k.domain_id === domain.id && ok(k.id, entity.level))
      .map((k) => buildKpiRecord(k, entity, getSeries(entity, k), periods));
    return buildDomainScore(domain, recs, fw.rating_bands);
  });

  const overall = buildOverall(domainScores, fw.rating_bands);

  // overall change vs last week (for the home "what changed" one-liner)
  const prevPeriods = periods.length > 1 ? periods.slice(0, -1) : periods;
  const prevOverall = scoreEntity(fw, entity, getSeries, prevPeriods, role).percent;
  const overallDeltaWoW = overall.percent != null && prevOverall != null ? round1(overall.percent - prevOverall) : null;

  // immediate parent for the "you vs the level above" comparison bars
  const ancestors = dataProvider.getAncestors(entityId);
  let parent: Scorecard["parent"];
  if (ancestors[0]) {
    const p = ancestors[0];
    const pScore = scoreEntity(fw, p, getSeries, periods, role);
    const domainPercents: Record<string, number | null> = {};
    pScore.domainScores.forEach((d) => (domainPercents[d.domain.id] = d.percent));
    parent = { entity: p, overallPercent: pScore.percent, domainPercents };
  }

  const callouts = buildCallouts(fw, domainScores, overall.percent);

  return {
    entity,
    period: periods[periods.length - 1]?.id ?? "",
    framework: fw,
    overallPercent: overall.percent,
    overallDeltaWoW,
    grade: overall.grade,
    gradeGroup: overall.group,
    status: overall.status,
    domainScores,
    parent,
    callouts,
  };
}

function buildCallouts(
  fw: FrameworkConfig,
  domainScores: DomainScore[],
  overallPercent: number | null,
): Callout[] {
  const out: Callout[] = [];
  const scored = domainScores.filter((d) => d.weightage > 0 && d.percent != null);

  // needs attention — lowest-scoring weighted domain
  const weakest = [...scored].sort((a, b) => (a.percent as number) - (b.percent as number))[0];
  if (weakest) {
    out.push({
      kind: "needs_attention",
      domainId: weakest.domain.id,
      title: weakest.domain.name,
      title_gu: weakest.domain.name_gu,
      detail: "Biggest opportunity to grow your score.",
      detail_gu: "તમારો સ્કોર વધારવાની સૌથી મોટી તક.",
      delta: weakest.percent ?? undefined,
    });
  }

  // most improved — KPI with the largest genuine improvement this week
  let best: { rec: KpiRecord; gain: number } | null = null;
  for (const d of domainScores) {
    for (const r of d.records) {
      if (r.deltaWoW == null) continue;
      const gain = r.kpi.direction === "lower" ? -r.deltaWoW : r.deltaWoW;
      if (isImproving(r.trend, r.kpi.direction) && (!best || gain > best.gain)) best = { rec: r, gain };
    }
  }
  if (best && best.gain > 0.4) {
    out.push({
      kind: "most_improved",
      kpiId: best.rec.kpi.id,
      domainId: best.rec.kpi.domain_id,
      title: best.rec.kpi.name,
      title_gu: best.rec.kpi.name_gu,
      detail: `Up ${round1(Math.abs(best.gain))}${best.rec.kpi.unit === "%" ? "%" : ""} this week. Your top mover.`,
      detail_gu: `આ અઠવાડિયે ${round1(Math.abs(best.gain))}${best.rec.kpi.unit === "%" ? "%" : ""} વધ્યું. ટોચનો સુધારો.`,
      delta: round1(best.gain),
    });
  }

  // close the gap — points to the next grade band, naming the weakest domain
  if (overallPercent == null) return out;
  const band = gradeFor(overallPercent, fw.rating_bands);
  const sortedBands = [...fw.rating_bands].sort((a, b) => a.min - b.min);
  const next = sortedBands.find((b) => b.min > band.min);
  if (next && weakest) {
    const gap = round1(next.min - overallPercent);
    if (gap > 0 && gap <= 12) {
      out.push({
        kind: "close_gap",
        domainId: weakest.domain.id,
        title: `${gap} points from grade ${next.grade}`,
        title_gu: `ગ્રેડ ${next.grade} થી ${gap} પોઈન્ટ દૂર`,
        detail: `Close the gap in ${weakest.domain.name}.`,
        detail_gu: `${weakest.domain.name_gu} માં તફાવત ભરો.`,
        delta: gap,
      });
    }
  }
  return out;
}

// ── Single KPI record ──────────────────────────────────────────────────
export function getKpiRecord(fw: FrameworkConfig, kpiId: string, entityId: string, periods: Period[]): KpiRecord | null {
  const entity = dataProvider.getEntity(entityId);
  const kpi = fw.kpis.find((k) => k.id === kpiId);
  if (!entity || !kpi) return null;
  return buildKpiRecord(kpi, entity, dataProvider.getValueSeries(entity, kpi, periods), periods);
}

// ── Leaderboards ───────────────────────────────────────────────────────
/** peers at the same level (siblings) — ranked. */
export function getPeerLeaderboard(fw: FrameworkConfig, entityId: string, periods: Period[], role?: Role): LeaderboardEntry[] {
  const entity = dataProvider.getEntity(entityId);
  if (!entity) return [];
  const peers = [entity, ...dataProvider.getSiblings(entityId)];
  return buildLeaderboard(fw, peers, entityId, seriesFn(periods), periods, role);
}

/** the children directly below this entity — ranked (drill-down leaderboard). */
export function getChildLeaderboard(fw: FrameworkConfig, entityId: string, periods: Period[], role?: Role): LeaderboardEntry[] {
  const children = dataProvider.getChildren(entityId);
  if (!children.length) return [];
  return buildLeaderboard(fw, children, null, seriesFn(periods), periods, role);
}

// ── Cascade comparisons ────────────────────────────────────────────────
export function getOverallCascade(fw: FrameworkConfig, entityId: string, periods: Period[], role?: Role): CascadeRow[] {
  const entity = dataProvider.getEntity(entityId);
  if (!entity) return [];
  return overallCascade(fw, entity, dataProvider.getAncestors(entityId), seriesFn(periods), periods, role);
}

export function getKpiCascade(fw: FrameworkConfig, kpiId: string, entityId: string, periods: Period[]): CascadeRow[] {
  const entity = dataProvider.getEntity(entityId);
  const kpi = fw.kpis.find((k) => k.id === kpiId);
  if (!entity || !kpi) return [];
  // §7: own level + a representative entity at each level below (never above)
  const chain = [entity, ...representativeDescendants(entityId)];
  return kpiCascade(kpi, chain, entity, seriesFn(periods), periods);
}

/** one representative descendant per level beneath `entityId` (deterministic
 *  first-child walk) — used to show how a KPI compares down the levels. */
function representativeDescendants(entityId: string): Entity[] {
  const out: Entity[] = [];
  let cur = dataProvider.getEntity(entityId);
  while (cur) {
    const kids = dataProvider.getChildren(cur.id);
    if (!kids.length) break;
    out.push(kids[0]);
    cur = kids[0];
  }
  return out;
}

// ── Section comparison (sections of a grade ranked on a chosen KPI) ─────
export interface SectionCompareRow {
  entity: Entity;
  value: number | null;
  status: KpiRecord["status"];
  rank: number | null;
  isCurrent: boolean;
}

export function getKpiAmong(
  fw: FrameworkConfig,
  kpiId: string,
  entities: Entity[],
  periods: Period[],
  currentId?: string,
): SectionCompareRow[] {
  const kpi = fw.kpis.find((k) => k.id === kpiId);
  if (!kpi) return [];
  const getSeries = seriesFn(periods);
  const rows = entities.map((e) => {
    const rec = buildKpiRecord(kpi, e, getSeries(e, kpi), periods);
    return { entity: e, value: rec.value, status: rec.status, rank: null as number | null, isCurrent: e.id === currentId };
  });
  const withVals = rows.filter((r) => r.value != null).sort((a, b) => {
    const av = a.value as number, bv = b.value as number;
    return kpi.direction === "lower" ? av - bv : bv - av;
  });
  withVals.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

/** the levels a role/entity can drill DOWN into (one level beneath it). */
export function childLevelOf(level: Level): Level | null {
  const order: Level[] = ["state", "district", "block", "cluster", "school", "grade", "section"];
  const i = order.indexOf(level);
  return i >= 0 && i < order.length - 1 ? order[i + 1] : null;
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}
