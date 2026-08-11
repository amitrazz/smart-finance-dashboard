import React from "react";
import { InsightsRoute } from "../../insightsNav";
import { InsightsHeader } from "./InsightsHeader";
import { InsightsNav } from "./InsightsNav";

interface InsightsShellProps {
  route: InsightsRoute;
  onNavigate: (route: InsightsRoute) => void;
  onRefresh: () => void;
  onExport: () => void;
  children: React.ReactNode;
}

/**
 * The frame every Insights page renders inside: header, navigation, content.
 *
 * Both levels of navigation live in `InsightsNav`, matching how Planning and
 * Accounts package theirs, so the breadcrumb, the primary bar and the
 * contextual pill row animate and scroll as one unit.
 *
 * `min-w-0` on the content column is load-bearing. Grid and flex children
 * default to `min-width: auto`, so a wide table or a Recharts container inside
 * one will push the whole page wider than the viewport and produce the
 * horizontal scroll the acceptance criteria rule out. Sections that genuinely
 * need width scroll inside themselves instead.
 */
export const InsightsShell: React.FC<InsightsShellProps> = ({
  route,
  onNavigate,
  onRefresh,
  onExport,
  children,
}) => (
  <div className="min-w-0 space-y-6">
    <InsightsHeader onRefresh={onRefresh} onExport={onExport} />
    <InsightsNav route={route} onNavigate={onNavigate} />
    <div className="min-w-0">{children}</div>
  </div>
);
