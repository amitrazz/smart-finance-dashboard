import React from "react";
import { FileText, Info } from "lucide-react";
import { AnalyticsReportType } from "../types/insightsTypes";
import { InsightsRoute } from "../insightsNav";

interface ReportDefinition {
  id: AnalyticsReportType;
  label: string;
  description: string;
  /** Where the same information can be read today, since export doesn't exist. */
  route: InsightsRoute;
}

/**
 * Report definitions map 1:1 to the sections that already render this data.
 * They are a table of contents, not a set of buttons that do nothing.
 */
const REPORTS: ReportDefinition[] = [
  {
    id: "MONTHLY_REVIEW",
    label: "Monthly review",
    description: "Cash flow, savings rate and budget adherence for the current period.",
    route: { section: "analytics", view: "cash-flow" },
  },
  {
    id: "QUARTERLY_REVIEW",
    label: "Quarterly review",
    description: "Net-worth movement and portfolio performance across the quarter.",
    route: { section: "analytics", view: "net-worth" },
  },
  {
    id: "YEARLY_REVIEW",
    label: "Yearly review",
    description: "Income, savings and net-worth trajectory across the year.",
    route: { section: "intelligence", view: "trends" },
  },
  {
    id: "INVESTMENT_REVIEW",
    label: "Investment review",
    description: "Valuation, unrealised return and allocation across portfolios.",
    route: { section: "analytics", view: "investments" },
  },
  {
    id: "DEBT_REVIEW",
    label: "Debt review",
    description: "Outstanding balances, rates and monthly repayment load.",
    route: { section: "analytics", view: "debt" },
  },
  {
    id: "CASH_FLOW_REPORT",
    label: "Cash flow report",
    description: "Category-level outflow against recorded income.",
    route: { section: "analytics", view: "spending" },
  },
];

/**
 * Reports.
 *
 * There is no report-generation endpoint. The honest options were to hide this
 * section or to say so, and the previous revision chose a third: it kept seven
 * cards with permanently disabled Download and Print buttons, and shipped a
 * `generateAnalyticsReport` client stub that returned a canned sentence, wired
 * to a mutation whose success toast read "Analytics report generated
 * successfully". That stub and its toast are deleted.
 *
 * What's left is a table of contents. Each row names a review and links to the
 * section that already renders its data, so the page does something today
 * rather than promising something for later.
 */
export const ReportsPage: React.FC<{ onNavigate: (route: InsightsRoute) => void }> = ({
  onNavigate,
}) => (
  <div className="space-y-6">
    <div className="space-y-1">
      <h2 className="text-base font-semibold tracking-tight text-slate-100">Reports</h2>
      <p className="text-xs leading-relaxed text-slate-400">
        Standard reviews, and where each one's data lives in this workspace.
      </p>
    </div>

    <p className="flex items-start gap-2 rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
      <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        File export isn't available — there's no backend endpoint that generates one. Rather than
        offer a download that can't produce a real document, each review links to the live section
        it summarises, which you can print from the browser.
      </span>
    </p>

    <ul className="grid gap-3 md:grid-cols-2">
      {REPORTS.map((report) => (
        <li key={report.id}>
          <button
            type="button"
            onClick={() => onNavigate(report.route)}
            className="flex h-full w-full items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-left transition-colors hover:border-slate-700 hover:bg-slate-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            <span className="min-w-0 space-y-1">
              <span className="block text-sm font-medium text-slate-100">{report.label}</span>
              <span className="block text-xs leading-relaxed text-slate-400">
                {report.description}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  </div>
);
