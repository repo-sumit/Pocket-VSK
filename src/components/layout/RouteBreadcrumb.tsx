import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/cn";
import { ArrowLeft } from "@/components/ui/Icon";

export type BreadcrumbItem = { label: string; to?: string };

/**
 * Slim slash breadcrumb shown below the header on every non-home page:
 *   ←  Home / Domain / … / Current page
 *  • Back arrow → one logical level up (the immediate route-aware parent, NOT
 *    browser history) so it survives refresh / deep-links.
 *  • Home + ancestor levels are muted-blue clickable links; the current page is
 *    plain dark text (not a link). "/" separators.
 *  • One slim row (not a card); the trail scrolls horizontally if it overflows —
 *    the page itself never does — and the current label truncates on small
 *    screens. Never rendered on the homepage or /login.
 */
export function RouteBreadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  const navigate = useNavigate();
  if (items.length === 0) return null;
  // immediate parent = the last item that still carries a route (current page has none)
  const parent = [...items].reverse().find((c) => c.to);
  return (
    <nav aria-label="Breadcrumb" className={cn("no-print flex min-w-0 items-center gap-1", className)}>
      {parent?.to && (
        <button
          type="button"
          onClick={() => navigate(parent.to as string)}
          aria-label="Back"
          title="Back"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-primary-600"
        >
          <ArrowLeft size={18} />
        </button>
      )}
      <ol className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap py-1 text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${i}-${c.label}`} className="flex shrink-0 items-center gap-1">
              {i > 0 && <span aria-hidden className="shrink-0 px-0.5 text-neutral-300">/</span>}
              {c.to && !last ? (
                <Link
                  to={c.to}
                  className="shrink-0 font-semibold text-primary-600 transition-colors hover:text-primary-700 hover:underline"
                >
                  {c.label}
                </Link>
              ) : (
                <span
                  title={c.label}
                  className={cn(
                    "font-semibold",
                    last ? "max-w-[58vw] truncate text-neutral-800 sm:max-w-none" : "shrink-0 text-primary-600",
                  )}
                >
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
