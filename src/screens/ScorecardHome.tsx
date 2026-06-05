import { useNavigate } from "react-router-dom";
import { useScope, useScorecard, useChildLeaderboard } from "@/hooks";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { rag } from "@/lib/colors";
import { pct, locNum, greetingKey, formatDelta } from "@/lib/format";
import { CURRENT_PERIOD, WEIGHTAGE_IS_PLACEHOLDER } from "@/config";
import { TeacherView } from "@/components/role/TeacherView";
import { PrincipalView } from "@/components/role/PrincipalView";
import { Card, SectionLabel, Badge, StatusDot } from "@/components/ui/atoms";
import { RatingRing } from "@/components/ui/RatingRing";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { DomainBar } from "@/components/ui/DomainBar";
import { CalloutCard } from "@/components/ui/Callout";
import { VskBadge } from "@/components/ui/VskBadge";
import { ChevronRight, ArrowUpRight, ArrowDownRight, Minus } from "@/components/ui/Icon";

export default function ScorecardHome() {
  const { user, entity, currentId, setScope, childLevel } = useScope();
  const sc = useScorecard(currentId);
  const children = useChildLeaderboard(currentId);
  const { t, tn, lang } = useT();
  const navigate = useNavigate();

  if (!entity || !sc) return null;

  const greeting = t(`greeting.${greetingKey()}`);
  if (user?.role === "teacher" && entity.level === "section") return <TeacherView entity={entity} greeting={greeting} />;
  if (user?.role === "principal" && entity.level === "school") return <PrincipalView entity={entity} greeting={greeting} />;

  const parentLevelLabel = sc.parent ? t(`levels.${sc.parent.entity.level}`) : t("common.average");
  // only domains that have at least one applicable KPI at this level (hide, don't NA)
  const scoredDomains = sc.domainScores.filter((d) => d.weightage > 0 && d.records.length > 0);
  const periodNo = CURRENT_PERIOD().id.split("W")[1];
  const concern = sc.callouts.find((c) => c.kind === "needs_attention");
  const improved = sc.callouts.find((c) => c.kind === "most_improved");
  const dWoW = sc.overallDeltaWoW;
  const dUp = (dWoW ?? 0) > 0.05;
  const dDown = (dWoW ?? 0) < -0.05;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* scope header */}
      <div className="flex items-center gap-3">
        <VskBadge size={40} />
        <div className="min-w-0">
          {user && <p className="text-sm font-medium text-neutral-500">{greeting}, {tn(user.name, user.name_gu).split(" ")[0]}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">{tn(entity.name, entity.name_gu)}</h1>
            <Badge className="bg-neutral-100 text-neutral-500">{t(`levels.${entity.level}`)}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-neutral-400">{t("common.currentPeriod")} · {t("common.week")} {locNum(periodNo, lang)}</p>
        </div>
      </div>

      {/* HERO — overall score + what changed (one clear story) */}
      <Card className="card-pad sm:p-6">
        <div className="grid items-center gap-5 sm:grid-cols-[auto,1fr]">
          <div className="flex flex-col items-center gap-2">
            <RatingRing percent={sc.overallPercent} grade={sc.grade} lang={lang} sublabel={t("common.grade")} />
            <div className="flex items-center gap-2">
              {sc.grade && <RatingBadge grade={sc.grade} size="md" />}
              <Badge status={sc.status} className="!text-xs">{t(`status.${sc.status}`)}</Badge>
            </div>
          </div>

          <div className="min-w-0">
            {/* the one-line "what changed" */}
            <SectionLabel>{t("scorecard.whatChanged")}</SectionLabel>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full", dUp ? "bg-rag-greenSoft text-rag-greenText" : dDown ? "bg-rag-redSoft text-rag-redText" : "bg-neutral-100 text-neutral-400")}>
                {dUp ? <ArrowUpRight size={16} /> : dDown ? <ArrowDownRight size={16} /> : <Minus size={16} />}
              </span>
              <p className="text-sm font-semibold text-neutral-800">
                {dWoW == null
                  ? t("scorecard.steady")
                  : t("scorecard.overallMoved", { delta: formatDelta(dWoW, "%", lang) })}
                {improved && <span className="font-normal text-neutral-500"> · {t("scorecard.led", { kpi: lang === "gu" ? improved.title_gu : improved.title })}</span>}
              </p>
            </div>

            {/* biggest concern + most improved */}
            <div className="mt-3 grid gap-2">
              {concern && (
                <CalloutCard callout={concern} lang={lang} onClick={() => concern.domainId && navigate(`/app/domain/${concern.domainId}`)} />
              )}
              {improved && (
                <CalloutCard callout={improved} lang={lang} onClick={() => improved.kpiId && navigate(`/app/kpi/${improved.kpiId}`)} />
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* domain rows — you vs the level above */}
      <Card className="card-pad">
        <div className="mb-1 flex items-center justify-between">
          <SectionLabel>{t("scorecard.domainWise")}</SectionLabel>
          {sc.parent && <span className="text-2xs text-neutral-400">{t("scorecard.youVsParent", { level: parentLevelLabel })}</span>}
        </div>
        <div className="-mx-2 divide-y divide-line/60">
          {scoredDomains.map((ds) => (
            <DomainBar key={ds.domain.id} ds={ds} name={tn(ds.domain.name, ds.domain.name_gu)} parentPercent={sc.parent?.domainPercents[ds.domain.id]} parentLabel={parentLevelLabel} lang={lang} onClick={() => navigate(`/app/domain/${ds.domain.id}`)} />
          ))}
        </div>
      </Card>

      {/* scannable score table (weightage · % · contribution · status) */}
      <Card className="card-pad">
        <div className="flex items-center justify-between">
          <SectionLabel>{t("scorecard.breakdown")}</SectionLabel>
          {WEIGHTAGE_IS_PLACEHOLDER && <span className="chip bg-amber-50 text-amber-700 !py-0.5">{t("scorecard.weightPlaceholder")}</span>}
        </div>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="text-2xs uppercase tracking-wide text-neutral-400">
              <th className="pb-2 font-semibold">{lang === "gu" ? "ડોમેન" : "Domain"}</th>
              <th className="pb-2 text-right font-semibold">{t("common.weightage")}</th>
              <th className="pb-2 text-right font-semibold">%</th>
              <th className="hidden pb-2 text-right font-semibold sm:table-cell">{t("scorecard.contribution")}</th>
              <th className="pb-2 pl-3 text-right font-semibold">{t("kpi.statusLabel")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {scoredDomains.map((d) => (
              <tr key={d.domain.id} className="cursor-pointer hover:bg-neutral-50" onClick={() => navigate(`/app/domain/${d.domain.id}`)}>
                <td className="py-2.5 font-semibold text-neutral-800">{tn(d.domain.name, d.domain.name_gu)}</td>
                <td className="py-2.5 text-right tabular-nums text-neutral-500">{Math.round(d.domain.weightage * 100)}%</td>
                <td className={cn("py-2.5 text-right font-bold tabular-nums", d.percent == null ? "text-rag-naText" : rag(d.status).text)}>{d.percent == null ? "NA" : pct(d.percent, lang)}</td>
                <td className="hidden py-2.5 text-right tabular-nums text-neutral-600 sm:table-cell">{d.contribution.toFixed(1)}</td>
                <td className="py-2.5 pl-3 text-right"><StatusDot status={d.status} /></td>
              </tr>
            ))}
            <tr className="border-t-2 border-line">
              <td className="py-2.5 font-extrabold text-neutral-900">{lang === "gu" ? "એકંદર" : "Overall"}</td>
              <td className="py-2.5 text-right tabular-nums text-neutral-500">100%</td>
              <td className={cn("py-2.5 text-right font-extrabold tabular-nums", rag(sc.status).text)}>{pct(sc.overallPercent, lang)}</td>
              <td className="hidden py-2.5 text-right font-bold tabular-nums sm:table-cell">{sc.overallPercent != null ? sc.overallPercent.toFixed(1) : "—"}</td>
              <td className="py-2.5 pl-3 text-right">{sc.grade && <RatingBadge grade={sc.grade} size="sm" celebrate={false} />}</td>
            </tr>
          </tbody>
        </table>
      </Card>

      {/* drill down one level */}
      {childLevel && children.length > 0 && (
        <Card className="card-pad">
          <div className="mb-2 flex items-center justify-between">
            <SectionLabel>{t("scorecard.explore")} · {t(`levels.${childLevel}`)}</SectionLabel>
            <button onClick={() => navigate("/app/leaderboard")} className="text-xs font-semibold text-primary-600 hover:underline">{t("common.viewAll")}</button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {children.slice(0, 6).map((c) => (
              <button key={c.entity.id} onClick={() => { setScope(c.entity.id); navigate("/app"); }} className="flex items-center gap-3 rounded-xl border border-line/70 px-3 py-2.5 text-left hover:bg-neutral-50">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-neutral-50 text-xs font-bold text-neutral-500 tnum">{c.rank}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-neutral-800">{tn(c.entity.name, c.entity.name_gu)}</span>
                  <span className={cn("text-xs font-bold tnum", rag(c.status).text)}>{pct(c.percent, lang)}</span>
                </span>
                {c.grade && <RatingBadge grade={c.grade} size="sm" celebrate={false} />}
                <ChevronRight size={16} className="text-neutral-300" />
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
