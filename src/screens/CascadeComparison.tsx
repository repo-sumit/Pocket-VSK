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

const CLEAR = "__clear__";

/**
 * Compare — Unit 1 is fixed to the user's own scope; Units 2–4 are added one by
 * one from the access-scoped pool (own level = read-only peers, or one level below
 * = own subtree). A unit can't be picked twice (selected ids are removed from the
 * other dropdowns) and can be cleared to free it again. Comparison bars render
 * only for the selected units; with just Unit 1, a prompt invites adding another.
 */
export default function CompareView() {
  const { entity, homeId } = useScope();
  const fw = useFramework();
  const pmShri = usePmShri();
  const role = useSession((s) => s.user?.role);
  const { t, tn, lang } = useT();
  const navigate = useNavigate();

  const home = useMemo(() => (homeId ? dataProvider.getEntity(homeId) : undefined), [homeId]);

  // comparison pool (excludes home): same-level peers + one level below (own subtree)
  const { pool, homeLevel } = useMemo(() => {
    if (!home) return { pool: [] as Entity[], homeLevel: "state" as Entity["level"] };
    const sameLevel = dataProvider.getSiblings(home.id);
    const below = dataProvider.getChildren(home.id);
    const seen = new Set<string>([home.id]);
    const p: Entity[] = [];
    for (const e of [...sameLevel, ...below]) if (!seen.has(e.id)) { seen.add(e.id); p.push(e); }
    return { pool: p, homeLevel: home.level };
  }, [home]);

  // three comparison slots (Unit 2/3/4); Unit 1 is fixed = the user's own scope
  const [sel, setSel] = useState<string[]>(["", "", ""]);
  const setSlot = (i: number, v: string) => setSel((s) => s.map((x, j) => (j === i ? (v === CLEAR ? "" : v) : x)));

  // per-slot options: drop ids already chosen in other slots; offer a clear row
  const optionsFor = (slotIdx: number): SelectOption[] => {
    const usedElsewhere = new Set(sel.filter((v, j) => j !== slotIdx && v));
    const opts: SelectOption[] = pool
      .filter((e) => !usedElsewhere.has(e.id))
      .map((e) => ({ value: e.id, label: `${tn(e.name, e.name_gu)} · ${t(`levels.${e.level}`)}` }));
    if (sel[slotIdx]) opts.unshift({ value: CLEAR, label: t("common.clear") });
    return opts;
  };

  // chosen units = own scope first, then the selected comparison units (deduped)
  const chosen = useMemo(() => {
    const out: Entity[] = home ? [home] : [];
    for (const id of sel) {
      if (!id) continue;
      const e = pool.find((p) => p.id === id);
      if (e && !out.some((o) => o.id === e.id)) out.push(e);
    }
    return out;
  }, [home, sel, pool]);

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

      {/* Unit 1 fixed (own scope) + Units 2-4 added one by one */}
      <Card className="card-pad">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <div className="min-w-0">
            <label className="mb-1 block text-2xs font-semibold uppercase tracking-wide text-neutral-400">{t("compare.slot", { n: 1 })}</label>
            <div className="flex w-full items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700" title={home ? tn(home.name, home.name_gu) : undefined}>
              <span className="min-w-0 flex-1 truncate text-left">{home ? `${tn(home.name, home.name_gu)} · ${t(`levels.${home.level}`)}` : "—"}</span>
            </div>
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="min-w-0">
              <label className="mb-1 block text-2xs font-semibold uppercase tracking-wide text-neutral-400">{t("compare.slot", { n: i + 2 })}</label>
              <Select
                value={sel[i] || null}
                onChange={(v) => setSlot(i, v)}
                options={optionsFor(i)}
                placeholder={t("compare.pickEntity")}
                ariaLabel={t("compare.slot", { n: i + 2 })}
                searchable
                className="w-full"
                triggerClassName="w-full !justify-between"
              />
            </div>
          ))}
        </div>
        {pool.length === 0 && <p className="mt-2 text-2xs text-neutral-400">{t("compare.noOptions")}</p>}
      </Card>

      {/* render comparison bars only for the selected units */}
      {chosen.length < 2 ? (
        <Card className="card-pad text-center text-sm text-neutral-500">{t("compare.selectAnother")}</Card>
      ) : (
        data.map(({ dom, rows }) => {
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
        })
      )}
    </ScreenContainer>
  );
}
