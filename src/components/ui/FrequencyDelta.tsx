import { cn } from "@/lib/cn";
import type { Direction, Unit } from "@/types";
import { deltaIsGood, deltaToneClass } from "@/lib/colors";
import { compactNum, formatDelta, locNum } from "@/lib/format";
import { periodLabelKey, type Cadence } from "@/lib/trend";
import { useT, type Lang } from "@/i18n";
import { ArrowDownRight, ArrowUpRight, Minus } from "./Icon";

/**
 * The single, canonical delta treatment used on every card and detail view.
 *
 *  • Direction-aware colour: a delta is GOOD (green) when it moves the right way
 *    for the indicator (`direction`), BAD (red) otherwise — never coloured by the
 *    raw sign. So chronic-absentees falling, or dropout-reduction rising, read green.
 *  • Frequency-correct wording driven by the trend cadence:
 *    Daily → "today" · Monthly → "this month" · Twice a Year → "this cycle" ·
 *    Half yearly → "this half-year" · Yearly → "this year".
 *  • `variant="inline"` — compact coloured text (cards). `variant="pill"` — soft
 *    chip (detail header). Both share identical logic, so a change here propagates
 *    everywhere.
 */
export function FrequencyDelta({
  delta, unit, direction, cadence, lang = "en", variant = "inline", showPeriod = true, className,
}: {
  delta: number | null;
  unit: Unit;
  direction: Direction;
  cadence: Cadence;
  lang?: Lang;
  variant?: "inline" | "pill";
  showPeriod?: boolean;
  className?: string;
}) {
  const { t } = useT();
  const period = showPeriod ? t(periodLabelKey(cadence)) : "";

  // flat / no movement
  if (delta == null || delta === 0) {
    if (variant === "pill") {
      return (
        <span className={cn("chip bg-neutral-50 text-neutral-400", className)}>
          <Minus size={13} /> {period ? `±0 ${period}` : "±0"}
        </span>
      );
    }
    return (
      <span className={cn("inline-flex items-center gap-0.5 text-2xs font-bold text-neutral-400", className)}>
        <Minus size={12} /> ±0{period && <span className="ml-0.5 font-semibold text-neutral-400">{period}</span>}
      </span>
    );
  }

  const Arrow = delta > 0 ? ArrowUpRight : ArrowDownRight;
  const mag = unit === "count" ? compactNum(Math.abs(delta), lang) : locNum(Math.round(Math.abs(delta) * 10) / 10, lang);

  if (variant === "pill") {
    const tone = deltaIsGood(delta, direction) ? "bg-rag-greenSoft text-rag-greenText" : "bg-rag-redSoft text-rag-redText";
    return (
      <span className={cn("chip", tone, className)}>
        <Arrow size={13} /> {formatDelta(delta, unit, lang)}{period && ` ${period}`}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-0.5 text-2xs font-bold", deltaToneClass(delta, direction), className)}>
      <Arrow size={12} />
      {mag}
      {period && <span className="ml-0.5 font-semibold text-neutral-400">{period}</span>}
    </span>
  );
}
