/**
 * PARAKH Rashtriya Sarvekshan 2024 — district percentile category (§19) + board
 * results (§18). Static until the next survey cycle; self-contained demo dataset
 * (does not touch the provider/engine). District-only visibility in the UI.
 */

export type ParakhBandId = "UDIT" | "UDAY" | "UNNAT" | "UDBHAV";

export interface ParakhBand {
  id: ParakhBandId;
  stage: string;
  meaning: string;
  /** Tailwind-friendly hexes: solid fill, soft bg, readable text. */
  hex: string;
  soft: string;
  text: string;
}

export const PARAKH_BANDS: Record<ParakhBandId, ParakhBand> = {
  UDIT: { id: "UDIT", stage: "Excelling", meaning: "Excellence — the highest state of achievement or success", hex: "#EA580C", soft: "#FFEDD5", text: "#C2410C" },
  UDAY: { id: "UDAY", stage: "Rising", meaning: "Showing strong progress and coming into prominence", hex: "#DB2777", soft: "#FCE7F3", text: "#BE185D" },
  UNNAT: { id: "UNNAT", stage: "Developing", meaning: "Advancing toward higher performance, growth, or improvement", hex: "#2563EB", soft: "#DBEAFE", text: "#1D4ED8" },
  UDBHAV: { id: "UDBHAV", stage: "Emerging", meaning: "In the early stages of growth", hex: "#16A34A", soft: "#DCFCE7", text: "#15803D" },
};

export const PARAKH_ORDER: ParakhBandId[] = ["UDIT", "UDAY", "UNNAT", "UDBHAV"];

/** Category → percentile label (shown together, e.g. "Bottom 25% · UDBHAV"). */
export const PARAKH_PERCENTILE: Record<ParakhBandId, string> = {
  UDIT: "Top 25%",
  UDAY: "Top 50%",
  UNNAT: "Bottom 50%",
  UDBHAV: "Bottom 25%",
};

// Grade 3 — exact district classification from the official PARAKH 2024 screenshots.
const GRADE3: Record<ParakhBandId, string[]> = {
  UDIT: ["Ahmedabad", "Dohad", "Dang", "Surendranagar", "Tapi", "Sabar Kantha", "Bhavnagar", "Gandhinagar"],
  UDAY: ["Botad", "Anand", "Narmada", "Mahisagar", "Bharuch", "Valsad", "Panch Mahals", "Morbi"],
  UNNAT: ["Patan", "Banas Kantha", "Amreli", "Navsari", "Surat", "Junagadh", "Rajkot", "Mahesana", "Devbhumi Dwarka"],
  UDBHAV: ["Jamnagar", "Gir Somnath", "Kheda", "Chhotaudepur", "Porbandar", "Kachchh", "Aravalli", "Vadodara"],
};

// Grades 6 & 9: official per-grade lists weren't supplied → STATIC placeholder
// (clearly marked) derived deterministically so same-category lists stay stable.
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function deriveGrade(salt: string): Record<ParakhBandId, string[]> {
  const all = PARAKH_ORDER.flatMap((b) => GRADE3[b]);
  const out: Record<ParakhBandId, string[]> = { UDIT: [], UDAY: [], UNNAT: [], UDBHAV: [] };
  all.forEach((d) => {
    let bi = PARAKH_ORDER.findIndex((b) => GRADE3[b].includes(d));
    const r = hashStr(d + salt) % 5; // 0 → up · 2 → same · 3,4 → down
    if (r === 0 && bi > 0) bi -= 1;
    else if (r >= 3 && bi < 3) bi += 1;
    out[PARAKH_ORDER[bi]].push(d);
  });
  return out;
}

export const PARAKH_GRADES: Record<string, Record<ParakhBandId, string[]>> = {
  "Grade 3": GRADE3,
  "Grade 6": deriveGrade("g6"),
  "Grade 9": deriveGrade("g9"),
};

export const PARAKH_META = {
  title: "PARAKH Rashtriya Sarvekshan",
  year: "2024",
  context: "State Report: Gujarat · District percentile category · Static until next cycle",
};

/** Which band a district sits in for a given grade (UDBHAV fallback if unlisted). */
export function parakhBandOf(grade: string, district: string): ParakhBandId {
  const g = PARAKH_GRADES[grade] ?? GRADE3;
  return PARAKH_ORDER.find((b) => g[b].includes(district)) ?? "UDBHAV";
}

// §18 — district board results. Static / API-pending. Each opens a KPI detail page
// with a yearly trend (the trend's last point lands on `pass`).
export interface BoardResult { id: string; name: string; pass: number; delta: number; year: string; pending: boolean }
export const BOARD_RESULTS: BoardResult[] = [
  { id: "board10", name: "Grade 10 Result", pass: 82.4, delta: 1.8, year: "2025", pending: true },
  { id: "board12", name: "Grade 12 Result", pass: 78.9, delta: -0.6, year: "2025", pending: true },
];

export function boardResultById(id?: string): BoardResult | undefined {
  return BOARD_RESULTS.find((b) => b.id === id);
}
/** Deterministic 5-point yearly trend ending exactly at the current pass% (§7). */
export function boardTrend(b: BoardResult): { x: string; value: number }[] {
  const r = (hashStr(b.id) % 100) / 100;
  const years = ["2021", "2022", "2023", "2024", "2025"];
  const rise = 4 + r * 5; // total climb across the window
  return years.map((x, i) => {
    const v = b.pass - (rise * (years.length - 1 - i)) / (years.length - 1);
    return { x, value: Math.round(Math.max(0, Math.min(100, v)) * 10) / 10 };
  });
}

/**
 * §16 — district-vs-state PARAKH subject results for the compact Assessment card +
 * the Parakh KPI detail page. Grade 3 (2 subjects), Grade 6 (3), Grade 9 (4). District
 * scores compared with the State average; the grade category drives the District bar
 * colour (UDIT/UDAY/UNNAT/UDBHAV). Static demo (PARAKH is a 3-year cycle — no trend).
 */
export interface ParakhSubjectScore { subject: string; district: number; state: number }
export interface ParakhGradeResult { grade: string; category: ParakhBandId; subjects: ParakhSubjectScore[] }
export const PARAKH_RESULTS: ParakhGradeResult[] = [
  { grade: "Grade 3", category: "UDBHAV", subjects: [
    { subject: "Language", district: 57, state: 64 },
    { subject: "Mathematics", district: 52, state: 60 },
  ] },
  { grade: "Grade 6", category: "UNNAT", subjects: [
    { subject: "Language", district: 51, state: 57 },
    { subject: "Mathematics", district: 40, state: 46 },
    { subject: "The World Around Us", district: 45, state: 49 },
  ] },
  { grade: "Grade 9", category: "UDAY", subjects: [
    { subject: "Language", district: 50, state: 54 },
    { subject: "Mathematics", district: 32, state: 37 },
    { subject: "Science", district: 38, state: 40 },
    { subject: "Social Science", district: 37, state: 40 },
  ] },
];
