import React from "react";

import { motion } from "framer-motion";
import { useCreditCards } from "../../credit-cards/hooks/useCreditCardQueries";
import { CreditCardWidget } from "../components/CreditCardWidget";
import { CreditCard } from "lucide-react";

export const CreditCardsSubView: React.FC = () => {
  const { data: cards = [], isLoading } = useCreditCards();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
        {Array(3).fill(null).map((_, i) => <div key={i} className="h-72 bg-slate-900/60 rounded-3xl border border-slate-800" />)}
      </div>
    );
  }

  const totalOutstanding = cards.reduce((s, c) => {
    const v = typeof c.currentOutstanding === "object" ? parseFloat(c.currentOutstanding?.amount || "0") : parseFloat(c.currentOutstanding?.toString() || "0");
    return s + v;
  }, 0);
  const totalLimit = cards.reduce((s, c) => {
    const v = typeof c.creditLimit === "object" ? parseFloat(c.creditLimit?.amount || "0") : parseFloat(c.creditLimit?.toString() || "0");
    return s + v;
  }, 0);
  const avgUtil = totalLimit > 0 ? Math.round((totalOutstanding / totalLimit) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Strip */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-center">
        <div>
          <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Cards</p>
          <p className="text-xl font-extrabold text-slate-100">{cards.length}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Total Outstanding</p>
          <p className="text-xl font-extrabold text-rose-400">₹{(totalOutstanding / 1000).toFixed(0)}K</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Avg Utilization</p>
          <p className={`text-xl font-extrabold ${avgUtil > 50 ? "text-rose-400" : "text-emerald-400"}`}>{avgUtil}%</p>
        </div>
      </div>

      {cards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((card, i) => (
            <motion.div key={card.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <CreditCardWidget card={card} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-300">No Credit Cards Connected</h3>
          <p className="text-sm text-slate-400">Add credit cards to track outstanding dues, utilization, and payment schedules.</p>
        </div>
      )}
    </div>
  );
};
