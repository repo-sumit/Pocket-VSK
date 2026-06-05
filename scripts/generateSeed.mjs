// @ts-nocheck
/**
 * Seed generator — slices the REAL GSQAC `gsqac 2024-25.csv` (33,236 schools)
 * into a coherent org tree and writes JSON shaped exactly like the Supabase
 * tables (entities, app_users). Real district/block/cluster/school names +
 * real total_percent / grade / D1–D5 are preserved so the School-Quality
 * domain is live data; grades 1–8 × sections A/B + teachers are synthesised
 * beneath each school. Run: `npm run seed`.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CSV = join(ROOT, "..", "GSQAC", "gsqac 2024-25.csv");
const OUT = join(ROOT, "src", "data", "seed");

// shape target: 3 districts → 2 blocks → 3 clusters → 4 schools
const N_DISTRICTS = 3;
const N_BLOCKS = 2;
const N_CLUSTERS = 3;
const N_SCHOOLS = 4;
const PREFERRED_DISTRICTS = ["KACHCHH", "BANASKANTHA", "AHMEDABAD", "PATAN", "SURENDRANAGAR"];

// ── CSV parse (quote-aware) ──────────────────────────────────────────
function parseLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; }
      else q = !q;
    } else if (c === "," && !q) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

const raw = readFileSync(CSV, "utf8").split(/\r?\n/).filter((l) => l.trim().length);
const header = parseLine(raw[0]);
const col = (name) => header.indexOf(name);
const idx = {
  district: col("district"), block: col("block"), cluster: col("cluster"),
  code: col("School Code"), school: col("school"),
  pct: col("total_percent"), grade: col("grade_text"),
  d1: col("% Achieved - D1"), d2: col("% Achieved - D2"), d3: col("% Achieved - D3"),
  d4: col("% Achieved - D4"), d5: col("% Achieved - D5"),
};

const rows = raw.slice(1).map(parseLine).map((r) => ({
  district: r[idx.district], block: r[idx.block], cluster: r[idx.cluster],
  code: r[idx.code], school: r[idx.school],
  pct: num(r[idx.pct]), grade: (r[idx.grade] || "C").trim(),
  d1: num(r[idx.d1]), d2: num(r[idx.d2]), d3: num(r[idx.d3]), d4: num(r[idx.d4]), d5: num(r[idx.d5]),
})).filter((r) => r.district && r.block && r.cluster && r.code && r.school && r.pct > 0);

function num(v) {
  if (v == null) return 0;
  const n = parseFloat(String(v).replace("%", "").trim());
  return Number.isFinite(n) ? n : 0;
}

// group: district → block → cluster → [schools]
const tree = new Map();
for (const r of rows) {
  if (!tree.has(r.district)) tree.set(r.district, new Map());
  const bl = tree.get(r.district);
  if (!bl.has(r.block)) bl.set(r.block, new Map());
  const cl = bl.get(r.block);
  if (!cl.has(r.cluster)) cl.set(r.cluster, []);
  cl.get(r.cluster).push(r);
}

// pick districts that satisfy the shape; prefer the curated list.
function blocksWithShape(blMap) {
  const ok = [];
  for (const [b, clMap] of blMap) {
    const clusters = [...clMap].filter(([, schools]) => schools.length >= N_SCHOOLS);
    if (clusters.length >= N_CLUSTERS) ok.push([b, clMap]);
  }
  return ok;
}
const candidateDistricts = [...tree].filter(([, blMap]) => blocksWithShape(blMap).length >= N_BLOCKS);
candidateDistricts.sort((a, b) => {
  const pa = PREFERRED_DISTRICTS.indexOf(a[0]);
  const pb = PREFERRED_DISTRICTS.indexOf(b[0]);
  return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb) || a[0].localeCompare(b[0]);
});
const chosenDistricts = candidateDistricts.slice(0, N_DISTRICTS);
if (chosenDistricts.length < N_DISTRICTS) throw new Error("Not enough districts with required shape in CSV.");

// ── build entities ───────────────────────────────────────────────────
const entities = [];
const appUsers = [];
const GU = { Gujarat: "ગુજરાત" };
const TEACHER_NAMES = [
  ["Anjali Patel", "અંજલિ પટેલ"], ["Ramesh Solanki", "રમેશ સોલંકી"], ["Priya Joshi", "પ્રિયા જોષી"],
  ["Mahesh Rabari", "મહેશ રબારી"], ["Nita Chauhan", "નીતા ચૌહાણ"], ["Vikram Desai", "વિક્રમ દેસાઈ"],
  ["Geeta Parmar", "ગીતા પરમાર"], ["Sunil Vasava", "સુનિલ વસાવા"], ["Kiran Makwana", "કિરણ મકવાણા"],
  ["Hetal Bhatt", "હેતલ ભટ્ટ"], ["Jignesh Modi", "જિજ્ઞેશ મોદી"], ["Falguni Shah", "ફાલ્ગુની શાહ"],
];
let tCount = 0;

function title(s) {
  return String(s).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\s+/g, " ").trim();
}
function avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
function jitter(seed, spread) {
  // deterministic pseudo-random in [-spread, spread]
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  const r = ((h >>> 0) % 1000) / 1000; // 0..1
  return (r - 0.5) * 2 * spread;
}

const state = {
  id: "st-gj", name: "Gujarat", name_gu: "ગુજરાત", level: "state", parent_id: null,
  meta: { code: "GJ" },
};
entities.push(state);

const schoolAnchors = [];

for (const [dName, blMap] of chosenDistricts) {
  const dId = `dist-${slug(dName)}`;
  const distEnt = { id: dId, name: title(dName), name_gu: title(dName), level: "district", parent_id: state.id, meta: { code: slug(dName) } };
  entities.push(distEnt);

  const blocks = blocksWithShape(blMap).slice(0, N_BLOCKS);
  for (const [bName, clMap] of blocks) {
    const bId = `block-${slug(dName)}-${slug(bName)}`;
    entities.push({ id: bId, name: title(bName), name_gu: title(bName), level: "block", parent_id: dId, meta: { code: slug(bName) } });

    const clusters = [...clMap].filter(([, s]) => s.length >= N_SCHOOLS).slice(0, N_CLUSTERS);
    for (const [cName, schools] of clusters) {
      const cId = `cluster-${slug(dName)}-${slug(bName)}-${slug(cName)}`;
      entities.push({
        id: cId, name: title(cName), name_gu: title(cName), level: "cluster", parent_id: bId,
        meta: { code: slug(cName), total_schools: schools.length },
      });

      const picked = schools.slice().sort((a, b) => b.pct - a.pct);
      // mix strong + weak schools for a lively RAG/leaderboard
      const chosenSchools = [picked[0], picked[Math.floor(picked.length / 3)], picked[Math.floor((2 * picked.length) / 3)], picked[picked.length - 1]]
        .filter(Boolean).slice(0, N_SCHOOLS);

      for (const sc of chosenSchools) {
        const sId = `sch-${sc.code}`;
        const anchor = clamp01(sc.pct);
        schoolAnchors.push(anchor);
        entities.push({
          id: sId, name: title(sc.school), name_gu: title(sc.school), level: "school", parent_id: cId,
          meta: {
            udise_code: sc.code, anchor,
            gsqac: {
              total_percent: round1(sc.pct * 100),
              grade_text: sc.grade,
              domains: { D1: round1(sc.d1 * 100), D2: round1(sc.d2 * 100), D3: round1(sc.d3 * 100), D4: round1(sc.d4 * 100), D5: round1(sc.d5 * 100) },
            },
          },
        });

        // grades 1–8 × sections A/B
        for (let g = 1; g <= 8; g++) {
          const gId = `${sId}-g${g}`;
          const gAnchor = clamp01(anchor + jitter(gId, 0.08));
          entities.push({ id: gId, name: `Grade ${g}`, name_gu: `ધોરણ ${g}`, level: "grade", parent_id: sId, meta: { grade_no: g, anchor: gAnchor } });
          for (const sec of ["A", "B"]) {
            const secId = `${gId}-${sec}`;
            const tn = TEACHER_NAMES[tCount % TEACHER_NAMES.length];
            tCount++;
            const secAnchor = clamp01(gAnchor + jitter(secId, 0.07));
            entities.push({
              id: secId, name: `${g}-${sec}`, name_gu: `${g}-${sec}`, level: "section", parent_id: gId,
              meta: { grade_no: g, section_label: sec, teacher_name: tn[0], anchor: secAnchor },
            });
          }
        }
      }
    }
  }
}

// recompute non-leaf anchors as the mean of school descendants (cleaner rollups)
const byId = new Map(entities.map((e) => [e.id, e]));
const childrenOf = new Map();
for (const e of entities) {
  if (e.parent_id) {
    if (!childrenOf.has(e.parent_id)) childrenOf.set(e.parent_id, []);
    childrenOf.get(e.parent_id).push(e.id);
  }
}
function schoolAnchorsUnder(id) {
  const e = byId.get(id);
  if (e.level === "school") return [e.meta.anchor];
  const kids = childrenOf.get(id) || [];
  if (e.level === "grade" || e.level === "section") return [e.meta.anchor];
  return kids.flatMap(schoolAnchorsUnder);
}
for (const e of entities) {
  if (["state", "district", "block", "cluster"].includes(e.level)) {
    e.meta.anchor = round3(avg(schoolAnchorsUnder(e.id)));
    if (e.level !== "state") e.meta.total_schools = schoolAnchorsUnder(e.id).length;
  }
}
state.meta.total_schools = entities.filter((e) => e.level === "school").length;

// ── app_users (one per role + a few extras) ──────────────────────────
const firstDistrict = entities.find((e) => e.level === "district");
const firstBlock = entities.find((e) => e.level === "block" && e.parent_id === firstDistrict.id);
const firstCluster = entities.find((e) => e.level === "cluster" && e.parent_id === firstBlock.id);
const firstSchool = entities.find((e) => e.level === "school" && e.parent_id === firstCluster.id);
const aSection = entities.find((e) => e.level === "section" && e.id.startsWith(`${firstSchool.id}-g5`));

const demo = [];
function addUser(u) { appUsers.push(u); demo.push(u); }

addUser({ id: "u-teacher", login_id: "TUTL101", name: aSection.meta.teacher_name, name_gu: "", role: "teacher", designation: "Teacher", entity_id: aSection.id, school_id: firstSchool.meta.udise_code, active: true });
addUser({ id: "u-principal", login_id: "PRIN201", name: "Bharat Pandya", name_gu: "ભરત પંડ્યા", role: "principal", designation: "Principal", entity_id: firstSchool.id, school_id: firstSchool.meta.udise_code, active: true });
addUser({ id: "u-crc", login_id: firstCluster.meta.code.toUpperCase().slice(0, 6) + "CRC", name: "Parmar Geetaben", name_gu: "પરમાર ગીતાબેન", role: "crc", designation: "CRC Coordinator", entity_id: firstCluster.id, passcode: "1234", active: true });
addUser({ id: "u-brc", login_id: firstBlock.meta.code.toUpperCase().slice(0, 6) + "BRC", name: "Suresh Thakor", name_gu: "સુરેશ ઠાકોર", role: "brc", designation: "Block Resource Coordinator (BEO)", entity_id: firstBlock.id, passcode: "2345", active: true });
addUser({ id: "u-deo", login_id: firstDistrict.meta.code.toUpperCase().slice(0, 6) + "DEO", name: "Dr. Rekha Mehta", name_gu: "ડૉ. રેખા મહેતા", role: "deo", designation: "District Education Officer", entity_id: firstDistrict.id, passcode: "3456", active: true });
addUser({ id: "u-state", login_id: "GJSTATE", name: "State VSK Cell", name_gu: "રાજ્ય VSK કક્ષ", role: "state", designation: "State Project Director", entity_id: state.id, passcode: "0000", active: true });

// a couple of extra teachers/principals so the leaderboard demo has names
const moreSections = entities.filter((e) => e.level === "section" && e.id.includes("-g7-")).slice(0, 4);
moreSections.forEach((s, i) => {
  appUsers.push({ id: `u-teacher-${i}`, login_id: `TUTL${110 + i}`, name: s.meta.teacher_name, name_gu: "", role: "teacher", designation: "Teacher", entity_id: s.id, school_id: byId.get(byId.get(s.parent_id).parent_id).meta.udise_code, active: true });
});

// ── write ─────────────────────────────────────────────────────────────
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "entities.json"), JSON.stringify(entities, null, 2));
writeFileSync(join(OUT, "appUsers.json"), JSON.stringify(appUsers, null, 2));

const counts = LEVELS_COUNT(entities);
const meta = {
  generatedFrom: "GSQAC/gsqac 2024-25.csv (real, sliced)",
  generatedAtNote: "static seed — regenerate with `npm run seed`",
  shape: { districts: N_DISTRICTS, blocksPerDistrict: N_BLOCKS, clustersPerBlock: N_CLUSTERS, schoolsPerCluster: N_SCHOOLS },
  counts,
  districts: chosenDistricts.map(([d]) => title(d)),
  demoLogins: demo.map((u) => ({ role: u.role, login_id: u.login_id, name: u.name, designation: u.designation, school_id: u.school_id || null, passcode: u.passcode || null })),
};
writeFileSync(join(OUT, "meta.json"), JSON.stringify(meta, null, 2));

// also emit Supabase seed.sql for entities + app_users (production-ready)
writeFileSync(join(ROOT, "supabase", "seed.sql"), buildSeedSql(entities, appUsers));

console.log("Seed written:", counts, "→", OUT);
console.log("Districts:", meta.districts.join(", "));
console.log("Demo logins:");
for (const u of meta.demoLogins) console.log(`  ${u.role.padEnd(10)} ${String(u.login_id).padEnd(12)} ${u.passcode ? "passcode " + u.passcode : "school " + u.school_id}`);

// ── helpers ──
function LEVELS_COUNT(es) {
  const c = {};
  for (const e of es) c[e.level] = (c[e.level] || 0) + 1;
  c.total = es.length;
  return c;
}
function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function clamp01(v) { return Math.max(0, Math.min(1, v > 1 ? v / 100 : v)); }
function round1(v) { return Math.round(v * 10) / 10; }
function round3(v) { return Math.round(v * 1000) / 1000; }

function sqlStr(v) { return v == null || v === "" ? "NULL" : `'${String(v).replace(/'/g, "''")}'`; }
function buildSeedSql(es, us) {
  const lines = ["-- Auto-generated by scripts/generateSeed.mjs — entities + app_users", "begin;", ""];
  for (const e of es) {
    lines.push(`insert into entities (id, name, name_gu, level, parent_id, meta) values (${sqlStr(e.id)}, ${sqlStr(e.name)}, ${sqlStr(e.name_gu)}, ${sqlStr(e.level)}, ${sqlStr(e.parent_id)}, ${sqlStr(JSON.stringify(e.meta))}::jsonb);`);
  }
  lines.push("");
  for (const u of us) {
    lines.push(`insert into app_users (id, login_id, name, name_gu, role, designation, entity_id, school_id, passcode, active) values (${sqlStr(u.id)}, ${sqlStr(u.login_id)}, ${sqlStr(u.name)}, ${sqlStr(u.name_gu)}, ${sqlStr(u.role)}, ${sqlStr(u.designation)}, ${sqlStr(u.entity_id)}, ${sqlStr(u.school_id)}, ${sqlStr(u.passcode)}, ${u.active});`);
  }
  lines.push("", "commit;");
  return lines.join("\n");
}
