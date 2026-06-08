/**
 * Attach School Quality (GSQAC) to the seed entities.
 *  • Schools: REAL data from GSQAC/gsqac 2024-25.csv joined by 11-digit UDISE
 *    (total_percent, grade_text, D1-D5 % achieved); schools with no GSQAC row get
 *    a value synthesized from their anchor + the real distribution (marked synth).
 *  • Cluster/Block/District/State: enrolment-weighted roll-up of descendant schools.
 *  • "improvement vs last cycle" is synthesized (the file is single-round) and flagged.
 * Idempotent post-processor for src/data/seed/entities.json. Run after `npm run seed`.
 */
import { readFileSync, writeFileSync } from "node:fs";

const ENT_PATH = "src/data/seed/entities.json";
const GSQAC_PATH = "../GSQAC/gsqac 2024-25.csv";

// ── tiny CSV parser (handles quoted fields with embedded commas) ──
function parseCsvLine(line) {
  const out = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

// deterministic hash (matches the spirit of the seed generator's noise)
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }
const round3 = (v) => Math.round(v * 1000) / 1000;
const gradeOf = (p) => (p >= 0.8 ? "A" : p >= 0.65 ? "B" : p >= 0.5 ? "C" : "D");

// ── load real GSQAC, keyed by UDISE ──
const lines = readFileSync(GSQAC_PATH, "utf8").split(/\r?\n/).filter(Boolean);
const header = parseCsvLine(lines[0]);
const col = (name) => header.indexOf(name);
const cCode = col("School Code"), cPct = col("total_percent"), cGrade = col("grade_text");
const cD = [col("% Achieved - D1"), col("% Achieved - D2"), col("% Achieved - D3"), col("% Achieved - D4"), col("% Achieved - D5")];
const real = new Map();
let realRows = 0;
for (let i = 1; i < lines.length; i++) {
  const f = parseCsvLine(lines[i]);
  const code = (f[cCode] || "").trim();
  if (!/^\d{6,}$/.test(code)) continue;
  const pct = parseFloat(f[cPct]);
  if (!isFinite(pct)) continue;
  const domains = {};
  cD.forEach((ci, k) => { const v = parseFloat(f[ci]); domains["D" + (k + 1)] = isFinite(v) ? round3(v) : 0; });
  real.set(code, { total_percent: round3(pct), grade_text: (f[cGrade] || gradeOf(pct)).replace(/"/g, "").trim() || gradeOf(pct), domains });
  realRows++;
}

// ── distribution stats (for synth fallback) ──
const allPct = [...real.values()].map((r) => r.total_percent);
const meanPct = allPct.reduce((a, b) => a + b, 0) / (allPct.length || 1); // ~0.70

// ── attach to entities ──
const ents = JSON.parse(readFileSync(ENT_PATH, "utf8"));
const byId = new Map(ents.map((e) => [e.id, e]));
const childrenOf = new Map();
for (const e of ents) if (e.parent_id) (childrenOf.get(e.parent_id) ?? childrenOf.set(e.parent_id, []).get(e.parent_id)).push(e);

let matched = 0, synth = 0;
for (const e of ents) {
  if (e.level !== "school") continue;
  const code = String(e.meta.code ?? e.meta.udise_code ?? "");
  const r = real.get(code);
  const improvement = Math.round((hash(e.id + "imp") * 9 - 3) * 10) / 10; // synth pp delta in [-3, +6]
  if (r) {
    matched++;
    e.meta.gsqac = { ...r, improvement, synth: false };
  } else {
    synth++;
    // synth anchored to the school's performance anchor + the real mean
    const a = e.meta.anchor ?? 0.6;
    const tp = round3(Math.max(0.42, Math.min(0.95, meanPct + (a - 0.6) * 0.45 + (hash(e.id + "g") - 0.5) * 0.08)));
    const domains = {};
    for (let k = 1; k <= 5; k++) domains["D" + k] = round3(Math.max(0.2, Math.min(1, tp + (hash(e.id + "D" + k) - 0.5) * 0.22)));
    e.meta.gsqac = { total_percent: tp, grade_text: gradeOf(tp), domains, improvement, synth: true };
  }
}

// ── roll up to cluster → block → district → state (enrolment-weighted) ──
function schoolDescendants(id) {
  const out = [];
  const walk = (pid) => { for (const c of childrenOf.get(pid) ?? []) { if (c.level === "school") out.push(c); else walk(c.id); } };
  walk(id);
  return out;
}
for (const e of ents) {
  if (!["state", "district", "block", "cluster"].includes(e.level)) continue;
  const schools = schoolDescendants(e.id).filter((s) => s.meta.gsqac);
  if (!schools.length) continue;
  let wsum = 0, tp = 0, imp = 0;
  const dom = { D1: 0, D2: 0, D3: 0, D4: 0, D5: 0 };
  for (const s of schools) {
    const w = s.meta.enrolment ?? 200;
    wsum += w; tp += s.meta.gsqac.total_percent * w; imp += (s.meta.gsqac.improvement ?? 0) * w;
    for (let k = 1; k <= 5; k++) dom["D" + k] += (s.meta.gsqac.domains["D" + k] ?? 0) * w;
  }
  const total = round3(tp / wsum);
  for (let k = 1; k <= 5; k++) dom["D" + k] = round3(dom["D" + k] / wsum);
  e.meta.gsqac = { total_percent: total, grade_text: gradeOf(total), domains: dom, improvement: Math.round((imp / wsum) * 10) / 10, synth: false };
}

writeFileSync(ENT_PATH, JSON.stringify(ents));
console.log(`GSQAC attached: ${realRows} real rows | schools matched=${matched} synth=${synth} | mean real %=${(meanPct * 100).toFixed(1)}`);
