import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n";
import { Check, ChevronDown, Search } from "./Icon";

export interface SelectOption { value: string; label: string }

/**
 * Design-system single-select — the on-brand replacement for native <select>.
 * Mirrors the header "All Schools" pill (rounded-full trigger, neutral-100 bg,
 * primary accent) and the MultiSelect popover. Type-to-search for long lists,
 * truncate + tooltip on long names, full combobox keyboard a11y (ArrowUp/Down,
 * Home/End, Enter, Esc, type-to-filter), hover + selected states.
 */
export function Select({
  value, onChange, options, placeholder, ariaLabel, leadingIcon, searchable, className, triggerClassName, align = "left",
}: {
  value: string | null | undefined;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  leadingIcon?: ReactNode;
  /** force the search box on/off; defaults to on when there are > 8 options. */
  searchable?: boolean;
  className?: string;
  triggerClassName?: string;
  align?: "left" | "right";
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const listId = `${baseId}-list`;

  const canSearch = searchable ?? options.length > 8;
  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(
    () => (q ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options),
    [options, q],
  );

  // on open: clear the query, point the active row at the current selection, focus
  useEffect(() => {
    if (!open) return;
    setQ("");
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    const raf = requestAnimationFrame(() => (canSearch ? searchRef : listRef).current?.focus());
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => { setActive((a) => Math.min(a, Math.max(0, filtered.length - 1))); }, [filtered.length]);
  useEffect(() => {
    if (open) document.getElementById(`${baseId}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, open, baseId]);

  const close = (focusTrigger = true) => { setOpen(false); if (focusTrigger) triggerRef.current?.focus(); };
  const pick = (opt: SelectOption) => { onChange(opt.value); close(); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); break;
      case "ArrowUp": e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); break;
      case "Home": e.preventDefault(); setActive(0); break;
      case "End": e.preventDefault(); setActive(filtered.length - 1); break;
      case "Enter": { e.preventDefault(); const o = filtered[active]; if (o) pick(o); break; }
      case "Escape": e.preventDefault(); close(); break;
      case "Tab": setOpen(false); break;
    }
  };

  const activeId = filtered[active] ? `${baseId}-opt-${active}` : undefined;

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) { e.preventDefault(); setOpen(true); }
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 outline-none transition-colors hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-primary-400 active:scale-[0.99]",
          triggerClassName,
        )}
      >
        {leadingIcon}
        <span className={cn("min-w-0 flex-1 truncate text-left", !selected && "font-medium text-neutral-400")} title={selected?.label}>
          {selected ? selected.label : placeholder ?? `${t("common.search")}…`}
        </span>
        <ChevronDown size={14} className={cn("shrink-0 text-neutral-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          {/* click-away backdrop (matches MultiSelect) */}
          <div className="fixed inset-0 z-30" onClick={() => close(false)} aria-hidden />
          <div
            className={cn(
              "absolute z-40 mt-1.5 w-full min-w-[12rem] rounded-xl border border-line bg-white p-1.5 shadow-raised",
              align === "right" ? "right-0" : "left-0",
            )}
            onKeyDown={onKeyDown}
          >
            {canSearch && (
              <div className="relative mb-1">
                <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  ref={searchRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  role="combobox"
                  aria-expanded={open}
                  aria-controls={listId}
                  aria-activedescendant={activeId}
                  aria-autocomplete="list"
                  aria-label={ariaLabel ?? t("common.search")}
                  placeholder={`${t("common.search")}…`}
                  className="w-full rounded-lg border border-line bg-neutral-50 py-1.5 pl-7 pr-2.5 text-xs outline-none focus:border-primary-400 focus:bg-white"
                />
              </div>
            )}
            <div
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label={ariaLabel}
              aria-activedescendant={canSearch ? undefined : activeId}
              tabIndex={canSearch ? -1 : 0}
              className="max-h-56 overflow-auto outline-none"
            >
              {filtered.length ? (
                filtered.map((o, i) => {
                  const isSel = o.value === value;
                  return (
                    <div
                      key={o.value}
                      id={`${baseId}-opt-${i}`}
                      role="option"
                      aria-selected={isSel}
                      onClick={() => pick(o)}
                      onMouseEnter={() => setActive(i)}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs",
                        i === active && "bg-neutral-100",
                        isSel ? "font-semibold text-primary-700" : "text-neutral-700",
                      )}
                      title={o.label}
                    >
                      <span className="min-w-0 flex-1 truncate">{o.label}</span>
                      {isSel && <Check size={14} className="shrink-0 text-primary-600" />}
                    </div>
                  );
                })
              ) : (
                <p className="px-2.5 py-3 text-center text-xs text-neutral-400">{t("common.noMatches")}</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
