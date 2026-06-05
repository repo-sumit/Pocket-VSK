import type { AppUser, Entity, KpiDef, Level, Period, Role } from "@/types";
import { PUBLISHED } from "@/config/kpiCatalog";
import { noise } from "../prng";
import type { DataProvider, RawSeries } from "./types";
import entitiesSeed from "../seed/entities.json";
import usersSeed from "../seed/appUsers.json";

const ENTITIES = entitiesSeed as Entity[];
const USERS = usersSeed as AppUser[];
const N_PERIODS = 8; // matches config PERIODS
type FilterMode = "all" | "pmshri" | "non";

/**
 * MockProvider — deterministic data shaped exactly like the live `kpi_values`.
 *
 * Each level is ANCHORED to its published figure from VSK_KPI_Sample_Numbers
 * (PUBLISHED), with a stable per-entity offset so a level's *average* matches
 * the published number while individual entities spread for RAG / leaderboards.
 * Section → Grade roll up (grade = mean of its sections) so the teacher/
 * section comparison stays internally consistent. NOTE: the published
 * Teacher/School/…/State numbers are illustrative per-level figures, not a
 * single mathematical chain — so school↑ levels each show their own published
 * number rather than a strict bottom-up mean (faithful to the source PDF).
 */
class MockProviderImpl implements DataProvider {
  readonly source = "mock" as const;
  private byId = new Map<string, Entity>();
  private childrenOf = new Map<string, Entity[]>();
  private schoolCache = new Map<string, Entity[]>();
  private usersByLogin = new Map<string, AppUser>();
  private filterMode: FilterMode = "all";

  constructor() {
    for (const e of ENTITIES) this.byId.set(e.id, e);
    for (const e of ENTITIES) {
      if (e.parent_id) {
        const arr = this.childrenOf.get(e.parent_id) ?? [];
        arr.push(e);
        this.childrenOf.set(e.parent_id, arr);
      }
    }
    for (const u of USERS) this.usersByLogin.set(u.login_id.toUpperCase(), u);
  }

  // ── hierarchy ──────────────────────────────────────────────────────
  getEntity(id: string) { return this.byId.get(id); }
  getChildren(id: string) { return (this.childrenOf.get(id) ?? []).slice(); }

  getAncestors(id: string) {
    const out: Entity[] = [];
    let cur = this.byId.get(id);
    while (cur?.parent_id) {
      const p = this.byId.get(cur.parent_id);
      if (!p) break;
      out.push(p);
      cur = p;
    }
    return out;
  }

  getSiblings(id: string) {
    const e = this.byId.get(id);
    if (!e?.parent_id) return [];
    return (this.childrenOf.get(e.parent_id) ?? []).filter((s) => s.id !== id);
  }

  getDescendants(id: string, level?: Level) {
    const out: Entity[] = [];
    const walk = (pid: string) => {
      for (const c of this.childrenOf.get(pid) ?? []) {
        if (!level || c.level === level) out.push(c);
        walk(c.id);
      }
    };
    walk(id);
    return out;
  }

  getSchoolDescendants(id: string): Entity[] {
    if (this.schoolCache.has(id)) return this.schoolCache.get(id)!;
    const e = this.byId.get(id);
    let res: Entity[];
    if (!e) res = [];
    else if (e.level === "school") res = [e];
    else res = this.getDescendants(id, "school");
    res = res.filter((s) => this.schoolPass(s));
    this.schoolCache.set(id, res);
    return res;
  }

  // ── PM SHRI institutional filter ────────────────────────────────────
  setSchoolFilter(mode: FilterMode) {
    if (mode === this.filterMode) return;
    this.filterMode = mode;
    this.schoolCache.clear();
  }

  private schoolPass(e: Entity): boolean {
    if (this.filterMode === "all") return true;
    const isPm = !!e.meta.pmShri;
    return this.filterMode === "pmshri" ? isPm : !isPm;
  }

  // ── auth ───────────────────────────────────────────────────────────
  getUserByLogin(loginId: string) { return this.usersByLogin.get(loginId.trim().toUpperCase()); }

