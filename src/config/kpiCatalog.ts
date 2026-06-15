import type {
  KpiDef,
  KpiMetricDef,
  Level,
  LevelRepresentation,
  Representation,
} from "@/types";

/**
 * Pocket VSK — indicator catalog. SOURCE OF TRUTH: `Docs/GJ _ Unified App
 * KPIs.xlsx` (Sheet1). Reconciled EXACTLY to that sheet — every indicator present,
 * nothing extra (merit-list, NAS, classroom-prep and a standalone GSQAC-improvement
 * KPI are intentionally absent; they are not in the sheet). Sheet rows with multiple
 * formulas are modelled as multi-metric indicators (`metrics`): Teacher attendance
 * (Present/Submitted), Student attendance (Present/Submitted), attendance submission
 * (Schools/Class sections), SAT 1/SAT 2/ORF/CET/CGMS, and Average CPD Time Per Teacher
 * (Average CPD time / Teachers engaged in CPD).
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
const BASE_PUBLISHED: Record<string, Pub> = {
  // Attendance (Daily, DL=Yes). Teacher attendance / MDM are school-and-above.
  att_teacher: { school: 89, cluster: 91, block: 93, district: 94, state: 95 },
  att_student: {
    section: 88,
    school: 86,
    cluster: 87,
    block: 89,
    district: 91,
    state: 92,
  },
  att_mdm: { school: 94, cluster: 96, block: 97, district: 98, state: 99 },
  att_chronic: {
    section: 4,
    school: 18,
    cluster: 62,
    block: 215,
    district: 790,
    state: 4100,
  },
  // att_report is multi-metric — parent anchor not used directly (sub-metrics resolve via METRIC_PUBLISHED)
  att_report: { school: 92, cluster: 91, block: 93, district: 94, state: 95 },
  // Assessment — all classroom-level (down to section); CET/CGMS hidden from teacher via roleVisibility.
  asm_sat1: {
    section: 72,
    school: 74,
    cluster: 76,
    block: 79,
    district: 81,
    state: 83,
  },
  asm_sat2: {
    section: 74,
    school: 76,
    cluster: 78,
    block: 80,
    district: 82,
    state: 84,
  },
  asm_orf: {
    section: 44,
    school: 46,
    cluster: 47,
    block: 49,
    district: 51,
    state: 53,
  }, // CWPM score
  asm_cet: {
    section: 87,
    school: 88,
    cluster: 89,
    block: 91,
    district: 92,
    state: 93,
  },
  asm_cgms: {
    section: 79,
    school: 80,
    cluster: 81,
    block: 83,
    district: 84,
    state: 86,
  },
  asm_remediation: {
    section: 80,
    school: 82,
    cluster: 81,
    block: 83,
    district: 84,
    state: 86,
  },
  // Administration · CPD (school-and-above)
  cpd_hours: { school: 38, cluster: 40, block: 42, district: 44, state: 46 }, // avg CPD hours (cap 50)
  cpd_50: { school: 65, cluster: 68, block: 71, district: 74, state: 78 },
  // Administration · Visits & Observations (school-and-above)
  vis_CRCC_count: {
    school: 1.4,
    cluster: 1.6,
    block: 1.7,
    district: 1.8,
    state: 1.9,
  },
  vis_obs_completion: {
    school: 76,
    cluster: 80,
    block: 84,
    district: 88,
    state: 92,
  },
  vis_ict: { school: 69, cluster: 73, block: 77, district: 82, state: 86 },
  vis_library: { school: 70, cluster: 74, block: 78, district: 82, state: 87 },
  vis_smc: { school: 79, cluster: 83, block: 86, district: 89, state: 92 },
  // §16 digital-learning usage (source: LMS) — replaces the removed WASH/infra KPIs
  ad_gshala: { school: 78, cluster: 80, block: 82, district: 84, state: 86 },
  ad_smart: { school: 72, cluster: 74, block: 76, district: 78, state: 80 },
  ad_lab: { school: 64, cluster: 67, block: 70, district: 73, state: 76 },
  ad_pal: { school: 58, cluster: 61, block: 64, district: 67, state: 70 },
  vis_classroom_obs: {
    school: 76,
    cluster: 80,
    block: 84,
    district: 88,
    state: 92,
  },
  vis_lesson_plan: {
    school: 82,
    cluster: 84,
    block: 86,
    district: 88,
    state: 91,
  },
  vis_teacher_diary: {
    school: 80,
    cluster: 83,
    block: 85,
    district: 87,
    state: 90,
  },
  // Administration · Retention (school-and-above)
  ret_dropout: {
    school: 6,
    cluster: 22,
    block: 70,
    district: 260,
    state: 1400,
  }, // identified dropout count
  ret_reenroll: { school: 75, cluster: 79, block: 83, district: 87, state: 91 },
  // School Quality (provider sources real GSQAC from entity.meta.gsqac)
  sq_gsqac: { school: 73, cluster: 73, block: 72, district: 74, state: 73 },
  sq_d1: { school: 76, cluster: 75, block: 74, district: 76, state: 75 },
  sq_d2: { school: 84, cluster: 84, block: 83, district: 85, state: 84 },
  sq_d3: { school: 73, cluster: 74, block: 72, district: 74, state: 73 },
  sq_d4: { school: 71, cluster: 72, block: 70, district: 72, state: 71 },
  sq_d5: { school: 47, cluster: 48, block: 45, district: 49, state: 47 },
};

/**
 * Per-SUB-METRIC anchors for the multi-metric indicators (Teacher/Student attendance,
 * att_report, SAT 1/SAT 2/ORF/CET/CGMS, Average CPD Time Per Teacher).
 * Keyed `<parentId>__<metricId>` so the provider/peer helpers resolve them through
 * the same machinery as a normal indicator — no UI hardcoding (§9, §12). The primary
 * metric reuses the parent's published anchor; the secondary metrics get their own
 * deterministic level series. "Below hierarchy avg" is lower-is-better and trends DOWN
 * up the hierarchy (bigger units cluster tighter, so fewer fall below the mean).
 */
