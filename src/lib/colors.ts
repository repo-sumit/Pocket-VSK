import type { RagStatus } from "@/types";

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

/** Grade group → celebratory colour treatment (A best). */
export const GRADE_GROUP = {
  A: { text: "text-rag-green", chip: "bg-rag-greenSoft text-rag-green", hex: "#16A34A", glow: "from-emerald-400 to-teal-500" },
  B: { text: "text-amber-600", chip: "bg-rag-amberSoft text-amber-700", hex: "#F59E0B", glow: "from-amber-400 to-orange-500" },
  C: { text: "text-orange-600", chip: "bg-orange-100 text-orange-700", hex: "#F97316", glow: "from-orange-400 to-rose-500" },
  D: { text: "text-rag-red", chip: "bg-rag-redSoft text-rag-red", hex: "#EF4444", glow: "from-rose-400 to-red-500" },
} as const;

export function gradeGroupOf(grade: string): "A" | "B" | "C" | "D" {
  const c = grade.trim().charAt(0).toUpperCase();
  return c === "A" ? "A" : c === "B" ? "B" : c === "C" ? "C" : "D";
}

/** SwiftChat soft card tints (domain accents). */
export const ACCENT: Record<string, { bg: string; ring: string; icon: string; hex: string }> = {
  blue: { bg: "bg-[#EAF4FE]", ring: "ring-[#A4E2FA]", icon: "text-sky-600", hex: "#38BDF8" },
  mint: { bg: "bg-[#E8FBEF]", ring: "ring-[#CFFBDB]", icon: "text-emerald-600", hex: "#34D399" },
  purple: { bg: "bg-[#F1ECFF]", ring: "ring-[#D7C9FF]", icon: "text-violet-600", hex: "#A78BFA" },
  orange: { bg: "bg-[#FFF1E9]", ring: "ring-[#FFD4BB]", icon: "text-orange-600", hex: "#FB923C" },
  green: { bg: "bg-[#EAFBE3]", ring: "ring-[#CCEFBF]", icon: "text-green-700", hex: "#22C55E" },
  yellow: { bg: "bg-[#FFF8E6]", ring: "ring-[#FDE1AC]", icon: "text-amber-600", hex: "#FBBF24" },
  pink: { bg: "bg-[#FFEDF8]", ring: "ring-[#FCD5F1]", icon: "text-pink-600", hex: "#F472B6" },
  cream: { bg: "bg-[#FFFBEA]", ring: "ring-[#FFF5D0]", icon: "text-yellow-700", hex: "#EAB308" },
};

export function accent(key?: string) {
  return ACCENT[key ?? "blue"] ?? ACCENT.blue;
}
