import { useNavigate, useParams } from "react-router-dom";
import { useScope, useScorecard } from "@/hooks";
import { useT } from "@/i18n";
import { useCompare } from "@/components/compare/CompareContext";
import { Card } from "@/components/ui/atoms";
import { KpiCardAuto } from "@/components/ui/MultiMetricKpiCard";
import { BalancedKpiGrid, getKpiCardLayoutWeight } from "@/components/ui/BalancedKpiGrid";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { BackLink } from "@/components/layout/PageHeader";
import { PageSection } from "@/components/layout/PageSection";

/** Sub-domain view — tier 3 of the 3-click drill (Domain › Sub-domain › Indicators). */
export default function SubDomainView() {
  const { domainId, subId } = useParams();
  const { entity, currentId, user } = useScope();
  const sc = useScorecard(currentId);
  const { t, tn, lang } = useT();
  const { applied: compareApplied } = useCompare();
  const navigate = useNavigate();

  if (!sc) return null;
  const ds = sc.domainScores.find((d) => d.domain.id === domainId);
  const ss = ds?.subScores.find((s) => s.sub.id === subId);
  if (!ds || !ss) {
    return (
      <ScreenContainer>
        <BackLink label={ds ? tn(ds.domain.name, ds.domain.name_gu) : t("nav.home")} onClick={() => navigate(`/app/domain/${domainId}`)} />
        <Card className="card-pad text-center text-sm text-neutral-500">{t("domain.noKpis")}</Card>
      </ScreenContainer>
    );
  }

  const parentName = sc.parent ? tn(sc.parent.entity.name, sc.parent.entity.name_gu) : undefined;

  return (
    <ScreenContainer>
      <BackLink label={tn(ds.domain.name, ds.domain.name_gu)} onClick={() => navigate(`/app/domain/${domainId}`)} />

      <PageSection title={t("scorecard.indicators")}>
        <BalancedKpiGrid
          items={ss.records}
          getKey={(r) => r.kpi.id}
          getWeight={(r) => getKpiCardLayoutWeight(r.kpi, compareApplied)}
          renderItem={(r) => (
            <KpiCardAuto
              rec={r}
              name={tn(r.kpi.name, r.kpi.name_gu)}
              lang={lang}
              level={entity?.level}
              parentName={parentName}
              currentId={currentId}
              role={user?.role}
              onClick={() => navigate(`/app/kpi/${r.kpi.id}`)}
            />
          )}
        />
      </PageSection>
    </ScreenContainer>
  );
}
