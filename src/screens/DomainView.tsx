import { useNavigate, useParams } from "react-router-dom";
import { useScope, useScorecard } from "@/hooks";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { rag, accent } from "@/lib/colors";
import { pct } from "@/lib/format";
import { OUTPUT_DOMAIN_ID } from "@/config/frameworks";
import { GSQAC_DOMAINS } from "@/config/kpiCatalog";
import { Card, SectionLabel, Badge, ProgressBar, StatusDot } from "@/components/ui/atoms";
import { KpiCard } from "@/components/ui/KpiCard";
import { Icon, ArrowLeft, ChevronRight } from "@/components/ui/Icon";

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
      <div className="space-y-4 animate-fade-in">
        <BackBtn label={t("nav.home")} onClick={() => navigate("/app")} />
        <Card className="card-pad text-center text-sm text-neutral-500">{t("domain.noKpis")}</Card>
      </div>
    );
  }

  const a = accent(ds.domain.accent);
  const isOutput = ds.domain.id === OUTPUT_DOMAIN_ID;
  const gsqac = entity.meta.gsqac;

  return (
    <div className="space-y-5 animate-fade-in">
      <BackBtn label={t("nav.home")} onClick={() => navigate("/app")} />

      {/* domain header */}
      <Card className="card-pad">
        <div className="flex items-center gap-4">
          <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl", a.bg)}>
            <Icon name={ds.domain.icon} className={a.icon} size={26} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-extrabold text-neutral-900">{tn(ds.domain.name, ds.domain.name_gu)}</h1>
            <p className="text-xs text-neutral-400">
              {tn(entity.name, entity.name_gu)}
              {ds.domain.kind === "input" ? ` · ${t("common.weightage")} ${Math.round(ds.domain.weightage * 100)}%` : ` · ${t("scorecard.output")} · ${t("scorecard.annual")}`}
            </p>
          </div>
          <div className="text-right">
            {ds.percent == null ? (
              <span className="text-2xl font-extrabold text-rag-naText">{t("common.na")}</span>
            ) : (
              <span className={cn("text-3xl font-extrabold tnum", rag(ds.status).text)}>{pct(ds.percent, lang)}</span>
            )}
            <Badge status={ds.status} className="mt-1 !text-2xs">{t(`status.${ds.status}`)}</Badge>
          </div>
        </div>
        {ds.percent != null && <ProgressBar value={ds.percent} status={ds.status} className="mt-4" height={10} />}
      </Card>

      {/* OUTPUT: GSQAC D1-D5 breakdown (real) */}
      {isOutput && gsqac && (
        <Card className="card-pad">
          <SectionLabel>GSQAC · D1–D5 ({t("common.liveData")})</SectionLabel>
          <div className="mt-3 space-y-2.5">
            {GSQAC_DOMAINS.map((g) => {
              const v = gsqac.domains[g.key];
              return (
                <div key={g.key} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-xs font-semibold text-neutral-600" title={tn(g.name, g.name_gu)}>{g.key} · {tn(g.name, g.name_gu)}</span>
                  <ProgressBar value={(v ?? 0) * 100} status={(v ?? 0) * 100 >= 75 ? "green" : (v ?? 0) * 100 >= 50 ? "amber" : "red"} className="flex-1" />
                  <span className="w-12 shrink-0 text-right text-xs font-bold tnum text-neutral-700">{v == null ? t("common.na") : pct(v * 100, lang)}</span>
                </div>
              );
            })}
          </div>
          {gsqac.improvement != null && (
            <p className="mt-3 border-t border-line/60 pt-3 text-xs text-neutral-500">
              {t("scorecard.vsLastCycle")}: <b className={gsqac.improvement >= 0 ? "text-rag-greenText" : "text-rag-redText"}>{gsqac.improvement >= 0 ? "+" : ""}{gsqac.improvement}%</b>
            </p>
          )}
        </Card>
      )}

      {/* sub-domains (Administration) → tier-3 drill */}
      {ds.subScores.length > 0 ? (
        <div>
          <SectionLabel className="mb-2">{t("scorecard.subDomains")}</SectionLabel>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                <span className={cn("shrink-0 text-base font-extrabold tnum", ss.percent == null ? "text-rag-naText" : rag(ss.status).text)}>{ss.percent == null ? t("common.na") : pct(ss.percent, lang)}</span>
                <ChevronRight size={16} className="shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        // no sub-domains (Attendance / Assessment / School Quality) → indicators directly
        <div>
          <SectionLabel className="mb-2">{t("domain.kpisIn", { name: tn(ds.domain.name, ds.domain.name_gu) })}</SectionLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {ds.records.map((r) => (
              <KpiCard key={r.kpi.id} rec={r} name={tn(r.kpi.name, r.kpi.name_gu)} lang={lang} onClick={() => navigate(`/app/kpi/${r.kpi.id}`)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BackBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-primary-600">
      <ArrowLeft size={16} /> {label}
    </button>
  );
}
