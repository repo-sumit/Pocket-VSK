import type { Level, Role } from "@/types";
import { PUBLISHED } from "./kpiCatalog";

/**
 * KPI applicability (CSV "—" = NOT APPLICABLE → hidden, never "NA"-clutter).
 * Two layers:
 *  • ROLE set — which indicators a persona's scorecard shows (Teacher is the
 *    only restricted persona; officers/principal see everything that applies).
 *  • LEVEL set — which entity levels an indicator is meaningful at (drives the
 *    cross-level comparison + drill; "—" in the sheet ⇒ no published value ⇒ hidden).
 */

/** Grade & Section LEVELS → the classroom-level attendance + assessment indicators. */
export const GRADE_SECTION_KPIS = new Set<string>([
  "att_teacher", "att_student", "att_mdm", "att_irregular", "att_chronic",
  "asm_participation", "asm_sat1", "asm_sat2", "asm_cet", "asm_cgms", "asm_nas",
  "asm_below", "asm_improvement", "asm_orf_fln", "asm_classroom_prep", "asm_sma_remediation",
]);

/** Teacher persona → their classroom indicators + own TPD + school-quality context. */
export const TEACHER_KPIS = new Set<string>([
  ...GRADE_SECTION_KPIS,
  "att_report", "tpd_hours", "tpd_avg_hours", "module_completion", "sq_gsqac", "sq_improvement",
]);

export function kpiAppliesToRole(kpiId: string, role: Role): boolean {
  if (role === "teacher") return TEACHER_KPIS.has(kpiId);
  // principal + officers see everything; level applicability hides what's "—"
  return true;
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

/** count KPIs are compared as "avg per school", not raw totals (which grow with
 *  scope). schoolsImplied derives the per-school divisor from the published ratios. */
export function schoolsImplied(kpiId: string, level: Level): number {
  const p = PUBLISHED[kpiId];
  const school = p?.school;
  const here = p?.[level];
  if (!school || here == null || school === 0) return 1;
  return Math.max(1, Math.round(here / school));
}
