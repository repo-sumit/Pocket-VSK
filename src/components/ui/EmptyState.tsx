import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The single, canonical empty / NA surface — never a blank or broken card.
 * `tone="na"` is the dashed muted tile used for "not tracked / not applicable at
 * this level"; `tone="plain"` is a quiet centred message for empty lists/sections.
 */
export function EmptyState({
  label, hint, icon, tone = "na", className,
}: {
  label: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "na" | "plain";
  className?: string;
}) {
  if (tone === "plain") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-1 px-4 py-8 text-center", className)}>
        {icon && <span className="text-neutral-300">{icon}</span>}
        <span className="text-sm font-semibold text-neutral-500">{label}</span>
        {hint && <span className="text-2xs text-neutral-400">{hint}</span>}
      </div>
    );
  }
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-rag-naSoft/60 px-4 py-3 text-center", className)}>
      {icon && <span className="mb-0.5 text-rag-naText">{icon}</span>}
      <span className="text-sm font-bold tracking-wide text-rag-naText">{label}</span>
      {hint && <span className="mt-0.5 text-2xs text-neutral-400">{hint}</span>}
    </div>
  );
}
