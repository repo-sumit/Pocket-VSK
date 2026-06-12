import { useNavigate } from "react-router-dom";
import type { RagStatus } from "@/types";
import { useScope, useScorecard, useChildLeaderboard, useFramework } from "@/hooks";
import { useCompare } from "@/components/compare/CompareContext";
import { useT } from "@/i18n";
import { greetingKey } from "@/lib/format";
import { gradeFor } from "@/config/ratingBands";
import { OUTPUT_DOMAIN_ID } from "@/config/frameworks";
import { statusFromGrade } from "@/engine";
import { DomainInsightCard } from "@/components/ui/DomainInsightCard";
import { UntrackedHomeCard } from "@/components/ui/UntrackedHomeCard";
import type { ChildBar } from "@/components/ui/ComparisonBars";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { PageSection, PageGrid } from "@/components/layout/PageSection";

/**
 * Homepage — mobile-first, ~95% of users are on a phone. A compact context-aware
 * greeting, then one full-width insight card per domain. Embedded child-unit bar
 * charts are hidden until the user applies Compare (top action row); each card
 * then shows the domain score across the selected n-1 units. No standalone
 * comparison strip; filters, Compare, Export and the navigator live in the shell.
 */
export default function ScorecardHome() {
  const { user, entity, currentId, homeId, setScope } = useScope();
  const sc = useScorecard(currentId);
  // School-level scorecard (the user's home entity) — Teacher/Principal GSQAC is a
  // school-level team metric, so it falls back to this when the current grade/section
  // scope has no GSQAC of its own (§1).
  const homeSc = useScorecard(homeId);
  const childEntries = useChildLeaderboard(currentId);
  const fw = useFramework();
  const { childLevel, applied, selectedIds } = useCompare();
  const { t, tn } = useT();
  const navigate = useNavigate();

  if (!entity || !sc) return null;

  const isTP = user?.role === "teacher" || user?.role === "principal";
  const allInputs = sc.domainScores.filter((d) => d.domain.kind === "input" && d.records.length > 0);
  // Teacher/Principal home replaces the "Administration" domain card with a dedicated
  // "Untracked Students" card (§2/§4); officers keep the full input set.
  const inputs = isTP ? allInputs.filter((d) => d.domain.id !== "administration") : allInputs;

  // School Quality (GSQAC): current scope's output, else the school-level output for
  // Teacher/Principal so the card never disappears at grade/section (§1).
  const output = sc.domainScores.find((d) => d.domain.id === OUTPUT_DOMAIN_ID);
  const currentOutput = output && output.percent != null ? output : null;
  const homeOutput = (() => {
    const o = homeSc?.domainScores.find((d) => d.domain.id === OUTPUT_DOMAIN_ID);
    return o && o.percent != null ? o : null;
  })();
  const gsqacOutput = currentOutput ?? (isTP ? homeOutput : null);
  const gsqacSc = currentOutput ? sc : homeSc;
  const parent = sc.parent;
  const parentName = parent ? tn(parent.entity.name, parent.entity.name_gu) : undefined;
  const levelLabel = t(`levels.${entity.level}`);

  const greeting = t(`greeting.${greetingKey()}`);
  // demo mode: greet by role label, never a real person name (§3)
  const displayName = user ? t(`roles.${user.role}`) : "";

  const statusOf = (v: number | null): RagStatus => (v == null ? "na" : statusFromGrade(gradeFor(v, fw.rating_bands).group));
  const selectedSet = new Set(selectedIds);

  // GSQAC (output) compare bars = the domain SCORE % across selected children (the
  // score IS a percent). Input domains don't use this — their bars come from the hero
  // KPI's own series (in the hero's unit), computed inside DomainInsightCard.
  const childBars = (domainId: string): ChildBar[] =>
    childEntries
      .filter((en) => selectedSet.has(en.entity.id))
      .map((en) => {
        const value = en.domainPercents?.[domainId] ?? null;
        return { id: en.entity.id, label: tn(en.entity.name, en.entity.name_gu), value, status: statusOf(value) };
      })
      .filter((b) => b.value != null)
      .sort((a, b) => (a.value as number) - (b.value as number));

  // selected child units (id + label) handed to input-domain cards, which build their
  // own hero-unit bars from these ids.
  const compareChildren = childEntries
    .filter((en) => selectedSet.has(en.entity.id))
    .map((en) => ({ id: en.entity.id, label: tn(en.entity.name, en.entity.name_gu) }));

  const comparable = !!childLevel;
  const chartTitle = childLevel ? t("compare.chartTitle", { level: t(`levels.${childLevel}`) }) : "";
  const drillChild = (id: string) => setScope(id);

  return (
    <ScreenContainer>
      {/* compact, context-aware greeting (entity + parent live in the navigator) */}
      <div className="min-w-0">
        <h1 className="truncate text-lg font-extrabold tracking-tight text-neutral-900 sm:text-xl">{greeting}, {displayName}</h1>
        <p className="truncate text-xs text-neutral-500">{t("hierarchy.youViewing", { level: levelLabel.toLowerCase() })}</p>
      </div>

      <PageSection title={t("scorecard.domainsHeader")}>
        <PageGrid cols="domain">
          {inputs.map((d) => {
            const hero = d.records.find((r) => r.kpi.hero) ?? null;
            // Administration (officers only — teachers have no access to this domain):
            // show No. of CRC/URC visits below the untracked-students hero, separated by
            // a divider. Sourced from the same scorecard record as the domain detail.
            const secondary = d.domain.id === "administration"
              ? d.records.find((r) => r.kpi.id === "vis_CRCC_count") ?? null
              : null;
            // Both Administration metrics are comparable → "Compare by" chip selector.
            const adminCompareMetrics = d.domain.id === "administration" && hero && secondary
              ? [
                  { rec: hero, chipLabel: tn(hero.kpi.name, hero.kpi.name_gu) },
                  { rec: secondary, chipLabel: t("compare.crcVisits") },
                ]
              : undefined;
            return (
              <DomainInsightCard
                key={d.domain.id}
                ds={d}
                name={tn(d.domain.name, d.domain.name_gu)}
                level={entity.level}
                heroRec={hero}
                secondaryRec={secondary}
                parentName={parentName}
                comparable={comparable}
                comparing={applied}
                compareChildren={compareChildren}
                compareMetrics={adminCompareMetrics}
                chartTitle={chartTitle}
                onDrill={() => navigate(`/app/domain/${d.domain.id}`)}
                onOpenChild={drillChild}
              />
            );
          })}

          {/* School Quality (GSQAC). Officers: shown when the current scope has a score.
              Teacher/Principal: always shown, falling back to the school-level score so it
              persists at Grade/Section view too — GSQAC is a school-level team metric (§1). */}
          {gsqacOutput && (
            <DomainInsightCard
              ds={gsqacOutput}
              name={tn(gsqacOutput.domain.name, gsqacOutput.domain.name_gu)}
              level={gsqacOutput === output ? entity.level : "school"}
              parentName={parentName}
              gsqacImprovement={entity.meta.gsqac?.improvement ?? null}
              outputPercent={gsqacOutput.percent}
              parentPercent={gsqacSc?.parent?.domainPercents[OUTPUT_DOMAIN_ID] ?? null}
              comparable={gsqacOutput === output && comparable}
              comparing={applied}
              bars={gsqacOutput === output ? childBars(OUTPUT_DOMAIN_ID) : []}
              chartTitle={chartTitle}
              onDrill={() => navigate(`/app/domain/${OUTPUT_DOMAIN_ID}`)}
              onOpenChild={drillChild}
            />
          )}

          {/* Untracked Students — dedicated Teacher/Principal card (§1/§2): purple icon,
              untracked + re-enrolled counts, N+1 pill; drills to the role-aware detail. */}
          {isTP && user && (
            <UntrackedHomeCard
              role={user.role as "teacher" | "principal"}
              onOpen={() => navigate("/app/kpi/ret_dropout")}
            />
          )}
        </PageGrid>
      </PageSection>
      {/* PARAKH + board results moved into Assessment → district/state (§12). */}
    </ScreenContainer>
  );
}
