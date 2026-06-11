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
  const { user, entity, currentId, setScope } = useScope();
  const sc = useScorecard(currentId);
  const childEntries = useChildLeaderboard(currentId);
  const fw = useFramework();
  const { childLevel, applied, selectedIds } = useCompare();
  const { t, tn } = useT();
  const navigate = useNavigate();

  if (!entity || !sc) return null;

  const inputs = sc.domainScores.filter((d) => d.domain.kind === "input" && d.records.length > 0);
  const output = sc.domainScores.find((d) => d.domain.id === OUTPUT_DOMAIN_ID);
  const parent = sc.parent;
  const parentName = parent ? tn(parent.entity.name, parent.entity.name_gu) : undefined;
  const levelLabel = t(`levels.${entity.level}`);

  const greeting = t(`greeting.${greetingKey()}`);
  const displayName = user ? tn(user.name, user.name_gu) || t(`roles.${user.role}`) : "";

  const statusOf = (v: number | null): RagStatus => (v == null ? "na" : statusFromGrade(gradeFor(v, fw.rating_bands).group));
  const selectedSet = new Set(selectedIds);

  // the domain score across the SELECTED child units, lowest (worst) first
  const childBars = (domainId: string): ChildBar[] =>
    childEntries
      .filter((en) => selectedSet.has(en.entity.id))
      .map((en) => {
        const value = en.domainPercents?.[domainId] ?? null;
        return { id: en.entity.id, label: tn(en.entity.name, en.entity.name_gu), value, status: statusOf(value) };
      })
      .filter((b) => b.value != null)
      .sort((a, b) => (a.value as number) - (b.value as number));

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
            return (
              <DomainInsightCard
                key={d.domain.id}
                ds={d}
                name={tn(d.domain.name, d.domain.name_gu)}
                level={entity.level}
                heroRec={hero}
                parentName={parentName}
                comparable={comparable}
                comparing={applied}
                bars={childBars(d.domain.id)}
                chartTitle={chartTitle}
                onDrill={() => navigate(`/app/domain/${d.domain.id}`)}
                onOpenChild={drillChild}
              />
            );
          })}

          {/* School Quality (GSQAC) — hidden where it isn't tracked (grade/section → NA),
              so a teacher's Grade/Section view shows only Attendance + Assessment. */}
          {output && output.percent != null && (
            <DomainInsightCard
              ds={output}
              name={tn(output.domain.name, output.domain.name_gu)}
              level={entity.level}
              parentName={parentName}
              gsqacImprovement={entity.meta.gsqac?.improvement ?? null}
              outputPercent={output.percent}
              parentPercent={parent?.domainPercents[OUTPUT_DOMAIN_ID] ?? null}
              comparable={comparable}
              comparing={applied}
              bars={childBars(OUTPUT_DOMAIN_ID)}
              chartTitle={chartTitle}
              onDrill={() => navigate(`/app/domain/${OUTPUT_DOMAIN_ID}`)}
              onOpenChild={drillChild}
            />
          )}
        </PageGrid>
      </PageSection>
    </ScreenContainer>
  );
}
