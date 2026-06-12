import { useState } from "react";
import type { Entity, Level, Role } from "@/types";
import { cn } from "@/lib/cn";
import { peerAvg, peerLevelOf } from "@/lib/peer";
import { formatValue } from "@/lib/format";
import { useT, type Lang } from "@/i18n";
import { Card } from "./atoms";
import { ChevronDown } from "./Icon";
import {
  TEACHER_ABSENTEES, ABSENT_BY_GRADE, TEACHER_UNTRACKED, UNTRACKED_BY_GRADE,
  unitCounts, type AbsentStudent,
} from "@/lib/rosterMock";

/**
 * Role-aware detail for the "students absent 7+ days" (kind="absent") and "untracked
 * students" (kind="untracked") indicators (§6, §18, §19). Replaces the trend chart on
 * these pages with actionable lists — never graph-first for teacher/principal:
 *  • teacher   → student names list (own class)
 *  • principal → grade-wise breakdown (absent expands to names)
 *  • officer   → N-1 hierarchy counts (no names, §23)
 */
export function RosterDetail({
  kind, role, level, value, units, childLevel, lang,
}: {
  kind: "absent" | "untracked";
  role: Role;
  level: Level;
  value: number | null;
  units: Entity[];
  childLevel: Level | null;
  lang: Lang;
}) {
  const { t } = useT();
  const isTeacher = role === "teacher";
  const isPrincipal = role === "principal";
  const kpiId = kind === "absent" ? "att_chronic" : "ret_dropout";

  // N+1 comparison (count → no "avg"), shown as a pill in the summary
  const parentLevel = peerLevelOf(level);
  const peer = parentLevel ? peerAvg(kpiId, level) : null;

  const summary = (
    <Card className="card-pad">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="flex items-baseline gap-2">
          <b className="text-3xl font-extrabold tnum text-neutral-900">
            {value == null ? "—" : formatValue(value, "count", lang)}
          </b>
          <span className="text-sm font-medium text-neutral-500">
            {kind === "absent" ? t("roster.studentsAbsent") : t("roster.untrackedCount")}
          </span>
        </span>
        {peer != null && parentLevel && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 ring-1 ring-primary-200">
            {t("common.vs")} {t(`levels.${parentLevel}`)} ·{" "}
            <span className="tnum">{formatValue(peer, "count", lang)}</span>
          </span>
        )}
      </div>
    </Card>
  );

  return (
    <div className="flex flex-col gap-3">
      {summary}
      {isTeacher ? (
        <TeacherList kind={kind} />
      ) : isPrincipal ? (
        <PrincipalList kind={kind} />
      ) : (
        <OfficerList kind={kind} childLevel={childLevel} units={units} />
      )}
    </div>
  );
}

/** teacher → own-class student names (§23 allows names within scope). */
function TeacherList({ kind }: { kind: "absent" | "untracked" }) {
  const { t } = useT();
  if (kind === "absent") {
    return (
      <Card className="card-pad">
        <div className="text-sm font-bold text-neutral-900">{t("roster.absentInClass")}</div>
        <div className="mt-1">{TEACHER_ABSENTEES.map((s, i) => <AbsentRow key={s.name + i} s={s} first={i === 0} />)}</div>
      </Card>
    );
  }
  return (
    <Card className="card-pad">
      <div className="text-sm font-bold text-neutral-900">{t("roster.studentList")}</div>
      <div className="text-2xs text-neutral-400">{t("roster.untrackedSub")}</div>
      <div className="mt-1">
        {TEACHER_UNTRACKED.map((s, i) => (
          <div key={s.name + i} className={cn("flex items-center gap-3 py-2.5", i && "border-t border-line/60")}>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-50 text-xs font-extrabold text-primary-700">{s.name[0]}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-neutral-900">{s.name}</span>
              <span className="block text-2xs text-neutral-400">{s.section} · {t("roster.lastSeen", { date: s.lastSeen })}</span>
            </span>
            <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-2xs font-bold", s.status === "reenrolled" ? "bg-rag-greenSoft text-rag-greenText" : "bg-surface-sunken text-neutral-600")}>
              {s.status === "reenrolled" ? t("roster.reenrolled") : t("roster.untracked")}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** principal → grade-wise breakdown; absent rows expand to the class roster. */
function PrincipalList({ kind }: { kind: "absent" | "untracked" }) {
  const { t } = useT();
  if (kind === "untracked") {
    return (
      <Card className="card-pad">
        <div className="text-sm font-bold text-neutral-900">{t("roster.byGrade")}</div>
        <div className="mt-1">
          {UNTRACKED_BY_GRADE.map((g, i) => (
            <div key={g.grade} className={cn("flex items-center justify-between py-2.5", i && "border-t border-line/60")}>
              <span className="text-sm font-semibold text-neutral-900">{g.grade}</span>
              <span className="text-base font-extrabold tnum text-neutral-900">{g.n}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  }
  return (
    <Card className="card-pad">
      <div className="mb-1 text-sm font-bold text-neutral-900">{t("roster.classWise")}</div>
      {ABSENT_BY_GRADE.map((g) => <ClassAccordion key={g.grade} grade={g.grade} n={g.n} students={g.students} />)}
    </Card>
  );
}

function ClassAccordion({ grade, n, students }: { grade: string; n: number; students: AbsentStudent[] }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-line/60 first:border-t-0">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 py-3 text-left" aria-expanded={open}>
        <span className="flex-1 text-sm font-bold text-neutral-900">{grade}</span>
        <span className="text-sm font-semibold text-neutral-500">{n} {n === 1 ? t("roster.student") : t("roster.students")}</span>
        <ChevronDown size={16} className={cn("shrink-0 text-neutral-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="pb-1">{students.map((s, i) => <AbsentRow key={s.name + i} s={s} first={i === 0} />)}</div>}
    </div>
  );
}

function AbsentRow({ s, first }: { s: AbsentStudent; first?: boolean }) {
  const { t } = useT();
  return (
    <div className={cn("flex items-start gap-3 py-2.5", !first && "border-t border-line/60")}>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-50 text-xs font-extrabold text-primary-700">{s.name[0]}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-neutral-900">{s.name}</span>
        <span className="block text-2xs text-neutral-500">{s.section} · {t("roster.absentForDays", { n: s.days })}</span>
        <span className="block text-2xs text-neutral-400">{t("roster.lastPresent", { date: s.lastPresent })}</span>
      </span>
    </div>
  );
}

/** officer → N-1 hierarchy counts, no names (§23). */
function OfficerList({
  kind, childLevel, units,
}: {
  kind: "absent" | "untracked";
  childLevel: Level | null;
  units: Entity[];
}) {
  const { t } = useT();
  const rows = unitCounts(units, kind);
  const unitWord = childLevel ? `${t(`levels.${childLevel}`)}s` : t("scorecard.subDomains");
  const heading = kind === "absent"
    ? t("roster.unitsWithAbsent", { unit: unitWord })
    : t("roster.unitsWithUntracked", { unit: unitWord });
  if (!rows.length) {
    return <Card className="card-pad text-center text-sm text-neutral-500">{t("compare.notTracked")}</Card>;
  }
  return (
    <Card className="card-pad">
      <div className="mb-1 text-sm font-bold text-neutral-900">{heading}</div>
      <div>
        {rows.map((r, i) => (
          <div key={r.name} className={cn("flex items-center gap-3 py-2.5", i && "border-t border-line/60")}>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-900">{r.name}</span>
            <span className="shrink-0 text-base font-extrabold tnum text-neutral-900">{r.n}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
