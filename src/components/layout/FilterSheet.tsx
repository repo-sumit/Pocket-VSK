import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useSession, type PmShriMode } from "@/store/session";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Check, X } from "@/components/ui/Icon";

/**
 * Consolidated filter sheet (latest design) — the header funnel icon opens this
 * single sheet instead of separate All-Schools / Language pills. School Type
 * (officers only) + Language, as large radio rows. Bottom sheet on mobile, a
 * centred card on desktop; portaled to <body> so the header's backdrop blur can't
 * capture the fixed overlay. School-type and i18n logic are unchanged — this only
 * moves the controls.
 */
export function FilterSheet({ open, isOfficer, onClose }: { open: boolean; isOfficer: boolean; onClose: () => void }) {
  const { t } = useT();
  const lang = useSession((s) => s.lang);
  const setLang = useSession((s) => s.setLang);
  const pmShri = useSession((s) => s.pmShri);
  const setPmShri = useSession((s) => s.setPmShri);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;

  const schoolTypes: { value: PmShriMode; label: string }[] = [
    { value: "all", label: t("pmShri.all") },
    { value: "pmshri", label: t("pmShri.pmshri") },
    { value: "non", label: t("pmShri.non") },
  ];
  const languages: { value: "en" | "gu"; label: string }[] = [
    { value: "en", label: t("filters.english") },
    { value: "gu", label: t("filters.gujarati") },
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 animate-fade-in bg-neutral-900/40 backdrop-blur-[1px]" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("filters.title")}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[82dvh] w-full animate-sheet-up flex-col rounded-t-3xl bg-white shadow-raised sm:max-h-[80dvh] sm:max-w-sm sm:animate-scale-in sm:rounded-3xl"
      >
        <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-neutral-200 sm:hidden" aria-hidden />
        <div className="flex items-center justify-between gap-2 px-5 pb-1 pt-3">
          <h2 className="text-base font-extrabold text-neutral-900">{t("filters.title")}</h2>
          <button type="button" onClick={onClose} aria-label={t("common.close")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200">
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2 pt-1">
          {isOfficer && (
            <FilterGroup title={t("filters.schoolType")}>
              {schoolTypes.map((o) => (
                <RadioRow key={o.value} label={o.label} selected={pmShri === o.value} onClick={() => setPmShri(o.value)} />
              ))}
            </FilterGroup>
          )}
          <FilterGroup title={t("filters.language")}>
            {languages.map((o) => (
              <RadioRow key={o.value} label={o.label} indic={o.value === "gu"} selected={lang === o.value} onClick={() => setLang(o.value)} />
            ))}
          </FilterGroup>
        </div>

        <div className="border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} className="w-full rounded-full bg-primary-500 py-3 text-sm font-bold text-white hover:bg-primary-600">
            {t("filters.done")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="py-2">
      <p className="mb-1.5 text-2xs font-bold uppercase tracking-wide text-neutral-400">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function RadioRow({ label, selected, indic, onClick }: { label: string; selected: boolean; indic?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition-colors",
        selected ? "border-primary-500 bg-primary-50 text-primary-700" : "border-line bg-white text-neutral-700 hover:bg-neutral-50",
      )}
      aria-pressed={selected}
    >
      <span className={cn("min-w-0 flex-1 truncate", indic && "font-indic")}>{label}</span>
      <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full border-2", selected ? "border-primary-500 bg-primary-500" : "border-line-strong")}>
        {selected && <Check size={12} className="text-white" />}
      </span>
    </button>
  );
}
