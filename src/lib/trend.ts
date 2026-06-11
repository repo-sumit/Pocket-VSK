import type { Frequency, KpiDef, KpiRecord, Unit } from "@/types";
import { noise } from "@/data/prng";
import { CURRENT_PERIOD } from "@/config";
import { locNum, getWorkingDateLabel } from "@/lib/format";
import type { Lang } from "@/i18n";

/**
 * Frequency-aware trend history. Every indicator gets a believable, gently-
 * trending (can-dip) dummy history whose x-axis cadence + delta-tag wording are
 * driven by its Frequency — never a weekly axis for non-daily data:
 *
 *   Daily       → ~30 daily points (date x-labels)            · Δ "this week"  (vs ~7 days back)
 *   Monthly     → 6 months (Jan…Jun)                          · Δ "this month"
 *   Twice a Year→ 6 cycles (SAT1'23 … SAT2'25)                · Δ "this cycle"
 *   Half yearly → 6 half-years (Sept'23 … Mar'26)             · Δ "this time"
 *   Yearly      → 5 years (2021 … 2025)                       · Δ "this year"
 *
 * History is deterministic (seeded by kpi.id + entityId) and pinned to the real
 * current value at the latest point, so the headline number and the graph agree.
 */
export type Cadence = "daily" | "monthly" | "twice" | "half" | "yearly";

export interface Trend {
  cadence: Cadence;
  points: { x: string; value: number }[];
  delta: number | null;
}

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_GU = ["જાન્યુ", "ફેબ્રુ", "માર્ચ", "એપ્રિલ", "મે", "જૂન", "જુલાઈ", "ઑગસ્ટ", "સપ્ટે", "ઑક્ટો", "નવે", "ડિસે"];

export function cadenceOf(freq?: Frequency): Cadence {
  switch (freq) {
    case "Daily":
    case "Weekly":
      return "daily";
    case "Monthly":
      return "monthly";
    case "Twice a Year":
      return "twice";
    case "Half yearly":
      return "half";
    default:
      return "yearly"; // Yearly · Latest · undefined
  }
}

const DELTA_KEY: Record<Cadence, string> = {
  daily: "kpi.deltaWeek",
  monthly: "kpi.deltaMonth",
  twice: "kpi.deltaCycle",
  half: "kpi.deltaTime",
  yearly: "kpi.deltaYear",
};
export function deltaLabelKey(c: Cadence): string {
  return DELTA_KEY[c];
}

// the frequency-correct period word WITHOUT the "Δ" prefix — for the inline
// arrow+value delta treatment (the arrow already signals "change").
const PERIOD_KEY: Record<Cadence, string> = {
  daily: "kpi.pWeek",
  monthly: "kpi.pMonth",
  twice: "kpi.pCycle",
  half: "kpi.pTime",
  yearly: "kpi.pYear",
};
export function periodLabelKey(c: Cadence): string {
  return PERIOD_KEY[c];
}

const MONTH_ABBR = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
function monthIndexOf(note: string): number {
  return MONTH_ABBR.indexOf(note.trim().slice(0, 3).toLowerCase());
}

/**
 * Sheet-driven "last updated" context label (§3/§11). The sheet's `Show Last Updated
 * on UI` column says WHETHER to show it; the cadence (+ `scheduleNote`) says HOW:
 *   Daily   → working date    e.g. "9 Jun"   (Sat/Sun → previous Fri)
 *   Monthly → month + year    e.g. "Jun 2026"
 *   SAT1/SAT2 (scheduleNote)  → schedule month + cycle year  e.g. "Sep 2025" / "Mar 2026"
 *   Twice / Half-yearly       → latest cycle month + year
 *   Yearly / Annual           → year            e.g. "2026"
 *   Latest / unknown          → "" (caller falls back to "Latest available")
 * Returns a bare label (no prefix) so callers can wrap it ("as on …", "Yearly · …").
 */
export function getLastUpdatedLabel(kpi: KpiDef, date: Date, lang: Lang): string {
  // Student Retention (Re-enrolment / Identified Dropout) shows a static demo
  // as-on date — never "11 Jun" / "Jun 2026". Pairs with displayFrequency → "Daily".
  if (kpi.id === "ret_reenroll" || kpi.id === "ret_dropout") return lang === "gu" ? "૧ ઑક્ટો" : "1st Oct";
  const cadence = cadenceOf(kpi.frequency);
  const months = lang === "gu" ? MONTHS_GU : MONTHS_EN;
  if (cadence === "daily") return getWorkingDateLabel(date, lang);
  // an explicit schedule month (SAT1 September, SAT2 March) wins for snapshot tests:
  // pick the most-recent occurrence of that month relative to today.
  if (kpi.scheduleNote) {
    const mi = monthIndexOf(kpi.scheduleNote);
    if (mi >= 0) {
      const y = mi <= date.getMonth() ? date.getFullYear() : date.getFullYear() - 1;
      return `${months[mi]} ${locNum(y, lang)}`;
    }
  }
  if (cadence === "monthly" || cadence === "twice" || cadence === "half") {
    return `${months[date.getMonth()]} ${locNum(date.getFullYear(), lang)}`;
  }
  if (cadence === "yearly") return locNum(date.getFullYear(), lang);
  return "";
}

