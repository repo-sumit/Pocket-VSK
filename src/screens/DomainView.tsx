import { useNavigate, useParams } from "react-router-dom";
import { useScope, useScorecard } from "@/hooks";
import { useT } from "@/i18n";
import { useCompare } from "@/components/compare/CompareContext";
import { studentRetentionVisible, RETENTION_SUBDOMAIN_ID } from "@/lib/displayPolicy";
import { scopedAbsentStudents } from "@/lib/rosterMock";
import { GSQAC_AREAS } from "@/config/gsqac";
import { Card, StatusDot } from "@/components/ui/atoms";
import { KpiCardAuto } from "@/components/ui/MultiMetricKpiCard";
import { BalancedKpiGrid, getKpiCardLayoutWeight } from "@/components/ui/BalancedKpiGrid";
import { GsqacGradeLegend } from "@/components/ui/GsqacGradeLegend";
import { GsqacAreaCard } from "@/components/ui/GsqacCards";
import { CardChevron } from "@/components/ui/kpiCardParts";
import { ParakhSurveyCard } from "@/components/ui/ParakhSurveyCard";
import { BoardCard } from "@/components/ui/ParakhCards";
import { BOARD_RESULTS } from "@/config/parakh";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { RouteBreadcrumb } from "@/components/layout/RouteBreadcrumb";
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
  const { entity, currentId, user } = useScope();
  const sc = useScorecard(currentId);
  const { t, tn, lang } = useT();
  const { applied: compareApplied } = useCompare();
  const navigate = useNavigate();

  if (!sc || !entity) return null;
  const ds = sc.domainScores.find((d) => d.domain.id === domainId);
  const isGsqac = ds?.domain.kind === "output";
  // GSQAC area cards come from the static GSQAC_AREAS config (not ds.records), so the
  // School Quality page must still render at grade/section — even though the sq_* KPIs
  // are school-and-above and get filtered out there, leaving ds.records empty (§2).
  if (!ds || (!isGsqac && ds.records.length === 0)) {
    return (
      <ScreenContainer>
        <RouteBreadcrumb items={[{ label: t("nav.breadcrumbHome"), to: "/app" }]} />
        <Card className="card-pad text-center text-sm text-neutral-500">{t("domain.noKpis")}</Card>
      </ScreenContainer>
    );
  }

  const parentName = sc.parent ? tn(sc.parent.entity.name, sc.parent.entity.name_gu) : undefined;
  // §12/§24 — PARAKH + board results live INSIDE Assessment, for district/state only.
  const isAssessment = ds.domain.id === "assessment";
  const isDistrictState = entity.level === "district" || entity.level === "state";
  // Student Retention is date-gated (visible Oct 1 → AY end); demo keeps it visible.
  const visibleSubs = ds.subScores.filter((ss) => ss.sub.id !== RETENTION_SUBDOMAIN_ID || studentRetentionVisible());

  return (
    <ScreenContainer>
      <RouteBreadcrumb items={[{ label: t("nav.breadcrumbHome"), to: "/app" }, { label: tn(ds.domain.name, ds.domain.name_gu) }]} />

      {isGsqac ? (
        /* ── School Quality (GSQAC) — area cards only (no redundant overall card, §2) ── */
        <>
          <PageSection title={t("gsqac.areas")}>
            <PageGrid cols="domain">
              {GSQAC_AREAS.map((a) => (
                <GsqacAreaCard key={a.key} area={a} lang={lang} level={entity.level} onOpen={() => navigate(`/app/gsqac/${a.key}`)} />
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
                <CardChevron />
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
            renderItem={(r) => {
              // att_chronic (Students absent 7+ days) count is roster-canonical at
              // school/grade/section so this card matches the home card + detail (§4) and
              // is always a whole number; the provider aggregate is kept at cluster+.
              const atSchoolOrBelow = entity.level === "school" || entity.level === "grade" || entity.level === "section";
              const rec = atSchoolOrBelow && r.kpi.id === "att_chronic" && user
                ? { ...r, value: scopedAbsentStudents(user.role, entity.level, entity.meta.grade_no ?? null, entity.meta.section_label ?? null).length }
                : r;
              return (
                <KpiCardAuto
                  rec={rec}
                  name={tn(r.kpi.name, r.kpi.name_gu)}
                  lang={lang}
                  level={entity.level}
                  parentName={parentName}
                  currentId={currentId}
                  role={user?.role}
                  onClick={() => navigate(`/app/kpi/${r.kpi.id}`)}
                />
              );
            }}
          />
          {/* §12/§13 — PARAKH + board results as continuous Assessment cards (no
              separate "District Focus" / "Other assessments" heading, §7). */}
          {isAssessment && isDistrictState && (
            <PageGrid cols="domain" className="mt-3">
              {/* PARAKH — district only (§3); compact card, opens the Parakh KPI detail. */}
              {entity.level === "district" && (
                <ParakhSurveyCard onOpen={() => navigate("/app/kpi/assessment_parakh")} />
              )}
              {BOARD_RESULTS.map((b) => (
                <BoardCard key={b.id} board={b} onOpen={() => navigate(`/app/kpi/${b.id}`)} />
              ))}
            </PageGrid>
          )}
        </PageSection>
      )}
    </ScreenContainer>
  );
}
