import type { AppUser, Entity, KpiDef, Level, Period, Role } from "@/types";
import { BENCHMARKS } from "@/config/kpiCatalog";
import { noise } from "../prng";
import type { DataProvider, RawSeries } from "./types";
import entitiesSeed from "../seed/entities.json";
import usersSeed from "../seed/appUsers.json";

const ENTITIES = entitiesSeed as Entity[];
const USERS = usersSeed as AppUser[];
const N_PERIODS = 8; // matches config PERIODS

type Mode =
  | "avgFromSection"
  | "avgFromSchool"
  | "sumFromSchool"
  | "countSchoolsBelow"
  | "pctSchoolsMeeting"
  | "directBlockUp";

const GSQAC_DOMAIN_MAP: Record<string, "D1" | "D2" | "D3" | "D4" | "D5"> = {
  g_unit_test: "D1", g_summative: "D1", g_rwn: "D1", g_environment: "D1", g_teacher_proc: "D1", g_attendance: "D1",
  g_management: "D2", g_safety: "D2",
  g_prayer: "D3", g_sports: "D3", g_special: "D3",
  g_library: "D4", g_tech: "D4", g_mdm: "D4", g_wash: "D4",
  g_cet: "D5", g_cgms: "D5",
};

/** Count-of-schools KPIs: a school "fails" if its proxy metric is below this. */
const FAIL_THRESHOLD: Record<string, number> = {
  att_below_bench: 87,
  qual_low_perf: 50,
  qual_meeting: 70,
};

