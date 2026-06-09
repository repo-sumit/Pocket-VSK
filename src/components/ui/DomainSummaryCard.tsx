import { cn } from "@/lib/cn";
import type { DomainScore } from "@/types";
import { accent } from "@/lib/colors";
import { useT } from "@/i18n";
import { Card } from "./atoms";
import { Icon, ChevronRight } from "./Icon";
import { ValueDisplay } from "./ValueDisplay";
import { FrequencyDelta } from "./FrequencyDelta";
import { NPlusOneLine } from "./NPlusOneLine";

/**
 * The canonical domain card (homepage + domain-related views): accent icon +
 * name + the shared big-value treatment + an optional movement delta + the N+1
 * parent line. Composed from the same atoms as KpiCard so the two read as one
 * family. Status lives in the value colour — no "On track" text tags.
 */
export function DomainSummaryCard({
  ds, name, delta, parentName, parentPercent, onClick,
}: {
  ds: DomainScore;
  name: string;
  delta?: number | null;
  parentName?: string;
  parentPercent?: number | null;
  onClick?: () => void;
}) {
  const { t, lang } = useT();
  const a = accent(ds.domain.accent);
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
        {delta != null && delta !== 0 && (
          <FrequencyDelta delta={delta} unit="%" direction="higher" cadence="daily" showPeriod={false} lang={lang} className="pb-1" />
        )}
      </div>

      <NPlusOneLine parentName={parentName} value={parentPercent ?? null} unit="%" lang={lang} />
    </Card>
  );
}
