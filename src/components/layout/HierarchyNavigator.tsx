import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import type { Entity } from "@/types";
import { useScope } from "@/hooks";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { ChevronLeft, ChevronRight, Search, X } from "../ui/Icon";

/**
 * Smart hierarchy navigator — replaces the long breadcrumb (which broke on
 * mobile). One control, two faces:
 *  • Mobile: a rounded pill — ‹ up · current scope · drill ›. Left steps up one
 *    level (within the user's scope); the centre + right open a bottom-sheet
 *    picker of the next level down.
 *  • Desktop: a clean inline trail (each step navigable, current bold) plus a
 *    "Change {child level}" control that opens the same picker.
 * Drill-up is bounded by the user's home scope (you can never climb above it).
 */
export function HierarchyNavigator({ className }: { className?: string }) {
  const { entity, trail, children, childLevel, setScope } = useScope();
  const { t, tn } = useT();
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!entity) return null;

  // trail is home → … → current; the step above (within scope) is second-to-last
  const parent = trail.length > 1 ? trail[trail.length - 2] : null;
  const canDrill = !!childLevel && children.length > 0;
  const levelLabel = t(`levels.${entity.level}`);
  const entityName = tn(entity.name, entity.name_gu);
  const parentName = parent ? tn(parent.name, parent.name_gu) : null;

  const goTo = (id: string) => {
    setScope(id);
    navigate("/app");
  };

  return (
    <div className={cn("min-w-0", className)}>
      {/* ── Mobile: pill ── */}
      <div className="flex items-stretch gap-1 rounded-2xl border border-line/70 bg-white p-1 shadow-card lg:hidden">
        <NavArrow
          dir="left"
          disabled={!parent}
          label={parent ? t("hierarchy.up", { level: t(`levels.${parent.level}`) }) : t("hierarchy.upTop")}
          onClick={() => parent && goTo(parent.id)}
        />
        <button
          type="button"
          disabled={!canDrill}
          onClick={() => canDrill && setPickerOpen(true)}
          className={cn(
            "flex min-w-0 flex-1 flex-col items-center justify-center px-2 py-1 text-center",
            canDrill && "rounded-xl hover:bg-neutral-50",
          )}
        >
          {parentName && (
            <span className="block max-w-full truncate text-2xs font-medium text-neutral-400">
              {t("hierarchy.parent")} · {parentName}
            </span>
          )}
          <span className="flex max-w-full items-center gap-1 truncate text-sm font-bold text-neutral-900">
            <span className="truncate">{entityName}</span>
          </span>
          <span className="block text-2xs font-medium text-neutral-400">{levelLabel}</span>
        </button>
        <NavArrow
          dir="right"
          disabled={!canDrill}
          label={canDrill ? t("hierarchy.change", { level: t(`levels.${childLevel!}`) }) : t("hierarchy.noChild", { level: levelLabel })}
          onClick={() => canDrill && setPickerOpen(true)}
        />
      </div>

      {/* ── Desktop: back-one-level · clean trail · select-level control ── */}
      <div className="hidden min-w-0 items-center gap-2 lg:flex">
        {parent && (
          <button
            type="button"
            onClick={() => goTo(parent.id)}
            aria-label={t("hierarchy.up", { level: t(`levels.${parent.level}`) })}
            title={t("hierarchy.up", { level: t(`levels.${parent.level}`) })}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        <nav className="flex min-w-0 items-center gap-1 overflow-hidden text-xs" aria-label={t("scorecard.yourScope")}>
          {trail.map((e, i) => {
            const last = i === trail.length - 1;
            return (
              <span key={e.id} className="flex min-w-0 items-center gap-1">
                {i > 0 && <span className="shrink-0 text-neutral-300">/</span>}
                <button
                  type="button"
                  onClick={() => !last && goTo(e.id)}
                  disabled={last}
                  className={cn(
                    "max-w-[12rem] truncate rounded-md px-1.5 py-0.5 font-semibold",
                    last ? "text-neutral-900" : "text-neutral-500 hover:bg-neutral-100 hover:text-primary-600",
                  )}
                  title={tn(e.name, e.name_gu)}
                >
                  <span className="font-medium text-neutral-400">{t(`levels.${e.level}`)} · </span>
                  {tn(e.name, e.name_gu)}
                </button>
              </span>
            );
          })}
        </nav>
        {canDrill && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-200"
          >
            {t("hierarchy.change", { level: t(`levels.${childLevel!}`) })}
            <ChevronRight size={13} className="text-neutral-400" />
          </button>
        )}
      </div>

      {pickerOpen && childLevel && (
        <ChildPicker
          levelLabel={t(`levels.${childLevel}`)}
          children={children}
          currentId={entity.id}
          onPick={(id) => { setPickerOpen(false); goTo(id); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function NavArrow({ dir, disabled, label, onClick }: { dir: "left" | "right"; disabled?: boolean; label: string; onClick: () => void }) {
  const I = dir === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors",
        disabled ? "text-neutral-200" : "text-neutral-500 hover:bg-neutral-100 active:bg-neutral-200",
      )}
    >
      <I size={20} />
    </button>
  );
}

/**
 * Next-level picker — a bottom sheet on mobile (thumb-reachable, big tap rows),
 * a centred card on desktop. Search appears for long lists (districts, schools).
 */
function ChildPicker({
  levelLabel, children, currentId, onPick, onClose,
}: {
  levelLabel: string;
  children: Entity[];
  currentId: string;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const { t, tn } = useT();
  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const canSearch = children.length > 8;

  const sorted = useMemo(
    () => [...children].sort((a, b) => tn(a.name, a.name_gu).localeCompare(tn(b.name, b.name_gu))),
    [children, tn],
  );
  const filtered = useMemo(
    () => (q ? sorted.filter((c) => tn(c.name, c.name_gu).toLowerCase().includes(q.toLowerCase())) : sorted),
    [sorted, q, tn],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => { if (canSearch) searchRef.current?.focus(); });
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; cancelAnimationFrame(raf); };
  }, [onClose, canSearch]);

  // Portal to <body>: the app header uses backdrop-filter, which creates a
  // containing block for fixed-position descendants — rendering inside it would
  // pin the sheet to the header, not the viewport.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 animate-fade-in bg-neutral-900/40 backdrop-blur-[1px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("hierarchy.selectTitle", { level: levelLabel })}
        className="relative flex max-h-[82dvh] w-full animate-sheet-up flex-col rounded-t-3xl bg-white shadow-raised sm:max-h-[70dvh] sm:max-w-md sm:animate-scale-in sm:rounded-3xl"
      >
        {/* mobile grab handle */}
        <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-neutral-200 sm:hidden" aria-hidden />
        <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-3">
          <h2 className="text-base font-extrabold text-neutral-900">{t("hierarchy.selectTitle", { level: levelLabel })}</h2>
          <button type="button" onClick={onClose} aria-label={t("common.close")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200">
            <X size={16} />
          </button>
        </div>
        {canSearch && (
          <div className="relative px-5 pb-2">
            <Search size={15} className="pointer-events-none absolute left-7 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("hierarchy.search", { level: levelLabel })}
              aria-label={t("hierarchy.search", { level: levelLabel })}
              className="w-full rounded-xl border border-line bg-neutral-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary-400 focus:bg-white"
            />
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1">
          {filtered.length ? (
            filtered.map((c) => {
              const isCurrent = c.id === currentId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onPick(c.id)}
                  className={cn(
                    "flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-neutral-50",
                    isCurrent ? "font-bold text-primary-700" : "font-semibold text-neutral-800",
                  )}
                >
                  <ChevronRight size={15} className="shrink-0 text-neutral-300" />
                  <span className="min-w-0 flex-1 truncate">{tn(c.name, c.name_gu)}</span>
                </button>
              );
            })
          ) : (
            <p className="px-4 py-8 text-center text-sm text-neutral-400">{t("common.noMatches")}</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
