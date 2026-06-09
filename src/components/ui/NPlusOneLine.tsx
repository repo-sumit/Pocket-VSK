import { cn } from "@/lib/cn";
import type { Unit } from "@/types";
import { formatDelta, formatValue } from "@/lib/format";
import type { Lang } from "@/i18n";

/**
 * The single, canonical N+1 (next-level-up) comparison line, shown identically on
 * every card and detail view:  `{parent entity name} · {parent score}`  — e.g.
 * "Lakhapat · 91%", "Kachchh · +14%", "Gujarat · 73". No "ahead/behind %" copy.
 *
 * Renders nothing when there is no parent (State level) or no published figure, so
 * callers can drop it in unconditionally. `signed` formats change-deltas with a
 * sign (matching how that KPI's own value is shown).
 */
export function NPlusOneLine({
  parentName, value, unit, lang = "en", signed = false, className,
}: {
  parentName?: string;
  value: number | null;
  unit: Unit;
  lang?: Lang;
  signed?: boolean;
  className?: string;
}) {
  if (!parentName || value == null) return null;
  const str = signed ? formatDelta(value, unit, lang) : formatValue(value, unit, lang);
  return <span className={cn("block truncate text-2xs text-neutral-400", className)}>{parentName} · {str}</span>;
}
