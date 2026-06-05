import { useScope, useScorecard } from "@/hooks";
import { statusFromScore } from "@/engine";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { rag } from "@/lib/colors";
import { pct, locNum } from "@/lib/format";
import { CURRENT_PERIOD } from "@/config";
import { Card, SectionLabel, Badge, Button, ProgressBar } from "@/components/ui/atoms";
import { RatingRing } from "@/components/ui/RatingRing";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { Download } from "@/components/ui/Icon";

export default function Export() {
  const { entity, currentId } = useScope();
  const sc = useScorecard(currentId);
  const { t, tn, lang } = useT();
  if (!entity || !sc) return null;

  const scored = sc.domainScores.filter((d) => d.weightage > 0);
  const periodNo = CURRENT_PERIOD().id.split("W")[1];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 no-print">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">{t("export.title")}</h1>
          <p className="mt-0.5 text-sm text-neutral-500">{t("export.generatedOn")} · {t("common.week")} {locNum(periodNo, lang)}</p>
        </div>
        <Button onClick={() => window.print()}><Download size={16} /> {t("export.download")}</Button>
      </div>

      {/* printable scorecard */}
      <Card className="card-pad sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-500 text-white text-sm font-extrabold">VSK</span>
              <div>
                <div className="text-base font-extrabold text-neutral-900">{tn(entity.name, entity.name_gu)}</div>
                <div className="text-2xs text-neutral-400">{t(`levels.${entity.level}`)} · {sc.framework.name} · {t("common.week")} {locNum(periodNo, lang)}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RatingRing percent={sc.overallPercent} grade={sc.grade} size={104} stroke={10} lang={lang} />
            {sc.grade && <RatingBadge grade={sc.grade} size="lg" />}
          </div>
        </div>

        {/* domain table */}
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-2xs uppercase tracking-wider text-neutral-400">
              <th className="py-2">{t("export.domain")}</th>
              <th className="py-2 text-right">{t("common.weightage")}</th>
              <th className="py-2 text-right">%</th>
              <th className="py-2 text-right">{t("scorecard.contribution")}</th>
              <th className="py-2 text-right">{t("kpi.statusLabel")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {scored.map((d) => (
              <tr key={d.domain.id}>
                <td className="py-2.5 font-semibold text-neutral-800">{tn(d.domain.name, d.domain.name_gu)}</td>
                <td className="py-2.5 text-right tabular-nums text-neutral-500">{Math.round(d.domain.weightage * 100)}%</td>
                <td className={cn("py-2.5 text-right font-bold tabular-nums", d.percent == null ? "text-rag-naText" : rag(d.status).text)}>{d.percent == null ? "NA" : pct(d.percent, lang)}</td>
                <td className="py-2.5 text-right tabular-nums text-neutral-600">{d.contribution.toFixed(1)}</td>
                <td className="py-2.5 text-right"><Badge status={d.status} className="!text-2xs">{t(`status.${d.status}`)}</Badge></td>
              </tr>
            ))}
            <tr className="border-t-2 border-line">
              <td className="py-3 font-extrabold text-neutral-900">{t("export.overall")}</td>
              <td className="py-3 text-right tabular-nums text-neutral-500">100%</td>
              <td className={cn("py-3 text-right font-extrabold tabular-nums", rag(sc.status).text)}>{pct(sc.overallPercent, lang)}</td>
              <td className="py-3 text-right font-bold tabular-nums">{sc.overallPercent != null ? sc.overallPercent.toFixed(1) : "—"}</td>
              <td className="py-3 text-right">{sc.grade ? <RatingBadge grade={sc.grade} size="sm" celebrate={false} /> : "NA"}</td>
            </tr>
          </tbody>
        </table>

        {/* GSQAC live data for schools */}
        {entity.meta.gsqac && (
          <div className="mt-4 border-t border-line pt-4">
            <SectionLabel>GSQAC · D1–D5</SectionLabel>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {Object.entries(entity.meta.gsqac.domains).map(([d, v]) => (
                <div key={d} className="text-center">
                  <div className="text-2xs font-semibold text-neutral-400">{d}</div>
                  <ProgressBar value={v as number} status={statusFromScore(v as number)} className="my-1" height={6} />
                  <div className="text-xs font-bold tnum text-neutral-700">{pct(v as number, lang)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-4 text-2xs text-neutral-400">{t("export.note")}</p>
      </Card>
    </div>
  );
}
