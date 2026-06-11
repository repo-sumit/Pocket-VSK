import { useState } from "react";
import { cn } from "@/lib/cn";
import { rag } from "@/lib/colors";
import { locNum } from "@/lib/format";
import { useT, type Lang } from "@/i18n";
import { GSQAC_OVERALL, gsqacGrade, gsqacStatus, gsqacIndicatorScore, type GsqacArea, type GsqacSubdomain } from "@/config/gsqac";
import { Card } from "./atoms";
import { RatingBadge } from "./RatingBadge";
import { ChevronRight, ChevronDown, Award } from "./Icon";

/** Overall GSQAC score card — % · grade · marks out of 1000. */
export function GsqacOverallCard({ lang }: { lang: Lang }) {
  const { t } = useT();
  const grade = gsqacGrade(GSQAC_OVERALL.percent);
  const c = rag(gsqacStatus(GSQAC_OVERALL.percent));
  return (
    <Card className="card-pad flex items-center gap-4">
      <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", c.soft)}>
        <Award size={24} className={c.text} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-2xs font-bold uppercase tracking-wide text-neutral-400">{t("gsqac.overall")}</p>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className={cn("text-3xl font-extrabold tnum leading-none", c.text)}>{locNum(GSQAC_OVERALL.percent, lang)}%</span>
          <span className="text-xs font-semibold text-neutral-500">{locNum(GSQAC_OVERALL.got, lang)} / {locNum(GSQAC_OVERALL.max, lang)}</span>
        </div>
        <p className="mt-1 text-2xs text-neutral-400">{t("gsqac.framework")}</p>
      </div>
      <RatingBadge grade={grade} size="md" className="shrink-0" />
    </Card>
  );
}

/** One GSQAC area score card (Teaching & Learning, …): score · grade · sub-domain count. */
export function GsqacAreaCard({ area, lang, onOpen }: { area: GsqacArea; lang: Lang; onOpen: () => void }) {
  const { t, tn } = useT();
  const grade = gsqacGrade(area.percent);
  const c = rag(gsqacStatus(area.percent));
  const n = area.subdomains.length;
  return (
    <Card className="card-pad">
      <button onClick={onOpen} className="group flex w-full flex-col text-left">
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 text-sm font-bold leading-snug text-neutral-900">{tn(area.name, area.name_gu)}</span>
          <ChevronRight size={16} className="mt-0.5 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
        </div>
        <div className="mt-2 flex items-center gap-2.5">
          <span className={cn("text-2xl font-extrabold tnum leading-none", c.text)}>{locNum(area.percent, lang)}%</span>
          <RatingBadge grade={grade} size="sm" />
        </div>
        <div className="mt-2 flex items-center gap-2 text-2xs font-medium text-neutral-400">
          <span>{n === 1 ? t("gsqac.subdomainsOne", { n: locNum(n, lang) }) : t("gsqac.subdomains", { n: locNum(n, lang) })}</span>
          <span>·</span>
          <span className="tnum">{t("gsqac.outOf", { got: locNum(area.got, lang), max: locNum(area.max, lang) })}</span>
        </div>
      </button>
    </Card>
  );
}

/** A GSQAC sub-domain card with a tap-to-expand indicator list (no trend; scores only). */
export function GsqacSubdomainCard({ sub, lang }: { sub: GsqacSubdomain; lang: Lang }) {
  const { t, tn } = useT();
  const [open, setOpen] = useState(false);
  const c = rag(gsqacStatus(sub.score));
  const grade = gsqacGrade(sub.score);
  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 px-4 py-3 text-left" aria-expanded={open}>
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", c.bg)} aria-hidden />
        <span className="min-w-0 flex-1 text-sm font-semibold text-neutral-900">{tn(sub.name, sub.name_gu)}</span>
        <span className={cn("text-base font-extrabold tnum", c.text)}>{locNum(sub.score, lang)}%</span>
        <RatingBadge grade={grade} size="sm" className="shrink-0" />
        <ChevronDown size={16} className={cn("shrink-0 text-neutral-300 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-line/70 bg-neutral-50/60 px-4 py-2">
          <p className="py-1 text-2xs font-bold uppercase tracking-wide text-neutral-400">{t("gsqac.indicators")}</p>
          <ul className="divide-y divide-line/60">
            {sub.indicators.map((name, i) => {
              const s = gsqacIndicatorScore(sub.score, i);
              const ic = rag(gsqacStatus(s));
              return (
                <li key={name} className="flex items-center gap-3 py-2">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", ic.bg)} aria-hidden />
                  <span className="min-w-0 flex-1 text-xs text-neutral-700">{name}</span>
                  <span className={cn("shrink-0 text-xs font-bold tnum", ic.text)}>{locNum(s, lang)}%</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
