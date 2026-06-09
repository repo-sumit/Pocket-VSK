import type { DomainScore } from "@/types";
import { deltaToneClass } from "@/lib/colors";
import { pct, locNum } from "@/lib/format";
import { GSQAC_DOMAINS } from "@/config/kpiCatalog";
import { useT } from "@/i18n";
import { ProgressBar } from "./atoms";
import { RatingBadge } from "./RatingBadge";
import { ValueDisplay } from "./ValueDisplay";
import { Icon, ChevronRight, Database } from "./Icon";

interface GsqacMeta {
  total_percent: number;
  grade_text: string;
  domains: Record<string, number>;
  improvement?: number;
  synth?: boolean;
}

/**
 * The canonical School Quality / GSQAC output card, used wherever GSQAC appears
 * (homepage output card + school-quality domain header). Distinctive pink surface
 * (an allowed exception), the official grade badge (GSQAC grade colours), the
 * D1–D5 breakdown bars, coverage line and the vs-last-cycle delta. Annual/latest —
 * never a daily trend.
 */
export function GsqacSummaryCard({
  output, gsqac, coverage, onClick,
}: {
  output: DomainScore;
  gsqac?: GsqacMeta | null;
  coverage?: { real: number; total: number } | null;
  onClick?: () => void;
}) {
  const { t, tn, lang } = useT();
  if (output.percent == null) return null;

  return (
    <button
      onClick={onClick}
      className="group block w-full rounded-2xl border border-tint-pinkRing/80 bg-gradient-to-br from-tint-pinkBg to-white p-4 text-left shadow-card transition-shadow hover:shadow-raised sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-tint-pinkRing"><Icon name="Award" className="text-pink-700" size={18} /></span>
          <span>
            <span className="block text-sm font-bold text-neutral-900">{tn(output.domain.name, output.domain.name_gu)}</span>
            <span className="block text-2xs font-semibold uppercase tracking-wide text-pink-700">{t("scorecard.output")} · {t("scorecard.annual")}</span>
          </span>
        </span>
        <span className="flex items-center gap-2">
          <ValueDisplay value={output.percent} unit="%" status={output.status} lang={lang} size="lg" />
          {output.grade && <RatingBadge grade={output.grade} size="md" />}
          <ChevronRight size={16} className="text-neutral-300 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>

      {coverage && coverage.total >= 2 && (
        <p
          className="mt-2 inline-flex items-center gap-1 text-2xs text-neutral-500"
          title={t("ogm.coverageHint")}
          aria-label={`${t("ogm.coverage", { real: locNum(coverage.real, lang), total: locNum(coverage.total, lang) })}. ${t("ogm.coverageHint")}`}
        >
          <Database size={11} /> {t("ogm.coverage", { real: locNum(coverage.real, lang), total: locNum(coverage.total, lang) })}
        </p>
      )}

      {gsqac && (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-5">
          {GSQAC_DOMAINS.map((g) => {
            const v = gsqac.domains[g.key];
            return (
              <div key={g.key} className="min-w-0">
                <div className="flex items-center justify-between gap-1 text-2xs text-neutral-500">
                  <span className="truncate" title={tn(g.name, g.name_gu)}>{tn(g.name, g.name_gu)}</span>
                  <span className="tnum font-semibold">{v == null ? t("common.na") : pct(v * 100, lang)}</span>
                </div>
                {v != null && <ProgressBar value={v * 100} status={v * 100 >= 75 ? "green" : v * 100 >= 50 ? "amber" : "red"} className="mt-0.5" height={5} />}
              </div>
            );
          })}
        </div>
      )}

      {gsqac?.improvement != null && (
        <p className="mt-3 text-xs text-neutral-500">
          {t("scorecard.vsLastCycle")}: <b className={deltaToneClass(gsqac.improvement, "higher")}>{gsqac.improvement >= 0 ? "+" : ""}{locNum(gsqac.improvement, lang)}%</b>
          {gsqac.synth && <span className="ml-1 text-2xs text-neutral-300">({t("common.sample")})</span>}
        </p>
      )}
    </button>
  );
}
