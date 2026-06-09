import type { DomainScore, KpiRecord } from "@/types";
import { useScope, useScorecard, useScopeStats } from "@/hooks";
import { statusFromScore } from "@/engine";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { rag } from "@/lib/colors";
import { pct, locNum, formatValue, formatDelta } from "@/lib/format";
import { peerAvg, peerGapOf, peerLevelOf } from "@/lib/peer";
import { gradeFor, GSQAC_BANDS } from "@/config/ratingBands";
import { CURRENT_PERIOD } from "@/config";
import { Card, SectionLabel, Badge, Button, ProgressBar } from "@/components/ui/atoms";
import { RatingRing } from "@/components/ui/RatingRing";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { ResponsiveDataTable, type DataColumn } from "@/components/ui/ResponsiveDataTable";
import { Download, Sparkles } from "@/components/ui/Icon";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { PageHeader } from "@/components/layout/PageHeader";

const PERIODIC = new Set(["Daily", "Weekly", "Monthly"]);

export default function Export() {
  const { entity, currentId } = useScope();
  const sc = useScorecard(currentId);
  const stats = useScopeStats(currentId);
  const { t, tn, lang } = useT();
  if (!entity || !sc) return null;

  const scored = sc.domainScores.filter((d) => d.weightage > 0);
  const periodNo = CURRENT_PERIOD().id.split("W")[1];
  const peerLevel = peerLevelOf(entity.level);
  const gsqacCoverage = stats && stats.schools > 0 && stats.gsqacReal < stats.schools ? stats : null;

  // N+1 (own vs next level up) for %/score level indicators
  const n1 = (rec: KpiRecord): string => {
    if (rec.value == null || !peerLevel) return "—";
    if (rec.kpi.context || rec.kpi.id.startsWith("sq_")) return "—";
    if (rec.kpi.unit !== "%" && rec.kpi.unit !== "score") return "—";
    const g = peerGapOf(rec.value, peerAvg(rec.kpi.id, entity.level), rec.kpi.direction);
    if (!g) return "—";
    return `${locNum(Math.round(g.peer), lang)}${rec.kpi.unit === "%" ? "%" : ""} (${formatDelta(g.gap, rec.kpi.unit === "%" ? "%" : "score", lang)})`;
  };
  // Δ by frequency: periodic → week-on-week; annual/half/twice → vs last cycle
  const deltaCol = (rec: KpiRecord): string => {
    if (rec.value == null) return "—";
    if (PERIODIC.has(rec.kpi.frequency ?? "")) return rec.deltaWoW != null ? formatDelta(rec.deltaWoW, rec.kpi.unit === "%" ? "%" : "score", lang) : "—";
    if (rec.kpi.id.startsWith("sq_")) return entity.meta.gsqac?.improvement != null ? formatDelta(entity.meta.gsqac.improvement, "%", lang) : "—";
    if (rec.kpi.context) return formatDelta(rec.value, "%", lang); // the value IS the cycle change
    return "—";
  };
  const valueCol = (rec: KpiRecord): string => {
    if (rec.value == null) return "NA";
    if (rec.kpi.id.startsWith("sq_")) return `${locNum(Math.round(rec.value), lang)} (${gradeFor(rec.value, GSQAC_BANDS).grade})`;
    if (rec.kpi.context) return formatDelta(rec.value, "%", lang);
    return formatValue(rec.value, rec.kpi.unit, lang);
  };

  // ── shared table columns (one grammar) ──
  const summaryCols: DataColumn<DomainScore>[] = [
    { key: "domain", header: t("export.domain"), render: (d) => <span className="font-semibold text-neutral-800">{tn(d.domain.name, d.domain.name_gu)}</span> },
    { key: "weight", header: t("common.weightage"), align: "right", className: "tabular-nums text-neutral-500", render: (d) => `${Math.round(d.domain.weightage * 100)}%` },
    { key: "pct", header: "%", align: "right", render: (d) => <span className={cn("font-bold tabular-nums", d.percent == null ? "text-rag-naText" : rag(d.status).text)}>{d.percent == null ? "NA" : pct(d.percent, lang)}</span> },
    { key: "contrib", header: t("scorecard.contribution"), align: "right", className: "tabular-nums text-neutral-600", render: (d) => d.contribution.toFixed(1) },
    { key: "status", header: t("kpi.statusLabel"), align: "right", render: (d) => <Badge status={d.status} className="!text-2xs">{t(`status.${d.status}`)}</Badge> },
  ];
  const indicatorCols: DataColumn<KpiRecord>[] = [
    {
      key: "name", header: t("scorecard.indicators"), render: (rec) => (
        <>
          <span className="inline-flex items-center gap-1 font-medium text-neutral-800">
            {rec.kpi.hero && <Sparkles size={11} className="shrink-0 text-amber-500" />}
            {tn(rec.kpi.name, rec.kpi.name_gu)}
          </span>
          <span className="block text-2xs font-normal text-neutral-400">{t(`ogm.freq.${rec.kpi.frequency ?? "Latest"}`)}</span>
        </>
      ),
    },
    { key: "current", header: t("kpi.current"), align: "right", render: (rec) => <span className={cn("font-bold tnum", rec.value == null ? "text-rag-naText" : rag(rec.status).text)}>{valueCol(rec)}</span> },
    { key: "n1", header: peerLevel ? `${t(`levels.${peerLevel}`)} ${t("common.average")}` : t("common.average"), align: "right", className: "tabular-nums text-neutral-500", render: (rec) => n1(rec) },
    { key: "delta", header: "Δ", align: "right", className: "tabular-nums text-neutral-500", render: (rec) => deltaCol(rec) },
    { key: "source", header: t("common.source"), className: "text-2xs text-neutral-400", render: (rec) => rec.kpi.data_source },
  ];

  return (
    <ScreenContainer animate={false}>
      <PageHeader
        className="no-print"
        title={t("export.title")}
        subtitle={`${t("export.generatedOn")} · ${t("common.week")} ${locNum(periodNo, lang)}`}
        actions={<Button onClick={() => window.print()}><Download size={16} /> {t("export.download")}</Button>}
      />

      <Card className="card-pad sm:p-6">
        {/* report header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-500 text-white text-sm font-extrabold">VSK</span>
              <div className="min-w-0">
                <div className="truncate text-base font-extrabold text-neutral-900" title={tn(entity.name, entity.name_gu)}>{tn(entity.name, entity.name_gu)}</div>
                <div className="truncate text-2xs text-neutral-400">{t(`levels.${entity.level}`)} · {sc.framework.name} · {t("common.week")} {locNum(periodNo, lang)}</div>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <RatingRing percent={sc.overallPercent} grade={sc.grade} size={104} stroke={10} lang={lang} sublabel={t("scorecard.inputComposite")} />
            {sc.grade && <RatingBadge grade={sc.grade} size="lg" />}
          </div>
        </div>

        {/* 4A domain summary */}
        <ResponsiveDataTable
          className="mt-4"
          columns={summaryCols}
          rows={scored}
          getRowKey={(d) => d.domain.id}
          footer={
            <tr className="border-t-2 border-line">
              <td className="py-3 font-extrabold text-neutral-900">{t("scorecard.inputComposite")}</td>
              <td className="py-3 text-right tabular-nums text-neutral-500">100%</td>
              <td className={cn("py-3 text-right font-extrabold tabular-nums", rag(sc.status).text)}>{pct(sc.overallPercent, lang)}</td>
              <td className="py-3 text-right font-bold tabular-nums">{sc.overallPercent != null ? sc.overallPercent.toFixed(1) : "—"}</td>
              <td className="py-3 text-right">{sc.grade ? <RatingBadge grade={sc.grade} size="sm" celebrate={false} /> : "NA"}</td>
            </tr>
          }
        />

        {/* full indicator detail per domain — every applicable indicator at this level */}
        {sc.domainScores.filter((d) => d.records.length > 0).map((d) => (
          <div key={d.domain.id} className="mt-6">
            <div className="flex items-center justify-between gap-2">
              <SectionLabel className="!mb-0">{tn(d.domain.name, d.domain.name_gu)}</SectionLabel>
              {d.percent != null && <span className={cn("text-sm font-extrabold tnum", rag(d.status).text)}>{pct(d.percent, lang)}{d.grade ? ` · ${d.grade}` : ""}</span>}
            </div>
            <ResponsiveDataTable
              className="mt-2"
              size="xs"
              columns={indicatorCols}
              rows={d.records}
              getRowKey={(rec) => rec.kpi.id}
              rowClassName={(rec) => (rec.kpi.hero ? "bg-amber-50/40" : undefined)}
            />
          </div>
        ))}

        {/* GSQAC live data */}
        {entity.meta.gsqac && (
          <div className="mt-6 border-t border-line pt-4">
            <SectionLabel>GSQAC · D1–D5</SectionLabel>
            {gsqacCoverage && gsqacCoverage.schools >= 2 && (
              <p className="mt-1 text-2xs text-neutral-400">{t("ogm.coverage", { real: locNum(gsqacCoverage.gsqacReal, lang), total: locNum(gsqacCoverage.schools, lang) })}</p>
            )}
            <div className="mt-2 grid grid-cols-5 gap-2">
              {Object.entries(entity.meta.gsqac.domains).map(([dk, v]) => (
                <div key={dk} className="text-center">
                  <div className="text-2xs font-semibold text-neutral-400">{dk}</div>
                  <ProgressBar value={v * 100} status={statusFromScore(v * 100)} className="my-1" height={6} />
                  <div className="text-xs font-bold tnum text-neutral-700">{pct(v * 100, lang)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-4 text-2xs text-neutral-400">★ = {t("ogm.heroKpis")}. {t("export.note")}</p>
      </Card>
    </ScreenContainer>
  );
}
