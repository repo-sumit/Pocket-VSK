import { cn } from "@/lib/cn";
import type { DomainScore } from "@/types";
import { deltaToneClass } from "@/lib/colors";
import { locNum } from "@/lib/format";
import { useT } from "@/i18n";
import { Card } from "./atoms";
import { RatingBadge } from "./RatingBadge";
import { ValueDisplay } from "./ValueDisplay";
import { NPlusOneLine } from "./NPlusOneLine";
import { Icon, ChevronRight, Database } from "./Icon";

interface GsqacMeta {
  total_percent: number;
  grade_text: string;
  domains: Record<string, number>;
  improvement?: number;
  synth?: boolean;
}

/**
 * School Quality / GSQAC — the compact output card, in the same card rhythm as
 * the domain cards: title + OUTPUT·ANNUAL eyebrow + GSQAC score + official grade
 * badge + N+1 + vs-last-cycle + coverage. The 5 GSQAC domain breakdowns are NOT
 * shown here — they live on the School Quality detail page. Annual: no daily trend.
 */
export function GsqacSummaryCard({
  output, gsqac, coverage, parentName, parentPercent, onClick,
}: {
  output: DomainScore;
  gsqac?: GsqacMeta | null;
  coverage?: { real: number; total: number } | null;
  parentName?: string;
  parentPercent?: number | null;
  onClick?: () => void;
}) {
  const { t, tn, lang } = useT();
  if (output.percent == null) return null;
  const clickable = !!onClick;

  return (
    <Card
      as={clickable ? "button" : "div"}
      onClick={onClick}
      className={cn("card-pad flex w-full flex-col gap-2 text-left", clickable && "group transition-shadow hover:shadow-raised")}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-tint-pinkBg"><Icon name="Award" className="text-pink-600" size={18} /></span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-neutral-900">{tn(output.domain.name, output.domain.name_gu)}</span>
            <span className="block text-2xs font-semibold uppercase tracking-wide text-neutral-400">{t("scorecard.output")} · {t("scorecard.annual")}</span>
          </span>
        </span>
        {clickable && <ChevronRight size={16} className="shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />}
      </div>

      <div className="flex items-end gap-2">
        <ValueDisplay value={output.percent} unit="%" status={output.status} lang={lang} size="lg" />
        {output.grade && <RatingBadge grade={output.grade} size="sm" className="mb-0.5" />}
      </div>

      <NPlusOneLine parentName={parentName} value={parentPercent ?? null} unit="%" lang={lang} />

      {gsqac?.improvement != null && (
        <p className="text-2xs text-neutral-400">
          {t("scorecard.vsLastCycle")}: <b className={deltaToneClass(gsqac.improvement, "higher")}>{gsqac.improvement >= 0 ? "+" : ""}{locNum(gsqac.improvement, lang)}%</b>
          {gsqac.synth && <span className="ml-1 text-neutral-300">({t("common.sample")})</span>}
        </p>
      )}

      {coverage && coverage.total >= 2 && (
        <p className="inline-flex items-center gap-1 text-2xs text-neutral-400" title={t("ogm.coverageHint")}>
          <Database size={11} /> {t("ogm.coverage", { real: locNum(coverage.real, lang), total: locNum(coverage.total, lang) })}
        </p>
      )}
    </Card>
  );
}
