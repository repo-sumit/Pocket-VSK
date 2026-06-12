import { useState } from "react";
import { cn } from "@/lib/cn";
import { locNum } from "@/lib/format";
import { useT, type Lang } from "@/i18n";
import {
  PARAKH_BAND_CAT, PARAKH_SURVEY_YEAR, parakhDistrictRows, parakhStateRows,
  type ParakhGradeRow, type PctBand,
} from "@/config/parakhSurvey";
import { Card } from "./atoms";
import { Clock, ChevronDown } from "./Icon";

/**
 * PARAKH KPI card (§16, §26) — same card pattern as other KPI cards. Grade 3/6/9 rows,
 * each showing a plain percentile band ("Top 25%") with a muted UDIT/UDAY/… category;
 * tap a grade to reveal subject-wise scores. No delta (§16.3). District compares with
 * State avg; State compares with National. Numbers stay neutral (§10).
 */
function PctPill({ band, muted }: { band: PctBand; muted?: boolean }) {
  const cat = PARAKH_BAND_CAT[band];
  return (
    <span className="inline-flex items-baseline gap-1.5 rounded-full border border-line bg-surface-sunken px-2.5 py-0.5">
      <b className={cn("font-extrabold text-neutral-900", muted ? "text-2xs" : "text-xs")}>{band}</b>
      <span className="text-2xs font-semibold text-neutral-400">· {cat}</span>
    </span>
  );
}

function GradeRow({ row, isState, lang }: { row: ParakhGradeRow; isState: boolean; lang: Lang }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-line/60">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2.5 py-3 text-left" aria-expanded={open}>
        <span className="w-16 shrink-0 text-sm font-bold text-neutral-900">{row.grade}</span>
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <PctPill band={row.band} />
          <span className="text-2xs font-semibold tnum text-neutral-500">
            {isState
              ? `State ${locNum(row.score ?? 0, lang)} · National ${locNum(row.compare.score, lang)}`
              : `State avg ${locNum(row.compare.score, lang)}`}
          </span>
        </span>
        <ChevronDown size={15} className={cn("shrink-0 text-neutral-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="pb-3">
          {row.subjects.map((s) => (
            <div key={s.name} className="flex items-center gap-2.5 py-1.5">
              <span className="min-w-0 flex-1 text-xs font-medium text-neutral-600">{s.name}</span>
              <span className="shrink-0 text-sm font-extrabold tnum text-neutral-900">{locNum(s.score, lang)}</span>
              {isState && s.national != null && (
                <span className="w-16 shrink-0 text-right text-2xs text-neutral-400">Nat {locNum(s.national, lang)}</span>
              )}
              <span className="shrink-0"><PctPill band={s.band} muted /></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ParakhSurveyCard({ districtName, isState, lang }: { districtName: string; isState: boolean; lang: Lang }) {
  const { t } = useT();
  const rows = isState ? parakhStateRows() : parakhDistrictRows(districtName);
  return (
    <Card className="card-pad">
      <div className="flex items-start gap-2">
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-neutral-900">PARAKH</span>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-2xs font-semibold text-neutral-400">
            <Clock size={11} /> {t("common.sample")} · {PARAKH_SURVEY_YEAR}
          </span>
          <span className="ml-1.5 text-2xs text-neutral-400">· {isState ? "State vs National" : "District vs State"}</span>
        </span>
      </div>
      <div className="mt-2">
        {rows.map((r) => <GradeRow key={r.grade} row={r} isState={isState} lang={lang} />)}
      </div>
      <p className="mt-2.5 text-2xs leading-relaxed text-neutral-400">
        Top 25% · UDIT, Top 50% · UDAY, Bottom 50% · UNNAT, Bottom 25% · UDBHAV. Tap a grade for subject scores.
      </p>
    </Card>
  );
}
