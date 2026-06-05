import { useNavigate, useParams } from "react-router-dom";
import { useScope, useKpiRecord, useKpiCascade, useFramework } from "@/hooks";
import { useT } from "@/i18n";
import { isImproving } from "@/engine";
import { cn } from "@/lib/cn";
import { rag } from "@/lib/colors";
import { formatValue } from "@/lib/format";
import { Card, SectionLabel, Badge, DeltaPill, TrendArrow, EmptyNA } from "@/components/ui/atoms";
import { TrendChart } from "@/components/ui/TrendChart";
import { ComparisonBars, type CompareBar } from "@/components/ui/ComparisonBars";
import { ArrowLeft } from "@/components/ui/Icon";

export default function KpiDetail() {
  const { kpiId } = useParams();
  const { entity, currentId } = useScope();
  const fw = useFramework();
  const rec = useKpiRecord(kpiId, currentId);
  const cascade = useKpiCascade(kpiId, currentId);
  const { t, tn, lang } = useT();
  const navigate = useNavigate();

  if (!rec || !entity) return null;
  const c = rag(rec.status);
  const na = rec.value == null;
  const improving = isImproving(rec.trend, rec.kpi.direction);
  const domain = fw.domains.find((d) => d.id === rec.kpi.domain_id);
  const name = tn(rec.kpi.name, rec.kpi.name_gu);

  const bars: CompareBar[] = cascade.map((row) => ({
    key: row.level,
    label: lang === "gu" ? row.label_gu : row.label,
    sublabel: lang === "gu" && row.entity.name_gu ? row.entity.name_gu : row.entity.name,
    value: row.value,
    status: row.status,
    isCurrent: row.isCurrent,
  }));

  return (
    <div className="space-y-5 animate-fade-in">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-primary-600">
        <ArrowLeft size={16} /> {t("common.back")}
      </button>

      {/* header + current value */}
      <Card className="card-pad">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {domain && <p className="text-xs font-semibold text-primary-600">{tn(domain.name, domain.name_gu)}</p>}
            <h1 className="text-lg font-extrabold text-neutral-900">{name}</h1>
            <p className="mt-0.5 text-2xs text-neutral-400">{t("common.source")}: {rec.kpi.data_source}</p>
          </div>
          <Badge status={rec.status}>{t(`status.${rec.status}`)}</Badge>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3">
          <div>
            <SectionLabel>{t("kpi.current")}</SectionLabel>
            {na ? (
              <div className="mt-1 text-4xl font-extrabold text-rag-naText">NA</div>
            ) : (
              <div className="mt-1 flex items-end gap-2">
                <span className={cn("text-4xl font-extrabold tnum", c.text)}>{formatValue(rec.value, rec.kpi.unit, lang)}</span>
                <TrendArrow trend={rec.trend} improving={improving} size={22} />
                {rec.benchmark != null && (
                  <span className="mb-1 text-xs text-neutral-400">{t("common.benchmark")} {formatValue(rec.benchmark, rec.kpi.unit, lang)}</span>
                )}
              </div>
            )}
          </div>
          {!na && (
            <div className="flex gap-2">
              <DeltaPill delta={rec.deltaWoW} unit={rec.kpi.unit} direction={rec.kpi.direction} lang={lang} label={t("kpi.deltaWoW")} />
              <DeltaPill delta={rec.deltaMoM} unit={rec.kpi.unit} direction={rec.kpi.direction} lang={lang} label={t("kpi.deltaMoM")} />
            </div>
          )}
        </div>

        {/* the "why" story */}
        <div className={cn("mt-4 rounded-xl px-4 py-3 text-sm font-medium", c.soft, c.text)}>
          {lang === "gu" ? rec.remark_gu : rec.remark}
        </div>
      </Card>

      {/* trend */}
      {!na && rec.series.length > 1 ? (
        <Card className="card-pad">
          <SectionLabel>{t("kpi.weeklyTrend")}</SectionLabel>
          <div className="mt-2">
            <TrendChart record={rec} lang={lang} />
          </div>
        </Card>
      ) : na ? (
        <EmptyNA hint={t("kpi.noData")} />
      ) : null}

      {/* cascade */}
      <Card className="card-pad">
        <SectionLabel>{t("kpi.cascadeTitle", { name })}</SectionLabel>
        <div className="mt-4">
          {bars.some((b) => b.value != null) ? (
            <ComparisonBars bars={bars} unit={rec.kpi.unit} lang={lang} />
          ) : (
            <EmptyNA hint={t("kpi.noData")} />
          )}
        </div>
        <button onClick={() => navigate("/app/compare")} className="mt-3 text-xs font-semibold text-primary-600 hover:underline">
          {t("cascade.title")} →
        </button>
      </Card>
    </div>
  );
}
