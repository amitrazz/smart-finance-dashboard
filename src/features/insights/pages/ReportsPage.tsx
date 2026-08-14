import React, { useRef, useState } from "react";
import { ArrowLeft, Download, Eye, FileText, Printer, SlidersHorizontal } from "lucide-react";
import { InsightsRoute } from "../insightsNav";
import { AnalyticsReportType, INSIGHTS_PERIOD_LABELS } from "../types/insightsTypes";
import { useInsightsFilters } from "../hooks/useInsightsFilters";
import { useUIStore } from "../../../store/useUIStore";
import { Button } from "../../../components/ui/Button";
import { SectionHeader } from "../components/primitives/SectionHeader";
import { Surface } from "../components/primitives/Surface";
import { ReportDocument } from "../components/reports/ReportDocument";
import { REPORT_SECTIONS, ReportSectionId } from "../components/reports/reportSections";
import { ReportRow, downloadCsv, reportFilename, toCsv } from "../utils/reportExport";

interface ReportDefinition {
  id: AnalyticsReportType;
  label: string;
  description: string;
  sections: ReportSectionId[];
}

/**
 * Standard reports, defined by what they contain rather than by what they are
 * called. Each is a starting selection the builder can change.
 */
const REPORTS: ReportDefinition[] = [
  {
    id: "MONTHLY_REVIEW",
    label: "Monthly summary",
    description: "Income, spending, cash flow and what needs attention this period.",
    sections: ["cash-flow", "spending", "income", "budget", "intelligence"],
  },
  {
    id: "QUARTERLY_REVIEW",
    label: "Quarterly review",
    description: "Position and trajectory: net worth, investments, debt and health.",
    sections: ["net-worth", "investments", "debt", "health"],
  },
  {
    id: "YEARLY_REVIEW",
    label: "Annual financial review",
    description: "The full picture across every domain pFOS tracks.",
    sections: [
      "net-worth",
      "cash-flow",
      "income",
      "spending",
      "debt",
      "investments",
      "goals",
      "health",
    ],
  },
  {
    id: "INVESTMENT_REVIEW",
    label: "Investment review",
    description: "Valuation, unrealised return and goal funding.",
    sections: ["investments", "net-worth", "goals"],
  },
  {
    id: "DEBT_REVIEW",
    label: "Debt review",
    description: "Outstanding balances, repayment load and what it costs.",
    sections: ["debt", "cash-flow", "health"],
  },
  {
    id: "CASH_FLOW_REPORT",
    label: "Spending report",
    description: "Category-level outflow against recorded income and budget.",
    sections: ["spending", "subscriptions", "budget", "cash-flow"],
  },
];

type Mode =
  | { kind: "home" }
  | { kind: "builder"; report: ReportDefinition; sections: ReportSectionId[] }
  | { kind: "viewer"; report: ReportDefinition; sections: ReportSectionId[] };

/**
 * Reports: the historical and take-away layer.
 *
 * ## What changed, and what stayed honest
 *
 * There is still no report-generation endpoint. The previous revision handled
 * that by listing six cards that only *linked* to the analytics sections — a
 * table of contents wearing a report page's name — after an earlier one shipped
 * disabled Download buttons and a stub that toasted "report generated
 * successfully" while producing nothing.
 *
 * This produces real documents without pretending a server made them. The
 * document is composed from the same mapped view models the sections render, so
 * it can never disagree with them; print goes through the browser to a real PDF;
 * CSV is a serialisation of exactly the lines on screen. Nothing is computed on
 * the way out, and no request is made that the backend cannot answer.
 */
