import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { FinancialCalendarEvent } from "../types";
import { getCategoryStyles, getSmartCountdown } from "./CalendarEventCard";
import { formatCurrency } from "../../../utils/formatters";
import { useUIStore } from "../../../store/useUIStore";

interface CalendarEventDetailDrawerProps {
  event: FinancialCalendarEvent | null;
  onClose: () => void;
  onAction?: (id: string, action: "PAY" | "DISMISS" | "COMPLETE" | "SNOOZE" | "ARCHIVE") => void;
}

export const CalendarEventDetailDrawer: React.FC<CalendarEventDetailDrawerProps> = ({
  event,
  onClose,
  onAction,
}) => {
  const { setActiveTab } = useUIStore();

  if (!event) return null;

  const styles = getCategoryStyles(event.category);
  const countdown = getSmartCountdown(event.date);
  const isPaid = event.status === "PAID" || event.status === "COMPLETED";

  const handleNavigateModule = () => {
    if (event.linkedEntityType) {
      switch (event.linkedEntityType) {
        case "loan":
          setActiveTab("loans");
          break;
        case "card":
          setActiveTab("accounts");
          break;
        case "subscription":
          setActiveTab("accounts");
          break;
        case "investment":
          setActiveTab("investments");
          break;
        case "goal":
          setActiveTab("planning", "goals");
          break;
        case "account":
          setActiveTab("accounts");
          break;
        default:
          setActiveTab("dashboard");
          break;
      }
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-lg bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col h-full shadow-2xl z-10 overflow-y-auto"
        >
          {/* Top Header Bar */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-20">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${styles.bg} ${styles.text} border ${styles.border}`}>
                {styles.icon}
              </div>
              <div>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${styles.badge}`}>
                  {styles.label}
                </span>
                <h3 className="font-bold text-base text-slate-100 mt-1 line-clamp-1">{event.title}</h3>
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              aria-label="Close event details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="p-6 space-y-6 flex-1">
            {/* Amount Banner */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between shadow-xl">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scheduled Amount</span>
                <div className={`text-2xl font-extrabold font-sans mt-0.5 ${event.direction === "INCOMING" ? "text-emerald-400" : "text-white"}`}>
                  {event.direction === "INCOMING" ? "+" : ""}{event.amount ? formatCurrency(event.amount) : "N/A"}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 block">Due Status</span>
                <span className={`text-xs font-extrabold inline-block mt-0.5 ${event.status === "DUE_TODAY" ? "text-rose-400" : isPaid ? "text-emerald-400" : "text-indigo-400"}`}>
                  {isPaid ? "Paid & Completed" : countdown}
                </span>
              </div>
            </div>

            {/* Description & Explanation */}
            {event.description && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Event Overview</h4>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  {event.description}
                </p>
              </div>
            )}

            {/* Detailed Meta Grid */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-2">
                Event Metadata
              </h4>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-500 block">Due Date</span>
                  <span className="font-semibold text-slate-200">{event.date}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Priority</span>
                  <span className={`font-semibold ${event.priority === "HIGH" ? "text-rose-400" : "text-slate-200"}`}>
                    {event.priority} Priority
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">Account</span>
                  <span className="font-semibold text-slate-200">{event.accountName || "Default Account"}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Institution / Merchant</span>
                  <span className="font-semibold text-slate-200">{event.institutionName || "Internal System"}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Payment Method</span>
                  <span className="font-semibold text-slate-200">
                    {event.isAutoDebit ? "Auto Debit Enabled" : "Manual Payment Required"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">Direction</span>
                  <span className={`font-semibold ${event.direction === "INCOMING" ? "text-emerald-400" : "text-slate-200"}`}>
                    {event.direction || "OUTGOING"}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes / Special Guidance */}
            {event.notes && (
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-1">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                  <HelpCircle className="w-4 h-4" />
                  <span>Important Note / Guidance</span>
                </div>
                <p className="text-xs text-indigo-200 leading-relaxed pt-1">{event.notes}</p>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="p-6 border-t border-slate-800 bg-slate-950/90 space-y-3">
            {!isPaid && onAction && (
              <button
                onClick={() => {
                  onAction(event.id, "PAY");
                  onClose();
                }}
                type="button"
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{event.direction === "INCOMING" ? "Mark Received" : "Pay & Record Transaction"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {event.linkedEntityType && (
              <button
                onClick={handleNavigateModule}
                type="button"
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Go to Related Module ({event.linkedEntityType})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="flex items-center gap-2">
              {!isPaid && onAction && (
                <button
                  onClick={() => {
                    onAction(event.id, "COMPLETE");
                    onClose();
                  }}
                  type="button"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Complete</span>
                </button>
              )}

              {onAction && (
                <button
                  onClick={() => {
                    onAction(event.id, "DISMISS");
                    onClose();
                  }}
                  type="button"
                  className="w-1/2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 font-semibold text-xs border border-slate-800 transition-all cursor-pointer"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
