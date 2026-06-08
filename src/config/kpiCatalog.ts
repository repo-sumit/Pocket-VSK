import type { KpiDef, Level, LevelRepresentation, Representation } from "@/types";

/**
 * Unified Portal — 4A KPI catalog (Attendance · Assessment · Administration ·
 * School Quality). Built from Table 3 of `OGM 3.0 - KPIs_6th June_draft 1.csv`
 * (hybrid set, with data sources), enriched with Table 1's indicators.
 *
 * PUBLISHED holds the per-level sample figures (section/Teacher · school ·
 * cluster · block · district · state) — MockProvider anchors each level to its
 * number with per-entity spread and rolls section→grade up. A missing level key
 * = "—" in the sheet = NOT APPLICABLE (hidden, never "NA-clutter").
 *
 * `unit` encodes the metric TYPE: "%"=pct, "score"=0–100 score (both fold into
 * the domain average; lower-is-better is inverted in the engine); "count"/"hours"
 * = CONTEXT (shown, not averaged). `direction` marks higher/lower-is-better.
 * School Quality (sq_*) values come from REAL GSQAC data (entity.meta.gsqac) in
 * the provider; the PUBLISHED rows are nominal fallbacks only.
 */

type Pub = Partial<Record<Level, number>>;
export const PUBLISHED: Record<string, Pub> = {
  // ── Attendance (input) ───────────────────────────────────────────────
  att_teacher: { section: 92, school: 89, cluster: 91, block: 93, district: 94, state: 95 },
  att_student: { section: 88, school: 86, cluster: 87, block: 89, district: 91, state: 92 },
  att_mdm: { section: 95, school: 94, cluster: 96, block: 97, district: 98, state: 99 },
  att_ifa: { section: 82, school: 84, cluster: 86, block: 88, district: 90, state: 92 },
  att_irregular: { section: 18, school: 15, cluster: 14, block: 12, district: 10, state: 9 },
  att_chronic: { section: 4, school: 18, cluster: 62, block: 215, district: 790, state: 4100 },
  att_report: { section: 90, school: 92, cluster: 91, block: 93, district: 94, state: 95 }, // TODO: confirm definition (schools reporting 100% compliance)
  // ── Assessment (input) ───────────────────────────────────────────────
  asm_participation: { section: 91, school: 89, cluster: 90, block: 92, district: 93, state: 94 },
  asm_sat1: { section: 67, school: 69, cluster: 71, block: 73, district: 75, state: 77 },
  asm_sat2: { section: 71, school: 72, cluster: 74, block: 76, district: 78, state: 80 },
  asm_cet: { section: 64, school: 66, cluster: 68, block: 70, district: 72, state: 74 },
  asm_cgms: { section: 72, school: 73, cluster: 75, block: 77, district: 79, state: 81 },
  asm_merit: { section: 8, school: 42, cluster: 156, block: 684, district: 2450, state: 14500 },
  asm_nas: { section: 61, school: 64, cluster: 66, block: 68, district: 71, state: 74 },
  asm_sma_remediation: { section: 78, school: 81, cluster: 83, block: 85, district: 88, state: 90 },
  asm_classroom_prep: { section: 84, school: 86, cluster: 88, block: 89, district: 91, state: 92 },
  asm_below: { section: 32, school: 29, cluster: 27, block: 24, district: 21, state: 18 },
  asm_improvement: { section: 12, school: 14, cluster: 15, block: 17, district: 18, state: 20 },
  asm_orf_fln: { section: 9, school: 11, cluster: 13, block: 15, district: 17, state: 19 },
  asm_sma_hygiene: { section: 79, school: 82, cluster: 84, block: 86, district: 88, state: 91 },
  asm_reports: { section: 80, school: 82, cluster: 81, block: 83, district: 84, state: 86 }, // TODO: confirm (Gyan Prabhav, class level)
  // ── Administration · Teachers ────────────────────────────────────────
  tpd_hours: { section: 76, school: 81, cluster: 84, block: 87, district: 89, state: 92 },
  tpd_avg_hours: { section: 38, school: 40, cluster: 42, block: 43, district: 44, state: 46 },
  module_completion: { section: 84, school: 88, cluster: 82, block: 86, district: 80, state: 95 }, // TODO: confirm (Gyan Prabhav)
  // ── Administration · Scheme & Payment Delivery ───────────────────────
  scheme_delivery: { section: 88, school: 90, cluster: 89, block: 91, district: 92, state: 93 },
  payment_completion: { section: 86, school: 88, cluster: 87, block: 89, district: 90, state: 91 }, // TODO: "seems very similar to scheme delivery" (Chaitanya)
  pending_payments: { section: 5, school: 25, cluster: 125, block: 600, district: 3000, state: 24000 },
  tlm_usage: { section: 68, school: 72, cluster: 75, block: 78, district: 81, state: 85 },
  // ── Administration · Resource Usage (SMA; may not apply to all schools) ─
  res_cwsn: { section: 62, school: 68, cluster: 72, block: 76, district: 82, state: 88 },
  res_sports: { section: 58, school: 63, cluster: 67, block: 71, district: 76, state: 82 },
  res_ict: { section: 64, school: 69, cluster: 73, block: 77, district: 82, state: 86 },
  res_library: { section: 66, school: 70, cluster: 74, block: 78, district: 82, state: 87 },
  res_wash: { section: 81, school: 84, cluster: 87, block: 90, district: 92, state: 95 },
  // ── Administration · Program Implementation ──────────────────────────
  prog_mdm_quality: { section: 83, school: 86, cluster: 88, block: 90, district: 92, state: 94 },
  prog_uniform_books: { section: 91, school: 93, cluster: 95, block: 96, district: 98, state: 99 },
  prog_smc: { section: 74, school: 79, cluster: 83, block: 86, district: 89, state: 92 },
  // ── Administration · Visits & Observations ───────────────────────────
  vis_crc: { section: 85, school: 88, cluster: 90, block: 92, district: 94, state: 95 },
  vis_brc: { section: 80, school: 84, cluster: 87, block: 90, district: 92, state: 94 },
  vis_crc_verify: { section: 86, school: 88, cluster: 90, block: 92, district: 94, state: 95 },
  vis_obs_completion: { section: 72, school: 76, cluster: 80, block: 84, district: 88, state: 92 },
  vis_obs_score: { section: 68, school: 71, cluster: 74, block: 77, district: 80, state: 84 },
  vis_ptr: { section: 70, school: 73, cluster: 76, block: 80, district: 84, state: 88 },
  // ── Administration · Issue & Risk Resolution ─────────────────────────
  iss_pending: { section: 4, school: 18, cluster: 62, block: 215, district: 790, state: 4100 },
  iss_repeat: { section: 11, school: 10, cluster: 9, block: 8, district: 7, state: 6 },
  iss_action_flagged: { section: 72, school: 76, cluster: 80, block: 84, district: 88, state: 92 },
  // ── Administration · Retention & SSA Fund Usage ──────────────────────
  ret_dropout: { section: 6, school: 8, cluster: 10, block: 12, district: 14, state: 16 },
  ret_reenroll: { section: 71, school: 75, cluster: 79, block: 83, district: 87, state: 91 },
  ret_grant: { cluster: 88, block: 91, district: 94, state: 96 }, // "—" teacher/school: cluster+ only. TODO: what's the metric? (State)
  ret_pmshri: { school: 75, cluster: 78, block: 81, district: 84, state: 88 }, // TODO: PM SHRI metric definition? (State)
  // GSQAC-derived DECISION metrics live under Administration (per CEO), not School Quality
  ret_schools_meeting: { school: 69, cluster: 69, block: 56, district: 58, state: 57 },
  ret_low_performing: { school: 1, cluster: 8, block: 40, district: 200, state: 1600 },
  ret_improvement_actions: { section: 80, school: 82, cluster: 87, block: 83, district: 77, state: 86 },
  // ── School Quality (OUTPUT) — nominal; provider sources REAL GSQAC ────
  sq_gsqac: { school: 73, cluster: 73, block: 72, district: 74, state: 73 },
  sq_improvement: { school: 5, cluster: 6, block: 5, district: 6, state: 6 }, // TODO: real prior-cycle data pending (GSQAC file is single-round)
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

const ATT = "Attendance Monitoring System · Attendance Bot";
const ASM = "Gyan Prabhav · Xamta Bot";
const SMA = "SMA";

const CATALOG: CatItem[] = [
  // ── A · Attendance (input, 30%) ──────────────────────────────────────
  k("att_teacher", "attendance", undefined, "Teacher attendance %", "શિક્ષક હાજરી %", "%", "higher", ATT),
  k("att_student", "attendance", undefined, "Student attendance %", "વિદ્યાર્થી હાજરી %", "%", "higher", ATT),
  k("att_mdm", "attendance", undefined, "MDM served %", "MDM પીરસેલ %", "%", "higher", ATT),
  k("att_ifa", "attendance", undefined, "IFA distribution %", "IFA વિતરણ %", "%", "higher", ATT),
  k("att_irregular", "attendance", undefined, "Irregular students %", "અનિયમિત વિદ્યાર્થીઓ %", "%", "lower", ATT),
  k("att_chronic", "attendance", undefined, "Chronic absentee students", "સતત ગેરહાજર વિદ્યાર્થીઓ", "count", "lower", ATT,
    "≥7 consecutive days", "Students absent 7+ consecutive days; shown as a count and in % of enrolment."),
  k("att_report", "attendance", undefined, "Attendance reporting compliance %", "હાજરી રિપોર્ટિંગ અનુપાલન %", "%", "higher", ATT,
    "100%", "Share of schools reporting attendance by the daily cut-off."),

  // ── A · Assessment (input, 30%) ──────────────────────────────────────
  k("asm_participation", "assessment", undefined, "Assessment participation %", "મૂલ્યાંકન સહભાગિતા %", "%", "higher", ASM),
  k("asm_sat1", "assessment", undefined, "SAT 1 score", "SAT 1 સ્કોર", "score", "higher", ASM),
  k("asm_sat2", "assessment", undefined, "SAT 2 score", "SAT 2 સ્કોર", "score", "higher", ASM),
  k("asm_cet", "assessment", undefined, "CET score", "CET સ્કોર", "score", "higher", ASM),
  k("asm_cgms", "assessment", undefined, "CGMS score", "CGMS સ્કોર", "score", "higher", ASM),
  k("asm_merit", "assessment", undefined, "Merit list (selected students)", "મેરિટ યાદી (પસંદ વિદ્યાર્થીઓ)", "count", "higher", ASM),
  k("asm_nas", "assessment", undefined, "NAS score", "NAS સ્કોર", "score", "higher", ASM, "annual"),
  k("asm_sma_remediation", "assessment", undefined, "SMA remediation compliance %", "SMA ઉપચાર અનુપાલન %", "%", "higher", ASM),
  k("asm_classroom_prep", "assessment", undefined, "Classroom preparation %", "વર્ગખંડ તૈયારી %", "%", "higher", ASM),
  k("asm_below", "assessment", undefined, "Students below academic result %", "શૈક્ષણિક પરિણામથી નીચે %", "%", "lower", ASM),
  k("asm_improvement", "assessment", undefined, "Student improvement from previous cycle %", "પાછલા ચક્રથી વિદ્યાર્થી સુધારો %", "%", "higher", ASM, undefined, undefined, undefined, { context: true, rag: { green: 10, amber: 5 } }),
  k("asm_orf_fln", "assessment", undefined, "Improvement in ORF / FLN Reading %", "ORF / FLN વાચનમાં સુધારો %", "%", "higher", "ORF Bot · FLN", undefined, undefined, undefined, { context: true, rag: { green: 8, amber: 4 } }),
  k("asm_sma_hygiene", "assessment", undefined, "SMA compliance / practice hygiene %", "SMA અનુપાલન / અભ્યાસ સ્વચ્છતા %", "%", "higher", ASM),
  k("asm_reports", "assessment", undefined, "Reports downloaded %", "રિપોર્ટ ડાઉનલોડ %", "%", "higher", "Gyan Prabhav"),

  // ── A · Administration (input, 40%) · Teachers (TPD) ─────────────────
  k("tpd_hours", "administration", "adm_teachers", "Teacher TPD hours completion %", "શિક્ષક TPD કલાક પૂર્ણતા %", "%", "higher", "PLC · Gyan Prabhav",
    "Min 50 hrs/yr", "Teachers completing the 50-hour annual TPD requirement."),
  k("tpd_avg_hours", "administration", "adm_teachers", "Avg TPD hours / teacher", "સરેરાશ TPD કલાક / શિક્ષક", "hours", "higher", "PLC · Gyan Prabhav"),
  k("module_completion", "administration", "adm_teachers", "Module completion %", "મોડ્યુલ પૂર્ણતા %", "%", "higher", "Gyan Prabhav"),
  // ── Administration · Scheme & Payment Delivery ───────────────────────
  k("scheme_delivery", "administration", "adm_schemes", "Scheme delivery %", "યોજના વિતરણ %", "%", "higher", "Namo / IPMS"),
  k("payment_completion", "administration", "adm_schemes", "Payment completion %", "ચુકવણી પૂર્ણતા %", "%", "higher", "Namo / IPMS",
    undefined, "Mapped beneficiaries actually paid. // TODO: confirm vs scheme delivery (Chaitanya)."),
  k("pending_payments", "administration", "adm_schemes", "Pending payment / issues", "બાકી ચુકવણી / સમસ્યાઓ", "count", "lower", "Namo / IPMS"),
  k("tlm_usage", "administration", "adm_schemes", "TLM usage %", "TLM ઉપયોગ %", "%", "higher", "Namo / IPMS"),
  // ── Administration · Resource Usage ──────────────────────────────────
  k("res_cwsn", "administration", "adm_resources", "CWSN facility availability %", "CWSN સુવિધા ઉપલબ્ધતા %", "%", "higher", SMA),
  k("res_sports", "administration", "adm_resources", "Sports tools usage %", "રમતગમત સાધન ઉપયોગ %", "%", "higher", SMA),
  k("res_ict", "administration", "adm_resources", "ICT lab usage %", "ICT લેબ ઉપયોગ %", "%", "higher", SMA,
    undefined, "// TODO: may not apply to all schools (Chaitanya)."),
  k("res_library", "administration", "adm_resources", "Library usage %", "પુસ્તકાલય ઉપયોગ %", "%", "higher", SMA),
  k("res_wash", "administration", "adm_resources", "WASH compliance %", "WASH અનુપાલન %", "%", "higher", SMA),
  // ── Administration · Program Implementation ──────────────────────────
  k("prog_mdm_quality", "administration", "adm_programs", "MDM quality compliance %", "MDM ગુણવત્તા અનુપાલન %", "%", "higher", SMA),
  k("prog_uniform_books", "administration", "adm_programs", "Uniform & books distribution %", "ગણવેશ અને પુસ્તક વિતરણ %", "%", "higher", SMA),
  k("prog_smc", "administration", "adm_programs", "SMC meeting compliance %", "SMC બેઠક અનુપાલન %", "%", "higher", SMA),
  // ── Administration · Visits & Observations ───────────────────────────
  k("vis_crc", "administration", "adm_visits", "CRC visit %", "CRC મુલાકાત %", "%", "higher", SMA),
  k("vis_brc", "administration", "adm_visits", "BRC visit %", "BRC મુલાકાત %", "%", "higher", SMA),
  k("vis_crc_verify", "administration", "adm_visits", "CRC attendance verification %", "CRC હાજરી ચકાસણી %", "%", "higher", SMA),
  k("vis_obs_completion", "administration", "adm_visits", "Classroom observation completion %", "વર્ગખંડ નિરીક્ષણ પૂર્ણતા %", "%", "higher", SMA),
  k("vis_obs_score", "administration", "adm_visits", "Classroom observation outcome score", "વર્ગખંડ નિરીક્ષણ પરિણામ સ્કોર", "score", "higher", SMA),
  k("vis_ptr", "administration", "adm_visits", "PTR compliance (27:1) %", "PTR અનુપાલન (27:1) %", "%", "higher", SMA,
    "27:1", "Schools meeting the 27:1 pupil-teacher ratio (folds in the old compliance box)."),
  // ── Administration · Issue & Risk Resolution ─────────────────────────
  k("iss_pending", "administration", "adm_issues", "Pending issues count", "બાકી સમસ્યાઓની સંખ્યા", "count", "lower", "CAL · SMA · EWS"),
  k("iss_repeat", "administration", "adm_issues", "Repeat issues %", "પુનરાવર્તિત સમસ્યાઓ %", "%", "lower", "CAL · SMA"),
  k("iss_action_flagged", "administration", "adm_issues", "Action taken on flagged cases %", "ફ્લેગ કરેલ કેસ પર પગલાં %", "%", "higher", "At-Risk model · SMA"),
  // ── Administration · Retention & SSA Fund Usage ──────────────────────
  k("ret_dropout", "administration", "adm_retention", "Reduction in dropout %", "ડ્રોપઆઉટમાં ઘટાડો %", "%", "higher", "EWS · CTS", undefined, undefined, undefined, { context: true, rag: { green: 8, amber: 4 } }),
  k("ret_reenroll", "administration", "adm_retention", "Re-enrolment of OoSC vs target %", "OoSC પુનઃનોંધણી vs લક્ષ્ય %", "%", "higher", "Back-to-school Bot · CTS"),
  k("ret_grant", "administration", "adm_retention", "Grant & expenditure (Samagra Shiksha) %", "અનુદાન અને ખર્ચ (સમગ્ર શિક્ષા) %", "%", "higher", "State",
    "≥ 85%", "Fund utilisation against the approved budget. Cluster+ only. // TODO: confirm metric (State)."),
  k("ret_pmshri", "administration", "adm_retention", "Performance of PM SHRI schools", "PM SHRI શાળા પ્રદર્શન", "score", "higher", "State",
    undefined, "// TODO: confirm PM SHRI metric definition (State)."),
  k("ret_schools_meeting", "administration", "adm_retention", "Schools meeting benchmark %", "બેન્ચમાર્ક પૂર્ણ કરતી શાળાઓ %", "%", "higher", "GSQAC",
    undefined, "GSQAC-derived decision metric (routed to Administration per CEO)."),
  k("ret_low_performing", "administration", "adm_retention", "Low-performing schools", "ઓછું પ્રદર્શન કરતી શાળાઓ", "count", "lower", "GSQAC",
    undefined, "GSQAC C/D-band schools needing support."),
  k("ret_improvement_actions", "administration", "adm_retention", "Improvement actions completed %", "સુધારણા ક્રિયાઓ પૂર્ણ %", "%", "higher", "SMA · GSQAC"),

  // ── A · School Quality (OUTPUT, annual) — REAL GSQAC ─────────────────
  k("sq_gsqac", "school_quality", undefined, "GSQAC score", "GSQAC સ્કોર", "score", "higher", "GSQAC Dashboard · GSQAC Bot",
    "Grade A", "Composite GSQAC school-quality score (the annual outcome, shown as-is)."),
  k("sq_improvement", "school_quality", undefined, "Improvement vs last cycle %", "ગયા ચક્ર સામે સુધારો %", "%", "higher", "GSQAC Dashboard · GSQAC Bot",
    undefined, "Change in GSQAC score since the previous cycle. // TODO: real prior-cycle data pending."),
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
  target?: string,
  description?: string,
  description_gu?: string,
  extra?: { context?: boolean; rag?: { green: number; amber: number }; weight?: number },
): CatItem {
  return { id, domain_id, sub_domain, name, name_gu, unit, direction, data_source, target, description, description_gu, ...extra };
}

export const VSK_KPIS: KpiDef[] = CATALOG.map((item, i) => ({
  ...item,
  level_representation: repFromPublished(item.id, item.unit),
  sort_order: i,
}));

/** GSQAC's 5 output sub-domains (the School-Quality breakdown — D-keys match the real CSV). */
export const GSQAC_DOMAINS: { key: string; name: string; name_gu: string }[] = [
  { key: "D1", name: "Learning & Teaching", name_gu: "અધ્યયન અને અધ્યાપન" },
  { key: "D2", name: "Administration", name_gu: "વહીવટ" },
  { key: "D3", name: "Co-curricular", name_gu: "સહઅભ્યાસિક" },
  { key: "D4", name: "Resources", name_gu: "સંસાધનો" },
  { key: "D5", name: "Scholarships", name_gu: "શિષ્યવૃત્તિ" },
];
