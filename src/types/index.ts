/**
 * Core domain types for the Pocket VSK (Vidya Samiksha Kendra, Gujarat).
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

export const ROLES = [
  "teacher",
  "principal",
  "CRCC",
  "brc",
  "deo",
  "state",
] as const;
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
  teacher_id?: string;
  /** students in a section/class (class-capacity compliance). */
  students?: number;
  total_schools?: number;
  /** PM SHRI scheme school (for the global institutional filter). */
  pmShri?: boolean;
  /** compliance telemetry surfaced in the Principal view. */
  enrolment?: number;
  teachers?: number;
  /** 0..1 internal performance anchor — drives deterministic mock values. */
  anchor?: number;
  /** GSQAC (School Quality output) — REAL per-school data from
   *  `GSQAC/gsqac 2024-25.csv` where the UDISE matches, else synthesized from
   *  the real distribution. Rolled up (enrolment-weighted) to higher levels. */
  gsqac?: {
    total_percent: number; // 0..1 overall GSQAC score
    grade_text: string; // A / B / C / D
    domains: Record<string, number>; // { D1: 0.76, D2: 0.88, ... } % achieved
    improvement?: number; // synth pp change vs last cycle (TODO: real prior-cycle data)
    synth?: boolean; // true when this school had no real GSQAC row
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
export type Unit =
  | "%"
  | "count"
  | "score"
  | "hours"
  | "days"
  | "ratio"
  | "grade";
export type Direction = "higher" | "lower";

/** OGM 3.0 reporting cadence → drives the display strategy. */
export type Frequency =
  | "Daily"
  | "Weekly"
  | "Monthly"
  | "Twice a Year"
  | "Yearly"
  | "Half yearly"
  | "Latest";
/** how an indicator is visualised (frequency-aware; never a fake daily trend for annual data). */
export type DisplayStrategy =
  | "trend_30d"
  | "delta_cycle"
  | "snapshot_latest"
  | "compliance"
  | "count_with_rate";

/** How a KPI is represented at each level (from OGM 3.0 cascading map). */
export type Representation =
  | "avg"
  | "count"
  | "class"
  | "school"
  | "sum"
  | "NA";
export type LevelRepresentation = Record<Level, Representation>;

export interface RatingBand {
  grade: string; // e.g. "A+", "A++++", "B"
  min: number; // inclusive lower bound, on a 0..100 scale
  group?: "A" | "B" | "C" | "D";
}

/** middle tier of Domain > Sub-Domain > Indicator (configurable seam). */
export interface SubDomainDef {
  id: string;
  name: string;
  name_gu: string;
}

/**
 * One logical metric inside a MULTI-METRIC indicator (e.g. SAT 1 carries Avg score,
 * Below-hierarchy-avg and Participation in its Formula/Logic column). Config-driven:
 * a sub-metric is rendered as a compact row/tile inside the parent indicator's card,
 * never as a separate top-level indicator. `id` is suffixed onto the parent KPI id
 * (`asm_sat1__participation`) so the provider can resolve a deterministic series for it.
 */
export interface KpiMetricDef {
  id: string;
  label: string;
  label_gu: string;
  unit: Unit;
  direction: Direction;
  /** plain-language formula line (shown in the parent's "How it's calculated"). */
  formula?: string;
  formula_gu?: string;
  /** reuse another (sub-)indicator's series verbatim for this metric's data, while
   *  displaying this metric's own label. The synthesized record adopts this id, so
   *  its value/benchmark/trend are byte-identical to that source indicator (e.g. the
   *  CET/CGMS lines on the State-Exams domain reuse `asm_cet__participation` /
   *  `asm_cgms__participation`). */
  sourceKpiId?: string;
}

/** domains table. */
export interface DomainDef {
  id: string;
  framework: string;
  name: string;
  name_gu: string;
  weightage: number; // 0..1 (fraction of the INPUT composite; output domains use 0)
  sort_order: number;
  icon?: string; // lucide icon name
  accent?: string; // soft tint key for cards
  /** 4A model: "input" (Attendance/Assessment/Administration → composite) vs
   *  "output" (School Quality / GSQAC — shown standalone, not folded in). */
  kind?: "input" | "output";
  /** optional sub-domain grouping (3-tier seam; Administration uses 7). */
  sub_domains?: SubDomainDef[];
  /** optional per-domain band override; falls back to framework bands. */
  rating_bands?: RatingBand[];
}

/** kpi_definitions table. */
export interface KpiDef {
  id: string;
  domain_id: string;
  /** optional middle tier — groups indicators within a domain. */
  sub_domain?: string;
  name: string;
  name_gu: string;
  /** clarified "what this measures" description (shown in KPI detail). */
  description?: string;
  description_gu?: string;
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
  /** CONTEXT indicator: shown as a tile but NOT folded into the domain score.
   *  Use for counts and for delta/"improvement"/"reduction" %s whose value is a
   *  change-magnitude, not a 0–100 level (so averaging it would distort the score). */
  context?: boolean;

  // ── OGM 3.0 indicator metadata (source of truth: OGM 3.0 - Indicators.csv) ──
  /** reporting cadence; drives `displayStrategy`. */
  frequency?: Frequency;
  /** false ⇒ render the "Data not in data lake yet — demo data" badge. */
  availableInDataLake?: boolean;
  /** frequency-aware visualisation (trend/delta/snapshot/compliance/count). */
  displayStrategy?: DisplayStrategy;
  /** the domain's "Home Page Indicator for any hierarchy" — drives the domain card's primary value. */
  hero?: boolean;
  /** snapshot/cycle indicator — suppress the time-trend chart + sparkline; show a
   *  date/cycle context line instead. */
  noTrend?: boolean;
  /** a fixed schedule/month note shown as context (e.g. SAT 1 "September", SAT 2 "March"). */
  scheduleNote?: string;
  /** MULTI-METRIC indicator: 2–3 logical metrics inside one indicator card (the
   *  sheet's Formula/Logic column). When present the indicator renders as a
   *  `MultiMetricKpiCard` (compact sub-metric tiles), not a single-value card. */
  metrics?: KpiMetricDef[];
  /** sheet column "Show Last Updated on UI" (Yes ⇒ true): show a frequency-aware
   *  last-updated context label (Daily → date · Monthly → month · Yearly → year). */
  showLastUpdatedOnUi?: boolean;
  /** suppress the delta text and show an "as on <date>" context instead (sheet rows
   *  with a blank Delta column, e.g. "SAT reports downloaded in classrooms"). */
  suppressDelta?: boolean;
  /** plain-language formula + numerator/denominator (shown in Indicator Detail). */
  formula?: string;
  /** Gujarati formula copy (synthesized sub-metric defs carry the metric's own). */
  formula_gu?: string;
  numerator?: string;
  denominator?: string;
  /** PM-Shri global filter applies to this indicator's denominators. */
  pmShriApplicable?: boolean;
  /** levels this indicator is meaningful at (NA elsewhere → hidden). */
  hierarchyLevels?: Level[];
  /** roles allowed to see this indicator (e.g. teacher-attendance is officer-monitoring). */
  roleVisibility?: Role[];
  /** lowest level the indicator is computed at (e.g. dropout = school, never teacher). */
  lowestLevel?: Level;
  /** known data-lag caveat (e.g. dropout half-yearly, known next year via CTS). */
  dataLagNote?: string;
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

/** middle-tier rollup: a sub-domain's score within a domain (3-tier model). */
export interface SubDomainScore {
  sub: SubDomainDef;
  percent: number | null;
  grade: string | null;
  status: RagStatus;
  records: KpiRecord[];
}

export interface DomainScore {
  domain: DomainDef;
  /** 0..100 score of the domain. For domains with sub-domains it is the mean of
   *  sub-domain scores; otherwise the mean of its scored (%/score) indicators.
   *  count-type indicators are context (not folded into the %). */
  percent: number | null;
  grade: string | null;
  status: RagStatus;
  weightage: number;
  /** the domain's contribution to the input composite (weightage × percent). */
  contribution: number;
  records: KpiRecord[];
  /** sub-domain breakdown (empty for domains without sub-domains). */
  subScores: SubDomainScore[];
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
  /** overall change vs last week (the home "what changed" line). */
  overallDeltaWoW: number | null;
  grade: string | null;
  gradeGroup: "A" | "B" | "C" | "D" | null;
  status: RagStatus;
  domainScores: DomainScore[];
  /** the level directly above (for "you vs parent average" bars). */
  parent?: {
    entity: Entity;
    overallPercent: number | null;
    domainPercents: Record<string, number | null>;
  };
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
  /** per-domain % (the 4A breakdown behind the composite) — powers the
   *  transparent "why is this ranked here?" hover on the risk table. */
  domainPercents?: Record<string, number | null>;
}

export interface Period {
  id: string; // '2026-W23'
  label: string; // 'Week 23'
  kind: "week";
  index: number;
  weekStart: string; // ISO date
}
