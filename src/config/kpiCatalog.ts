import type { KpiDef, Level, LevelRepresentation, Representation } from "@/types";

/**
 * The VSK "6A" KPI catalog — seeded from OGM 3.0 (`KPI mapping_simplified`)
 * for the per-level cascading representation, and the Gujarat VSK KPI
 * Framework PDF for benchmark targets per level. Units / data-sources are
 * real; benchmark numbers are the framework targets. Adding a KPI here (or a
 * row in Supabase) makes it render everywhere with zero component changes.
 */

// ── level_representation builders (section → state) ──────────────────
const rep = (
  section: Representation,
  grade: Representation,
  school: Representation,
  up: Representation,
): LevelRepresentation => ({
  section,
  grade,
  school,
  cluster: up,
  block: up,
  district: up,
  state: up,
});

/** %-style KPI owned at the section/class level, averaged upward. */
const classAvg = () => rep("class", "avg", "school", "avg");
/** %-style KPI that only exists from the school up (NA at section/grade). */
const schoolAvg = () => rep("NA", "NA", "school", "avg");
/** count owned per school, summed upward (NA below school). */
const schoolSum = () => rep("NA", "NA", "count", "sum");
/** count of schools — an aggregate that only exists from the cluster up. */
const aggCount = () => rep("NA", "NA", "NA", "count");
/** district/state-only tracking metric (NA below block). */
const districtOnly = (): LevelRepresentation => ({
  section: "NA",
  grade: "NA",
  school: "NA",
  cluster: "NA",
  block: "avg",
  district: "avg",
  state: "avg",
});

/** Benchmark targets per level (from the VSK KPI Framework PDF).
 *  Teacher → section & grade; remaining levels map 1:1. */
export const BENCHMARKS: Record<string, Partial<Record<Level, number>>> = {
  att_pct: { section: 88, grade: 88, school: 91, cluster: 89, block: 87, district: 88, state: 89 },
  att_chronic: { school: 42, cluster: 210, block: 820, district: 4200, state: 48000 },
  att_below_bench: { cluster: 8, block: 27, district: 140, state: 1120 },
  att_report: { section: 100, grade: 100, school: 98, cluster: 97, block: 96, district: 97, state: 97 },
  att_ews: { section: 90, grade: 90, school: 88, cluster: 86, block: 84, district: 85, state: 84 },

  asm_participation: { section: 96, grade: 96, school: 94, cluster: 93, block: 92, district: 93, state: 93 },
  asm_result: { section: 68, grade: 68, school: 64, cluster: 61, block: 59, district: 61, state: 60 },
  asm_below: { section: 22, grade: 22, school: 26, cluster: 29, block: 31, district: 29, state: 30 },
  asm_improvement: { section: 12, grade: 12, school: 10, cluster: 9, block: 8, district: 9, state: 8 },
  asm_orf_fln: { section: 14, grade: 14, school: 11, cluster: 9, block: 8, district: 9, state: 8 },
  asm_reports: { school: 95, cluster: 94, block: 92, district: 93, state: 94 },

  adp_identified: { section: 72, grade: 72, school: 70, cluster: 68, block: 66, district: 68, state: 67 },
  adp_receiving: { section: 68, grade: 68, school: 66, cluster: 64, block: 62, district: 64, state: 63 },
  adp_module: { section: 71, grade: 71, school: 68, cluster: 66, block: 63, district: 65, state: 64 },
  adp_tpd: { section: 100, grade: 100, school: 92, cluster: 89, block: 86, district: 87, state: 87 },
  adp_post: { section: 60, grade: 60, school: 58, cluster: 56, block: 54, district: 56, state: 55 },

  adm_scheme: { school: 95, cluster: 94, block: 93, district: 94, state: 94 },
  adm_payment: { school: 94, cluster: 92, block: 91, district: 92, state: 92 },
  adm_pending: { school: 18, cluster: 110, block: 430, district: 2200, state: 21000 },
  adm_resolution: { school: 88, cluster: 85, block: 83, district: 85, state: 84 },
  adm_repeat: { school: 4, cluster: 21, block: 90, district: 470, state: 4800 },

  gsqac_score: { school: 72, cluster: 71, block: 69, district: 70, state: 70 },
  qual_meeting: { cluster: 71, block: 68, district: 70, state: 69 },
  qual_low_perf: { cluster: 7, block: 24, district: 118, state: 980 },
  qual_improvement: { school: 9, cluster: 8, block: 7, district: 8, state: 7 },
  qual_actions: { school: 84, cluster: 82, block: 79, district: 81, state: 80 },

  gov_sameday: { section: 95, grade: 95, school: 93, cluster: 91, block: 90, district: 92, state: 91 },
  gov_lag: { school: 1, cluster: 1.5, block: 2, district: 2, state: 2 },
  gov_pending: { school: 11, cluster: 74, block: 310, district: 1520, state: 14000 },
  gov_repeat: { school: 7, cluster: 8, block: 10, district: 9, state: 10 },
  gov_flagged: { school: 88, cluster: 85, block: 83, district: 84, state: 83 },

  dst_dropout: { block: 3.2, district: 2.9, state: 2.8 },
  dst_reenroll: { block: 78, district: 77, state: 76 },
  dst_grant: { block: 82, district: 80, state: 79 },
  dst_pmshri: { block: 74, district: 72, state: 72 },
};

