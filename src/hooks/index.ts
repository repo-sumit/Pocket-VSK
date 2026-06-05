import { useMemo } from "react";
import type { Entity } from "@/types";
import { PERIODS, getFramework } from "@/config";
import { dataProvider } from "@/data/provider";
import {
  getChildLeaderboard,
  getKpiCascade,
  getKpiRecord,
  getOverallBenchmark,
  getOverallCascade,
  getPeerLeaderboard,
  getScorecard,
  childLevelOf,
} from "@/engine";
import { useSession } from "@/store/session";

export { PERIODS } from "@/config";

export function useFramework() {
  const frameworkId = useSession((s) => s.frameworkId);
  return useMemo(() => getFramework(frameworkId), [frameworkId]);
}

/** the active PM SHRI filter — every data hook applies it before computing. */
export function usePmShri() {
  return useSession((s) => s.pmShri);
}

/** the user's scope + current (possibly drilled-down) entity + helpers. */
export function useScope() {
  const user = useSession((s) => s.user);
  const scopeId = useSession((s) => s.scopeId);
  const setScope = useSession((s) => s.setScope);
  const resetScope = useSession((s) => s.resetScope);

  const homeId = user?.entity_id ?? null;
  // ACCESS CONTROL (read-side clamp): never trust the persisted scopeId. If it
  // points outside the user's subtree (e.g. hand-edited localStorage), fall back
  // to home so no out-of-scope entity is ever rendered. Pairs with the write-side
  // guard in setScope. NOTE: client-side only; production needs server-side authz.
  const rawId = scopeId ?? homeId;
  const currentId = homeId && rawId && dataProvider.isInScope(homeId, rawId) ? rawId : homeId;

  const entity = useMemo(() => (currentId ? dataProvider.getEntity(currentId) : undefined), [currentId]);
  const homeEntity = useMemo(() => (homeId ? dataProvider.getEntity(homeId) : undefined), [homeId]);

  const trail = useMemo<Entity[]>(() => {
    if (!entity || !homeId) return entity ? [entity] : [];
    const chain = [entity, ...dataProvider.getAncestors(entity.id)];
    const homeIdx = chain.findIndex((e) => e.id === homeId);
    // clamp to home → current; if home isn't on the chain (escaped scope), show
    // only the current entity rather than leaking the full ancestor chain.
    const bounded = homeIdx >= 0 ? chain.slice(0, homeIdx + 1) : [entity];
    return bounded.reverse();
  }, [entity, homeId]);

  const children = useMemo(() => (currentId ? dataProvider.getChildren(currentId) : []), [currentId]);
  const childLevel = entity ? childLevelOf(entity.level) : null;

  return { user, entity, homeEntity, currentId, homeId, setScope, resetScope, trail, children, childLevel };
}

export function useScorecard(entityId: string | null | undefined) {
  const fw = useFramework();
  const pmShri = usePmShri();
  const role = useSession((s) => s.user?.role);
  return useMemo(() => {
    dataProvider.setSchoolFilter(pmShri);
    return entityId ? getScorecard(fw, entityId, PERIODS, role) : null;
  }, [fw, entityId, pmShri, role]);
}

export function useKpiRecord(kpiId: string | undefined, entityId: string | null | undefined) {
  const fw = useFramework();
  const pmShri = usePmShri();
  return useMemo(() => {
    dataProvider.setSchoolFilter(pmShri);
    return kpiId && entityId ? getKpiRecord(fw, kpiId, entityId, PERIODS) : null;
  }, [fw, kpiId, entityId, pmShri]);
}

export function usePeerLeaderboard(entityId: string | null | undefined) {
  const fw = useFramework();
  const pmShri = usePmShri();
  const role = useSession((s) => s.user?.role);
  return useMemo(() => {
    dataProvider.setSchoolFilter(pmShri);
    return entityId ? getPeerLeaderboard(fw, entityId, PERIODS, role) : [];
  }, [fw, entityId, pmShri, role]);
}

export function useChildLeaderboard(entityId: string | null | undefined) {
  const fw = useFramework();
  const pmShri = usePmShri();
  const role = useSession((s) => s.user?.role);
  return useMemo(() => {
    dataProvider.setSchoolFilter(pmShri);
    return entityId ? getChildLeaderboard(fw, entityId, PERIODS, role) : [];
  }, [fw, entityId, pmShri, role]);
}

/** Read-only aggregate benchmark (overall % + per-domain %) for a higher level
 *  shown as comparison context only — see engine getOverallBenchmark. */
export function useOverallBenchmark(entityId: string | null | undefined) {
  const fw = useFramework();
  const pmShri = usePmShri();
  const role = useSession((s) => s.user?.role);
  return useMemo(() => {
    dataProvider.setSchoolFilter(pmShri);
    return entityId ? getOverallBenchmark(fw, entityId, PERIODS, role) : null;
  }, [fw, entityId, pmShri, role]);
}

export function useOverallCascade(entityId: string | null | undefined) {
  const fw = useFramework();
  const pmShri = usePmShri();
  const role = useSession((s) => s.user?.role);
  return useMemo(() => {
    dataProvider.setSchoolFilter(pmShri);
    return entityId ? getOverallCascade(fw, entityId, PERIODS, role) : [];
  }, [fw, entityId, pmShri, role]);
}

export function useKpiCascade(kpiId: string | undefined, entityId: string | null | undefined) {
  const fw = useFramework();
  const pmShri = usePmShri();
  return useMemo(() => {
    dataProvider.setSchoolFilter(pmShri);
    return kpiId && entityId ? getKpiCascade(fw, kpiId, entityId, PERIODS) : [];
  }, [fw, kpiId, entityId, pmShri]);
}

export function useEntity(id: string | null | undefined) {
  return useMemo(() => (id ? dataProvider.getEntity(id) : undefined), [id]);
}
