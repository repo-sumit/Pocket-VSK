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
  asm_below: { section: 32, school: 29, cluster: 27, block: 24, district: 21, state: 18 },
  asm_orf_part: { section: 78, school: 80, cluster: 79, block: 81, district: 82, state: 84 },
  asm_orf_improve: { section: 8, school: 10, cluster: 9, block: 11, district: 12, state: 13 },
  asm_cet_part: { section: 87, school: 88, cluster: 89, block: 91, district: 92, state: 93 },
  asm_cet_improve: { section: 4, school: 4, cluster: 5, block: 6, district: 6, state: 7 },
  asm_cgms_part: { section: 79, school: 80, cluster: 81, block: 83, district: 84, state: 86 },
  asm_cgms_improve: { section: 5, school: 5, cluster: 6, block: 7, district: 7, state: 8 },
  asm_remediation: { section: 80, school: 82, cluster: 81, block: 83, district: 84, state: 86 },
  // Administration · CPD (school-and-above)
  cpd_hours: { school: 81, cluster: 84, block: 87, district: 89, state: 92 },
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
  ret_dropout: { school: 8, cluster: 10, block: 12, district: 14, state: 16 },
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

const ATT = "Attendance Monitoring System (Attendance Bot)";
const GP = "Gyan Prabhav · Xamta Bot";
const SMA = "Student Monitoring App (SMA) · Classes 1–8";
/** roles that see a column-J "No" (not-visible-to-teacher) indicator. */
const NON_TEACHER = ["principal", "crc", "brc", "deo", "state"] as const;

/** OGM indicators (object form). Defaults applied below: availableInDataLake:true,
 *  pmShriApplicable:true. `lowestLevel:"school"` ⇒ school-and-above (hidden at
 *  grade/section). `roleVisibility:[...NON_TEACHER]` ⇒ column-J "No" (hidden from teacher). */
