import { useNavigate, useParams } from "react-router-dom";
import type { DomainScore } from "@/types";
import { useScope, useScorecard, useScopeStats } from "@/hooks";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { valueToneClass } from "@/lib/colors";
import { pct } from "@/lib/format";
import { Card, StatusDot } from "@/components/ui/atoms";
import { KpiCard } from "@/components/ui/KpiCard";
import { DomainSummaryCard } from "@/components/ui/DomainSummaryCard";
import { GsqacSummaryCard } from "@/components/ui/GsqacSummaryCard";
import { ChevronRight } from "@/components/ui/Icon";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { BackLink } from "@/components/layout/PageHeader";
import { PageSection, PageGrid } from "@/components/layout/PageSection";

/**
 * Domain view — tier 2 of the 3-click drill. The top card uses the same grammar
 * as the homepage domain cards (expanded "page" variant), so the two are one
 * family. School Quality uses the GSQAC output card; its D1–D5 breakdown shows as
 * the indicator cards below (only after drilling in).
 */
export default function DomainView() {
  const { domainId } = useParams();
  const { entity, currentId } = useScope();
  const sc = useScorecard(currentId);
  const stats = useScopeStats(currentId);
  const { t, tn, lang } = useT();
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

  const isOutput = ds.domain.kind === "output";
  const parentName = sc.parent ? tn(sc.parent.entity.name, sc.parent.entity.name_gu) : undefined;
  const parentPercent = sc.parent?.domainPercents[ds.domain.id] ?? null;
  const gsqacCoverage = stats && stats.schools > 0 && stats.gsqacReal < stats.schools ? stats : null;
  // GSQAC overall is the top card; D1–D5 are the breakdown cards below (no duplicate sq_gsqac tile)
  const records = isOutput ? ds.records.filter((r) => r.kpi.id !== "sq_gsqac") : ds.records;

  const domainWoW = (d: DomainScore) => {
    const xs = d.records.filter((r) => r.kpi.unit === "%" || r.kpi.unit === "score").map((r) => r.deltaWoW).filter((v): v is number => v != null);
    return xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null;
  };

  return (
    <ScreenContainer>
      <BackLink label={t("nav.home")} onClick={() => navigate("/app")} />

      {/* domain header — same card grammar as the homepage */}
      {isOutput ? (
        <GsqacSummaryCard
          output={ds}
          gsqac={entity.meta.gsqac}
          coverage={gsqacCoverage ? { real: gsqacCoverage.gsqacReal, total: gsqacCoverage.schools } : null}
          parentName={parentName}
          parentPercent={parentPercent}
        />
      ) : (
        <DomainSummaryCard
          ds={ds}
          variant="page"
          name={tn(ds.domain.name, ds.domain.name_gu)}
          scopeName={tn(entity.name, entity.name_gu)}
          delta={domainWoW(ds)}
          parentName={parentName}
          parentPercent={parentPercent}
        />
      )}

      {/* sub-domains (Administration) → tier-3 drill */}
      {ds.subScores.length > 0 ? (
        <PageSection title={t("scorecard.subDomains")}>
          <PageGrid cols="two" className="gap-2">
            {ds.subScores.map((ss) => (
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
                <span className={cn("shrink-0 text-base font-extrabold tnum", ss.percent == null ? "text-rag-naText" : valueToneClass(ss.status))}>{ss.percent == null ? t("common.na") : pct(ss.percent, lang)}</span>
                <ChevronRight size={16} className="shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </PageGrid>
        </PageSection>
      ) : (
        <PageSection title={t("domain.kpisIn", { name: tn(ds.domain.name, ds.domain.name_gu) })}>
          <PageGrid cols="kpi">
            {records.map((r) => (
              <KpiCard
                key={r.kpi.id}
                rec={r}
                name={tn(r.kpi.name, r.kpi.name_gu)}
                lang={lang}
                level={entity.level}
                parentName={parentName}
                onClick={() => navigate(`/app/kpi/${r.kpi.id}`)}
              />
            ))}
          </PageGrid>
        </PageSection>
      )}
    </ScreenContainer>
  );
}
