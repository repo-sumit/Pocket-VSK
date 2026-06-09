import { useNavigate } from "react-router-dom";
import type { DomainScore } from "@/types";
import { useScope, useScorecard, useScopeStats } from "@/hooks";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { GRADE_GROUP, gradeGroupOf } from "@/lib/colors";
import { locNum, greetingKey } from "@/lib/format";
import { overallTrendData } from "@/lib/trend";
import { OUTPUT_DOMAIN_ID } from "@/config/frameworks";
import { Badge } from "@/components/ui/atoms";
import { RatingRing } from "@/components/ui/RatingRing";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { HeroKpiStrip } from "@/components/ui/HeroKpiStrip";
import { Sparkline } from "@/components/ui/Sparkline";
import { VskBadge } from "@/components/ui/VskBadge";
import { DomainSummaryCard } from "@/components/ui/DomainSummaryCard";
import { GsqacSummaryCard } from "@/components/ui/GsqacSummaryCard";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSection, PageGrid } from "@/components/layout/PageSection";

/**
 * Homepage (mobile-first, same for every role). Order: Overall score → Domain
 * cards → School Quality → Key indicators. Composed from shared components
 * (PageHeader, DomainSummaryCard, GsqacSummaryCard, HeroKpiStrip) so the visual
 * language stays in lockstep with the rest of the app. The overall score is the
 * only bespoke surface (the hero) — an allowed exception.
 */
export default function ScorecardHome() {
  const { user, entity, currentId } = useScope();
  const sc = useScorecard(currentId);
  const stats = useScopeStats(currentId);
  const { t, tn, lang } = useT();
  const navigate = useNavigate();

  if (!entity || !sc) return null;

  const greeting = t(`greeting.${greetingKey()}`);
  const inputs = sc.domainScores.filter((d) => d.domain.kind === "input" && d.records.length > 0);
  const output = sc.domainScores.find((d) => d.domain.id === OUTPUT_DOMAIN_ID);
  const gsqac = entity.meta.gsqac;
  const allRecords = sc.domainScores.flatMap((d) => d.records);
  const gsqacCoverage = stats && stats.schools > 0 && stats.gsqacReal < stats.schools ? stats : null;
  const overallTrend = overallTrendData(sc.overallPercent, entity.id);
  const gradeHex = sc.grade ? GRADE_GROUP[gradeGroupOf(sc.grade)].hex : "#9CA3AF";
  const parent = sc.parent;
  const parentName = parent ? tn(parent.entity.name, parent.entity.name_gu) : undefined;

  // net movement of the overall score across the trend window (the "which way am I going")
  const overallNet = overallTrend.length > 1 ? Math.round(overallTrend[overallTrend.length - 1]) - Math.round(overallTrend[0]) : 0;
  const netStr = `${overallNet > 0 ? "+" : overallNet < 0 ? "−" : "±"}${locNum(Math.abs(overallNet), lang)}`;
  const netTone = overallNet > 0 ? "bg-rag-greenSoft text-rag-greenText" : overallNet < 0 ? "bg-rag-redSoft text-rag-redText" : "bg-neutral-100 text-neutral-500";

  const domainWoW = (d: DomainScore) => {
    const ds = d.records
      .filter((r) => r.kpi.unit === "%" || r.kpi.unit === "score")
      .map((r) => r.deltaWoW)
      .filter((v): v is number => v != null);
    return ds.length ? Math.round((ds.reduce((a, b) => a + b, 0) / ds.length) * 10) / 10 : null;
  };

  return (
    <ScreenContainer>
      <PageHeader
        icon={<VskBadge size={40} />}
        eyebrow={user ? `${greeting}, ${tn(user.name, user.name_gu).split(" ")[0]}` : undefined}
        title={tn(entity.name, entity.name_gu)}
        badge={<Badge className="bg-neutral-100 text-neutral-500">{t(`levels.${entity.level}`)}</Badge>}
      />

      {/* OVERALL SCORE — the hero: ring + grade + contextual 30-day trend as one unit.
          A bespoke green-tinted surface (allowed exception) that sets it apart. */}
      <div className="rounded-2xl border border-rag-green/20 bg-gradient-to-br from-tint-mintBg via-white to-tint-greenBg/40 p-4 shadow-raised sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-4 sm:shrink-0">
            <RatingRing percent={sc.overallPercent} grade={sc.grade} size={104} stroke={11} lang={lang} sublabel={t("scorecard.overall")} />
            {sc.grade && <RatingBadge grade={sc.grade} size="lg" />}
          </div>
          {overallTrend.length > 1 && (
            <div className="min-w-0 flex-1 sm:border-l sm:border-line/60 sm:pl-6">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="section-title !mb-0">{t("kpi.trendDaily")}</p>
                <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold tnum", netTone)}>
                  {t("scorecard.netOver30", { delta: netStr, n: locNum(30, lang) })}
                </span>
              </div>
              <Sparkline data={overallTrend} color={gradeHex} height={56} strokeWidth={2.5} baseline={overallTrend[0]} emphasizeEnd responsive />
            </div>
          )}
        </div>
      </div>

      {/* DOMAIN cards */}
      <PageSection title={t("scorecard.domainsHeader")}>
        <PageGrid cols="domain">
          {inputs.map((d) => (
            <DomainSummaryCard
              key={d.domain.id}
              ds={d}
              name={tn(d.domain.name, d.domain.name_gu)}
              delta={domainWoW(d)}
              parentName={parentName}
              parentPercent={parent?.domainPercents[d.domain.id] ?? null}
              onClick={() => navigate(`/app/domain/${d.domain.id}`)}
            />
          ))}
        </PageGrid>
      </PageSection>

      {/* SCHOOL QUALITY — GSQAC output, annual */}
      {output && (
        <GsqacSummaryCard
          output={output}
          gsqac={gsqac}
          coverage={gsqacCoverage ? { real: gsqacCoverage.gsqacReal, total: gsqacCoverage.schools } : null}
          onClick={() => navigate(`/app/domain/${OUTPUT_DOMAIN_ID}`)}
        />
      )}

      {/* KEY INDICATORS — full-width tiles, full names; opens the indicator detail */}
      <HeroKpiStrip
        records={allRecords}
        level={entity.level}
        enrolment={stats?.enrolment}
        parentName={parentName}
        onOpen={(rec) => navigate(`/app/kpi/${rec.kpi.id}`)}
      />
    </ScreenContainer>
  );
}
