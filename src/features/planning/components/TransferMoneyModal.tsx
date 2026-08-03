import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightLeft, X } from "lucide-react";

interface TransferMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * There is no real backend transfer endpoint (the existing useCreateTransfer /
 * useAccountTransfers hooks in useFinanceQueries.ts are mocked — they never
 * call `api.*` and return hardcoded fake data). Per the no-mock-data
 * requirement, this modal surfaces the gap instead of wiring up to that mock,
 * which would otherwise silently pretend a transfer happened.
 */
export const TransferMoneyModal: React.FC<TransferMoneyModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      console.warn("[Planning] Transfer Money capability requested but no backend transfer endpoint exists yet.");
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="transfer-money-title">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative"
        >
          <button onClick={onClose} aria-label="Close dialog" className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl border bg-sky-500/10 border-sky-500/20 shrink-0">
              <ArrowRightLeft className="w-6 h-6 text-sky-400" />
            </div>
            <div className="space-y-1.5 pt-1 pr-6">
              <h3 id="transfer-money-title" className="font-bold text-lg text-slate-100">Transfer Money</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This capability isn't available yet — there's no backend endpoint for moving funds between accounts.
                We're showing this instead of a working transfer form so nothing here implies money actually moved.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-slate-800/80">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all">
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TransferMoneyModal;
