// @ts-nocheck
/**
 * Unified Portal seed generator. Builds the org tree from the REAL GSQAC
 * `gsqac 2024-25.csv` (real district/block/cluster/school NAMES + real GSQAC
 * total/grade/D1–D5), but assigns clean, prefix-NESTED numeric codes matching
 * the corrected ID formats:
 *   State 2 · District 4 · Block 6 · Cluster 10 · School 11 · Teacher 8 · Student 18
 * People names (teachers, principals, officers) are randomised/anonymised
 * (FCR-1.1). Some schools are flagged PM SHRI. Run: `npm run seed`.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CSV = join(ROOT, "..", "GSQAC", "gsqac 2024-25.csv");
const OUT = join(ROOT, "src", "data", "seed");

const N_DISTRICTS = 4, N_BLOCKS = 3, N_CLUSTERS = 4, N_SCHOOLS = 5;
const PREFERRED = ["KACHCHH", "BANASKANTHA", "AHMEDABAD", "PATAN", "SURENDRANAGAR"];
const STATE_CODE = "24"; // Gujarat

// ── CSV parse (quote-aware) ──────────────────────────────────────────
function parseLine(line) {
  const out = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === "," && !q) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur); return out;
}
const raw = readFileSync(CSV, "utf8").split(/\r?\n/).filter((l) => l.trim().length);
const header = parseLine(raw[0]);
const ci = (n) => header.indexOf(n);
const idx = {
  district: ci("district"), block: ci("block"), cluster: ci("cluster"), school: ci("school"),
  pct: ci("total_percent"), grade: ci("grade_text"),
  d1: ci("% Achieved - D1"), d2: ci("% Achieved - D2"), d3: ci("% Achieved - D3"), d4: ci("% Achieved - D4"), d5: ci("% Achieved - D5"),
};
const num = (v) => { const n = parseFloat(String(v ?? "").replace("%", "").trim()); return Number.isFinite(n) ? n : 0; };
const rows = raw.slice(1).map(parseLine).map((r) => ({
  district: r[idx.district], block: r[idx.block], cluster: r[idx.cluster], school: r[idx.school],
  pct: num(r[idx.pct]), grade: (r[idx.grade] || "C").trim(),
  d1: num(r[idx.d1]), d2: num(r[idx.d2]), d3: num(r[idx.d3]), d4: num(r[idx.d4]), d5: num(r[idx.d5]),
})).filter((r) => r.district && r.block && r.cluster && r.school && r.pct > 0);

// group by real names: district → block → cluster → [schools]
const tree = new Map();
for (const r of rows) {
  const dm = tree.get(r.district) ?? new Map(); tree.set(r.district, dm);
  const cm = dm.get(r.block) ?? new Map(); dm.set(r.block, cm);
  const sc = cm.get(r.cluster) ?? []; cm.set(r.cluster, sc); sc.push(r);
}
function blocksWithShape(bm) {
  return [...bm].filter(([, cm]) => [...cm].filter(([, s]) => s.length >= N_SCHOOLS).length >= N_CLUSTERS);
}
const candidates = [...tree].filter(([, bm]) => blocksWithShape(bm).length >= N_BLOCKS);
candidates.sort((a, b) => {
  const pa = PREFERRED.indexOf(a[0]), pb = PREFERRED.indexOf(b[0]);
  return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb) || a[0].localeCompare(b[0]);
});
const chosen = candidates.slice(0, N_DISTRICTS);
if (chosen.length < N_DISTRICTS) throw new Error("Not enough districts with the required shape.");

// ── helpers ──
const title = (s) => String(s).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\s+/g, " ").trim();
const pad = (n, len) => String(n).padStart(len, "0");
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const clamp01 = (v) => Math.max(0, Math.min(1, v > 1 ? v / 100 : v));
const round1 = (v) => Math.round(v * 10) / 10;
const round3 = (v) => Math.round(v * 1000) / 1000;
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function jitter(seed, spread) { return ((hash(seed) % 1000) / 1000 - 0.5) * 2 * spread; }
function pick(arr, seed) { return arr[hash(seed) % arr.length]; }

// anonymised name pools (believable, not real individuals)
const FIRST = ["Anjali", "Ramesh", "Priya", "Mahesh", "Nita", "Vikram", "Geeta", "Sunil", "Kiran", "Hetal", "Jignesh", "Falguni", "Bhavna", "Rohit", "Sneha", "Amit", "Komal", "Dilip", "Reena", "Paresh", "Manisha", "Tushar", "Asha", "Nilesh"];
const LAST = ["Patel", "Solanki", "Joshi", "Rabari", "Chauhan", "Desai", "Parmar", "Vasava", "Makwana", "Bhatt", "Modi", "Shah", "Thakor", "Mehta", "Pandya", "Dave", "Trivedi", "Gohil", "Rathod", "Vyas"];
const personName = (seed) => `${pick(FIRST, seed + "a")} ${pick(LAST, seed + "b")}`;

// ── build entities ───────────────────────────────────────────────────
const entities = [];
const appUsers = [];
let teacherSeq = 1;

const state = { id: "st-gj", name: "Gujarat", name_gu: "ગુજરાત", level: "state", parent_id: null, meta: { code: STATE_CODE } };
entities.push(state);

const sectionsForUsers = []; // collect for app_user teachers
let di = 0;
for (const [dName, bm] of chosen) {
  di++;
  const dCode = STATE_CODE + pad(di, 2); // 4-digit
  const dId = `dist-${dCode}`;
  entities.push({ id: dId, name: title(dName), name_gu: title(dName), level: "district", parent_id: state.id, meta: { code: dCode } });

  const blocks = blocksWithShape(bm).slice(0, N_BLOCKS);
  let bi = 0;
  for (const [bName, cm] of blocks) {
    bi++;
    const bCode = dCode + pad(bi, 2); // 6-digit
    const bId = `block-${bCode}`;
    entities.push({ id: bId, name: title(bName), name_gu: title(bName), level: "block", parent_id: dId, meta: { code: bCode } });

    const clusters = [...cm].filter(([, s]) => s.length >= N_SCHOOLS).slice(0, N_CLUSTERS);
    let cci = 0;
    for (const [cName, schools] of clusters) {
      cci++;
      const cCode = bCode + pad(cci, 4); // 10-digit
      const cId = `cluster-${cCode}`;
      entities.push({ id: cId, name: title(cName), name_gu: title(cName), level: "cluster", parent_id: bId, meta: { code: cCode, total_schools: N_SCHOOLS } });

      // spread of strong→weak schools for a lively RAG / leaderboard
      const sorted = schools.slice().sort((a, b) => b.pct - a.pct);
      const pickIdx = [0, Math.floor(sorted.length / 3), Math.floor((2 * sorted.length) / 3), sorted.length - 1];
      const picked = [...new Set(pickIdx)].map((i) => sorted[i]).filter(Boolean).slice(0, N_SCHOOLS);
      while (picked.length < N_SCHOOLS && sorted[picked.length]) picked.push(sorted[picked.length]);

      let si = 0;
      for (const sc of picked) {
        si++;
        const sCode = cCode + String(si); // 11-digit
        const sId = `sch-${sCode}`;
        const anchor = clamp01(sc.pct);
        const enrolment = 130 + (hash(sCode) % 420); // 130–549
        const teachers = 5 + (hash(sCode + "t") % 16); // 5–20
        const pmShri = hash(sCode + "pm") % 6 === 0; // ~1 in 6
        entities.push({
          id: sId, name: title(sc.school), name_gu: title(sc.school), level: "school", parent_id: cId,
          meta: {
            code: sCode, udise_code: sCode, pmShri, enrolment, teachers, anchor,
            gsqac: {
              total_percent: round1(sc.pct * 100), grade_text: sc.grade,
              domains: { D1: round1(sc.d1 * 100), D2: round1(sc.d2 * 100), D3: round1(sc.d3 * 100), D4: round1(sc.d4 * 100), D5: round1(sc.d5 * 100) },
            },
          },
        });

        for (let g = 1; g <= 8; g++) {
          const gId = `${sId}-g${g}`;
          const gAnchor = clamp01(anchor + jitter(gId, 0.08));
          entities.push({ id: gId, name: `Grade ${g}`, name_gu: `ધોરણ ${g}`, level: "grade", parent_id: sId, meta: { grade_no: g, anchor: gAnchor } });
          for (const sec of ["A", "B"]) {
            const secId = `${gId}-${sec}`;
            const tCode = STATE_CODE + pad(teacherSeq++, 6); // 8-digit teacher id
            const secAnchor = clamp01(gAnchor + jitter(secId, 0.07));
            const students = 18 + (hash(secId) % 20); // 18–37 (class capacity check)
            entities.push({
              id: secId, name: `${g}-${sec}`, name_gu: `${g}-${sec}`, level: "section", parent_id: gId,
              meta: { grade_no: g, section_label: sec, teacher_name: personName(secId), teacher_id: tCode, students, anchor: secAnchor },
            });
            sectionsForUsers.push({ secId, sId, sCode, tCode });
          }
        }
      }
    }
  }
}

// recompute non-leaf anchors as the mean of school descendants
const byId = new Map(entities.map((e) => [e.id, e]));
const kids = new Map();
for (const e of entities) if (e.parent_id) { (kids.get(e.parent_id) ?? kids.set(e.parent_id, []).get(e.parent_id)).push(e.id); }
function schoolAnchorsUnder(id) {
  const e = byId.get(id);
  if (e.level === "school") return [e.meta.anchor];
  if (e.level === "grade" || e.level === "section") return [e.meta.anchor];
  return (kids.get(id) || []).flatMap(schoolAnchorsUnder);
}
for (const e of entities) {
  if (["state", "district", "block", "cluster"].includes(e.level)) {
    const a = schoolAnchorsUnder(e.id);
    e.meta.anchor = round3(avg(a));
    if (e.level !== "state") e.meta.total_schools = a.length;
  }
}
state.meta.total_schools = entities.filter((e) => e.level === "school").length;

// ── app_users (one per role, ID-length encodes the role) ─────────────
const firstDistrict = entities.find((e) => e.level === "district");
const firstBlock = entities.find((e) => e.level === "block" && e.parent_id === firstDistrict.id);
const firstCluster = entities.find((e) => e.level === "cluster" && e.parent_id === firstBlock.id);
const firstSchool = entities.find((e) => e.level === "school" && e.parent_id === firstCluster.id);
const aSection = entities.find((e) => e.level === "section" && e.id.startsWith(`${firstSchool.id}-g5`));

const demo = [];
const addUser = (u) => { appUsers.push(u); demo.push(u); };

addUser({ id: "u-teacher", login_id: aSection.meta.teacher_id, name: aSection.meta.teacher_name, name_gu: "", role: "teacher", designation: "Teacher", entity_id: aSection.id, school_id: firstSchool.meta.code, active: true });
addUser({ id: "u-principal", login_id: firstSchool.meta.code, name: personName("prin" + firstSchool.id), name_gu: "", role: "principal", designation: "Principal", entity_id: firstSchool.id, school_id: firstSchool.meta.code, passcode: "1111", active: true });
addUser({ id: "u-crc", login_id: firstCluster.meta.code, name: personName("crc"), name_gu: "", role: "crc", designation: "Cluster Resource Coordinator", entity_id: firstCluster.id, passcode: "1234", active: true });
addUser({ id: "u-brc", login_id: firstBlock.meta.code, name: personName("brc"), name_gu: "", role: "brc", designation: "Block Resource Coordinator (BEO)", entity_id: firstBlock.id, passcode: "2345", active: true });
addUser({ id: "u-deo", login_id: firstDistrict.meta.code, name: personName("deo"), name_gu: "", role: "deo", designation: "District Education Officer", entity_id: firstDistrict.id, passcode: "3456", active: true });
addUser({ id: "u-state", login_id: STATE_CODE, name: "State VSK Cell", name_gu: "રાજ્ય VSK કક્ષ", role: "state", designation: "State Project Director", entity_id: state.id, passcode: "0000", active: true });

// a few extra teachers/principals so leaderboards have names
sectionsForUsers.filter((s) => s.secId.includes("-g7-")).slice(0, 4).forEach((s, i) => {
  appUsers.push({ id: `u-teacher-${i}`, login_id: byId.get(s.secId).meta.teacher_id, name: byId.get(s.secId).meta.teacher_name, name_gu: "", role: "teacher", designation: "Teacher", entity_id: s.secId, school_id: s.sCode, active: true });
});
entities.filter((e) => e.level === "school").slice(1, 4).forEach((s, i) => {
  appUsers.push({ id: `u-principal-${i}`, login_id: s.meta.code, name: personName("p" + s.id), name_gu: "", role: "principal", designation: "Principal", entity_id: s.id, school_id: s.meta.code, passcode: "1111", active: true });
});

// ── write ──────────────────────────────────────────────────────────────
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
if (!existsSync(join(ROOT, "supabase"))) mkdirSync(join(ROOT, "supabase"), { recursive: true });
writeFileSync(join(OUT, "entities.json"), JSON.stringify(entities, null, 2));
writeFileSync(join(OUT, "appUsers.json"), JSON.stringify(appUsers, null, 2));

const counts = entities.reduce((c, e) => ((c[e.level] = (c[e.level] || 0) + 1), c), { total: entities.length });
writeFileSync(join(OUT, "meta.json"), JSON.stringify({
  generatedFrom: "GSQAC/gsqac 2024-25.csv (real names + scores; nested synthetic codes)",
  idFormats: { state: 2, district: 4, block: 6, cluster: 10, school: 11, teacher: 8, student: 18 },
  shape: { districts: N_DISTRICTS, blocksPerDistrict: N_BLOCKS, clustersPerBlock: N_CLUSTERS, schoolsPerCluster: N_SCHOOLS },
  counts,
  districts: chosen.map(([d]) => title(d)),
  pmShriSchools: entities.filter((e) => e.level === "school" && e.meta.pmShri).length,
  demoLogins: demo.map((u) => ({ role: u.role, login_id: u.login_id, name: u.name, designation: u.designation, school_id: u.school_id || null, passcode: u.passcode || null })),
}, null, 2));
writeFileSync(join(ROOT, "supabase", "seed.sql"), buildSeedSql(entities, appUsers));

console.log("Seed written:", counts);
console.log("Districts:", chosen.map(([d]) => title(d)).join(", "), "· PM SHRI schools:", entities.filter((e) => e.level === "school" && e.meta.pmShri).length);
console.log("Demo logins (role · ID · 2nd field):");
for (const u of demo) console.log(`  ${u.role.padEnd(10)} ${String(u.login_id).padEnd(12)} ${u.passcode ? "PIN " + u.passcode : "School " + u.school_id}`);

function sqlStr(v) { return v == null || v === "" ? "NULL" : `'${String(v).replace(/'/g, "''")}'`; }
function buildSeedSql(es, us) {
  const L = ["-- Auto-generated by scripts/generateSeed.mjs", "begin;", ""];
  for (const e of es) L.push(`insert into entities (id, name, name_gu, level, parent_id, meta) values (${sqlStr(e.id)}, ${sqlStr(e.name)}, ${sqlStr(e.name_gu)}, ${sqlStr(e.level)}, ${sqlStr(e.parent_id)}, ${sqlStr(JSON.stringify(e.meta))}::jsonb);`);
  L.push("");
  for (const u of us) L.push(`insert into app_users (id, login_id, name, name_gu, role, designation, entity_id, school_id, passcode, active) values (${sqlStr(u.id)}, ${sqlStr(u.login_id)}, ${sqlStr(u.name)}, ${sqlStr(u.name_gu)}, ${sqlStr(u.role)}, ${sqlStr(u.designation)}, ${sqlStr(u.entity_id)}, ${sqlStr(u.school_id)}, ${sqlStr(u.passcode)}, ${u.active});`);
  L.push("", "commit;");
  return L.join("\n");
}
