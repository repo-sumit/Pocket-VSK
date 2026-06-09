import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Entity } from "@/types";
import { dataProvider } from "@/data/provider";
import { getKpiRecord } from "@/engine";
import { kpiApplies, schoolsImplied } from "@/config/applicability";
import { useScope, useFramework, usePmShri, PERIODS } from "@/hooks";
import { useSession } from "@/store/session";
import { useT } from "@/i18n";
import { accent } from "@/lib/colors";
import { Card, SectionLabel } from "@/components/ui/atoms";
import { ComparisonBars, type CompareBar } from "@/components/ui/ComparisonBars";
import { Select, type SelectOption } from "@/components/ui/Select";
import { VskBadge } from "@/components/ui/VskBadge";
import { Icon } from "@/components/ui/Icon";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { PageHeader } from "@/components/layout/PageHeader";

const SLOTS = [0, 1, 2, 3] as const;

/**
 * Compare — exactly four single-select slots. Each slot's options are scoped to
 * the user's OWN level (read-only peers) or ONE LEVEL BELOW (own subtree): e.g. a
 * Block user can pick other Blocks or Clusters, never Districts/State and never
 * deeper than one level. Reads every applicable indicator side by side. All
 * selections are read-only comparison context (the access-control whitelist is
 * the option pool itself); they are not navigable into another dashboard.
 */
export default function CompareView() {
  const { entity, homeId } = useScope();
  const fw = useFramework();
  const pmShri = usePmShri();
  const role = useSession((s) => s.user?.role);
  const { t, tn, lang } = useT();
  const navigate = useNavigate();

  // option pool + the level whose indicator set we render (the user's own level)
  const { pool, options, homeLevel } = useMemo(() => {
    const home = homeId ? dataProvider.getEntity(homeId) : undefined;
    if (!home) return { pool: [] as Entity[], options: [] as SelectOption[], homeLevel: "state" as Entity["level"] };
    const sameLevel = [home, ...dataProvider.getSiblings(home.id)]; // peers (read-only)
    const below = dataProvider.getChildren(home.id); // one level down (own subtree)
    const seen = new Set<string>();
    const p: Entity[] = [];
    for (const e of [...sameLevel, ...below]) if (!seen.has(e.id)) { seen.add(e.id); p.push(e); }
    const opts: SelectOption[] = p.map((e) => ({
      value: e.id,
      label: `${tn(e.name, e.name_gu)} · ${t(`levels.${e.level}`)}`,
    }));
    return { pool: p, options: opts, homeLevel: home.level };
  }, [homeId, lang]);

  // four slots; default to the first distinct units in the pool ("" = empty slot)
  const [sel, setSel] = useState<string[]>(() => SLOTS.map((i) => pool[i]?.id ?? ""));
  const setSlot = (i: number, v: string) => setSel((s) => s.map((x, j) => (j === i ? v : x)));

  const chosen = useMemo(() => {
    const ids = Array.from(new Set(sel.filter(Boolean)));
    return ids.map((id) => dataProvider.getEntity(id)).filter((e): e is Entity => !!e && pool.some((p) => p.id === e.id));
  }, [sel, pool]);

  const data = useMemo(() => {
    dataProvider.setSchoolFilter(pmShri);
    return fw.domains
      .map((dom) => ({
        dom,
        rows: fw.kpis
          .filter((k) => k.domain_id === dom.id && (role ? kpiApplies(k.id, role, homeLevel) : true))
          .map((kpi) => ({ kpi, recs: chosen.map((e) => ({ e, rec: getKpiRecord(fw, kpi.id, e.id, PERIODS) })) })),
      }))
      .filter((d) => d.rows.length > 0);
  }, [fw, chosen, pmShri, role, homeLevel]);

  if (!entity) return null;
  const shortName = (e: Entity) => (lang === "gu" && e.name_gu ? e.name_gu : e.name);
  const cmpVal = (kpi: { id: string; unit: string }, ent: Entity, v: number | null | undefined) =>
    v == null ? null : kpi.unit === "count" ? Math.round((v / schoolsImplied(kpi.id, ent.level)) * 10) / 10 : v;

  return (
    <ScreenContainer>
      <PageHeader icon={<VskBadge size={40} />} title={t("compare.title")} subtitle={t("compare.subtitle")} />

      {/* four single-select slots */}
      {options.length > 0 ? (
        <Card className="card-pad">
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {SLOTS.map((i) => (
              <div key={i} className="min-w-0">
                <label className="mb-1 block text-2xs font-semibold uppercase tracking-wide text-neutral-400">{t("compare.slot", { n: i + 1 })}</label>
                <Select
                  value={sel[i] || null}
                  onChange={(v) => setSlot(i, v)}
                  options={options}
                  placeholder={t("compare.pickEntity")}
                  ariaLabel={t("compare.slot", { n: i + 1 })}
                  searchable
                  className="w-full"
                  triggerClassName="w-full !justify-between"
                />
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="card-pad text-sm text-neutral-400">{t("compare.noOptions")}</Card>
      )}

      {/* every applicable indicator, side by side across the chosen units */}
      {chosen.length > 0 && data.map(({ dom, rows }) => {
        const a = accent(dom.accent);
        return (
          <Card key={dom.id} className="card-pad">
            <div className="mb-3 flex items-center gap-2">
              <span className={`grid h-8 w-8 place-items-center rounded-xl ${a.bg}`}><Icon name={dom.icon} className={a.icon} size={18} /></span>
              <SectionLabel>{tn(dom.name, dom.name_gu)}</SectionLabel>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map(({ kpi, recs }) => {
                const bars: CompareBar[] = recs.map(({ e, rec }) => ({
                  key: e.id,
                  label: shortName(e),
                  value: cmpVal(kpi, e, rec?.value),
                  status: rec?.status ?? "na",
                  isCurrent: e.id === homeId,
                }));
                return (
                  <button key={kpi.id} onClick={() => navigate(`/app/kpi/${kpi.id}`)} className="rounded-xl border border-line/70 p-3 text-left hover:bg-neutral-50">
                    <div className="mb-1 line-clamp-2 text-xs font-semibold text-neutral-700">{tn(kpi.name, kpi.name_gu)}</div>
                    {bars.some((b) => b.value != null) ? (
                      <ComparisonBars bars={bars} unit={kpi.unit} lang={lang} height={120} />
                    ) : (
                      <p className="py-6 text-center text-xs text-rag-naText">{t("common.na")}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        );
      })}
    </ScreenContainer>
  );
}
