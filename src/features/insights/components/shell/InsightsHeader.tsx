import React from "react";
import { Eye, EyeOff, FileDown, Lightbulb, RefreshCw } from "lucide-react";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { useUIStore } from "../../../../store/useUIStore";
import { InsightsFilters } from "./InsightsFilters";
import { FreshnessIndicator } from "../primitives/FreshnessIndicator";

interface InsightsHeaderProps {
  onRefresh: () => void;
  onExport: () => void;
}

/**
 * Workspace header and the *only* place global controls live.
 *
 * Period, privacy, refresh and export apply to everything below them, so they
 * are stated once here rather than repeated per section — and the workspace's
 * data freshness is stated once beside them, for the same reason.
 *
 * Controls sit in `PageHeader`'s children slot rather than its `primaryAction`
 * slot: that slot also renders a fixed bottom CTA bar on mobile, which is right
 * for "Add transaction" and wrong for a refresh button.
 */
export const InsightsHeader: React.FC<InsightsHeaderProps> = ({ onRefresh, onExport }) => {
  const moneyVisible = useUIStore((s) => s.moneyVisible);
  const toggleMoneyVisibility = useUIStore((s) => s.toggleMoneyVisibility);

  return (
    <PageHeader
      title="Insights"
      subtitle="Where you stand, what changed, and what to do about it."
      icon={<Lightbulb className="h-5 w-5" aria-hidden="true" />}
    >
      <div className="flex flex-wrap items-center gap-2">
        <InsightsFilters />

        <Button
          variant="neutral"
          hierarchy="outline"
          size="md"
          leftIcon={
            moneyVisible ? (
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
            )
          }
          onClick={toggleMoneyVisibility}
          aria-pressed={!moneyVisible}
        >
          {moneyVisible ? "Hide amounts" : "Show amounts"}
        </Button>

        <Button
          variant="neutral"
          hierarchy="outline"
          size="md"
          leftIcon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
          onClick={onRefresh}
        >
          Refresh
        </Button>

        <Button
          variant="neutral"
          hierarchy="outline"
          size="md"
          leftIcon={<FileDown className="h-3.5 w-3.5" aria-hidden="true" />}
          onClick={onExport}
        >
          Export
        </Button>

        <FreshnessIndicator onRefresh={onRefresh} className="ml-auto" />
      </div>
    </PageHeader>
  );
};
