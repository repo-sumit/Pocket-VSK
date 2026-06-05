import type { CascadeRow, Entity, FrameworkConfig, KpiDef, Level, Period } from "@/types";
import type { RawSeries } from "@/data/provider";
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
): CascadeRow[] {
  const chain = [entity, ...ancestors]; // nearest → state
  return chain
    .slice()
    .reverse() // state → … → entity
    .map((e) => {
      const { result } = scoreEntity(fw, e, getSeries, periods);
      return row(e, result.percent, result.status, e.id === entity.id);
    });
}

/** Single-KPI cascade: the KPI's value at this entity + every ancestor. */
export function kpiCascade(
  kpi: KpiDef,
  entity: Entity,
  ancestors: Entity[],
  getSeries: (e: Entity, k: KpiDef) => RawSeries,
  periods: Period[],
): CascadeRow[] {
  const chain = [entity, ...ancestors];
  return chain
    .slice()
    .reverse()
    .map((e) => {
      const rec = buildKpiRecord(kpi, e, getSeries(e, kpi), periods);
      return row(e, rec.value, rec.status, e.id === entity.id);
    });
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
