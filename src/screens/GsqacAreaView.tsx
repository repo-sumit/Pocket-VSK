import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/cn";
import { rag } from "@/lib/colors";
import { locNum } from "@/lib/format";
import { useT } from "@/i18n";
import { gsqacAreaByKey, gsqacGrade, gsqacStatus } from "@/config/gsqac";
import { Card } from "@/components/ui/atoms";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { GsqacSubdomainCard, GsqacCompareSection } from "@/components/ui/GsqacCards";
import { GsqacGradeLegend } from "@/components/ui/GsqacGradeLegend";
import { ChildComparisonBars, type ChildBar } from "@/components/ui/ComparisonBars";
import { useCompare } from "@/components/compare/CompareContext";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { BackLink } from "@/components/layout/PageHeader";
import { PageSection } from "@/components/layout/PageSection";

/**
 * GSQAC area drilldown (§14) — School Quality area → sub-domain score cards →
 * tap a sub-domain to reveal its indicator list (scores, no trend). Header shows
 * the area score, grade and marks (the school headline), plus a District·State
 * reference comparison — the school is the headline, so it isn't repeated as a
 * bar. All values are the deterministic GSQAC demo dataset (config/gsqac).
 */
export default function GsqacAreaView() {
  const { areaKey } = useParams();
  const { t, tn, lang } = useT();
  const { applied: compareApplied } = useCompare();
  const navigate = useNavigate();
  const area = gsqacAreaByKey(areaKey);

  if (!area) {
    return (
      <ScreenContainer>
        <BackLink label={t("nav.home")} onClick={() => navigate("/app/domain/school_quality")} />
        <Card className="card-pad text-center text-sm text-neutral-500">{t("domain.noKpis")}</Card>
      </ScreenContainer>
    );
  }

  const c = rag(gsqacStatus(area.percent));
  const grade = gsqacGrade(area.percent);
  // School (current entity) is already the headline above, so the comparison chart
  // shows only the reference bars (District · State) — no redundant "School" bar (§14).
  const cmpBars: ChildBar[] = [
    { id: "district", label: t("gsqac.district"), value: area.compare.district, status: gsqacStatus(area.compare.district) },
    { id: "state", label: t("gsqac.state"), value: area.compare.state, status: gsqacStatus(area.compare.state) },
  ];

  return (
    <ScreenContainer>
      <BackLink label={t("scorecard.gsqacScore")} onClick={() => navigate("/app/domain/school_quality")} />

      {/* area headline — score · grade · marks */}
      <Card className="card-pad">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold leading-snug text-neutral-900">{tn(area.name, area.name_gu)}</h1>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className={cn("text-3xl font-extrabold tnum leading-none", c.text)}>{locNum(area.percent, lang)}%</span>
              <span className="text-xs font-semibold text-neutral-500 tnum">{t("gsqac.outOf", { got: locNum(area.got, lang), max: locNum(area.max, lang) })}</span>
            </div>
          </div>
          <RatingBadge grade={grade} size="lg" className="shrink-0" />
        </div>
        {/* §7 — before Compare: static District·State reference. After Compare: the
            selected N-1 child units (no redundant current-entity bar either way). */}
        {!compareApplied && (
          <div className="mt-3 border-t border-line/60 pt-3">
            <ChildComparisonBars title={t("gsqac.comparison")} bars={cmpBars} unit="%" lang={lang} maxValue={100} noSort />
          </div>
        )}
        <GsqacCompareSection seedKey={area.key} base={area.percent} lang={lang} />
      </Card>

      {/* sub-domain score cards → tap to reveal indicators */}
      <PageSection title={t("scorecard.subDomains")}>
        <p className="-mt-1 mb-2 text-2xs text-neutral-400">{t("gsqac.selectSub")}</p>
        <div className="flex flex-col gap-2.5">
          {area.subdomains.map((sub) => (
            <GsqacSubdomainCard
              key={sub.id}
              sub={sub}
              lang={lang}
              onOpen={() => navigate(`/app/gsqac/${area.key}/${sub.id}`)}
            />
          ))}
        </div>
      </PageSection>

      <GsqacGradeLegend />
    </ScreenContainer>
  );
}
