import { useNavigate } from "react-router-dom";
import type { DomainScore } from "@/types";
import { useScope, useScorecard, useScopeStats } from "@/hooks";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { rag, accent } from "@/lib/colors";
import { pct, locNum, greetingKey, formatDelta } from "@/lib/format";
import { CURRENT_PERIOD, WEIGHTAGE_IS_PLACEHOLDER } from "@/config";
import { OUTPUT_DOMAIN_ID } from "@/config/frameworks";
import { GSQAC_DOMAINS } from "@/config/kpiCatalog";
import { Card, SectionLabel, Badge, ProgressBar, StatusDot } from "@/components/ui/atoms";
import { RatingRing } from "@/components/ui/RatingRing";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { HeroKpiStrip } from "@/components/ui/HeroKpiStrip";
import { VskBadge } from "@/components/ui/VskBadge";
import { Icon, ChevronRight, ArrowUpRight, ArrowDownRight, Minus, Database } from "@/components/ui/Icon";

/**
 * 4A Input-Output homepage (same for every role). Headline = the Input Composite
 * the user can act on (Attendance 30 · Assessment 30 · Administration 40); the
 * School Quality (GSQAC) output is shown standalone beside it as the result.
 * 6-second scan: reality (scores + RAG) + next action (biggest opportunity).
 */
