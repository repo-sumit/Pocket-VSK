import { cn } from "@/lib/cn";
import type { Callout as CalloutType } from "@/types";
import type { Lang } from "@/i18n";
import { AlertTriangle, Sparkles, Target, ChevronRight } from "./Icon";

const STYLE = {
  needs_attention: { icon: AlertTriangle, wrap: "bg-rag-redSoft/70", ic: "text-rag-red", labelEn: "Biggest opportunity", labelGu: "સૌથી મોટી તક" },
  most_improved: { icon: Sparkles, wrap: "bg-rag-greenSoft/70", ic: "text-rag-green", labelEn: "Most improved", labelGu: "સૌથી વધુ સુધારો" },
  close_gap: { icon: Target, wrap: "bg-primary-50", ic: "text-primary-600", labelEn: "Close the gap", labelGu: "તફાવત ભરો" },
} as const;

/** Positive, growth-oriented call-out (needs-attention / most-improved / close-gap). */
export function CalloutCard({ callout, lang = "en", onClick }: { callout: CalloutType; lang?: Lang; onClick?: () => void }) {
  const s = STYLE[callout.kind];
  const I = s.icon;
  const title = lang === "gu" ? callout.title_gu : callout.title;
  const detail = lang === "gu" ? callout.detail_gu : callout.detail;
  return (
    <button onClick={onClick} className={cn("group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors", s.wrap)}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/80">
        <I size={20} className={s.ic} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-2xs font-bold uppercase tracking-wider text-neutral-500">{lang === "gu" ? s.labelGu : s.labelEn}</span>
        <span className="block truncate text-sm font-bold text-neutral-900">{title}</span>
        <span className="line-clamp-1 text-xs text-neutral-500">{detail}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
