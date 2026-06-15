import type { Lang } from "@/i18n";
import type { Level, Unit } from "@/types";

const GU_DIGITS = ["૦", "૧", "૨", "૩", "૪", "૫", "૬", "૭", "૮", "૯"];

/** Localise digits to Gujarati numerals when lang === 'gu'. */
export function locNum(n: number | string, lang: Lang): string {
  const s = String(n);
  if (lang !== "gu") return s;
  return s.replace(/[0-9]/g, (d) => GU_DIGITS[Number(d)]);
}

const MONTHS_SHORT = {
  en: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  gu: [
    "જાન્યુ",
    "ફેબ્રુ",
    "માર્ચ",
    "એપ્રિલ",
    "મે",
    "જૂન",
    "જુલાઈ",
    "ઑગસ્ટ",
    "સપ્ટે",
    "ઑક્ટો",
    "નવે",
    "ડિસે",
  ],
} as const;

/** Short, localised report date — e.g. "9 Jun 2026" / "૯ જૂન ૨૦૨૬". */
export function formatDate(d: Date, lang: Lang = "en"): string {
  const months = lang === "gu" ? MONTHS_SHORT.gu : MONTHS_SHORT.en;
  return `${locNum(d.getDate(), lang)} ${months[d.getMonth()]} ${locNum(d.getFullYear(), lang)}`;
}

/** The latest working day: Sat → previous Fri, Sun → previous Fri, else today. */
export function getWorkingDate(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun … 6 = Sat
  if (day === 6) d.setDate(d.getDate() - 1);
  else if (day === 0) d.setDate(d.getDate() - 2);
  return d;
}

/** Compact working-day label (day + short month, no year) — e.g. "9 Jun" / "૯ જૂન".
 *  Used as the "as on" date context for Daily indicators. */
export function getWorkingDateLabel(
  date: Date = new Date(),
  lang: Lang = "en",
): string {
  const d = getWorkingDate(date);
  const months = lang === "gu" ? MONTHS_SHORT.gu : MONTHS_SHORT.en;
  return `${locNum(d.getDate(), lang)} ${months[d.getMonth()]}`;
}

/** Format a KPI value with its unit, or an explicit em-dash for NA. */
export function formatValue(
  value: number | null,
  unit: Unit,
  lang: Lang = "en",
): string {
  if (value == null) return "—";
  const n = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
  switch (unit) {
    case "%":
      return `${locNum(n, lang)}%`;
    case "days":
      return lang === "gu"
        ? `${locNum(n, lang)} દિવસ`
        : `${n} day${n === 1 ? "" : "s"}`;
    case "hours":
      return lang === "gu" ? `${locNum(n, lang)} કલાક` : `${n} hrs`;
    case "count": {
      // a count is always a whole number — round defensively so a stray decimal from an
      // upstream source can never render as "3.5 students" (§7).
      const c = Math.round(n);
      if (process.env.NODE_ENV !== "production" && !Number.isInteger(value)) {
        console.warn("[format] count metric received a non-integer value", { value });
      }
      return Math.abs(c) >= 1000 ? compactNum(c, lang) : locNum(formatCount(c), lang);
    }
    case "score":
      return `${locNum(n, lang)}`;
    default:
      return locNum(n, lang);
  }
}

function formatCount(n: number): string {
  return n.toLocaleString("en-IN");
}

