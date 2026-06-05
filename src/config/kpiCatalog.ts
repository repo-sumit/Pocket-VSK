import type { KpiDef, Level, LevelRepresentation, Representation } from "@/types";

/**
 * Unified Portal — the canonical 5A KPI catalog (29 KPIs across A1–A5),
 * transcribed verbatim from `Docs/VSK_KPI_Sample_Numbers.pdf` (the source of
 * truth). PUBLISHED holds the per-level figures (Teacher→section · School ·
 * Cluster · Block · District · State); the MockProvider anchors each level to
 * its published number (with per-entity spread) and rolls section→grade up to
 * the school. Punitive labels are reframed supportively per the feedback doc.
 */

// per-level published values (Teacher column → `section`). `—` ⇒ omitted ⇒ NA.
type Pub = Partial<Record<Level, number>>;
export const PUBLISHED: Record<string, Pub> = {
  // A1 · Attendance & Access
  att_pct: { section: 89, school: 95, cluster: 98, block: 86, district: 86, state: 85 },
  att_chronic: { section: 4, school: 24, cluster: 120, block: 600, district: 3000, state: 24000 },
  att_below_bench: { school: 42, cluster: 210, block: 1050, district: 5250, state: 42000 },
  att_report: { section: 72, school: 75, cluster: 75, block: 73, district: 73, state: 67 },
  // A2 · Assessment & Learning
  asm_participation: { section: 74, school: 76, cluster: 80, block: 74, district: 81, state: 80 },
  asm_result: { section: 56, school: 60, cluster: 63, block: 58, district: 57, state: 52 },
  asm_below_result: { section: 63, school: 61, cluster: 63, block: 72, district: 71, state: 64 },
  asm_improvement: { section: 83, school: 84, cluster: 87, block: 81, district: 90, state: 84 },
  orf_fln: { section: 77, school: 78, cluster: 62, block: 64, district: 77, state: 62 },
  reports_generated: { school: 82, cluster: 69, block: 68, district: 77, state: 75 },
  // A3 · TPD for Teachers
  module_completion: { section: 84, school: 88, cluster: 82, block: 86, district: 80, state: 95 },
  tpd_hours: { section: 75, school: 69, cluster: 73, block: 69, district: 68, state: 72 },
  // A4 · Administration & Service Delivery
  scheme_delivery: { school: 75, cluster: 78, block: 78, district: 83, state: 89 },
  payment_completion: { school: 72, cluster: 81, block: 69, district: 71, state: 67 },
  pending_payments: { school: 90, cluster: 450, block: 2250, district: 11250, state: 90000 },
  issue_resolution: { school: 73, cluster: 72, block: 74, district: 79, state: 80 },
  repeat_cases: { school: 54, cluster: 270, block: 1350, district: 6750, state: 54000 },
  pending_issues: { school: 90, cluster: 450, block: 2250, district: 11250, state: 90000 },
  repeat_issues: { school: 80, cluster: 73, block: 72, district: 71, state: 82 },
  action_atrisk: { school: 63, cluster: 70, block: 71, district: 64, state: 67 },
  dropout_reduction: { section: 82, school: 68, cluster: 83, block: 81, district: 79, state: 69 },
  reenrollment: { school: 78, cluster: 390, block: 1950, district: 9750, state: 78000 },
  grant_expenditure: { cluster: 75, block: 73, district: 73, state: 64 },
  pmshri_score: { school: 80, cluster: 86, block: 90, district: 77, state: 86 },
  // A5 · School Quality (GSQAC)
  gsqac_score: { section: 14, school: 84, cluster: 420, block: 2100, district: 10500, state: 84000 },
  schools_meeting: { school: 69, cluster: 69, block: 56, district: 58, state: 57 },
  priority_support: { school: 42, cluster: 210, block: 1050, district: 5250, state: 42000 },
  gsqac_improvement: { section: 59, school: 65, cluster: 73, block: 70, district: 60, state: 66 },
  improvement_actions: { section: 80, school: 82, cluster: 87, block: 83, district: 77, state: 86 },
};

/** Derive level_representation from which levels have a published number. */
function repFromPublished(id: string, unit: KpiDef["unit"]): LevelRepresentation {
  const p = PUBLISHED[id] ?? {};
  const agg: Representation = unit === "count" ? "count" : "avg";
  return {
    section: p.section != null ? "class" : "NA",
    grade: p.section != null ? "avg" : "NA",
    school: p.school != null ? (unit === "count" ? "count" : "school") : "NA",
    cluster: p.cluster != null ? agg : "NA",
    block: p.block != null ? agg : "NA",
    district: p.district != null ? agg : "NA",
    state: p.state != null ? agg : "NA",
  };
}

