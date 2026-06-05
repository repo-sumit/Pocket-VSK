import { useMemo, useState } from "react";
import { useScope, useOverallCascade, useKpiCascade, useFramework } from "@/hooks";
import { useT } from "@/i18n";
import type { Unit } from "@/types";
import { Card } from "@/components/ui/atoms";
import { ComparisonBars, type CompareBar } from "@/components/ui/ComparisonBars";

export default function CascadeComparison() {
  const { entity, currentId } = useScope();
  const fw = useFramework();
  const { t, tn, lang } = useT();
  const [selected, setSelected] = useState<string>("overall");

  const overall = useOverallCascade(currentId);
  const kpiRows = useKpiCascade(selected === "overall" ? undefined : selected, currentId);

  const isOverall = selected === "overall";
  const rows = isOverall ? overall : kpiRows;
  const kpi = useMemo(() => fw.kpis.find((k) => k.id === selected), [fw, selected]);
  const unit: Unit = isOverall ? "%" : (kpi?.unit ?? "%");
  const titleName = isOverall ? t("cascade.overall") : tn(kpi?.name ?? "", kpi?.name_gu);

  const bars: CompareBar[] = rows.map((r) => ({
    key: r.level,
    label: lang === "gu" ? r.label_gu : r.label,
    sublabel: lang === "gu" && r.entity.name_gu ? r.entity.name_gu : r.entity.name,
    value: r.value,
    status: r.status,
    isCurrent: r.isCurrent,
  }));

  if (!entity) return null;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">{t("cascade.title")}</h1>
        <p className="mt-0.5 text-sm text-neutral-500">{t("cascade.subtitle", { name: titleName })}</p>
      </div>

      {/* KPI selector */}
      <Card className="card-pad">
        <label className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">{t("section.choose")}</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded-full border border-line bg-neutral-50 px-3 py-1.5 text-sm font-semibold text-neutral-700 outline-none focus:border-primary-400"
          >
            <option value="overall">{t("cascade.overall")}</option>
            {fw.domains.map((d) => (
              <optgroup key={d.id} label={tn(d.name, d.name_gu)}>
                {fw.kpis.filter((k) => k.domain_id === d.id).map((k) => (
                  <option key={k.id} value={k.id}>{tn(k.name, k.name_gu)}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <div className="mt-5">
          {bars.some((b) => b.value != null) ? (
            <ComparisonBars bars={bars} unit={unit} lang={lang} height={210} />
          ) : (
            <p className="py-8 text-center text-sm text-neutral-400">{t("kpi.noData")}</p>
          )}
        </div>

        {/* legend */}
        <div className="mt-4 flex flex-wrap gap-3 border-t border-line/60 pt-3 text-2xs text-neutral-400">
          {bars.map((b) => (
            <span key={b.key} className="flex items-center gap-1">
              <span className="font-semibold text-neutral-600">{b.label}:</span> {b.sublabel}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
