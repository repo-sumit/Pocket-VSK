import type { KpiDef, RagStatus } from "@/types";
import { RAG_DEFAULT } from "@/config/ratingBands";

/**
 * normalizedScore — maps any KPI value onto a 0..100 "goodness" score so the
 * RAG bands (green ≥85, amber 65–84, red <65 — overridable per KPI) and the
 * domain/overall rollups are comparable across units & directions.
 *
 *  • higher-% / score  → the value itself (matches the report-card bands)
 *  • lower-%           → 100 − value (a low bad-value scores high)
 *  • count / days      → achievement vs benchmark, direction-aware, capped 100
 */
export function normalizedScore(value: number | null, kpi: KpiDef, benchmark: number | null): number | null {
  if (value == null) return null;
  if (kpi.unit === "%" || kpi.unit === "score") {
    return clamp(kpi.direction === "lower" ? 100 - value : value, 0, 100);
  }
  // count / days → how close to (or better than) target
  if (benchmark == null || benchmark === 0) return clamp(value === 0 ? 100 : 60, 0, 100);
  if (kpi.direction === "lower") {
    return clamp(value <= 0 ? 100 : (benchmark / value) * 100, 0, 100);
  }
  return clamp((value / benchmark) * 100, 0, 100);
}

export function statusFromScore(score: number | null, rag?: { green: number; amber: number }): RagStatus {
  if (score == null) return "na";
  const t = rag ?? RAG_DEFAULT;
  if (score >= t.green) return "green";
  if (score >= t.amber) return "amber";
  return "red";
}

/**
 * Overall / domain status follows the GRADE GROUP (A→green, B→amber, C/D→red)
 * so the hero ring + grade badge read coherently (a high grade feels good),
 * while per-KPI status uses the stricter 85/65 RAG above to surface the
 * granular red/amber/green mix and "needs attention" call-outs.
 */
export function statusFromGrade(group?: "A" | "B" | "C" | "D"): RagStatus {
  if (group === "A") return "green";
  if (group === "B") return "amber";
  return "red";
}

export function kpiStatus(value: number | null, kpi: KpiDef, benchmark: number | null): RagStatus {
  return statusFromScore(normalizedScore(value, kpi, benchmark), kpi.rag);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
