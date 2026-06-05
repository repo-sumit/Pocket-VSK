import { useSession } from "@/store/session";
import { cn } from "@/lib/cn";

/** En ⇄ ગુ toggle. Sets <html lang> so Indic typography kicks in. */
export function LanguageToggle({ className }: { className?: string }) {
  const lang = useSession((s) => s.lang);
  const toggle = useSession((s) => s.toggleLang);
  return (
    <button
      onClick={toggle}
      className={cn("inline-flex items-center rounded-full bg-neutral-100 p-0.5 text-xs font-semibold", className)}
      aria-label="Toggle language"
    >
      <span className={cn("rounded-full px-2.5 py-1 transition-colors", lang === "en" ? "bg-white text-primary-600 shadow-sm" : "text-neutral-500")}>EN</span>
      <span className={cn("rounded-full px-2.5 py-1 font-indic transition-colors", lang === "gu" ? "bg-white text-primary-600 shadow-sm" : "text-neutral-500")}>ગુ</span>
    </button>
  );
}
