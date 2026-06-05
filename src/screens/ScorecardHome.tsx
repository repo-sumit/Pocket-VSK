import { useNavigate } from "react-router-dom";
import { useScope, useScorecard, useChildLeaderboard } from "@/hooks";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { rag } from "@/lib/colors";
import { pct, locNum } from "@/lib/format";
import { CURRENT_PERIOD } from "@/config";
import { Card, SectionLabel, Badge } from "@/components/ui/atoms";
import { RatingRing } from "@/components/ui/RatingRing";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { DomainBar } from "@/components/ui/DomainBar";
import { CalloutCard } from "@/components/ui/Callout";
import { ChevronRight, ChartNoAxesColumn, Trophy, Users } from "@/components/ui/Icon";

export default function ScorecardHome() {
  const { entity, currentId, setScope, childLevel } = useScope();
  const sc = useScorecard(currentId);
  const children = useChildLeaderboard(currentId);
  const { t, tn, lang } = useT();
  const navigate = useNavigate();

  if (!entity || !sc) return null;

  const parentLevelLabel = sc.parent ? t(`levels.${sc.parent.entity.level}`) : t("common.average");
  const scoredDomains = sc.domainScores.filter((d) => d.weightage > 0);
  // any weight-0 domain with data is "informational/tracking" — derived from
  // config (no hardcoded domain id), so a new such domain appears with no edit.
  const infoDomains = sc.domainScores.filter((d) => d.weightage === 0 && d.records.some((r) => r.value != null));
  const periodNo = CURRENT_PERIOD().id.split("W")[1];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* scope header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">{tn(entity.name, entity.name_gu)}</h1>
            <Badge className="bg-neutral-100 text-neutral-500">{t(`levels.${entity.level}`)}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-neutral-400">{t("common.currentPeriod")} · {t("common.week")} {locNum(periodNo, lang)}</p>
        </div>
      </div>

      {/* hero */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="card-pad flex flex-col items-center justify-center gap-3 lg:col-span-2">
          <SectionLabel>{t("scorecard.overall")}</SectionLabel>
          <RatingRing
            percent={sc.overallPercent}
            grade={sc.grade}
            lang={lang}
            sublabel={sc.grade ? `${t("common.grade")} ${sc.grade}` : undefined}
          />
          <div className="flex items-center gap-2">
            {sc.grade && <RatingBadge grade={sc.grade} size="md" />}
            <Badge status={sc.status} className="!text-xs">{t(`status.${sc.status}`)}</Badge>
          </div>
        </Card>

        {/* callouts */}
        <div className="flex flex-col gap-3 lg:col-span-3">
          <SectionLabel>{t("scorecard.needsAttention")} · {t("scorecard.mostImproved")}</SectionLabel>
          {sc.callouts.length ? (
            sc.callouts.map((c, i) => (
              <CalloutCard
                key={i}
                callout={c}
                lang={lang}
                onClick={() => c.kpiId ? navigate(`/app/kpi/${c.kpiId}`) : c.domainId ? navigate(`/app/domain/${c.domainId}`) : undefined}
              />
            ))
          ) : (
            <Card className="card-pad text-sm text-neutral-400">{t("common.notFound")}</Card>
          )}
        </div>
      </div>

      {/* domain-wise */}
      <Card className="card-pad">
        <div className="mb-1 flex items-center justify-between">
          <SectionLabel>{t("scorecard.domainWise")}</SectionLabel>
          {sc.parent && <span className="text-2xs text-neutral-400">{t("scorecard.youVsParent", { level: parentLevelLabel })}</span>}
        </div>
        <div className="-mx-2 divide-y divide-line/60">
          {scoredDomains.map((ds) => (
            <DomainBar
              key={ds.domain.id}
              ds={ds}
              name={tn(ds.domain.name, ds.domain.name_gu)}
              parentPercent={sc.parent?.domainPercents[ds.domain.id]}
              parentLabel={parentLevelLabel}
              lang={lang}
              onClick={() => navigate(`/app/domain/${ds.domain.id}`)}
            />
          ))}
        </div>
        {/* weightage legend */}
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-line/60 pt-3 text-2xs text-neutral-400">
          {scoredDomains.map((ds) => (
            <span key={ds.domain.id}>{tn(ds.domain.name, ds.domain.name_gu)} · {Math.round(ds.domain.weightage * 100)}%</span>
          ))}
        </div>
      </Card>

      {/* informational / tracking domains (weight-0) — e.g. district tracking */}
      {infoDomains.map((dom) => (
        <Card key={dom.domain.id} className="card-pad">
          <SectionLabel>{tn(dom.domain.name, dom.domain.name_gu)}</SectionLabel>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {dom.records.map((r) => (
              <button key={r.kpi.id} onClick={() => navigate(`/app/kpi/${r.kpi.id}`)} className="rounded-xl border border-line/70 p-3 text-left hover:bg-neutral-50">
                <div className="line-clamp-2 text-2xs font-medium text-neutral-500">{tn(r.kpi.name, r.kpi.name_gu)}</div>
                {r.value == null ? <div className="mt-1 text-base font-bold text-rag-naText">NA</div> : <div className={cn("mt-1 text-lg font-extrabold tnum", rag(r.status).text)}>{pct(r.value, lang)}</div>}
              </button>
            ))}
          </div>
        </Card>
      ))}

      {/* explore below */}
      {childLevel && children.length > 0 && (
        <Card className="card-pad">
          <div className="mb-2 flex items-center justify-between">
            <SectionLabel>{t("scorecard.explore")} · {t(`levels.${childLevel}`)}</SectionLabel>
            <button onClick={() => navigate("/app/leaderboard")} className="text-xs font-semibold text-primary-600 hover:underline">{t("common.viewAll")}</button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {children.slice(0, 6).map((c) => (
              <button
                key={c.entity.id}
                onClick={() => { setScope(c.entity.id); navigate("/app"); }}
                className="flex items-center gap-3 rounded-xl border border-line/70 px-3 py-2.5 text-left hover:bg-neutral-50"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-neutral-50 text-xs font-bold text-neutral-500 tnum">{c.rank}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-neutral-800">{tn(c.entity.name, c.entity.name_gu)}</span>
                  <span className={cn("text-xs font-bold tnum", rag(c.status).text)}>{pct(c.percent, lang)}</span>
                </span>
                {c.grade && <RatingBadge grade={c.grade} size="sm" celebrate={false} />}
                <ChevronRight size={16} className="text-neutral-300" />
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* quick actions */}
      <div className="grid grid-cols-3 gap-3">
        <QuickAction icon={<ChartNoAxesColumn size={18} />} label={t("nav.compare")} onClick={() => navigate("/app/compare")} />
        <QuickAction icon={<Trophy size={18} />} label={t("nav.leaderboard")} onClick={() => navigate("/app/leaderboard")} />
        <QuickAction icon={<Users size={18} />} label={t("nav.sections")} onClick={() => navigate("/app/sections")} />
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white p-3 text-xs font-semibold text-neutral-600 shadow-card transition-shadow hover:shadow-raised">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-50 text-primary-600">{icon}</span>
      {label}
    </button>
  );
}
