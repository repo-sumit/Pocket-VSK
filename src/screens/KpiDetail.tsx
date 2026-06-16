import { useParams } from "react-router-dom";
import type { KpiRecord, Level } from "@/types";
import { useScope, useKpiRecord, useKpiMetrics, useFramework } from "@/hooks";
import { useT, type Lang } from "@/i18n";
import { cn } from "@/lib/cn";
import { rag } from "@/lib/colors";
import { resolveMetricLabel, locNum } from "@/lib/format";
import { shouldShowSource, displayFrequency } from "@/lib/displayPolicy";
import { buildTrend, trendTitleKey, getLastUpdatedLabel } from "@/lib/trend";
import { gsqacIndicatorById, gsqacIndicatorTrend, gsqacGrade, gsqacStatus } from "@/config/gsqac";
import {
  boardResultById, boardTrend, PARAKH_RESULTS, PARAKH_BANDS, PARAKH_PERCENTILE, PARAKH_ORDER,
  type BoardResult,
} from "@/config/parakh";
import { Card, SectionLabel, EmptyNA } from "@/components/ui/atoms";
import { TrendChart, MultiTrendChart } from "@/components/ui/TrendChart";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { FrequencyBadge } from "@/components/ui/DataBadges";
import { Database, ArrowUpRight, ArrowDownRight } from "@/components/ui/Icon";
import { RosterDetail } from "@/components/ui/RosterDetail";
import { ParakhSubjectChart } from "@/components/ui/ParakhSubjectChart";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { RouteBreadcrumb, type BreadcrumbItem } from "@/components/layout/RouteBreadcrumb";

/**
 * KPI / indicator detail — the ONLY place source is shown (title meta line),
 * and the only place trend charts live. Every chart carries a clear title.
 * Formula copy resolves "hierarchy" to the current scope level, so the word
 * never reaches the UI.
 */
