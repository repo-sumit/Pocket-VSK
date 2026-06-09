import { cn } from "@/lib/cn";
import type { DomainScore } from "@/types";
import { accent } from "@/lib/colors";
import { useT } from "@/i18n";
import { Card, ProgressBar } from "./atoms";
import { Icon, ChevronRight } from "./Icon";
import { ValueDisplay } from "./ValueDisplay";
import { FrequencyDelta } from "./FrequencyDelta";
import { NPlusOneLine } from "./NPlusOneLine";

/**
 * The canonical domain card. `variant="home"` is the compact tile on the
 * scorecard grid; `variant="page"` is the expanded full-width header on a domain
 * page — same visual grammar (icon chip + name + the shared value/delta/N+1
 * atoms), just with the scope name + a compact progress cue. Status lives in the
 * value colour — no "On track" text tags.
 */
export function DomainSummaryCard({
  ds, name, delta, parentName, parentPercent, scopeName, variant = "home", onClick,
}: {
  ds: DomainScore;
  name: string;
  delta?: number | null;
  parentName?: string;
  parentPercent?: number | null;
  scopeName?: string;
  variant?: "home" | "page";
  onClick?: () => void;
}) {
  const { t, lang } = useT();
  const a = accent(ds.domain.accent);
  const deltaEl = delta != null && delta !== 0
    ? <FrequencyDelta delta={delta} unit="%" direction="higher" cadence="daily" showPeriod={false} lang={lang} className="pb-1" />
    : null;

  if (variant === "page") {
    return (
      <Card className="card-pad">
        <div className="flex items-center gap-3">
          <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", a.bg)}>
            <Icon name={ds.domain.icon} className={a.icon} size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-extrabold text-neutral-900">{name}</h1>
            {scopeName && <p className="truncate text-xs text-neutral-400">{scopeName}</p>}
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <ValueDisplay value={ds.percent} unit="%" status={ds.status} lang={lang} size="lg" naLabel={t("common.na")} />
            {deltaEl}
          </div>
        </div>
        {ds.percent != null && <ProgressBar value={ds.percent} status={ds.status} className="mt-3" height={8} />}
        <NPlusOneLine parentName={parentName} value={parentPercent ?? null} unit="%" lang={lang} className="mt-2" />
      </Card>
    );
  }

  return (
    <Card
      as="button"
      onClick={onClick}
      className="group card-pad flex w-full flex-col gap-2 text-left transition-shadow hover:shadow-raised"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", a.bg)}>
            <Icon name={ds.domain.icon} className={a.icon} size={18} />
          </span>
          <span className="block truncate text-sm font-bold text-neutral-900">{name}</span>
        </span>
        <ChevronRight size={16} className="shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
      </div>

      <div className="flex items-end justify-between gap-2">
        <ValueDisplay value={ds.percent} unit="%" status={ds.status} lang={lang} size="lg" naLabel={t("common.na")} />
        {deltaEl}
      </div>

      <NPlusOneLine parentName={parentName} value={parentPercent ?? null} unit="%" lang={lang} />
    </Card>
  );
}
