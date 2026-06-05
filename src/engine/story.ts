import type { KpiDef, RagStatus, Trend } from "@/types";

/**
 * Plain-language one-line "story" per KPI — the "why" behind the number.
 * Growth-oriented & non-punitive (frames weak areas as opportunities).
 * Returns { en, gu } so copy never lives inline in components.
 */
export function kpiStory(args: {
  kpi: KpiDef;
  value: number | null;
  benchmark: number | null;
  deltaWoW: number | null;
  status: RagStatus;
  trend: Trend;
}): { en: string; gu: string } {
  const { kpi, value, deltaWoW, status, trend } = args;
  if (value == null) {
    return {
      en: "Not tracked at this level yet.",
      gu: "આ સ્તરે હજુ ટ્રેક થતું નથી.",
    };
  }
  const improving = isImproving(trend, kpi.direction);
  const move = deltaWoW != null && Math.abs(deltaWoW) >= 0.5 ? Math.abs(round1(deltaWoW)) : null;
  const unit = kpi.unit === "%" ? "%" : "";

  if (status === "green") {
    return move && improving
      ? { en: `On track. Up ${move}${unit} this week; keep the momentum.`, gu: `સારી સ્થિતિ. આ અઠવાડિયે ${move}${unit} વધ્યું; ગતિ જાળવો.` }
      : { en: "On track and meeting the benchmark.", gu: "બેન્ચમાર્ક પૂર્ણ; સારી સ્થિતિમાં." };
  }
  if (status === "amber") {
    return improving
      ? { en: move ? `Improving: ${move}${unit} better than last week. Close the last gap.` : "Improving. Close the last gap.", gu: move ? `સુધારો: ગયા અઠવાડિયા કરતાં ${move}${unit} સારું. છેલ્લો તફાવત ભરો.` : "સુધારો. છેલ્લો તફાવત ભરો." }
      : { en: "Slightly below benchmark. Your biggest quick win.", gu: "બેન્ચમાર્કથી થોડું નીચે. ઝડપી સુધારાની તક." };
  }
  // red — framed as opportunity, never shaming
  return improving
    ? { en: "Below benchmark but moving up. Biggest opportunity to grow.", gu: "બેન્ચમાર્કથી નીચે પણ સુધરી રહ્યું. વૃદ્ધિની સૌથી મોટી તક." }
    : { en: "Biggest opportunity: a focused push here lifts the whole score.", gu: "સૌથી મોટી તક: અહીં ધ્યાન આપવાથી સમગ્ર સ્કોર વધશે." };
}

export function isImproving(trend: Trend, direction: KpiDef["direction"]): boolean {
  if (trend === "flat") return false;
  return direction === "higher" ? trend === "up" : trend === "down";
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}
