import type { DomainScore, KpiRecord } from "@/types";
import { useScope, useScorecard, useScopeStats, usePmShri } from "@/hooks";
import { statusFromScore } from "@/engine";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { rag } from "@/lib/colors";
import { pct, locNum, formatValue, formatDelta } from "@/lib/format";
import { peerAvg, peerGapOf, peerLevelOf } from "@/lib/peer";
import { buildTrend } from "@/lib/trend";
import { gradeFor, GSQAC_BANDS } from "@/config/ratingBands";
import { OUTPUT_DOMAIN_ID } from "@/config/frameworks";
import { CURRENT_PERIOD } from "@/config";
import { Card, SectionLabel, Button, ProgressBar } from "@/components/ui/atoms";
import { ResponsiveDataTable, type DataColumn } from "@/components/ui/ResponsiveDataTable";
import { Download, Sparkles } from "@/components/ui/Icon";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { PageHeader } from "@/components/layout/PageHeader";

const PERIODIC = new Set(["Daily", "Weekly", "Monthly"]);

export default function Export() {
  const { entity, currentId } = useScope();
  const sc = useScorecard(currentId);
  const stats = useScopeStats(currentId);
  const pmShri = usePmShri();
  const { t, tn, lang } = useT();
  if (!entity || !sc) return null;

  const periodNo = CURRENT_PERIOD().id.split("W")[1];
  const peerLevel = peerLevelOf(entity.level);
  const gsqacCoverage = stats && stats.schools > 0 && stats.gsqacReal < stats.schools ? stats : null;
  const improvement = entity.meta.gsqac?.improvement;

  // domain summary headline = the domain's homepage (hero) indicator
  const heroOf = (d: DomainScore): KpiRecord | null => d.records.find((r) => r.kpi.hero) ?? null;
  const isGsqacHero = (h: KpiRecord) => h.kpi.id.startsWith("sq_");
  const heroValue = (d: DomainScore): string => {
    const h = heroOf(d);
    if (!h || h.value == null) return d.percent == null ? "NA" : pct(d.percent, lang);
    return isGsqacHero(h) ? `${locNum(Math.round(h.value), lang)} · ${gradeFor(h.value, GSQAC_BANDS).grade}` : formatValue(h.value, h.kpi.unit, lang);
  };
  const heroStatus = (d: DomainScore) => heroOf(d)?.status ?? d.status;
  const heroPeer = (d: DomainScore): string => {
    const h = heroOf(d);
    if (!h) return sc.parent?.domainPercents[d.domain.id] == null ? "—" : pct(sc.parent!.domainPercents[d.domain.id], lang);
    const p = peerAvg(h.kpi.id, entity.level);
    if (p == null) return "—";
    return isGsqacHero(h) ? locNum(Math.round(p), lang) : formatValue(p, h.kpi.unit, lang);
  };
  const heroDelta = (d: DomainScore): string => {
    const h = heroOf(d);
    if (!h || h.value == null) return "—";
    if (isGsqacHero(h)) return improvement != null ? formatDelta(improvement, "%", lang) : "—";
    const tr = buildTrend(h, lang);
    return tr.delta != null ? formatDelta(tr.delta, h.kpi.unit, lang) : "—";
  };

  // ── per-indicator helpers (detail tables) ──
  const n1 = (rec: KpiRecord): string => {
    if (rec.value == null || !peerLevel) return "—";
    if (rec.kpi.context || rec.kpi.id.startsWith("sq_")) return "—";
    if (rec.kpi.unit !== "%" && rec.kpi.unit !== "score") return "—";
    const g = peerGapOf(rec.value, peerAvg(rec.kpi.id, entity.level), rec.kpi.direction);
    if (!g) return "—";
    return `${locNum(Math.round(g.peer), lang)}${rec.kpi.unit === "%" ? "%" : ""} (${formatDelta(g.gap, rec.kpi.unit === "%" ? "%" : "score", lang)})`;
  };
  const indicatorDelta = (rec: KpiRecord): string => {
    if (rec.value == null) return "—";
    if (PERIODIC.has(rec.kpi.frequency ?? "")) return rec.deltaWoW != null ? formatDelta(rec.deltaWoW, rec.kpi.unit === "%" ? "%" : "score", lang) : "—";
    if (rec.kpi.id.startsWith("sq_")) return improvement != null ? formatDelta(improvement, "%", lang) : "—";
    if (rec.kpi.context) return formatDelta(rec.value, "%", lang);
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
    {
      key: "domain", header: t("export.domain"), render: (d) => {
        const h = heroOf(d);
        return (
          <>
            <span className="font-semibold text-neutral-800">{tn(d.domain.name, d.domain.name_gu)}</span>
            {h && <span className="block text-2xs font-normal text-neutral-400">{tn(h.kpi.name, h.kpi.name_gu)}</span>}
          </>
        );
      },
    },
    { key: "value", header: t("kpi.current"), align: "right", render: (d) => <span className={cn("font-bold tabular-nums", rag(heroStatus(d)).text)}>{heroValue(d)}</span> },
    { key: "n1", header: peerLevel ? `${t(`levels.${peerLevel}`)} ${t("common.average")}` : t("common.average"), align: "right", className: "tabular-nums text-neutral-500", render: (d) => heroPeer(d) },
    { key: "delta", header: "Δ", align: "right", className: "tabular-nums text-neutral-500", render: (d) => heroDelta(d) },
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
    { key: "delta", header: "Δ", align: "right", className: "tabular-nums text-neutral-500", render: (rec) => indicatorDelta(rec) },
    { key: "source", header: t("common.source"), className: "text-2xs text-neutral-400", render: (rec) => rec.kpi.data_source },
  ];

  return (
    <ScreenContainer animate={false}>
      <PageHeader
        className="no-print"
        title={t("export.title")}
        subtitle={`${t("export.generatedOn")} · ${t("common.week")} ${locNum(periodNo, lang)}${pmShri !== "all" ? ` · ${t(`pmShri.${pmShri}`)}` : ""}`}
        actions={<Button onClick={() => window.print()}><Download size={16} /> {t("export.download")}</Button>}
      />

      <Card className="card-pad sm:p-6">
        {/* report header — entity + scope (no overall-score ring) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-500 text-white text-sm font-extrabold">VSK</span>
            <div className="min-w-0">
              <div className="truncate text-base font-extrabold text-neutral-900" title={tn(entity.name, entity.name_gu)}>{tn(entity.name, entity.name_gu)}</div>
              <div className="truncate text-2xs text-neutral-400">{t(`levels.${entity.level}`)} · {sc.framework.name} · {t("common.week")} {locNum(periodNo, lang)}{pmShri !== "all" ? ` · ${t(`pmShri.${pmShri}`)}` : ""}</div>
            </div>
          </div>
        </div>

        {/* domain summary — value · N+1 · Δ (4A inputs + School Quality output) */}
        <ResponsiveDataTable
          className="mt-4"
          columns={summaryCols}
          rows={sc.domainScores.filter((d) => d.records.length > 0)}
          getRowKey={(d) => d.domain.id}
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

        {/* School Quality detail — GSQAC D1–D5 breakdown */}
        {entity.meta.gsqac && (
          <div className="mt-6 border-t border-line pt-4">
            <SectionLabel>{tn(sc.domainScores.find((d) => d.domain.id === OUTPUT_DOMAIN_ID)?.domain.name ?? "School Quality", sc.domainScores.find((d) => d.domain.id === OUTPUT_DOMAIN_ID)?.domain.name_gu ?? "")} · D1–D5</SectionLabel>
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