type CatItem = Omit<KpiDef, "sort_order"> & { sort_order?: number };

const CATALOG: CatItem[] = [
  // ── A. Attendance ────────────────────────────────────────────────
  k("att_pct", "attendance", "Attendance % (incl. MDM)", "હાજરી % (MDM સહિત)", "%", "higher", "Smart Attendance / OAS · PM Poshan (MDM)", "≥ 90%", classAvg()),
  k("att_chronic", "attendance", "Chronic absentee students", "સતત ગેરહાજર વિદ્યાર્થીઓ", "count", "lower", "EWS · Smart Attendance", "Reduce", schoolSum()),
  k("att_below_bench", "attendance", "Schools below attendance benchmark", "બેન્ચમાર્કથી નીચે શાળાઓ", "count", "lower", "UDISE+ · Smart Attendance", "Reduce", aggCount()),
  k("att_report", "attendance", "Attendance reporting compliance %", "હાજરી રિપોર્ટિંગ અનુપાલન %", "%", "higher", "Smart Attendance / OAS", "100%", classAvg()),
  k("att_ews", "attendance", "EWS follow-up completed %", "EWS ફોલો-અપ પૂર્ણ %", "%", "higher", "EWS", "≥ 90%", classAvg()),

  // ── B. Assessment ────────────────────────────────────────────────
  k("asm_participation", "assessment", "Assessment participation %", "મૂલ્યાંકન સહભાગિતા %", "%", "higher", "Xamta (PAT/SAT) · PARAKH", "≥ 95%", classAvg()),
  k("asm_result", "assessment", "Assessment result / proficiency %", "મૂલ્યાંકન પરિણામ / નિપુણતા %", "%", "higher", "Xamta · PARAKH · Gyan Prabhav", "≥ 65%", classAvg()),
  k("asm_below", "assessment", "Students below proficiency %", "નિપુણતાથી નીચે વિદ્યાર્થીઓ %", "%", "lower", "Xamta · PARAKH", "Reduce", classAvg()),
  k("asm_improvement", "assessment", "Student improvement % (Δ)", "વિદ્યાર્થી સુધારો % (Δ)", "%", "higher", "Xamta (PAT→SAT)", "↑ each cycle", classAvg()),
  k("asm_orf_fln", "assessment", "Improvement in ORF & FLN", "ORF અને FLN માં સુધારો", "%", "higher", "Vaachan Samiksha (ORF) · FLN", "↑ each cycle", classAvg()),
  k("asm_reports", "assessment", "Reports generated / downloaded %", "રિપોર્ટ બનાવ્યા / ડાઉનલોડ %", "%", "higher", "Xamta · Gyan Prabhav", "≥ 95%", schoolAvg()),

  // ── C. Adaptive Learning & TPD ───────────────────────────────────
  k("adp_identified", "adaptive", "Students identified for remediation %", "ઉપચાર માટે ઓળખાયેલા વિદ્યાર્થીઓ %", "%", "higher", "Swamulyankan / G-SHALA", "Identify all", classAvg()),
  k("adp_receiving", "adaptive", "Students receiving remediation %", "ઉપચાર મેળવતા વિદ્યાર્થીઓ %", "%", "higher", "Swamulyankan / G-SHALA", "≥ identified", classAvg()),
  k("adp_module", "adaptive", "Module completion %", "મોડ્યુલ પૂર્ણતા %", "%", "higher", "Gyan Prabhav / G-SHALA", "≥ 70%", classAvg()),
  k("adp_tpd", "adaptive", "Teacher TPD hours completion %", "શિક્ષક TPD કલાક પૂર્ણતા %", "%", "higher", "Prashikshak / Shikshak Sahayak", "Min 50 hrs", rep("class", "avg", "school", "avg")),
  k("adp_post", "adaptive", "Student improvement after intervention %", "હસ્તક્ષેપ પછી વિદ્યાર્થી સુધારો %", "%", "higher", "Swamulyankan · Gyan Prabhav", "↑ post-remediation", classAvg()),

  // ── D. Administration ────────────────────────────────────────────
  k("adm_scheme", "administration", "Scheme delivery %", "યોજના વિતરણ %", "%", "higher", "PRABANDH · Samagra Shiksha", "≥ 95%", schoolAvg()),
  k("adm_payment", "administration", "Payment completion %", "ચુકવણી પૂર્ણતા %", "%", "higher", "PFMS / IPMS", "≥ 95%", schoolAvg()),
  k("adm_pending", "administration", "Pending payments / issues", "બાકી ચુકવણી / સમસ્યાઓ", "count", "lower", "PFMS / IPMS · CAL", "Reduce", schoolSum()),
  k("adm_resolution", "administration", "Issue resolution % (SLA)", "સમસ્યા નિરાકરણ % (SLA)", "%", "higher", "CAL (grievances) · ICT Support", "≥ 90%", schoolAvg()),
  k("adm_repeat", "administration", "Repeat pending cases", "પુનરાવર્તિત બાકી કેસ", "count", "lower", "CAL · SMA", "Reduce", schoolSum()),

  // ── E. School Quality (GSQAC) ────────────────────────────────────
  k("gsqac_score", "quality", "GSQAC score", "GSQAC સ્કોર", "score", "higher", "GSQAC · Saksham Shala", "Grade A", schoolAvg()),
  k("qual_meeting", "quality", "Schools meeting benchmark %", "બેન્ચમાર્ક પૂર્ણ કરતી શાળાઓ %", "%", "higher", "GSQAC", "≥ 75%", rep("NA", "NA", "NA", "avg")),
  k("qual_low_perf", "quality", "Low-performing schools", "ઓછું પ્રદર્શન કરતી શાળાઓ", "count", "lower", "GSQAC", "Reduce", aggCount()),
  k("qual_improvement", "quality", "Improvement across cycles %", "ચક્રો વચ્ચે સુધારો %", "%", "higher", "GSQAC (round-over-round)", "↑ each round", schoolAvg()),
  k("qual_actions", "quality", "Improvement actions completed %", "સુધારણા ક્રિયાઓ પૂર્ણ %", "%", "higher", "Saksham Shala", "≥ 85%", schoolAvg()),

  // ── F. Governance & Monitoring ───────────────────────────────────
  k("gov_sameday", "governance", "Same-day reporting %", "સમાન-દિવસ રિપોર્ટિંગ %", "%", "higher", "VSK systems", "≥ 95%", classAvg()),
  k("gov_lag", "governance", "Dashboard data lag", "ડેશબોર્ડ ડેટા વિલંબ", "days", "lower", "VSK systems", "≤ 1 day", schoolAvg()),
  k("gov_pending", "governance", "Pending issues count", "બાકી સમસ્યાઓની સંખ્યા", "count", "lower", "CAL · SMA", "Reduce", schoolSum()),
  k("gov_repeat", "governance", "Repeat issues %", "પુનરાવર્તિત સમસ્યાઓ %", "%", "lower", "CAL · SMA", "Reduce", schoolAvg()),
  k("gov_flagged", "governance", "Action taken on flagged (EWS) cases %", "ફ્લેગ કરેલા કેસ પર પગલાં %", "%", "higher", "VSK systems · EWS", "≥ 90%", schoolAvg()),

  // ── District-level extras (district/state roles only) ────────────
  k("dst_dropout", "district", "Reduction in dropout rate %", "ડ્રોપઆઉટ દરમાં ઘટાડો %", "%", "higher", "UDISE+ · Child Tracking", "↑ reduction", districtOnly()),
  k("dst_reenroll", "district", "Re-enrolment vs target %", "લક્ષ્ય સામે પુનઃનોંધણી %", "%", "higher", "Child Tracking System", "≥ 80%", districtOnly()),
  k("dst_grant", "district", "Grant vs Expenditure (Samagra Shiksha) %", "અનુદાન સામે ખર્ચ (સમગ્ર શિક્ષા) %", "%", "higher", "PFMS · Samagra Shiksha", "≥ 85%", districtOnly()),
  k("dst_pmshri", "district", "Performance of PM SHRI schools %", "PM SHRI શાળાઓનું પ્રદર્શન %", "%", "higher", "PM SHRI · GSQAC", "≥ 80%", districtOnly()),
];

function k(
  id: string,
  domain_id: string,
  name: string,
  name_gu: string,
  unit: KpiDef["unit"],
  direction: KpiDef["direction"],
  data_source: string,
  target: string,
  level_representation: LevelRepresentation,
): CatItem {
  return { id, domain_id, name, name_gu, unit, direction, data_source, target, level_representation };
}

export const VSK_KPIS: KpiDef[] = CATALOG.map((item, i) => ({
  ...item,
  sort_order: i,
}));
