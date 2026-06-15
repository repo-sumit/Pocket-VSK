import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Entity, Level } from "@/types";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n";
import { Check, Search, X } from "@/components/ui/Icon";

/**
 * Compare selector — the n-1 child-unit checklist. A bottom sheet on mobile, a
 * right-side drawer on desktop (`vsk-drawer`/`sheet-up` animations). Search,
 * Select all / Clear all, every unit preselected on open, Cancel + Apply (Apply
 * disabled with nothing selected). Portaled to <body> so the header's backdrop
 * blur can't capture the fixed overlay.
 */
export function CompareSheet({
  open, childLevel, all, initial, applied, onApply, onRemove, onClose,
}: {
  open: boolean;
  childLevel: Level;
  all: Entity[];
  initial: string[];
  /** whether a comparison is currently applied (enables the Remove action). */
  applied: boolean;
  onApply: (ids: string[]) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const { t, tn } = useT();
  const [sel, setSel] = useState<string[]>(initial);
  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setSel(initial);
    setQ("");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => searchRef.current?.focus());
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const levelLabel = t(`levels.${childLevel}`);
  const sorted = useMemo(() => [...all].sort((a, b) => tn(a.name, a.name_gu).localeCompare(tn(b.name, b.name_gu))), [all, tn]);
  const filtered = useMemo(
    () => (q ? sorted.filter((c) => tn(c.name, c.name_gu).toLowerCase().includes(q.toLowerCase())) : sorted),
    [sorted, q, tn],
  );
  if (!open) return null;

  const allChecked = sel.length === all.length && all.length > 0;
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  // When a comparison is currently active, the footer collapses to a single one-click
  // "Remove comparison" action (clears selection, hides charts, closes — all via onRemove).
  // Otherwise it's Cancel + Apply (n).
  const removeMode = applied;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 animate-fade-in bg-neutral-900/40 backdrop-blur-[1px]" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("compare.sheetTitle", { level: levelLabel })}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[82dvh] w-full animate-sheet-up flex-col rounded-t-3xl bg-white shadow-raised sm:h-full sm:max-h-none sm:w-[22rem] sm:max-w-[90%] sm:rounded-none"
      >
        <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-neutral-200 sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-2 px-5 pb-2 pt-3">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-neutral-900">{t("compare.sheetTitle", { level: levelLabel })}</h2>
            <p className="text-2xs text-neutral-400">{t("compare.sheetSubtitle")}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t("common.close")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pb-2">
          <div className="flex items-center gap-2 rounded-full border border-line bg-neutral-50 px-3.5 py-2">
            <Search size={15} className="shrink-0 text-neutral-400" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`${t("common.search")}…`}
              aria-label={t("common.search")}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-5 pb-2">
          <span className="text-xs font-bold text-neutral-400">{t("compare.selectedOf", { n: sel.length, total: all.length })}</span>
          {/* Select all + (when a comparison is active) a one-click "Remove comparison"
              in place of "Clear all" — removes immediately via onRemove (clears, hides
              charts, closes). Apply (footer) stays available to re-apply a changed selection. */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSel(all.map((c) => c.id))}
              disabled={allChecked}
              className={cn("inline-flex h-11 items-center rounded-full border border-line bg-white px-4 text-sm font-bold transition-colors", allChecked ? "cursor-not-allowed text-neutral-300" : "text-primary-700 hover:bg-primary-50")}
            >
              {t("common.selectAll")}
            </button>
            {removeMode ? (
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex h-11 items-center rounded-full bg-neutral-700 px-4 text-sm font-bold text-white transition-colors hover:bg-neutral-800"
              >
                {t("compare.remove")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSel([])}
                disabled={sel.length === 0}
                className={cn("inline-flex h-11 items-center rounded-full border border-line bg-white px-4 text-sm font-bold transition-colors", sel.length === 0 ? "cursor-not-allowed text-neutral-300" : "text-primary-700 hover:bg-primary-50")}
              >
                {t("common.clearAll")}
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3">
          {filtered.length ? (
            filtered.map((c) => {
              const on = sel.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-neutral-50"
                >
                  <span className={cn("grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md transition-colors", on ? "bg-primary-500" : "border-[1.5px] border-line-strong")}>
                    {on && <Check size={14} className="text-white" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-800">{tn(c.name, c.name_gu)}</span>
                </button>
              );
            })
          ) : (
            <p className="px-4 py-8 text-center text-sm text-neutral-400">{t("common.noMatches")}</p>
          )}
        </div>

        <div className="flex gap-2.5 border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} className="min-h-[44px] flex-1 rounded-full border border-line bg-white py-3 text-sm font-bold text-neutral-600 hover:bg-neutral-50">
            {t("common.cancel")}
          </button>
          <button
            type="button"
            disabled={sel.length === 0}
            onClick={() => sel.length && onApply(sel)}
            className={cn("min-h-[44px] flex-[2] rounded-full py-3 text-sm font-bold text-white", sel.length ? "bg-primary-500 hover:bg-primary-600" : "cursor-not-allowed bg-primary-200")}
          >
            {t("common.apply")}{sel.length ? ` (${sel.length})` : ""}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
