import React from "react";
import { ShieldCheck, Lock, EyeOff } from "lucide-react";

export const SecurityTrustBadges: React.FC = () => {
  return (
    <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
      <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
        Enterprise Security Guarantees
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-slate-600 dark:text-slate-400">
        <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Bank-level encryption</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
          <Lock className="w-4 h-4 text-indigo-400" />
          <span>Secure authentication</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
          <EyeOff className="w-4 h-4 text-teal-400" />
          <span>Private financial data</span>
        </div>
      </div>
    </div>
  );
};
