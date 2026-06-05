import type { Entity, FrameworkConfig, KpiDef, LeaderboardEntry, Period, Role } from "@/types";
import type { RawSeries } from "@/data/provider";
import { gradeFor } from "@/config/ratingBands";
import { statusFromGrade } from "./rag";
import { scoreEntity } from "./score";

/**
 * Rank a set of peer entities by overall %, with rank-movement vs last week.
 * Rewards *improvement* (deltaWoW) as well as absolute position, so low
 * performers are encouraged rather than shamed.
 */
export function buildLeaderboard(
  fw: FrameworkConfig,
  peers: Entity[],
  currentEntityId: string | null,
  getSeries: (e: Entity, k: KpiDef) => RawSeries,
  periods: Period[],
  role?: Role,
): LeaderboardEntry[] {
  const prevPeriods = periods.length > 1 ? periods.slice(0, -1) : periods;

  const scored = peers.map((entity) => {
    const now = scoreEntity(fw, entity, getSeries, periods, role).percent;
    const prev = scoreEntity(fw, entity, getSeries, prevPeriods, role).percent;
    return { entity, now, prev };
  });

  // entities with no data (null) sort to the bottom and render as NA.
  const byNow = [...scored].sort((a, b) => (b.now ?? -1) - (a.now ?? -1));
  const byPrev = [...scored].sort((a, b) => (b.prev ?? -1) - (a.prev ?? -1));
  const prevRankOf = new Map(byPrev.map((s, i) => [s.entity.id, i + 1]));

  return byNow.map((s, i) => {
    const rank = i + 1;
    const prevRank = prevRankOf.get(s.entity.id) ?? null;
    const band = s.now != null ? gradeFor(s.now, fw.rating_bands) : null;
    return {
      entity: s.entity,
      rank,
      prevRank,
      rankDelta: prevRank != null ? prevRank - rank : null,
      percent: s.now,
      grade: band ? band.grade : null,
      status: band ? statusFromGrade(band.group) : "na",
      deltaWoW: s.now != null && s.prev != null ? round1(s.now - s.prev) : null,
      isCurrent: s.entity.id === currentEntityId,
    };
  });
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}
