import { useNavigate, useParams } from "react-router-dom";
import { useScope, useScorecard } from "@/hooks";
import { useT } from "@/i18n";
import { useCompare } from "@/components/compare/CompareContext";
import { studentRetentionVisible, RETENTION_SUBDOMAIN_ID } from "@/lib/displayPolicy";
import { GSQAC_AREAS } from "@/config/gsqac";
import { Card, StatusDot } from "@/components/ui/atoms";
import { KpiCardAuto } from "@/components/ui/MultiMetricKpiCard";
import { BalancedKpiGrid, getKpiCardLayoutWeight } from "@/components/ui/BalancedKpiGrid";
import { GsqacGradeLegend } from "@/components/ui/GsqacGradeLegend";
import { GsqacOverallCard, GsqacAreaCard } from "@/components/ui/GsqacCards";
import { ChevronRight } from "@/components/ui/Icon";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { BackLink } from "@/components/layout/PageHeader";
import { PageSection, PageGrid } from "@/components/layout/PageSection";

/**
 * Domain view — tier 2 of the 3-click drill. Back link → indicator section.
 *  • School Quality (GSQAC output) shows the overall score card + GSQAC AREA
 *    score cards (drill into Area → Sub-domain → Indicators), not operational KPI cards.
 *  • Administration shows its sub-domains first (Student Retention gated by date).
 *  • Other domains list their indicator cards in a balanced two-column grid.
 * The n-1 child comparison lives INSIDE each KPI card (Compare action).
 */
export default function DomainView() {
  const { domainId } = useParams();
  const { entity, currentId } = useScope();
  const sc = useScorecard(currentId);
  const { t, tn, lang } = useT();
  const { applied: compareApplied } = useCompare();
  const navigate = useNavigate();

  if (!sc || !entity) return null;
  const ds = sc.domainScores.find((d) => d.domain.id === domainId);
  if (!ds || ds.records.length === 0) {
    return (
      <ScreenContainer>
        <BackLink label={t("nav.home")} onClick={() => navigate("/app")} />
        <Card className="card-pad text-center text-sm text-neutral-500">{t("domain.noKpis")}</Card>
      </ScreenContainer>
    );
  }

  const parentName = sc.parent ? tn(sc.parent.entity.name, sc.parent.entity.name_gu) : undefined;
  const isGsqac = ds.domain.kind === "output";
  // Student Retention is date-gated (visible Oct 1 → AY end); demo keeps it visible.
  const visibleSubs = ds.subScores.filter((ss) => ss.sub.id !== RETENTION_SUBDOMAIN_ID || studentRetentionVisible());

  return (
    <ScreenContainer>
      <BackLink label={t("nav.home")} onClick={() => navigate("/app")} />

      {isGsqac ? (
        /* ── School Quality (GSQAC) — score-card drilldown ── */
        <>
          <GsqacOverallCard lang={lang} />
          <PageSection title={t("gsqac.areas")}>
            <PageGrid cols="domain">
              {GSQAC_AREAS.map((a) => (
                <GsqacAreaCard key={a.key} area={a} lang={lang} onOpen={() => navigate(`/app/gsqac/${a.key}`)} />
              ))}
            </PageGrid>
          </PageSection>
          <GsqacGradeLegend />
        </>
      ) : visibleSubs.length > 0 ? (
        /* ── Administration — sub-domain nav → tier-3 drill ── */
        <PageSection title={t("scorecard.subDomains")}>
          <PageGrid cols="two" className="gap-2">
            {visibleSubs.map((ss) => (
              <button
                key={ss.sub.id}
                onClick={() => navigate(`/app/domain/${ds.domain.id}/${ss.sub.id}`)}
                className="group flex items-center gap-3 rounded-xl border border-line/70 bg-white px-3 py-3 text-left hover:bg-neutral-50"
              >
                <StatusDot status={ss.status} className="mt-0.5" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-neutral-900">{tn(ss.sub.name, ss.sub.name_gu)}</span>
                  <span className="text-2xs text-neutral-400">{ss.records.length} {t("scorecard.indicators")}</span>
                </span>
                <ChevronRight size={16} className="shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </PageGrid>
        </PageSection>
      ) : (
        /* ── Indicator listing (balanced two-column grid) ── */
        <PageSection title={t("domain.kpisIn", { name: tn(ds.domain.name, ds.domain.name_gu) })}>
          <BalancedKpiGrid
            items={ds.records}
            getKey={(r) => r.kpi.id}
            getWeight={(r) => getKpiCardLayoutWeight(r.kpi, compareApplied)}
            renderItem={(r) => (
              <KpiCardAuto
                rec={r}
                name={tn(r.kpi.name, r.kpi.name_gu)}
                lang={lang}
                level={entity.level}
                parentName={parentName}
                currentId={currentId}
                onClick={() => navigate(`/app/kpi/${r.kpi.id}`)}
              />
            )}
          />
        </PageSection>
      )}
    </ScreenContainer>
  );
}
