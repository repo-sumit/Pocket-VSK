import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { GRADE_GROUP, gradeGroupOf } from "@/lib/colors";
import { useT, type Lang } from "@/i18n";
import { locNum } from "@/lib/format";

/**
 * The hero rating ring: an animated circular gauge showing the overall
 * score /100, the big number, and the letter grade — the "get it in 3
 * seconds" element. Coloured by grade group.
 */
export function RatingRing({
  percent, grade, size = 168, stroke = 14, lang = "en", outOf = 100, sublabel,
}: { percent: number | null; grade: string | null; size?: number; stroke?: number; lang?: Lang; outOf?: number; sublabel?: string }) {
  const { t } = useT();
  const na = percent == null || grade == null;
  const group = gradeGroupOf(grade ?? "D");
  const hex = na ? "#9CA3AF" : GRADE_GROUP[group].hex;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = na ? 0 : Math.max(0, Math.min(100, percent as number));

  const [draw, setDraw] = useState(0);
  const raf = useRef<number>();
  useEffect(() => {
    // respect reduced-motion: jump straight to the final value, no count-up
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDraw(clamped);
      return;
    }
    const start = performance.now();
    const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDraw(clamped * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [clamped]);

  const offset = circ - (draw / 100) * circ;
  const gid = `ring-${na ? "na" : group}`;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        role="img"
        aria-label={na ? t("common.noDataAria") : t("common.scoreAria", { n: Math.round(percent as number), outOf, grade: grade ?? "" })}
      >
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={hex} stopOpacity="0.95" />
            <stop offset="100%" stopColor={hex} stopOpacity="0.65" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF1F6" strokeWidth={stroke} />
        {!na && (
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center px-3 text-center">
        {na ? (
          <div>
            <div className="text-2xl font-extrabold leading-none text-rag-naText">NA</div>
            <div className="mt-1.5 text-2xs font-medium text-neutral-400">{sublabel ?? t("common.notTracked")}</div>
          </div>
        ) : (
          <div className="leading-none">
            <div className="flex items-baseline justify-center">
              <span className={cn("font-extrabold tabular-nums tnum", GRADE_GROUP[group].text)} style={{ fontSize: size * 0.26, lineHeight: 1 }}>
                {locNum(Math.round(draw), lang)}
              </span>
              <span className="font-semibold text-neutral-400" style={{ fontSize: size * 0.1 }}>/{locNum(outOf, lang)}</span>
            </div>
            <div className="mt-1.5 font-bold uppercase tracking-[0.18em] text-neutral-400" style={{ fontSize: Math.max(9, size * 0.06) }}>
              {sublabel ?? t("common.grade")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
