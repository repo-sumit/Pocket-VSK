/**
 * Deterministic demo roster data for the role-aware "students absent 7+ days" and
 * "untracked students" detail pages (§6, §18, §19). NOT real individuals — generic
 * first-name + initial only, generated from a stable hash so the same scope always
 * renders the same list. Names appear ONLY for teacher/principal scope (§23); officers
 * see counts per child unit, never names.
 */
import type { Level } from "@/types";

function h(s: string): number {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) {
    x ^= s.charCodeAt(i);
    x = Math.imul(x, 16777619);
  }
  return x >>> 0;
}

const FIRST = ["Aarav", "Riya", "Dev", "Meera", "Kabir", "Anaya", "Vivaan", "Naina", "Yash", "Diya", "Ishaan", "Sara"];
const LAST = ["Patel", "Sharma", "Joshi", "Chauhan", "Desai", "Mehta", "Solanki", "Rana"];
const SECTIONS = ["A", "B", "C"];
const LAST_DATES = ["31 May", "1 Jun", "2 Jun", "3 Jun", "4 Jun"];

/**
 * Safe deterministic array pick. `index` may be any integer — including the negative
 * values JS produces from a signed `>>` shift on a hash ≥ 2³¹ — so we normalise to a
 * non-negative slot (`((i % len) + len) % len`) and fall back if the array is empty or
 * the slot is somehow undefined. This is what prevents a bad index from reading `[0]`
 * off `undefined` and crashing the whole app at module-import time.
 */
function pick<T>(arr: readonly T[] | undefined, index: number, fallback: T): T {
  if (!arr || arr.length === 0) return fallback;
  const i = ((Math.trunc(index) % arr.length) + arr.length) % arr.length;
  return arr[i] ?? fallback;
}

export interface AbsentStudent {
  name: string;
  section: string;
  days: number;
  lastPresent: string;
}
export interface UntrackedStudent {
  name: string;
  /** "Grade 1".."Grade 8" — used to scope the list by the current grade/section. */
  grade: string;
  /** section label only: "A" | "B" | "C". */
  section: string;
  lastSeen: string;
}
export interface GradeCount {
  grade: string;
  n: number;
  students: AbsentStudent[];
}
/** A teacher's own-class absentee list — the brief's Grade 5 sample, verbatim. */
export const TEACHER_ABSENTEES: AbsentStudent[] = [
  { name: "Aarav Patel", section: "Section A", days: 8, lastPresent: "3 Jun" },
  { name: "Riya Sharma", section: "Section A", days: 9, lastPresent: "2 Jun" },
  { name: "Dev Joshi", section: "Section B", days: 7, lastPresent: "4 Jun" },
  { name: "Meera Chauhan", section: "Section B", days: 11, lastPresent: "31 May" },
];

function genStudents(grade: string, n: number): AbsentStudent[] {
  return Array.from({ length: Math.max(0, n) }, (_, i) => {
    const hv = h(grade + "abs" + i);
    return {
      name: `${pick(FIRST, hv, "Student")} ${pick(LAST, hv >> 4, "K")}`,
      section: hv % 2 ? "Section A" : "Section B",
      days: 7 + (hv % 7),
      lastPresent: pick(LAST_DATES, hv, "1 Jun"),
    };
  });
}

/** Principal's class-wise absentee breakdown; Grade 5 uses the fixed teacher sample. */
export const ABSENT_BY_GRADE: GradeCount[] = [
  { grade: "Grade 1", n: 3 },
  { grade: "Grade 2", n: 2 },
  { grade: "Grade 3", n: 5 },
  { grade: "Grade 4", n: 1 },
  { grade: "Grade 5", n: 4 },
  { grade: "Grade 6", n: 3 },
].map((c) => ({
  ...c,
  students: c.grade === "Grade 5" ? TEACHER_ABSENTEES : genStudents(c.grade, c.n),
}));

/** Teacher's own-class untracked list (demo, §3) — untracked students only. */
export const TEACHER_UNTRACKED: UntrackedStudent[] = [
  { name: "Rohan B.", grade: "Grade 6", section: "A", lastSeen: "12 Apr" },
  { name: "Sara K.", grade: "Grade 4", section: "B", lastSeen: "28 Mar" },
  { name: "Aditya N.", grade: "Grade 7", section: "A", lastSeen: "02 May" },
  { name: "Naina P.", grade: "Grade 3", section: "A", lastSeen: "19 Apr" },
  { name: "Yash G.", grade: "Grade 8", section: "A", lastSeen: "07 May" },
];

/** Deterministic per-grade untracked roster (demo) — name · section. Untracked only. */
function genUntracked(grade: string, n: number): UntrackedStudent[] {
  return Array.from({ length: Math.max(0, n) }, (_, i) => {
    const hv = h(grade + "unt" + i);
    // surname → single initial. `pick` guarantees a real surname, so `.charAt(0)` is
    // always safe — this is the line that used to crash via `LAST[negativeIndex][0]`.
    const lastInitial = pick(LAST, hv >> 4, "K").charAt(0).toUpperCase();
    return {
      name: `${pick(FIRST, hv, "Student")} ${lastInitial}.`,
      grade,
      section: pick(SECTIONS, hv, "A"),
      lastSeen: pick(LAST_DATES, hv, "1 Jun"),
    };
  });
}

/** Principal's grade-wise untracked breakdown — counts sum to the school total (82, §4). */
export interface UntrackedGrade { grade: string; n: number; students: UntrackedStudent[] }
export const UNTRACKED_BY_GRADE: UntrackedGrade[] = [
  { grade: "Grade 1", n: 12 }, { grade: "Grade 2", n: 8 }, { grade: "Grade 3", n: 15 },
  { grade: "Grade 4", n: 10 }, { grade: "Grade 5", n: 14 }, { grade: "Grade 6", n: 9 },
  { grade: "Grade 7", n: 8 }, { grade: "Grade 8", n: 6 },
].map((g) => ({ ...g, students: genUntracked(g.grade, g.n) }));

/** Role-scoped Untracked summary (§2) — drives BOTH the homepage card and the detail
 *  summary so they always match. Teacher sees their class; principal the whole school. */
export interface UntrackedSummary {
  untracked: number;
  compareLevel: Level;
  compareValue: string;
}
export const UNTRACKED_SUMMARY: Record<"teacher" | "principal", UntrackedSummary> = {
  teacher: { untracked: 5, compareLevel: "school", compareValue: "18" },
  principal: { untracked: 82, compareLevel: "state", compareValue: "1.2K" },
};

// NOTE: the officer N-1 list is NOT generated here. It reads the SAME canonical
// provider series the comparison chart uses (`useKpiChildSeries`) so the detail list
// and the compare bars always agree (§1). The old hash-based `unitCounts` was removed.
