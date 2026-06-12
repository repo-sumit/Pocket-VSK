import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/cn";
import { rag } from "@/lib/colors";
import { locNum } from "@/lib/format";
import { useT } from "@/i18n";
import { gsqacSubdomainById, gsqacGrade, gsqacStatus } from "@/config/gsqac";
import { Card } from "@/components/ui/atoms";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { GsqacIndicatorCard } from "@/components/ui/GsqacCards";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { BackLink } from "@/components/layout/PageHeader";
import { PageSection } from "@/components/layout/PageSection";

/**
 * GSQAC sub-domain page — tier-4 of the School Quality drill (Domain → Area →
 * Sub-domain → Indicators). Header shows the sub-domain score/grade; each indicator
 * is its own card (score · chevron) that supports embedded Compare and drills to the
 * KPI detail page. Self-contained GSQAC demo dataset (config/gsqac).
 */
export default function GsqacSubDomainView() {
  const { areaKey, subId } = useParams();
  const { t, tn, lang } = useT();
  const navigate = useNavigate();
  const found = gsqacSubdomainById(subId);

  if (!found || found.area.key !== areaKey) {
    return (
      <ScreenContainer>
        <BackLink label={t("scorecard.gsqacScore")} onClick={() => navigate("/app/domain/school_quality")} />
        <Card className="card-pad text-center text-sm text-neutral-500">{t("domain.noKpis")}</Card>
      </ScreenContainer>
    );
  }

  const { area, sub } = found;
  const c = rag(gsqacStatus(sub.score));
  const grade = gsqacGrade(sub.score);
  const n = sub.indicators.length;

  return (
    <ScreenContainer>
      <BackLink label={tn(area.name, area.name_gu)} onClick={() => navigate(`/app/gsqac/${area.key}`)} />

      {/* sub-domain headline — score · grade · indicator count */}
      <Card className="card-pad">
        <h1 className="text-lg font-extrabold leading-snug text-neutral-900">{tn(sub.name, sub.name_gu ?? sub.name)}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
          <span className={cn("text-3xl font-extrabold tnum leading-none", c.text)}>{locNum(sub.score, lang)}%</span>
          <RatingBadge grade={grade} size="md" />
          <span className="text-2xs font-medium text-neutral-400">{locNum(n, lang)} {t("scorecard.indicators")}</span>
        </div>
      </Card>

      {/* one card per indicator → KPI detail; Compare bars appear inside after Apply */}
      <PageSection title={t("scorecard.indicators")}>
        <div className="flex flex-col gap-2.5">
          {sub.indicators.map((ind) => (
            <GsqacIndicatorCard key={ind.id} indicator={ind} lang={lang} onOpen={() => navigate(`/app/kpi/${ind.id}`)} />
          ))}
        </div>
      </PageSection>
    </ScreenContainer>
  );
}
