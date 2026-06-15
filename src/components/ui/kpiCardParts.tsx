import type { ReactNode } from "react";
import type { Frequency } from "@/types";
import { cn } from "@/lib/cn";
import { Card } from "./atoms";
import { FrequencyBadge } from "./DataBadges";
import { ChevronRight } from "./Icon";

/**
 * Right-side navigation chevron — the card's ONLY tap affordance (latest design).
 * No "Know more" text: a clean circular chevron sits top-right; the whole card is
 * tappable. Never paired with a text CTA.
 */
export function CardChevron({ className }: { className?: string }) {
  return (
    <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-sunken text-neutral-400 transition-transform group-hover:translate-x-0.5", className)}>
      <ChevronRight size={16} />
    </span>
  );
}

/**
 * Shared KPI-card layout pieces — a strict row grammar (header · meta · metrics ·
 * footer), graph-free and compact (trend charts live only on the KPI detail page).
 * Single- and multi-metric cards use the same shell, header and metric row so they
 * read as one component and align across the grid. No source line on cards.
 */

/**
 * Outer shell — content-aware card with a clickable summary region (drills to the
 * KPI detail) and an optional `compare` slot rendered as a sibling. The summary is
 * a <button>; the compare slot has its own buttons (metric chips, bars), so it
 * must live OUTSIDE the summary button — never nest interactive controls.
 *
 * Height tiers by metric count (`metrics`): 1 → compact · 2 → medium · 3+ → tall.
 * No `h-full` — paired with the grid's `items-start`, a single-metric card stays
 * short instead of stretching to a neighbouring 2/3-metric card's height.
 */
export function KpiCardShell({ onClick, children, compare, metrics = 1 }: { onClick?: () => void; children: ReactNode; compare?: ReactNode; metrics?: number }) {
  const minH = metrics >= 3 ? "min-h-[14rem]" : metrics === 2 ? "min-h-[12rem]" : "min-h-[9rem]";
  return (
    <Card className={cn("card-pad flex w-full flex-col transition-shadow hover:shadow-raised", minH)}>
      {onClick ? (
        <button onClick={onClick} className="group flex flex-1 flex-col text-left">
          {children}
        </button>
      ) : (
        <div className="flex flex-1 flex-col">{children}</div>
      )}
      {compare}
    </Card>
  );
}

/**
 * Header (title + right-side chevron) and the meta row (frequency · last-updated)
 * in one block. The chevron is the card's only navigation affordance (latest
 * design — no "Know more" text) and only shows when the card is clickable.
 * The meta period label already encodes any schedule month (e.g. "Sep 2025"), so the
 * raw `scheduleNote` is never appended again — that was the "Sep 2025 September" dup.
 */
export function KpiCardHeader({ title, frequency, context, chevron = false }: { title: string; frequency?: Frequency; context?: string | null; chevron?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <span className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-neutral-900" title={title}>{title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          <FrequencyBadge frequency={frequency} />
          {context && <span className="text-2xs font-medium text-neutral-400">· {context}</span>}
        </span>
      </div>
      {chevron && <CardChevron className="mt-0.5" />}
    </div>
  );
}

/**
 * One inline KPI row — the unified grammar shared by single- and multi-metric
 * cards: the value (big, bold) with its metric/suffix inline immediately after it
 * ("4.7K students absent", "88.2% Present"), and the N+1 peer comparison
 * right-aligned. `descriptor` (single-metric) uses a larger value and pins the
 * comparison to the row's end; metric rows sit on one baseline with a thin
 * divider between them. An empty `label` renders just the bare value (no trailing
 * margin, no empty span) — percent/score single cards read "96.3%" alone. The
 * inline label replaces the old uppercase label-above-value pattern. No "Parent
 * avg", no source line.
 */
export function KpiInlineRow({
  value, label, descriptor = false, valueTone, peerLabel, delta, divider,
}: {
  value: string;
  label: string;
  descriptor?: boolean;
  valueTone?: string;
  peerLabel?: string | null;
  delta?: ReactNode;
  divider?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-start gap-1.5 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3", divider && "border-t border-line/60")}>
      <span className="w-full min-w-0 flex-1 break-words leading-snug">
        <b className={cn("align-[-1px] font-extrabold tnum", label && "mr-1.5", descriptor ? "text-3xl" : "text-xl", valueTone ?? "text-neutral-900")}>{value}</b>
        {label && <span className={cn("text-neutral-500", descriptor ? "text-[15px] font-medium" : "text-sm font-semibold")}>{label}</span>}
      </span>
      {(peerLabel || delta) && (
        <span className={cn("flex shrink-0 flex-wrap items-center gap-2 text-left sm:flex-nowrap sm:whitespace-nowrap sm:text-right", descriptor && "sm:self-end")}>
          {/* N+1 comparison as a bolder, higher-contrast pill (§11) */}
          {peerLabel && <span className="inline-flex items-center rounded-full bg-surface-sunken px-2 py-0.5 text-2xs font-bold tnum text-neutral-700">{peerLabel}</span>}
          {delta}
        </span>
      )}
    </div>
  );
}

