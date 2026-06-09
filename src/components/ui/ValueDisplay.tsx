import { cn } from "@/lib/cn";
import type { Direction, RagStatus, Unit } from "@/types";
import { deltaToneClass, valueToneClass } from "@/lib/colors";
import { formatDelta, formatValue } from "@/lib/format";
import type { Lang } from "@/i18n";

const SIZE: Record<string, string> = {
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

/**
 * The single, canonical big-number value treatment. Colour follows the colour
 * discipline (one place): a rate/level value is tinted by RAG status (good → green,
 * watch → neutral, at-risk → red, NA → muted); a change-delta value (`isDelta`) is
 * tinted direction-aware and shown signed. Used by every metric card + detail view
 * so the value reads the same everywhere.
 */
export function ValueDisplay({
  value, unit, status, direction = "higher", isDelta = false, lang = "en", size = "lg", naLabel = "NA", className,
}: {
  value: number | null;
  unit: Unit;
  status: RagStatus;
  direction?: Direction;
  isDelta?: boolean;
  lang?: Lang;
  size?: "md" | "lg" | "xl";
  naLabel?: string;
  className?: string;
}) {
  const na = value == null;
  const tone = na ? "text-rag-naText" : isDelta ? deltaToneClass(value, direction) : valueToneClass(status);
  const text = na ? naLabel : isDelta ? formatDelta(value, unit, lang) : formatValue(value, unit, lang);
  return <span className={cn(SIZE[size], "font-extrabold tnum", tone, className)}>{text}</span>;
}
