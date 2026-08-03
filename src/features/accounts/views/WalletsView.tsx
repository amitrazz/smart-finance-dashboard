import React from "react";

import { motion } from "framer-motion";
import { useWallets } from "../../../hooks/useFinanceQueries";
import { formatCurrency } from "../../../utils/formatters";
import { StatusBadge } from "../components/StatusBadge";
import { Wallet } from "lucide-react";

const PROVIDER_COLORS: Record<string, string> = {
  Paytm: "from-indigo-600 to-blue-600",
  PhonePe: "from-purple-600 to-violet-600",
  "Google Pay": "from-teal-600 to-cyan-600",
  "Amazon Pay": "from-amber-600 to-orange-600",
  PayPal: "from-blue-600 to-sky-600",
  Other: "from-slate-600 to-slate-700",
};

export const WalletsView: React.FC = () => {
  const { data: wallets = [], isLoading } = useWallets();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
        {Array(3).fill(null).map((_, i) => <div key={i} className="h-64 bg-slate-900/60 rounded-3xl border border-slate-800" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {wallets.length > 0 ? wallets.map((wallet, i) => {
          const balance = parseFloat(wallet.currentBalance?.amount || "0");
          const provider = wallet.provider || "Other";
          const gradient = PROVIDER_COLORS[provider] || PROVIDER_COLORS.Other;

          return (
            <motion.div key={wallet.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <div className="group bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 backdrop-blur-xl transition-all duration-300 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${gradient} flex items-center justify-center shadow-lg`}>
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-base">{wallet.name}</h4>
                      <p className="text-xs text-slate-400 font-medium">{provider} Wallet</p>
                    </div>
                  </div>
                  <StatusBadge status={wallet.status || "ACTIVE"} size="sm" />
                </div>

                {/* Balance */}
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Current Balance</p>
                  <p className="text-2xl font-extrabold text-slate-100">{formatCurrency(balance, wallet.currency || "INR")}</p>
                </div>
              </div>
            </motion.div>
          );
        }) : (
          <div className="col-span-full text-center py-20 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto">
              <Wallet className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-300">No Wallets Added</h3>
            <p className="text-sm text-slate-400">Add Paytm, PhonePe, Google Pay, or other digital wallets to track your spending.</p>
          </div>
        )}
      </div>
    </div>
  );
};
