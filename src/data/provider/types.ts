import type { AppUser, Entity, KpiDef, Level, Period, Role } from "@/types";

export interface RawSeries {
  /** value at each requested period (null ⇒ NA at this level). */
  series: { period: string; value: number | null }[];
  benchmark: number | null;
}

/**
 * The single seam between the UI and the data. MockProvider fabricates
 * deterministic values now; SupabaseProvider will read the live tables
 * later. Components/hooks NEVER touch raw data — only this interface.
 */
export interface DataProvider {
  readonly source: "mock" | "supabase";

  /** Load any data the provider needs (the mock seed chunk; a live client/session
   *  later). Awaited once at boot before the app renders. */
  init(): Promise<void>;

  // ── hierarchy ──
  getEntity(id: string): Entity | undefined;
  getChildren(id: string): Entity[];
  getAncestors(id: string): Entity[]; // parent → … → state (nearest first)
  getSiblings(id: string): Entity[];
  /** all descendants at a given level (or all descendants when omitted). */
  getDescendants(id: string, level?: Level): Entity[];
  getSchoolDescendants(id: string): Entity[];
  /** access-control predicate: is `id` the home entity itself or a descendant
   *  of it? The single source of truth for "is this entity in the user's scope".
   *  NOTE: client-side only — production MUST also enforce this server-side (RLS). */
  isInScope(homeId: string, id: string): boolean;

  // ── auth ──
  getUserByLogin(loginId: string): AppUser | undefined;
  /** resolve a login → user. secondField = schoolId (teacher/principal) or passcode (officer). */
  resolveLogin(role: Role, loginId: string, secondField: string): AppUser | undefined;
  /** resolve role from a seed lookup of the ID (handles 10-digit teacher vs cluster collisions). */
  resolveLoginById(loginId: string, secondField: string): AppUser | undefined;

  // ── values (raw, shaped like kpi_values) ──
  /** the cascading value series for one entity × KPI across the given periods. */
  getValueSeries(entity: Entity, kpi: KpiDef, periods: Period[]): RawSeries;

  /** global PM SHRI filter — scopes which schools feed the aggregate rollups. */
  setSchoolFilter(mode: "all" | "pmshri" | "non"): void;
}
