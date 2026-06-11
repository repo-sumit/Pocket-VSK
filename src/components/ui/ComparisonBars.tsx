import { cn } from "@/lib/cn";
import type { RagStatus, Unit } from "@/types";
import { rag } from "@/lib/colors";
import { formatValue, formatValueFull } from "@/lib/format";
import { useT, type Lang } from "@/i18n";
import { ChevronRight } from "./Icon";

export interface ChildBar {
  id: string;
  label: string;
  value: number | null;
  status: RagStatus;
}

/** Tidy long unit names for the 2-line bar label: "Grade 5" → "G5", drop the
 *  "Pri. Sch."/"Primary School" suffix so the place name can wrap to two lines
 *  ("Narayan Sarovar") instead of being cropped ("Naray…"). */
function abbrev(label: string): string {
  return label
    .replace(/^Grade\s+/, "G")
    .replace(/^Section\s+/, "Sec ")
    .replace(/\s+Pri\.\s*Sch\.$/, "")
    .replace(/\s+Primary School$/, "")
    .trim();
}

/**
 * Embedded comparison bars — the design's per-card chart. Compact vertical bars,
 * one per selected child unit, worst-first (lower-is-better metrics put the
 * highest/worst first), value label above, abbreviated unit label below, RAG
 * fill. Spacing is responsive to the bar count: a few bars spread evenly across
 * the full chart width (no blank right side); many bars (9+) use a fixed gap and
 * scroll horizontally inside the card (the page never scrolls sideways) with a
 * "scroll ›" hint. Tapping a bar drills into that unit. Unit-consistent.
 */
export function ChildComparisonBars({
  title, bars, unit = "%", lang = "en", height = 88, lowerBetter = false, maxValue, onOpen, noSort = false,
}: {
  title?: string;
  bars: ChildBar[];
  unit?: Unit;
  lang?: Lang;
  height?: number;
  lowerBetter?: boolean;
  maxValue?: number;
  onOpen?: (id: string) => void;
  /** keep the given bar order (e.g. School · District · State) instead of worst-first. */
  noSort?: boolean;
}) {
  const { t } = useT();
  const valued = bars.filter((b) => b.value != null);
  const sorted = noSort
    ? valued
    : [...valued].sort((a, b) =>
        lowerBetter ? (b.value as number) - (a.value as number) : (a.value as number) - (b.value as number),
      );
  const top = maxValue ?? Math.max(...sorted.map((b) => b.value as number), 1);
  // Responsive spacing by bar count: 1–4 spread across the width · 5–8 balanced ·
  // 9+ fixed gap + horizontal scroll (only the strip scrolls, never the page).
  const count = sorted.length;
  const shouldScroll = count > 8;
  const justifyClass = count <= 1 ? "justify-center" : count <= 4 ? "justify-between" : "justify-around";
  const summary = sorted.map((b) => `${b.label} ${formatValue(b.value, unit, lang)}`).join(", ");
  // narrow colored bar (≈24px) inside a wider item cell that fits a 2-line label
  const BAR_W = 24;
  const ITEM_W = 54;

  return (
    <div className="mt-3">
      {(title || shouldScroll) && (
        <div className="mb-2 flex items-center justify-between gap-2">
          {title ? <span className="section-title !mb-0">{title}</span> : <span />}
          {shouldScroll && (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-2xs font-semibold text-neutral-400">
              {t("common.scroll")}<ChevronRight size={11} />
            </span>
          )}
        </div>
      )}
      <div
        className={cn("flex items-end overflow-x-auto pb-1.5", shouldScroll ? "gap-5" : cn(justifyClass, "gap-2"))}
        role="img"
        aria-label={summary}
      >
        {sorted.map((b) => {
          const v = b.value as number;
          const h = Math.max(6, (v / top) * height);
          const c = rag(b.status);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onOpen?.(b.id)}
              title={`${b.label} · ${formatValueFull(v, unit, lang)}`}
              className="flex shrink-0 flex-col items-center gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              style={{ width: ITEM_W, cursor: onOpen ? "pointer" : "default" }}
            >
              <span className={cn("text-2xs font-bold tnum leading-none", c.text)}>{formatValue(v, unit, lang)}</span>
              <span className="flex w-full items-end justify-center" style={{ height }}>
                <span className={cn("origin-bottom animate-bar-grow", c.bg)} style={{ width: BAR_W, height: h, borderRadius: "5px 5px 2px 2px" }} />
              </span>
              {/* up to 2 lines, then ellipsis — "Narayan Sarovar" wraps instead of "Naray…" */}
              <span className="line-clamp-2 block w-full break-words text-center text-2xs font-semibold leading-tight text-neutral-400" title={b.label}>
                {abbrev(b.label)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
