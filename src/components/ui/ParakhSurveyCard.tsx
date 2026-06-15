import { cn } from "@/lib/cn";
import { useT } from "@/i18n";
import { PARAKH_RESULTS, PARAKH_PERCENTILE, PARAKH_BANDS } from "@/config/parakh";
import { Card } from "./atoms";
import { CardChevron } from "./kpiCardParts";
import { Clock } from "./Icon";

/**
 * PARAKH compact card on the Assessment domain page — district only (§3/§6). Shows the
 * three grade summaries (Grade 3/6/9) as a percentile band + category in the category
 * colour. NO expandable subject rows / dropdowns here — tapping the whole card opens the
 * Parakh KPI detail page (subject-wise grouped bar charts). Static survey, no delta.
 */
export function ParakhSurveyCard({ onOpen }: { onOpen: () => void }) {
  const { t } = useT();
  return (
    <Card className="card-pad">
      <button onClick={onOpen} className="group flex w-full flex-col text-left">
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="block text-sm font-bold text-neutral-900">PARAKH</span>
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-2xs font-semibold text-neutral-400">
              <Clock size={11} /> {t("common.sample")} · 2024
            </span>
          </span>
          <CardChevron className="mt-0.5" />
        </div>
        <div className="mt-2">
          {PARAKH_RESULTS.map((g, i) => {
            const b = PARAKH_BANDS[g.category];
            return (
              <div key={g.grade} className={cn("flex items-center justify-between gap-2 py-2.5", i && "border-t border-line/60")}>
                <span className="text-sm font-bold text-neutral-900">{g.grade}</span>
                <span
                  className="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-2xs font-bold"
                  style={{ background: b.soft, color: b.text }}
                >
                  {PARAKH_PERCENTILE[g.category]} · {g.category}
                </span>
              </div>
            );
          })}
        </div>
      </button>
    </Card>
  );
}
