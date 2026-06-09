import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SectionLabel } from "@/components/ui/atoms";

/** A labelled section with consistent label + spacing + optional right action. */
export function PageSection({
  title, action, children, className,
}: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      {(title || action) && (
        <div className="mb-2 flex items-center justify-between gap-2">
          {title ? <SectionLabel className="!mb-0">{title}</SectionLabel> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const COLS: Record<string, string> = {
  kpi: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  domain: "grid-cols-1 sm:grid-cols-3",
  two: "grid-cols-1 sm:grid-cols-2",
};

/** Consistent responsive card grid. `cols="kpi"` (1/2/3) is the indicator default. */
export function PageGrid({
  children, cols = "kpi", className,
}: { children: ReactNode; cols?: "kpi" | "domain" | "two"; className?: string }) {
  return <div className={cn("grid gap-3", COLS[cols], className)}>{children}</div>;
}
