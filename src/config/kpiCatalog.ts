import type { KpiDef, Level, LevelRepresentation, Representation } from "@/types";

/**
 * Unified Portal — indicator catalog. SOURCE OF TRUTH: `Docs/GJ _ Unified App
 * KPIs.xlsx` (Sheet1). Reconciled EXACTLY to that sheet — every indicator present,
 * nothing extra (merit-list, NAS, classroom-prep, avg-CPD-hours and a standalone
 * GSQAC-improvement KPI are intentionally absent; they are not in the sheet).
 *
 * 4A: Attendance · Assessment · Administration (CPD / Visits & Observations /
 * Retention) · School Quality (GSQAC + 5 domains).
 *
 * Two independent visibility axes, both config-driven (no hardcoding in screens):
 *  • `lowestLevel` — the lowest hierarchy level an indicator is shown at. School-
 *    and-above indicators (teacher attendance, MDM, reporting compliance, ALL of
 *    Administration, GSQAC) are NOT shown at grade/section; classroom indicators
 *    (student attendance, chronic absentees, ALL assessment) go down to section.
 *  • `roleVisibility` — column J of the sheet ("Visible to teacher"). When a row
 *    is "No" the teacher persona is excluded (officers/principal still see it).
 *
 * `availableInDataLake:false` indicators are still shown (with representative demo
 * values) — there is no "not in data lake" badge; the flag is kept for future use.
 */

type Pub = Partial<Record<Level, number>>;
export const PUBLISHED: Record<string, Pub> = {
  // Attendance (Daily, DL=Yes). Teacher attendance / MDM are school-and-above.
  att_teacher: { school: 89, cluster: 91, block: 93, district: 94, state: 95 },
  att_student: { section: 88, school: 86, cluster: 87, block: 89, district: 91, state: 92 },
  att_mdm: { school: 94, cluster: 96, block: 97, district: 98, state: 99 },
  att_chronic: { section: 4, school: 18, cluster: 62, block: 215, district: 790, state: 4100 },
  att_report: { school: 92, cluster: 91, block: 93, district: 94, state: 95 },
  // Assessment — all classroom-level (down to section); CET/CGMS hidden from teacher via roleVisibility.
  asm_sat1: { section: 72, school: 74, cluster: 76, block: 79, district: 81, state: 83 },
  asm_sat2: { section: 74, school: 76, cluster: 78, block: 80, district: 82, state: 84 },
  asm_orf: { section: 44, school: 46, cluster: 47, block: 49, district: 51, state: 53 }, // CWPM score
  asm_cet: { section: 87, school: 88, cluster: 89, block: 91, district: 92, state: 93 },
  asm_cgms: { section: 79, school: 80, cluster: 81, block: 83, district: 84, state: 86 },
  asm_remediation: { section: 80, school: 82, cluster: 81, block: 83, district: 84, state: 86 },
  // Administration · CPD (school-and-above)
  cpd_hours: { school: 38, cluster: 40, block: 42, district: 44, state: 46 }, // avg CPD hours (cap 50)
  cpd_50: { school: 65, cluster: 68, block: 71, district: 74, state: 78 },
  // Administration · Visits & Observations (school-and-above)
  vis_crc_count: { school: 1.4, cluster: 1.6, block: 1.7, district: 1.8, state: 1.9 },
  vis_obs_completion: { school: 76, cluster: 80, block: 84, district: 88, state: 92 },
  vis_ict: { school: 69, cluster: 73, block: 77, district: 82, state: 86 },
  vis_library: { school: 70, cluster: 74, block: 78, district: 82, state: 87 },
  vis_urinals: { school: 84, cluster: 87, block: 90, district: 92, state: 95 },
  vis_handwash: { school: 82, cluster: 85, block: 88, district: 90, state: 93 },
  vis_water: { school: 88, cluster: 90, block: 92, district: 94, state: 96 },
  vis_smc: { school: 79, cluster: 83, block: 86, district: 89, state: 92 },
  vis_classroom_obs: { school: 76, cluster: 80, block: 84, district: 88, state: 92 },
  vis_lesson_plan: { school: 82, cluster: 84, block: 86, district: 88, state: 91 },
  vis_teacher_diary: { school: 80, cluster: 83, block: 85, district: 87, state: 90 },
  // Administration · Retention (school-and-above)
  ret_dropout: { school: 6, cluster: 22, block: 70, district: 260, state: 1400 }, // identified dropout count
  ret_reenroll: { school: 75, cluster: 79, block: 83, district: 87, state: 91 },
  // School Quality (provider sources real GSQAC from entity.meta.gsqac)
  sq_gsqac: { school: 73, cluster: 73, block: 72, district: 74, state: 73 },
  sq_d1: { school: 76, cluster: 75, block: 74, district: 76, state: 75 },
  sq_d2: { school: 84, cluster: 84, block: 83, district: 85, state: 84 },
  sq_d3: { school: 73, cluster: 74, block: 72, district: 74, state: 73 },
  sq_d4: { school: 71, cluster: 72, block: 70, district: 72, state: 71 },
  sq_d5: { school: 47, cluster: 48, block: 45, district: 49, state: 47 },
};

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

