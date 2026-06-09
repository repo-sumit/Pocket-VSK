import { cn } from "@/lib/cn";
import type { DomainScore } from "@/types";
import { useT } from "@/i18n";
import { Card } from "./atoms";
import { RatingBadge } from "./RatingBadge";
import { ValueDisplay } from "./ValueDisplay";
import { FrequencyDelta } from "./FrequencyDelta";
import { NPlusOneLine } from "./NPlusOneLine";
import { Icon, ChevronRight } from "./Icon";

interface GsqacMeta {
  total_percent: number;
  grade_text: string;
  domains: Record<string, number>;
  improvement?: number;
  synth?: boolean;
}

/**
 * School Quality / GSQAC — the compact output card, in the same card rhythm as the
 * domain cards: title + OUTPUT·ANNUAL eyebrow + GSQAC score + official grade badge,
 * with the year-on-year change shown as the shared right-side FrequencyDelta ("this
 * year") and the N+1 line. The 5 GSQAC domain breakdowns live on the detail page.
 */
export function GsqacSummaryCard({
  output, gsqac, parentName, parentPercent, onClick,
}: {
  output: DomainScore;
  gsqac?: GsqacMeta | null;
  parentName?: string;
  parentPercent?: number | null;
  onClick?: () => void;
}) {
  const { t, tn, lang } = useT();
  if (output.percent == null) return null;
  const clickable = !!onClick;
  const improvement = gsqac?.improvement ?? null;

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

      {/* score + grade · year-on-year delta on the right (same treatment as the domain cards) */}
      <div className="flex items-end justify-between gap-2">
        <span className="flex items-end gap-2">
          <ValueDisplay value={output.percent} unit="%" status={output.status} lang={lang} size="lg" />
          {output.grade && <RatingBadge grade={output.grade} size="sm" className="mb-0.5" />}
        </span>
        {improvement != null && improvement !== 0 && (
          <FrequencyDelta delta={improvement} unit="%" direction="higher" cadence="yearly" lang={lang} className="pb-1" />
        )}
      </div>

      <NPlusOneLine parentName={parentName} value={parentPercent ?? null} unit="%" lang={lang} />
    </Card>
  );
}
