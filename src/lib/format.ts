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
      return Math.abs(n) >= 1000 ? compactNum(n, lang) : locNum(formatCount(n), lang);
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
export function formatValueFull(value: number | null, unit: Unit, lang: Lang = "en"): string {
  if (value == null) return "—";
  if (unit === "count") return locNum(formatCount(Math.round(value)), lang);
  return formatValue(value, unit, lang);
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

/** Time-based greeting key (FCR-1.2): 05–11 morning · 12–16 afternoon · else evening. */
export function greetingKey(d: Date = new Date()): "morning" | "afternoon" | "evening" {
  const h = d.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  return "evening";
}

/** Infer the user's role purely from the ID's digit-length (login UX). */
export function roleFromIdLength(id: string): import("@/types").Role | null {
  const len = id.trim().replace(/\D/g, "").length;
  if (id.trim().length !== len) return null; // non-numeric chars present
  switch (len) {
    case 2: return "state";
    case 4: return "deo";
    case 6: return "brc";
    case 8: return "teacher";
    case 10: return "crc";
    case 11: return "principal";
    default: return null;
  }
}

