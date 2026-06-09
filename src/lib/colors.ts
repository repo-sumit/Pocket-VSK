import type { Direction, RagStatus } from "@/types";

/** RAG → Tailwind class bundles + chart hexes. Single source of truth. */
// `text` uses the AA-dark variant (legible on white + soft bg); `bg`/`dot`/`hex`
// keep the vivid fill colour for bars, dots and charts.
export const RAG = {
  green: { text: "text-rag-greenText", bg: "bg-rag-green", soft: "bg-rag-greenSoft", ring: "ring-rag-green/30", border: "border-rag-green/40", hex: "#16A34A", softHex: "#DCFCE7", dot: "bg-rag-green", label: { en: "On track", gu: "સારી સ્થિતિ" } },
  amber: { text: "text-rag-amberText", bg: "bg-rag-amber", soft: "bg-rag-amberSoft", ring: "ring-rag-amber/30", border: "border-rag-amber/40", hex: "#F59E0B", softHex: "#FEF3C7", dot: "bg-rag-amber", label: { en: "Needs attention", gu: "ધ્યાન જરૂરી" } },
  red: { text: "text-rag-redText", bg: "bg-rag-red", soft: "bg-rag-redSoft", ring: "ring-rag-red/30", border: "border-rag-red/40", hex: "#EF4444", softHex: "#FEE2E2", dot: "bg-rag-red", label: { en: "At risk", gu: "જોખમમાં" } },
  na: { text: "text-rag-naText", bg: "bg-rag-na", soft: "bg-rag-naSoft", ring: "ring-rag-na/20", border: "border-rag-na/30", hex: "#9CA3AF", softHex: "#F1F3F6", dot: "bg-rag-na", label: { en: "NA", gu: "લાગુ નથી" } },
} as const satisfies Record<RagStatus, unknown>;

export function rag(status: RagStatus) {
  return RAG[status];
}

/**
 * Value/delta colour discipline (single source of truth):
 *  • Colour signals GOOD vs BAD, never a minus sign or "just being a number".
 *  • A good/healthy figure is GREEN or NEUTRAL — never red.
 *
 * `valueToneClass` — the headline number's colour by RAG status: good → green,
 * "watch" (amber) → neutral (the status dot / grade badge carry that signal, so
 * the number isn't an amber outlier), at-risk → red, NA → muted. So every domain
 * card's value reads with the same treatment.
 */
export function valueToneClass(status: RagStatus): string {
  switch (status) {
    case "green": return "text-rag-greenText";
    case "red": return "text-rag-redText";
    case "na": return "text-rag-naText";
    default: return "text-neutral-900"; // amber / watch → neutral headline
  }
}

/** is a delta "good" for a higher/lower-is-better indicator (direction-aware)? */
export function deltaIsGood(delta: number, direction: Direction): boolean {
  return direction === "higher" ? delta > 0 : delta < 0;
}

/** delta text-colour, direction-aware: good → green, flat → neutral, bad → red. */
export function deltaToneClass(delta: number | null | undefined, direction: Direction): string {
  if (delta == null || delta === 0) return "text-neutral-400";
  return deltaIsGood(delta, direction) ? "text-rag-greenText" : "text-rag-redText";
}

/** GSQAC grade group → OFFICIAL grade colours (per GSQAC model documentation:
 *  Green = A/A+, Yellow = B, Red = C, Black = D). These are compliance colours,
 *  used verbatim wherever an actual GRADE is shown. `hex` is the exact official
 *  fill (rings/badges/charts); `text` is a darkened-for-AA variant where the
 *  official fill is too light to read as body text (the yellow B). Operational
 *  status (On Track / Watch / Needs Attention) stays in `RAG` — kept separate. */
export const GRADE_GROUP = {
  A: { text: "text-[#1B7F4B]", chip: "bg-[#1B7F4B]/10 text-[#1B7F4B]", hex: "#1B7F4B", glow: "from-emerald-500 to-green-700" },
  B: { text: "text-[#B07E00]", chip: "bg-[#E0A400]/[0.14] text-[#B07E00]", hex: "#E0A400", glow: "from-amber-400 to-yellow-600" },
  C: { text: "text-[#D33A2C]", chip: "bg-[#D33A2C]/[0.1] text-[#D33A2C]", hex: "#D33A2C", glow: "from-red-400 to-rose-600" },
  D: { text: "text-[#2B2B2B]", chip: "bg-[#2B2B2B]/[0.08] text-[#2B2B2B]", hex: "#2B2B2B", glow: "from-neutral-600 to-neutral-900" },
} as const;

export function gradeGroupOf(grade: string): "A" | "B" | "C" | "D" {
  const c = grade.trim().charAt(0).toUpperCase();
  return c === "A" ? "A" : c === "B" ? "B" : c === "C" ? "C" : "D";
}

/** Soft domain-accent tints — bg/ring reference the `tint` theme tokens
 *  (no raw hex in classes); `hex` is the chart-fill colour (a JS value). */
export const ACCENT: Record<string, { bg: string; ring: string; icon: string; hex: string }> = {
  blue: { bg: "bg-tint-blueBg", ring: "ring-tint-blueRing", icon: "text-sky-600", hex: "#38BDF8" },
  mint: { bg: "bg-tint-mintBg", ring: "ring-tint-mintRing", icon: "text-emerald-600", hex: "#34D399" },
  purple: { bg: "bg-tint-purpleBg", ring: "ring-tint-purpleRing", icon: "text-violet-600", hex: "#A78BFA" },
  orange: { bg: "bg-tint-orangeBg", ring: "ring-tint-orangeRing", icon: "text-orange-600", hex: "#FB923C" },
  green: { bg: "bg-tint-greenBg", ring: "ring-tint-greenRing", icon: "text-green-700", hex: "#22C55E" },
  yellow: { bg: "bg-tint-yellowBg", ring: "ring-tint-yellowRing", icon: "text-amber-600", hex: "#FBBF24" },
  pink: { bg: "bg-tint-pinkBg", ring: "ring-tint-pinkRing", icon: "text-pink-600", hex: "#F472B6" },
  cream: { bg: "bg-tint-creamBg", ring: "ring-tint-creamRing", icon: "text-yellow-700", hex: "#EAB308" },
  lightblue: { bg: "bg-tint-lightblueBg", ring: "ring-tint-lightblueRing", icon: "text-sky-500", hex: "#38BDF8" },
  grey: { bg: "bg-tint-greyBg", ring: "ring-tint-greyRing", icon: "text-slate-500", hex: "#94A3B8" },
};

export function accent(key?: string) {
  return ACCENT[key ?? "blue"] ?? ACCENT.blue;
}
