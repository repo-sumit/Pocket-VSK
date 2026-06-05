import { cn } from "@/lib/cn";
import type { RagStatus, Unit } from "@/types";
import { rag } from "@/lib/colors";
import { formatValue, formatValueFull } from "@/lib/format";
import type { Lang } from "@/i18n";

export interface CompareBar {
  key: string;
  label: string;
  sublabel?: string;
  value: number | null;
  status: RagStatus;
  isCurrent?: boolean;
}

/**
 * Grouped vertical comparison bars — the report-card "Performance
 * Comparison" pattern (this entity vs Cluster ▸ Block ▸ District ▸ State,
 * or Section ▸ Grade ▸ School …). Current bar is highlighted.
 */
export function ComparisonBars({
  bars, unit = "%", lang = "en", height = 168, max,
}: { bars: CompareBar[]; unit?: Unit; lang?: Lang; height?: number; max?: number }) {
  const vals = bars.map((b) => b.value ?? 0);
  const top = max ?? Math.max(100, ...vals);
  const naLabel = lang === "gu" ? "લાગુ નથી" : "NA";
  const summary = bars.map((b) => `${b.label} ${b.value == null ? naLabel : formatValue(b.value, unit, lang)}`).join(", ");
  return (
    <div className="flex items-end gap-2 sm:gap-3" style={{ height }} role="img" aria-label={summary}>
      {bars.map((b) => {
        const h = b.value == null ? 0 : Math.max(3, (b.value / top) * (height - 38));
        const c = rag(b.status);
        return (
          <div key={b.key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            <span
              className={cn("text-xs font-bold tnum", b.value == null ? "text-rag-naText" : c.text)}
              title={b.value == null ? naLabel : formatValueFull(b.value, unit, lang)}
            >
              {b.value == null ? naLabel : formatValue(b.value, unit, lang)}
            </span>
            <div className="relative flex w-full max-w-[56px] items-end justify-center">
              {b.value == null ? (
                <div className="h-1 w-full rounded-full border border-dashed border-rag-na/50" />
              ) : (
                <div
                  className={cn("w-full origin-bottom animate-bar-grow rounded-t-lg", c.bg, b.isCurrent && "ring-2 ring-offset-2 ring-primary-500")}
                  style={{ height: h }}
                />
              )}
            </div>
            <span className={cn("max-w-full truncate text-center text-2xs font-semibold", b.isCurrent ? "text-primary-600" : "text-neutral-500")} title={b.label}>
              {b.label}
            </span>
            {b.sublabel && <span className="max-w-full truncate text-center text-2xs text-neutral-400" title={b.sublabel}>{b.sublabel}</span>}
          </div>
        );
      })}
    </div>
  );
}
