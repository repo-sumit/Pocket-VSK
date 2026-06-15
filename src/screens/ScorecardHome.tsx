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
import { scopedUntrackedStudents, UNTRACKED_SUMMARY } from "@/lib/rosterMock";
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
  const { user, entity, currentId, setScope, trail } = useScope();
  const sc = useScorecard(currentId);
  // Homepage cards are driven by the CURRENT VIEW LEVEL, not the login role, so a drilled
  // officer sees the same school/grade/section homepage a teacher/principal does (§1/§7).
  const atSchoolOrBelow = !!entity && (entity.level === "school" || entity.level === "grade" || entity.level === "section");
  // GSQAC is a school-level metric — at grade/section fall back to the NEAREST SCHOOL in
  // the scope trail (works whether the user logged in at the school or drilled into it, §3).
  const nearestSchoolId = atSchoolOrBelow ? (trail.find((e) => e.level === "school")?.id ?? null) : null;
  const schoolSc = useScorecard(nearestSchoolId);
  const childEntries = useChildLeaderboard(currentId);
  const fw = useFramework();
  const { childLevel, applied, selectedIds } = useCompare();
  const { t, tn } = useT();
  const navigate = useNavigate();

  if (!entity || !sc || !user) return null;

  const allInputs = sc.domainScores.filter((d) => d.domain.kind === "input" && d.records.length > 0);
  // At School/Grade/Section the "Administration" domain card is replaced by the dedicated
  // "Untracked Students" card (§2) for EVERY role; officers above school keep the full set.
  const inputs = atSchoolOrBelow ? allInputs.filter((d) => d.domain.id !== "administration") : allInputs;

  // School Quality (GSQAC): the current scope's output, else the nearest-school output so
  // the card never disappears at grade/section — for any role that reaches it (§3).
  const output = sc.domainScores.find((d) => d.domain.id === OUTPUT_DOMAIN_ID);
  const currentOutput = output && output.percent != null ? output : null;
  const schoolOutput = (() => {
    const o = schoolSc?.domainScores.find((d) => d.domain.id === OUTPUT_DOMAIN_ID);
    return o && o.percent != null ? o : null;
  })();
  const gsqacOutput = currentOutput ?? (atSchoolOrBelow ? schoolOutput : null);
  const gsqacSc = currentOutput ? sc : schoolSc;
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

  // Untracked Students card (§4) — shown at School/Grade/Section for EVERY role. The count
  // is scoped to the current level via the shared roster helper, so it matches the
  // ret_dropout detail (§8). The N+1 pill is the role benchmark, shown at school only
  // (suppressed at grade/section and for officers, who have no class/school benchmark).
  const untrackedCount = atSchoolOrBelow
    ? scopedUntrackedStudents(user.role, entity.level, entity.meta.grade_no ?? null, entity.meta.section_label ?? null).length
    : 0;
  const tpSummary = user.role === "teacher" || user.role === "principal" ? UNTRACKED_SUMMARY[user.role] : null;
  const untrackedCompare = tpSummary && entity.level === "school"
    ? { level: tpSummary.compareLevel, value: tpSummary.compareValue }
    : null;

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
            // Administration has no valid comparison at School/Grade/Section.
            const cardComparable = d.domain.id === "administration" ? comparable && !atSchoolOrBelow : comparable;
            return (
              <DomainInsightCard
                key={d.domain.id}
                ds={d}
                name={tn(d.domain.name, d.domain.name_gu)}
                level={entity.level}
                heroRec={hero}
                secondaryRec={secondary}
                parentName={parentName}
                comparable={cardComparable}
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

          {/* Untracked Students — shown at School/Grade/Section for every role (§1/§2/§4):
              purple icon, scope-scoped count + (school-level) N+1 pill; drills to the
              role-aware, privacy-respecting detail. */}
          {atSchoolOrBelow && (
            <UntrackedHomeCard
              count={untrackedCount}
              compare={untrackedCompare}
              onOpen={() => navigate("/app/kpi/ret_dropout")}
            />
          )}
        </PageGrid>
      </PageSection>
      {/* PARAKH + board results moved into Assessment → district/state (§12). */}
    </ScreenContainer>
  );
}
