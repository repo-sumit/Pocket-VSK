import type { RagStatus } from "@/types";
import { GSQAC_BANDS, gradeFor } from "./ratingBands";
import { statusFromGrade } from "@/engine";

/**
 * GSQAC (School Quality) demo dataset — fills the score-card drilldown
 * (Area → Sub-domain → Indicators) so the screens never look empty (§13, §14,
 * §17). Deterministic and self-contained: it does NOT touch the provider/engine
 * or the real sq_* KPIs (those still drive the home card + overall). Values are
 * the latest brief's GSQAC Report-Card sample. Overall is out of 1000 marks.
 */

export interface GsqacSubdomain {
  id: string;
  name: string;
  name_gu?: string;
  score: number; // %
  indicators: string[];
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
        indicators: [
          "Checking answer sheets of periodic tests",
          "Students' responses in periodic test answer sheets",
          "Teachers' remarks on periodic test results",
          "Remedial work",
          "Informing parents",
          "Average score percentage in periodic tests",
        ],
      },
      {
        id: "d1_terminal",
        name: "Terminal Tests I and II",
        score: 55,
        indicators: [
          "Conduct of terminal tests as per schedule",
          "Checking of terminal test answer sheets",
          "Result analysis of terminal tests",
          "Average score percentage in terminal tests",
        ],
      },
      {
        id: "d1_rwa",
        name: "Reading, Writing and Arithmetic",
        score: 80,
        indicators: [
          "Reading fluency level of students",
          "Writing proficiency of students",
          "Basic numeracy and arithmetic skills",
          "Remedial support for foundational learning",
        ],
      },
      {
        id: "d1_env",
        name: "Effective Environment for Learning",
        score: 90,
        indicators: [
          "Print-rich classroom environment",
          "Use of teaching-learning material (TLM)",
          "Student engagement in the classroom",
          "Display of students' work",
        ],
      },
      {
        id: "d1_process",
        name: "Teaching-Learning Processes",
        score: 92,
        indicators: [
          "Lesson planning by teachers",
          "Activity-based and joyful teaching",
          "Use of digital learning content",
          "Formative feedback to students",
        ],
      },
      {
        id: "d1_attendance",
        name: "Attendance in School",
        score: 67,
        indicators: [
          "Daily student attendance",
          "Teacher attendance",
          "Maintenance of attendance register",
        ],
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
        indicators: [
          "School development plan",
          "Functioning of School Management Committee (SMC)",
          "Maintenance of school records",
          "Budget planning and utilisation",
        ],
      },
      {
        id: "d2_safety",
        name: "Safety",
        score: 100,
        indicators: [
          "Fire safety measures",
          "Safe drinking water",
          "Boundary wall and secure gate",
          "Emergency preparedness drills",
        ],
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
        indicators: [
          "Daily prayer assembly conducted",
          "Student participation in assembly",
          "News and thought of the day",
        ],
      },
      {
        id: "d3_yoga",
        name: "Yoga, Exercise and Sports",
        score: 88,
        indicators: [
          "Daily yoga and exercise",
          "Sports periods conducted",
          "Participation in sports events",
        ],
      },
      {
        id: "d3_special",
        name: "Participation in Special Activities",
        score: 72,
        indicators: [
          "Cultural programmes",
          "Celebration of national days and festivals",
          "Club and hobby activities",
        ],
      },
    ],
  },
  {
    key: "D4",
    kpiId: "sq_d4",
    name: "usage of Resources",
    name_gu: "સંસાધનોનો ઉપયોગ",
    percent: 80.4,
    got: 64.4,
    max: 80,
    compare: { school: 80.4, district: 73.9, state: 71.4 },
    subdomains: [
      {
        id: "d4_library",
        name: "Library usage",
        score: 80,
        indicators: [
          "Library period scheduled in timetable",
          "Book issue register maintained",
          "Promotion of reading habit",
        ],
      },
      {
        id: "d4_tech",
        name: "Technology usage",
        score: 60,
        indicators: [
          "ICT lab usage",
          "Use of digital learning content",
          "Smart classroom usage",
        ],
      },
      {
        id: "d4_mdm",
        name: "Mid-day Meal",
        score: 95,
        indicators: [
          "Regularity in mid-day meal scheme",
          "Students availing mid-day meal scheme",
          "Students' hygiene habits before sitting to eat",
          "Quality check of mid-day meal by teachers",
          "Cleanliness of mid-day meal area, equipment and utensils",
        ],
      },
      {
        id: "d4_wash",
        name: "Water, Sanitation and Hygiene",
        score: 95,
        indicators: [
          "Functional toilets for boys and girls",
          "Handwashing facility with soap",
          "Clean drinking water",
          "Cleanliness of school premises",
        ],
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
        indicators: [
          "Attendance of students in CET exam",
          "Inclusion of students in state merit list of CET exam",
          "Average score of students in CET exam",
        ],
      },
      {
        id: "d5_cgms",
        name: "Participation in CGMS Exam",
        score: 52,
        indicators: [
          "Attendance of students in CGMS exam",
          "Inclusion of students in state merit list of CGMS exam",
          "Average score of students in CGMS exam",
        ],
      },
    ],
  },
];

export function gsqacAreaByKey(key?: string): GsqacArea | undefined {
  return GSQAC_AREAS.find((a) => a.key === key);
}

/** Official GSQAC grade for a 0–100 score (e.g. 74.4 → "B", 92 → "A4★"). */
export function gsqacGrade(score: number): string {
  return gradeFor(score, GSQAC_BANDS).grade;
}

/** RAG status for a 0–100 GSQAC score (drives badge/dot colour). */
export function gsqacStatus(score: number): RagStatus {
  return statusFromGrade(gradeFor(score, GSQAC_BANDS).group);
}

/** Deterministic per-indicator score, gently varied around its sub-domain score
 *  (no random-on-render). Keeps the indicator list filled and plausible. */
export function gsqacIndicatorScore(subScore: number, i: number): number {
  const offsets = [-6, 4, -2, 7, 0, -4, 3, -8, 5];
  return Math.max(
    20,
    Math.min(100, Math.round(subScore + offsets[i % offsets.length])),
  );
}
