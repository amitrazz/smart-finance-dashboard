import React from "react";
import { Eye, EyeOff, FileDown, Lightbulb, RefreshCw } from "lucide-react";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { useUIStore } from "../../../../store/useUIStore";
import { InsightsFilters } from "./InsightsFilters";

interface InsightsHeaderProps {
  onRefresh: () => void;
  onExport: () => void;
  isRefreshing?: boolean;
}

/**
 * Workspace header, built on the app's shared `PageHeader` and `Button` so the
 * title block, icon tile and control row read the same as every other module.
 *
 * Controls sit in `PageHeader`'s children slot rather than its `primaryAction`
 * slot: that slot also renders a fixed bottom CTA bar on mobile, which is right
 * for "Add transaction" and wrong for a refresh button.
 *
 * The previous chrome stacked five rows before any content — a title block, a
 * five-tab bar, a pill row, a breadcrumb strip and a filter toolbar — on a page
 * whose first job is to be understood in five seconds. The breadcrumb moved
 * into the nav component where the rest of the app keeps it, and the filter
 * toolbar folded into a single popover.
 */
export const InsightsHeader: React.FC<InsightsHeaderProps> = ({
  onRefresh,
  onExport,
  isRefreshing = false,
}) => {
  const moneyVisible = useUIStore((s) => s.moneyVisible);
  const toggleMoneyVisibility = useUIStore((s) => s.toggleMoneyVisibility);

  return (
    <PageHeader
      title="Financial intelligence"
      subtitle="Understand your financial position, identify risks, and decide what to do next."
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
          leftIcon={
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
          }
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
      </div>
    </PageHeader>
  );
};
