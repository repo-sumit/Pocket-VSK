import { useNavigate } from "react-router-dom";
import type { Entity } from "@/types";
import { useScope } from "@/hooks";
import { useT } from "@/i18n";
import { LEVEL_LABELS } from "@/engine";
import { cn } from "@/lib/cn";
import { ChevronRight } from "../ui/Icon";

/** Scope trail: user's home → … → current entity, each step navigable. */
export function Breadcrumb({ className }: { className?: string }) {
  const { trail, setScope } = useScope();
  const { lang } = useT();
  const navigate = useNavigate();
  if (trail.length === 0) return null;

  const go = (e: Entity) => {
    setScope(e.id);
    navigate("/app");
  };

  return (
    <nav className={cn("flex flex-wrap items-center gap-1 text-xs", className)} aria-label="Scope">
      {trail.map((e, i) => {
        const last = i === trail.length - 1;
        const label = lang === "gu" && e.name_gu ? e.name_gu : e.name;
        return (
          <span key={e.id} className="flex items-center gap-1">
            <button
              onClick={() => !last && go(e)}
              disabled={last}
              className={cn(
                "rounded-md px-1.5 py-0.5 font-semibold",
                last ? "text-neutral-900" : "text-neutral-500 hover:bg-neutral-100 hover:text-primary-600",
              )}
            >
              <span className="text-[10px] font-medium text-neutral-400">{LEVEL_LABELS[e.level][lang === "gu" ? "gu" : "en"]} · </span>
              {label}
            </button>
            {!last && <ChevronRight size={12} className="text-neutral-300" />}
          </span>
        );
      })}
    </nav>
  );
}
