import { locNum } from "@/lib/format";
import { type Lang } from "@/i18n";
import type { ParakhSubjectScore } from "@/config/parakh";

/** neutral grey for the State bar (tailwind line.strong) — never a category colour. */
const STATE_HEX = "#C9CFDB";

/**
 * PARAKH subject-wise grouped vertical bar chart (§5). Two bars per subject — District
 * (in the grade's category colour) and State (neutral grey) — baseline-aligned, value
 * labels above, 2-line subject label below (e.g. "The World Around Us"). Mirrors the
 * ChildComparisonBars track/fill primitives (animate-bar-grow, fixed-height track) so it
 * reads as the same design system. The strip scrolls horizontally on mobile; the page
 * never overflows. PARAKH is a 3-year cycle, so there is no yearly trend line here.
 */
export function ParakhSubjectChart({
  subjects, categoryColor, lang = "en", maxValue = 100, height = 96,
}: {
  subjects: ParakhSubjectScore[];
  categoryColor: string;
  lang?: Lang;
  maxValue?: number;
  height?: number;
}) {
  const top = Math.max(maxValue, ...subjects.flatMap((s) => [s.district, s.state]), 1);
  return (
    <div className="mt-1 flex items-start gap-5 overflow-x-auto pb-1.5">
      {subjects.map((s) => (
        <div key={s.subject} className="flex w-[76px] shrink-0 flex-col items-center gap-1">
          <div className="flex w-full items-end justify-center gap-2.5">
            <Bar value={s.district} top={top} color={categoryColor} chartH={height} lang={lang} />
            <Bar value={s.state} top={top} color={STATE_HEX} chartH={height} lang={lang} />
          </div>
          <span
            className="line-clamp-2 block min-h-[2.4em] w-full break-words text-center text-2xs font-semibold leading-tight text-neutral-500"
            title={s.subject}
          >
            {s.subject}
          </span>
        </div>
      ))}
    </div>
  );
}

/** One bar — value label above, fill bottom-aligned to the shared baseline. */
function Bar({ value, top, color, chartH, lang }: { value: number; top: number; color: string; chartH: number; lang: Lang }) {
  const h = Math.max(6, (value / top) * (chartH - 16));
  return (
    <span className="flex flex-col items-center justify-end" style={{ height: chartH }}>
      <span className="mb-0.5 text-2xs font-bold tnum leading-none text-neutral-500">{locNum(value, lang)}%</span>
      <span className="origin-bottom animate-bar-grow" style={{ width: 18, height: h, borderRadius: "5px 5px 2px 2px", background: color }} />
    </span>
  );
}
