import type { Level, Role } from "@/types";
import { PUBLISHED } from "./kpiCatalog";

/**
 * KPI applicability (VSK PDF "—" = NOT APPLICABLE → hide, never show "NA").
 * Two layers:
 *  • ROLE set — which KPIs a persona's scorecard shows.
 *  • LEVEL set — which entity levels a KPI is meaningful at (drives the
 *    cross-level comparison: a bar appears only where the KPI applies).
 */

/** Teacher persona → exactly these 14 (the KPIs with a Teacher column). */
export const TEACHER_KPIS = new Set([
  "att_pct", "att_chronic", "att_report", "asm_participation", "asm_result", "asm_below_result",
  "asm_improvement", "orf_fln", "module_completion", "tpd_hours", "dropout_reduction",
  "gsqac_score", "gsqac_improvement", "improvement_actions",
]);

/** Grade & Section LEVELS → only the 8 core attendance/assessment/learning KPIs. */
export const GRADE_SECTION_KPIS = new Set([
  "att_pct", "att_chronic", "asm_participation", "asm_result", "asm_below_result",
  "asm_improvement", "orf_fln", "module_completion",
]);

export function kpiAppliesToRole(kpiId: string, role: Role): boolean {
  if (role === "teacher") return TEACHER_KPIS.has(kpiId);
  if (role === "principal") return kpiId !== "grant_expenditure";
  return true; // crc / brc / deo / state → all 29
}

export function kpiAppliesAtLevel(kpiId: string, level: Level): boolean {
  if (level === "grade" || level === "section") return GRADE_SECTION_KPIS.has(kpiId);
  // school and up: applies only where the published table has a value ("—" ⇒ no)
  return PUBLISHED[kpiId]?.[level] != null;
}

/** A KPI shows on an entity's scorecard when it applies to BOTH the viewing
 *  role and the entity's level. */
export function kpiApplies(kpiId: string, role: Role, level: Level): boolean {
  return kpiAppliesToRole(kpiId, role) && kpiAppliesAtLevel(kpiId, level);
}

/** count KPIs must be compared as "avg per school", not raw totals (which grow
 *  with scope). schoolsImplied derives the per-school divisor from the published
 *  ratios so every level lands on the same per-school scale. */
export function schoolsImplied(kpiId: string, level: Level): number {
  const p = PUBLISHED[kpiId];
  const school = p?.school;
  const here = p?.[level];
  if (!school || here == null || school === 0) return 1;
  return Math.max(1, Math.round(here / school));
}
