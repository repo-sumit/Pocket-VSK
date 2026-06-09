import { useNavigate } from "react-router-dom";
import type { DomainScore } from "@/types";
import { useScope, useScorecard, useScopeStats } from "@/hooks";
import { useT } from "@/i18n";
import { greetingKey } from "@/lib/format";
import { OUTPUT_DOMAIN_ID } from "@/config/frameworks";
import { Badge } from "@/components/ui/atoms";
import { HeroKpiStrip } from "@/components/ui/HeroKpiStrip";
import { VskBadge } from "@/components/ui/VskBadge";
import { DomainSummaryCard } from "@/components/ui/DomainSummaryCard";
import { GsqacSummaryCard } from "@/components/ui/GsqacSummaryCard";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSection, PageGrid } from "@/components/layout/PageSection";

/**
 * Homepage (mobile-first, same for every role). Starts straight on actionable
 * content: Domain cards → School Quality → Key indicators. No generic overall-score
 * hero. Composed from shared components so the visual language stays consistent.
 */
export default function ScorecardHome() {
  const { user, entity, currentId } = useScope();
  const sc = useScorecard(currentId);
  const stats = useScopeStats(currentId);
  const { t, tn } = useT();
  const navigate = useNavigate();

  if (!entity || !sc) return null;

  const greeting = t(`greeting.${greetingKey()}`);
  const inputs = sc.domainScores.filter((d) => d.domain.kind === "input" && d.records.length > 0);
  const output = sc.domainScores.find((d) => d.domain.id === OUTPUT_DOMAIN_ID);
  const gsqac = entity.meta.gsqac;
  const allRecords = sc.domainScores.flatMap((d) => d.records);
  const gsqacCoverage = stats && stats.schools > 0 && stats.gsqacReal < stats.schools ? stats : null;
  const parent = sc.parent;
  const parentName = parent ? tn(parent.entity.name, parent.entity.name_gu) : undefined;

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

      {/* SCHOOL QUALITY — GSQAC output, compact (breakdown lives on the detail page) */}
      {output && (
        <GsqacSummaryCard
          output={output}
          gsqac={gsqac}
          coverage={gsqacCoverage ? { real: gsqacCoverage.gsqacReal, total: gsqacCoverage.schools } : null}
          parentName={parentName}
          parentPercent={parent?.domainPercents[OUTPUT_DOMAIN_ID] ?? null}
          onClick={() => navigate(`/app/domain/${OUTPUT_DOMAIN_ID}`)}
        />
      )}

      {/* KEY INDICATORS — actionable hero KPIs (full-width tiles); opens the indicator detail */}
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
