import React from "react";
import { useGenerateAnalyticsReport } from "../hooks/useInsightsQueries";
import { AnalyticsHeader } from "../components/AnalyticsHeader";
import { AnalyticsReportType } from "../types/insightsTypes";
import { FileText, Download, Printer } from "lucide-react";

export const ReportsPage: React.FC = () => {
  const generateReport = useGenerateAnalyticsReport();

  const reportTypes: { id: AnalyticsReportType; label: string; desc: string }[] = [
    { id: "MONTHLY_REVIEW", label: "Monthly Executive Financial Review", desc: "Comprehensive summary of cash flow, savings rate & budget adherence" },
    { id: "QUARTERLY_REVIEW", label: "Quarterly Wealth & Investment Review", desc: "CAGR, XIRR returns, net worth growth, and asset class rebalancing" },
    { id: "YEARLY_REVIEW", label: "Yearly Financial Performance Statement", desc: "Annualized income, savings growth, tax deductions & net worth milestone" },
    { id: "TAX_SUMMARY", label: "Capital Gains & Income Tax Summary", desc: "STCG, LTCG, dividend income tax estimates, 80C/80D deduction log" },
    { id: "INVESTMENT_REVIEW", label: "Portfolio Holdings & FIFO Tax Lots", desc: "Detailed breakdown of stock, mutual fund, gold holdings & cost basis" },
    { id: "DEBT_REVIEW", label: "Debt & Liability Repayment Statement", desc: "Loan outstanding, EMIs paid, interest penalty breakdown, avalanche plan" },
    { id: "CASH_FLOW_REPORT", label: "Detailed Inflow vs Outflow Cash Report", desc: "Category level expenditures, recurring subscriptions, income sources" },
  ];

  const handleGenerate = (type: AnalyticsReportType) => {
    generateReport.mutate(type);
  };

  return (
    <div className="space-y-6">
      <AnalyticsHeader
        title="Custom Financial Reports & PDF Export"
        description="Generate, print, and export executive PDF reports or raw data spreadsheets"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((r) => (
          <div key={r.id} className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-3 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-400">
                <FileText className="w-5 h-5" />
                <h4 className="font-bold text-slate-100 text-sm">{r.label}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{r.desc}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
              <button
                onClick={() => handleGenerate(r.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
              <button
                onClick={() => handleGenerate(r.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" /> Print Report
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