  resolveLogin(role: Role, loginId: string, secondField: string) {
    const u = this.getUserByLogin(loginId);
    if (!u || !u.active || u.role !== role) return undefined;
    if (role === "teacher" || role === "principal") {
      return u.school_id && secondField.trim() && u.school_id === secondField.trim() ? u : undefined;
    }
    return u.passcode && u.passcode === secondField.trim() ? u : undefined;
  }

  /** role resolved from the seed (not digit-length): teacher/principal validate
   *  against School UDISE, officers against a PIN. */
  resolveLoginById(loginId: string, secondField: string) {
    const u = this.getUserByLogin(loginId);
    if (!u || !u.active) return undefined;
    return this.resolveLogin(u.role, loginId, secondField);
  }

  // ── value generation (per-level anchoring) ──────────────────────────
  getValueSeries(entity: Entity, kpi: KpiDef, periods: Period[]): RawSeries {
    const rep = kpi.level_representation[entity.level];
    if (rep === "NA") return { series: periods.map((p) => ({ period: p.id, value: null })), benchmark: null };
    const benchmark = this.benchmarkFor(kpi, entity.level);
    const series = periods.map((p) => ({ period: p.id, value: this.valueAt(entity, kpi, p.index) }));
    return { series, benchmark };
  }

  /** the "benchmark" reference = this level's published figure (level average). */
  private benchmarkFor(kpi: KpiDef, level: Level): number | null {
    const p = PUBLISHED[kpi.id];
    if (!p) return null;
    if (level === "grade") return p.section ?? null;
    return p[level] ?? null;
  }

  private valueAt(entity: Entity, kpi: KpiDef, pIndex: number): number | null {
    const level = entity.level;
    if (level === "grade") {
      const secs = this.getChildren(entity.id);
      const vals = secs.map((s) => this.valueAt(s, kpi, pIndex)).filter((v): v is number => v != null);
      return vals.length ? round1(mean(vals)) : null;
    }
    const pub = PUBLISHED[kpi.id]?.[level];
    if (pub == null) return null;
    return this.anchored(entity, kpi, this.biasedAnchor(pub, kpi, level), pIndex);
  }

  /** PM SHRI filter nudges aggregate (cluster↑) anchors; schools/own scope unbiased. */
  private biasedAnchor(anchor: number, kpi: KpiDef, level: Level): number {
    if (this.filterMode === "all" || level === "section" || level === "grade" || level === "school") return anchor;
    const numberUp = this.filterMode === "pmshri" ? kpi.direction === "higher" : kpi.direction === "lower";
    if (kpi.unit === "%") return clamp(anchor + (numberUp ? 3 : -3), 0, 100);
    const frac = this.filterMode === "pmshri" ? 0.06 : 0.03;
    return Math.max(0, anchor * (numberUp ? 1 + frac : 1 - frac));
  }

  private anchored(entity: Entity, kpi: KpiDef, anchor: number, pIndex: number): number {
    const improve = N_PERIODS - 1 - pIndex; // 0 now, larger for past periods
    const higher = kpi.direction === "higher";
    const offKey = `${entity.id}|${kpi.id}`; // stable per-entity offset (period-independent)
    const wob = `${entity.id}|${kpi.id}|${pIndex}`;

    if (kpi.unit === "count") {
      const jf = noise(offKey, 0.18); // ±18% per-entity spread
      const trend = (higher ? -improve : improve) * 0.02; // recent better
      const v = anchor * (1 + jf) * (1 + trend) + noise(wob, anchor * 0.02);
      return Math.max(0, Math.round(v));
    }
    // % and score
    const spread = 9;
    const jitter = noise(offKey, spread);
    const trend = (higher ? -improve : improve) * 0.7; // recent better
    let v = anchor + jitter - trend + noise(wob, 1.6);
    const hi = kpi.unit === "%" ? 100 : Math.max(100, anchor * 1.4);
    return round1(clamp(v, 0, hi));
  }
}

function mean(a: number[]) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function round1(v: number) { return Math.round(v * 10) / 10; }

export const MockProvider: DataProvider = new MockProviderImpl();
