import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { PlanGenerateForm } from "./PlanGenerateForm";
import { useGenerateFinancePlan } from "../../hooks/useFinancePlanQueries";
import type { GenerateFinancePlanInput } from "../../../../types";

interface PlanGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (planId: string) => void;
}

export const PlanGenerateModal: React.FC<PlanGenerateModalProps> = ({ isOpen, onClose, onGenerated }) => {
  const mutation = useGenerateFinancePlan();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !mutation.isPending) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mutation.isPending]);

  if (!isOpen) return null;

  const handleSubmit = (input: GenerateFinancePlanInput) => {
    mutation.mutate(input, {
      onSuccess: (plan) => {
        onGenerated(plan.id);
        onClose();
      },
    });
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-plan-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h3 id="generate-plan-title" className="text-base font-bold text-slate-100">
                  Generate a plan
                </h3>
                <p className="text-[11px] text-slate-500">This only proposes a plan — nothing changes until you accept it.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              aria-label="Close dialog"
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <PlanGenerateForm isSubmitting={mutation.isPending} onSubmit={handleSubmit} onCancel={onClose} />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PlanGenerateModal;