class MockProviderImpl implements DataProvider {
  readonly source = "mock" as const;
  private byId = new Map<string, Entity>();
  private childrenOf = new Map<string, Entity[]>();
  private schoolCache = new Map<string, Entity[]>();
  private usersByLogin = new Map<string, AppUser>();
  /** memo for the recursive rollup — deterministic data, so cache freely. */
  private memo = new Map<string, number | null>();

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
    this.schoolCache.set(id, res);
    return res;
  }

  // ── auth ───────────────────────────────────────────────────────────
  getUserByLogin(loginId: string) { return this.usersByLogin.get(loginId.trim().toUpperCase()); }

  resolveLogin(role: Role, loginId: string, secondField: string) {
    const u = this.getUserByLogin(loginId);
    if (!u || !u.active || u.role !== role) return undefined;
    const officer = role === "crc" || role === "brc" || role === "deo" || role === "state";
    if (officer) {
      return u.passcode && u.passcode === secondField.trim() ? u : undefined;
    }
    // teacher / principal: match school id
    return u.school_id && secondField.trim() && u.school_id === secondField.trim() ? u : undefined;
  }

  // ── value generation (deterministic cascade) ────────────────────────
  getValueSeries(entity: Entity, kpi: KpiDef, periods: Period[]): RawSeries {
    const rep = kpi.level_representation[entity.level];
    const benchmark = this.benchmarkFor(kpi, entity.level);
    if (rep === "NA") {
      return { series: periods.map((p) => ({ period: p.id, value: null })), benchmark: null };
    }
    const series = periods.map((p) => ({ period: p.id, value: this.aggregate(entity, kpi, p.index) }));
    return { series, benchmark };
  }

  private benchmarkFor(kpi: KpiDef, level: Level): number | null {
    const tbl = BENCHMARKS[kpi.id];
    if (tbl) {
      const v = tbl[level] ?? (level === "section" || level === "grade" ? tbl.school : undefined);
      if (v != null) return v;
    }
    // fallbacks keep any newly-added KPI rendering sensibly
    if (kpi.unit === "%") return 72;
    if (kpi.unit === "score") return 72;
    if (kpi.unit === "days") return 1.5;
    // count: scale by level
    const scale: Record<Level, number> = { section: 4, grade: 8, school: 20, cluster: 120, block: 450, district: 2200, state: 20000 };
    return scale[level];
  }

  private modeFor(kpi: KpiDef): Mode {
    const lr = kpi.level_representation;
    if (lr.section === "class") return "avgFromSection";
    if (lr.school === "count") return "sumFromSchool";
    if (lr.school === "school") return kpi.unit === "count" ? "sumFromSchool" : "avgFromSchool";
    if (lr.school === "NA" && lr.cluster === "count") return "countSchoolsBelow";
    if (lr.school === "NA" && lr.cluster === "avg") return "pctSchoolsMeeting";
    if (lr.school === "NA" && lr.cluster === "NA" && lr.block === "avg") return "directBlockUp";
    return "avgFromSchool";
  }

  /**
   * Genuine bottom-up rollup so every level equals the aggregate of the level
   * directly beneath it (Section→Grade→School→Cluster→Block→District→State).
   * Leaf values are generated only at a KPI's base level; parents average /
   * sum their children. Memoised because the data is deterministic.
   */
  private aggregate(entity: Entity, kpi: KpiDef, pIndex: number): number | null {
    const rep = kpi.level_representation[entity.level];
    if (rep === "NA") return null;

    const key = `${entity.id}|${kpi.id}|${pIndex}`;
    const hit = this.memo.get(key);
    if (hit !== undefined) return hit;

    const mode = this.modeFor(kpi);
    let result: number | null;

    if (mode === "countSchoolsBelow") {
      // count of schools beneath that fall below the benchmark (NA at school)
      const schools = this.getSchoolDescendants(entity.id);
      result =
        entity.level === "school" || !schools.length
          ? null
          : schools.filter((s) => this.schoolProxy(s, kpi, pIndex) < (FAIL_THRESHOLD[kpi.id] ?? 65)).length;
    } else if (mode === "pctSchoolsMeeting") {
      const schools = this.getSchoolDescendants(entity.id);
      result =
        entity.level === "school" || !schools.length
          ? null
          : round1((schools.filter((s) => this.schoolProxy(s, kpi, pIndex) >= (FAIL_THRESHOLD[kpi.id] ?? 70)).length / schools.length) * 100);
    } else if (this.isLeafLevel(entity.level, mode)) {
      result = this.leafValue(entity, kpi, pIndex);
    } else {
      // parent = aggregate of its direct children (skipping NA children)
      const kids = this.getChildren(entity.id)
        .map((c) => this.aggregate(c, kpi, pIndex))
        .filter((v): v is number => v != null);
      if (!kids.length) result = null;
      else if (mode === "sumFromSchool") result = Math.round(kids.reduce((a, b) => a + b, 0));
      else result = round1(mean(kids));
    }

    this.memo.set(key, result);
    return result;
  }

  /** the base level at which a KPI's leaf values are generated. */
  private isLeafLevel(level: Level, mode: Mode): boolean {
    if (mode === "avgFromSection") return level === "section";
    if (mode === "avgFromSchool" || mode === "sumFromSchool") return level === "school";
    if (mode === "directBlockUp") return level === "block";
    return false;
  }

  /** value at a leaf granularity (section for class-KPIs, school otherwise). */
  private leafValue(entity: Entity, kpi: KpiDef, pIndex: number): number | null {
    const strength = clamp01(entity.meta.anchor ?? 0.6);
    const key = `${entity.id}|${kpi.id}|${pIndex}`;
    const improve = N_PERIODS - 1 - pIndex; // 0 now, larger for past

    // GSQAC score → real school total %, gently trending
    if (kpi.id === "gsqac_score") {
      const base = entity.meta.gsqac?.total_percent ?? 72 * (0.7 + 0.5 * strength);
      return clamp(round1(base - improve * 0.5 + noise(key, 1.4)), 0, 100);
    }
    // GSQAC sub-domain KPIs → real D% when available
    const dkey = GSQAC_DOMAIN_MAP[kpi.id];
    if (dkey && entity.meta.gsqac?.domains?.[dkey] != null) {
      return clamp(round1((entity.meta.gsqac.domains[dkey] as number) - improve * 0.4 + noise(key, 3)), 0, 100);
    }

    if (kpi.unit === "count") {
      const bench = this.benchmarkFor(kpi, "school") ?? 20;
      const base = bench * (1.7 - 1.1 * strength);
      return Math.max(0, Math.round(base + improve * bench * 0.05 + noise(key, bench * 0.16)));
    }
    if (kpi.unit === "days") {
      const bench = this.benchmarkFor(kpi, "school") ?? 1.5;
      return Math.max(0, round1(bench * (1.9 - 1.3 * strength) + improve * 0.15 + noise(key, 0.4)));
    }

    // percentages (and score-as-% fallbacks)
    const bench = this.benchmarkFor(kpi, "school") ?? 72;
    const spread = 26;
    const dir = kpi.direction === "lower" ? -1 : 1;
    const trend = improve * 1.0 * dir; // recent better
    const v = bench + dir * (strength - 0.55) * spread - trend + noise(key, 6);
    return clamp(round1(v), 0, 100);
  }

  /** a school's proxy % used by count-of-schools / pct-meeting KPIs. */
  private schoolProxy(school: Entity, kpi: KpiDef, pIndex: number): number {
    if (kpi.id === "qual_low_perf" || kpi.id === "qual_meeting") {
      return school.meta.gsqac?.total_percent ?? clamp01(school.meta.anchor ?? 0.6) * 100;
    }
    // attendance-style proxy
    const strength = clamp01(school.meta.anchor ?? 0.6);
    return clamp(88 + (strength - 0.55) * 26 + noise(`${school.id}|${kpi.id}|${pIndex}`, 5), 0, 100);
  }
}

function mean(a: number[]) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }
function round1(v: number) { return Math.round(v * 10) / 10; }

export const MockProvider: DataProvider = new MockProviderImpl();
