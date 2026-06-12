/**
 * PARAKH Rashtriya Sarvekshan 2024 — grade-wise percentile rows with subject drill-down
 * (§16). District & State level only (§24). Static, no delta (§16.3). Primary display is
 * plain percentile language (Top 25% / Bottom 25%); the UDIT/UDAY/UNNAT/UDBHAV category is
 * a muted secondary label (§16.4). Self-contained demo data — does not touch the engine.
 */

export type PctBand = "Top 25%" | "Top 50%" | "Bottom 50%" | "Bottom 25%";

/** §16.4 mapping — percentile band → muted category name (shown secondary, not primary). */
export const PARAKH_BAND_CAT: Record<PctBand, string> = {
  "Top 25%": "UDIT",
  "Top 50%": "UDAY",
  "Bottom 50%": "UNNAT",
  "Bottom 25%": "UDBHAV",
};

export const PARAKH_SURVEY_YEAR = "2024";

export interface ParakhSubject {
  name: string;
  score: number;
  band: PctBand;
  national?: number;
}
export interface ParakhGradeRow {
  grade: string;
  band: PctBand;
  /** state rows carry an explicit headline score; district rows compare via `compare`. */
  score?: number;
  subjects: ParakhSubject[];
  /** District → State avg; State → National. */
  compare: { label: string; score: number };
}

const SUBJECTS: Record<string, string[]> = {
  "Grade 3": ["Language", "Mathematics", "EVS"],
  "Grade 6": ["Language", "Mathematics", "Science", "Social Science"],
  "Grade 9": ["Language", "Mathematics", "Science", "Social Science"],
};

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function bandFromScore(score: number): PctBand {
  return score >= 65 ? "Top 25%" : score >= 60 ? "Top 50%" : score >= 55 ? "Bottom 50%" : "Bottom 25%";
}

// Kachchh — exact sample from the brief (§16.6).
const KACHCHH: Record<string, { band: PctBand; subjects: ParakhSubject[] }> = {
  "Grade 3": { band: "Bottom 25%", subjects: [
    { name: "Language", score: 54.2, band: "Bottom 25%" },
    { name: "Mathematics", score: 51.8, band: "Bottom 25%" },
    { name: "EVS", score: 56.1, band: "Bottom 50%" }] },
  "Grade 6": { band: "Bottom 50%", subjects: [
    { name: "Language", score: 59.4, band: "Bottom 50%" },
    { name: "Mathematics", score: 57.2, band: "Bottom 50%" },
    { name: "Science", score: 60.1, band: "Top 50%" },
    { name: "Social Science", score: 58.9, band: "Bottom 50%" }] },
  "Grade 9": { band: "Top 50%", subjects: [
    { name: "Language", score: 63.5, band: "Top 50%" },
    { name: "Mathematics", score: 61.0, band: "Top 50%" },
    { name: "Science", score: 64.2, band: "Top 50%" },
    { name: "Social Science", score: 65.1, band: "Top 50%" }] },
};

// State — exact sample from the brief (State vs National at grade level, §16.6).
const STATE: Record<string, { band: PctBand; state: number; national: number }> = {
  "Grade 3": { band: "Top 50%", state: 63.8, national: 60.5 },
  "Grade 6": { band: "Top 50%", state: 61.4, national: 59.2 },
  "Grade 9": { band: "Bottom 50%", state: 58.9, national: 60.1 },
};

const GRADES = ["Grade 3", "Grade 6", "Grade 9"];

function districtSubjects(district: string, grade: string): ParakhSubject[] {
  return SUBJECTS[grade].map((name) => {
    const r = (hashStr(district + grade + name) % 100) / 100;
    const s = Math.round((48 + r * 24) * 10) / 10;
    return { name, score: s, band: bandFromScore(s) };
  });
}
function stateSubjects(grade: string): ParakhSubject[] {
  const g = STATE[grade];
  return SUBJECTS[grade].map((name) => {
    const r = (hashStr(name + grade) % 100) / 100;
    const s = Math.round((g.state - 3 + r * 6) * 10) / 10;
    const nat = Math.round((g.national - 2 + r * 5) * 10) / 10;
    return { name, score: s, national: nat, band: bandFromScore(s) };
  });
}

/** District grade rows — band + subjects + State-avg comparison. */
export function parakhDistrictRows(district: string): ParakhGradeRow[] {
  return GRADES.map((g) => {
    const d = district === "Kachchh"
      ? KACHCHH[g]
      : (() => {
          const subs = districtSubjects(district, g);
          const avg = subs.reduce((a, b) => a + b.score, 0) / subs.length;
          return { band: bandFromScore(avg), subjects: subs };
        })();
    return { grade: g, band: d.band, subjects: d.subjects, compare: { label: "State", score: STATE[g].state } };
  });
}

/** State grade rows — band + state score + subjects, compared with National. */
export function parakhStateRows(): ParakhGradeRow[] {
  return GRADES.map((g) => {
    const s = STATE[g];
    return { grade: g, band: s.band, score: s.state, subjects: stateSubjects(g), compare: { label: "National", score: s.national } };
  });
}
