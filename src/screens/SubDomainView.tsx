import { useNavigate, useParams } from "react-router-dom";
import { useScope, useScorecard } from "@/hooks";
import { useT } from "@/i18n";
import { Card, ProgressBar } from "@/components/ui/atoms";
import { ValueDisplay } from "@/components/ui/ValueDisplay";
import { KpiCard } from "@/components/ui/KpiCard";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { BackLink } from "@/components/layout/PageHeader";
import { PageSection, PageGrid } from "@/components/layout/PageSection";

/** Sub-domain view — tier 3 of the 3-click drill (Domain › Sub-domain › Indicators). */
export default function SubDomainView() {
  const { domainId, subId } = useParams();
  const { entity, currentId } = useScope();
  const sc = useScorecard(currentId);
  const { t, tn, lang } = useT();
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

      <Card className="card-pad">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xs font-semibold uppercase tracking-wide text-neutral-400">{tn(ds.domain.name, ds.domain.name_gu)}</p>
            <h1 className="truncate text-lg font-extrabold text-neutral-900">{tn(ss.sub.name, ss.sub.name_gu)}</h1>
          </div>
          <ValueDisplay value={ss.percent} unit="%" status={ss.status} lang={lang} size="lg" naLabel={t("common.na")} className="shrink-0" />
        </div>
        {ss.percent != null && <ProgressBar value={ss.percent} status={ss.status} className="mt-4" height={10} />}
      </Card>

      <PageSection title={t("scorecard.indicators")}>
        <PageGrid cols="kpi">
          {ss.records.map((r) => (
            <KpiCard
              key={r.kpi.id}
              rec={r}
              name={tn(r.kpi.name, r.kpi.name_gu)}
              lang={lang}
              level={entity?.level}
              parentName={parentName}
              onClick={() => navigate(`/app/kpi/${r.kpi.id}`)}
            />
          ))}
        </PageGrid>
      </PageSection>
    </ScreenContainer>
  );
}