export const ReportsPage: React.FC<{ onNavigate: (route: InsightsRoute) => void }> = () => {
  const [mode, setMode] = useState<Mode>({ kind: "home" });
  const period = useInsightsFilters((s) => s.period);
  const moneyVisible = useUIStore((s) => s.moneyVisible);
  const toggleMoneyVisibility = useUIStore((s) => s.toggleMoneyVisibility);
  const showToast = useUIStore((s) => s.showToast);
  const rowsRef = useRef<ReportRow[]>([]);

  const periodLabel = INSIGHTS_PERIOD_LABELS[period];

  if (mode.kind === "home") {
    return (
      <Surface>
        <section className="space-y-4 p-4 sm:p-5" aria-label="Reports">
          <SectionHeader
            title="Reports"
            description="Composed from the figures already on your screens, then printed or exported. Nothing here is generated on a server, so nothing here can disagree with the rest of the workspace."
          />

          <ul className="grid gap-2 md:grid-cols-2">
            {REPORTS.map((report) => (
              <li key={report.id}>
                <div className="flex h-full flex-col gap-3 rounded-lg border border-slate-800/70 bg-slate-950/30 p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-sm font-medium text-slate-100">{report.label}</h3>
                      <p className="text-xs leading-relaxed text-slate-500">{report.description}</p>
                      <p className="text-[11px] text-slate-600">
                        {report.sections.length} sections · {periodLabel.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button
                      variant="neutral"
                      hierarchy="outline"
                      size="sm"
                      onClick={() =>
                        setMode({ kind: "viewer", report, sections: report.sections })
                      }
                    >
                      Open
                    </Button>
                    <Button
                      variant="neutral"
                      hierarchy="ghost"
                      size="sm"
                      leftIcon={<SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />}
                      onClick={() =>
                        setMode({ kind: "builder", report, sections: report.sections })
                      }
                    >
                      Customise
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </Surface>
    );
  }

  if (mode.kind === "builder") {
    const toggle = (id: ReportSectionId) =>
      setMode({
        ...mode,
        sections: mode.sections.includes(id)
          ? mode.sections.filter((s) => s !== id)
          : [...mode.sections, id],
      });

    return (
      <Surface>
        <section className="space-y-5 p-4 sm:p-5" aria-label="Build a report">
          <BackLink label="All reports" onClick={() => setMode({ kind: "home" })} />

          <SectionHeader
            title={`Build: ${mode.report.label}`}
            description="Choose what the document contains. The period comes from the workspace selector, so a report always covers the same window as the screens it was built from."
          />

          <div className="space-y-3">
            <p className="text-[11px] font-medium text-slate-500">Period</p>
            <p className="text-sm text-slate-200">{periodLabel}</p>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-[11px] font-medium text-slate-500">Include</legend>
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {REPORT_SECTIONS.map((section) => {
                const checked = mode.sections.includes(section.id);
                return (
                  <label
                    key={section.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-800/50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(section.id)}
                      className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-2 focus:ring-sky-500/60"
                    />
                    {section.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-2 border-t border-slate-800/70 pt-4">
            <Button
              variant="primary"
              size="md"
              disabled={mode.sections.length === 0}
              onClick={() => setMode({ kind: "viewer", report: mode.report, sections: mode.sections })}
            >
              Generate report
            </Button>
            <Button
              variant="neutral"
              hierarchy="ghost"
              size="md"
              onClick={() => setMode({ kind: "home" })}
            >
              Cancel
            </Button>
          </div>
        </section>
      </Surface>
    );
  }

  const handleCsv = () => {
    if (rowsRef.current.length === 0) {
      showToast("Nothing to export yet — the report has no figures", "info");
      return;
    }
    downloadCsv(reportFilename(mode.report.label), toCsv(rowsRef.current));
    showToast("Report exported", "success");
  };

  return (
    <Surface>
      <div className="space-y-4 p-4 sm:p-5">
        <div className="no-print space-y-4">
          <BackLink label="All reports" onClick={() => setMode({ kind: "home" })} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeader
              title={mode.report.label}
              description={`${mode.sections.length} sections · ${periodLabel.toLowerCase()}`}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="neutral"
                hierarchy="outline"
                size="sm"
                leftIcon={<SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />}
                onClick={() =>
                  setMode({ kind: "builder", report: mode.report, sections: mode.sections })
                }
              >
                Change sections
              </Button>
              <Button
                variant="neutral"
                hierarchy="outline"
                size="sm"
                leftIcon={<Download className="h-3.5 w-3.5" aria-hidden="true" />}
                onClick={handleCsv}
                disabled={!moneyVisible}
              >
                Export CSV
              </Button>
              <Button
                variant="neutral"
                hierarchy="outline"
                size="sm"
                leftIcon={<Printer className="h-3.5 w-3.5" aria-hidden="true" />}
                onClick={() => window.print()}
                disabled={!moneyVisible}
              >
                Print / PDF
              </Button>
            </div>
          </div>

          {/*
            Exporting while amounts are hidden would either write the real
            figures to a file the user believes is masked, or write a file full
            of bullet characters. Neither is useful, so export waits until the
            amounts are on screen — and says so, with the way to fix it.
          */}
          {!moneyVisible && (
            <p className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90">
              <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Amounts are hidden, so this report would export without them.
              <button
                type="button"
                onClick={toggleMoneyVisibility}
                className="font-semibold underline underline-offset-2 hover:text-amber-100"
              >
                Show amounts
              </button>
            </p>
          )}
        </div>

        <div className="print-report rounded-lg border border-slate-800/70">
          <ReportDocument
            title={mode.report.label}
            sections={mode.sections}
            periodLabel={periodLabel}
            onRowsChange={(rows) => {
              rowsRef.current = rows;
            }}
          />
        </div>
      </div>
    </Surface>
  );
};

const BackLink: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
  >
    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
    {label}
  </button>
);