const METRIC_PUBLISHED: Record<string, Pub> = {
  // SAT 1 — Avg score (= parent), students below hierarchy avg (lower better), participation
  asm_sat1__avgScore: BASE_PUBLISHED.asm_sat1,
  asm_sat1__belowHierarchyAvg: {
    section: 34,
    school: 32,
    cluster: 30,
    block: 27,
    district: 24,
    state: 21,
  },
  asm_sat1__participation: {
    section: 88,
    school: 89,
    cluster: 90,
    block: 91,
    district: 92,
    state: 93,
  },
  // SAT 2
  asm_sat2__avgScore: BASE_PUBLISHED.asm_sat2,
  asm_sat2__belowHierarchyAvg: {
    section: 33,
    school: 31,
    cluster: 29,
    block: 26,
    district: 23,
    state: 20,
  },
  asm_sat2__participation: {
    section: 89,
    school: 90,
    cluster: 91,
    block: 92,
    district: 93,
    state: 94,
  },
  // FLN-ORF — CWPM score (= parent), below hierarchy avg, participation
  asm_orf__cwpm: BASE_PUBLISHED.asm_orf,
  asm_orf__belowHierarchyAvg: {
    section: 40,
    school: 38,
    cluster: 36,
    block: 33,
    district: 30,
    state: 27,
  },
  asm_orf__participation: {
    section: 84,
    school: 85,
    cluster: 86,
    block: 88,
    district: 89,
    state: 90,
  },
  // att_report — Schools submitting attendance (= parent anchor) + Class sections submitting
  att_report__schools: BASE_PUBLISHED.att_report,
  att_report__classSections: {
    school: 88,
    cluster: 89,
    block: 91,
    district: 92,
    state: 93,
  },
  // Teacher attendance — Present (= parent anchor) + Submitted (submission runs a touch higher)
  att_teacher__present: BASE_PUBLISHED.att_teacher,
  att_teacher__submitted: {
    school: 92,
    cluster: 94,
    block: 95,
    district: 96,
    state: 97,
  },
  // Student attendance — Present (= parent anchor) + Submitted
  att_student__present: BASE_PUBLISHED.att_student,
  att_student__submitted: {
    section: 90,
    school: 89,
    cluster: 91,
    block: 93,
    district: 94,
    state: 95,
  },
  // CPD — Average CPD time (hours, = parent anchor) + Teachers engaged in CPD (%)
  cpd_hours__avgTime: BASE_PUBLISHED.cpd_hours,
  cpd_hours__teachersEngaged: {
    school: 74,
    cluster: 76,
    block: 78,
    district: 80,
    state: 82,
  },
  // GSQAC D5's CET/CGMS lines reuse asm_cet__participation / asm_cgms__participation
  // (declared above) via KpiMetricDef.sourceKpiId — no separate anchors needed.
  // CET — result (= parent), class-5 participation
  asm_cet__result: BASE_PUBLISHED.asm_cet,
  asm_cet__participation: {
    section: 90,
    school: 91,
    cluster: 92,
    block: 93,
    district: 94,
    state: 95,
  },
  // CGMS — result (= parent), class-8 participation
  asm_cgms__result: BASE_PUBLISHED.asm_cgms,
  asm_cgms__participation: {
    section: 84,
    school: 85,
    cluster: 86,
    block: 88,
    district: 89,
    state: 90,
  },
};

/** Combined anchor map — real indicators + sub-metrics. Every value/peer/benchmark
 *  lookup (provider, peer.ts, applicability.ts) reads from this single source. */
export const PUBLISHED: Record<string, Pub> = {
  ...BASE_PUBLISHED,
  ...METRIC_PUBLISHED,
};

/** the 3 shared SAT/ORF sub-metrics, parameterised by the test label so the formula
 *  copy is readable per indicator (§9 — config-driven, not hardcoded in the UI). */