export default function KpiDetail() {
  const { kpiId } = useParams();
  const { user, entity, currentId, children, childLevel } = useScope();
  const fw = useFramework();
  const rec = useKpiRecord(kpiId, currentId);
  const metricRecs = useKpiMetrics(kpiId, currentId);
  const { t, tn, lang } = useT();

  // Breadcrumb roots resolved from config so the labels are human-readable + localized.
  const homeLabel = t("nav.breadcrumbHome");
  const sqDomain = fw.domains.find((d) => d.id === "school_quality");
  const sqLabel = sqDomain ? tn(sqDomain.name, sqDomain.name_gu) : "School Quality";
  const asmDomain = fw.domains.find((d) => d.id === "assessment");
  const asmLabel = asmDomain ? tn(asmDomain.name, asmDomain.name_gu) : "Assessment";

  // GSQAC indicators live in a self-contained config (not the provider), so they get
  // a dedicated detail (score + yearly trend + how-it's-calculated), not a KpiRecord.
  const gsqacInd = gsqacIndicatorById(kpiId);
  if (gsqacInd) {
    const { area, sub, indicator } = gsqacInd;
    const items: BreadcrumbItem[] = [
      { label: homeLabel, to: "/app" },
      { label: sqLabel, to: "/app/domain/school_quality" },
      { label: tn(area.name, area.name_gu), to: `/app/gsqac/${area.key}` },
      { label: tn(sub.name, sub.name_gu ?? sub.name), to: `/app/gsqac/${area.key}/${sub.id}` },
      { label: indicator.name },
    ];
    return <GsqacIndicatorDetail found={gsqacInd} items={items} />;
  }

  // PARAKH + board results are self-contained config (not provider KPIs) — dedicated
  // detail pages (subject grouped bars / yearly trend), resolved before the rec guard.
  if (kpiId === "assessment_parakh")
    return (
      <ParakhDetail
        lang={lang}
        items={[
          { label: homeLabel, to: "/app" },
          { label: asmLabel, to: "/app/domain/assessment" },
          { label: "PARAKH" },
        ]}
      />
    );
  const board = boardResultById(kpiId);
  if (board)
    return (
      <BoardResultDetail
        board={board}
        lang={lang}
        items={[
          { label: homeLabel, to: "/app" },
          { label: asmLabel, to: "/app/domain/assessment" },
          { label: board.name },
        ]}
      />
    );

  if (!rec || !entity || !user) return null;
  const kpi = rec.kpi;
  // att_chronic / ret_dropout render role-aware lists instead of a trend chart (§6/§18/§19).
  const isRoster = kpi.id === "att_chronic" || kpi.id === "ret_dropout";
  const c = rag(rec.status);
  const na = rec.value == null;
  const domain = fw.domains.find((d) => d.id === kpi.domain_id);
  const isMulti = metricRecs.length > 0;
  const isGsqac = kpi.id.startsWith("sq_");

  // att_report: a Teacher sees the Class-Sections-only title + metric/graph (no Schools), §3.
  const teacherAttReport = kpi.id === "att_report" && user.role === "teacher";
  const name = teacherAttReport ? t("kpi.attReportTeacherTitle") : tn(kpi.name, kpi.name_gu);
  const visibleMetricRecs = teacherAttReport
    ? metricRecs.filter((mr) => mr.kpi.id !== "att_report__schools")
    : metricRecs;

  const trend = na || kpi.noTrend ? null : buildTrend(rec, lang);
  const luLabel = getLastUpdatedLabel(kpi, new Date(), lang);
  const resolveCopy = (s: string, s_gu?: string) => resolveMetricLabel(s, s_gu ?? s, entity.level, lang);

  // Logical-parent breadcrumb: a provider KPI backs to its domain page; ret_dropout is
  // surfaced via the dedicated Untracked home card at school/grade/section (Administration
  // is hidden there), so it backs to Home instead.
  const atSchoolOrBelow = entity.level === "school" || entity.level === "grade" || entity.level === "section";
  const crumbs: BreadcrumbItem[] = [{ label: homeLabel, to: "/app" }];
  if (domain && !(kpi.id === "ret_dropout" && atSchoolOrBelow)) {
    crumbs.push({ label: tn(domain.name, domain.name_gu), to: `/app/domain/${domain.id}` });
    // Administration KPIs are reached via a sub-domain page (Domain → Sub-domain → KPI), so
    // include that level and let Back return to the sub-domain the user came from. Skip it when
    // the sub-domain name equals the KPI name (e.g. Untracked Students) to avoid a duplicate crumb.
    const subDef = kpi.sub_domain ? domain.sub_domains?.find((s) => s.id === kpi.sub_domain) : undefined;
    const subLabel = subDef ? tn(subDef.name, subDef.name_gu) : null;
    if (subDef && subLabel && subLabel !== name)
      crumbs.push({ label: subLabel, to: `/app/domain/${domain.id}/${subDef.id}` });
  }
  crumbs.push({ label: name });

  return (
    <ScreenContainer>
      <RouteBreadcrumb items={crumbs} />

      {/* ── compact page header — title + meta (frequency · date · SOURCE) ── */}
      <div className="pb-2">
        {domain && <p className="text-xs font-semibold text-primary-600">{tn(domain.name, domain.name_gu)}</p>}
        <h1 className="mt-0.5 text-xl font-extrabold leading-snug text-neutral-900">{name}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-neutral-400">
          <FrequencyBadge frequency={displayFrequency(kpi)} />
          {luLabel && <span>· {luLabel}</span>}
          {shouldShowSource("detail") && (
            <span className="inline-flex items-center gap-1 truncate" title={kpi.data_source}>
              <Database size={10} className="shrink-0" />
              <span className="truncate">{kpi.data_source}</span>
            </span>
          )}
        </div>
      </div>

      {/* Role-aware roster (att_chronic / ret_dropout) shows lists, not a graph (§6/§18/§19). */}
      {isRoster ? (
        <RosterDetail
          kind={kpi.id === "att_chronic" ? "absent" : "untracked"}
          role={user.role}
          level={entity.level}
          gradeNo={entity.meta.grade_no ?? null}
          sectionLabel={entity.meta.section_label ?? null}
          value={rec.value}
          units={children}
          childLevel={childLevel}
          lang={lang}
        />
      ) : isMulti ? (
        isGsqac ? (
          <GsqacMultiTrend recs={metricRecs} name={name} level={entity.level} lang={lang} />
        ) : (
          visibleMetricRecs.map((mr) => <MetricTrendCard key={mr.kpi.id} rec={mr} level={entity.level} lang={lang} />)
        )
      ) : na ? (
        <EmptyNA hint={t("kpi.noData")} />
      ) : !kpi.noTrend && trend ? (
        <Card className="card-pad">
          <SectionLabel>{t(trendTitleKey(trend.cadence))}: {name}</SectionLabel>
          <div className="mt-2">
            <TrendChart points={trend.points} unit={kpi.unit} color={c.hex} cadence={trend.cadence} lang={lang} />
          </div>
        </Card>
      ) : null}

      {/* HOW IT'S CALCULATED */}
      {isMulti ? (
        <Card className="card-pad">
          <SectionLabel>{t("kpi.formula")}</SectionLabel>
          <dl className="mt-2 space-y-2.5">
            {visibleMetricRecs.map((mr) => (
              <div key={mr.kpi.id}>
                <dt className="text-xs font-bold text-neutral-800">
                  {resolveMetricLabel(mr.kpi.name, mr.kpi.name_gu, entity.level, lang)}
                </dt>
                <dd className="text-sm text-neutral-600">{mr.kpi.formula ? resolveCopy(mr.kpi.formula, mr.kpi.formula_gu) : null}</dd>
              </div>
            ))}
          </dl>
          {kpi.dataLagNote && <p className="mt-2 text-2xs text-neutral-400">{kpi.dataLagNote}</p>}
        </Card>
      ) : kpi.formula ? (
        <Card className="card-pad">
          <SectionLabel>{t("kpi.formula")}</SectionLabel>
          <p className="mt-2 text-sm text-neutral-700">{resolveCopy(kpi.formula)}</p>
          {kpi.dataLagNote && <p className="mt-2 text-2xs text-neutral-400">{kpi.dataLagNote}</p>}
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

/** Categorical line palette for intentional multi-line charts — clearly distinct,
 *  colour-blind-safe pairings (CET deep teal vs CGMS purple, never two greens). */
const MULTI_LINE_HEX = ["#0E7490", "#7C3AED", "#EA580C", "#DB2777"];

/**
 * GSQAC multi-metric trend — all sub-metrics on ONE chart, one line each (e.g. CET
 * & CGMS for the State-Exams domain). Title is "{cadence trend}: {domain name}".
 */
function GsqacMultiTrend({ recs, name, level, lang }: { recs: KpiRecord[]; name: string; level: Level; lang: Lang }) {
  const { t } = useT();
  const series = recs
    .map((mr) => ({ rec: mr, trend: buildTrend(mr, lang) }))
    .filter((s) => s.trend.points.length >= 2);
  if (!series.length) return null;
  const cadence = series[0].trend.cadence;
  return (
    <Card className="card-pad">
      <SectionLabel>{t(trendTitleKey(cadence))}: {name}</SectionLabel>
      <div className="mt-2">
        <MultiTrendChart
          series={series.map((s, i) => ({
            key: s.rec.kpi.id,
            label: resolveMetricLabel(s.rec.kpi.name, s.rec.kpi.name_gu, level, lang),
            color: MULTI_LINE_HEX[i % MULTI_LINE_HEX.length],
            points: s.trend.points,
          }))}
          unit={series[0].rec.kpi.unit}
          cadence={cadence}
          lang={lang}
          height={200}
        />
      </div>
    </Card>
  );
}

/** One trend chart per sub-metric — title is "{resolved metric label} · {cadence}". */
function MetricTrendCard({ rec, level, lang }: { rec: KpiRecord; level: Level; lang: Lang }) {
  const { t } = useT();
  if (rec.value == null) return null;
  const trend = buildTrend(rec, lang);
  if (trend.points.length < 2) return null;
  const c = rag(rec.status);
  const label = resolveMetricLabel(rec.kpi.name, rec.kpi.name_gu, level, lang);
  return (
    <Card className="card-pad">
      <SectionLabel>{label} · {t(trendTitleKey(trend.cadence))}</SectionLabel>
      <div className="mt-2">
        <TrendChart points={trend.points} unit={rec.kpi.unit} color={c.hex} cadence={trend.cadence} lang={lang} height={180} />
      </div>
    </Card>
  );
}

/**
 * GSQAC indicator detail — self-contained config (not a provider KPI). Shows the
 * indicator score, a deterministic yearly trend line, how-it's-calculated and the
 * GSQAC source. No embedded Compare here (Compare lives on the listing pages, §5/§9).
 */
function GsqacIndicatorDetail({
  found,
  items,
}: {
  found: NonNullable<ReturnType<typeof gsqacIndicatorById>>;
  items: BreadcrumbItem[];
}) {
  const { t, tn, lang } = useT();
  const { area, sub, indicator } = found;
  const c = rag(gsqacStatus(indicator.score));
  const points = gsqacIndicatorTrend(indicator.id, indicator.score);
  const formula =
    lang === "gu"
      ? `"${sub.name}" (${tn(area.name, area.name_gu)}) અંતર્ગત આ સૂચક માટેનો GSQAC ક્ષેત્ર-મૂલ્યાંકન સ્કોર, સત્તાવાર શાળા ગુણવત્તા રૂબ્રિક પર 0–100%.`
      : `GSQAC field-assessment score for this indicator under ${sub.name} (${area.name}), rated 0–100% on the official School Quality rubric.`;
  return (
    <ScreenContainer>
      <RouteBreadcrumb items={items} />

      <div className="pb-2">
        <p className="text-xs font-semibold text-primary-600">{tn(area.name, area.name_gu)}</p>
        <h1 className="mt-0.5 text-xl font-extrabold leading-snug text-neutral-900">{indicator.name}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-neutral-400">
          <FrequencyBadge frequency="Yearly" />
          <span>· 2024–25</span>
          <span className="inline-flex items-center gap-1 truncate" title="GSQAC Dashboard">
            <Database size={10} className="shrink-0" /> GSQAC Dashboard
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2.5">
          <span className={cn("text-4xl font-extrabold tnum leading-none", c.text)}>{locNum(indicator.score, lang)}%</span>
          <RatingBadge grade={gsqacGrade(indicator.score)} size="sm" />
        </div>
      </div>

      <Card className="card-pad">
        <SectionLabel>{t("kpi.trendYearly")}</SectionLabel>
        <div className="mt-2">
          <TrendChart points={points} unit="%" color={c.hex} cadence="yearly" lang={lang} />
        </div>
      </Card>

      <Card className="card-pad">
        <SectionLabel>{t("kpi.formula")}</SectionLabel>
        <p className="mt-2 text-sm text-neutral-700">{formula}</p>
      </Card>
    </ScreenContainer>
  );
}

/**
 * PARAKH detail (§5) — NO yearly trend (3-year cycle). A category legend + a District/
 * State bar key, then per grade (3/6/9) a category header pill and a subject-wise grouped
 * vertical bar chart (District in the grade's category colour, State neutral grey).
 */
function ParakhDetail({ items, lang }: { items: BreadcrumbItem[]; lang: Lang }) {
  const { t } = useT();
  return (
    <ScreenContainer>
      <RouteBreadcrumb items={items} />
      <div className="pb-2">
        <p className="text-xs font-semibold text-primary-600">{t("parakh.assessmentEyebrow")}</p>
        <h1 className="mt-0.5 text-xl font-extrabold leading-snug text-neutral-900">PARAKH</h1>
        <div className="mt-1.5 text-2xs text-neutral-400">{t("common.sample")} · 2024 · {t("parakh.districtVsState")}</div>
      </div>

      <Card className="card-pad">
        <SectionLabel>{t("parakh.legendTitle")}</SectionLabel>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
          {PARAKH_ORDER.map((id) => (
            <span key={id} className="inline-flex items-center gap-1.5 text-2xs font-semibold text-neutral-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: PARAKH_BANDS[id].hex }} />
              {id} · {PARAKH_PERCENTILE[id]}
            </span>
          ))}
        </div>
        <p className="mt-2.5 border-t border-line/60 pt-2.5 text-2xs leading-relaxed text-neutral-400">{t("parakh.barKey")}</p>
      </Card>

      {PARAKH_RESULTS.map((g) => {
        const b = PARAKH_BANDS[g.category];
        return (
          <Card key={g.grade} className="card-pad">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-neutral-900">{g.grade}</span>
              <span className="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-2xs font-bold" style={{ background: b.soft, color: b.text }}>
                {PARAKH_PERCENTILE[g.category]} · {g.category}
              </span>
            </div>
            <ParakhSubjectChart subjects={g.subjects} categoryColor={b.hex} lang={lang} />
          </Card>
        );
      })}
    </ScreenContainer>
  );
}

/**
 * Grade 10 / Grade 12 board-result detail (§7) — headline pass% + year-on-year delta
 * pill, a yearly trend graph (last point = current pass%), how-it's-calculated, and the
 * API-pending source line.
 */
function BoardResultDetail({ board, items, lang }: { board: BoardResult; items: BreadcrumbItem[]; lang: Lang }) {
  const { t } = useT();
  const up = board.delta >= 0;
  return (
    <ScreenContainer>
      <RouteBreadcrumb items={items} />
      <div className="pb-2">
        <p className="text-xs font-semibold text-primary-600">{t("parakh.assessmentEyebrow")}</p>
        <h1 className="mt-0.5 text-xl font-extrabold leading-snug text-neutral-900">{board.name}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-neutral-400">
          <FrequencyBadge frequency="Yearly" />
          <span>· AY {board.year}</span>
          <span className="inline-flex items-center gap-1 truncate" title={t("board.source")}>
            <Database size={10} className="shrink-0" /> {t("board.source")}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-4xl font-extrabold tnum leading-none text-neutral-900">{locNum(board.pass, lang)}%</span>
          <span className="text-sm font-medium text-neutral-500">{t("board.pass")}</span>
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-2xs font-bold", up ? "bg-rag-greenSoft text-rag-greenText" : "bg-rag-redSoft text-rag-redText")}>
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {up ? "+" : "−"}{Math.abs(board.delta)} {t("board.vsYear", { year: board.year })}
          </span>
        </div>
      </div>

      <Card className="card-pad">
        <SectionLabel>{t("kpi.trendYearly")}: {board.name}</SectionLabel>
        <div className="mt-2">
          <TrendChart points={boardTrend(board)} unit="%" color={up ? "#16A34A" : "#DC2626"} cadence="yearly" lang={lang} />
        </div>
      </Card>

      <Card className="card-pad">
        <SectionLabel>{t("kpi.formula")}</SectionLabel>
        <p className="mt-2 text-sm text-neutral-700">{t("board.howCalc")}</p>
      </Card>
    </ScreenContainer>
  );
}
