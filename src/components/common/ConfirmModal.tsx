import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, Trash2, X, RefreshCw } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <Trash2 className="w-6 h-6 text-rose-400" />,
          iconBg: "bg-rose-500/10 border-rose-500/20",
          buttonBg: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20",
        };
      case "info":
        return {
          icon: <Info className="w-6 h-6 text-indigo-400" />,
          iconBg: "bg-indigo-500/10 border-indigo-500/20",
          buttonBg: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20",
        };
      case "warning":
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
          iconBg: "bg-amber-500/10 border-amber-500/20",
          buttonBg: "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20",
        };
    }
  };

  const style = getVariantStyles();

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden"
        >
          <button
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-2xl border ${style.iconBg} shrink-0`}>
              {style.icon}
            </div>

            <div className="space-y-1.5 pt-1 pr-6">
              <h3 id="confirm-modal-title" className="font-bold text-lg text-slate-100 leading-snug">
                {title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all disabled:opacity-50 ${style.buttonBg}`}
            >
              {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
