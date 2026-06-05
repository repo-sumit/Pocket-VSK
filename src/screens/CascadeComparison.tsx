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
import { KpiCard } from "@/components/ui/KpiCard";
import { ComparisonBars, type CompareBar } from "@/components/ui/ComparisonBars";
import { MultiSelect, type MsGroup } from "@/components/ui/MultiSelect";
import { VskBadge } from "@/components/ui/VskBadge";
import { Icon } from "@/components/ui/Icon";

const COMPARE_LEVELS = ["district", "block", "cluster", "school"] as const;

export default function CompareView() {
  const { entity, currentId, homeId } = useScope();
  const fw = useFramework();
  const pmShri = usePmShri();
  const role = useSession((s) => s.user?.role);
  const { t, tn, lang } = useT();
  const navigate = useNavigate();
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // comparison options (ACCESS CONTROL): only (a) PEERS at the user's own level
  // for benchmarking — siblings of the home entity — and (b) entities WITHIN the
  // user's own subtree. Never ancestors. All selections render as read-only bars
  // only; they are not navigable into another dashboard. allowedIds is the
  // authoritative whitelist used to re-validate compareIds (defense-in-depth).
  const { options, allowedIds } = useMemo<{ options: MsGroup[]; allowedIds: Set<string> }>(() => {
    if (!homeId) return { options: [], allowedIds: new Set() };
    const allowed = new Set<string>();
    const byLevel = new Map<string, Entity[]>();
    for (const e of dataProvider.getDescendants(homeId)) {
      if ((COMPARE_LEVELS as readonly string[]).includes(e.level) && e.id !== currentId) {
        (byLevel.get(e.level) ?? byLevel.set(e.level, []).get(e.level)!).push(e);
        allowed.add(e.id);
      }
    }
    const subtreeGroups = COMPARE_LEVELS.filter((l) => byLevel.get(l)?.length).map((l) => ({
      key: l,
      label: t(`levels.${l}`),
      options: byLevel.get(l)!.map((e) => ({ id: e.id, label: tn(e.name, e.name_gu) })),
    }));
    // peers = other entities at the user's level (read-only benchmark)
    const peers = dataProvider.getSiblings(homeId).filter((e) => e.id !== currentId);
    peers.forEach((e) => allowed.add(e.id));
    const peerGroup: MsGroup[] = peers.length
      ? [{ key: "peers", label: t("leaderboard.peers"), options: peers.map((e) => ({ id: e.id, label: tn(e.name, e.name_gu) })) }]
      : [];
    return { options: [...peerGroup, ...subtreeGroups], allowedIds: allowed };
  }, [homeId, currentId, lang]);

  const comparing = compareIds.length > 0;

  const data = useMemo(() => {
    dataProvider.setSchoolFilter(pmShri);
    const lvl = entity?.level ?? "state";
    // re-validate against the whitelist so only in-scope/peer entities are read
    const comps = compareIds.filter((id) => allowedIds.has(id)).map((id) => dataProvider.getEntity(id)).filter((e): e is Entity => !!e);
    return fw.domains
      .map((dom) => ({
        dom,
        rows: fw.kpis
          .filter((k) => k.domain_id === dom.id && (role ? kpiApplies(k.id, role, lvl) : true))
          .map((kpi) => ({
            kpi,
            cur: currentId ? getKpiRecord(fw, kpi.id, currentId, PERIODS) : null,
            comps: comps.map((e) => ({ e, rec: getKpiRecord(fw, kpi.id, e.id, PERIODS) })),
          })),
      }))
      .filter((d) => d.rows.length > 0);
  }, [fw, currentId, compareIds, pmShri, role, entity, allowedIds]);

  if (!entity) return null;
  const shortName = (e: Entity) => (lang === "gu" && e.name_gu ? e.name_gu : e.name);
  // count KPIs compare as avg-per-school (raw totals grow with scope)
  const cmpVal = (kpi: { id: string; unit: string }, ent: Entity, v: number | null | undefined) =>
    v == null ? null : kpi.unit === "count" ? Math.round((v / schoolsImplied(kpi.id, ent.level)) * 10) / 10 : v;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <VskBadge size={40} />
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">{t("compare.title")}</h1>
          <p className="mt-0.5 text-sm text-neutral-500">{t("compare.subtitle", { name: tn(entity.name, entity.name_gu) })}</p>
        </div>
      </div>

      {/* add-comparison control */}
      <Card className="card-pad flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">{t("compare.compareAgainst")}</span>
        <span className="chip bg-primary-100 text-primary-700">{tn(entity.name, entity.name_gu)}</span>
        {options.length > 0 ? (
          <MultiSelect groups={options} selected={compareIds} onChange={setCompareIds} placeholder={t("compare.addComparison")} max={5} />
        ) : (
          <span className="text-xs text-neutral-400">{t("compare.noOptions")}</span>
        )}
        {comparing && <span className="ml-auto text-2xs text-neutral-400">{t("compare.comparingHint")}</span>}
      </Card>

      {/* small-multiples — every KPI at a glance, grouped by domain */}
      {data.map(({ dom, rows }) => {
        const a = accent(dom.accent);
        return (
          <Card key={dom.id} className="card-pad">
            <div className="mb-3 flex items-center gap-2">
              <span className={`grid h-8 w-8 place-items-center rounded-xl ${a.bg}`}><Icon name={dom.icon} className={a.icon} size={18} /></span>
              <SectionLabel>{tn(dom.name, dom.name_gu)}</SectionLabel>
            </div>

            {comparing ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {rows.map(({ kpi, cur, comps }) => {
                  const bars: CompareBar[] = [
                    { key: "cur", label: shortName(entity), value: cmpVal(kpi, entity, cur?.value), status: cur?.status ?? "na", isCurrent: true },
                    ...comps.map((c) => ({ key: c.e.id, label: shortName(c.e), value: cmpVal(kpi, c.e, c.rec?.value), status: c.rec?.status ?? "na" })),
                  ];
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
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {rows.map(({ kpi, cur }) =>
                  cur ? (
                    <KpiCard key={kpi.id} rec={cur} name={tn(kpi.name, kpi.name_gu)} lang={lang} onClick={() => navigate(`/app/kpi/${kpi.id}`)} />
                  ) : null,
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
