import { cn } from "@/lib/cn";
import { locNum } from "@/lib/format";
import { useT } from "@/i18n";
import { PARAKH_BANDS, PARAKH_META, parakhBandOf, type ParakhBandId, type BoardResult } from "@/config/parakh";
import { Card } from "./atoms";
import { CardChevron } from "./kpiCardParts";
import { Layers, ArrowUpRight, ArrowDownRight } from "./Icon";

/** PARAKH category badge — band id + stage, in the band's colour. */
export function ParakhBadge({ band, size = "md" }: { band: ParakhBandId; size?: "md" | "lg" }) {
  const b = PARAKH_BANDS[band];
  const big = size === "lg";
  return (
    <span
      className="inline-flex flex-col items-start rounded-xl text-white shadow-card"
      style={{ background: b.hex, padding: big ? "8px 14px" : "5px 11px" }}
    >
      <span className={cn("font-extrabold leading-none tracking-wide", big ? "text-xl" : "text-sm")}>{b.id}</span>
      <span className={cn("font-semibold opacity-90", big ? "text-xs" : "text-2xs")}>{b.stage}</span>
    </span>
  );
}

/** PARAKH district summary card for the district home (§19). Drills to the detail screen. */
export function ParakhCard({ district, onOpen }: { district: string; onOpen: () => void }) {
  const band = parakhBandOf("Grade 3", district);
  const b = PARAKH_BANDS[band];
  return (
    <Card className="card-pad" style={{ borderTop: `4px solid ${b.hex}` }}>
      <button onClick={onOpen} className="group flex w-full flex-col text-left">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: b.soft }}>
            <Layers size={20} style={{ color: b.text }} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-neutral-900">PARAKH District Category</span>
            <span className="block text-2xs font-medium text-neutral-400">Grade 3 · Static {PARAKH_META.year}</span>
          </span>
          <CardChevron className="mt-0.5" />
        </div>
        <div className="mt-3.5 flex items-center gap-3">
          <span className="min-w-0 flex-1">
            <span className="block text-xl font-extrabold text-neutral-900">{district}</span>
            <span className="mt-1 block text-xs leading-snug text-neutral-500">{b.meaning}</span>
          </span>
          <ParakhBadge band={band} size="lg" />
        </div>
      </button>
    </Card>
  );
}

/** Board result card (district, §18) — static / API-pending; taps through to a KPI
 *  detail page with the yearly trend. */
export function BoardCard({ board, onOpen }: { board: BoardResult; onOpen?: () => void }) {
  const { t, lang } = useT();
  const up = board.delta >= 0;
  return (
    <Card className="card-pad">
      <button onClick={onOpen} className="group flex w-full flex-col text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-neutral-900">{board.name}</span>
          <span className="flex shrink-0 items-center gap-2">
            {board.pending && (
              <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-2xs font-bold text-neutral-400">{t("board.apiPending")}</span>
            )}
            <CardChevron />
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-3xl font-extrabold tnum leading-none text-neutral-900">{locNum(board.pass, lang)}%</span>
          <span className="text-sm font-medium text-neutral-500">{t("board.pass")}</span>
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-2xs font-bold", up ? "bg-rag-greenSoft text-rag-greenText" : "bg-rag-redSoft text-rag-redText")}>
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {up ? "+" : "−"}{Math.abs(board.delta)} {t("board.vsYear", { year: board.year })}
          </span>
        </div>
      </button>
    </Card>
  );
}
