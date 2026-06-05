import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSession } from "@/store/session";
import { useScope } from "@/hooks";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Breadcrumb } from "./Breadcrumb";
import { LanguageToggle } from "./LanguageToggle";
import { PmShriFilter } from "./PmShriFilter";
import type { LucideIcon } from "lucide-react";
import { BarChart3, ChartNoAxesColumn, Download, LogOut, Trophy, Users } from "../ui/Icon";

const NAV: { to: string; key: string; icon: LucideIcon; end?: boolean }[] = [
  { to: "/app", key: "home", icon: BarChart3, end: true },
  { to: "/app/compare", key: "compare", icon: ChartNoAxesColumn },
  { to: "/app/sections", key: "sections", icon: Users },
  { to: "/app/leaderboard", key: "leaderboard", icon: Trophy },
  { to: "/app/export", key: "export", icon: Download },
];

export function AppShell() {
  const user = useSession((s) => s.user);
  const logout = useSession((s) => s.logout);
  const { entity } = useScope();
  const { t, tn, lang } = useT();
  const loc = useLocation();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  const isOfficer = user.role === "crc" || user.role === "brc" || user.role === "deo" || user.role === "state";
  const isActive = (to: string, end?: boolean) => (end ? loc.pathname === to : loc.pathname.startsWith(to));

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-[100dvh] bg-surface-muted">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-white/90 backdrop-blur no-print">
        <div className="mx-auto flex max-w-content items-center gap-3 px-4 py-2.5">
          <Link to="/app" className="flex items-center gap-2">
            <img src="/logo-vsk.png" alt="Vidya Samiksha Kendra" className="h-9 w-9 object-contain" />
            <span className="hidden leading-none sm:block">
              <span className="block text-base font-extrabold tracking-tight text-neutral-900">{t("app.name")}</span>
              <span className="block text-2xs font-medium text-neutral-400">{t("app.tagline")}</span>
            </span>
          </Link>
          <div className="ml-1 hidden min-w-0 flex-1 md:block">
            <Breadcrumb />
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* PM SHRI is meaningless at teacher/principal scope — Cluster and above only */}
            {isOfficer && <PmShriFilter className="hidden sm:inline-flex" />}
            <LanguageToggle />
            <div className="hidden items-center gap-2 sm:flex">
              <div className="text-right leading-tight">
                <div className="text-xs font-semibold text-neutral-800">{tn(user.name, user.name_gu)}</div>
                <div className="text-2xs text-neutral-400">{t(`roles.${user.role}`)}</div>
              </div>
              <button onClick={onLogout} title={t("nav.logout")} aria-label={t("nav.logout")} className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
        {/* mobile breadcrumb row */}
        <div className="mx-auto max-w-content px-4 pb-2 md:hidden">
          <Breadcrumb />
        </div>
      </header>

      <div className="mx-auto flex max-w-content gap-6 px-4 py-4 sm:py-6">
        {/* Desktop side nav */}
        <nav className="sticky top-20 hidden h-fit w-52 shrink-0 flex-col gap-1 lg:flex no-print">
          {NAV.map((n) => {
            const active = isActive(n.to, n.end);
            const I = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  active ? "bg-primary-50 text-primary-600" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800",
                )}
              >
                <I size={18} /> {t(`nav.${n.key}`)}
              </Link>
            );
          })}
          <div className="mt-3 rounded-xl bg-white p-3 text-2xs text-neutral-400 shadow-card">
            <div className="font-semibold text-neutral-500">{entity ? (lang === "gu" && entity.name_gu ? entity.name_gu : entity.name) : ""}</div>
            <div>{t("app.tagline")}</div>
          </div>
        </nav>

        {/* Content */}
        <main className="min-w-0 flex-1 pb-24 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-white/95 backdrop-blur safe-bottom lg:hidden no-print">
        <div className="mx-auto flex max-w-content items-stretch justify-around px-2">
          {NAV.map((n) => {
            const active = isActive(n.to, n.end);
            const I = n.icon;
            return (
              <Link key={n.to} to={n.to} className={cn("flex flex-1 flex-col items-center gap-0.5 py-2 text-2xs font-semibold", active ? "text-primary-600" : "text-neutral-400")}>
                <I size={20} />
                {t(`nav.${n.key}`)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
