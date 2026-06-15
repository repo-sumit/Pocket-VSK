import type { RagStatus } from "@/types";
import { GSQAC_BANDS, gradeFor } from "./ratingBands";
import { statusFromGrade } from "@/engine";

/**
 * GSQAC (School Quality) demo dataset — fills the score-card drilldown
 * (Area → Sub-domain → Indicators) so the screens never look empty (§13, §14,
 * §17). Deterministic and self-contained: it does NOT touch the provider/engine
 * or the real sq_* KPIs (those still drive the home card + overall). Values are
 * the latest brief's GSQAC Report-Card sample. Overall is out of 1000 marks.
 *
 * Indicators carry a stable `id` (e.g. `sq_d1_periodic_0`) so each one can be its
 * own card, drill to `/app/kpi/:id`, and resolve via `gsqacIndicatorById`.
 */

export interface GsqacIndicator {
  id: string;
  name: string;
  score: number; // %
}
export interface GsqacSubdomain {
  id: string;
  name: string;
  name_gu?: string;
  score: number; // %
  indicators: GsqacIndicator[];
}
export interface GsqacArea {
  key: string;
  kpiId: string; // maps to the sq_* KPI in the catalog
  name: string;
  name_gu: string;
  percent: number;
  got: number;
  max: number;
  /** School vs District vs State comparison sample (%) */
  compare: { school: number; district: number; state: number };
  subdomains: GsqacSubdomain[];
}

export const GSQAC_OVERALL = { percent: 68.1, got: 680.7, max: 1000 };

/** Build indicator objects with stable, GSQAC-prefixed ids from a [name, score] list. */
function inds(subId: string, list: [string, number][]): GsqacIndicator[] {
  return list.map(([name, score], i) => ({ id: `sq_${subId}_${i}`, name, score }));
}

