import type { RatingBand } from "@/types";

/**
 * GSQAC fine grade scale A++++ → D, grouped into broad bands A/B/C/D
 * (per GSQAC model-documentation: Grade_Sort[Grades] / [Grades (groups)]).
 * All thresholds are config — switching a framework swaps these rows.
 */
export const GSQAC_BANDS: RatingBand[] = [
  { grade: "A++++", min: 90, group: "A" },
  { grade: "A+++", min: 85, group: "A" },
  { grade: "A++", min: 80, group: "A" },
  { grade: "A+", min: 75, group: "A" },
  { grade: "A", min: 70, group: "A" },
  { grade: "B", min: 50, group: "B" },
  { grade: "C", min: 30, group: "C" },
  { grade: "D", min: 0, group: "D" },
];

/** RAG thresholds on a 0..100 achievement scale (per-KPI overridable). */
export const RAG_DEFAULT = { green: 85, amber: 65 } as const;

export function gradeFor(percent: number, bands: RatingBand[]): RatingBand {
  // bands are highest-min first; return the first whose min is met.
  const sorted = [...bands].sort((a, b) => b.min - a.min);
  return sorted.find((b) => percent >= b.min) ?? sorted[sorted.length - 1];
}
