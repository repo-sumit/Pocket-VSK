import { useNavigate, useParams } from "react-router-dom";
import { useT } from "@/i18n";
import { useScope } from "@/hooks";
import { gsqacAreaByKey } from "@/config/gsqac";
import { Card } from "@/components/ui/atoms";
import { GsqacSubdomainCard } from "@/components/ui/GsqacCards";
import { GsqacGradeLegend } from "@/components/ui/GsqacGradeLegend";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { BackLink } from "@/components/layout/PageHeader";
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
  const { t, tn, lang } = useT();
  const navigate = useNavigate();
  const area = gsqacAreaByKey(areaKey);

  if (!area) {
    return (
      <ScreenContainer>
        <BackLink label={t("scorecard.gsqacScore")} onClick={() => navigate("/app/domain/school_quality")} />
        <Card className="card-pad text-center text-sm text-neutral-500">{t("domain.noKpis")}</Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <BackLink label={t("scorecard.gsqacScore")} onClick={() => navigate("/app/domain/school_quality")} />
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