export const GSQAC_AREAS: GsqacArea[] = [
  {
    key: "D1",
    kpiId: "sq_d1",
    name: "Teaching and Learning",
    name_gu: "અધ્યાપન અને અધ્યયન",
    percent: 74.4,
    got: 387,
    max: 520,
    compare: { school: 74.4, district: 76.9, state: 75.3 },
    subdomains: [
      {
        id: "d1_periodic",
        name: "Periodic / Formative Tests",
        score: 68,
        indicators: inds("d1_periodic", [
          ["Checking answer sheets of periodic tests", 62],
          ["Students' responses in periodic test answer sheets", 72],
          ["Teachers' remarks on periodic test results", 66],
          ["Remedial work", 75],
          ["Informing parents", 68],
          ["Average score percentage in periodic tests", 64],
        ]),
      },
      {
        id: "d1_terminal",
        name: "Terminal Tests I and II",
        score: 55,
        indicators: inds("d1_terminal", [
          ["Checking answer sheets", 58],
          ["Recording marks in result sheet", 61],
          ["School's marks obtained in Terminal Test 1", 54],
          ["School's marks obtained in Terminal Test 2", 57],
        ]),
      },
      {
        id: "d1_rwa",
        name: "Reading, Writing and Arithmetic",
        score: 80,
        indicators: inds("d1_rwa", [
          ["Reading", 82],
          ["Writing", 78],
          ["Arithmetic", 80],
        ]),
      },
      {
        id: "d1_env",
        name: "Effective Environment for Learning",
        score: 90,
        indicators: inds("d1_env", [
          ["Cordial interaction between teachers and students", 92],
          ["Effective classroom environment", 88],
          ["Motivation by teachers", 90],
          ["Use of appropriate learning material by students", 86],
          ["Creating opportunities for discussion-based learning", 84],
        ]),
      },
      {
        id: "d1_process",
        name: "Teaching-Learning Processes",
        score: 92,
        indicators: inds("d1_process", [
          ["Talking about what is being taught", 91],
          ["Preparation for teaching", 88],
          ["Teaching keeping learning outcomes in mind", 87],
          ["Questions asked by teachers", 84],
          ["Constructive assessment by students", 82],
          ["Equal opportunity in learning", 90],
        ]),
      },
      {
        id: "d1_attendance",
        name: "Attendance in School",
        score: 67,
        indicators: inds("d1_attendance", [
          ["Average attendance of school", 67],
          ["School's average attendance relative to district average", 69],
        ]),
      },
    ],
  },
  {
    key: "D2",
    kpiId: "sq_d2",
    name: "School Administration",
    name_gu: "શાળા વહીવટ",
    percent: 100,
    got: 50,
    max: 50,
    compare: { school: 100, district: 90.5, state: 88.6 },
    subdomains: [
      {
        id: "d2_mgmt",
        name: "School Management",
        score: 100,
        indicators: inds("d2_mgmt", [
          ["Preparation and implementation of school development plan", 100],
          ["School Management Committee", 100],
          ["School timetable", 100],
        ]),
      },
      {
        id: "d2_safety",
        name: "Safety",
        score: 100,
        indicators: inds("d2_safety", [
          ["Safe school premises", 100],
          ["Preparedness for disaster management", 100],
        ]),
      },
    ],
  },
  {
    key: "D3",
    kpiId: "sq_d3",
    name: "Co-scholastic Activities",
    name_gu: "સહ-અભ્યાસિક પ્રવૃત્તિઓ",
    percent: 82.8,
    got: 41.4,
    max: 50,
    compare: { school: 82.8, district: 77.0, state: 74.6 },
    subdomains: [
      {
        id: "d3_prayer",
        name: "Prayer Assembly",
        score: 92,
        indicators: inds("d3_prayer", [
          ["Active participation of students in prayer assembly", 92],
          ["Equal opportunity for boys and girls in conducting prayer assembly", 90],
          ["Use of various instruments by students in prayer assembly", 88],
          ["Inclusion of national anthem, news reading, quiz in assembly", 94],
          ["Variety in overall presentation of prayer assembly", 91],
        ]),
      },
      {
        id: "d3_yoga",
        name: "Yoga, Exercise and Sports",
        score: 88,
        indicators: inds("d3_yoga", [
          ["Participation of students in yoga activities", 88],
          ["Participation in Sports Festival / Khel Mahakumbh", 82],
          ["Regularity of group exercise in school", 86],
          ["Regular opportunity for sports and exercise for each grade", 84],
          ["Proportionate participation of girls in sports activities", 85],
        ]),
      },
      {
        id: "d3_special",
        name: "Participation in Special Activities",
        score: 72,
        indicators: inds("d3_special", [
          ["Student participation in Science-Knowledge exhibitions", 72],
          ["Environment conservation activities conducted in school", 75],
          ["Cultural activities during national festivals", 78],
          ["Educational visits and follow-up activities", 68],
          ["Planning of value-oriented activities in school", 70],
        ]),
      },
    ],
  },
  {
    key: "D4",
    kpiId: "sq_d4",
    name: "Usage of Resources",
    name_gu: "સંસાધનોનો ઉપયોગ",
    percent: 80.4,
    got: 64.4,
    max: 80,
    compare: { school: 80.4, district: 73.9, state: 71.4 },
    subdomains: [
      {
        id: "d4_library",
        name: "Library Usage",
        score: 80,
        indicators: inds("d4_library", [
          ["Use of school library by teachers", 80],
          ["Use of school library by students", 78],
        ]),
      },
      {
        id: "d4_tech",
        name: "Technology Usage",
        score: 60,
        indicators: inds("d4_tech", [
          ["Use of technology by teachers for educational work", 60],
          ["Use of G-SHALA", 58],
          ["Use of technology by Std. 6-8 students", 62],
        ]),
      },
      {
        id: "d4_mdm",
        name: "Mid-day Meal",
        score: 95,
        indicators: inds("d4_mdm", [
          ["Regularity in mid-day meal scheme", 95],
          ["Students availing mid-day meal scheme", 96],
          ["Students' hygiene habits before sitting to eat", 92],
          ["Quality check of mid-day meal by teachers", 94],
          ["Cleanliness of mid-day meal area, equipment and utensils", 93],
        ]),
      },
      {
        id: "d4_wash",
        name: "Water, Sanitation and Hygiene",
        score: 95,
        indicators: inds("d4_wash", [
          ["Easy availability of potable water", 95],
          ["Regular cleaning of toilets with proper material", 92],
          ["Availability of water in toilets", 93],
          ["Physical hygiene of students", 90],
        ]),
      },
    ],
  },
  {
    key: "D5",
    kpiId: "sq_d5",
    name: "State-Level Competitive Exams",
    name_gu: "રાજ્ય સ્તરની સ્પર્ધાત્મક પરીક્ષાઓ",
    percent: 46,
    got: 138,
    max: 300,
    compare: { school: 46.0, district: 42.6, state: 37.4 },
    subdomains: [
      {
        id: "d5_cet",
        name: "Participation in CET Exam",
        score: 40,
        indicators: inds("d5_cet", [
          ["Attendance of students in CET exam", 40],
          ["Inclusion of students in state merit list of CET exam", 28],
          ["Average score of students in CET exam", 52],
        ]),
      },
      {
        id: "d5_cgms",
        name: "Participation in CGMS Exam",
        score: 52,
        indicators: inds("d5_cgms", [
          ["Attendance of students in CGMS exam", 52],
          ["Inclusion of students in state merit list of CGMS exam", 34],
          ["Average score of students in CGMS exam", 55],
        ]),
      },
    ],
  },
];