export default function ScorecardHome() {
  const { user, entity, currentId } = useScope();
  const sc = useScorecard(currentId);
  const stats = useScopeStats(currentId);
  const { t, tn, lang } = useT();
  const navigate = useNavigate();

  if (!entity || !sc) return null;

  const greeting = t(`greeting.${greetingKey()}`);
  const periodNo = CURRENT_PERIOD().id.split("W")[1];
  const inputs = sc.domainScores.filter((d) => d.domain.kind === "input" && d.records.length > 0);
  const output = sc.domainScores.find((d) => d.domain.id === OUTPUT_DOMAIN_ID);
  const gsqac = entity.meta.gsqac;
  const allRecords = sc.domainScores.flatMap((d) => d.records);
  // GSQAC coverage (real vs estimated) — honesty so missing data ≠ low performance
  const gsqacCoverage = stats && stats.schools > 0 && stats.gsqacReal < stats.schools ? stats : null;
  const dWoW = sc.overallDeltaWoW;
  const dUp = (dWoW ?? 0) > 0.05;
  const dDown = (dWoW ?? 0) < -0.05;

  const domainWoW = (d: DomainScore) => {
    // only the scored %/score indicators move the trend — count deltas (e.g. chronic
    // absentees, merit list) have huge magnitudes that would distort it.
    const ds = d.records
      .filter((r) => r.kpi.unit === "%" || r.kpi.unit === "score")
      .map((r) => r.deltaWoW)
      .filter((v): v is number => v != null);
    return ds.length ? Math.round((ds.reduce((a, b) => a + b, 0) / ds.length) * 10) / 10 : null;
  };
  const parentPct = (id: string) => sc.parent?.domainPercents[id] ?? null;
  const parentLevelLabel = sc.parent ? t(`levels.${sc.parent.entity.level}`) : t("common.average");

  return (
    <div className="space-y-5 animate-fade-in">
      {/* scope header */}
      <div className="flex items-center gap-3">
        <VskBadge size={40} />
        <div className="min-w-0">
          {user && <p className="text-sm font-medium text-neutral-500">{greeting}, {tn(user.name, user.name_gu).split(" ")[0]}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl" title={tn(entity.name, entity.name_gu)}>{tn(entity.name, entity.name_gu)}</h1>
            <Badge className="bg-neutral-100 text-neutral-500">{t(`levels.${entity.level}`)}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-neutral-400">{t("common.currentPeriod")} · {t("common.week")} {locNum(periodNo, lang)}</p>
        </div>
      </div>

      {/* HERO: input composite + what changed + biggest opportunity */}
      <Card className="card-pad sm:p-6">
        <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-[auto,1fr]">
          <div className="flex min-w-0 flex-col items-center gap-2">
            <RatingRing percent={sc.overallPercent} grade={sc.grade} lang={lang} sublabel={t("scorecard.inputComposite")} />
            <div className="flex items-center gap-2">
              {sc.grade && <RatingBadge grade={sc.grade} size="md" />}
              <Badge status={sc.status} className="!text-xs">{t(`status.${sc.status}`)}</Badge>
            </div>
          </div>
          <div className="min-w-0">
            <SectionLabel>{t("scorecard.whatChanged")}</SectionLabel>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={cn("inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full", dUp ? "bg-rag-greenSoft text-rag-greenText" : dDown ? "bg-rag-redSoft text-rag-redText" : "bg-neutral-100 text-neutral-400")}>
                {dUp ? <ArrowUpRight size={16} /> : dDown ? <ArrowDownRight size={16} /> : <Minus size={16} />}
              </span>
              <p className="text-sm font-semibold text-neutral-800">
                {dWoW == null ? t("scorecard.steady") : t("scorecard.overallMoved", { delta: formatDelta(dWoW, "%", lang) })}
              </p>
            </div>
            <p className="mt-3 text-2xs text-neutral-400">{t("scorecard.inputsDriveOutput")}</p>
          </div>
        </div>
      </Card>

      {/* WHAT TO ACT ON — the official hero/intervention levers; opens the indicator detail directly */}
      <HeroKpiStrip records={allRecords} level={entity.level} enrolment={stats?.enrolment} onOpen={(rec) => navigate(`/app/kpi/${rec.kpi.id}`)} />

      {/* INPUTS — the 3 dynamic domains the user can act on */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2">
          <SectionLabel>{t("scorecard.inputs")}</SectionLabel>
          {WEIGHTAGE_IS_PLACEHOLDER && <span className="chip bg-amber-50 text-amber-700 !py-0.5">{t("scorecard.weightPlaceholder")}</span>}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {inputs.map((d) => {
            const a = accent(d.domain.accent);
            const wow = domainWoW(d);
            const pp = parentPct(d.domain.id);
            const gap = d.percent != null && pp != null ? Math.round((d.percent - pp) * 10) / 10 : null;
            return (
              <button key={d.domain.id} onClick={() => navigate(`/app/domain/${d.domain.id}`)} className="group card card-pad flex flex-col gap-2 text-left transition-shadow hover:shadow-raised">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", a.bg)}><Icon name={d.domain.icon} className={a.icon} size={18} /></span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-neutral-900">{tn(d.domain.name, d.domain.name_gu)}</span>
                      <span className="block text-2xs text-neutral-400">{t("common.weightage")} {Math.round(d.domain.weightage * 100)}%</span>
                    </span>
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <span className={cn("text-3xl font-extrabold tnum", d.percent == null ? "text-rag-naText" : rag(d.status).text)}>{d.percent == null ? t("common.na") : pct(d.percent, lang)}</span>
                  <span className="flex items-center gap-1.5 pb-1">
                    {wow != null && wow !== 0 && (
                      <span className={cn("inline-flex items-center text-2xs font-bold", wow > 0 ? "text-rag-greenText" : "text-rag-redText")}>
                        {wow > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{locNum(Math.abs(wow), lang)}
                      </span>
                    )}
                    <StatusDot status={d.status} />
                  </span>
                </div>
                {gap != null && (
                  <span className="text-2xs text-neutral-400">
                    {parentLevelLabel} {locNum(Math.round(pp as number), lang)}% · <span className={cn("font-semibold", gap >= 0 ? "text-rag-greenText" : gap >= -8 ? "text-rag-amberText" : "text-rag-redText")}>{gap >= 0 ? `${locNum(gap, lang)}% ${t("scorecard.ahead")}` : `${locNum(Math.abs(gap), lang)}% ${t("scorecard.behind")}`}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* OUTPUT — School Quality (GSQAC), annual, shown as-is */}
      {output && output.percent != null && (
        <button onClick={() => navigate(`/app/domain/${OUTPUT_DOMAIN_ID}`)} className="group card card-pad block w-full border border-pink-100 bg-pink-50/30 text-left transition-shadow hover:shadow-raised sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-tint-pinkBg"><Icon name="Award" className="text-pink-600" size={18} /></span>
              <span>
                <span className="block text-sm font-bold text-neutral-900">{tn(output.domain.name, output.domain.name_gu)}</span>
                <span className="block text-2xs font-semibold uppercase tracking-wide text-pink-500">{t("scorecard.output")} · {t("scorecard.annual")}</span>
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className={cn("text-3xl font-extrabold tnum", rag(output.status).text)}>{pct(output.percent, lang)}</span>
              {output.grade && <RatingBadge grade={output.grade} size="md" />}
              <ChevronRight size={16} className="text-neutral-300 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
          {/* coverage honesty — how many schools in scope are actually measured */}
          {gsqacCoverage && gsqacCoverage.schools >= 2 && (
            <p
              className="mt-2 inline-flex items-center gap-1 text-2xs text-neutral-400"
              title={t("ogm.coverageHint")}
              aria-label={`${t("ogm.coverage", { real: locNum(gsqacCoverage.gsqacReal, lang), total: locNum(gsqacCoverage.schools, lang) })}. ${t("ogm.coverageHint")}`}
            >
              <Database size={11} /> {t("ogm.coverage", { real: locNum(gsqacCoverage.gsqacReal, lang), total: locNum(gsqacCoverage.schools, lang) })}
            </p>
          )}
          {/* D1-D5 breakdown (real GSQAC) */}
          {gsqac && (
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-5">
              {GSQAC_DOMAINS.map((g) => {
                const v = gsqac.domains[g.key];
                return (
                  <div key={g.key} className="min-w-0">
                    <div className="flex items-center justify-between gap-1 text-2xs text-neutral-500"><span className="truncate" title={tn(g.name, g.name_gu)}>{tn(g.name, g.name_gu)}</span><span className="tnum font-semibold">{v == null ? t("common.na") : pct(v * 100, lang)}</span></div>
                    {v != null && <ProgressBar value={v * 100} status={v * 100 >= 75 ? "green" : v * 100 >= 50 ? "amber" : "red"} className="mt-0.5" height={5} />}
                  </div>
                );
              })}
            </div>
          )}
          {gsqac?.improvement != null && (
            <p className="mt-3 text-xs text-neutral-500">
              {t("scorecard.vsLastCycle")}: <b className={gsqac.improvement >= 0 ? "text-rag-greenText" : "text-rag-redText"}>{gsqac.improvement >= 0 ? "+" : ""}{locNum(gsqac.improvement, lang)}%</b>
              {gsqac.synth && <span className="ml-1 text-2xs text-neutral-300">({t("common.sample")})</span>}
            </p>
          )}
        </button>
      )}
    </div>
  );
}
