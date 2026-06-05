import type { DomainDef, FrameworkConfig, KpiDef, LevelRepresentation } from "@/types";
import { GSQAC_BANDS, SQAF_BANDS } from "./ratingBands";
import { VSK_KPIS } from "./kpiCatalog";

const ALL_LEVELS = ["state", "district", "block", "cluster", "school", "grade", "section"] as const;

/** school-and-up %-KPI, NA below school (used by GSQAC/SQAF sub-domain KPIs). */
const schoolAvg = (): LevelRepresentation => ({
  section: "NA",
  grade: "NA",
  school: "school",
  cluster: "avg",
  block: "avg",
  district: "avg",
  state: "avg",
});

// ════════════════════════════════════════════════════════════════════
// 1) VSK 6A — the primary framework (Attendance, Assessment, Adaptive
//    Learning & TPD, Administration, School Quality, Governance) + the
//    district-tracking extras.
// ════════════════════════════════════════════════════════════════════
const VSK_DOMAINS: DomainDef[] = [
  d("attendance", "Attendance", "હાજરી", 0.15, 0, "CalendarCheck", "blue"),
  d("assessment", "Assessment", "મૂલ્યાંકન", 0.25, 1, "ClipboardCheck", "mint"),
  d("adaptive", "Adaptive Learning & TPD", "અનુકૂલિત શિક્ષણ અને TPD", 0.15, 2, "GraduationCap", "purple"),
  d("administration", "Administration", "વહીવટ", 0.1, 3, "Building2", "orange"),
  d("quality", "School Quality (GSQAC)", "શાળા ગુણવત્તા (GSQAC)", 0.2, 4, "Award", "green"),
  d("governance", "Governance & Monitoring", "સંચાલન અને દેખરેખ", 0.15, 5, "Gauge", "yellow"),
  // weightage 0 ⇒ informational only, excluded from the overall score.
  d("district", "District Tracking", "જિલ્લા સ્તરનું ટ્રેકિંગ", 0, 6, "Map", "cream"),
];

export const VSK_FRAMEWORK: FrameworkConfig = {
  id: "vsk6a",
  name: "VSK 6A",
  name_gu: "VSK 6A",
  levels: [...ALL_LEVELS],
  rating_bands: GSQAC_BANDS,
  domains: VSK_DOMAINS,
  kpis: VSK_KPIS,
};

// ════════════════════════════════════════════════════════════════════
// 2) GSQAC — the 5-domain school-quality model (D1–D5, 1000 pts).
//    Weightage derived from the point allocation (520/50/50/80/300).
// ════════════════════════════════════════════════════════════════════
const GSQAC_DOMAINS: DomainDef[] = [
  d("d1", "Learning & Teaching", "અધ્યયન અને અધ્યાપન", 0.52, 0, "BookOpen", "blue"),
  d("d2", "School Administration", "શાળા વહીવટ", 0.05, 1, "Building2", "orange"),
  d("d3", "Co-curricular Activities", "સહ-અભ્યાસિક પ્રવૃત્તિઓ", 0.05, 2, "Drama", "pink"),
  d("d4", "Resources & their Use", "સંસાધનો અને તેમનો ઉપયોગ", 0.08, 3, "Boxes", "mint"),
  d("d5", "Participation in Scholarships", "શિષ્યવૃત્તિમાં સહભાગિતા", 0.3, 4, "Trophy", "cream"),
];

const GSQAC_KPIS: KpiDef[] = [
  gk("g_unit_test", "d1", "1.1 Unit Test", "૧.૧ એકમ કસોટી", 0),
  gk("g_summative", "d1", "1.2 Summative Test", "૧.૨ સત્રાંત કસોટી", 1),
  gk("g_rwn", "d1", "1.3 Reading, Writing & Numeracy", "૧.૩ વાચન, લેખન અને ગણન", 2),
  gk("g_environment", "d1", "1.4 Effective Environment for Learning", "૧.૪ અસરકારક અધ્યયન વાતાવરણ", 3),
  gk("g_teacher_proc", "d1", "1.5 Teacher Learning Processes", "૧.૫ શિક્ષક અધ્યયન પ્રક્રિયાઓ", 4),
  gk("g_attendance", "d1", "1.6 Attendance at School", "૧.૬ શાળામાં હાજરી", 5),
  gk("g_management", "d2", "2.1 Management", "૨.૧ વ્યવસ્થાપન", 6),
  gk("g_safety", "d2", "2.2 Safety", "૨.૨ સલામતી", 7),
  gk("g_prayer", "d3", "3.1 Prayer Meeting", "૩.૧ પ્રાર્થના સભા", 8),
  gk("g_sports", "d3", "3.2 Yoga & Sports", "૩.૨ યોગ અને રમતગમત", 9),
  gk("g_special", "d3", "3.3 Participation in Special Activities", "૩.૩ વિશેષ પ્રવૃત્તિઓમાં સહભાગિતા", 10),
  gk("g_library", "d4", "4.1 Use of Library", "૪.૧ પુસ્તકાલયનો ઉપયોગ", 11),
  gk("g_tech", "d4", "4.2 Use of Technology", "૪.૨ ટેકનોલોજીનો ઉપયોગ", 12),
  gk("g_mdm", "d4", "4.3 Mid-day Meals", "૪.૩ મધ્યાહન ભોજન", 13),
  gk("g_wash", "d4", "4.4 Water, Toilets & Sanitation", "૪.૪ પાણી, શૌચાલય અને સ્વચ્છતા", 14),
  gk("g_cet", "d5", "5.1 CET", "૫.૧ CET", 15),
  gk("g_cgms", "d5", "5.2 CGMS", "૫.૨ CGMS", 16),
];

