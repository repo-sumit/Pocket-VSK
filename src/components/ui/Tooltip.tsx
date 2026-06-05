import { cn } from "@/lib/cn";
import { Info } from "./Icon";

/** Hover/focus tooltip (no dep) — also exposes the text as an accessible label. */
export function InfoTooltip({ text, className, size = 13 }: { text: string; className?: string; size?: number }) {
  return (
    <span className={cn("group relative inline-flex align-middle", className)}>
      <button type="button" aria-label={text} className="text-neutral-400 hover:text-neutral-600">
        <Info size={size} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1.5 hidden w-[min(14rem,calc(100vw-1.5rem))] -translate-x-1/2 rounded-lg bg-neutral-900 px-3 py-2 text-2xs font-medium leading-snug text-white shadow-raised group-hover:block group-focus-within:block"
      >
        {text}
      </span>
    </span>
  );
}
