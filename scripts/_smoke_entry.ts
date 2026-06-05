/* Runtime smoke test of the pure data + engine layer (no React/DOM). */
import { getFramework, PERIODS, FRAMEWORKS } from "@/config";
import { dataProvider } from "@/data/provider";
import { getScorecard, getPeerLeaderboard, getOverallCascade, getKpiRecord } from "@/engine";

const fw = getFramework("vsk6a");
const errs: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) errs.push("FAIL: " + m); };

// pick representatives across the hierarchy
const state = dataProvider.getEntity("st-gj")!;
const district = dataProvider.getDescendants("st-gj", "district")[0];
const cluster = dataProvider.getDescendants("st-gj", "cluster")[0];
const school = dataProvider.getDescendants("st-gj", "school")[0];
const section = dataProvider.getDescendants(school.id, "section")[0];

for (const e of [state, district, cluster, school, section]) {
  const sc = getScorecard(fw, e.id, PERIODS)!;
  ok(!!sc, `scorecard for ${e.level}`);
  ok(sc.overallPercent >= 0 && sc.overallPercent <= 100, `${e.level} overall in range (${sc.overallPercent})`);
  ok(!!sc.grade, `${e.level} has grade`);
  ok(sc.domainScores.length === fw.domains.length, `${e.level} has all domains`);
  console.log(`${e.level.padEnd(9)} ${e.name.slice(0, 22).padEnd(23)} score=${sc.overallPercent.toFixed(1).padStart(5)} grade=${sc.grade.padEnd(5)} status=${sc.status} callouts=${sc.callouts.length}`);
}

// section must be NA on a school-level KPI (gsqac_score), present on a class KPI (att_pct)
const secGsqac = getKpiRecord(fw, "gsqac_score", section.id, PERIODS)!;
ok(secGsqac.value === null, `section gsqac_score is NA (got ${secGsqac.value})`);
const secAtt = getKpiRecord(fw, "att_pct", section.id, PERIODS)!;
ok(secAtt.value !== null, `section att_pct present (got ${secAtt.value})`);
ok(secAtt.deltaWoW !== null, `section att_pct has Δ WoW`);
ok(secAtt.series.length === PERIODS.length, `att_pct series length`);

// school gsqac_score should reflect real CSV anchor
const schGsqac = getKpiRecord(fw, "gsqac_score", school.id, PERIODS)!;
ok(schGsqac.value !== null && Math.abs((schGsqac.value ?? 0) - (school.meta.gsqac?.total_percent ?? -1)) < 6, `school gsqac near real anchor (val=${schGsqac.value}, real=${school.meta.gsqac?.total_percent})`);

// cascade overall: state→…→section, all levels present, current flagged
const casc = getOverallCascade(fw, section.id, PERIODS);
ok(casc.length >= 5, `cascade has the level chain (${casc.length})`);
ok(casc.filter((c) => c.isCurrent).length === 1, `exactly one current in cascade`);

// leaderboard of school's sibling sections
const lb = getPeerLeaderboard(fw, section.id, PERIODS);
ok(lb.length >= 1, `leaderboard non-empty`);
ok(lb[0].rank === 1, `leaderboard ranked from 1`);
ok(lb.some((e) => e.isCurrent), `current entity in leaderboard`);

// framework swap: SQAF renders different domains
const sqaf = getScorecard(FRAMEWORKS.sqaf, school.id, PERIODS)!;
ok(sqaf.domainScores.length === FRAMEWORKS.sqaf.domains.length, `SQAF swap renders its domains (${sqaf.domainScores.length})`);
ok(sqaf.domainScores.some((d) => d.domain.id === "learning"), `SQAF has Learning domain`);

// district-only KPI: NA at school, present at district
const schDropout = getKpiRecord(fw, "dst_dropout", school.id, PERIODS)!;
ok(schDropout.value === null, `dst_dropout NA at school`);
const distDropout = getKpiRecord(fw, "dst_dropout", district.id, PERIODS)!;
ok(distDropout.value !== null, `dst_dropout present at district`);

// ── rollup consistency (the review's major finding) ──
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
// school att_pct must equal the mean of its grades, and grade == mean of its sections
const grades = dataProvider.getDescendants(school.id, "grade");
const schoolAtt = getKpiRecord(fw, "att_pct", school.id, PERIODS)!.value!;
const gradeAttVals = grades.map((g) => getKpiRecord(fw, "att_pct", g.id, PERIODS)!.value!).filter((v) => v != null);
ok(Math.abs(schoolAtt - mean(gradeAttVals)) <= 0.6, `school att_pct (${schoolAtt}) == mean of grades (${mean(gradeAttVals).toFixed(1)})`);
const g0 = grades[0];
const secVals = dataProvider.getChildren(g0.id).map((s) => getKpiRecord(fw, "att_pct", s.id, PERIODS)!.value!);
const g0Att = getKpiRecord(fw, "att_pct", g0.id, PERIODS)!.value!;
ok(Math.abs(g0Att - mean(secVals)) <= 0.6, `grade att_pct (${g0Att}) == mean of its sections (${mean(secVals).toFixed(1)})`);

// district dst_reenroll must equal the mean of its blocks
const blocks = dataProvider.getDescendants(district.id, "block");
const distRe = getKpiRecord(fw, "dst_reenroll", district.id, PERIODS)!.value!;
const blockRe = blocks.map((b) => getKpiRecord(fw, "dst_reenroll", b.id, PERIODS)!.value!).filter((v) => v != null);
ok(Math.abs(distRe - mean(blockRe)) <= 0.6, `district dst_reenroll (${distRe}) == mean of its blocks (${mean(blockRe).toFixed(1)})`);

// all-NA scope (section under SQAF, all school-up KPIs) → explicit NA overall
const sqafSection = getScorecard(FRAMEWORKS.sqaf, section.id, PERIODS)!;
ok(sqafSection.overallPercent === null && sqafSection.grade === null && sqafSection.status === "na", `all-NA section under SQAF → NA overall (got ${sqafSection.overallPercent}/${sqafSection.grade}/${sqafSection.status})`);

console.log("\nSWAP check — SQAF overall for school:", (sqaf.overallPercent ?? 0).toFixed(1), sqaf.grade);
console.log(`\n${errs.length ? errs.join("\n") : "ALL SMOKE CHECKS PASSED ✓"}`);
if (errs.length) process.exitCode = 1;