export function gsqacAreaByKey(key?: string): GsqacArea | undefined {
  return GSQAC_AREAS.find((a) => a.key === key);
}

/** Resolve a sub-domain id → its area + sub-domain (for the GSQAC sub-domain page). */
export function gsqacSubdomainById(subId?: string): { area: GsqacArea; sub: GsqacSubdomain } | undefined {
  if (!subId) return undefined;
  for (const area of GSQAC_AREAS) {
    const sub = area.subdomains.find((s) => s.id === subId);
    if (sub) return { area, sub };
  }
  return undefined;
}

/** Resolve an indicator id → its area + sub-domain + indicator (for KPI detail). */
export function gsqacIndicatorById(id?: string): { area: GsqacArea; sub: GsqacSubdomain; indicator: GsqacIndicator } | undefined {
  if (!id) return undefined;
  for (const area of GSQAC_AREAS) {
    for (const sub of area.subdomains) {
      const indicator = sub.indicators.find((ind) => ind.id === id);
      if (indicator) return { area, sub, indicator };
    }
  }
  return undefined;
}

/** Official GSQAC grade for a 0–100 score (e.g. 74.4 → "B", 92 → "A4★"). */
export function gsqacGrade(score: number): string {
  return gradeFor(score, GSQAC_BANDS).grade;
}

/** RAG status for a 0–100 GSQAC score (drives badge/dot colour). */
export function gsqacStatus(score: number): RagStatus {
  return statusFromGrade(gradeFor(score, GSQAC_BANDS).group);
}

/**
 * Deterministic GSQAC comparison value for a child unit (§4, §7) — a stable score
 * near the card's own headline value, keyed by (childId, seedKey). Self-contained
 * mock so the embedded Compare bars never change on re-render (GSQAC has no provider
 * series). Clamped to a realistic 20–99 % range; unit stays percent throughout.
 */
export function gsqacCompareValue(childId: string, seedKey: string, base: number): number {
  let h = 2166136261;
  const s = `${childId}|${seedKey}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const r = ((h >>> 0) % 1000) / 1000; // 0..1, deterministic
  const v = base + (r - 0.5) * 16; // ±8 around the headline score
  return Math.round(Math.max(20, Math.min(99, v)) * 10) / 10;
}

/**
 * Deterministic N+1 (parent-level) GSQAC score (%) for a card at the current level
 * (§11) — the pill value, e.g. "Cluster · 72.1%". Keyed by (parentLevel, seedKey) so
 * it's stable and distinct from the per-child Compare bars. Same FNV hash as
 * `gsqacCompareValue`. Returns null when there is no parent level (State / leaf).
 */
export function gsqacParentValue(parentLevel: string | null, seedKey: string, base: number): number | null {
  if (!parentLevel) return null;
  let h = 2166136261;
  const s = `${parentLevel}|${seedKey}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const r = ((h >>> 0) % 1000) / 1000; // 0..1, deterministic
  const v = base + (r - 0.5) * 14; // ±7 around the card's own score
  return Math.round(Math.max(20, Math.min(99, v)) * 10) / 10;
}

/**
 * Deterministic yearly trend for a GSQAC indicator detail page — a gentle 4-point
 * series (years N-3 … N) ending exactly at the current score. No random-on-render.
 */
export function gsqacIndicatorTrend(id: string, score: number): { x: string; value: number }[] {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  const r = ((h >>> 0) % 100) / 100; // 0..1
  const years = ["2023", "2024", "2025", "2026"];
  const drop = 4 + r * 6; // total rise over the window, 4–10pp
  return years.map((x, i) => {
    const v = score - drop * (years.length - 1 - i) / (years.length - 1);
    return { x, value: Math.round(Math.max(10, Math.min(100, v)) * 10) / 10 };
  });
}
