import type { AppUser, Entity, KpiDef, Level, Period, Role } from "@/types";
import type { DataProvider, RawSeries } from "./types";

/**
 * SupabaseProvider — production seam (NOT wired in the prototype).
 *
 * Every method below maps to a query against the tables in
 * `supabase/schema.sql`. Switching `VITE_DATA_PROVIDER=supabase` (and adding
 * the @supabase/supabase-js client) is the entire migration from mock → live;
 * no component or hook changes. The shapes returned are identical to
 * MockProvider, which is the whole point of the DataProvider seam.
 *
 * Sketch of the queries:
 *   getEntity            → select * from entities where id = $1
 *   getChildren          → select * from entities where parent_id = $1
 *   getAncestors         → recursive CTE up entities.parent_id
 *   getSchoolDescendants → recursive CTE down where level = 'school'
 *   resolveLogin         → select * from app_users where login_id = $1 (+ passcode/school_id)
 *   getValueSeries       → select period, value, benchmark from kpi_values
 *                          where entity_id = $1 and kpi_id = $2 and period = any($3)
 *                          (rollups precomputed in a materialised view, or via
 *                           a recursive aggregate over entities.parent_id)
 */
const NOT_WIRED = "SupabaseProvider is a stub. Set VITE_DATA_PROVIDER=mock (default) for the prototype.";

export const SupabaseProvider: DataProvider = {
  source: "supabase",
  async init(): Promise<void> { /* PRODUCTION: create the supabase client + restore the auth session here. */ },
  getEntity(_id: string): Entity | undefined { throw new Error(NOT_WIRED); },
  getChildren(_id: string): Entity[] { throw new Error(NOT_WIRED); },
  getAncestors(_id: string): Entity[] { throw new Error(NOT_WIRED); },
  getSiblings(_id: string): Entity[] { throw new Error(NOT_WIRED); },
  getDescendants(_id: string, _level?: Level): Entity[] { throw new Error(NOT_WIRED); },
  getSchoolDescendants(_id: string): Entity[] { throw new Error(NOT_WIRED); },
  // PRODUCTION: scope must be enforced server-side via Postgres RLS on entities /
  // kpi_values (a policy that the requested entity is the JWT user's home entity or
  // a descendant of it), not just by this client predicate — client checks are bypassable.
  isInScope(_homeId: string, _id: string): boolean { throw new Error(NOT_WIRED); },
  getUserByLogin(_loginId: string): AppUser | undefined { throw new Error(NOT_WIRED); },
  resolveLogin(_role: Role, _loginId: string, _secondField: string): AppUser | undefined { throw new Error(NOT_WIRED); },
  resolveLoginById(_loginId: string, _secondField: string): AppUser | undefined { throw new Error(NOT_WIRED); },
  getValueSeries(_entity: Entity, _kpi: KpiDef, _periods: Period[]): RawSeries { throw new Error(NOT_WIRED); },
  setSchoolFilter(_mode: "all" | "pmshri" | "non"): void { /* no-op in the stub */ },
};
