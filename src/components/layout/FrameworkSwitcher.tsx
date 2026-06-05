import { useSession } from "@/store/session";
import { FRAMEWORKS } from "@/config";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { LayoutGrid } from "../ui/Icon";

/**
 * Switching the framework re-renders the WHOLE dashboard from config rows —
 * the live proof that the engine is KPI-agnostic (GSQAC ↔ SQAF ↔ 6A).
 */
export function FrameworkSwitcher({ className }: { className?: string }) {
  const frameworkId = useSession((s) => s.frameworkId);
  const setFramework = useSession((s) => s.setFramework);
  const resetScope = useSession((s) => s.resetScope);
  const { t, tn } = useT();

  return (
    <label className={cn("inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1.5", className)} title={t("framework.switch")}>
      <LayoutGrid size={14} className="text-neutral-400" />
      <span className="sr-only">{t("framework.label")}</span>
      <select
        value={frameworkId}
        onChange={(e) => {
          setFramework(e.target.value);
          resetScope();
        }}
        className="cursor-pointer bg-transparent text-xs font-semibold text-neutral-700 outline-none"
      >
        {Object.values(FRAMEWORKS).map((f) => (
          <option key={f.id} value={f.id}>
            {tn(f.name, f.name_gu)}
          </option>
        ))}
      </select>
    </label>
  );
}
