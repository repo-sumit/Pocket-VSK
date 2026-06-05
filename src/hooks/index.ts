import { useMemo } from "react";
import type { Entity } from "@/types";
import { PERIODS, getFramework } from "@/config";
import { dataProvider } from "@/data/provider";
import {
  getChildLeaderboard,
  getKpiCascade,
  getKpiRecord,
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

/** the user's scope + current (possibly drilled-down) entity + helpers. */
export function useScope() {
  const user = useSession((s) => s.user);
  const scopeId = useSession((s) => s.scopeId);
  const setScope = useSession((s) => s.setScope);
  const resetScope = useSession((s) => s.resetScope);

  const homeId = user?.entity_id ?? null;
  const currentId = scopeId ?? homeId;

  const entity = useMemo(() => (currentId ? dataProvider.getEntity(currentId) : undefined), [currentId]);
  const homeEntity = useMemo(() => (homeId ? dataProvider.getEntity(homeId) : undefined), [homeId]);

  /** breadcrumb from the user's home scope down to the current entity. */
  const trail = useMemo<Entity[]>(() => {
    if (!entity || !homeId) return entity ? [entity] : [];
    const chain = [entity, ...dataProvider.getAncestors(entity.id)];
    const homeIdx = chain.findIndex((e) => e.id === homeId);
    const bounded = homeIdx >= 0 ? chain.slice(0, homeIdx + 1) : chain;
    return bounded.reverse(); // home → … → current
  }, [entity, homeId]);

  const children = useMemo(() => (currentId ? dataProvider.getChildren(currentId) : []), [currentId]);
  const childLevel = entity ? childLevelOf(entity.level) : null;

  return { user, entity, homeEntity, currentId, homeId, setScope, resetScope, trail, children, childLevel };
}

export function useScorecard(entityId: string | null | undefined) {
  const fw = useFramework();
  return useMemo(() => (entityId ? getScorecard(fw, entityId, PERIODS) : null), [fw, entityId]);
}

export function useKpiRecord(kpiId: string | undefined, entityId: string | null | undefined) {
  const fw = useFramework();
  return useMemo(() => (kpiId && entityId ? getKpiRecord(fw, kpiId, entityId, PERIODS) : null), [fw, kpiId, entityId]);
}

export function usePeerLeaderboard(entityId: string | null | undefined) {
  const fw = useFramework();
  return useMemo(() => (entityId ? getPeerLeaderboard(fw, entityId, PERIODS) : []), [fw, entityId]);
}

export function useChildLeaderboard(entityId: string | null | undefined) {
  const fw = useFramework();
  return useMemo(() => (entityId ? getChildLeaderboard(fw, entityId, PERIODS) : []), [fw, entityId]);
}

export function useOverallCascade(entityId: string | null | undefined) {
  const fw = useFramework();
  return useMemo(() => (entityId ? getOverallCascade(fw, entityId, PERIODS) : []), [fw, entityId]);
}

export function useKpiCascade(kpiId: string | undefined, entityId: string | null | undefined) {
  const fw = useFramework();
  return useMemo(() => (kpiId && entityId ? getKpiCascade(fw, kpiId, entityId, PERIODS) : []), [fw, kpiId, entityId]);
}

export function useEntity(id: string | null | undefined) {
  return useMemo(() => (id ? dataProvider.getEntity(id) : undefined), [id]);
}
