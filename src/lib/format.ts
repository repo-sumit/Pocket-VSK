import type { Lang } from "@/i18n";
import type { Unit } from "@/types";

const GU_DIGITS = ["૦", "૧", "૨", "૩", "૪", "૫", "૬", "૭", "૮", "૯"];

/** Localise digits to Gujarati numerals when lang === 'gu'. */
export function locNum(n: number | string, lang: Lang): string {
  const s = String(n);
  if (lang !== "gu") return s;
  return s.replace(/[0-9]/g, (d) => GU_DIGITS[Number(d)]);
}

/** Format a KPI value with its unit, or an explicit em-dash for NA. */
export function formatValue(value: number | null, unit: Unit, lang: Lang = "en"): string {
  if (value == null) return "—";
  const n = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
  switch (unit) {
    case "%":
      return `${locNum(n, lang)}%`;
    case "days":
      return lang === "gu" ? `${locNum(n, lang)} દિવસ` : `${n} day${n === 1 ? "" : "s"}`;
    case "hours":
      return lang === "gu" ? `${locNum(n, lang)} કલાક` : `${n} hrs`;
    case "count":
      return locNum(formatCount(n), lang);
    case "score":
      return `${locNum(n, lang)}`;
    default:
      return locNum(n, lang);
  }
}

function formatCount(n: number): string {
  return n.toLocaleString("en-IN");
}

export function formatDelta(delta: number | null, unit: Unit, lang: Lang = "en"): string {
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

export function scoreOutOf100(value: number, lang: Lang = "en"): string {
  return `${locNum(Math.round(value), lang)}`;
}
