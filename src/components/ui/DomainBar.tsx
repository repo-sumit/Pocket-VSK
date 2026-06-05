import { cn } from "@/lib/cn";
import type { DomainScore } from "@/types";
import { rag, accent } from "@/lib/colors";
import { pct, locNum } from "@/lib/format";
import type { Lang } from "@/i18n";
import { Icon, ChevronRight } from "./Icon";
import { EmptyNA } from "./atoms";

/**
 * One domain row for the scorecard home: icon + name, your % bar (RAG
 * coloured) with the parent-average marked as a tick, and the gap delta.
 * The "you vs the level above" comparison the brief asks for.
 */
export function DomainBar({
  ds, parentPercent, parentLabel, name, onClick, lang = "en",
}: {
  ds: DomainScore;
  parentPercent?: number | null;
  parentLabel?: string;
  name: string;
  onClick?: () => void;
  lang?: Lang;
}) {
  const a = accent(ds.domain.accent);
  const value = ds.percent;
  const status = ds.status;

  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-neutral-50"
    >
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", a.bg)}>
        <Icon name={ds.domain.icon} className={a.icon} size={20} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-neutral-900">{name}</span>
          {value == null ? (
            <span className="text-xs font-bold text-rag-naText">{lang === "gu" ? "લાગુ નથી" : "NA"}</span>
          ) : (
            <span className={cn("text-sm font-extrabold tnum", rag(status).text)}>{pct(value, lang)}</span>
          )}
        </span>

        {value == null ? (
          <div className="mt-1.5">
            <EmptyNA className="!py-1 !px-2 text-left" hint={undefined} />
          </div>
        ) : (
          <span className="relative mt-1.5 block h-2.5 w-full overflow-visible rounded-full bg-neutral-100">
            <span className={cn("absolute inset-y-0 left-0 rounded-full", rag(status).bg)} style={{ width: `${clamp(value)}%` }} />
            {parentPercent != null && (
              <span
                className="absolute top-1/2 z-10 h-4 w-[3px] -translate-y-1/2 rounded-full bg-neutral-700/80"
                style={{ left: `calc(${clamp(parentPercent)}% - 1.5px)` }}
                title={`${parentLabel ?? "Avg"} ${Math.round(parentPercent)}%`}
              />
            )}
          </span>
        )}

        {value != null && parentPercent != null && (
          <span className="mt-1 block text-2xs text-neutral-400">
            {parentLabel ?? "Avg"} {locNum(Math.round(parentPercent), lang)}% · {gapLabel(value, parentPercent, lang)}
          </span>
        )}
      </span>

      <ChevronRight size={18} className="shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-500" />
    </button>
  );
}

function gapLabel(value: number, parent: number, lang: Lang) {
  const d = Math.round((value - parent) * 10) / 10;
  if (Math.abs(d) < 0.5) return lang === "gu" ? "સરેરાશ સમાન" : "at average";
  const ahead = d > 0;
  const n = locNum(Math.abs(d), lang);
  if (lang === "gu") return ahead ? `${n}% આગળ` : `${n}% પાછળ`;
  return ahead ? `${n}% ahead` : `${n}% behind`;
}

function clamp(v: number) {
  return Math.max(0, Math.min(100, v));
}