const RAW: Array<Partial<CatItem> & Pick<CatItem, "id" | "domain_id" | "name" | "name_gu" | "unit" | "direction" | "data_source">> = [
  // ── Attendance — Daily · DL=Yes ──
  { id: "att_teacher", domain_id: "attendance", name: "Teacher Attendance", name_gu: "શિક્ષક હાજરી", unit: "%", direction: "higher", data_source: ATT, frequency: "Daily", displayStrategy: "trend_30d", lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "Teachers Present / Total Teachers × 100", description: "Officer-monitoring KPI — not a teacher self-evaluation card." },
  { id: "att_student", domain_id: "attendance", name: "Student Attendance", name_gu: "વિદ્યાર્થી હાજરી", unit: "%", direction: "higher", data_source: ATT, frequency: "Daily", displayStrategy: "trend_30d", formula: "Students Present / Total Enrolled × 100" },
  { id: "att_mdm", domain_id: "attendance", name: "Mid Day Meal (MDM) served %", name_gu: "મધ્યાહ્ન ભોજન (MDM) પીરસેલ %", unit: "%", direction: "higher", data_source: ATT, frequency: "Daily", displayStrategy: "trend_30d", lowestLevel: "school", formula: "Students Consuming MDM / Total eligible Students × 100" },
  { id: "att_chronic", domain_id: "attendance", name: "Students absent from past 7+ days", name_gu: "છેલ્લા 7+ દિવસથી ગેરહાજર વિદ્યાર્થીઓ", unit: "count", direction: "lower", data_source: ATT, frequency: "Daily", displayStrategy: "count_with_rate", hero: true, formula: "Counts unique students absent for 7 or more consecutive school days as of the selected/latest date. Higher hierarchy values are summed across all descendant schools.", description: "Absolute count of students absent 7+ consecutive days as of the latest date; summed up the hierarchy (never an average per school)." },
  { id: "att_report", domain_id: "attendance", name: "Attendance reporting compliance %", name_gu: "હાજરી રિપોર્ટિંગ અનુપાલન %", unit: "%", direction: "higher", data_source: ATT, frequency: "Daily", displayStrategy: "trend_30d", lowestLevel: "school", formula: "Units That Filled Attendance / Total Units × 100" },

  // ── Assessment — classroom-level (down to section) ──
  { id: "asm_sat1", domain_id: "assessment", name: "Semester Assessment Test 1 (SAT1)", name_gu: "સેમેસ્ટર મૂલ્યાંકન કસોટી 1 (SAT1)", unit: "%", direction: "higher", data_source: "Xamta Bot", frequency: "Twice a Year", displayStrategy: "snapshot_latest", noTrend: true, formula: "SAT1 result % for the current academic year (year-on-year change vs the previous SAT1).", description: "Semester Assessment Test 1 result — a per-cycle snapshot (no daily trend)." },
  { id: "asm_sat2", domain_id: "assessment", name: "Semester Assessment Test 2 (SAT2)", name_gu: "સેમેસ્ટર મૂલ્યાંકન કસોટી 2 (SAT2)", unit: "%", direction: "higher", data_source: "Xamta Bot", frequency: "Twice a Year", displayStrategy: "snapshot_latest", noTrend: true, formula: "SAT2 result % for the current academic year (year-on-year change vs the previous SAT2).", description: "Semester Assessment Test 2 result — a per-cycle snapshot (no daily trend)." },
  { id: "asm_below", domain_id: "assessment", name: "Students below hierarchy avg", name_gu: "સ્તર સરેરાશથી નીચે વિદ્યાર્થીઓ", unit: "%", direction: "lower", data_source: GP, frequency: "Twice a Year", displayStrategy: "snapshot_latest", formula: "Share of students below the hierarchy SAT average." },
  { id: "asm_orf_part", domain_id: "assessment", name: "Participation rate in ORF Reading (ORF)", name_gu: "ORF વાચનમાં સહભાગિતા દર", unit: "%", direction: "higher", data_source: "Oral Reading Fluency (ORF) Bot", availableInDataLake: false, frequency: "Yearly", displayStrategy: "snapshot_latest", formula: "Students Assessed on ORF Bot / Total Enrolled × 100" },
  { id: "asm_orf_improve", domain_id: "assessment", name: "Improvement in ORF Reading (ORF) %", name_gu: "ORF વાચન (ORF) માં સુધારો %", unit: "%", direction: "higher", data_source: "Oral Reading Fluency (ORF) Bot", availableInDataLake: false, frequency: "Yearly", displayStrategy: "delta_cycle", context: true, rag: { green: 8, amber: 4 }, formula: "Latest ORF Score (Year N) − (Year N−1)" },
  { id: "asm_cet_part", domain_id: "assessment", name: "Participation rate in CET", name_gu: "CET માં સહભાગિતા દર", unit: "%", direction: "higher", data_source: "Common Entrance Test (CET) Portal", availableInDataLake: false, frequency: "Yearly", displayStrategy: "snapshot_latest", roleVisibility: [...NON_TEACHER], formula: "Class 5 Present for Exam / Total Enrolled in Class 5 × 100" },
  { id: "asm_cet_improve", domain_id: "assessment", name: "Improvement in CET %", name_gu: "CET માં સુધારો %", unit: "%", direction: "higher", data_source: "Common Entrance Test (CET) Portal", availableInDataLake: false, frequency: "Yearly", displayStrategy: "delta_cycle", context: true, rag: { green: 4, amber: 0 }, roleVisibility: [...NON_TEACHER], formula: "CET Result % (Year N) − (Year N−1)" },
  { id: "asm_cgms_part", domain_id: "assessment", name: "Participation rate in CGMS (Chief Minister Gyan Sadhna Merit Scholarship)", name_gu: "CGMS માં સહભાગિતા દર (મુખ્યમંત્રી જ્ઞાન સાધના મેરિટ શિષ્યવૃત્તિ)", unit: "%", direction: "higher", data_source: "CGMS Portal", availableInDataLake: false, frequency: "Yearly", displayStrategy: "snapshot_latest", roleVisibility: [...NON_TEACHER], formula: "Class 8 Present for Exam / Total Enrolled in Class 8 × 100", description: "Chief Minister Gyan Sadhna Merit Scholarship." },
  { id: "asm_cgms_improve", domain_id: "assessment", name: "Improvement in CGMS %", name_gu: "CGMS માં સુધારો %", unit: "%", direction: "higher", data_source: "CGMS Portal", availableInDataLake: false, frequency: "Yearly", displayStrategy: "delta_cycle", context: true, rag: { green: 4, amber: 0 }, roleVisibility: [...NON_TEACHER], formula: "CGMS Result % (Year N) − (Year N−1)" },
  { id: "asm_remediation", domain_id: "assessment", name: "SAT reports downloaded in classrooms", name_gu: "વર્ગખંડોમાં ડાઉનલોડ થયેલ SAT રિપોર્ટ", unit: "%", direction: "higher", data_source: "Gyan Prabhav MVs", frequency: "Monthly", displayStrategy: "compliance", hero: true, formula: "Classrooms where the SAT report was downloaded / Total classrooms × 100", description: "Gyan Prabhav generates a SAT report card per classroom; this is the share of classrooms that downloaded it (data-driven remediation)." },

  // ── Administration · CPD (school-and-above · DL=No · PM-Shri No) ──
  { id: "cpd_hours", domain_id: "administration", sub_domain: "adm_cpd", name: "Teacher CPD hours completion %", name_gu: "શિક્ષક CPD કલાક પૂર્ણતા %", unit: "%", direction: "higher", data_source: "Peer Learning Circle (PLC)", availableInDataLake: false, pmShriApplicable: false, frequency: "Yearly", displayStrategy: "compliance", lowestLevel: "school", formula: "TPD Hours Completed / 50 × 100 (target 50 hrs/teacher)" },
  { id: "cpd_50", domain_id: "administration", sub_domain: "adm_cpd", name: "Teacher% completing 50 hours", name_gu: "50 કલાક પૂર્ણ કરનાર શિક્ષક %", unit: "%", direction: "higher", data_source: "Peer Learning Circle (PLC)", availableInDataLake: false, pmShriApplicable: false, frequency: "Yearly", displayStrategy: "compliance", lowestLevel: "school", formula: "Teachers Who Completed 50 Hours / Total Teachers × 100" },

  // ── Administration · Visits & Observations (school-and-above · SMA · DL=No) ──
  { id: "vis_crc_count", domain_id: "administration", sub_domain: "adm_visits", name: "No of CRC/URC Visits per school", name_gu: "શાળા દીઠ CRC/URC મુલાકાતની સંખ્યા", unit: "ratio", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "count_with_rate", hero: true, lowestLevel: "school", roleVisibility: [...NON_TEACHER], target: "Max 2 / month", formula: "Count of CRC/URC visits per school per month (max 2).", description: "A count out of 2 per month — not a percentage." },
  { id: "vis_obs_completion", domain_id: "administration", sub_domain: "adm_visits", name: "School observation completion %", name_gu: "શાળા નિરીક્ષણ પૂર્ણતા %", unit: "%", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "compliance", lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "Classroom Observations Completed / Total Schools × 100 (CRC/URC only)" },
  { id: "vis_ict", domain_id: "administration", sub_domain: "adm_visits", name: "ICT lab usage %", name_gu: "ICT લેબ ઉપયોગ %", unit: "%", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "compliance", lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "Active ICT Labs / Total ICT Labs × 100", description: "'Active' definition pending clarification." },
  { id: "vis_library", domain_id: "administration", sub_domain: "adm_visits", name: "Library usage %", name_gu: "પુસ્તકાલય ઉપયોગ %", unit: "%", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "compliance", lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "Active Libraries / Total Schools × 100", description: "'Active' definition pending clarification." },
  { id: "vis_urinals", domain_id: "administration", sub_domain: "adm_visits", name: "Urinals & Toilets Availability compliance %", name_gu: "મૂત્રાલય અને શૌચાલય ઉપલબ્ધતા અનુપાલન %", unit: "%", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "compliance", lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "Schools with Functional Urinals & Toilets / Total Schools × 100" },
  { id: "vis_handwash", domain_id: "administration", sub_domain: "adm_visits", name: "Handwash Availability compliance %", name_gu: "હાથ ધોવાની ઉપલબ્ધતા અનુપાલન %", unit: "%", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "compliance", lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "Schools with Handwash Facility Outside Toilet / Total Schools × 100" },
  { id: "vis_water", domain_id: "administration", sub_domain: "adm_visits", name: "Drinking Water Availability compliance %", name_gu: "પીવાના પાણીની ઉપલબ્ધતા અનુપાલન %", unit: "%", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "compliance", lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "Schools with Drinking Water Facility / Total Schools × 100" },
  { id: "vis_smc", domain_id: "administration", sub_domain: "adm_visits", name: "SMC meeting compliance %", name_gu: "SMC બેઠક અનુપાલન %", unit: "%", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "compliance", lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "SMC Meetings Conducted / Total Schools × 100 (latest status)" },
  { id: "vis_classroom_obs", domain_id: "administration", sub_domain: "adm_visits", name: "Classroom Observation % (Based on school)", name_gu: "વર્ગખંડ નિરીક્ષણ % (શાળા આધારિત)", unit: "%", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "compliance", lowestLevel: "school", roleVisibility: [...NON_TEACHER], formula: "Classroom Observations Completed / Planned × 100" },
  { id: "vis_lesson_plan", domain_id: "administration", sub_domain: "adm_visits", name: "Monthly lesson plan followed %", name_gu: "માસિક પાઠ યોજના અનુસરણ %", unit: "%", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "compliance", lowestLevel: "school", formula: "'Yes' in SMA / Completed Class Observations × 100" },
  { id: "vis_teacher_diary", domain_id: "administration", sub_domain: "adm_visits", name: "Teacher Diary completed %", name_gu: "શિક્ષક ડાયરી પૂર્ણ %", unit: "%", direction: "higher", data_source: SMA, availableInDataLake: false, frequency: "Monthly", displayStrategy: "compliance", lowestLevel: "school", formula: "'Yes' in SMA / Completed Class Observations × 100" },

  // ── Administration · Retention (school-and-above · EWS/CTS · DL=No) ──
  { id: "ret_dropout", domain_id: "administration", sub_domain: "adm_retention", name: "Reduction in dropout %", name_gu: "ડ્રોપઆઉટમાં ઘટાડો %", unit: "%", direction: "higher", data_source: "Early Warning System (EWS) · Attendance/CTS", availableInDataLake: false, frequency: "Half yearly", displayStrategy: "delta_cycle", topIndicator: true, context: true, rag: { green: 8, amber: 4 }, lowestLevel: "school", dataLagNote: "Half-yearly; confirmed at the start of the next year from CTS, so expect a data lag.", formula: "Class 2+: (current-year enrolment of classes [low+1…high]) − (last-year enrolment of classes [low…high−1]). New Class-1 admissions are not dropouts." },
  { id: "ret_reenroll", domain_id: "administration", sub_domain: "adm_retention", name: "Re-enrolment of OoSC (Out of School) against target %", name_gu: "OoSC (શાળા બહારના) ની લક્ષ્ય સામે પુનઃનોંધણી %", unit: "%", direction: "higher", data_source: "Back-to-School Bot · CTS/EWS", availableInDataLake: false, frequency: "Half yearly", displayStrategy: "compliance", topIndicator: true, lowestLevel: "school", dataLagNote: "Half-yearly; confirmed at the start of the next year from CTS, so expect a data lag.", formula: "Students Enrolled via Back-to-School / Total Flagged × 100" },

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
