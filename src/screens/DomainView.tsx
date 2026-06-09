import { useNavigate, useParams } from "react-router-dom";
import { useScope, useScorecard } from "@/hooks";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { accent, valueToneClass } from "@/lib/colors";
import { pct } from "@/lib/format";
import { Card, ProgressBar, StatusDot } from "@/components/ui/atoms";
import { ValueDisplay } from "@/components/ui/ValueDisplay";
import { KpiCard } from "@/components/ui/KpiCard";
import { Icon, ChevronRight } from "@/components/ui/Icon";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { BackLink } from "@/components/layout/PageHeader";
import { PageSection, PageGrid } from "@/components/layout/PageSection";

/**
 * Domain view — tier 2 of the 3-click drill.
 *  • Administration (has sub-domains) → sub-domain cards → SubDomainView → indicators.
 *  • Attendance / Assessment (no sub-domains) → indicators directly (2 taps).
 *  • School Quality (output) → GSQAC score + D1-D5 breakdown + indicators.
 */
export default function DomainView() {
  const { domainId } = useParams();
  const { entity, currentId } = useScope();
  const sc = useScorecard(currentId);
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

  const a = accent(ds.domain.accent);
  const parentName = sc.parent ? tn(sc.parent.entity.name, sc.parent.entity.name_gu) : undefined;

  return (
    <ScreenContainer>
      <BackLink label={t("nav.home")} onClick={() => navigate("/app")} />

      {/* domain header */}
      <Card className="card-pad">
        <div className="flex items-center gap-4">
          <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl", a.bg)}>
            <Icon name={ds.domain.icon} className={a.icon} size={26} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-extrabold text-neutral-900">{tn(ds.domain.name, ds.domain.name_gu)}</h1>
            <p className="truncate text-xs text-neutral-400">
              {tn(entity.name, entity.name_gu)}
              {ds.domain.kind === "output" ? ` · ${t("scorecard.output")} · ${t("scorecard.annual")}` : ""}
            </p>
          </div>
          <ValueDisplay value={ds.percent} unit="%" status={ds.status} lang={lang} size="lg" naLabel={t("common.na")} className="shrink-0" />
        </div>
        {ds.percent != null && <ProgressBar value={ds.percent} status={ds.status} className="mt-4" height={10} />}
      </Card>

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
        // no sub-domains (Attendance / Assessment / School Quality) → indicators directly
        <PageSection title={t("domain.kpisIn", { name: tn(ds.domain.name, ds.domain.name_gu) })}>
          <PageGrid cols="kpi">
            {ds.records.map((r) => (
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
