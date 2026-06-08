import { useNavigate, useParams } from "react-router-dom";
import { useScope, useScorecard } from "@/hooks";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { rag } from "@/lib/colors";
import { pct } from "@/lib/format";
import { Card, SectionLabel, Badge, ProgressBar } from "@/components/ui/atoms";
import { KpiCard } from "@/components/ui/KpiCard";
import { ArrowLeft } from "@/components/ui/Icon";

/** Sub-domain view — tier 3 of the 3-click drill (Domain › Sub-domain › Indicators). */
export default function SubDomainView() {
  const { domainId, subId } = useParams();
  const { currentId } = useScope();
  const sc = useScorecard(currentId);
  const { t, tn, lang } = useT();
  const navigate = useNavigate();

  if (!sc) return null;
  const ds = sc.domainScores.find((d) => d.domain.id === domainId);
  const ss = ds?.subScores.find((s) => s.sub.id === subId);
  if (!ds || !ss) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Back onClick={() => navigate(`/app/domain/${domainId}`)} label={ds ? tn(ds.domain.name, ds.domain.name_gu) : t("nav.home")} />
        <Card className="card-pad text-center text-sm text-neutral-500">{t("domain.noKpis")}</Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Back onClick={() => navigate(`/app/domain/${domainId}`)} label={tn(ds.domain.name, ds.domain.name_gu)} />

      <Card className="card-pad">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xs font-semibold uppercase tracking-wide text-neutral-400">{tn(ds.domain.name, ds.domain.name_gu)}</p>
            <h1 className="truncate text-lg font-extrabold text-neutral-900">{tn(ss.sub.name, ss.sub.name_gu)}</h1>
          </div>
          <div className="text-right">
            <span className={cn("text-3xl font-extrabold tnum", ss.percent == null ? "text-rag-naText" : rag(ss.status).text)}>{ss.percent == null ? t("common.na") : pct(ss.percent, lang)}</span>
            <Badge status={ss.status} className="mt-1 !text-2xs">{t(`status.${ss.status}`)}</Badge>
          </div>
        </div>
        {ss.percent != null && <ProgressBar value={ss.percent} status={ss.status} className="mt-4" height={10} />}
      </Card>

      <div>
        <SectionLabel className="mb-2">{t("scorecard.indicators")}</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ss.records.map((r) => (
            <KpiCard key={r.kpi.id} rec={r} name={tn(r.kpi.name, r.kpi.name_gu)} lang={lang} onClick={() => navigate(`/app/kpi/${r.kpi.id}`)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Back({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-primary-600">
      <ArrowLeft size={16} /> {label}
    </button>
  );
}
