import { useEffect, useState, type ReactNode } from "react";
import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { dataProvider } from "@/data/provider";
import { useSession } from "@/store/session";
import { useT } from "@/i18n";
import {
  CompareProvider,
  useCompare,
} from "@/components/compare/CompareContext";
import { CompareSheet } from "@/components/compare/CompareSheet";
import { HeaderNav } from "./HierarchyNavigator";
import { FilterSheet } from "./FilterSheet";
import { Share, FunnelFilter, BarCompare } from "../ui/Icon";

/**
 * App shell (latest design) — one clean header on every page:
 *   [logo]   ‹ entity · level ›   [share] [filter]
 * No logout, no large "Pocket VSK" mobile title, no role/designation, no
 * second action row. School-type + Language live in the Filter sheet; Export is
 * the Share icon; Compare is a desktop header button and a mobile floating action
 * (bottom-right). Compare is hidden on KPI detail pages.
 */
export function AppShell() {
  const user = useSession((s) => s.user);
  const scopeId = useSession((s) => s.scopeId);
  const resetScope = useSession((s) => s.resetScope);
  const { t } = useT();
  const navigate = useNavigate();
  const [filterOpen, setFilterOpen] = useState(false);

  // ACCESS CONTROL: repair a tampered/stale persisted scope that points outside
  // the user's subtree (client-side guard only; production enforces server-side).
  useEffect(() => {
    if (user && scopeId && !dataProvider.isInScope(user.entity_id, scopeId))
      resetScope();
  }, [user, scopeId, resetScope]);

  if (!user) return <Navigate to="/login" replace />;

  const isOfficer =
    user.role === "CRCC" ||
    user.role === "brc" ||
    user.role === "deo" ||
    user.role === "state";

  return (
    <CompareProvider>
      <div className="min-h-[100dvh] bg-surface-muted">
        <header className="sticky top-0 z-30 border-b border-line/70 bg-white/90 backdrop-blur no-print">
          <div className="mx-auto flex max-w-content items-center gap-1.5 px-3 py-2 sm:gap-2 sm:px-4">
            {/* left — logo (product name on desktop only) */}
            <Link
              to="/app"
              className="flex shrink-0 items-center gap-2"
              aria-label={t("app.name")}
            >
              <img
                src="/logo-vsk.png"
                alt=""
                className="h-9 w-9 object-contain"
              />
              <span className="hidden leading-none lg:block">
                <span className="block text-base font-extrabold tracking-tight text-neutral-900">
                  {t("app.name")}
                </span>
                <span className="block text-2xs font-medium text-neutral-400">
                  {t("app.tagline")}
                </span>
              </span>
            </Link>

            {/* center — hierarchy navigator (entity · level with drill arrows) */}
            <HeaderNav className="min-w-0 flex-1" />

            {/* right — desktop Compare, Share (export), Filter */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
              <CompareHeaderButton />
              <IconButton
                label={t("nav.share")}
                onClick={() => navigate("/app/export")}
              >
                <Share size={18} />
              </IconButton>
              <IconButton
                label={t("nav.filter")}
                onClick={() => setFilterOpen(true)}
              >
                <FunnelFilter size={18} />
              </IconButton>
            </div>
          </div>
        </header>

        <main className="mx-auto min-w-0 max-w-content px-4 py-4 pb-24 sm:py-5 lg:pb-10">
          <Outlet />
        </main>

        <FloatingCompare />
        <FilterSheet
          open={filterOpen}
          isOfficer={isOfficer}
          onClose={() => setFilterOpen(false)}
        />
        <CompareMount />
      </div>
    </CompareProvider>
  );
}

/** A 36px round header icon button. */
function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200"
    >
      {children}
    </button>
  );
}

/** Desktop-only Compare button in the header. Hidden at leaf scopes and on KPI
 *  detail pages; mobile uses the floating action instead. */
function CompareHeaderButton() {
  const { childLevel, applied, selectedIds, setOpen } = useCompare();
  const { t } = useT();
  const isKpiDetail = useLocation().pathname.includes("/kpi/");
  if (!childLevel || isKpiDetail) return null;
  const n = applied ? selectedIds.length : 0;
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="hidden items-center gap-1.5 rounded-full border border-primary-500 bg-primary-50 px-3.5 py-1.5 text-xs font-bold text-primary-700 transition-colors hover:bg-primary-100 lg:inline-flex"
    >
      <BarCompare size={15} className="text-primary-600" />
      {n ? `${t("compare.button")} · ${n}` : t("compare.button")}
    </button>
  );
}

/** Mobile floating Compare action (bottom-right) with a selected-count badge.
 *  Hidden at leaf scopes and on KPI detail pages; desktop uses the header button. */
function FloatingCompare() {
  const { childLevel, applied, selectedIds, setOpen } = useCompare();
  const { t } = useT();
  const isKpiDetail = useLocation().pathname.includes("/kpi/");
  if (!childLevel || isKpiDetail) return null;
  const n = applied ? selectedIds.length : 0;
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={n ? `${t("compare.button")} · ${n}` : t("compare.button")}
      className="fixed bottom-5 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary-500 text-white shadow-raised transition-transform hover:bg-primary-600 active:scale-95 lg:hidden no-print"
    >
      <BarCompare size={24} />
      {n > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-6 min-w-[1.5rem] place-items-center rounded-full border-2 border-white bg-rag-red px-1 text-2xs font-extrabold text-white">
          {n}
        </span>
      )}
    </button>
  );
}

/** Renders the Compare selection sheet/drawer, driven by the shared compare state. */
function CompareMount() {
  const {
    open,
    childLevel,
    childEntities,
    selectedIds,
    applied,
    apply,
    remove,
    setOpen,
  } = useCompare();
  if (!childLevel) return null;
  return (
    <CompareSheet
      open={open}
      childLevel={childLevel}
      all={childEntities}
      initial={selectedIds}
      applied={applied}
      onApply={apply}
      onRemove={remove}
      onClose={() => setOpen(false)}
    />
  );
}
