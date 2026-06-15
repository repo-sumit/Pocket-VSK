import { useNavigate } from "react-router-dom";
import type { Direction, DomainScore, KpiRecord, Unit } from "@/types";
import { useScope, useScorecard, usePmShri } from "@/hooks";
import { statusFromScore } from "@/engine";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { rag, accent } from "@/lib/colors";
import { pct, locNum, formatValue, formatDate } from "@/lib/format";
import { peerAvg, peerGapOf, peerLevelOf } from "@/lib/peer";
import { buildTrend, type Cadence } from "@/lib/trend";
import { shouldShowCardDelta, shouldShowSource } from "@/lib/displayPolicy";
import { gradeFor, GSQAC_BANDS } from "@/config/ratingBands";
import { GSQAC_DOMAINS } from "@/config/kpiCatalog";
import { OUTPUT_DOMAIN_ID } from "@/config/frameworks";
import { Card, SectionLabel, Button, ProgressBar } from "@/components/ui/atoms";
import {
  ResponsiveDataTable,
  type DataColumn,
} from "@/components/ui/ResponsiveDataTable";
import { FrequencyDelta } from "@/components/ui/FrequencyDelta";
import { Icon, Download, Sparkles } from "@/components/ui/Icon";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { PageHeader, BackLink } from "@/components/layout/PageHeader";

interface DeltaInfo {
  v: number;
  unit: Unit;
  direction: Direction;
  cadence: Cadence;
}

