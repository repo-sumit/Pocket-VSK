import type { Level } from "@/types";
import { locNum } from "@/lib/format";
import { useT } from "@/i18n";
import { Card } from "./atoms";
import { CardChevron } from "./kpiCardParts";
import { Users } from "./Icon";

/**
 * Untracked Students homepage card (§1/§4). Purely presentational — the parent computes
 * the count scoped to the current view level (so it matches the ret_dropout detail, §8)
 * and an optional N+1 benchmark pill. Shown at School/Grade/Section for EVERY role (direct
 * teacher/principal login or a drilled officer): purple/lavender icon, big neutral count,
 * right chevron. Tapping opens the role-aware, privacy-respecting detail.
 */
export function UntrackedHomeCard({ count, compare, onOpen }: {
  count: number;
  compare: { level: Level; value: string } | null;
  onOpen: () => void;
}) {
  const { t, lang } = useT();
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

        {/* primary count — neutral black (§7) */}
        <p className="mt-3 text-sm font-semibold leading-snug text-neutral-700">
          <span className="mr-1.5 align-baseline text-3xl font-extrabold tnum text-neutral-900">{locNum(count, lang)}</span>
          {t("roster.untrackedStudentsLabel")}
        </p>

        {/* N+1 comparison pill (count → no "avg", no "vs") — school-level benchmark only */}
        {compare && (
          <span className="mt-2.5 inline-flex w-fit items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 ring-1 ring-primary-200">
            <span className="text-xs font-bold text-primary-700">{t(`levels.${compare.level}`)}</span>
            <span className="text-base font-extrabold tnum text-primary-700">{compare.value}</span>
          </span>
        )}
      </button>
    </Card>
  );
}