function resultSubMetrics(
  test: string,
  scoreUnit: "%" | "score",
  scoreId: string,
  scoreLabel: string,
  scoreLabel_gu: string,
): KpiMetricDef[] {
  return [
    {
      id: scoreId,
      label: scoreLabel,
      label_gu: scoreLabel_gu,
      unit: scoreUnit,
      direction: "higher",
      formula: `Average ${test} ${scoreUnit === "%" ? "% score" : "score"} for the current year (Year N).`,
      formula_gu: `ચાલુ વર્ષ (વર્ષ N) માટે સરેરાશ ${test} ${scoreUnit === "%" ? "% સ્કોર" : "સ્કોર"}.`,
    },
    {
      id: "belowHierarchyAvg",
      label: "% below hierarchy average",
      label_gu: "સ્તર સરેરાશથી નીચે %",
      unit: "%",
      direction: "lower",
      formula: `Students whose ${test} score is below the hierarchy average ÷ total students × 100.`,
      formula_gu: `જે વિદ્યાર્થીઓનો ${test} સ્કોર સ્તરની સરેરાશથી ઓછો છે ÷ કુલ વિદ્યાર્થીઓ × 100.`,
    },
    {
      id: "participation",
      label: "Participation",
      label_gu: "સહભાગિતા",
      unit: "%",
      direction: "higher",
      formula: "Students participated ÷ total students × 100.",
      formula_gu: "ભાગ લેનાર વિદ્યાર્થીઓ ÷ કુલ વિદ્યાર્થીઓ × 100.",
    },
  ];
}

/** Present / Submitted sub-metrics shared by Teacher & Student attendance (both %,
 *  higher-is-better). `who` parameterises the readable formula copy per indicator. */
function presentSubmittedMetrics(
  presentFormula: string,
  presentFormula_gu: string,
  submittedFormula: string,
  submittedFormula_gu: string,
): KpiMetricDef[] {
  return [
    {
      id: "present",
      label: "Present",
      label_gu: "હાજર",
      unit: "%",
      direction: "higher",
      formula: presentFormula,
      formula_gu: presentFormula_gu,
    },
    {
      id: "submitted",
      label: "Submitted",
      label_gu: "સબમિટ કરેલ",
      unit: "%",
      direction: "higher",
      formula: submittedFormula,
      formula_gu: submittedFormula_gu,
    },
  ];
}