export default function Export() {
  const { entity, currentId } = useScope();
  const sc = useScorecard(currentId);
  const pmShri = usePmShri();
  const { t, tn, lang } = useT();
  const navigate = useNavigate();
  if (!entity || !sc) return null;

  const today = formatDate(new Date(), lang);
  const peerLevel = peerLevelOf(entity.level);
  const peerAvgLabel = peerLevel
    ? `${t(`levels.${peerLevel}`)} ${t("export.parentAvg")}`
    : t("common.average");
  // summary tiles use the card grammar "{parent name} · {value}" — the generic
  // "{Level} avg" wording stays only as the indicator-table column header.
  const parentEntityName = sc.parent
    ? tn(sc.parent.entity.name, sc.parent.entity.name_gu)
    : null;
  const improvement = entity.meta.gsqac?.improvement;
  const domains = sc.domainScores.filter((d) => d.records.length > 0);

  // ── domain summary headline = the domain's homepage (hero) indicator ──
  const heroOf = (d: DomainScore): KpiRecord | null =>
    d.records.find((r) => r.kpi.hero) ?? null;
  const isGsqacHero = (h: KpiRecord) => h.kpi.id.startsWith("sq_");
  const heroValue = (d: DomainScore): string => {
    const h = heroOf(d);
    if (!h || h.value == null)
      return d.percent == null ? "NA" : pct(d.percent, lang);
    return isGsqacHero(h)
      ? `${locNum(Math.round(h.value), lang)} · ${gradeFor(h.value, GSQAC_BANDS).grade}`
      : formatValue(h.value, h.kpi.unit, lang);
  };
  const heroStatus = (d: DomainScore) => heroOf(d)?.status ?? d.status;
  const heroPeer = (d: DomainScore): string | null => {
    const h = heroOf(d);
    if (!h) {
      const p = sc.parent?.domainPercents[d.domain.id];
      return p == null ? null : pct(p, lang);
    }
    const p = peerAvg(h.kpi.id, entity.level);
    if (p == null) return null;
    return isGsqacHero(h)
      ? locNum(Math.round(p), lang)
      : formatValue(p, h.kpi.unit, lang);
  };
  const heroDeltaInfo = (d: DomainScore): DeltaInfo | null => {
    const h = heroOf(d);
    // central card-delta policy: Daily / FLN / School Observation / non-allowed → date only
    if (!h || h.value == null || !shouldShowCardDelta(h.kpi)) return null;
    if (isGsqacHero(h))
      return improvement != null && improvement !== 0
        ? { v: improvement, unit: "%", direction: "higher", cadence: "yearly" }
        : null;
    const tr = buildTrend(h, lang);
    return tr.delta != null && tr.delta !== 0
      ? {
          v: tr.delta,
          unit: h.kpi.unit,
          direction: h.kpi.direction,
          cadence: tr.cadence,
        }
      : null;
  };

  // ── per-indicator helpers (detail tables) ──
  const n1 = (rec: KpiRecord): string => {
    if (rec.value == null || !peerLevel) return "—";
    if (rec.kpi.context || rec.kpi.id.startsWith("sq_")) return "—";
    if (rec.kpi.unit !== "%" && rec.kpi.unit !== "score") return "—";
    const p = peerAvg(rec.kpi.id, entity.level);
    const g = peerGapOf(rec.value, p, rec.kpi.direction);
    if (!g) return "—";
    return `${locNum(Math.round(g.peer), lang)}${rec.kpi.unit === "%" ? "%" : ""}`;
  };
  const indicatorDeltaInfo = (rec: KpiRecord): DeltaInfo | null => {
    // central card-delta policy: SAT 1/SAT 2/CET/CGMS + GSQAC score only
    if (rec.value == null || !shouldShowCardDelta(rec.kpi)) return null;
    if (rec.kpi.id === "sq_gsqac")
      return improvement != null && improvement !== 0
        ? { v: improvement, unit: "%", direction: "higher", cadence: "yearly" }
        : null;
    const tr = buildTrend(rec, lang);
    return tr.delta != null && tr.delta !== 0
      ? {
          v: tr.delta,
          unit: rec.kpi.unit,
          direction: rec.kpi.direction,
          cadence: tr.cadence,
        }
      : null;
  };
  const valueCol = (rec: KpiRecord): string => {
    if (rec.value == null) return "NA";
    if (rec.kpi.id.startsWith("sq_"))
      return `${locNum(Math.round(rec.value), lang)} (${gradeFor(rec.value, GSQAC_BANDS).grade})`;
    if (rec.kpi.context) return formatValue(rec.value, rec.kpi.unit, lang);
    return formatValue(rec.value, rec.kpi.unit, lang);
  };

  const indicatorCols: DataColumn<KpiRecord>[] = [
    {
      key: "name",
      header: t("scorecard.indicators"),
      render: (rec) => (
        <span className="block">
          <span className="inline-flex items-center gap-1 font-medium text-neutral-800">
            {rec.kpi.hero && (
              <Sparkles size={11} className="shrink-0 text-amber-500" />
            )}
            {tn(rec.kpi.name, rec.kpi.name_gu)}
          </span>
          <span className="ml-1 text-2xs font-normal text-neutral-400">
            · {t(`ogm.freq.${rec.kpi.frequency ?? "Latest"}`)}
          </span>
        </span>
      ),
    },
    {
      key: "current",
      header: t("kpi.current"),
      align: "right",
      className: "whitespace-nowrap",
      render: (rec) => (
        <span
          className={cn(
            "font-bold tnum",
            rec.value == null ? "text-rag-naText" : rag(rec.status).text,
          )}
        >
          {valueCol(rec)}
        </span>
      ),
    },
    {
      key: "n1",
      header: peerAvgLabel,
      align: "right",
      className: "whitespace-nowrap tabular-nums text-neutral-500",
      render: (rec) => n1(rec),
    },
    {
      key: "delta",
      header: "Δ",
      align: "right",
      className: "whitespace-nowrap",
      render: (rec) => {
        const di = indicatorDeltaInfo(rec);
        return di ? (
          <FrequencyDelta
            delta={di.v}
            unit={di.unit}
            direction={di.direction}
            cadence={di.cadence}
            showPeriod={false}
            lang={lang}
          />
        ) : (
          <span className="text-neutral-300">—</span>
        );
      },
    },
    ...(shouldShowSource("export")
      ? [
          {
            key: "source",
            header: t("common.source"),
            className: "text-2xs leading-tight text-neutral-400",
            render: (rec: KpiRecord) => rec.kpi.data_source,
          } satisfies DataColumn<KpiRecord>,
        ]
      : []),
  ];

  return (
    <ScreenContainer animate={false}>
      <PageHeader
        className="no-print"
        back={
          <BackLink label={t("common.back")} onClick={() => navigate("/app")} />
        }
        title={t("export.title")}
        subtitle={`${t("export.generatedOn")} ${today}`}
        actions={
          <Button onClick={() => window.print()}>
            <Download size={16} /> {t("export.download")}
          </Button>
        }
      />

      <Card className="card-pad sm:p-6">
        {/* report header — logo + entity + scope + generated date */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white ring-1 ring-line">
              <img
                src="/logo-vsk.png"
                alt="VSK Gujarat"
                className="h-7 w-7 object-contain"
              />
            </span>
            <div className="min-w-0">
              <div
                className="truncate text-lg font-extrabold leading-tight text-neutral-900"
                title={tn(entity.name, entity.name_gu)}
              >
                {tn(entity.name, entity.name_gu)}
              </div>
              <div className="truncate text-2xs text-neutral-500">
                {t(`levels.${entity.level}`)} · {sc.framework.name}
              </div>
              <div className="text-2xs text-neutral-400">
                {t("export.generatedOn")} {today}
              </div>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-0.5 text-2xs font-semibold text-neutral-500">
            {t(`pmShri.${pmShri}`)}
          </span>
        </div>

        {/* domain summary — one compact card per domain (homepage indicator) */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {domains.map((d) => {
            const a = accent(d.domain.accent);
            const h = heroOf(d);
            const di = heroDeltaInfo(d);
            const peer = heroPeer(d);
            return (
              <div
                key={d.domain.id}
                className="print-avoid rounded-xl border border-line bg-white p-3"
                style={{ borderLeftWidth: 3, borderLeftColor: a.hex }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-lg",
                      a.bg,
                    )}
                  >
                    <Icon name={d.domain.icon} className={a.icon} size={15} />
                  </span>
                  <span className="truncate text-xs font-bold text-neutral-900">
                    {tn(d.domain.name, d.domain.name_gu)}
                  </span>
                </div>
                {h && (
                  <p className="mt-1.5 truncate text-2xs text-neutral-400">
                    {tn(h.kpi.name, h.kpi.name_gu)}
                  </p>
                )}
                <div className="mt-0.5 flex items-end justify-between gap-2">
                  <span
                    className={cn(
                      "text-xl font-extrabold tnum",
                      rag(heroStatus(d)).text,
                    )}
                  >
                    {heroValue(d)}
                  </span>
                  {di && (
                    <FrequencyDelta
                      delta={di.v}
                      unit={di.unit}
                      direction={di.direction}
                      cadence={di.cadence}
                      lang={lang}
                      className="pb-0.5"
                    />
                  )}
                </div>
                {peer && (
                  <p className="text-2xs text-neutral-400">
                    {parentEntityName
                      ? `${parentEntityName} · ${peer}`
                      : `${peerAvgLabel} ${peer}`}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* full indicator detail per domain */}
        {domains.map((d) => {
          const a = accent(d.domain.accent);
          return (
            <div key={d.domain.id} className="print-avoid mt-6">
              <div
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg px-3 py-1.5",
                  a.bg,
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icon name={d.domain.icon} className={a.icon} size={14} />
                  <span className="truncate text-2xs font-bold uppercase tracking-wide text-neutral-700">
                    {tn(d.domain.name, d.domain.name_gu)}
                  </span>
                </span>
                {d.percent != null && (
                  <span className="shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-2xs font-bold tnum text-neutral-700">
                    {pct(d.percent, lang)}
                    {d.grade ? ` · ${d.grade}` : ""}
                  </span>
                )}
              </div>
              <ResponsiveDataTable
                className="mt-1.5"
                size="xs"
                columns={indicatorCols}
                rows={d.records}
                getRowKey={(rec) => rec.kpi.id}
                rowClassName={(rec) =>
                  rec.kpi.hero ? "bg-amber-50/40" : undefined
                }
              />
            </div>
          );
        })}

        {/* School Quality detail — GSQAC D1–D5 breakdown (clean cards, no coverage line) */}
        {entity.meta.gsqac && (
          <div className="print-avoid mt-6 border-t border-line pt-4">
            <SectionLabel>
              {tn(
                sc.domainScores.find((d) => d.domain.id === OUTPUT_DOMAIN_ID)
                  ?.domain.name ?? "School Quality",
                sc.domainScores.find((d) => d.domain.id === OUTPUT_DOMAIN_ID)
                  ?.domain.name_gu ?? "",
              )}{" "}
              · D1–D5
            </SectionLabel>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {GSQAC_DOMAINS.map((g) => {
                const raw = entity.meta.gsqac!.domains[g.key];
                if (raw == null) return null;
                const v = raw * 100;
                return (
                  <div
                    key={g.key}
                    className="rounded-lg border border-line px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xs font-bold text-neutral-400">
                        {g.key}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-700">
                        {tn(g.name, g.name_gu)}
                      </span>
                      <span className="shrink-0 text-sm font-extrabold tnum text-neutral-900">
                        {pct(v, lang)}
                      </span>
                    </div>
                    <ProgressBar
                      value={v}
                      status={statusFromScore(v)}
                      className="mt-1.5"
                      height={4}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="mt-5 text-2xs text-neutral-400">
          ★ {t("export.homeIndicators")}
        </p>
      </Card>
    </ScreenContainer>
  );
}
