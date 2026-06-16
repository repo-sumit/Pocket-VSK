import { useNavigate, useParams } from "react-router-dom";
import { useT } from "@/i18n";
import { useScope, useFramework } from "@/hooks";
import { gsqacAreaByKey } from "@/config/gsqac";
import { OUTPUT_DOMAIN_ID } from "@/config/frameworks";
import { Card } from "@/components/ui/atoms";
import { GsqacSubdomainCard } from "@/components/ui/GsqacCards";
import { GsqacGradeLegend } from "@/components/ui/GsqacGradeLegend";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { RouteBreadcrumb } from "@/components/layout/RouteBreadcrumb";
import { PageSection } from "@/components/layout/PageSection";

/**
 * GSQAC area page — sub-domain cards only. The area is already known from the back
 * link + title, so there is NO redundant top score/comparison summary card (§3).
 * Each sub-domain card shows its score/grade/indicator-count and, after Compare is
 * applied, its own grade-coloured comparison chart.
 */
export default function GsqacAreaView() {
  const { areaKey } = useParams();
  const { entity } = useScope();
  const fw = useFramework();
  const { t, tn, lang } = useT();
  const navigate = useNavigate();
  const area = gsqacAreaByKey(areaKey);
  const sqDomain = fw.domains.find((d) => d.id === OUTPUT_DOMAIN_ID);
  const sqLabel = sqDomain ? tn(sqDomain.name, sqDomain.name_gu) : "School Quality";

  if (!area) {
    return (
      <ScreenContainer>
        <RouteBreadcrumb items={[{ label: t("nav.breadcrumbHome"), to: "/app" }, { label: sqLabel, to: "/app/domain/school_quality" }]} />
        <Card className="card-pad text-center text-sm text-neutral-500">{t("domain.noKpis")}</Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <RouteBreadcrumb items={[{ label: t("nav.breadcrumbHome"), to: "/app" }, { label: sqLabel, to: "/app/domain/school_quality" }, { label: tn(area.name, area.name_gu) }]} />
      {/* lightweight title only — not a score summary card */}
      <h1 className="pb-1 text-lg font-extrabold leading-snug text-neutral-900">{tn(area.name, area.name_gu)}</h1>

      <PageSection title={t("scorecard.subDomains")}>
        <p className="-mt-1 mb-2 text-2xs text-neutral-400">{t("gsqac.selectSub")}</p>
        <div className="flex flex-col gap-2.5">
          {area.subdomains.map((sub) => (
            <GsqacSubdomainCard
              key={sub.id}
              sub={sub}
              lang={lang}
              level={entity?.level}
              onOpen={() => navigate(`/app/gsqac/${area.key}/${sub.id}`)}
            />
          ))}
        </div>
      </PageSection>

      <GsqacGradeLegend />
    </ScreenContainer>
  );
}
