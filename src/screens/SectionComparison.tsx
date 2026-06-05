import { useMemo, useState } from "react";
import type { Entity } from "@/types";
import { dataProvider } from "@/data/provider";
import { getKpiAmong } from "@/engine";
import { useScope, useFramework, useKpiRecord, usePmShri, PERIODS } from "@/hooks";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { rag } from "@/lib/colors";
import { formatValue, pct } from "@/lib/format";
import { Card, SectionLabel, Badge, StatusDot } from "@/components/ui/atoms";
import { ComparisonBars, type CompareBar } from "@/components/ui/ComparisonBars";
import { Select } from "@/components/ui/Select";
import { VskBadge } from "@/components/ui/VskBadge";

export default function SectionComparison() {
  const { entity } = useScope();
  const fw = useFramework();
  const { t, tn, lang } = useT();

  // class-level KPIs only (those that exist at the section level)
  const classKpis = useMemo(() => fw.kpis.filter((k) => k.level_representation.section === "class"), [fw]);

  // resolve the school context for the current scope (cached + PM-SHRI-aware)
  const pmShri = usePmShri();
  const schoolList = useMemo<Entity[]>(() => {
    if (!entity) return [];
    if (["state", "district", "block", "cluster"].includes(entity.level)) {
      dataProvider.setSchoolFilter(pmShri);
      return dataProvider.getSchoolDescendants(entity.id);
    }
    return [];
  }, [entity, pmShri]);

  const derivedSchool = useMemo<Entity | undefined>(() => {
    if (!entity) return undefined;
    if (entity.level === "school") return entity;
    if (entity.level === "grade" || entity.level === "section") return dataProvider.getAncestors(entity.id).find((a) => a.level === "school");
    return schoolList[0];
  }, [entity, schoolList]);

  const [schoolId, setSchoolId] = useState<string | null>(null);
  const school = (schoolId ? dataProvider.getEntity(schoolId) : undefined) ?? derivedSchool;

  const grades = useMemo(() => (school ? dataProvider.getChildren(school.id) : []), [school]);
  const currentGradeId = entity?.level === "grade" ? entity.id : entity?.level === "section" ? dataProvider.getAncestors(entity.id).find((a) => a.level === "grade")?.id : undefined;
  const [gradeId, setGradeId] = useState<string | null>(null);
  const grade = (gradeId ? dataProvider.getEntity(gradeId) : undefined) ?? (currentGradeId ? dataProvider.getEntity(currentGradeId) : undefined) ?? grades[0];

  const sections = useMemo(() => (grade ? dataProvider.getChildren(grade.id) : []), [grade]);

  const [kpiId, setKpiId] = useState<string | null>(null);
  const kpi = (kpiId && classKpis.find((k) => k.id === kpiId)) || classKpis[0];

  const rows = useMemo(
    () => (kpi && sections.length ? getKpiAmong(fw, kpi.id, sections, PERIODS, entity?.level === "section" ? entity.id : undefined) : []),
    [fw, kpi, sections, entity],
  );
  const gradeRec = useKpiRecord(kpi?.id, grade?.id);
  const schoolRec = useKpiRecord(kpi?.id, school?.id);

  if (!entity) return null;
  if (!school || !sections.length) {
    return (
      <div className="space-y-4">
        <Header t={t} />
        <Card className="card-pad text-sm text-neutral-500">{t("section.noSections")}</Card>
      </div>
    );
  }

  const bars: CompareBar[] = [
    ...rows.map((r) => ({
      key: r.entity.id,
      label: lang === "gu" && r.entity.name_gu ? r.entity.name_gu : r.entity.name,
      sublabel: r.entity.meta.teacher_name,
      value: r.value,
      status: r.status,
      isCurrent: r.isCurrent,
    })),
    ...(gradeRec ? [{ key: "grade-avg", label: t("levels.grade"), sublabel: t("common.average"), value: gradeRec.value, status: gradeRec.status }] : []),
    ...(schoolRec ? [{ key: "school-avg", label: t("levels.school"), sublabel: t("common.average"), value: schoolRec.value, status: schoolRec.status }] : []),
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <Header t={t} />

      <Card className="card-pad">
        <div className="flex flex-wrap items-end gap-3">
          {schoolList.length > 0 && (
            <Field label={t("levels.school")} className="min-w-[11rem] flex-1 sm:max-w-[16rem]">
              <Select
                ariaLabel={t("levels.school")}
                value={school.id}
                onChange={(v) => { setSchoolId(v); setGradeId(null); }}
                options={schoolList.map((s) => ({ value: s.id, label: tn(s.name, s.name_gu) }))}
                className="w-full"
                triggerClassName="w-full"
              />
            </Field>
          )}
          <Field label={t("section.chooseGrade")} className="min-w-[8.5rem] flex-1 sm:max-w-[12rem]">
            <Select
              ariaLabel={t("section.chooseGrade")}
              value={grade?.id ?? ""}
              onChange={setGradeId}
              options={grades.map((g) => ({ value: g.id, label: tn(g.name, g.name_gu) }))}
              className="w-full"
              triggerClassName="w-full"
            />
          </Field>
          <Field label={t("section.choose")} className="min-w-[11rem] flex-1 sm:max-w-[16rem]">
            <Select
              ariaLabel={t("section.choose")}
              value={kpi?.id ?? ""}
              onChange={setKpiId}
              options={classKpis.map((k) => ({ value: k.id, label: tn(k.name, k.name_gu) }))}
              className="w-full"
              triggerClassName="w-full"
            />
          </Field>
        </div>

        <div className="mt-5">
          {bars.some((b) => b.value != null) ? (
            <ComparisonBars bars={bars} unit={kpi?.unit ?? "%"} lang={lang} height={196} />
          ) : (
            <p className="py-8 text-center text-sm text-neutral-400">{t("kpi.noData")}</p>
          )}
        </div>
      </Card>

      {/* ranked sections */}
      <Card className="card-pad">
        <SectionLabel>{t("section.rank")} · {tn(grade?.name ?? "", grade?.name_gu)}</SectionLabel>
        <ol className="mt-3 space-y-1.5">
          {[...rows].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)).map((r) => (
            <li key={r.entity.id} className={cn("flex items-center gap-3 rounded-xl border px-3 py-2.5", r.isCurrent ? "border-primary-300 bg-primary-50/70" : "border-line/70")}>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-neutral-50 text-xs font-bold text-neutral-500 tnum">{r.rank ?? "—"}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
                  {lang === "gu" && r.entity.name_gu ? r.entity.name_gu : r.entity.name}
                  {r.isCurrent && <Badge className="bg-primary-100 text-primary-700 !py-0.5">{t("section.yourSection")}</Badge>}
                </span>
                {r.entity.meta.teacher_name && <span className="text-2xs text-neutral-400">{r.entity.meta.teacher_name}</span>}
              </span>
              <StatusDot status={r.status} />
              <span className={cn("w-14 text-right text-sm font-extrabold tnum", rag(r.status).text)}>
                {r.value == null ? "NA" : formatValue(r.value, kpi?.unit ?? "%", lang)}
              </span>
            </li>
          ))}
        </ol>
        {schoolRec?.value != null && (
          <p className="mt-3 border-t border-line/60 pt-3 text-2xs text-neutral-400">
            {t("levels.school")} {t("common.average")}: <b className="text-neutral-600">{pct(schoolRec.value, lang)}</b>
            {gradeRec?.value != null && <> · {t("levels.grade")} {t("common.average")}: <b className="text-neutral-600">{pct(gradeRec.value, lang)}</b></>}
          </p>
        )}
      </Card>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-2xs font-bold uppercase tracking-wider text-neutral-400">{label}</span>
      {children}
    </div>
  );
}

function Header({ t }: { t: (k: string, v?: Record<string, string | number>) => string }) {
  return (
    <div className="flex items-center gap-3">
      <VskBadge size={40} />
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">{t("section.title")}</h1>
        <p className="mt-0.5 text-sm text-neutral-500">{t("section.subtitle")}</p>
      </div>
    </div>
  );
}
