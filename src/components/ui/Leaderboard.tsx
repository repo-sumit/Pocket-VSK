import { cn } from "@/lib/cn";
import type { LeaderboardEntry } from "@/types";
import { rag } from "@/lib/colors";
import { pct, locNum } from "@/lib/format";
import { useT, type Lang } from "@/i18n";
import { RatingBadge } from "./RatingBadge";

/**
 * Peer list — performance BANDS (A+/A/B…) + delta vs the peer-group average,
 * NOT integer ranks (avoids toxic competition / gaming, per the 4A plan).
 * Ordered by score but without a #1/#2 medal. `avg` = the peer-group mean for
 * the per-row "vs avg" delta. Read-only (no onRowClick) for out-of-subtree peers.
 */
export function Leaderboard({
  entries, lang = "en", onRowClick, youLabel = "You", avg = null,
}: { entries: LeaderboardEntry[]; lang?: Lang; onRowClick?: (id: string) => void; youLabel?: string; avg?: number | null }) {
  const { t } = useT();
  return (
    <ol className="flex flex-col gap-1.5">
      {entries.map((e) => {
        const RowTag = onRowClick ? "button" : "div";
        const dAvg = avg != null && e.percent != null ? Math.round((e.percent - avg) * 10) / 10 : null;
        return (
          <li key={e.entity.id}>
            <RowTag
              onClick={onRowClick ? () => onRowClick(e.entity.id) : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                e.isCurrent ? "border-primary-300 bg-primary-50/70" : "border-line/70 bg-white",
                onRowClick && !e.isCurrent && "hover:bg-neutral-50",
              )}
            >
              {e.grade ? (
                <RatingBadge grade={e.grade} size="md" celebrate={false} />
              ) : (
                <span className="chip bg-rag-naSoft text-rag-naText !py-0.5">{t("common.na")}</span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-neutral-900">
                    {lang === "gu" && e.entity.name_gu ? e.entity.name_gu : e.entity.name}
                  </span>
                  {e.isCurrent && <span className="chip bg-primary-100 text-primary-700 !py-0.5">{youLabel}</span>}
                </div>
                <span className={cn("text-xs font-bold tnum", rag(e.status).text)}>{pct(e.percent, lang)}</span>
              </div>
              {dAvg != null && (
                <span className={cn("shrink-0 text-2xs font-semibold tnum", dAvg >= 0 ? "text-rag-greenText" : "text-rag-redText")}>
                  {dAvg >= 0 ? "+" : ""}{locNum(dAvg, lang)} {t("common.vsBenchmark")}
                </span>
              )}
            </RowTag>
          </li>
        );
      })}
    </ol>
  );
}