function repFromPublished(
  id: string,
  unit: KpiDef["unit"],
): LevelRepresentation {
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

type CatItem = Omit<KpiDef, "sort_order" | "level_representation"> & {
  sort_order?: number;
};

const ATT = "Attendance bot";
const SMA = "SMA";
/** roles that see a column-J "No" (not-visible-to-teacher) indicator. */
const NON_TEACHER = ["principal", "CRCC", "brc", "deo", "state"] as const;

/** OGM indicators (object form). Defaults applied below: availableInDataLake:true,
 *  pmShriApplicable:true. `lowestLevel:"school"` ⇒ school-and-above (hidden at
 *  grade/section). `roleVisibility:[...NON_TEACHER]` ⇒ column-J "No" (hidden from teacher). */
const RAW: Array<
  Partial<CatItem> &
    Pick<
      CatItem,
      | "id"
      | "domain_id"
      | "name"
      | "name_gu"
      | "unit"
      | "direction"
      | "data_source"
    >
> = [
  // ── Attendance — Daily · src "Attendance bot" ──
  {
    id: "att_chronic",
    domain_id: "attendance",
    name: "Students absent from past 7+ consecutive days",
    name_gu: "છેલ્લા 7+ સળંગ દિવસથી ગેરહાજર વિદ્યાર્થીઓ",
    unit: "count",
    direction: "lower",
    data_source: ATT,
    frequency: "Daily",
    displayStrategy: "count_with_rate",
    hero: true,
    showLastUpdatedOnUi: true,
    formula:
      "Counts students who have been absent for 7 or more consecutive school days as of the selected date.",
    description:
      "Absolute count of students absent 7+ consecutive school days as of the latest date (a count, not an average).",
  },
  {
    id: "att_teacher",
    domain_id: "attendance",
    name: "Teacher attendance",
    name_gu: "શિક્ષક હાજરી",
    unit: "%",
    direction: "higher",
    data_source: ATT,
    frequency: "Daily",
    displayStrategy: "trend_30d",
    lowestLevel: "school",
    roleVisibility: [...NON_TEACHER],
    showLastUpdatedOnUi: true,
    metrics: presentSubmittedMetrics(
      "Teachers Present / Total Teachers × 100",
      "હાજર શિક્ષકો / કુલ શિક્ષકો × 100",
      "Teachers Submitted / Total Teachers × 100",
      "સબમિટ કરેલ શિક્ષકો / કુલ શિક્ષકો × 100",
    ),
    formula:
      "Present: Teachers Present / Total Teachers × 100\nSubmitted: Teachers Submitted / Total Teachers × 100",
    description: "Officer-monitoring KPI — not a teacher self-evaluation card.",
  },
  {
    id: "att_student",
    domain_id: "attendance",
    name: "Student attendance",
    name_gu: "વિદ્યાર્થી હાજરી",
    unit: "%",
    direction: "higher",
    data_source: ATT,
    frequency: "Daily",
    displayStrategy: "trend_30d",
    showLastUpdatedOnUi: true,
    metrics: presentSubmittedMetrics(
      "Present Students / Total Students × 100",
      "હાજર વિદ્યાર્થીઓ / કુલ વિદ્યાર્થીઓ × 100",
      "Submitted Attendance / Total Students × 100",
      "સબમિટ કરેલ હાજરી / કુલ વિદ્યાર્થીઓ × 100",
    ),
    formula:
      "Present: Present Students / Total Students × 100\nSubmitted: Submitted Attendance / Total Students × 100",
  },
  {
    id: "att_mdm",
    domain_id: "attendance",
    name: "Students consuming Mid-day Meal (MDM)",
    name_gu: "મધ્યાહ્ન ભોજન (MDM) લેતા વિદ્યાર્થીઓ",
    unit: "%",
    direction: "higher",
    data_source: ATT,
    frequency: "Daily",
    displayStrategy: "trend_30d",
    lowestLevel: "school",
    showLastUpdatedOnUi: true,
    formula: "(Students Consuming MDM / Total eligible Students) × 100",
  },
  {
    id: "att_report",
    domain_id: "attendance",
    name: "Schools and Class Sections Submitting Attendance",
    name_gu: "હાજરી સબમિટ કરતી શાળાઓ અને વર્ગ વિભાગો",
    unit: "%",
    direction: "higher",
    data_source: ATT,
    frequency: "Daily",
    displayStrategy: "trend_30d",
    lowestLevel: "school",
    showLastUpdatedOnUi: true,
    formula:
      "Schools: (Schools That Filled Attendance / Total Schools) × 100\nClass sections: (Class Sections That Filled Attendance / Total Class Sections) × 100",
    metrics: [
      {
        id: "schools",
        label: "Schools",
        label_gu: "શાળાઓ",
        unit: "%",
        direction: "higher",
        formula: "Schools That Filled Attendance / Total Schools × 100",
        formula_gu: "હાજરી ભરેલ શાળાઓ / કુલ શાળાઓ × 100",
      },
      {
        id: "classSections",
        label: "Class sections",
        label_gu: "વર્ગ વિભાગો",
        unit: "%",
        direction: "higher",
        formula:
          "Class Sections That Filled Attendance / Total Classrooms × 100",
        formula_gu: "હાજરી ભરેલ વર્ગ વિભાગો / કુલ વર્ગખંડ × 100",
      },
    ],
  },

  // ── Assessment (§13 order): SAT reports downloaded → latest SAT → previous SAT
  //    → FLN → CET → CGMS. PARAKH + board result cards are injected by the screen. ──
  {
    id: "asm_remediation",
    domain_id: "assessment",
    name: "SAT reports downloaded in classrooms",
    name_gu: "વર્ગખંડોમાં ડાઉનલોડ થયેલ SAT રિપોર્ટ",
    unit: "%",
    direction: "higher",
    data_source: "Gyan Prabhav bot",
    frequency: "Daily",
    displayStrategy: "compliance",
    showLastUpdatedOnUi: true,
    suppressDelta: true,
    formula:
      "(Classrooms Where Report Was Downloaded / Total Classrooms) × 100",
    description:
      "Gyan Prabhav generates a SAT report card per classroom; this is the share of classrooms that downloaded it.",
  },
  {
    id: "asm_sat2",
    domain_id: "assessment",
    name: "Semester Assessment Test 2 (SAT 2)",
    name_gu: "સેમેસ્ટર મૂલ્યાંકન કસોટી 2 (SAT 2)",
    unit: "%",
    direction: "higher",
    data_source: "Xamta bot",
    frequency: "Yearly",
    displayStrategy: "snapshot_latest",
    hero: true,
    scheduleNote: "March",
    metrics: resultSubMetrics(
      "SAT 2",
      "%",
      "avgScore",
      "Avg score",
      "સરેરાશ સ્કોર",
    ),
    formula:
      "Latest SAT Result % (SAT 2, current year); year-on-year change vs the previous SAT 2.",
    description: "Latest SAT result — the result-first Assessment headline.",
  },
  {
    id: "asm_sat1",
    domain_id: "assessment",
    name: "Semester Assessment Test 1 (SAT 1)",
    name_gu: "સેમેસ્ટર મૂલ્યાંકન કસોટી 1 (SAT 1)",
    unit: "%",
    direction: "higher",
    data_source: "Xamta bot",
    frequency: "Yearly",
    displayStrategy: "snapshot_latest",
    scheduleNote: "September",
    metrics: resultSubMetrics(
      "SAT 1",
      "%",
      "avgScore",
      "Avg score",
      "સરેરાશ સ્કોર",
    ),
    formula:
      "SAT 1 Result % (current year); year-on-year change vs the previous SAT 1.",
    description: "Semester Assessment Test 1 — held every September.",
  },
  // ORF runs annually (sometimes 2–3 cycles a year), never monthly — modelled as Yearly
  // so the card chip and detail trend read in years, with the latest cycle as the value.
  {
    id: "asm_orf",
    domain_id: "assessment",
    name: "FLN - Oral Reading Fluency",
    name_gu: "FLN - મૌખિક વાચન પ્રવાહ",
    unit: "score",
    direction: "higher",
    data_source: "Oral Reading Fluency (ORF) Bot",
    availableInDataLake: false,
    frequency: "Yearly",
    displayStrategy: "snapshot_latest",
    metrics: resultSubMetrics(
      "ORF",
      "score",
      "cwpm",
      "CWPM score",
      "CWPM સ્કોર",
    ),
    formula:
      "Correct Words Per Minute (CWPM) score from the latest ORF cycle (held annually, sometimes 2–3 times a year). Trend compares this year's latest test with last year's first.",
    description:
      "Latest ORF cycle; cadence is irregular (annual to 2–3 cycles a year), so no monthly framing.",
  },
  {
    id: "asm_cet",
    domain_id: "assessment",
    name: "Common Entrance Test (CET)",
    name_gu: "કોમન એન્ટ્રન્સ ટેસ્ટ (CET)",
    unit: "%",
    direction: "higher",
    data_source: "Common Entrance Test (CET) Portal",
    availableInDataLake: false,
    frequency: "Yearly",
    displayStrategy: "snapshot_latest",
    roleVisibility: [...NON_TEACHER],
    metrics: [
      {
        id: "result",
        label: "Success rate of CET",
        label_gu: "CET સફળતા દર",
        unit: "%",
        direction: "higher",
        formula:
          "Success rate of CET (% of students clearing the exam) for the current year (Year N).",
        formula_gu:
          "ચાલુ વર્ષ (વર્ષ N) માટે CET સફળતા દર (પરીક્ષા પાસ કરનાર વિદ્યાર્થીઓના %).",
      },
      {
        id: "participation",
        label: "Participation",
        label_gu: "સહભાગિતા",
        unit: "%",
        direction: "higher",
        formula:
          "Class-5 students present for exam ÷ total enrolled in Class 5 × 100.",
        formula_gu:
          "પરીક્ષામાં હાજર ધોરણ 5 ના વિદ્યાર્થીઓ ÷ ધોરણ 5 ની કુલ નોંધણી × 100.",
      },
    ],
    formula:
      "Success rate of CET (current year); year-on-year change. Class-5 participation = Present / Enrolled × 100.",
  },
  {
    id: "asm_cgms",
    domain_id: "assessment",
    name: "Chief Minister Gyan Sadhna Merit Scholarship (CGMS)",
    name_gu: "મુખ્યમંત્રી જ્ઞાન સાધના મેરિટ શિષ્યવૃત્તિ (CGMS)",
    unit: "%",
    direction: "higher",
    data_source: "CGMS Portal",
    availableInDataLake: false,
    frequency: "Yearly",
    displayStrategy: "snapshot_latest",
    roleVisibility: [...NON_TEACHER],
    metrics: [
      {
        id: "result",
        label: "Success rate of CGMS",
        label_gu: "CGMS સફળતા દર",
        unit: "%",
        direction: "higher",
        formula:
          "Success rate of CGMS (% of students clearing the exam) for the current year (Year N).",
        formula_gu:
          "ચાલુ વર્ષ (વર્ષ N) માટે CGMS સફળતા દર (પરીક્ષા પાસ કરનાર વિદ્યાર્થીઓના %).",
      },
      {
        id: "participation",
        label: "Participation",
        label_gu: "સહભાગિતા",
        unit: "%",
        direction: "higher",
        formula:
          "Class-8 students present for exam ÷ total enrolled in Class 8 × 100.",
        formula_gu:
          "પરીક્ષામાં હાજર ધોરણ 8 ના વિદ્યાર્થીઓ ÷ ધોરણ 8 ની કુલ નોંધણી × 100.",
      },
    ],
    formula:
      "Success rate of CGMS (current year); year-on-year change. Class-8 participation = Present / Enrolled × 100.",
  },
  // ── Administration · School Observation (Monthly · SMA · officer-only) ──
  {
    id: "vis_CRCC_count",
    domain_id: "administration",
    sub_domain: "adm_visits",
    name: "No of CRCC/URC Visits per school",
    name_gu: "શાળા દીઠ CRCC/URC મુલાકાતની સંખ્યા",
    unit: "ratio",
    direction: "higher",
    data_source: SMA,
    availableInDataLake: false,
    frequency: "Monthly",
    displayStrategy: "count_with_rate",
    lowestLevel: "school",
    roleVisibility: [...NON_TEACHER],
    showLastUpdatedOnUi: true,
    target: "Max 3 / month",
    formula: "Count of CRCC/URC visits per school per month (max 3).",
    description: "A count out of 3 per month — not a percentage.",
  },
  {
    id: "vis_obs_completion",
    domain_id: "administration",
    sub_domain: "adm_visits",
    name: "School observations completed by CRCC/URC",
    name_gu: "CRCC/URC દ્વારા પૂર્ણ શાળા નિરીક્ષણ",
    unit: "%",
    direction: "higher",
    data_source: SMA,
    availableInDataLake: false,
    frequency: "Monthly",
    displayStrategy: "compliance",
    lowestLevel: "school",
    roleVisibility: [...NON_TEACHER],
    showLastUpdatedOnUi: true,
    formula:
      "Schools observed at least once that month / Total schools (classes 1–8) × 100",
  },
  {
    id: "vis_ict",
    domain_id: "administration",
    sub_domain: "adm_visits",
    name: "Schools using ICT Labs (%)",
    name_gu: "ICT લેબ વાપરતી શાળાઓ (%)",
    unit: "%",
    direction: "higher",
    data_source: SMA,
    availableInDataLake: false,
    frequency: "Monthly",
    displayStrategy: "compliance",
    lowestLevel: "school",
    roleVisibility: [...NON_TEACHER],
    showLastUpdatedOnUi: true,
    formula: "Active ICT Labs / Total ICT Labs × 100 (latest visit)",
  },
  {
    id: "vis_library",
    domain_id: "administration",
    sub_domain: "adm_visits",
    name: "Schools using Library (%)",
    name_gu: "પુસ્તકાલય વાપરતી શાળાઓ (%)",
    unit: "%",
    direction: "higher",
    data_source: SMA,
    availableInDataLake: false,
    frequency: "Monthly",
    displayStrategy: "compliance",
    lowestLevel: "school",
    roleVisibility: [...NON_TEACHER],
    showLastUpdatedOnUi: true,
    formula: "Active Libraries / Total Schools × 100 (latest visit)",
  },
  {
    id: "vis_smc",
    domain_id: "administration",
    sub_domain: "adm_visits",
    name: "Schools Conducting SMC Meetings",
    name_gu: "SMC બેઠક યોજતી શાળાઓ",
    unit: "%",
    direction: "higher",
    data_source: SMA,
    availableInDataLake: false,
    frequency: "Monthly",
    displayStrategy: "compliance",
    lowestLevel: "school",
    roleVisibility: [...NON_TEACHER],
    showLastUpdatedOnUi: true,
    formula: "SMC Meetings Conducted / Total Schools × 100 (latest status)",
  },
  // §16 — digital-learning usage (source: LMS). WASH/infra KPIs removed.
  {
    id: "ad_gshala",
    domain_id: "administration",
    sub_domain: "adm_visits",
    name: "G-SHALA/ G-SHALA + usage",
    name_gu: "G-SHALA/ G-SHALA + ઉપયોગ",
    unit: "%",
    direction: "higher",
    data_source: "LMS",
    availableInDataLake: false,
    frequency: "Monthly",
    displayStrategy: "compliance",
    lowestLevel: "school",
    roleVisibility: [...NON_TEACHER],
    showLastUpdatedOnUi: true,
    formula:
      "Active G-SHALA\ G-SHALA Plus users / Total eligible teachers & students × 100 (combined).",
  },
  {
    id: "ad_smart",
    domain_id: "administration",
    sub_domain: "adm_visits",
    name: "Smartclass usage",
    name_gu: "સ્માર્ટક્લાસ ઉપયોગ",
    unit: "%",
    direction: "higher",
    data_source: "LMS",
    availableInDataLake: false,
    frequency: "Monthly",
    displayStrategy: "compliance",
    lowestLevel: "school",
    roleVisibility: [...NON_TEACHER],
    showLastUpdatedOnUi: true,
    formula: "Smartclass sessions conducted / sessions planned × 100.",
  },
  {
    id: "ad_lab",
    domain_id: "administration",
    sub_domain: "adm_visits",
    name: "Computer lab usage",
    name_gu: "કમ્પ્યુટર લેબ ઉપયોગ",
    unit: "%",
    direction: "higher",
    data_source: "LMS",
    availableInDataLake: false,
    frequency: "Monthly",
    displayStrategy: "compliance",
    lowestLevel: "school",
    roleVisibility: [...NON_TEACHER],
    showLastUpdatedOnUi: true,
    formula: "Computer-lab periods conducted / periods scheduled × 100.",
  },
  {
    id: "ad_pal",
    domain_id: "administration",
    sub_domain: "adm_visits",
    name: "PAL usage",
    name_gu: "PAL ઉપયોગ",
    unit: "%",
    direction: "higher",
    data_source: "LMS",
    availableInDataLake: false,
    frequency: "Monthly",
    displayStrategy: "compliance",
    lowestLevel: "school",
    roleVisibility: [...NON_TEACHER],
    showLastUpdatedOnUi: true,
    formula:
      "Personalised Adaptive Learning (PAL) active users / total enrolled × 100.",
  },

  // ── Administration · Classroom Observation (Monthly · SMA · officer-only) ──
  {
    id: "vis_classroom_obs",
    domain_id: "administration",
    sub_domain: "adm_classroom",
    name: "Schools Visited for Classroom Observation",
    name_gu: "વર્ગખંડ નિરીક્ષણ માટે મુલાકાત લીધેલ શાળાઓ",
    unit: "%",
    direction: "higher",
    data_source: SMA,
    availableInDataLake: false,
    frequency: "Monthly",
    displayStrategy: "compliance",
    lowestLevel: "school",
    roleVisibility: [...NON_TEACHER],
    showLastUpdatedOnUi: true,
    formula:
      "Unique schools where a classroom was observed / Total Schools × 100 (latest visit)",
  },
  {
    id: "vis_lesson_plan",
    domain_id: "administration",
    sub_domain: "adm_classroom",
    name: "Classrooms following monthly lesson plans",
    name_gu: "માસિક પાઠ યોજના અનુસરતા વર્ગખંડો",
    unit: "%",
    direction: "higher",
    data_source: SMA,
    availableInDataLake: false,
    frequency: "Monthly",
    displayStrategy: "compliance",
    lowestLevel: "school",
    roleVisibility: [...NON_TEACHER],
    showLastUpdatedOnUi: true,
    formula: "'Yes' classrooms / Completed Classroom Observations × 100",
  },
  {
    id: "vis_teacher_diary",
    domain_id: "administration",
    sub_domain: "adm_classroom",
    name: "Classrooms with Completed Teacher Diaries",
    name_gu: "પૂર્ણ શિક્ષક ડાયરી ધરાવતા વર્ગખંડો",
    unit: "%",
    direction: "higher",
    data_source: SMA,
    availableInDataLake: false,
    frequency: "Monthly",
    displayStrategy: "compliance",
    lowestLevel: "school",
    roleVisibility: [...NON_TEACHER],
    showLastUpdatedOnUi: true,
    formula: "'Yes' classrooms / Completed Classroom Observations × 100",
  },

  // ── Administration · Student Retention (CTS + EWS) ──
  {
    id: "ret_dropout",
    domain_id: "administration",
    sub_domain: "adm_retention",
    name: "Untracked Students",
    name_gu: "અનટ્રેક કરેલા વિદ્યાર્થીઓ",
    unit: "count",
    direction: "lower",
    data_source: "CTS + EWS",
    availableInDataLake: false,
    frequency: "Daily",
    displayStrategy: "count_with_rate",
    // §19 — Untracked Students is the Administration hero (was CRC/URC visits).
    hero: true,
    lowestLevel: "school",
    showLastUpdatedOnUi: true,
    formula:
      "Students on roll who can no longer be located/tracked at the school (enrolment-gap method).",
  },
  {
    id: "ret_reenroll",
    domain_id: "administration",
    sub_domain: "adm_retention",
    name: "Re-enrolment of Out-of-School Students",
    name_gu: "શાળા બહારના વિદ્યાર્થીઓની પુનઃનોંધણી",
    unit: "%",
    direction: "higher",
    data_source: "CTS + EWS",
    availableInDataLake: false,
    frequency: "Half yearly",
    displayStrategy: "compliance",
    lowestLevel: "school",
    showLastUpdatedOnUi: true,
    dataLagNote:
      "Half-yearly; confirmed at the start of the next year from CTS, so expect a data lag.",
    formula:
      "Students Enrolled via Back-to-School Initiative / Total Flagged × 100",
  },

  // ── Administration · Continuous Professional Development (PLC · Yearly) ──
  {
    id: "cpd_hours",
    domain_id: "administration",
    sub_domain: "adm_cpd",
    name: "Average CPD Time Per Teacher",
    name_gu: "શિક્ષક દીઠ સરેરાશ CPD સમય",
    unit: "hours",
    direction: "higher",
    data_source: "PLC",
    availableInDataLake: false,
    pmShriApplicable: false,
    frequency: "Yearly",
    displayStrategy: "compliance",
    lowestLevel: "school",
    showLastUpdatedOnUi: true,
    metrics: [
      {
        id: "avgTime",
        label: "Average CPD time",
        label_gu: "સરેરાશ CPD સમય",
        unit: "hours",
        direction: "higher",
        formula:
          "Average of TPD hours by all enrolled teachers under any PLC training (capped at 50 hours per teacher).",
        formula_gu:
          "કોઈપણ PLC તાલીમ હેઠળ નોંધાયેલ તમામ શિક્ષકોના સરેરાશ TPD કલાક (શિક્ષક દીઠ 50 કલાકની મર્યાદા).",
      },
      {
        id: "teachersEngaged",
        label: "Teachers engaged in CPD",
        label_gu: "CPD માં સંકળાયેલ શિક્ષકો",
        unit: "%",
        direction: "higher",
        formula:
          "Teachers enrolled on PLC under any training / Total teachers × 100.",
        formula_gu:
          "કોઈપણ તાલીમ હેઠળ PLC પર નોંધાયેલ શિક્ષકો / કુલ શિક્ષકો × 100.",
      },
    ],
    formula:
      "Average CPD time: avg TPD hours per enrolled teacher on PLC (capped at 50h)\nTeachers engaged in CPD: Teachers enrolled on PLC / Total teachers × 100",
  },
  {
    id: "cpd_50",
    domain_id: "administration",
    sub_domain: "adm_cpd",
    name: "Teachers Achieving the 50-Hour CPD Target",
    name_gu: "50-કલાક CPD લક્ષ્ય હાંસલ કરનાર શિક્ષકો",
    unit: "%",
    direction: "higher",
    data_source: "PLC",
    availableInDataLake: false,
    pmShriApplicable: false,
    frequency: "Yearly",
    displayStrategy: "compliance",
    lowestLevel: "school",
    showLastUpdatedOnUi: true,
    formula: "Teachers Who Completed 50 Hours / Total Teachers × 100",
  },

  // ── School Quality (OUTPUT) — REAL GSQAC · annual · school-and-above ──
  {
    id: "sq_gsqac",
    domain_id: "school_quality",
    name: "GSQAC score",
    name_gu: "GSQAC સ્કોર",
    unit: "score",
    direction: "higher",
    data_source: "GSQAC Dashboard & Bot",
    availableInDataLake: false,
    frequency: "Yearly",
    displayStrategy: "snapshot_latest",
    hero: true,
    lowestLevel: "school",
    // GSQAC is a school-level TEAM metric — visible to teachers too (no roleVisibility
    // restriction), so the School Quality score/grade shows on the teacher homepage (§1).
    formula:
      "Latest GSQAC school score; averaged per level. Colour by GSQAC grade. 5 GSQAC domains converge into the overall score.",
  },
  {
    id: "sq_d1",
    domain_id: "school_quality",
    name: "Teaching and Learning",
    name_gu: "અધ્યાપન અને અધ્યયન",
    unit: "score",
    direction: "higher",
    data_source: "GSQAC Dashboard & Bot",
    availableInDataLake: false,
    frequency: "Yearly",
    displayStrategy: "snapshot_latest",
    context: true,
    lowestLevel: "school",
    roleVisibility: [...NON_TEACHER],
  },
  {
    id: "sq_d2",
    domain_id: "school_quality",
    name: "School Administration",
    name_gu: "શાળા વહીવટ",
    unit: "score",
    direction: "higher",
    data_source: "GSQAC Dashboard & Bot",
    availableInDataLake: false,
    frequency: "Yearly",
    displayStrategy: "snapshot_latest",
    context: true,
    lowestLevel: "school",
    roleVisibility: [...NON_TEACHER],
  },
  {
    id: "sq_d3",
    domain_id: "school_quality",
    name: "Co-scholastic Activities",
    name_gu: "સહ-અભ્યાસિક પ્રવૃત્તિઓ",
    unit: "score",
    direction: "higher",
    data_source: "GSQAC Dashboard & Bot",
    availableInDataLake: false,
    frequency: "Yearly",
    displayStrategy: "snapshot_latest",
    context: true,
    lowestLevel: "school",
    roleVisibility: [...NON_TEACHER],
  },
  {
    id: "sq_d4",
    domain_id: "school_quality",
    name: "usage of Resources",
    name_gu: "સંસાધનોનો ઉપયોગ",
    unit: "score",
    direction: "higher",
    data_source: "GSQAC Dashboard & Bot",
    availableInDataLake: false,
    frequency: "Yearly",
    displayStrategy: "snapshot_latest",
    context: true,
    lowestLevel: "school",
    roleVisibility: [...NON_TEACHER],
  },
  {
    id: "sq_d5",
    domain_id: "school_quality",
    name: "CET & CGMS (State Exams)",
    name_gu: "CET અને CGMS (રાજ્ય પરીક્ષાઓ)",
    unit: "score",
    direction: "higher",
    data_source: "GSQAC Dashboard & Bot",
    availableInDataLake: false,
    frequency: "Yearly",
    displayStrategy: "snapshot_latest",
    context: true,
    lowestLevel: "school",
    roleVisibility: [...NON_TEACHER],
    metrics: [
      // CET/CGMS lines reuse the exact Assessment participation series (asm_cet/asm_cgms),
      // so these graphs match the "Participation · Yearly trend" on the CET/CGMS detail pages.
      {
        id: "cet",
        label: "CET",
        label_gu: "CET",
        unit: "%",
        direction: "higher",
        sourceKpiId: "asm_cet__participation",
        formula:
          "Class-5 students present for the CET exam ÷ total enrolled in Class 5 × 100.",
        formula_gu:
          "પરીક્ષામાં હાજર ધોરણ 5 ના વિદ્યાર્થીઓ ÷ ધોરણ 5 ની કુલ નોંધણી × 100.",
      },
      {
        id: "cgms",
        label: "CGMS",
        label_gu: "CGMS",
        unit: "%",
        direction: "higher",
        sourceKpiId: "asm_cgms__participation",
        formula:
          "Class-8 students present for the CGMS exam ÷ total enrolled in Class 8 × 100.",
        formula_gu:
          "પરીક્ષામાં હાજર ધોરણ 8 ના વિદ્યાર્થીઓ ÷ ધોરણ 8 ની કુલ નોંધણી × 100.",
      },
    ],
  },
];

const CATALOG: CatItem[] = RAW.map((o) => ({
  availableInDataLake: true,
  pmShriApplicable: true,
  ...o,
}));

export const VSK_KPIS: KpiDef[] = CATALOG.map((item, i) => ({
  ...item,
  level_representation: repFromPublished(item.id, item.unit),
  sort_order: i,
}));

/** GSQAC's 5 output domains — names verbatim from the GSQAC Report Card 2024–25
 *  (D5 short-labelled "CET & CGMS (State Exams)"). Keys match the real CSV/seed. */
export const GSQAC_DOMAINS: {
  key: string;
  kpiId: string;
  name: string;
  name_gu: string;
}[] = [
  {
    key: "D1",
    kpiId: "sq_d1",
    name: "Teaching and Learning",
    name_gu: "અધ્યાપન અને અધ્યયન",
  },
  {
    key: "D2",
    kpiId: "sq_d2",
    name: "School Administration",
    name_gu: "શાળા વહીવટ",
  },
  {
    key: "D3",
    kpiId: "sq_d3",
    name: "Co-scholastic Activities",
    name_gu: "સહ-અભ્યાસિક પ્રવૃત્તિઓ",
  },
  {
    key: "D4",
    kpiId: "sq_d4",
    name: "usage of Resources",
    name_gu: "સંસાધનોનો ઉપયોગ",
  },
  {
    key: "D5",
    kpiId: "sq_d5",
    name: "CET & CGMS (State Exams)",
    name_gu: "CET અને CGMS (રાજ્ય પરીક્ષાઓ)",
  },
];
