import React, { useCallback, useMemo } from "react";
import { useUIStore } from "../../store/useUIStore";
import { InsightsShell } from "./components/shell/InsightsShell";
import {
  InsightsRoute,
  parseInsightsRoute,
  serializeInsightsRoute,
} from "./insightsNav";
import { useRefreshInsights } from "./hooks/useInsightsQueries";
import { OverviewPage } from "./pages/OverviewPage";
import { HealthPage } from "./pages/HealthPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { IntelligencePage } from "./pages/IntelligencePage";
import { ReportsPage } from "./pages/ReportsPage";

/**
 * Insights & Health workspace root.
 *
 * Owns exactly two things: translating the app's hash route into an
 * `InsightsRoute`, and choosing a page. Everything else — chrome, filters,
 * refresh, data — belongs to the shell and the pages.
 *
 * Routing rides `useUIStore.activeSubTab` rather than introducing a router,
 * matching how every other module in this app navigates, so `#/insights/
 * analytics/net-worth` is a real bookmarkable URL and browser back works.
 */
export const InsightsView: React.FC = () => {
  const activeSubTab = useUIStore((s) => s.activeSubTab);
  const setActiveSubTab = useUIStore((s) => s.setActiveSubTab);
  const showToast = useUIStore((s) => s.showToast);
  const refreshInsights = useRefreshInsights();

  const route = useMemo(() => parseInsightsRoute(activeSubTab), [activeSubTab]);

  const navigate = useCallback(
    (next: InsightsRoute) => setActiveSubTab(serializeInsightsRoute(next)),
    [setActiveSubTab],
  );

  const handleRefresh = useCallback(() => {
    refreshInsights();
    showToast("Refreshing analytics", "info");
  }, [refreshInsights, showToast]);

  // Export has no backend endpoint. Rather than a download that can't produce a
  // real document, this lands on Reports, where the gap is explained and each
  // review links to the section that holds its data.
  const handleExport = useCallback(() => navigate({ section: "reports", view: null }), [navigate]);

  const page = (() => {
    switch (route.section) {
      case "health":
        return <HealthPage onNavigate={navigate} />;
      case "analytics":
        return <AnalyticsPage view={route.view} onNavigate={navigate} />;
      case "intelligence":
        return <IntelligencePage view={route.view} onNavigate={navigate} />;
      case "reports":
        return <ReportsPage onNavigate={navigate} />;
      case "overview":
      default:
        return <OverviewPage onNavigate={navigate} />;
    }
  })();

  return (
    <InsightsShell
      route={route}
      onNavigate={navigate}
      onRefresh={handleRefresh}
      onExport={handleExport}
    >
      {page}
    </InsightsShell>
  );
};
