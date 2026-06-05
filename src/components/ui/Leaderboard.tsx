import { cn } from "@/lib/cn";
import type { LeaderboardEntry } from "@/types";
import { rag } from "@/lib/colors";
import { pct, locNum } from "@/lib/format";
import type { Lang } from "@/i18n";
import { RatingBadge } from "./RatingBadge";
import { DeltaPill } from "./atoms";
import { ArrowUpRight, ArrowDownRight, Minus, Medal } from "./Icon";

/** Ranked leaderboard rows with rank-movement (▲▼) and weekly Δ. */
export function Leaderboard({
  entries, lang = "en", onRowClick, youLabel = "You",
}: { entries: LeaderboardEntry[]; lang?: Lang; onRowClick?: (id: string) => void; youLabel?: string }) {
  return (
    <ol className="flex flex-col gap-1.5">
      {entries.map((e) => {
        // read-only when no click handler (peer/benchmark rows): no button, no hover
        const RowTag = onRowClick ? "button" : "div";
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
            <RankBadge rank={e.rank} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-neutral-900">
                  {lang === "gu" && e.entity.name_gu ? e.entity.name_gu : e.entity.name}
                </span>
                {e.isCurrent && <span className="chip bg-primary-100 text-primary-700 !py-0.5">{youLabel}</span>}
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className={cn("text-xs font-bold tnum", rag(e.status).text)}>{pct(e.percent, lang)}</span>
                <DeltaPill delta={e.deltaWoW} unit="%" direction="higher" lang={lang} className="!py-0.5 !text-2xs" />
              </div>
            </div>
            <Movement delta={e.rankDelta} lang={lang} />
            {e.grade ? <RatingBadge grade={e.grade} size="sm" celebrate={false} /> : <span className="chip bg-rag-naSoft text-rag-naText !py-0.5">NA</span>}
          </RowTag>
        </li>
        );
      })}
    </ol>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const medal = rank <= 3;
  const colors = ["text-amber-500", "text-neutral-400", "text-orange-400"];
  return (
    <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold tnum", medal ? "bg-neutral-50" : "bg-neutral-50 text-neutral-500")}>
      {medal ? <Medal size={18} className={colors[rank - 1]} /> : rank}
    </span>
  );
}

function Movement({ delta, lang }: { delta: number | null; lang: Lang }) {
  if (delta == null) return <span className="w-9" />;
  if (delta === 0) return <span className="flex w-9 items-center justify-center text-neutral-300"><Minus size={14} /></span>;
  const up = delta > 0;
  return (
    <span className={cn("flex w-9 items-center justify-center gap-0.5 text-xs font-bold", up ? "text-rag-greenText" : "text-rag-redText")}>
      {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {locNum(Math.abs(delta), lang)}
    </span>
  );
}
