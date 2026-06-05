/**
 * Core domain types for the VSK Gujarat KPI scorecard.
 *
 * These mirror the Supabase tables (entities, app_users, domains,
 * kpi_definitions, kpi_values) so swapping MockProvider → SupabaseProvider
 * is a data-source change, not a refactor. Anything *derived* (Δ WoW/MoM,
 * trend, RAG, domain/overall score, grade) lives in `engine/` and is typed
 * here as the enriched `KpiRecord` / `DomainScore` / `Scorecard` shapes.
 */

// ── Hierarchy & roles ────────────────────────────────────────────────
export const LEVELS = [
  "state",
  "district",
  "block",
  "cluster",
  "school",
  "grade",
  "section",
] as const;
export type Level = (typeof LEVELS)[number];

export const ROLES = ["teacher", "principal", "crc", "brc", "deo", "state"] as const;
export type Role = (typeof ROLES)[number];

/** entities table — the org tree that powers cascading + section-level. */
export interface Entity {
  id: string;
  name: string;
  name_gu?: string;
  level: Level;
  parent_id: string | null;
  meta: EntityMeta;
}

export interface EntityMeta {
  udise_code?: string;
  code?: string;
  grade_no?: number;
  section_label?: string;
  teacher_name?: string;
  total_schools?: number;
  /** 0..1 internal performance anchor — drives deterministic mock values. */
  anchor?: number;
  /** Real GSQAC roll-up for schools sliced from the live CSV. */
  gsqac?: {
    total_percent: number;
    grade_text: string;
    domains: Record<string, number>; // { D1: 0.76, D2: 0.88, ... } % achieved
  };
}

/** app_users table — login + scope resolution. */
export interface AppUser {
  id: string;
  login_id: string;
  name: string;
  name_gu?: string;
  role: Role;
  designation: string;
  entity_id: string;
  school_id?: string;
  /** passcode for officer roles; admin-editable, never user-editable. */
  passcode?: string;
  active: boolean;
}

// ── Framework configuration (swap GSQAC / SQAF / 6A by changing rows) ──
export type Unit = "%" | "count" | "score" | "hours" | "days";
export type Direction = "higher" | "lower";

/** How a KPI is represented at each level (from OGM 3.0 cascading map). */
export type Representation = "avg" | "count" | "class" | "school" | "sum" | "NA";
export type LevelRepresentation = Record<Level, Representation>;

export interface RatingBand {
  grade: string; // e.g. "A+", "A++++", "B"
  min: number; // inclusive lower bound, on a 0..100 scale
  group?: "A" | "B" | "C" | "D";
}

/** domains table. */
export interface DomainDef {
  id: string;
  framework: string;
  name: string;
  name_gu: string;
  weightage: number; // 0..1 (fraction of overall)
  sort_order: number;
  icon?: string; // lucide icon name
  accent?: string; // soft tint key for cards
  /** optional per-domain band override; falls back to framework bands. */
  rating_bands?: RatingBand[];
}

/** kpi_definitions table. */
export interface KpiDef {
  id: string;
  domain_id: string;
  name: string;
  name_gu: string;
  unit: Unit;
  direction: Direction;
  data_source: string;
  target?: string; // informational
  level_representation: LevelRepresentation;
  sort_order: number;
  /** weight of this KPI within its domain (0..1, normalised per domain). */
  weight?: number;
  /** optional per-KPI RAG thresholds override (on 0..100 achievement). */
  rag?: { green: number; amber: number };
}

/** kpi_values table — the raw fact row (one per entity × kpi × period). */
export interface KpiValueRow {
  id: string;
  entity_id: string;
  kpi_id: string;
  period: string; // '2026-W23' or '2026-06'
  value: number | null;
  benchmark: number | null;
  prev_week: number | null;
  prev_month: number | null;
  status?: RagStatus;
}

export interface FrameworkConfig {
  id: string;
  name: string;
  name_gu: string;
  /** cascading order, top → bottom. */
  levels: Level[];
  rating_bands: RatingBand[];
  domains: DomainDef[];
  kpis: KpiDef[];
}

// ── Derived (engine output) ──────────────────────────────────────────
export type RagStatus = "green" | "amber" | "red" | "na";
export type Trend = "up" | "down" | "flat";

/** The per-KPI tile shape (mirrors OGM 3.0 `KPI mapping_simplified`). */
export interface KpiRecord {
  kpi: KpiDef;
  entityId: string;
  level: Level;
  period: string;
  /** null ⇒ render explicit "NA" (never a blank/broken tile). */
  value: number | null;
  benchmark: number | null;
  /** 0..100 achievement vs benchmark (direction-aware). null when NA. */
  achievement: number | null;
  prevWeek: number | null;
  prevMonth: number | null;
  deltaWoW: number | null;
  deltaMoM: number | null;
  trend: Trend;
  status: RagStatus;
  /** sparkline / trend series over the available periods. */
  series: { period: string; value: number }[];
  remark: string;
  remark_gu: string;
}

export interface DomainScore {
  domain: DomainDef;
  /** 0..100 weighted achievement of the domain's KPIs. */
  percent: number | null;
  grade: string | null;
  status: RagStatus;
  weightage: number;
  /** the domain's contribution to the overall score (weightage × percent). */
  contribution: number;
  records: KpiRecord[];
}

export interface Callout {
  kind: "needs_attention" | "most_improved" | "close_gap";
  domainId?: string;
  kpiId?: string;
  title: string;
  title_gu: string;
  detail: string;
  detail_gu: string;
  delta?: number;
}

/** The full scorecard for one entity in one period. */
export interface Scorecard {
  entity: Entity;
  period: string;
  framework: FrameworkConfig;
  /** null ⇒ no scored domain has data at this level → render explicit NA. */
  overallPercent: number | null;
  grade: string | null;
  gradeGroup: "A" | "B" | "C" | "D" | null;
  status: RagStatus;
  domainScores: DomainScore[];
  /** the level directly above (for "you vs parent average" bars). */
  parent?: { entity: Entity; overallPercent: number | null; domainPercents: Record<string, number | null> };
  callouts: Callout[];
}

export interface LeaderboardEntry {
  entity: Entity;
  rank: number;
  prevRank: number | null;
  rankDelta: number | null; // +ve = moved up
  percent: number | null;
  grade: string | null;
  status: RagStatus;
  deltaWoW: number | null;
  isCurrent: boolean;
}

/** One step in the cascade comparison (this entity vs each level up). */
export interface CascadeRow {
  level: Level;
  entity: Entity;
  label: string;
  label_gu: string;
  value: number | null;
  status: RagStatus;
  isCurrent: boolean;
}

export interface Period {
  id: string; // '2026-W23'
  label: string; // 'Week 23'
  kind: "week";
  index: number;
  weekStart: string; // ISO date
}
