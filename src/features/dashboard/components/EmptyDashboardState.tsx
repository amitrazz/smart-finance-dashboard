import React from "react";
import { PlusCircle, UploadCloud, Wallet, Target, Sparkles } from "lucide-react";
import { useUIStore } from "../../../store/useUIStore";

export const EmptyDashboardState: React.FC = () => {
  const { setAddAccountOpen, setImportModalOpen, setAddTransactionOpen, setActiveTab } = useUIStore();

  return (
    <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl text-center space-y-8 max-w-4xl mx-auto my-6">
      <div className="space-y-2">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto shadow-xl">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-white font-sans tracking-tight">
          Welcome to Personal Finance OS
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
          Your financial command center is ready. Connect your accounts or import your statement to populate real-time net worth, cash flow, and AI insights.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        {/* Card 1: Add Account */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between hover:border-indigo-500/40 transition-all">
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
              <Wallet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-100">Add First Account</h4>
            <p className="text-xs text-slate-400">Link your bank, credit card, or investment account.</p>
          </div>
          <button
            onClick={() => setAddAccountOpen(true)}
            className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Connect Account
          </button>
        </div>

        {/* Card 2: Import Statement */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between hover:border-indigo-500/40 transition-all">
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-100">Import Statement</h4>
            <p className="text-xs text-slate-400">Upload bank CSV or PDF statements for auto parsing.</p>
          </div>
          <button
            onClick={() => setImportModalOpen(true)}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
          >
            Import CSV/PDF
          </button>
        </div>

        {/* Card 3: Record Transaction */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between hover:border-indigo-500/40 transition-all">
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 w-fit">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-100">Log Transaction</h4>
            <p className="text-xs text-slate-400">Manually record a recent income or expense.</p>
          </div>
          <button
            onClick={() => setAddTransactionOpen(true)}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
          >
            Add Transaction
          </button>
        </div>

        {/* Card 4: Create Budget */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between hover:border-indigo-500/40 transition-all">
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 w-fit">
              <Target className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-100">Create Budget</h4>
            <p className="text-xs text-slate-400">Set spending limits for dining, shopping & bills.</p>
          </div>
          <button
            onClick={() => setActiveTab("planning", "budgets")}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
          >
            Setup Budget
          </button>
        </div>
      </div>
    </div>
  );
};