/** Compact large numbers (84,000 → 84K, 10,500 → 10.5K). Full value goes in a tooltip. */
export function compactNum(n: number, lang: Lang = "en"): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${locNum(trimZero(n / 1_000_000), lang)}M`;
  if (abs >= 1000) return `${locNum(trimZero(n / 1000), lang)}K`;
  return locNum(Math.round(n), lang);
}
function trimZero(v: number): string {
  return (Math.round(v * 10) / 10).toString().replace(/\.0$/, "");
}

/** Full localized value for tooltips (no K/M abbreviation). */
export function formatValueFull(
  value: number | null,
  unit: Unit,
  lang: Lang = "en",
): string {
  if (value == null) return "—";
  if (unit === "count") return locNum(formatCount(Math.round(value)), lang);
  return formatValue(value, unit, lang);
}

export function formatDelta(
  delta: number | null,
  unit: Unit,
  lang: Lang = "en",
): string {
  if (delta == null) return "—";
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "±";
  const abs = Math.abs(Math.round(delta * 10) / 10);
  const suffix = unit === "%" ? "%" : "";
  return `${sign}${locNum(abs, lang)}${suffix}`;
}

export function pct(value: number | null, lang: Lang = "en"): string {
  if (value == null) return "—";
  return `${locNum(Math.round(value), lang)}%`;
}

const LEVEL_NAME_EN: Record<Level, string> = {
  state: "state",
  district: "district",
  block: "block",
  cluster: "cluster",
  school: "school",
  grade: "grade",
  section: "section",
};
const LEVEL_NAME_GU: Record<Level, string> = {
  state: "રાજ્ય",
  district: "જિલ્લા",
  block: "બ્લોક",
  cluster: "ક્લસ્ટર",
  school: "શાળા",
  grade: "ધોરણ",
  section: "વિભાગ",
};

/**
 * Resolves any "hierarchy" placeholder to the current scope level — labels
 * ("% below hierarchy average" → "% below block average") and formula copy alike.
 * For Gujarati, replaces the generic "સ્તર" (level) with the specific level name.
 * Returns the input unchanged when it contains no level placeholder, so callers
 * can apply it unconditionally.
 */
export function resolveMetricLabel(
  name: string,
  name_gu: string,
  level: Level,
  lang: Lang,
): string {
  // apply BOTH replacements to the selected string — gu copy may fall back to an
  // English source string (e.g. formulas), and that English "hierarchy" must
  // still resolve, never render literally.
  const s = lang === "gu" && name_gu ? name_gu : name;
  return s
    .replace(/hierarchy/g, LEVEL_NAME_EN[level])
    .replace(/સ્તર/g, LEVEL_NAME_GU[level]);
}

/** The scope-specific "% below <level> average" label (§ dynamic below-level avg). */
export function formatBelowLevelAverageLabel(
  level: Level,
  lang: Lang = "en",
): string {
  if (lang === "gu") return `${LEVEL_NAME_GU[level]} સરેરાશથી નીચે %`;
  return `% below ${LEVEL_NAME_EN[level]} average`;
}

const LEVEL_TITLE_EN: Record<Level, string> = {
  state: "State",
  district: "District",
  block: "Block",
  cluster: "Cluster",
  school: "School",
  grade: "Grade",
  section: "Section",
};

/**
 * The value-row descriptor for a "below average" sub-metric — reads "% students
 * below District average" (§15). The bold value renders in its own cell ("28.6%"),
 * so the row reads "28.6% students below District average" without a doubled "%".
 * The level word is capitalised so the row reads cleanly next to the value.
 */
export function formatBelowLevelLabel(level: Level, lang: Lang = "en"): string {
  if (lang === "gu") return `${LEVEL_NAME_GU[level]} સરેરાશથી નીચે વિદ્યાર્થીઓ`;
  return `students below ${LEVEL_TITLE_EN[level]} average`;
}

/**
 * Sentence-style card highlight — the descriptor that follows the big value on a
 * domain card ("225 students absent from past 7+ consecutive days", "80.6% SAT
 * reports downloaded in classrooms", "1.7 No of CRCC/URC Visits per school"). The
 * card renders the value big, then this phrase inline. For COUNT indicators the
 * leading word is lower-cased so it reads as a sentence; other units keep the
 * descriptor as authored (acronyms like SAT/CRCC and "No of …" stay intact).
 */
export function formatKpiCardTitlePhrase(
  name: string,
  name_gu: string,
  unit: Unit,
  lang: Lang,
): string {
  if (lang === "gu") return name_gu;
  if (unit === "count" && /^[A-Z][a-z]/.test(name))
    return name.charAt(0).toLowerCase() + name.slice(1);
  return name;
}

/**
 * Short value-row suffix for a SINGLE-metric KPI card — never the full KPI title
 * (the title already sits in the card header, so repeating it reads as a dupe).
 * A bare count is ambiguous, so the count KPIs get a short unit noun
 * ("4.7K students absent"); percent / score / visit cards return "" and show just
 * the value ("96.3%", "1.8") under their title. Keyed by KPI id; unknown → "".
 */
const SINGLE_METRIC_SUFFIX: Record<string, { en: string; gu: string }> = {
  att_chronic: { en: "students absent", gu: "ગેરહાજર વિદ્યાર્થીઓ" },
  ret_dropout: { en: "students untracked", gu: "વિદ્યાર્થીઓ અનટ્રેક" },
};
export function getSingleMetricValueSuffix(kpiId: string, lang: Lang): string {
  return SINGLE_METRIC_SUFFIX[kpiId]?.[lang] ?? "";
}

/** Time-based greeting key (FCR-1.2): 05–11 morning · 12–16 afternoon · else evening. */
export function greetingKey(
  d: Date = new Date(),
): "morning" | "afternoon" | "evening" {
  const h = d.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  return "evening";
}
