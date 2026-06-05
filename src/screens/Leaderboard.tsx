import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useScope, usePeerLeaderboard, useChildLeaderboard } from "@/hooks";
import { useT } from "@/i18n";
import { childLevelOf } from "@/engine";
import { formatDelta } from "@/lib/format";
import { Card, SectionLabel, Segmented } from "@/components/ui/atoms";
import { Leaderboard as LeaderboardList } from "@/components/ui/Leaderboard";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { Sparkles, ArrowUpRight } from "@/components/ui/Icon";

type Tab = "peers" | "scope";

export default function Leaderboard() {
  const { entity, currentId, setScope } = useScope();
  const peers = usePeerLeaderboard(currentId);
  const children = useChildLeaderboard(currentId);
  const { t, tn, lang } = useT();
  const navigate = useNavigate();

  const hasChildren = children.length > 0;
  const hasPeers = peers.length > 1;
  const [tab, setTab] = useState<Tab>(hasChildren ? "scope" : "peers");
  const active = tab === "scope" && hasChildren ? children : peers;

  const childLevel = entity ? childLevelOf(entity.level) : null;

  const movers = useMemo(
    () => [...active].filter((e) => (e.deltaWoW ?? 0) > 0).sort((a, b) => (b.deltaWoW ?? 0) - (a.deltaWoW ?? 0)).slice(0, 3),
    [active],
  );
  const topMover = movers[0];

  const open = (id: string) => { setScope(id); navigate("/app"); };

  if (!entity) return null;

  const peerLevelLabel = t(`levels.${entity.level}`);
  const childLevelLabel = childLevel ? t(`levels.${childLevel}`) : "";

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">{t("leaderboard.title")}</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {tab === "scope" ? t("leaderboard.subtitleChildren", { level: childLevelLabel }) : t("leaderboard.subtitlePeers", { level: peerLevelLabel })}
          </p>
        </div>
        {hasChildren && hasPeers && (
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            options={[{ value: "scope", label: t("leaderboard.below") }, { value: "peers", label: t("leaderboard.peers") }]}
          />
        )}
      </div>

      {/* most-improved spotlight */}
      {topMover && (
        <Card className="card-pad bg-gradient-to-br from-emerald-50 to-teal-50">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white shadow-sm">
              <Sparkles size={24} className="text-rag-green" />
            </span>
            <div className="min-w-0 flex-1">
              <SectionLabel>{t("leaderboard.mostImproved")}</SectionLabel>
              <div className="truncate text-base font-extrabold text-neutral-900">{tn(topMover.entity.name, topMover.entity.name_gu)}</div>
            </div>
            <span className="chip bg-rag-greenSoft text-rag-greenText">
              <ArrowUpRight size={14} /> {formatDelta(topMover.deltaWoW, "%", lang)}
            </span>
            {topMover.grade && <RatingBadge grade={topMover.grade} size="md" />}
          </div>
        </Card>
      )}

      {/* top movers row */}
      {movers.length > 1 && (
        <div>
          <SectionLabel className="mb-2">{t("leaderboard.topMovers")}</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            {movers.map((m) => (
              <button key={m.entity.id} onClick={() => open(m.entity.id)} className="rounded-2xl bg-white p-3 text-left shadow-card hover:shadow-raised">
                <div className="truncate text-xs font-semibold text-neutral-700">{tn(m.entity.name, m.entity.name_gu)}</div>
                <div className="mt-1 flex items-center gap-1 text-sm font-extrabold text-rag-greenText">
                  <ArrowUpRight size={15} /> {formatDelta(m.deltaWoW, "%", lang)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* the ranked list */}
      <Card className="card-pad">
        <SectionLabel className="mb-3">{t("leaderboard.rank")}</SectionLabel>
        {active.length > 0 ? (
          <LeaderboardList entries={active} lang={lang} onRowClick={open} youLabel={t("leaderboard.you")} />
        ) : (
          <p className="py-6 text-center text-sm text-neutral-400">{t("leaderboard.noPeers")}</p>
        )}
      </Card>
    </div>
  );
}
