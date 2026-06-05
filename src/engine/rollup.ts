import type { CascadeRow, Entity, FrameworkConfig, KpiDef, Level, Period, Role } from "@/types";
import type { RawSeries } from "@/data/provider";
import { kpiAppliesAtLevel, schoolsImplied } from "@/config/applicability";
import { buildKpiRecord, scoreEntity } from "./score";

/** Default cascade order shown in comparison views (top → drilled). */
export const CASCADE_ORDER: Level[] = ["state", "district", "block", "cluster", "school", "grade", "section"];

export const LEVEL_LABELS: Record<Level, { en: string; gu: string }> = {
  state: { en: "State", gu: "રાજ્ય" },
  district: { en: "District", gu: "જિલ્લો" },
  block: { en: "Block", gu: "બ્લોક" },
  cluster: { en: "Cluster", gu: "ક્લસ્ટર" },
  school: { en: "School", gu: "શાળા" },
  grade: { en: "Grade", gu: "ધોરણ" },
  section: { en: "Section", gu: "વિભાગ" },
};

/** Overall-% cascade: this entity + every ancestor up to state. */
export function overallCascade(
  fw: FrameworkConfig,
  entity: Entity,
  ancestors: Entity[],
  getSeries: (e: Entity, k: KpiDef) => RawSeries,
  periods: Period[],
  role?: Role,
): CascadeRow[] {
  const chain = [entity, ...ancestors];
  return chain
    .slice()
    .reverse()
    .map((e) => {
      const { result } = scoreEntity(fw, e, getSeries, periods, role);
      return row(e, result.percent, result.status, e.id === entity.id);
    })
    .filter((r) => r.value != null); // never show empty/NA cascade bars
}

/** Whether a KPI's cross-level comparison must be normalised to avg-per-school. */
export function isCountCompare(kpi: KpiDef): boolean {
  return kpi.unit === "count";
}

/** Single-KPI cascade across levels — the viewer's own level and the levels
 *  BELOW it (§7: a role sees its own level + below, never above). `chain` is the
 *  representative entity per level, ordered top → section. The current entity
 *  shows its own value; lower levels show that level's average for context.
 *  Non-applicable levels are omitted (no NA bars); count KPIs are normalised to
 *  "avg per school" so levels are comparable (totals would just grow with scope). */
export function kpiCascade(
  kpi: KpiDef,
  chain: Entity[],
  current: Entity,
  getSeries: (e: Entity, k: KpiDef) => RawSeries,
  periods: Period[],
): CascadeRow[] {
  const normalise = isCountCompare(kpi);
  return chain
    .filter((e) => kpiAppliesAtLevel(kpi.id, e.level) && !(normalise && (e.level === "grade" || e.level === "section")))
    .map((e) => {
      const rec = buildKpiRecord(kpi, e, getSeries(e, kpi), periods);
      const isCurrent = e.id === current.id;
      // context levels show their published level-average; the viewer shows its own value
      let value = isCurrent ? rec.value : rec.benchmark ?? rec.value;
      if (normalise && value != null) value = Math.round((value / schoolsImplied(kpi.id, e.level)) * 10) / 10;
      return row(e, value, rec.status, isCurrent);
    })
    .filter((r) => r.value != null);
}

function row(e: Entity, value: number | null, status: CascadeRow["status"], isCurrent: boolean): CascadeRow {
  return {
    level: e.level,
    entity: e,
    label: LEVEL_LABELS[e.level].en,
    label_gu: LEVEL_LABELS[e.level].gu,
    value,
    status,
    isCurrent,
  };
}
