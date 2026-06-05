import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Entity, Scorecard } from "@/types";
import { hash } from "@/data/prng";
import { dataProvider } from "@/data/provider";
import { getKpiRecord } from "@/engine";
import { useScorecard, useFramework, PERIODS } from "@/hooks";
import { COMPLIANCE } from "@/config/complianceBands";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { rag, accent } from "@/lib/colors";
import { pct, locNum } from "@/lib/format";
import { Card, SectionLabel, Badge, ProgressBar } from "@/components/ui/atoms";
import { Sparkline } from "@/components/ui/Sparkline";
import { KpiCard } from "@/components/ui/KpiCard";
import { InfoTooltip } from "@/components/ui/Tooltip";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { VskBadge } from "@/components/ui/VskBadge";
import { GraduationCap, Sparkles, AlertTriangle, BookOpen } from "@/components/ui/Icon";

/**
 * Teacher persona (Epic 2): classroom-level only. TPD tracker, Classroom Pulse
 * (At Risk + holistic tooltip), threshold-based evaluation copy. The
 * "Improvement Actions for Teachers" admin array is intentionally NOT rendered
 * here (FCR-2.3 data masking).
 */
// the 5 school-level KPIs in the teacher's 14 (beyond the 8 classroom + TPD tracker)
const SCHOOL_CONTEXT = ["att_report", "dropout_reduction", "gsqac_score", "gsqac_improvement", "improvement_actions"];

