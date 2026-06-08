import type { DomainDef, FrameworkConfig, SubDomainDef } from "@/types";
import { GSQAC_BANDS } from "./ratingBands";
import { VSK_KPIS } from "./kpiCatalog";

const ALL_LEVELS = ["state", "district", "block", "cluster", "school", "grade", "section"] as const;

/**
 * Unified Portal · 4A Input-Output model (replaces the old 5A).
 *  • Inputs (dynamic): Attendance 30% · Assessment 30% · Administration 40%
 *    → the headline "Input Composite" the user can act on.
 *  • Output (annual): School Quality (= GSQAC, displayed as-is, vs last cycle).
 * Concept: improve the 3 inputs → School Quality rises. The engine is fully
 * config-driven, so domains/sub-domains/indicators are data, not code.
 *
 * ⚠ Input weightages (30/30/40) are the CEO-agreed default; kept configurable.
 */
const WEIGHTAGE_PLACEHOLDER = true;

/** Administration's 7 sub-domains — the 3-tier seam (Domain > Sub-Domain > Indicator). */
const ADMIN_SUBS: SubDomainDef[] = [
  { id: "adm_teachers", name: "Teachers (TPD)", name_gu: "શિક્ષકો (TPD)" },
  { id: "adm_schemes", name: "Scheme & Payment Delivery", name_gu: "યોજના અને ચુકવણી" },
  { id: "adm_resources", name: "Resource Usage", name_gu: "સંસાધન ઉપયોગ" },
  { id: "adm_programs", name: "Program Implementation", name_gu: "કાર્યક્રમ અમલીકરણ" },
  { id: "adm_visits", name: "Visits & Observations", name_gu: "મુલાકાત અને નિરીક્ષણ" },
  { id: "adm_issues", name: "Issue & Risk Resolution", name_gu: "સમસ્યા અને જોખમ નિવારણ" },
  { id: "adm_retention", name: "Retention & SSA Fund Usage", name_gu: "જાળવણી અને SSA ભંડોળ" },
];

const UNIFIED_DOMAINS: DomainDef[] = [
  d("attendance", "Attendance", "હાજરી", 0.3, 0, "CalendarCheck", "blue", "input"),
  d("assessment", "Assessment", "મૂલ્યાંકન", 0.3, 1, "ClipboardCheck", "green", "input"),
  d("administration", "Administration", "વહીવટ", 0.4, 2, "Building2", "orange", "input", ADMIN_SUBS),
  d("school_quality", "School Quality", "શાળા ગુણવત્તા", 0, 3, "Award", "pink", "output"),
];

export const UNIFIED_FRAMEWORK: FrameworkConfig = {
  id: "unified",
  name: "Unified Portal · 4A",
  name_gu: "Unified Portal · 4A",
  levels: [...ALL_LEVELS],
  rating_bands: GSQAC_BANDS,
  domains: UNIFIED_DOMAINS,
  kpis: VSK_KPIS,
};

/** true when input weightages are still the agreed-default placeholders (shown in UI). */
export const WEIGHTAGE_IS_PLACEHOLDER = WEIGHTAGE_PLACEHOLDER;

/** the 3 input domains feed the headline composite; the output is standalone. */
export const INPUT_DOMAIN_IDS = ["attendance", "assessment", "administration"] as const;
export const OUTPUT_DOMAIN_ID = "school_quality";

function d(
  id: string,
  name: string,
  name_gu: string,
  weightage: number,
  sort_order: number,
  icon: string,
  accent: string,
  kind: "input" | "output",
  sub_domains?: SubDomainDef[],
): DomainDef {
  return { id, framework: "unified", name, name_gu, weightage, sort_order, icon, accent, kind, sub_domains };
}

export const DEFAULT_FRAMEWORK_ID = "unified";

/** Single framework — `id` is accepted for backward-compat but ignored. */
export function getFramework(_id?: string): FrameworkConfig {
  return UNIFIED_FRAMEWORK;
}
