/**
 * Deterministic demo roster data for the role-aware "students absent 7+ days" and
 * "untracked students" detail pages (§6, §18, §19). NOT real individuals — generic
 * first-name + initial only, generated from a stable hash so the same scope always
 * renders the same list. Names appear ONLY for teacher/principal scope (§23); officers
 * see counts per child unit, never names.
 */
import type { Entity } from "@/types";

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
const LAST_DATES = ["31 May", "1 Jun", "2 Jun", "3 Jun", "4 Jun"];

export interface AbsentStudent {
  name: string;
  section: string;
  days: number;
  lastPresent: string;
}
export interface UntrackedStudent {
  name: string;
  section: string;
  status: "untracked" | "reenrolled";
  lastSeen: string;
}
export interface GradeCount {
  grade: string;
  n: number;
  students: AbsentStudent[];
}
export interface UnitCount {
  name: string;
  n: number;
}

/** A teacher's own-class absentee list — the brief's Grade 5 sample, verbatim. */
export const TEACHER_ABSENTEES: AbsentStudent[] = [
  { name: "Aarav Patel", section: "Section A", days: 8, lastPresent: "3 Jun" },
  { name: "Riya Sharma", section: "Section A", days: 9, lastPresent: "2 Jun" },
  { name: "Dev Joshi", section: "Section B", days: 7, lastPresent: "4 Jun" },
  { name: "Meera Chauhan", section: "Section B", days: 11, lastPresent: "31 May" },
];

function genStudents(grade: string, n: number): AbsentStudent[] {
  return Array.from({ length: n }, (_, i) => {
    const hv = h(grade + "abs" + i);
    return {
      name: `${FIRST[hv % FIRST.length]} ${LAST[(hv >> 4) % LAST.length]}`,
      section: hv % 2 ? "Section A" : "Section B",
      days: 7 + (hv % 7),
      lastPresent: LAST_DATES[hv % LAST_DATES.length],
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

/** Teacher's own-class untracked / re-enrolled list (demo). */
export const TEACHER_UNTRACKED: UntrackedStudent[] = [
  { name: "Rohan B.", section: "Grade 6 · A", status: "untracked", lastSeen: "12 Apr" },
  { name: "Sara K.", section: "Grade 4 · B", status: "untracked", lastSeen: "28 Mar" },
  { name: "Aditya N.", section: "Grade 7 · A", status: "reenrolled", lastSeen: "02 May" },
  { name: "Naina P.", section: "Grade 3 · A", status: "untracked", lastSeen: "19 Apr" },
  { name: "Yash G.", section: "Grade 8 · A", status: "reenrolled", lastSeen: "07 May" },
];

/** Principal's grade-wise untracked counts (demo). */
export const UNTRACKED_BY_GRADE: { grade: string; n: number }[] = [
  { grade: "Grade 1", n: 4 }, { grade: "Grade 2", n: 2 }, { grade: "Grade 3", n: 6 },
  { grade: "Grade 4", n: 3 }, { grade: "Grade 5", n: 5 }, { grade: "Grade 6", n: 8 },
  { grade: "Grade 7", n: 7 }, { grade: "Grade 8", n: 5 },
];

/** Officer N-1 list: a deterministic count per child unit, highest first (no names). */
export function unitCounts(children: Entity[], seedKey: string): UnitCount[] {
  return children
    .map((c) => ({ name: c.name, n: 4 + (h(c.id + seedKey) % 26) }))
    .sort((a, b) => b.n - a.n);
}