export function TeacherView({ entity, greeting }: { entity: Entity; greeting: string }) {
  const sc = useScorecard(entity.id);
  const fw = useFramework();
  const { t, tn, lang } = useT();
  const navigate = useNavigate();

  // the teacher's school, for the "your school" context strip
  const schoolId = useMemo(() => dataProvider.getAncestors(entity.id).find((a) => a.level === "school")?.id, [entity.id]);
  const schoolCtx = useMemo(
    () => (schoolId ? SCHOOL_CONTEXT.map((id) => getKpiRecord(fw, id, schoolId, PERIODS)).filter((r): r is NonNullable<typeof r> => !!r && r.value != null) : []),
    [fw, schoolId],
  );
  if (!sc) return null;

  const tpdTarget = COMPLIANCE.tpdTargetHours; // 50 hrs/yr (config, mirrors tpd_hours KPI target)
  const anchor = entity.meta.anchor ?? 0.6;
  const tpdDone = Math.min(tpdTarget, Math.round(28 + anchor * 22));
  const sevenDay = Array.from({ length: 7 }, (_, i) => 0.4 + ((hash(entity.id + "d" + i) % 100) / 100) * 1.8 + i * 0.12);
  const atRisk = Math.max(0, Math.round(2 + (1 - anchor) * 6));
  const evalUp = Math.round(3 + anchor * 8);
  const tpdStatus = tpdDone >= COMPLIANCE.training.green ? "green" : tpdDone >= COMPLIANCE.training.amber ? "amber" : "red";
  const needsImprovement = (sc.overallPercent ?? 100) < COMPLIANCE.needsImprovementBelow;

  const teacherName = entity.meta.teacher_name ?? "";
  const scoredDomains = sc.domainScores.filter((d) => d.percent != null);

  return (
    <div className="space-y-5">
      {/* greeting + evaluation header */}
      <div className="flex items-center gap-3">
        <VskBadge size={40} />
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
            {greeting}{teacherName ? `, ${teacherName.split(" ")[0]}` : ""}!
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {t("levels.section")} {entity.name} · {sc.grade ? `${t("common.grade")} ${sc.grade}` : t("common.na")}
          </p>
        </div>
      </div>

      {needsImprovement ? (
        <Card className="card-pad border border-rag-amber/30 bg-rag-amberSoft/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-rag-amberText" size={20} />
            <div>
              <div className="font-bold text-neutral-900">{t("teacher.needsImprovement")}</div>
              <p className="mt-0.5 text-sm text-neutral-600">{t("teacher.improvementPrev")}: <b className="text-rag-greenText">+{locNum(evalUp, lang)}%</b></p>
              <div className="mt-2 flex flex-wrap gap-2">
                <ModuleLink label={t("teacher.moduleFln")} />
                <ModuleLink label={t("teacher.moduleMaths")} />
                <ModuleLink label={t("teacher.moduleAssess")} />
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="card-pad border border-rag-green/30 bg-rag-greenSoft/40">
          <div className="flex items-center gap-3">
            <Sparkles className="shrink-0 text-rag-greenText" size={20} />
            <div>
              <div className="font-bold text-neutral-900">{t("teacher.onTrackHeader")}</div>
              <p className="text-sm text-neutral-600">{t("teacher.improvementPrev")}: <b className="text-rag-greenText">+{locNum(evalUp, lang)}%</b></p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* TPD journey */}
        <Card className="card-pad">
          <div className="flex items-center gap-2"><GraduationCap size={18} className="text-violet-600" /><SectionLabel>{t("teacher.tpdJourney")}</SectionLabel></div>
          <div className="mt-3 flex items-end justify-between">
            <div className="text-2xl font-extrabold tnum text-neutral-900">{locNum(tpdDone, lang)}<span className="text-base font-semibold text-neutral-400"> / {locNum(tpdTarget, lang)} {t("teacher.hrs")}</span></div>
            <Badge status={tpdStatus} className="!text-2xs">{Math.round((tpdDone / tpdTarget) * 100)}%</Badge>
          </div>
          <ProgressBar value={(tpdDone / tpdTarget) * 100} status={tpdStatus} className="mt-2" height={10} label={t("teacher.tpdJourney")} />
          <div className="mt-3">
            <div className="mb-1 text-2xs font-semibold text-neutral-400">{t("teacher.sevenDay")}</div>
            <Sparkline data={sevenDay} color={accent("purple").hex} width={220} height={36} />
          </div>
        </Card>

        {/* classroom pulse */}
        <Card className="card-pad">
          <SectionLabel>{t("teacher.classroomPulse")}</SectionLabel>
          <div className="mt-3 flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rag-redSoft text-rag-redText text-xl font-extrabold tnum">{locNum(atRisk, lang)}</span>
            <div>
              <div className="flex items-center gap-1 font-semibold text-neutral-800">
                {t("teacher.studentsAtRisk")}
                <InfoTooltip text={t("atRisk.tooltip")} />
              </div>
              <Badge className="mt-0.5 bg-rag-redSoft text-rag-redText !text-2xs">{t("atRisk.label")}</Badge>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2">
            <span className="text-xs text-neutral-500">{t("teacher.evalStatus")}</span>
            <span className="text-xs font-bold text-rag-greenText">+{locNum(evalUp, lang)}% {t("common.vsBenchmark")}</span>
          </div>
        </Card>
      </div>

      {/* classroom KPIs (the section's applicable learning indicators) */}
      <div>
        <SectionLabel className="mb-2">{t("teacher.classroomKpis")}</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {scoredDomains.flatMap((d) => d.records.filter((r) => r.value != null)).map((r) => (
            <KpiCard key={r.kpi.id} rec={r} name={tn(r.kpi.name, r.kpi.name_gu)} lang={lang} onClick={() => navigate(`/app/kpi/${r.kpi.id}`)} />
          ))}
        </div>
      </div>

      {/* your school — context KPIs attributed at the school level */}
      {schoolCtx.length > 0 && (
        <Card className="card-pad">
          <SectionLabel>{t("teacher.yourSchool")}</SectionLabel>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {schoolCtx.map((r) => (
              <button key={r.kpi.id} onClick={() => navigate(`/app/kpi/${r.kpi.id}`)} className="rounded-xl border border-line/70 p-2.5 text-left hover:bg-neutral-50">
                <div className="line-clamp-2 text-2xs font-medium text-neutral-500">{tn(r.kpi.name, r.kpi.name_gu)}</div>
                <div className={cn("mt-1 text-base font-extrabold tnum", rag(r.status).text)}>{pct(r.value, lang)}</div>
              </button>
            ))}
          </div>
        </Card>
      )}

      <DomainRagStrip sc={sc} />
    </div>
  );
}

function ModuleLink({ label }: { label: string }) {
  const { t } = useT();
  return (
    <button className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-primary-600 ring-1 ring-primary-200 hover:bg-primary-50" title={t("teacher.viewModule")}>
      <BookOpen size={13} /> {label}
    </button>
  );
}

function DomainRagStrip({ sc }: { sc: Scorecard }) {
  const { tn } = useT();
  const scored = sc.domainScores.filter((d) => d.weightage > 0 && d.percent != null);
  if (!scored.length) return null;
  return (
    <Card className="card-pad">
      <div className="flex flex-wrap items-center gap-3">
        {sc.grade && <RatingBadge grade={sc.grade} size="md" />}
        {scored.map((d) => (
          <span key={d.domain.id} className={cn("chip", rag(d.status).soft, rag(d.status).text)}>
            {tn(d.domain.name, d.domain.name_gu).replace(/^A\d ·\s*/, "")} {pct(d.percent)}
          </span>
        ))}
      </div>
    </Card>
  );
}
