import { useNavigate, useParams } from "react-router-dom";
import { useScope, useScorecard } from "@/hooks";
import { statusFromScore } from "@/engine";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { rag, accent } from "@/lib/colors";
import { pct } from "@/lib/format";
import { Card, SectionLabel, Badge, ProgressBar } from "@/components/ui/atoms";
import { KpiCard } from "@/components/ui/KpiCard";
import { Icon, ArrowLeft } from "@/components/ui/Icon";

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
        <button onClick={() => navigate("/app")} className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-primary-600">
          <ArrowLeft size={16} /> {t("nav.home")}
        </button>
        <Card className="card-pad text-center text-sm text-neutral-500">{t("domain.noKpis")}</Card>
      </div>
    );
  }

  const a = accent(ds.domain.accent);
  const gsqac = ds.domain.id === "a5" ? entity.meta.gsqac : undefined;
  const subs = ds.domain.sub_domains ?? [];

  return (
    <div className="space-y-5 animate-fade-in">
      <button onClick={() => navigate("/app")} className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-primary-600">
        <ArrowLeft size={16} /> {t("nav.home")}
      </button>

      {/* domain header */}
      <Card className="card-pad">
        <div className="flex items-center gap-4">
          <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl", a.bg)}>
            <Icon name={ds.domain.icon} className={a.icon} size={26} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-extrabold text-neutral-900">{tn(ds.domain.name, ds.domain.name_gu)}</h1>
            <p className="text-xs text-neutral-400">{tn(entity.name, entity.name_gu)} · {t("common.weightage")} {Math.round(ds.domain.weightage * 100)}%</p>
          </div>
          <div className="text-right">
            {ds.percent == null ? (
              <span className="text-2xl font-extrabold text-rag-naText">NA</span>
            ) : (
              <span className={cn("text-3xl font-extrabold tnum", rag(ds.status).text)}>{pct(ds.percent, lang)}</span>
            )}
            <Badge status={ds.status} className="mt-1 !text-2xs">{t(`status.${ds.status}`)}</Badge>
          </div>
        </div>
        {ds.percent != null && <ProgressBar value={ds.percent} status={ds.status} className="mt-4" height={10} />}
      </Card>

      {/* real GSQAC sub-domain breakdown (live data) */}
      {gsqac && (
        <Card className="card-pad">
          <SectionLabel>GSQAC · D1–D5 ({t("common.liveData")})</SectionLabel>
          <div className="mt-3 space-y-2.5">
            {Object.entries(gsqac.domains).map(([d, v]) => (
              <div key={d} className="flex items-center gap-3">
                <span className="w-8 text-xs font-bold text-neutral-500">{d}</span>
                <ProgressBar value={v as number} status={statusFromScore(v as number)} className="flex-1" />
                <span className="w-12 text-right text-xs font-bold tnum text-neutral-700">{pct(v as number, lang)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* KPIs — grouped by sub-domain when the 3-tier seam is configured */}
      {subs.length > 0 ? (
        <div className="space-y-5">
          {subs.map((sub) => {
            const recs = ds.records.filter((r) => r.kpi.sub_domain === sub.id);
            if (!recs.length) return null;
            return (
              <div key={sub.id}>
                <SectionLabel className="mb-2">{tn(sub.name, sub.name_gu)}</SectionLabel>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {recs.map((r) => (
                    <KpiCard key={r.kpi.id} rec={r} name={tn(r.kpi.name, r.kpi.name_gu)} lang={lang} onClick={() => navigate(`/app/kpi/${r.kpi.id}`)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <SectionLabel className="mb-2">{t("domain.kpisIn", { name: tn(ds.domain.name, ds.domain.name_gu) })}</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {ds.records.map((r) => (
              <KpiCard key={r.kpi.id} rec={r} name={tn(r.kpi.name, r.kpi.name_gu)} lang={lang} onClick={() => navigate(`/app/kpi/${r.kpi.id}`)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
