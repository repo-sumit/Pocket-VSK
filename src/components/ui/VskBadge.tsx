import { cn } from "@/lib/cn";

/** The round VSK mark shown next to entity names (uses the VSK logo). */
export function VskBadge({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full bg-primary-50 ring-1 ring-primary-100", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <img src="/logo-vsk.png" alt="" className="object-contain" style={{ width: size * 0.66, height: size * 0.66 }} />
    </span>
  );
}