export const GSQAC_FRAMEWORK: FrameworkConfig = {
  id: "gsqac",
  name: "GSQAC",
  name_gu: "GSQAC",
  levels: [...ALL_LEVELS],
  rating_bands: GSQAC_BANDS,
  domains: GSQAC_DOMAINS,
  kpis: GSQAC_KPIS,
};

// ════════════════════════════════════════════════════════════════════
// 3) SQAF — the Himachal 6-domain School Report Card model. Proves the
//    engine is KPI-agnostic: switching here re-renders the whole app.
// ════════════════════════════════════════════════════════════════════
const SQAF_DOMAINS: DomainDef[] = [
  d("access", "Access", "પહોંચ", 0.12, 0, "DoorOpen", "blue"),
  d("infra", "Infrastructure & Facilities", "માળખાગત સુવિધાઓ", 0.12, 1, "Building2", "orange"),
  d("inclusive", "Inclusive Practices", "સમાવેશી પ્રથાઓ", 0.12, 2, "Users", "pink"),
  d("sqaf_gov", "Governance", "શાસન", 0.12, 3, "Landmark", "yellow"),
  d("teacher", "Teacher Performance & Development", "શિક્ષક પ્રદર્શન અને વિકાસ", 0.12, 4, "GraduationCap", "purple"),
  d("learning", "Learning", "અધ્યયન", 0.4, 5, "BookOpen", "mint"),
];

const SQAF_KPIS: KpiDef[] = [
  sk("s_accessibility", "access", "School accessibility", "શાળાની સુલભતા", 0),
  sk("s_enrolment", "access", "Enrolment", "નોંધણી", 1),
  sk("s_retention", "access", "Retention rate", "જાળવણી દર", 2),
  sk("s_mdm", "infra", "Mid Day Meal Scheme", "મધ્યાહન ભોજન યોજના", 3),
  sk("s_electricity", "infra", "Electricity", "વીજળી", 4),
  sk("s_wash", "infra", "Water, Sanitation & Waste", "પાણી, સ્વચ્છતા અને કચરો", 5),
  sk("s_ict", "infra", "ICT Infrastructure", "ICT માળખું", 6),
  sk("s_cwsn", "inclusive", "Inclusion of CWSN", "CWSN સમાવેશ", 7),
  sk("s_gender", "inclusive", "Gender Equality", "લિંગ સમાનતા", 8),
  sk("s_cocurricular", "inclusive", "Co-Curricular Activities", "સહ-અભ્યાસિક પ્રવૃત્તિઓ", 9),
  sk("s_records", "sqaf_gov", "Data & Record Maintenance", "ડેટા અને રેકોર્ડ જાળવણી", 10),
  sk("s_smc", "sqaf_gov", "SMC / SDMC Management", "SMC / SDMC વ્યવસ્થાપન", 11),
  sk("s_cpd", "teacher", "Capacity Building & CPD", "ક્ષમતા નિર્માણ અને CPD", 12),
  sk("s_teacher_att", "teacher", "Teachers' Attendance", "શિક્ષકોની હાજરી", 13),
  sk("s_fln", "learning", "Foundational Literacy & Numeracy", "પાયાનું સાક્ષરતા અને ગણન", 14),
  sk("s_outcomes", "learning", "Assessment of Learning Outcomes", "અધ્યયન પરિણામોનું મૂલ્યાંકન", 15),
  sk("s_performance", "learning", "Student Performance", "વિદ્યાર્થી પ્રદર્શન", 16),
  sk("s_enhancement", "learning", "Learning Enhancement", "અધ્યયન સંવર્ધન", 17),
];

export const SQAF_FRAMEWORK: FrameworkConfig = {
  id: "sqaf",
  name: "Himachal SQAF",
  name_gu: "હિમાચલ SQAF",
  levels: [...ALL_LEVELS],
  rating_bands: SQAF_BANDS,
  domains: SQAF_DOMAINS,
  kpis: SQAF_KPIS,
};

// ── builders ─────────────────────────────────────────────────────────
function d(
  id: string,
  name: string,
  name_gu: string,
  weightage: number,
  sort_order: number,
  icon: string,
  accent: string,
): DomainDef {
  return { id, framework: "", name, name_gu, weightage, sort_order, icon, accent };
}

function gk(id: string, domain_id: string, name: string, name_gu: string, sort_order: number): KpiDef {
  return {
    id,
    domain_id,
    name,
    name_gu,
    unit: "%",
    direction: "higher",
    data_source: "GSQAC · Saksham Shala",
    target: "≥ 70%",
    level_representation: schoolAvg(),
    sort_order,
  };
}

function sk(id: string, domain_id: string, name: string, name_gu: string, sort_order: number): KpiDef {
  return {
    id,
    domain_id,
    name,
    name_gu,
    unit: "%",
    direction: "higher",
    data_source: "SQAF Self-Assessment",
    target: "≥ 70%",
    level_representation: schoolAvg(),
    sort_order,
  };
}

export const FRAMEWORKS: Record<string, FrameworkConfig> = {
  vsk6a: stamp(VSK_FRAMEWORK),
  gsqac: stamp(GSQAC_FRAMEWORK),
  sqaf: stamp(SQAF_FRAMEWORK),
};

/** stamp each domain with its framework id (kept off the literals above). */
function stamp(fc: FrameworkConfig): FrameworkConfig {
  return { ...fc, domains: fc.domains.map((dm) => ({ ...dm, framework: fc.id })) };
}

export const DEFAULT_FRAMEWORK_ID =
  (import.meta.env?.VITE_DEFAULT_FRAMEWORK as string) || "vsk6a";

export function getFramework(id: string): FrameworkConfig {
  return FRAMEWORKS[id] ?? FRAMEWORKS[DEFAULT_FRAMEWORK_ID] ?? FRAMEWORKS.vsk6a;
}
