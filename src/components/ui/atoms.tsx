import type { ElementType, ReactNode } from "react";
import type { RagStatus, Trend, Unit } from "@/types";
import { cn } from "@/lib/cn";
import { rag } from "@/lib/colors";
import { formatDelta } from "@/lib/format";
import type { Lang } from "@/i18n";
import { ArrowDownRight, ArrowUpRight, Minus } from "./Icon";

// ── Card ──────────────────────────────────────────────────────────────
export function Card({ className, children, as: As = "div", ...rest }: { className?: string; children: ReactNode; as?: ElementType } & Record<string, unknown>) {
  return (
    <As className={cn("card", className)} {...rest}>
      {children}
    </As>
  );
}

// ── StatusDot ─────────────────────────────────────────────────────────
export function StatusDot({ status, className }: { status: RagStatus; className?: string }) {
  return <span className={cn("inline-block h-2.5 w-2.5 rounded-full", rag(status).dot, className)} />;
}

// ── Badge / Chip ──────────────────────────────────────────────────────
export function Badge({ status, children, className }: { status?: RagStatus; children: ReactNode; className?: string }) {
  const c = status ? rag(status) : null;
  return <span className={cn("chip", c ? cn(c.soft, c.text) : "bg-neutral-50 text-neutral-500", className)}>{children}</span>;
}

// ── Button ────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "ghost" | "soft";
export function Button({
  variant = "primary", className, children, full, ...rest
}: { variant?: BtnVariant; className?: string; children: ReactNode; full?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles: Record<BtnVariant, string> = {
    primary: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm disabled:bg-primary-200",
    secondary: "bg-white text-primary-500 border-[1.5px] border-primary-500/70 hover:bg-primary-50",
    ghost: "bg-transparent text-neutral-600 hover:bg-neutral-50",
    soft: "bg-warning text-white hover:brightness-95",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-base font-semibold transition-colors disabled:cursor-not-allowed",
        full && "w-full",
        styles[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────
export function ProgressBar({ value, status = "green", className, height = 8, label }: { value: number; status?: RagStatus; className?: string; height?: number; label?: string }) {
  const pctVal = Math.round(Math.max(0, Math.min(100, value)));
  // labelled → real progressbar semantics; unlabelled → decorative (hidden from AT)
  const aria = label
    ? ({ role: "progressbar", "aria-valuenow": pctVal, "aria-valuemin": 0, "aria-valuemax": 100, "aria-label": label } as const)
    : ({ "aria-hidden": true } as const);
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-neutral-100", className)} style={{ height }} {...aria}>
      <div className={cn("h-full rounded-full transition-[width] duration-700 ease-out", rag(status).bg)} style={{ width: `${pctVal}%` }} />
    </div>
  );
}

// ── DeltaPill (Δ WoW / MoM, direction-aware colouring) ─────────────────
export function DeltaPill({
  delta, unit, direction, lang = "en", label, className,
}: { delta: number | null; unit: Unit; direction: "higher" | "lower"; lang?: Lang; label?: string; className?: string }) {
  if (delta == null || delta === 0) {
    return (
      <span className={cn("chip bg-neutral-50 text-neutral-400", className)}>
        <Minus size={13} /> {label ? `${label} ±0` : "±0"}
      </span>
    );
  }
  const improving = direction === "higher" ? delta > 0 : delta < 0;
  const tone = improving ? "bg-rag-greenSoft text-rag-greenText" : "bg-rag-redSoft text-rag-redText";
  const Arrow = delta > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("chip", tone, className)}>
      <Arrow size={13} /> {label ? `${label} ` : ""}{formatDelta(delta, unit, lang)}
    </span>
  );
}

// ── TrendArrow ────────────────────────────────────────────────────────
export function TrendArrow({ trend, improving, size = 16 }: { trend: Trend; improving: boolean; size?: number }) {
  if (trend === "flat") return <Minus size={size} className="text-neutral-400" />;
  const Arrow = trend === "up" ? ArrowUpRight : ArrowDownRight;
  return <Arrow size={size} className={improving ? "text-rag-green" : "text-rag-red"} />;
}

// ── Segmented control ─────────────────────────────────────────────────
export function Segmented<T extends string>({
  options, value, onChange, className, size = "md",
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; className?: string; size?: "sm" | "md" }) {
  return (
    <div className={cn("inline-flex rounded-full bg-neutral-100 p-1", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full font-semibold transition-colors",
            size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
            value === o.value ? "bg-white text-primary-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── EmptyNA — explicit "NA" tile (never a blank/broken card) ───────────
export function EmptyNA({ label, hint, className }: { label?: string; hint?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-rag-naSoft/60 px-4 py-3 text-center", className)}>
      <span className="text-sm font-bold tracking-wide text-rag-naText">{label ?? "NA"}</span>
      {hint && <span className="mt-0.5 text-2xs text-neutral-400">{hint}</span>}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-neutral-100", className)} />;
}

// ── SectionLabel ──────────────────────────────────────────────────────
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("section-title", className)}>{children}</p>;
}
