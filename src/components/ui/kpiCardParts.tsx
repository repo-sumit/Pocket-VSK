import type { ReactNode } from "react";
import type { Frequency } from "@/types";
import { cn } from "@/lib/cn";
import { Card } from "./atoms";
import { FrequencyBadge } from "./DataBadges";
import { ChevronRight } from "./Icon";

/**
 * Shared KPI-card layout pieces — a strict row grammar (header · meta · metrics ·
 * footer), graph-free and compact (trend charts live only on the KPI detail page).
 * Single- and multi-metric cards use the same shell, header, metric row and source
 * line so they read as one component and align across the grid.
 */

/** Outer shell — compact height, bottom-anchored footer. */
export function KpiCardShell({ onClick, children }: { onClick?: () => void; children: ReactNode }) {
  return (
    <Card
      as="button"
      onClick={onClick}
      className="group card-pad flex h-full min-h-[13rem] w-full flex-col text-left transition-shadow hover:shadow-raised"
    >
      {children}
    </Card>
  );
}

/**
 * Header (title + chevron) and the meta row (frequency · last-updated) in one block.
 * The meta period label already encodes any schedule month (e.g. "Sep 2025"), so the
 * raw `scheduleNote` is never appended again — that was the "Sep 2025 September" dup.
 */
export function KpiCardHeader({ title, frequency, context }: { title: string; frequency?: Frequency; context?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <span className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-neutral-900" title={title}>{title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          <FrequencyBadge frequency={frequency} />
          {context && <span className="text-2xs font-medium text-neutral-400">· {context}</span>}
        </span>
      </div>
      <ChevronRight size={16} className="mt-0.5 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
    </div>
  );
}

/**
 * One compact metric row with three aligned columns: value · parent N+1 · delta.
 * Used for every row of a multi-metric card so they line up; the label sits above.
 */
export function KpiMetricRow({
  label, value, valueTone, parentLabel, delta,
}: { label: string; value: string; valueTone?: string; parentLabel?: string | null; delta?: ReactNode }) {
  return (
    <div className="py-2 first:pt-1 last:pb-0">
      <span className="block text-2xs font-semibold uppercase tracking-wide text-neutral-400">{label}</span>
      <div className="mt-0.5 grid grid-cols-3 items-baseline gap-x-2">
        <span className={cn("truncate text-xl font-extrabold tnum leading-none", valueTone)}>{value}</span>
        <span className="truncate text-2xs text-neutral-400">{parentLabel}</span>
        <span className="justify-self-end">{delta}</span>
      </div>
    </div>
  );
}

/** Stacked label + value context block (e.g. Parent avg, Source) for single-metric cards. */
export function KpiContextTile({ label, value, valueTitle, className }: { label: string; value: ReactNode; valueTitle?: string; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <span className="block text-2xs font-semibold uppercase tracking-wide text-neutral-400">{label}</span>
      <span className="mt-0.5 block truncate text-xs font-semibold text-neutral-600" title={valueTitle}>{value}</span>
    </div>
  );
}

/** Muted single-line source footer (one line, not a metric tile). */
export function KpiSourceLine({ label, source }: { label: string; source: string }) {
  return (
    <p className="mt-auto truncate pt-2 text-2xs text-neutral-400" title={source}>
      <span className="font-semibold uppercase tracking-wide">{label}</span> · {source}
    </p>
  );
}
