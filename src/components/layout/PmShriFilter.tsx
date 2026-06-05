import { useSession, type PmShriMode } from "@/store/session";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Select } from "@/components/ui/Select";
import { Sparkles } from "../ui/Icon";

/**
 * Global PM SHRI institutional filter (FCR-1.3) — All / PM SHRI / Non-PM SHRI.
 * Acts as an administrative toggle and an aspirational tracker for
 * non-qualifying campuses; scopes the aggregate rollups. Uses the shared
 * design-system Select, with an amber "tracker active" treatment.
 */
export function PmShriFilter({ className }: { className?: string }) {
  const pmShri = useSession((s) => s.pmShri);
  const setPmShri = useSession((s) => s.setPmShri);
  const { t } = useT();
  const active = pmShri !== "all";

  return (
    <Select
      value={pmShri}
      onChange={(v) => setPmShri(v as PmShriMode)}
      options={[
        { value: "all", label: t("pmShri.all") },
        { value: "pmshri", label: t("pmShri.pmshri") },
        { value: "non", label: t("pmShri.non") },
      ]}
      ariaLabel={t("pmShri.label")}
      searchable={false}
      align="right"
      className={className}
      leadingIcon={<Sparkles size={14} className={active ? "text-amber-500" : "text-neutral-400"} />}
      triggerClassName={cn(active && "!bg-amber-50 ring-1 ring-amber-200")}
    />
  );
}
