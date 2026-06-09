import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ArrowLeft } from "@/components/ui/Icon";

/** Consistent back affordance used by every drill-in screen. */
export function BackLink({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 transition-colors hover:text-primary-600">
      <ArrowLeft size={16} /> {label}
    </button>
  );
}

/**
 * The shared page header: optional back link, an optional leading icon/badge,
 * an optional eyebrow, the title (+ inline badge), an optional subtitle and a
 * right-aligned actions slot. Gives every screen the same title rhythm.
 */
export function PageHeader({
  title, eyebrow, subtitle, icon, badge, actions, back, className,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {back}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {icon}
          <div className="min-w-0">
            {eyebrow && <p className="text-sm font-medium text-neutral-500">{eyebrow}</p>}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">{title}</h1>
              {badge}
            </div>
            {subtitle && <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
