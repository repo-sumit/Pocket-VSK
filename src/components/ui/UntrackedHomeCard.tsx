import { locNum } from "@/lib/format";
import { useT } from "@/i18n";
import { UNTRACKED_SUMMARY } from "@/lib/rosterMock";
import { Card } from "./atoms";
import { CardChevron } from "./kpiCardParts";
import { Users } from "./Icon";

/**
 * Teacher/Principal homepage "Untracked Students" card (§1). Same domain-card grammar
 * (purple/lavender icon · title · Updated date · big neutral count · N+1 pill · right
 * chevron). Values come from the shared `UNTRACKED_SUMMARY` mock so the card and the
 * detail summary always match (§2). Tapping opens the untracked detail.
 */
export function UntrackedHomeCard({ role, onOpen }: { role: "teacher" | "principal"; onOpen: () => void }) {
  const { t, lang } = useT();
  const d = UNTRACKED_SUMMARY[role];
  return (
    <Card className="card-pad">
      <button onClick={onOpen} className="group flex w-full flex-col text-left">
        <div className="flex items-start justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EDE9FE]">
              <Users size={18} className="text-[#7C3AED]" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-neutral-900">{t("roster.untrackedTitle")}</span>
              <span className="block truncate text-2xs font-medium text-neutral-400">{t("roster.updatedOn", { date: "12 Jun" })}</span>
            </span>
          </span>
          <CardChevron className="mt-0.5" />
        </div>

        {/* untracked count — neutral black (§7) */}
        <p className="mt-3 text-sm font-semibold leading-snug text-neutral-700">
          <span className="mr-1.5 align-baseline text-3xl font-extrabold tnum text-neutral-900">{locNum(d.untracked, lang)}</span>
          {t("roster.untrackedStudentsLabel")}
        </p>

        {/* N+1 comparison pill (count → no "avg", no "vs") */}
        <span className="mt-2.5 inline-flex w-fit items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 ring-1 ring-primary-200">
          <span className="text-xs font-bold text-primary-700">{t(`levels.${d.compareLevel}`)}</span>
          <span className="text-base font-extrabold tnum text-primary-700">{d.compareValue}</span>
        </span>
      </button>
    </Card>
  );
}