const ATT = "Attendance bot";
const SMA = "SMA";
/** roles that see a column-J "No" (not-visible-to-teacher) indicator. */
const NON_TEACHER = ["principal", "crc", "brc", "deo", "state"] as const;

/** OGM indicators (object form). Defaults applied below: availableInDataLake:true,
 *  pmShriApplicable:true. `lowestLevel:"school"` ⇒ school-and-above (hidden at
 *  grade/section). `roleVisibility:[...NON_TEACHER]` ⇒ column-J "No" (hidden from teacher). */
const RAW: Array<Partial<CatItem> & Pick<CatItem, "id" | "domain_id" | "name" | "name_gu" | "unit" | "direction" | "data_source">> = [
  // ── Attendance — Daily · src "Attendance bot" ──
  { id: "att_chronic", domain_id: "attendance", name: "Students absent from past 7+ consecutive days", name_gu: "છેલ્લા 7+ દિવસથી ગેરહાજર વિદ્યાર્થીઓ", unit: "count", direction: "lower", data_source: ATT, frequency: "Daily", displayStrategy: "count_with_rate", hero: true, formula: "Counts unique students absent for 7 or more consecutive school days as of the selected/latest date. .", description: "Absolute count of students absent 7+ consecutive days as of the latest date; summed up the hierarchy (never an average per school)." },
  { id: "att_teacher", domain_id: "attendance", name: "Teachers present today", name_gu: "આજે હાજર શિક્ષકો", unit: "%", direction: "higher", data_source: ATT, frequency: "Daily", displayStrategy: "trend_30d", lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "Present: (Teachers Present / Total Teachers) × 100", description: "Officer-monitoring KPI — not a teacher self-evaluation card." },
  { id: "att_student", domain_id: "attendance", name: "Students present today", name_gu: "આજે હાજર વિદ્યાર્થીઓ", unit: "%", direction: "higher", data_source: ATT, frequency: "Daily", displayStrategy: "trend_30d", formula: "Present: (Students Present / Total Students) × 100" },
  { id: "att_mdm", domain_id: "attendance", name: "Students consuming Mid-day Meal (MDM)", name_gu: "મધ્યાહ્ન ભોજન (MDM) લેતા વિદ્યાર્થીઓ", unit: "%", direction: "higher", data_source: ATT, frequency: "Daily", displayStrategy: "trend_30d", lowestLevel: "school", formula: "(Students Consuming MDM / Total eligible Students) × 100" },
  { id: "att_report", domain_id: "attendance", name: "Schools and Class Sections Submitting Attendance", name_gu: "હાજરી સબમિટ કરતી શાળાઓ અને વર્ગ વિભાગો", unit: "%", direction: "higher", data_source: ATT, frequency: "Daily", displayStrategy: "trend_30d", lowestLevel: "school", formula: "Schools: (Schools That Filled Attendance / Total Schools) × 100" },

  // ── Assessment — classroom-level (down to section) ──
  { id: "asm_remediation", domain_id: "assessment", name: "SAT reports downloaded in classrooms", name_gu: "વર્ગખંડોમાં ડાઉનલોડ થયેલ SAT રિપોર્ટ", unit: "%", direction: "higher", data_source: "Gyan Prabhav bot", frequency: "Daily", displayStrategy: "compliance", hero: true, formula: "(Classrooms Where Report Was Downloaded / Total Classrooms) × 100", description: "Gyan Prabhav generates a SAT report card per classroom; this is the share of classrooms that downloaded it." },
  { id: "asm_sat1", domain_id: "assessment", name: "Semester Assessment Test 1 (SAT1)", name_gu: "સેમેસ્ટર મૂલ્યાંકન કસોટી 1 (SAT1)", unit: "%", direction: "higher", data_source: "Xamta bot", frequency: "Yearly", displayStrategy: "snapshot_latest", scheduleNote: "September", formula: "SAT1 Result % (current year); year-on-year change vs the previous SAT1.", description: "Semester Assessment Test 1 — held every September." },
  { id: "asm_sat2", domain_id: "assessment", name: "Semester Assessment Test 2 (SAT2)", name_gu: "સેમેસ્ટર મૂલ્યાંકન કસોટી 2 (SAT2)", unit: "%", direction: "higher", data_source: "Xamta bot", frequency: "Yearly", displayStrategy: "snapshot_latest", scheduleNote: "March", formula: "SAT2 Result % (current year); year-on-year change vs the previous SAT2." },
  { id: "asm_orf", domain_id: "assessment", name: "FLN - Oral Reading Fluency", name_gu: "FLN - મૌખિક વાચન પ્રવાહ", unit: "score", direction: "higher", data_source: "Oral Reading Fluency (ORF) Bot", availableInDataLake: false, frequency: "Monthly", displayStrategy: "snapshot_latest", formula: "Correct Words Per Minute (CWPM) score; year-on-year change from the latest ORF tests." },
  { id: "asm_cet", domain_id: "assessment", name: "Common Entrance Test (CET)", name_gu: "કોમન એન્ટ્રન્સ ટેસ્ટ (CET)", unit: "%", direction: "higher", data_source: "Common Entrance Test (CET) Portal", availableInDataLake: false, frequency: "Yearly", displayStrategy: "snapshot_latest", roleVisibility: [...NON_TEACHER], formula: "CET Result % (current year); year-on-year change. Class-5 participation = Present / Enrolled × 100." },
  { id: "asm_cgms", domain_id: "assessment", name: "Chief Minister Gyan Sadhna Merit Scholarship (CGMS)", name_gu: "મુખ્યમંત્રી જ્ઞાન સાધના મેરિટ શિષ્યવૃત્તિ (CGMS)", unit: "%", direction: "higher", data_source: "CGMS Portal", availableInDataLake: false, frequency: "Yearly", displayStrategy: "snapshot_latest", roleVisibility: [...NON_TEACHER], formula: "CGMS Result % (current year); year-on-year change. Class-8 participation = Present / Enrolled × 100." },

  // ── Administration · School Observation (Monthly · SMA · officer-only) ──
  { id: "vis_crc_count", domain_id: "administration", sub_domain: "adm_visits", name: "No of CRC/URC Visits per school", name_gu: "શાળા દીઠ CRC/URC મુલાકાતની સંખ્યા", unit: "ratio", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "count_with_rate", hero: true, lowestLevel: "school", roleVisibility: [...NON_TEACHER], target: "Max 2 / month", formula: "Count of CRC/URC visits per school per month (max 2).", description: "A count out of 2 per month — not a percentage." },
  { id: "vis_obs_completion", domain_id: "administration", sub_domain: "adm_visits", name: "School observations completed by CRC/URC", name_gu: "CRC/URC દ્વારા પૂર્ણ શાળા નિરીક્ષણ", unit: "%", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "compliance", lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "Schools observed at least once that month / Total schools (classes 1–8) × 100" },
  { id: "vis_ict", domain_id: "administration", sub_domain: "adm_visits", name: "ICT Lab Usage in Schools", name_gu: "શાળાઓમાં ICT લેબ ઉપયોગ", unit: "%", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "compliance", lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "Active ICT Labs / Total ICT Labs × 100 (latest visit)" },
  { id: "vis_library", domain_id: "administration", sub_domain: "adm_visits", name: "Library usage in Schools", name_gu: "શાળાઓમાં પુસ્તકાલય ઉપયોગ", unit: "%", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "compliance", lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "Active Libraries / Total Schools × 100 (latest visit)" },
  { id: "vis_urinals", domain_id: "administration", sub_domain: "adm_visits", name: "Urinals & Toilets Availability in Schools", name_gu: "શાળાઓમાં મૂત્રાલય અને શૌચાલય ઉપલબ્ધતા", unit: "%", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "compliance", lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "Schools with Functional Urinals & Toilets / Total Schools × 100" },
  { id: "vis_handwash", domain_id: "administration", sub_domain: "adm_visits", name: "Handwash Availability in Schools", name_gu: "શાળાઓમાં હાથ ધોવાની ઉપલબ્ધતા", unit: "%", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "compliance", lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "Schools with Handwash Facility Outside Toilet / Total Schools × 100" },
  { id: "vis_water", domain_id: "administration", sub_domain: "adm_visits", name: "Drinking Water Availability in Schools", name_gu: "શાળાઓમાં પીવાના પાણીની ઉપલબ્ધતા", unit: "%", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "compliance", lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "Schools with Drinking Water Facility / Total Schools × 100" },
  { id: "vis_smc", domain_id: "administration", sub_domain: "adm_visits", name: "Schools Conducting SMC Meetings", name_gu: "SMC બેઠક યોજતી શાળાઓ", unit: "%", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "compliance", lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "SMC Meetings Conducted / Total Schools × 100 (latest status)" },

  // ── Administration · Classroom Observation (Monthly · SMA · officer-only) ──
  { id: "vis_classroom_obs", domain_id: "administration", sub_domain: "adm_classroom", name: "Schools Visited for Classroom Observation", name_gu: "વર્ગખંડ નિરીક્ષણ માટે મુલાકાત લીધેલ શાળાઓ", unit: "%", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "compliance", lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "Unique schools where a classroom was observed / Total Schools × 100 (latest visit)" },
  { id: "vis_lesson_plan", domain_id: "administration", sub_domain: "adm_classroom", name: "Classrooms following monthly lesson plans", name_gu: "માસિક પાઠ યોજના અનુસરતા વર્ગખંડો", unit: "%", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "compliance", lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "'Yes' classrooms / Completed Classroom Observations × 100" },
  { id: "vis_teacher_diary", domain_id: "administration", sub_domain: "adm_classroom", name: "Classrooms with Completed Teacher Diaries", name_gu: "પૂર્ણ શિક્ષક ડાયરી ધરાવતા વર્ગખંડો", unit: "%", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "compliance", lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "'Yes' classrooms / Completed Classroom Observations × 100" },

  // ── Administration · Student Retention (CTS + EWS) ──
  { id: "ret_dropout", domain_id: "administration", sub_domain: "adm_retention", name: "Identified Dropout Students", name_gu: "ઓળખાયેલ ડ્રોપઆઉટ વિદ્યાર્થીઓ", unit: "count", direction: "lower", data_source: "CTS + EWS", availableInDataLake: false, frequency: "Daily", displayStrategy: "count_with_rate", topIndicator: true, lowestLevel: "school", formula: "Current Enrolment of classes [Lowest+1 to Highest] − Last-Year Enrolment of classes [Lowest to Highest−1]. Absolute count, summed up the hierarchy." },
  { id: "ret_reenroll", domain_id: "administration", sub_domain: "adm_retention", name: "Re-enrolment of Out-of-School Students", name_gu: "શાળા બહારના વિદ્યાર્થીઓની પુનઃનોંધણી", unit: "%", direction: "higher", data_source: "CTS + EWS", availableInDataLake: false, frequency: "Half yearly", displayStrategy: "compliance", topIndicator: true, lowestLevel: "school", dataLagNote: "Half-yearly; confirmed at the start of the next year from CTS, so expect a data lag.", formula: "Students Enrolled via Back-to-School Initiative / Total Flagged × 100" },

  // ── Administration · Continuous Professional Development (PLC · Yearly) ──
  { id: "cpd_hours", domain_id: "administration", sub_domain: "adm_cpd", name: "Average CPD Time Per Teacher", name_gu: "શિક્ષક દીઠ સરેરાશ CPD સમય", unit: "hours", direction: "higher", data_source: "PLC", availableInDataLake: false, pmShriApplicable: false, frequency: "Yearly", displayStrategy: "compliance", lowestLevel: "school", formula: "Average TPD hours per enrolled teacher on PLC (capped at 50 hours)." },
  { id: "cpd_50", domain_id: "administration", sub_domain: "adm_cpd", name: "Teachers Achieving the 50-Hour CPD Target", name_gu: "50-કલાક CPD લક્ષ્ય હાંસલ કરનાર શિક્ષકો", unit: "%", direction: "higher", data_source: "PLC", availableInDataLake: false, pmShriApplicable: false, frequency: "Yearly", displayStrategy: "compliance", lowestLevel: "school", formula: "Teachers Who Completed 50 Hours / Total Teachers × 100" },

  // ── School Quality (OUTPUT) — REAL GSQAC · annual · school-and-above ──
  { id: "sq_gsqac", domain_id: "school_quality", name: "GSQAC score", name_gu: "GSQAC સ્કોર", unit: "score", direction: "higher", data_source: "GSQAC Dashboard & Bot", availableInDataLake: false, frequency: "Yearly", displayStrategy: "snapshot_latest", hero: true, lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "Latest GSQAC school score; averaged per hierarchy level. Colour by GSQAC grade. 5 GSQAC domains converge into the overall score." },
  { id: "sq_d1", domain_id: "school_quality", name: "Teaching & Learning", name_gu: "અધ્યયન અને અધ્યાપન", unit: "score", direction: "higher", data_source: "GSQAC Dashboard & Bot", availableInDataLake: false, frequency: "Yearly", displayStrategy: "snapshot_latest", context: true, lowestLevel: "school", roleVisibility: [...NON_TEACHER] },
  { id: "sq_d2", domain_id: "school_quality", name: "School Management", name_gu: "શાળા વ્યવસ્થાપન", unit: "score", direction: "higher", data_source: "GSQAC Dashboard & Bot", availableInDataLake: false, frequency: "Yearly", displayStrategy: "snapshot_latest", context: true, lowestLevel: "school", roleVisibility: [...NON_TEACHER] },
  { id: "sq_d3", domain_id: "school_quality", name: "Co-curricular activities", name_gu: "સહઅભ્યાસિક પ્રવૃત્તિઓ", unit: "score", direction: "higher", data_source: "GSQAC Dashboard & Bot", availableInDataLake: false, frequency: "Yearly", displayStrategy: "snapshot_latest", context: true, lowestLevel: "school", roleVisibility: [...NON_TEACHER] },
  { id: "sq_d4", domain_id: "school_quality", name: "Use of Resources", name_gu: "સંસાધનોનો ઉપયોગ", unit: "score", direction: "higher", data_source: "GSQAC Dashboard & Bot", availableInDataLake: false, frequency: "Yearly", displayStrategy: "snapshot_latest", context: true, lowestLevel: "school", roleVisibility: [...NON_TEACHER] },
  { id: "sq_d5", domain_id: "school_quality", name: "Exam Participation", name_gu: "પરીક્ષામાં સહભાગિતા", unit: "score", direction: "higher", data_source: "GSQAC Dashboard & Bot", availableInDataLake: false, frequency: "Yearly", displayStrategy: "snapshot_latest", context: true, lowestLevel: "school", roleVisibility: [...NON_TEACHER] },
];

