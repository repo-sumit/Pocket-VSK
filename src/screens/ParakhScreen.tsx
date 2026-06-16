import { useState } from "react";
import { useScope } from "@/hooks";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import {
  PARAKH_BANDS, PARAKH_ORDER, PARAKH_GRADES, PARAKH_META, parakhBandOf,
} from "@/config/parakh";
import { Card } from "@/components/ui/atoms";
import { ParakhBadge } from "@/components/ui/ParakhCards";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { RouteBreadcrumb } from "@/components/layout/RouteBreadcrumb";
import { PageSection } from "@/components/layout/PageSection";

/**
 * PARAKH district-category drilldown (§19) — grade selector (3/6/9), the district's
 * band hero, the four-band legend, and the other districts in the same band. Static
 * PARAKH 2024 data; factual only (no recommendations). District-scoped.
 */
export default function ParakhScreen() {
  const { entity, trail } = useScope();
  const { t } = useT();
  const [grade, setGrade] = useState("Grade 3");

  // the district being viewed (the district node on the trail, else the current entity)
  const districtEntity = trail.find((e) => e.level === "district") ?? entity;
  const district = districtEntity?.name ?? "";
  const band = parakhBandOf(grade, district);
  const b = PARAKH_BANDS[band];
  const sameCat = PARAKH_GRADES[grade][band].filter((d) => d !== district);

  return (
    <ScreenContainer>
      <RouteBreadcrumb items={[{ label: t("nav.breadcrumbHome"), to: "/app" }, { label: t("parakh.title") }]} />
      <p className="text-2xs font-bold uppercase tracking-wide text-neutral-400">{t("parakh.title")}</p>

      {/* grade selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-neutral-600">{t("parakh.grade")}</span>
        <div className="flex gap-1.5">
          {Object.keys(PARAKH_GRADES).map((g) => {
            const on = grade === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(g)}
                className={cn(
                  "grid h-9 min-w-9 place-items-center rounded-full border px-3 text-sm font-extrabold transition-colors",
                  on ? "border-primary-500 bg-primary-50 text-primary-700" : "border-line bg-white text-neutral-500 hover:bg-neutral-50",
                )}
              >
                {g.replace("Grade ", "")}
              </button>
            );
          })}
        </div>
      </div>

      {/* category hero */}
      <Card className="overflow-hidden p-0">
        <div className="p-4" style={{ background: b.soft, borderBottom: `3px solid ${b.hex}` }}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-2xl font-extrabold text-neutral-900">{district}</div>
              <div className="mt-0.5 text-xs font-semibold" style={{ color: b.text }}>{grade} · PARAKH {PARAKH_META.year}</div>
            </div>
            <ParakhBadge band={band} size="lg" />
          </div>
          <div className="mt-3 text-sm font-semibold leading-snug text-neutral-800">{b.meaning}</div>
        </div>
        {/* band legend */}
        <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-4">
          {PARAKH_ORDER.map((id) => {
            const bb = PARAKH_BANDS[id];
            const on = id === band;
            return (
              <div
                key={id}
                className={cn("flex flex-col gap-1 rounded-lg px-2.5 py-2", on ? "ring-1" : "bg-surface-sunken")}
                style={on ? { background: bb.soft, boxShadow: `inset 0 0 0 1.5px ${bb.hex}` } : undefined}
              >
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded" style={{ background: bb.hex }} />
                  <b className="text-xs font-extrabold text-neutral-900">{bb.id}</b>
                </span>
                <span className="text-2xs text-neutral-400">{bb.stage}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* other districts in the same band */}
      <PageSection title={t("parakh.others", { band: b.id, grade })}>
        <div className="flex flex-wrap gap-2">
          {sameCat.map((d) => (
            <span key={d} className="rounded-full bg-surface-sunken px-3 py-1.5 text-xs font-semibold text-neutral-600">{d}</span>
          ))}
        </div>
      </PageSection>

      <p className="text-2xs leading-relaxed text-neutral-400">
        {PARAKH_META.title} {PARAKH_META.year} · {PARAKH_META.context}.{grade !== "Grade 3" ? ` ${t("parakh.placeholder")}` : ""}
      </p>
    </ScreenContainer>
  );
}
