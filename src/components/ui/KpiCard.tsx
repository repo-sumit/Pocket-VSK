import { cn } from "@/lib/cn";
import type { KpiRecord, Level } from "@/types";
import { rag, valueToneClass, deltaToneClass } from "@/lib/colors";
import { formatValue, formatDelta, locNum, compactNum } from "@/lib/format";
import { peerAvg, peerLevelOf } from "@/lib/peer";
import { buildTrend, periodLabelKey } from "@/lib/trend";
import { useT, type Lang } from "@/i18n";
import { Card } from "./atoms";
import { Sparkline } from "./Sparkline";
import { ChevronRight, ArrowUpRight, ArrowDownRight } from "./Icon";

/**
 * Per-KPI tile — same visual family as the homepage DOMAIN cards: the big-number
 * value treatment + an inline, direction-coloured frequency delta (arrow + value
 * + frequency-correct word) + the chevron affordance, on the same card anatomy.
 * The KPI-only additions: its own frequency-appropriate trend graph, and the N+1
 * line (parent entity name + this KPI's score at the parent level).
 */
export function KpiCard({
  rec, name, onClick, lang = "en", level, parentName,
}: { rec: KpiRecord; name: string; onClick?: () => void; lang?: Lang; level?: Level; parentName?: string }) {
  const { t } = useT();
  const kpi = rec.kpi;
  const na = rec.value == null;
  const c = rag(rec.status);
  const trend = na ? null : buildTrend(rec, lang);
  const delta = trend?.delta ?? null;

  // change-deltas (YoY/cycle improvement) display a SIGNED, direction-coloured value —
  // same treatment as the Key Indicators strip, so a KPI reads the same on both surfaces.
  const isDelta = kpi.displayStrategy === "delta_cycle";

  // N+1: parent entity name + this KPI's score at the parent level — shown for EVERY
  // indicator with a published figure (hidden only at State / when NA), formatted like
  // this card's own value (signed for change-deltas).
  const peerScore = level && peerLevelOf(level) ? peerAvg(kpi.id, level) : null;
  const showPeer = !na && peerScore != null && !!parentName;
  const peerStr = peerScore != null ? (isDelta ? formatDelta(peerScore, kpi.unit, lang) : formatValue(peerScore, kpi.unit, lang)) : "";

  const deltaMag =
    delta != null
      ? kpi.unit === "count"
        ? compactNum(Math.abs(delta), lang)
        : locNum(Math.round(Math.abs(delta) * 10) / 10, lang)
      : null;

  return (
    <Card
      as="button"
      onClick={onClick}
      className="group card-pad flex w-full flex-col gap-2 text-left transition-shadow hover:shadow-raised"
    >
      {/* identity */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-bold leading-snug text-neutral-900">{name}</span>
        <ChevronRight size={16} className="mt-0.5 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
      </div>

      {/* value (domain-card treatment) + inline direction-coloured frequency delta */}
      <div className="flex items-end justify-between gap-2">
        <span className={cn("text-3xl font-extrabold tnum", na ? "text-rag-naText" : isDelta ? deltaToneClass(rec.value, kpi.direction) : valueToneClass(rec.status))}>
          {na ? "NA" : isDelta ? formatDelta(rec.value, kpi.unit, lang) : formatValue(rec.value, kpi.unit, lang)}
        </span>
        {trend && !isDelta && delta != null && delta !== 0 && (
          <span className={cn("inline-flex items-center gap-0.5 pb-1 text-2xs font-bold", deltaToneClass(delta, kpi.direction))}>
            {delta > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {deltaMag}
            <span className="ml-0.5 font-semibold text-neutral-400">{t(periodLabelKey(trend.cadence))}</span>
          </span>
        )}
      </div>

      {/* the KPI's frequency-appropriate trend graph (kept) */}
      {trend && trend.points.length > 1 && (
        <Sparkline data={trend.points.map((p) => p.value)} color={c.hex} height={30} responsive />
      )}

      {/* N+1: parent entity name + this KPI's score at the parent level */}
      {showPeer ? (
        <span className="truncate text-2xs text-neutral-400">{parentName} · {peerStr}</span>
      ) : na ? (
        <span className="text-2xs text-neutral-400">{t("common.notTracked")}</span>
      ) : null}
    </Card>
  );
}
