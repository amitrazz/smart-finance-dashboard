import React, { useState } from "react";
import { ImportSourceType, ImportStep } from "../types/investmentTypes";
import { useCreateImportJob } from "../hooks/useInvestmentQueries";
import { X, UploadCloud, FileText, CheckCircle2 } from "lucide-react";

interface ImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportWizardModal: React.FC<ImportWizardModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<ImportStep>("SELECT_SOURCE");
  const [selectedSource, setSelectedSource] = useState<ImportSourceType>("CAS_PDF");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const createJob = useCreateImportJob();

  if (!isOpen) return null;

  const handleSourceSelect = (source: ImportSourceType) => {
    setSelectedSource(source);
    setStep("UPLOAD");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      createJob.mutate(
        { sourceType: selectedSource, fileName: file.name },
        {
          onSuccess: () => setStep("PREVIEW"),
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Multi-Step Investment Import Wizard</h3>
              <p className="text-xs text-slate-400">Import CAS PDFs, Broker CSVs, or Bank statements into pFOS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
          <span className={step === "SELECT_SOURCE" ? "text-indigo-400 font-bold" : ""}>1. Select Source</span>
          <span>→</span>
          <span className={step === "UPLOAD" ? "text-indigo-400 font-bold" : ""}>2. Upload File</span>
          <span>→</span>
          <span className={step === "PREVIEW" ? "text-indigo-400 font-bold" : ""}>3. Preview & Map</span>
          <span>→</span>
          <span className={step === "RESULTS" ? "text-indigo-400 font-bold" : ""}>4. Finish</span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {step === "SELECT_SOURCE" && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-200">Choose your statement source:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: "CAS_PDF", title: "CAMS / KFintech CAS PDF", desc: "Consolidated Account Statement across Mutual Funds & Equities" },
                  { id: "ZERODHA_CSV", title: "Zerodha Tradebook / Tax P&L CSV", desc: "Official Zerodha trade log download" },
                  { id: "GROWW_CSV", title: "Groww Portfolio CSV", desc: "Groww mutual fund & stock holdings export" },
                  { id: "INDMONEY_CSV", title: "INDmoney Investment Export", desc: "US stocks & domestic portfolio CSV" },
                  { id: "CUSTOM_EXCEL", title: "Custom Excel / CSV Template", desc: "Standard pFOS spreadsheet format" },
                  { id: "BANK_STATEMENT", title: "Bank Statement PDF/CSV", desc: "Parse FD interest & dividend credits" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSourceSelect(item.id as ImportSourceType)}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-left transition-all space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-slate-100 group-hover:text-indigo-400 text-sm">{item.title}</h5>
                      <FileText className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                    </div>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "UPLOAD" && (
            <div className="py-8 text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <UploadCloud className="w-10 h-10 animate-pulse" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-100">Upload statement for {selectedSource.replace("_", " ")}</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Drag and drop your file here, or click to browse files from your computer.
                </p>
              </div>

              <label className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-indigo-600/30 transition-all">
                <span>Select Statement File</span>
                <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.csv,.xlsx" />
              </label>
            </div>
          )}

          {step === "PREVIEW" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-between text-xs">
                <span className="font-bold">File Parsed Successfully: {uploadedFileName || "statement.csv"}</span>
                <span>22 Valid Rows • 1 Issue Flagged</span>
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Parsed Rows Preview</h4>

              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Symbol</th>
                      <th className="p-3">Action</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-3 font-mono">2026-05-10</td>
                      <td className="p-3 font-bold text-slate-100">RELIANCE</td>
                      <td className="p-3 text-emerald-400 font-bold">BUY</td>
                      <td className="p-3 text-right">10</td>
                      <td className="p-3 text-right font-mono">₹2,890.00</td>
                      <td className="p-3 text-right font-mono font-bold">₹28,900.00</td>
                      <td className="p-3 text-center text-emerald-400 font-bold">Valid</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-3 font-mono">2026-06-12</td>
                      <td className="p-3 font-bold text-slate-100">TCS</td>
                      <td className="p-3 text-emerald-400 font-bold">BUY</td>
                      <td className="p-3 text-right">5</td>
                      <td className="p-3 text-right font-mono">₹3,850.00</td>
                      <td className="p-3 text-right font-mono font-bold">₹19,250.00</td>
                      <td className="p-3 text-center text-emerald-400 font-bold">Valid</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={() => setStep("SELECT_SOURCE")}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
          >
            Reset Step
          </button>
          {step === "PREVIEW" && (
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" /> Commit Import to Workspace
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
