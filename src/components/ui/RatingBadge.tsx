import { cn } from "@/lib/cn";
import { GRADE_GROUP, gradeGroupOf } from "@/lib/colors";
import { Sparkles } from "./Icon";

/** Letter-grade badge (A++++ → D) with celebratory styling for high grades. */
export function RatingBadge({
  grade, size = "md", celebrate = true, className,
}: { grade: string; size?: "sm" | "md" | "lg" | "xl"; celebrate?: boolean; className?: string }) {
  const group = gradeGroupOf(grade);
  const g = GRADE_GROUP[group];
  const sizes = {
    sm: "h-7 min-w-7 px-2 text-sm",
    md: "h-10 min-w-10 px-3 text-lg",
    lg: "h-14 min-w-14 px-4 text-2xl",
    xl: "h-20 min-w-20 px-5 text-4xl",
  } as const;
  const showSparkle = celebrate && group === "A" && (size === "lg" || size === "xl");
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded-2xl font-extrabold tabular-nums tnum",
        group === "A" ? `bg-gradient-to-br ${g.glow} text-white shadow-raised` : cn(g.chip),
        sizes[size],
        className,
      )}
      aria-label={`Grade ${grade}`}
    >
      {grade}
      {showSparkle && <Sparkles size={size === "xl" ? 18 : 14} className="absolute -right-1.5 -top-1.5 text-amber-300 drop-shadow" />}
    </span>
  );
}
