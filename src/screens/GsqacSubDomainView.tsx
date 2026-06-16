import { useNavigate, useParams } from "react-router-dom";
import { useT } from "@/i18n";
import { useScope, useFramework } from "@/hooks";
import { gsqacSubdomainById } from "@/config/gsqac";
import { OUTPUT_DOMAIN_ID } from "@/config/frameworks";
import { Card } from "@/components/ui/atoms";
import { GsqacIndicatorCard } from "@/components/ui/GsqacCards";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { RouteBreadcrumb } from "@/components/layout/RouteBreadcrumb";
import { PageSection } from "@/components/layout/PageSection";

/**
 * GSQAC sub-domain page — indicator cards only. The sub-domain is already known from
 * the back link + title, so there is NO redundant top score summary card (§4). Each
 * indicator card shows its score and, after Compare is applied, its own grade-coloured
 * comparison chart; tapping opens the KPI detail page.
 */
export default function GsqacSubDomainView() {
  const { areaKey, subId } = useParams();
  const { entity } = useScope();
  const fw = useFramework();
  const { t, tn, lang } = useT();
  const navigate = useNavigate();
  const found = gsqacSubdomainById(subId);
  const sqDomain = fw.domains.find((d) => d.id === OUTPUT_DOMAIN_ID);
  const sqLabel = sqDomain ? tn(sqDomain.name, sqDomain.name_gu) : "School Quality";

  if (!found || found.area.key !== areaKey) {
    return (
      <ScreenContainer>
        <RouteBreadcrumb items={[{ label: t("nav.breadcrumbHome"), to: "/app" }, { label: sqLabel, to: "/app/domain/school_quality" }]} />
        <Card className="card-pad text-center text-sm text-neutral-500">{t("domain.noKpis")}</Card>
      </ScreenContainer>
    );
  }

  const { area, sub } = found;

  return (
    <ScreenContainer>
      <RouteBreadcrumb items={[{ label: t("nav.breadcrumbHome"), to: "/app" }, { label: sqLabel, to: "/app/domain/school_quality" }, { label: tn(area.name, area.name_gu), to: `/app/gsqac/${area.key}` }, { label: tn(sub.name, sub.name_gu ?? sub.name) }]} />
      {/* lightweight title only — not a score summary card */}
      <h1 className="pb-1 text-lg font-extrabold leading-snug text-neutral-900">{tn(sub.name, sub.name_gu ?? sub.name)}</h1>

      <PageSection title={t("scorecard.indicators")}>
        <div className="flex flex-col gap-2.5">
          {sub.indicators.map((ind) => (
            <GsqacIndicatorCard key={ind.id} indicator={ind} lang={lang} level={entity?.level} onOpen={() => navigate(`/app/kpi/${ind.id}`)} />
          ))}
        </div>
      </PageSection>
    </ScreenContainer>
  );
}
