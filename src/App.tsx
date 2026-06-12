import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useSession } from "@/store/session";
import { AppShell } from "@/components/layout/AppShell";
import Login from "@/screens/Login";

// Code-split the in-app screens (keeps the heavy chart lib out of the
// initial / login bundle).
const ScorecardHome = lazy(() => import("@/screens/ScorecardHome"));
const DomainView = lazy(() => import("@/screens/DomainView"));
const SubDomainView = lazy(() => import("@/screens/SubDomainView"));
const GsqacAreaView = lazy(() => import("@/screens/GsqacAreaView"));
const GsqacSubDomainView = lazy(() => import("@/screens/GsqacSubDomainView"));
const ParakhScreen = lazy(() => import("@/screens/ParakhScreen"));
const KpiDetail = lazy(() => import("@/screens/KpiDetail"));
const Export = lazy(() => import("@/screens/Export"));
const NotFound = lazy(() => import("@/screens/NotFound"));

function Splash() {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-500" />
    </div>
  );
}

export default function App() {
  const lang = useSession((s) => s.lang);
  // drive <html lang> so Indic (Mukta) typography + correct line-heights apply
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <BrowserRouter>
      <Suspense fallback={<Splash />}>
        <Routes>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app" element={<AppShell />}>
            <Route index element={<ScorecardHome />} />
            <Route path="domain/:domainId" element={<DomainView />} />
            <Route path="domain/:domainId/:subId" element={<SubDomainView />} />
            <Route path="gsqac/:areaKey" element={<GsqacAreaView />} />
            <Route path="gsqac/:areaKey/:subId" element={<GsqacSubDomainView />} />
            <Route path="parakh" element={<ParakhScreen />} />
            <Route path="kpi/:kpiId" element={<KpiDetail />} />
            {/* standalone Compare & Leaderboard are retired — old links land on the scorecard */}
            <Route path="compare" element={<Navigate to="/app" replace />} />
            <Route path="leaderboard" element={<Navigate to="/app" replace />} />
            <Route path="export" element={<Export />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
