import { cn } from "@/lib/cn";
import type { KpiRecord } from "@/types";
import { rag } from "@/lib/colors";
import { formatValue, pct } from "@/lib/format";
import { isImproving } from "@/engine";
import { useT, type Lang } from "@/i18n";
import { Card, DeltaPill, StatusDot } from "./atoms";
import { Sparkline } from "./Sparkline";
import { ChevronRight } from "./Icon";

/** The per-KPI tile (OGM shape): value · Δ WoW · trend sparkline · RAG · vs benchmark. */
export function KpiCard({
  rec, name, onClick, lang = "en", showBenchmark = true,
}: { rec: KpiRecord; name: string; onClick?: () => void; lang?: Lang; showBenchmark?: boolean }) {
  const { t } = useT();
  const c = rag(rec.status);
  const na = rec.value == null;
  const improving = isImproving(rec.trend, rec.kpi.direction);

  return (
    <Card
      as="button"
      onClick={onClick}
      className={cn(
        "card-pad group flex w-full flex-col gap-3 text-left transition-shadow hover:shadow-raised",
        na && "opacity-95",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusDot status={rec.status} />
          <span className="line-clamp-2 text-sm font-semibold text-neutral-700">{name}</span>
        </div>
        <ChevronRight size={16} className="mt-0.5 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          {na ? (
            <span className="text-2xl font-extrabold text-rag-naText">NA</span>
          ) : (
            <span className={cn("text-2xl font-extrabold tnum", c.text)}>{formatValue(rec.value, rec.kpi.unit, lang)}</span>
          )}
          {showBenchmark && rec.benchmark != null && !na && (
            <span className="ml-1 text-xs text-neutral-400">/ {formatValue(rec.benchmark, rec.kpi.unit, lang)}</span>
          )}
        </div>
        {!na && rec.series.length > 1 && (
          <Sparkline data={rec.series.map((s) => s.value)} color={c.hex} />
        )}
      </div>

      {na ? (
        <p className="text-2xs text-neutral-400">{t("common.notTracked")}</p>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <DeltaPill delta={rec.deltaWoW} unit={rec.kpi.unit} direction={rec.kpi.direction} lang={lang} />
          {rec.achievement != null && (
            <span className="text-2xs font-medium text-neutral-400">
              {improving ? "↑" : rec.trend === "down" ? "↓" : "→"} {pct(rec.achievement, lang)} {t("common.score")}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
