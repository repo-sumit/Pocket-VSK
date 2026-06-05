import type { DomainDef, FrameworkConfig, SubDomainDef } from "@/types";
import { GSQAC_BANDS } from "./ratingBands";
import { VSK_KPIS } from "./kpiCatalog";

const ALL_LEVELS = ["state", "district", "block", "cluster", "school", "grade", "section"] as const;

/**
 * THE single Unified Portal framework — 5A (= GSQAC). A1–A5 only; SQAF and the
 * old A6/District domains are gone. Engine stays fully config-driven (adding a
 * domain/KPI/sub-domain is a config change, no code edit).
 *
 * ⚠ Domain weightages are PLACEHOLDERS pending State sign-off; they sum to 100%.
 */
const WEIGHTAGE_PLACEHOLDER = true; // domain weightages below await State approval

// A4 sub-domains: a configurable 3-tier seam (Domain > Sub-Domain > Indicator).
// Placeholder grouping pending the full sub-domain/indicator breakdown (Chaitanya).
const A4_SUBS: SubDomainDef[] = [
  { id: "a4_schemes", name: "Schemes & Payments", name_gu: "યોજનાઓ અને ચુકવણી" },
  { id: "a4_grievances", name: "Grievances & Issues", name_gu: "ફરિયાદો અને સમસ્યાઓ" },
  { id: "a4_district", name: "District Tracking", name_gu: "જિલ્લા સ્તરનું ટ્રેકિંગ" },
];

const UNIFIED_DOMAINS: DomainDef[] = [
  d("a1", "A1 · Attendance & Access", "A1 · હાજરી અને પહોંચ", 0.2, 0, "CalendarCheck", "blue"),
  d("a2", "A2 · Assessment & Learning", "A2 · મૂલ્યાંકન અને અધ્યયન", 0.3, 1, "ClipboardCheck", "green"),
  d("a3", "A3 · TPD for Teachers", "A3 · શિક્ષક વ્યાવસાયિક વિકાસ", 0.1, 2, "GraduationCap", "yellow"),
  d("a4", "A4 · Administration & Service Delivery", "A4 · વહીવટ અને સેવા વિતરણ", 0.2, 3, "Building2", "orange", A4_SUBS),
  d("a5", "A5 · School Quality (GSQAC)", "A5 · શાળા ગુણવત્તા (GSQAC)", 0.2, 4, "Award", "pink"),
];

export const UNIFIED_FRAMEWORK: FrameworkConfig = {
  id: "unified",
  name: "Unified Portal · 5A",
  name_gu: "Unified Portal · 5A",
  levels: [...ALL_LEVELS],
  rating_bands: GSQAC_BANDS,
  domains: UNIFIED_DOMAINS,
  kpis: VSK_KPIS,
};

/** true when domain weightages are still placeholders (shown in the UI). */
export const WEIGHTAGE_IS_PLACEHOLDER = WEIGHTAGE_PLACEHOLDER;

function d(
  id: string,
  name: string,
  name_gu: string,
  weightage: number,
  sort_order: number,
  icon: string,
  accent: string,
  sub_domains?: SubDomainDef[],
): DomainDef {
  return { id, framework: "unified", name, name_gu, weightage, sort_order, icon, accent, sub_domains };
}

export const DEFAULT_FRAMEWORK_ID = "unified";

/** Single framework — `id` is accepted for backward-compat but ignored. */
export function getFramework(_id?: string): FrameworkConfig {
  return UNIFIED_FRAMEWORK;
}
