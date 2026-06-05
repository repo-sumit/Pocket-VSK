export * from "./ratingBands";
export * from "./kpiCatalog";
export * from "./frameworks";

/** Periods: 8 weekly cycles so Δ WoW / Δ MoM + trends are real. */
import type { Period } from "@/types";

export const PERIODS: Period[] = buildPeriods(8);

function buildPeriods(n: number): Period[] {
  // Anchored to a fixed "current" week so the prototype is deterministic.
  const baseWeek = 23; // current = 2026-W23
  const year = 2026;
  const arr: Period[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const w = baseWeek - i;
    arr.push({
      id: `${year}-W${w}`,
      label: `Week ${w}`,
      kind: "week",
      index: n - 1 - i,
      weekStart: isoOfWeek(year, w),
    });
  }
  return arr;
}

export const CURRENT_PERIOD = (): Period => PERIODS[PERIODS.length - 1];
export const PREV_WEEK = (): Period => PERIODS[PERIODS.length - 2];
/** ~4 weeks back for Δ MoM. */
export const PREV_MONTH = (): Period => PERIODS[Math.max(0, PERIODS.length - 5)];

function isoOfWeek(year: number, week: number): string {
  // Monday of the ISO week (approximate, deterministic — display only).
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const day = simple.getUTCDay();
  const monday = new Date(simple);
  const diff = day <= 4 ? day - 1 : day - 8;
  monday.setUTCDate(simple.getUTCDate() - diff);
  return monday.toISOString().slice(0, 10);
}
