import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Entity, Level } from "@/types";
import { useScope } from "@/hooks";

/**
 * Compare is an ACTION, not a navigation page (design handoff). The user opens
 * Compare, picks which n-1 child units to compare, and applies — only then do the
 * embedded bar charts appear inside the domain / KPI cards. Selection is
 * level-specific: it resets (and re-preselects every child) whenever the scope
 * changes, so a District's block selection never leaks into a Block's clusters.
 */
interface CompareValue {
  /** the child level being compared (null at a leaf scope → no Compare). */
  childLevel: Level | null;
  /** every child entity of the current scope (the selectable universe). */
  childEntities: Entity[];
  /** open the selection sheet/drawer. */
  open: boolean;
  setOpen: (v: boolean) => void;
  /** comparison applied → charts visible. */
  applied: boolean;
  /** ids of the selected child units (charts use only these). */
  selectedIds: string[];
  /** the selected child entities, in child order. */
  selected: Entity[];
  /** apply a selection (closes the sheet, reveals charts). */
  apply: (ids: string[]) => void;
  /** clear an applied comparison (hides charts, re-preselects all next open). */
  remove: () => void;
}

const Ctx = createContext<CompareValue>({
  childLevel: null, childEntities: [], open: false, setOpen: () => {},
  applied: false, selectedIds: [], selected: [], apply: () => {}, remove: () => {},
});

export function CompareProvider({ children }: { children: ReactNode }) {
  const { currentId, children: childEntities, childLevel } = useScope();
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // reset comparison on every scope change; preselect all children by default
  useEffect(() => {
    setApplied(false);
    setOpen(false);
    setSelectedIds(childEntities.map((c) => c.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const selected = useMemo(
    () => childEntities.filter((c) => selectedIds.includes(c.id)),
    [childEntities, selectedIds],
  );

  const value: CompareValue = {
    childLevel, childEntities, open, setOpen, applied, selectedIds, selected,
    apply: (ids) => { setSelectedIds(ids); setApplied(true); setOpen(false); },
    // clear: hide charts and reset selection to all, so reopening starts fresh
    remove: () => { setApplied(false); setOpen(false); setSelectedIds(childEntities.map((c) => c.id)); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCompare() {
  return useContext(Ctx);
}