/** i18n key for a snapshot/cycle context line (for indicators with no time trend). */
export function snapshotContextKey(c: Cadence): string {
  return c === "monthly" ? "kpi.currentMonth"
    : c === "twice" ? "kpi.currentCycle"
      : c === "half" ? "kpi.currentHalf"
        : c === "yearly" ? "kpi.currentYear"
          : "kpi.latestAvailable";
}

const TITLE_KEY: Record<Cadence, string> = {
  daily: "kpi.trendDaily",
  monthly: "kpi.trendMonthly",
  twice: "kpi.trendTwice",
  half: "kpi.trendHalf",
  yearly: "kpi.trendYearly",
};
export function trendTitleKey(c: Cadence): string {
  return TITLE_KEY[c];
}

function pointCount(c: Cadence): number {
  return c === "daily" ? 30 : c === "yearly" ? 5 : 6;
}

/** ~30-day dummy history for the overall score (gently trending to `percent`,
 *  can dip), deterministic by `seedKey`. For the small homepage trend line. */
export function overallTrendData(percent: number | null, seedKey: string): number[] {
  if (percent == null) return [];
  const n = 30, cur = percent;
  const drift = Math.max(cur * 0.05, 1.5) / (n - 1);
  const amp = Math.max(cur * 0.02, 0.8);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const back = n - 1 - i;
    out.push(Math.max(0, Math.min(100, Math.round((cur - back * drift + noise(`${seedKey}|ov${i}`, amp)) * 10) / 10)));
  }
  out[n - 1] = cur;
  return out;
}

export function buildTrend(rec: KpiRecord, lang: Lang): Trend {
  const cadence = cadenceOf(rec.kpi.frequency);
  const n = pointCount(cadence);
  const cur = rec.value ?? 0;
  const unit = rec.kpi.unit;
  const isContext = rec.kpi.context === true;

  // gentle drift toward "now" (older = a touch worse, direction-aware) + dips
  const base = Math.abs(cur) || (unit === "%" ? 80 : 1);
  const totalDrift = Math.max(base * 0.06, unit === "%" ? 1.5 : 0.3);
  const driftStep = totalDrift / Math.max(1, n - 1);
  const amp = Math.max(base * 0.025, unit === "%" ? 0.8 : 0.25);
  const olderWorseSign = rec.kpi.direction === "higher" ? -1 : 1;

  const vals: number[] = [];
  for (let i = 0; i < n; i++) {
    const back = n - 1 - i;
    const drift = olderWorseSign * back * driftStep;
    const wob = noise(`${rec.kpi.id}|${rec.entityId}|t${i}`, amp);
    vals.push(cur + drift + wob);
  }
  vals[n - 1] = cur; // pin the latest point to the real current value

  const labels = labelsFor(cadence, n, lang);
  const points = vals.map((v, i) => ({ x: labels[i], value: round1(clampVal(v, unit, isContext, cur)) }));

  // delta tag compares to one tag-period back: a week (~7 pts) for daily, else 1 point
  const backIdx = cadence === "daily" ? n - 8 : n - 2;
  const delta = backIdx >= 0 ? round1(points[n - 1].value - points[backIdx].value) : null;

  return { cadence, points, delta };
}

function labelsFor(cadence: Cadence, n: number, lang: Lang): string[] {
  const months = lang === "gu" ? MONTHS_GU : MONTHS_EN;
  const anchor = new Date(CURRENT_PERIOD().weekStart);
  const year = anchor.getFullYear(); // 2026
  const yy = (y: number) => locNum(String(y).slice(2), lang); // 2025 → "25"

  if (cadence === "daily") {
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() - (n - 1 - i));
      return `${locNum(d.getDate(), lang)} ${months[d.getMonth()]}`;
    });
  }
  if (cadence === "monthly") {
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(anchor);
      d.setMonth(anchor.getMonth() - (n - 1 - i));
      return months[(d.getMonth() + 12) % 12];
    });
  }
  if (cadence === "twice") {
    // newest = SAT2 of (year-1); step back one semester each time
    const out: string[] = [];
    let y = year - 1, sem = 2;
    for (let k = 0; k < n; k++) {
      out.push(`SAT${locNum(sem, lang)} '${yy(y)}`);
      if (sem === 1) { sem = 2; y--; } else sem = 1;
    }
    return out.reverse();
  }
  if (cadence === "half") {
    // newest = Mar of `year`; alternate Mar/Sept stepping back 6 months
    const mar = lang === "gu" ? MONTHS_GU[2] : "Mar";
    const sept = lang === "gu" ? MONTHS_GU[8] : "Sept";
    const out: string[] = [];
    let y = year, isMar = true;
    for (let k = 0; k < n; k++) {
      out.push(`${isMar ? mar : sept} '${yy(y)}`);
      if (isMar) { isMar = false; y--; } else isMar = true;
    }
    return out.reverse();
  }
  // yearly: newest = year-1, count back; ascending
  return Array.from({ length: n }, (_, i) => locNum(year - 1 - (n - 1 - i), lang));
}

function clampVal(v: number, unit: Unit, isContext: boolean, cur: number): number {
  if (unit === "count") return Math.max(0, Math.round(v));
  // ratio = CRC/URC visits per school — hard product cap of 3 visits/month
  if (unit === "ratio") return clamp(v, 0, 3);
  if (unit === "score") return clamp(v, 0, Math.max(100, Math.abs(cur) * 1.2));
  if (isContext) return clamp(v, -30, 100); // change-deltas may dip negative
  return clamp(v, 0, 100);
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function round1(v: number) { return Math.round(v * 10) / 10; }