type CatItem = Omit<KpiDef, "sort_order" | "level_representation"> & { sort_order?: number };

const CATALOG: CatItem[] = [
  // ── A1 · Attendance & Access ─────────────────────────────────────
  k("att_pct", "a1", undefined, "Attendance %", "હાજરી %", "%", "higher", "Smart Attendance System (OAS)", "≥ 90%",
    "Daily student attendance (present ÷ enrolled × 100), rolled up to each level.",
    "દૈનિક વિદ્યાર્થી હાજરી (હાજર ÷ નોંધાયેલ × ૧૦૦), દરેક સ્તરે."),
  k("att_chronic", "a1", undefined, "Chronic Absentee Students", "સતત ગેરહાજર વિદ્યાર્થીઓ", "count", "lower", "Child Tracking System + At-Risk model", "Reduce",
    "Students absent >7 consecutive days or >30% of school days in a month.",
    "મહિનામાં >૭ સળંગ દિવસ અથવા >૩૦% દિવસ ગેરહાજર વિદ્યાર્થીઓ."),
  k("att_below_bench", "a1", undefined, "Schools Needing Attendance Support", "હાજરી સહાય જરૂરી શાળાઓ", "count", "lower", "Smart Attendance System (OAS)", "Reduce",
    "Schools whose average attendance is below the state benchmark — prioritised for support.",
    "સરેરાશ હાજરી રાજ્ય બેન્ચમાર્કથી નીચે હોય તેવી શાળાઓ."),
  k("att_report", "a1", undefined, "Attendance Reporting Compliance %", "હાજરી રિપોર્ટિંગ અનુપાલન %", "%", "higher", "Smart Attendance System (OAS)", "100%",
    "Share of schools that submitted attendance by the daily cut-off (system-usage discipline).",
    "દૈનિક કટ-ઓફ સુધી હાજરી સબમિટ કરનાર શાળાઓનો હિસ્સો."),

  // ── A2 · Assessment & Learning ───────────────────────────────────
  k("asm_participation", "a2", undefined, "Assessment Participation %", "મૂલ્યાંકન સહભાગિતા %", "%", "higher", "Xamta App (PAT/SAT)", "≥ 95%",
    "Enrolled students who actually appeared in the scheduled PAT/SAT.",
    "નિર્ધારિત PAT/SAT માં હાજર રહેલ નોંધાયેલ વિદ્યાર્થીઓ."),
  k("asm_result", "a2", undefined, "Assessment Result %", "મૂલ્યાંકન પરિણામ %", "%", "higher", "Xamta · PARAKH", "≥ 65%",
    "Students at/above the PARAKH-aligned proficiency threshold.",
    "PARAKH-આધારિત નિપુણતા થ્રેશોલ્ડ પર કે ઉપરના વિદ્યાર્થીઓ."),
  k("asm_below_result", "a2", undefined, "Students Below Assessment Result %", "પરિણામથી નીચે વિદ્યાર્થીઓ %", "%", "lower", "Xamta · Gyan Prabhav", "Reduce",
    "Assessed students scoring below the proficiency level — segmented for intervention.",
    "નિપુણતા સ્તરથી નીચે સ્કોર કરનાર મૂલ્યાંકિત વિદ્યાર્થીઓ."),
  k("asm_improvement", "a2", undefined, "Student Improvement %", "વિદ્યાર્થી સુધારો %", "%", "higher", "Xamta · Gyan Prabhav", "↑ each cycle",
    "Percentage-point change in average score between two consecutive assessment cycles.",
    "બે સળંગ મૂલ્યાંકન ચક્રો વચ્ચે સરેરાશ સ્કોરમાં ફેરફાર."),
  k("orf_fln", "a2", undefined, "Improvement in ORF & FLN", "ORF અને FLN માં સુધારો", "%", "higher", "Vaachan Samiksha · FLN", "↑ each cycle",
    "Improvement in Oral Reading Fluency and Foundational Literacy & Numeracy across cycles.",
    "મૌખિક વાચન પ્રવાહિતા અને પાયાનું સાક્ષરતા-ગણનમાં સુધારો."),
  k("reports_generated", "a2", undefined, "Reports Downloaded %", "રિપોર્ટ ડાઉનલોડ %", "%", "higher", "Gyan Prabhav", "≥ 95%",
    "Schools whose Gyan Prabhav report cards were generated and accessed in the reporting window.",
    "રિપોર્ટિંગ વિન્ડોમાં Gyan Prabhav રિપોર્ટ બનાવ્યા અને જોયા હોય તેવી શાળાઓ."),

  // ── A3 · TPD for Teachers ────────────────────────────────────────
  k("module_completion", "a3", undefined, "Module Completion %", "મોડ્યુલ પૂર્ણતા %", "%", "higher", "Swamulyankan / G-SHALA", "≥ 80%",
    "Assigned remediation/adaptive modules completed.",
    "સોંપાયેલ ઉપચાર મોડ્યુલ પૂર્ણ."),
  k("tpd_hours", "a3", undefined, "Teacher TPD Hours Completion %", "શિક્ષક TPD કલાક પૂર્ણતા %", "%", "higher", "Prashikshak", "Min 50 hrs/yr",
    "Teachers who completed the minimum 50 hours of professional development this year.",
    "આ વર્ષે ઓછામાં ઓછા ૫૦ કલાક TPD પૂર્ણ કરનાર શિક્ષકો."),

  // ── A4 · Administration & Service Delivery (sub-domain seam) ──────
  k("scheme_delivery", "a4", "a4_schemes", "Scheme Delivery %", "યોજના વિતરણ %", "%", "higher", "PFMS / IPMS · UDISE+", "≥ 95%",
    "Eligible students mapped & delivered scheme benefits (Namo Lakshmi/Saraswati, DigiVrtti, …).",
    "યોજના લાભ માટે મેપ થયેલ પાત્ર વિદ્યાર્થીઓ."),
  k("payment_completion", "a4", "a4_schemes", "Payment Completion %", "ચુકવણી પૂર્ણતા %", "%", "higher", "PFMS / IPMS", "≥ 95%",
    "Mapped beneficiaries whose payment was disbursed/credited (not just approved).",
    "ચુકવણી સફળતાપૂર્વક જમા થયેલ લાભાર્થીઓ."),
  k("pending_payments", "a4", "a4_schemes", "Pending Payments / Issues", "બાકી ચુકવણી / સમસ્યાઓ", "count", "lower", "PFMS · CAL · ICT", "Reduce",
    "Unresolved payment/grievance/ICT cases past SLA.",
    "SLA વીતી ગયેલ વણઉકેલાયેલ ચુકવણી/ફરિયાદ/ICT કેસ."),
  k("issue_resolution", "a4", "a4_grievances", "Issue Resolution %", "સમસ્યા નિરાકરણ %", "%", "higher", "CAL · ICT Support", "≥ 90%",
    "Grievances/service issues resolved within the SLA timeline.",
    "SLA સમયમર્યાદામાં ઉકેલાયેલ ફરિયાદો."),
  k("repeat_cases", "a4", "a4_grievances", "Repeat Pending Cases", "પુનરાવર્તિત બાકી કેસ", "count", "lower", "CAL · PFMS", "Reduce",
    "Cases logged more than once or reopened after closure.",
    "એક કરતાં વધુ વાર નોંધાયેલ કે ફરી ખોલેલ કેસ."),
  k("pending_issues", "a4", "a4_grievances", "Pending Issues Count", "બાકી સમસ્યાઓની સંખ્યા", "count", "lower", "CAL · SMA · PFMS", "Reduce",
    "Aggregate unresolved issues across all monitored systems past SLA.",
    "તમામ સિસ્ટમમાં SLA વીતી ગયેલ વણઉકેલાયેલ સમસ્યાઓ."),
  k("repeat_issues", "a4", "a4_grievances", "Repeat Issues %", "પુનરાવર્તિત સમસ્યાઓ %", "%", "lower", "CAL · SMA", "Reduce",
    "Issues that recurred or reopened — high rate signals root cause unaddressed.",
    "ફરી થયેલ સમસ્યાઓ — ઊંચો દર મૂળ કારણ ન ઉકેલ્યાનું દર્શાવે."),
  k("action_atrisk", "a4", "a4_grievances", "Action Taken on At-Risk Cases %", "જોખમ ધરાવતા કેસ પર પગલાં %", "%", "higher", "At-Risk model · SMA", "≥ 90%",
    "At-Risk-flagged students/schools with a documented follow-up within SLA.",
    "જોખમ-ફ્લેગ થયેલ કેસ જેમના પર SLA માં પગલાં લેવાયા."),
  k("dropout_reduction", "a4", "a4_district", "Reduction in Drop-out", "ડ્રોપઆઉટમાં ઘટાડો", "%", "higher", "UDISE+ · CTS", "↑ reduction",
    "Year-on-year reduction in the share of students who dropped out.",
    "ડ્રોપઆઉટ વિદ્યાર્થીઓના હિસ્સામાં વાર્ષિક ઘટાડો."),
  k("reenrollment", "a4", "a4_district", "Re-enrolment of OoSC vs Target", "OoSC પુનઃનોંધણી vs લક્ષ્ય", "count", "higher", "CTS / Vidya Track", "≥ target",
    "Out-of-school children re-enrolled this year vs the block/state target.",
    "આ વર્ષે ફરી નોંધાયેલ શાળા-બહારના બાળકો."),
  k("grant_expenditure", "a4", "a4_district", "Grant & Expenditure (Samagra Shiksha) %", "અનુદાન અને ખર્ચ (સમગ્ર શિક્ષા) %", "%", "higher", "PRABANDH · PFMS", "≥ 85%",
    "Fund utilisation: actual expenditure against the approved Samagra Shiksha budget.",
    "મંજૂર સમગ્ર શિક્ષા બજેટ સામે વાસ્તવિક ખર્ચ."),
  k("pmshri_score", "a4", "a4_district", "Performance of PM SHRI Schools %", "PM SHRI શાળા પ્રદર્શન %", "%", "higher", "GSQAC · Xamta · SMA", "≥ 80%",
    "Quality & outcome score for PM SHRI schools (learning, infra, governance).",
    "PM SHRI શાળાઓ માટે ગુણવત્તા-પરિણામ સ્કોર."),

  // ── A5 · School Quality (GSQAC) ──────────────────────────────────
  k("gsqac_score", "a5", undefined, "GSQAC Score", "GSQAC સ્કોર", "score", "higher", "GSQAC · Saksham Shala", "Grade A",
    "Composite GSQAC school-quality score (Learning & Teaching, Administration, Co-curricular, Resources).",
    "સંયુક્ત GSQAC શાળા-ગુણવત્તા સ્કોર."),
  k("schools_meeting", "a5", undefined, "Schools Meeting Benchmark %", "બેન્ચમાર્ક પૂર્ણ કરતી શાળાઓ %", "%", "higher", "GSQAC", "≥ 75%",
    "Schools achieving an A or B grade under GSQAC in the latest cycle.",
    "તાજેતરના GSQAC ચક્રમાં A કે B ગ્રેડ મેળવનાર શાળાઓ."),
  k("priority_support", "a5", undefined, "Schools for Priority Support", "પ્રાથમિકતા સહાય માટેની શાળાઓ", "count", "lower", "GSQAC · Saksham Shala", "Reduce",
    "Schools in the C/D band prioritised for targeted support and improvement plans.",
    "C/D બેન્ડમાંની શાળાઓ — લક્ષિત સહાય માટે પ્રાથમિકતા."),
  k("gsqac_improvement", "a5", undefined, "Improvement Across Cycles %", "ચક્રો વચ્ચે સુધારો %", "%", "higher", "GSQAC", "↑ each cycle",
    "Percentage-point change in a school's GSQAC score between consecutive cycles.",
    "સળંગ ચક્રો વચ્ચે શાળાના GSQAC સ્કોરમાં ફેરફાર."),
  k("improvement_actions", "a5", undefined, "Improvement Actions Completed %", "સુધારણા ક્રિયાઓ પૂર્ણ %", "%", "higher", "SMA · Saksham Shala", "≥ 85%",
    "Post-GSQAC / SMA action points the school completed and documented in time.",
    "GSQAC / SMA પછીની ક્રિયાઓ જે શાળાએ સમયસર પૂર્ણ કરી."),
];

function k(
  id: string,
  domain_id: string,
  sub_domain: string | undefined,
  name: string,
  name_gu: string,
  unit: KpiDef["unit"],
  direction: KpiDef["direction"],
  data_source: string,
  target: string,
  description: string,
  description_gu: string,
): CatItem {
  return { id, domain_id, sub_domain, name, name_gu, unit, direction, data_source, target, description, description_gu };
}

export const VSK_KPIS: KpiDef[] = CATALOG.map((item, i) => ({
  ...item,
  level_representation: repFromPublished(item.id, item.unit),
  sort_order: i,
}));
