/* Runtime smoke test of the pure data + engine layer (no React/DOM). */
import { getFramework, PERIODS, PUBLISHED } from "@/config";
import { dataProvider } from "@/data/provider";
import { getScorecard, getKpiRecord } from "@/engine";
import { roleFromIdLength } from "@/lib/format";
import meta from "@/data/seed/meta.json";

const fw = getFramework();
const errs: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) errs.push("FAIL: " + m); };
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);

// framework shape (5A · 29 KPIs)
ok(fw.id === "unified", "single unified framework");
ok(fw.kpis.length === 29, `29 KPIs (got ${fw.kpis.length})`);
ok(fw.domains.length === 5, `5A domains (got ${fw.domains.length})`);
ok(fw.domains.map((d) => d.id).join(",") === "a1,a2,a3,a4,a5", "domains A1–A5 only (no A6/District/SQAF)");
ok(Math.abs(fw.domains.reduce((s, d) => s + d.weightage, 0) - 1) < 1e-9, "weightages sum to 100%");
ok(!!fw.domains.find((d) => d.id === "a4")?.sub_domains?.length, "A4 has the sub-domain seam");

const state = dataProvider.getEntity("st-gj")!;
const district = dataProvider.getDescendants("st-gj", "district")[0];
const school = dataProvider.getDescendants("st-gj", "school")[0];
const section = dataProvider.getDescendants(school.id, "section")[0];

for (const e of [state, district, school, section]) {
  const sc = getScorecard(fw, e.id, PERIODS)!;
  ok(!!sc && sc.overallPercent != null && sc.overallPercent >= 0 && sc.overallPercent <= 100, `${e.level} overall in range`);
  console.log(`${e.level.padEnd(9)} ${e.name.slice(0, 22).padEnd(23)} score=${(sc.overallPercent ?? 0).toFixed(1).padStart(5)} grade=${sc.grade ?? "NA"}`);
}

// NA per the published table
ok(getKpiRecord(fw, "schools_meeting", section.id, PERIODS)!.value === null, "section schools_meeting is NA (school-only KPI)");
ok(getKpiRecord(fw, "att_pct", section.id, PERIODS)!.value !== null, "section att_pct present");
ok(getKpiRecord(fw, "grant_expenditure", school.id, PERIODS)!.value === null, "school grant_expenditure NA (cluster+ only)");

// grade rolls up from its sections (internal consistency below school)
const grade = dataProvider.getDescendants(school.id, "grade")[0];
const gradeAtt = getKpiRecord(fw, "att_pct", grade.id, PERIODS)!.value!;
const secAtt = dataProvider.getChildren(grade.id).map((s) => getKpiRecord(fw, "att_pct", s.id, PERIODS)!.value!);
ok(Math.abs(gradeAtt - mean(secAtt)) <= 0.6, `grade att == mean(sections) (${gradeAtt} vs ${mean(secAtt).toFixed(1)})`);

// each level's AVERAGE matches its published number (the source-of-truth requirement)
const schools = dataProvider.getDescendants("st-gj", "school");
const schoolAttAvg = mean(schools.map((s) => getKpiRecord(fw, "att_pct", s.id, PERIODS)!.value!));
ok(Math.abs(schoolAttAvg - PUBLISHED.att_pct.school!) <= 4, `school-avg att ≈ published ${PUBLISHED.att_pct.school} (got ${schoolAttAvg.toFixed(1)})`);
const stateAtt = getKpiRecord(fw, "att_pct", "st-gj", PERIODS)!.value!;
ok(Math.abs(stateAtt - PUBLISHED.att_pct.state!) <= 14, `state att ≈ published ${PUBLISHED.att_pct.state} (got ${stateAtt})`);
const clusters = dataProvider.getDescendants("st-gj", "cluster");
const clAttAvg = mean(clusters.map((c) => getKpiRecord(fw, "att_pct", c.id, PERIODS)!.value!));
ok(Math.abs(clAttAvg - PUBLISHED.att_pct.cluster!) <= 4, `cluster-avg att ≈ published ${PUBLISHED.att_pct.cluster} (got ${clAttAvg.toFixed(1)})`);

// PM SHRI filter changes aggregates
dataProvider.setSchoolFilter("all");
const allS = getScorecard(fw, "st-gj", PERIODS)!.overallPercent;
dataProvider.setSchoolFilter("pmshri");
const pmS = getScorecard(fw, "st-gj", PERIODS)!.overallPercent;
dataProvider.setSchoolFilter("all");
ok(pmS !== allS, `PM SHRI filter changes the state aggregate (all=${allS} pm=${pmS})`);

// login: role inferred from ID length + correct second field
ok(roleFromIdLength("24") === "state" && roleFromIdLength("2401") === "deo" && roleFromIdLength("240101") === "brc", "officer ID lengths → roles");
ok(roleFromIdLength("24000009") === "teacher" && roleFromIdLength("2401010001") === "crc" && roleFromIdLength("24010100011") === "principal", "teacher/cluster/school ID lengths → roles");
const deo = meta.demoLogins.find((d) => d.role === "deo")!;
ok(!!dataProvider.resolveLogin("deo", deo.login_id, deo.passcode!) && !dataProvider.resolveLogin("deo", deo.login_id, "9999"), "DEO logs in with District ID + PIN; wrong PIN rejected");

console.log(`\n${errs.length ? errs.join("\n") : "ALL SMOKE CHECKS PASSED ✓"}`);
if (errs.length) process.exitCode = 1;
