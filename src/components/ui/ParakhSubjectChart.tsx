import { cn } from "@/lib/cn";
import { locNum } from "@/lib/format";
import { type Lang } from "@/i18n";
import type { ParakhSubjectScore } from "@/config/parakh";
import { BAR_W, BAR_TRACK_H, BAR_RADIUS } from "./ComparisonBars";

/** neutral grey for the State bar (tailwind line.strong) — never a category colour. */
const STATE_HEX = "#C9CFDB";
/** px gap between the District/State pair (also used to align the two value labels). */
const PAIR_GAP = 8;
/** item cell = two Compare-width bars + the pair gap + room for the 2-line subject label. */
const ITEM_W = BAR_W * 2 + PAIR_GAP + 24;

/**
 * PARAKH subject-wise grouped vertical bar chart (§5). Two bars per subject — District
 * (in the grade's category colour) and State (neutral grey) — using the SAME bar sizing
 * as the Compare charts (BAR_W / BAR_TRACK_H / BAR_RADIUS from ComparisonBars) so the bars
 * read at the same visual weight. Value labels above (fixed height), 2-line subject label
 * below (e.g. "The World Around Us"), all bars on one bottom baseline. Spreads across the
 * width for ≤4 subjects; scrolls horizontally only if needed (the page never overflows).
 */
export function ParakhSubjectChart({
  subjects, categoryColor, lang = "en", maxValue = 100,
}: {
  subjects: ParakhSubjectScore[];
  categoryColor: string;
  lang?: Lang;
  maxValue?: number;
}) {
  const top = Math.max(maxValue, ...subjects.flatMap((s) => [s.district, s.state]), 1);
  const justifyClass = subjects.length <= 1 ? "justify-center" : "justify-around";
  const summary = subjects.map((s) => `${s.subject} District ${s.district}% State ${s.state}%`).join(", ");
  return (
    <div
      className={cn("mt-2 flex items-start gap-3 overflow-x-auto pb-1.5", subjects.length > 4 ? "gap-5" : justifyClass)}
      role="img"
      aria-label={summary}
    >
      {subjects.map((s) => (
        <div key={s.subject} className="flex shrink-0 flex-col items-center gap-1" style={{ width: ITEM_W }}>
          {/* value labels — single line, fixed height, one centred above each bar */}
          <div className="flex items-end justify-center" style={{ gap: PAIR_GAP }}>
            <ValueLabel value={s.district} lang={lang} />
            <ValueLabel value={s.state} lang={lang} />
          </div>
          {/* bar track — fixed height; both fills bottom-aligned to the shared baseline */}
          <div className="flex items-end justify-center" style={{ height: BAR_TRACK_H, gap: PAIR_GAP }}>
            <Bar value={s.district} top={top} color={categoryColor} />
            <Bar value={s.state} top={top} color={STATE_HEX} />
          </div>
          {/* subject label — below the baseline, up to 2 lines (reserved), never moves bars */}
          <span
            className="line-clamp-2 block min-h-[2.4em] w-full break-words text-center text-2xs font-semibold leading-tight text-neutral-400"
            title={s.subject}
          >
            {s.subject}
          </span>
        </div>
      ))}
    </div>
  );
}

function ValueLabel({ value, lang }: { value: number; lang: Lang }) {
  return (
    <span className="h-3.5 text-center text-2xs font-bold tnum leading-none text-neutral-500" style={{ width: BAR_W }}>
      {locNum(value, lang)}%
    </span>
  );
}

function Bar({ value, top, color }: { value: number; top: number; color: string }) {
  const h = Math.max(6, (value / top) * BAR_TRACK_H);
  return <span className="origin-bottom animate-bar-grow" style={{ width: BAR_W, height: h, borderRadius: BAR_RADIUS, background: color }} />;
}