const CATALOG: CatItem[] = RAW.map((o) => ({ availableInDataLake: true, pmShriApplicable: true, ...o }));

export const VSK_KPIS: KpiDef[] = CATALOG.map((item, i) => ({
  ...item,
  level_representation: repFromPublished(item.id, item.unit),
  sort_order: i,
}));

/** GSQAC's 5 output domains (keys match the real CSV). */
export const GSQAC_DOMAINS: { key: string; kpiId: string; name: string; name_gu: string }[] = [
  { key: "D1", kpiId: "sq_d1", name: "Teaching & Learning", name_gu: "અધ્યયન અને અધ્યાપન" },
  { key: "D2", kpiId: "sq_d2", name: "School Management", name_gu: "શાળા વ્યવસ્થાપન" },
  { key: "D3", kpiId: "sq_d3", name: "Co-curricular activities", name_gu: "સહઅભ્યાસિક પ્રવૃત્તિઓ" },
  { key: "D4", kpiId: "sq_d4", name: "Use of Resources", name_gu: "સંસાધનોનો ઉપયોગ" },
  { key: "D5", kpiId: "sq_d5", name: "Exam Participation", name_gu: "પરીક્ષામાં સહભાગિતા" },
];

/** Hero KPI ids — the homepage indicator per domain (one each), driven by `hero` in the
 *  catalog (the latest sheet's green-flagged Home-Page indicators), never a hardcoded list. */
export const HERO_KPIS = VSK_KPIS.filter((k) => k.hero).map((k) => k.id);
