import { useMemo, useState } from "react";
import type { Entity } from "@/types";
import { dataProvider } from "@/data/provider";
import { getKpiAmong } from "@/engine";
import { useScope, useFramework, useKpiRecord, PERIODS } from "@/hooks";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { rag } from "@/lib/colors";
import { formatValue, pct } from "@/lib/format";
import { Card, SectionLabel, Badge, StatusDot } from "@/components/ui/atoms";
import { ComparisonBars, type CompareBar } from "@/components/ui/ComparisonBars";

export default function SectionComparison() {
  const { entity } = useScope();
  const fw = useFramework();
  const { t, tn, lang } = useT();

  // class-level KPIs only (those that exist at the section level)
  const classKpis = useMemo(() => fw.kpis.filter((k) => k.level_representation.section === "class"), [fw]);

  // resolve the school context for the current scope
  const schoolList = useMemo<Entity[]>(() => {
    if (!entity) return [];
    if (["state", "district", "block", "cluster"].includes(entity.level)) return dataProvider.getDescendants(entity.id, "school");
    return [];
  }, [entity]);

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
        <div className="flex flex-wrap items-center gap-2">
          {schoolList.length > 0 && (
            <Select label={t("levels.school")} value={school.id} onChange={(v) => { setSchoolId(v); setGradeId(null); }}>
              {schoolList.map((s) => <option key={s.id} value={s.id}>{tn(s.name, s.name_gu)}</option>)}
            </Select>
          )}
          <Select label={t("section.chooseGrade")} value={grade?.id ?? ""} onChange={setGradeId}>
            {grades.map((g) => <option key={g.id} value={g.id}>{tn(g.name, g.name_gu)}</option>)}
          </Select>
          <Select label={t("section.choose")} value={kpi?.id ?? ""} onChange={setKpiId}>
            {classKpis.map((k) => <option key={k.id} value={k.id}>{tn(k.name, k.name_gu)}</option>)}
          </Select>
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

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-2xs font-bold uppercase tracking-wider text-neutral-400">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-full border border-line bg-neutral-50 px-3 py-1.5 text-sm font-semibold text-neutral-700 outline-none focus:border-primary-400">
        {children}
      </select>
    </label>
  );
}

function Header({ t }: { t: (k: string, v?: Record<string, string | number>) => string }) {
  return (
    <div>
      <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">{t("section.title")}</h1>
      <p className="mt-0.5 text-sm text-neutral-500">{t("section.subtitle")}</p>
    </div>
  );
}
