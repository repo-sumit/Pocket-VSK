import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The single wrapper every in-app screen uses, so vertical rhythm and the entry
 * animation are identical across views. `animate={false}` for the print/export
 * surface (no motion in a report).
 */
export function ScreenContainer({
  children, className, animate = true,
}: { children: ReactNode; className?: string; animate?: boolean }) {
  return <div className={cn("space-y-5", animate && "animate-fade-in", className)}>{children}</div>;
}
