import React, { useState } from "react";
import { ImportWizardModal } from "../components/ImportWizardModal";
import { UploadCloud } from "lucide-react";

export const ImportWizardView: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="space-y-6">
      <div className="p-8 rounded-3xl bg-slate-900/70 border border-slate-800 text-center space-y-4 backdrop-blur-xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">Multi-Step Statement Import Wizard</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Import CAMS/KFintech CAS PDFs, Zerodha/Groww CSVs, INDmoney exports, or custom spreadsheets to automatically update holdings & tax lots.
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
        >
          <UploadCloud className="w-4 h-4" /> Launch Import Wizard Modal
        </button>
      </div>

      <ImportWizardModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
};
