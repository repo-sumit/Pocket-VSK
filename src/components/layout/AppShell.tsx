import { useEffect } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { dataProvider } from "@/data/provider";
import { useSession } from "@/store/session";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { CompareProvider, useCompare } from "@/components/compare/CompareContext";
import { CompareSheet } from "@/components/compare/CompareSheet";
import { HierarchyNavigator } from "./HierarchyNavigator";
import { LanguageToggle } from "./LanguageToggle";
import { PmShriFilter } from "./PmShriFilter";
import { BarChart3, Download, LogOut } from "../ui/Icon";

/**
 * App shell — no navigation rails. The portal is one scorecard surface:
 * a slim identity row (logo · user · logout) and a single navigator/action row
 * (smart hierarchy navigator · PM SHRI · Compare · language · Export). Compare is
 * an action (not a destination): it gates the embedded comparison charts behind a
 * child-unit selection. Content gets the full width; the navigator takes its own
 * line on mobile, actions wrap beneath.
 */
export function AppShell() {
  const user = useSession((s) => s.user);
  const logout = useSession((s) => s.logout);
  const scopeId = useSession((s) => s.scopeId);
  const resetScope = useSession((s) => s.resetScope);
  const { t, tn } = useT();
  const loc = useLocation();
  const navigate = useNavigate();

  // ACCESS CONTROL: repair a tampered/stale persisted scope (localStorage) that
  // points outside the user's subtree, snapping it back to their home entity.
  // useScope already clamps on read; this also cleans the stored value.
  // NOTE: client-side guard only — production must enforce scope server-side (RLS).
  useEffect(() => {
    if (user && scopeId && !dataProvider.isInScope(user.entity_id, scopeId)) resetScope();
  }, [user, scopeId, resetScope]);

  if (!user) return <Navigate to="/login" replace />;

  const isOfficer = user.role === "crc" || user.role === "brc" || user.role === "deo" || user.role === "state";
  const onExport = loc.pathname.startsWith("/app/export");

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <CompareProvider>
      <div className="min-h-[100dvh] bg-surface-muted">
        <header className="sticky top-0 z-30 border-b border-line/70 bg-white/90 backdrop-blur no-print">
          {/* identity row */}
          <div className="mx-auto flex max-w-content items-center gap-3 px-4 py-2">
            <Link to="/app" className="flex items-center gap-2">
              <img src="/logo-vsk.png" alt="Vidya Samiksha Kendra" className="h-9 w-9 object-contain" />
              <span className="leading-none">
                <span className="block text-base font-extrabold tracking-tight text-neutral-900">{t("app.name")}</span>
                <span className="hidden text-2xs font-medium text-neutral-400 sm:block">{t("app.tagline")}</span>
              </span>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden text-right leading-tight sm:block">
                <div className="text-xs font-semibold text-neutral-800">{tn(user.name, user.name_gu)}</div>
                <div className="text-2xs text-neutral-400">{t(`roles.${user.role}`)}</div>
              </div>
              <button onClick={onLogout} title={t("nav.logout")} aria-label={t("nav.logout")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200">
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {/* navigator + actions — navigator owns its own line on mobile, shares the row on desktop */}
          <div className="mx-auto flex max-w-content flex-wrap items-center gap-2 px-4 pb-2.5">
            <HierarchyNavigator className="w-full lg:w-auto lg:min-w-0 lg:flex-1" />
            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap">
              {isOfficer && <PmShriFilter className="inline-flex" />}
              <CompareControl />
              <LanguageToggle />
              {!onExport && (
                <Link
                  to="/app/export"
                  className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 lg:py-1.5"
                >
                  <Download size={14} /> {t("nav.export")}
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto min-w-0 max-w-content px-4 py-4 pb-10 sm:py-5">
          <Outlet />
        </main>

        <CompareMount />
      </div>
    </CompareProvider>
  );
}

/** Compare action button — "Compare" → "Compare · N" once applied; opens the
 *  child-unit selector. Hidden at leaf scopes (nothing below to compare). */
function CompareControl() {
  const { childLevel, applied, selectedIds, setOpen } = useCompare();
  const { t } = useT();
  if (!childLevel) return null;
  const n = applied ? selectedIds.length : 0;
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors lg:py-1.5",
        n ? "bg-primary-50 text-primary-700 ring-1 ring-primary-200" : "border border-line bg-white text-neutral-600 hover:bg-neutral-50",
      )}
    >
      <BarChart3 size={14} className={n ? "text-primary-600" : "text-neutral-400"} />
      {n ? `${t("compare.button")} · ${n}` : t("compare.button")}
    </button>
  );
}

/** Renders the Compare selection sheet/drawer, driven by the shared compare state. */
function CompareMount() {
  const { open, childLevel, childEntities, selectedIds, applied, apply, remove, setOpen } = useCompare();
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
