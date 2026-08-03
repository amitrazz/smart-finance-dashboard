import React from "react";
import { Mail, X, Lock } from "lucide-react";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * There is no `/auth/forgot-password` (or equivalent) endpoint in endpoints.ts.
 * Per the no-mock-data requirement, this surfaces that gap instead of faking a
 * "reset email sent" success that never actually reaches the user's inbox.
 */
export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 lg:p-8 space-y-6 relative overflow-hidden">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Reset Password</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Self-service password reset isn't available yet — there's no backend endpoint for it. We're showing this
            instead of a working reset form so nothing here implies an email was sent.
          </p>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Need access to your account? Contact support directly and we'll help you regain access.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
