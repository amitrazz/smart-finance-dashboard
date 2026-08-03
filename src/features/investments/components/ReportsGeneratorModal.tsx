import React, { useState } from "react";
import { ReportType } from "../types/investmentTypes";
import { useGenerateReport } from "../hooks/useInvestmentQueries";
import { X, FileText, Download, Printer } from "lucide-react";

interface ReportsGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportsGeneratorModal: React.FC<ReportsGeneratorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>("TAX_CAPITAL_GAINS");
  const [fy, setFy] = useState("2025-2026");
  const generateReport = useGenerateReport();

  if (!isOpen) return null;

  const handleGenerate = () => {
    generateReport.mutate({ reportType: selectedReport, financialYear: fy });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Financial & Tax Reports Generator</h3>
              <p className="text-xs text-slate-400">Generate audit-ready reports for tax filing & wealth planning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Financial Year Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Financial Year</label>
            <select
              value={fy}
              onChange={(e) => setFy(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="2025-2026">FY 2025 - 2026 (Current Assessment Year)</option>
              <option value="2024-2025">FY 2024 - 2025</option>
              <option value="2023-2024">FY 2023 - 2024</option>
            </select>
          </div>

          {/* Report Type Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Report Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: "TAX_CAPITAL_GAINS", title: "Capital Gains Tax Statement", desc: "STCG (20%) & LTCG (12.5%) breakdown for IT Return filing" },
                { id: "PORTFOLIO_SUMMARY", title: "Portfolio Valuation Statement", desc: "Current holdings, cost basis & market values" },
                { id: "PERFORMANCE", title: "Performance Analytics & XIRR", desc: "CAGR, XIRR, rolling returns vs benchmark" },
                { id: "DIVIDEND_INCOME", title: "Passive Dividend & Interest Log", desc: "Annual income calendar & tax deduction records" },
                { id: "ALLOCATION_RISK", title: "Allocation & Risk Audit", desc: "Concentration risks, sector weights & asset classes" },
                { id: "GOAL_PROGRESS", title: "Goal Tracking Summary", desc: "Goal progress percentage, funding gaps & required SIPs" },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r.id as ReportType)}
                  className={`p-4 rounded-2xl border text-left transition-all space-y-1 ${
                    selectedReport === r.id
                      ? "bg-indigo-600/10 border-indigo-500 text-indigo-300"
                      : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <h5 className="font-bold text-sm text-slate-100">{r.title}</h5>
                  <p className="text-xs text-slate-400">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Tax Preview if TAX_CAPITAL_GAINS */}
          {selectedReport === "TAX_CAPITAL_GAINS" && (
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-2 text-xs">
              <h5 className="font-bold text-indigo-400">Estimated Tax Liability Preview ({fy})</h5>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>Short-Term Capital Gain: <strong className="text-slate-100">₹42,500.00</strong></div>
                <div>Long-Term Capital Gain: <strong className="text-slate-100">₹1,85,000.00</strong></div>
                <div>LTCG Exemption Applied: <strong className="text-emerald-400">-₹1,00,000.00</strong></div>
                <div>Estimated Tax Payable: <strong className="text-amber-400">₹14,875.00</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
          >
            <Printer className="w-4 h-4" /> Print Document
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerate}
              disabled={generateReport.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Download className="w-4 h-4" /> Download PDF Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
