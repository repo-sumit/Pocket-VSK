import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Entity, RagStatus } from "@/types";
import { hash } from "@/data/prng";
import { dataProvider } from "@/data/provider";
import { useScorecard, useKpiRecord } from "@/hooks";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { rag } from "@/lib/colors";
import { pct, locNum } from "@/lib/format";
import { Card, SectionLabel, ProgressBar, Button, StatusDot } from "@/components/ui/atoms";
import { RatingRing } from "@/components/ui/RatingRing";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { DomainBar } from "@/components/ui/DomainBar";
import { VskBadge } from "@/components/ui/VskBadge";
import { Award, Download, ShieldCheck, Target } from "@/components/ui/Icon";

/**
 * Principal / School persona (Epic 3): operational compliance + health metrics.
 * Honours the access-control matrix — "Improvement Actions of the School"
 * (state/inspector data) is suppressed entirely (FCR-3.8).
 */
export function PrincipalView({ entity, greeting }: { entity: Entity; greeting: string }) {
  const sc = useScorecard(entity.id);
  const state = useScorecard("st-gj");
  const gsqac = useKpiRecord("gsqac_score", entity.id);
  const gsqacImprove = useKpiRecord("gsqac_improvement", entity.id);
  const chronic = useKpiRecord("att_chronic", entity.id);
  const { t, tn, lang } = useT();
  const navigate = useNavigate();

  const sections = useMemo(() => dataProvider.getDescendants(entity.id, "section"), [entity.id]);

  if (!sc) return null;
  const stateDomainPct: Record<string, number | null> = {};
  state?.domainScores.forEach((d) => (stateDomainPct[d.domain.id] = d.percent));
  const scored = sc.domainScores.filter((d) => d.weightage > 0 && d.records.length > 0);

  // ── compliance telemetry (FCR-3.6) ──
  const enrolment = entity.meta.enrolment ?? 200;
  const teachers = entity.meta.teachers ?? 10;
  const ptr = Math.round(enrolment / teachers);
  const maxClass = Math.max(...sections.map((s) => (s.meta.students as number) ?? 24), 24);
  const avgTraining = Math.round(28 + (entity.meta.anchor ?? 0.6) * 22);
  const chronicCount = chronic?.value ?? 0;

  const ptrStatus: RagStatus = ptr <= 27 ? "green" : ptr <= 32 ? "amber" : "red";
  const enrolStatus: RagStatus = enrolment >= 150 ? "green" : enrolment >= 120 ? "amber" : "red";
  const classStatus: RagStatus = maxClass <= 30 ? "green" : maxClass <= 33 ? "amber" : "red";
  const trainStatus: RagStatus = avgTraining >= 50 ? "green" : avgTraining >= 40 ? "amber" : "red";

  // ── GSQAC scoreboard (FCR-3.2) ──
  const gsqacAchieved = gsqac?.value != null ? Math.round((gsqac.value / 100) * 1000) : null;

  // ── attendance gap detector (FCR-3.4) ──
  const classes = sections.map((s) => ({ s, submitted: hash(s.id + "att-today") % 5 !== 0 }));
  const unsubmitted = classes.filter((c) => !c.submitted);

  // ── dropout reduction (FCR-3.5) ──
  const fewerDropouts = 5 + (hash(entity.id + "drop") % 18);

  const downloadNames = () => {
    const rows = [["Class", "Teacher", "Student (sample)"]];
    unsubmitted.forEach((c) => {
      const tname = c.s.meta.teacher_name ?? "";
      const n = 2 + (hash(c.s.id + "n") % 3);
      for (let i = 0; i < n; i++) rows.push([c.s.name, tname, `Student ${(hash(c.s.id + i) % 40) + 1}`]);
    });
    const csv = rows.map((r) => r.map((x) => `"${x}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `unsubmitted-attendance-${entity.meta.code}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <VskBadge size={40} />
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">{greeting}!</h1>
          <p className="mt-0.5 truncate text-sm text-neutral-500">{tn(entity.name, entity.name_gu)} · {entity.meta.code}{entity.meta.pmShri ? " · PM SHRI" : ""}</p>
        </div>
      </div>

      {/* hero: school score + School vs State */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="card-pad flex flex-col items-center justify-center gap-2 lg:col-span-2">
          <SectionLabel>{t("scorecard.overall")}</SectionLabel>
          <RatingRing percent={sc.overallPercent} grade={sc.grade} lang={lang} sublabel={t("common.grade")} />
          {sc.grade && <RatingBadge grade={sc.grade} size="md" />}
        </Card>

        <Card className="card-pad lg:col-span-3">
          <div className="mb-1 flex items-center justify-between">
            <SectionLabel>{t("principal.schoolVsState")}</SectionLabel>
            {state?.overallPercent != null && (
              <span className="text-2xs text-neutral-400">{t("principal.school")} {pct(sc.overallPercent, lang)} · {t("principal.state")} {pct(state.overallPercent, lang)}</span>
            )}
          </div>
          <div className="-mx-2 divide-y divide-line/60">
            {scored.map((ds) => (
              <DomainBar key={ds.domain.id} ds={ds} name={tn(ds.domain.name, ds.domain.name_gu).replace(/^A\d ·\s*/, "")} parentPercent={stateDomainPct[ds.domain.id]} parentLabel={t("principal.state")} lang={lang} onClick={() => navigate(`/app/domain/${ds.domain.id}`)} />
            ))}
          </div>
        </Card>
      </div>

      {/* GSQAC scoreboard + dropout */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="card-pad">
          <div className="flex items-center gap-2"><Award size={18} className="text-pink-600" /><SectionLabel>{t("principal.gsqacScoreboard")}</SectionLabel></div>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-extrabold tnum text-neutral-900">{gsqacAchieved != null ? locNum(gsqacAchieved, lang) : t("common.na")}</span>
            <span className="mb-1 text-lg font-semibold text-neutral-400">/ {locNum(1000, lang)}</span>
          </div>
          {gsqac?.value != null && <ProgressBar value={gsqac.value} status={gsqac.status} className="mt-2" height={10} label={t("principal.gsqacScoreboard")} />}
          {gsqacImprove?.value != null && (
            <p className="mt-2 text-xs text-neutral-500">{t("principal.improvementLastCycle")}: <b className="text-rag-greenText">+{locNum(Math.abs(Math.round(gsqacImprove.value)), lang)}%</b></p>
          )}
        </Card>

        <Card className="card-pad flex flex-col justify-center">
          <SectionLabel>{t("principal.dropout")}</SectionLabel>
          <div className="mt-2 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rag-greenSoft text-2xl font-extrabold tnum text-rag-greenText">{locNum(fewerDropouts, lang)}</span>
            <p className="text-sm font-semibold text-neutral-700">{t("principal.fewerDropouts", { n: locNum(fewerDropouts, lang) })}</p>
          </div>
        </Card>
      </div>

      {/* compliance benchmarks (RYG) */}
      <Card className="card-pad">
        <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-600" /><SectionLabel>{t("principal.complianceTitle")}</SectionLabel></div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <Compliance label={t("principal.ptr")} value={`${locNum(ptr, lang)}:1`} hint={t("principal.ptrTarget")} status={ptrStatus} />
          <Compliance label={t("principal.classCapacity")} value={locNum(maxClass, lang)} hint={t("principal.classCapTarget")} status={classStatus} />
          <Compliance label={t("principal.enrolment")} value={locNum(enrolment, lang)} hint={t("principal.enrolTarget")} status={enrolStatus} />
          <Compliance label={t("principal.avgTraining")} value={`${locNum(avgTraining, lang)}h`} hint={t("principal.avgTrainTarget")} status={trainStatus} />
          <Compliance label={t("principal.chronicAbs")} value={locNum(chronicCount, lang)} hint={t("principal.sevenDayWindow")} status={chronicCount <= enrolment * 0.05 ? "green" : chronicCount <= enrolment * 0.1 ? "amber" : "red"} />
        </div>
      </Card>

      {/* attendance submission gap detector */}
      <Card className="card-pad">
        <div className="flex items-center justify-between">
          <SectionLabel>{t("principal.attendanceGap")}</SectionLabel>
          {unsubmitted.length > 0 && (
            <Button onClick={downloadNames} className="!px-3 !py-1.5 !text-xs"><Download size={14} /> {t("principal.downloadNames")}</Button>
          )}
        </div>
        {unsubmitted.length === 0 ? (
          <p className="mt-3 text-sm text-rag-greenText">{t("principal.allSubmitted")}</p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {classes.map((c) => (
                <span key={c.s.id} className={cn("grid h-9 w-9 place-items-center rounded-lg text-2xs font-bold", c.submitted ? "bg-rag-greenSoft text-rag-greenText" : "bg-rag-redSoft text-rag-redText ring-1 ring-rag-red/40")} title={`${c.s.name} · ${c.s.meta.teacher_name}`}>
                  {c.s.name}
                </span>
              ))}
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-line/70">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-2xs uppercase tracking-wide text-neutral-400">
                  <tr><th className="px-3 py-2">{t("principal.classId")}</th><th className="px-3 py-2">{t("principal.teacherName")}</th><th className="px-3 py-2 text-right">{t("principal.notSubmitted")}</th></tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {unsubmitted.slice(0, 6).map((c) => (
                    <tr key={c.s.id}>
                      <td className="px-3 py-2 font-semibold text-neutral-800">{c.s.name}</td>
                      <td className="px-3 py-2 text-neutral-600">{c.s.meta.teacher_name}</td>
                      <td className="px-3 py-2 text-right"><StatusDot status="red" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* RYG status matrix + Teacher Actions (visible to principal) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="card-pad">
          <SectionLabel>{t("principal.statusMatrix")}</SectionLabel>
          <table className="mt-3 w-full text-left text-sm">
            <tbody className="divide-y divide-line/60">
              {scored.map((d) => (
                <tr key={d.domain.id}>
                  <td className="py-2 font-medium text-neutral-700">{tn(d.domain.name, d.domain.name_gu).replace(/^A\d ·\s*/, "")}</td>
                  <td className="py-2 text-right"><span className={cn("font-bold tnum", rag(d.status).text)}>{pct(d.percent, lang)}</span></td>
                  <td className="py-2 pl-3 text-right"><StatusDot status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="card-pad">
          <div className="flex items-center gap-2"><Target size={18} className="text-primary-500" /><SectionLabel>{t("principal.teacherActions")}</SectionLabel></div>
          <ul className="mt-3 space-y-2 text-sm">
            {scored.filter((d) => d.status !== "green").slice(0, 4).map((d) => (
              <li key={d.domain.id} className="flex items-start gap-2">
                <StatusDot status={d.status} className="mt-1.5" />
                <span className="text-neutral-600">{tn(d.domain.name, d.domain.name_gu).replace(/^A\d ·\s*/, "")}: {lang === "gu" ? "ધ્યાન કેન્દ્રિત તાલીમ યોજના" : "focused teacher support plan"}</span>
              </li>
            ))}
            {scored.every((d) => d.status === "green") && <li className="text-neutral-400">{lang === "gu" ? "બધા ડોમેન સારી સ્થિતિમાં." : "All domains on track."}</li>}
          </ul>
          {/* NOTE: "Improvement Actions of the School" (state/inspector data) is intentionally suppressed (FCR-3.8). */}
        </Card>
      </div>
    </div>
  );
}

function Compliance({ label, value, hint, status }: { label: string; value: string; hint: string; status: RagStatus }) {
  return (
    <div className={cn("rounded-xl border p-3", rag(status).border, rag(status).soft)}>
      <div className="flex items-center justify-between"><span className="text-2xs font-semibold text-neutral-500">{label}</span><StatusDot status={status} /></div>
      <div className={cn("mt-1 text-xl font-extrabold tnum", rag(status).text)}>{value}</div>
      <div className="text-2xs text-neutral-400">{hint}</div>
    </div>
  );
}
