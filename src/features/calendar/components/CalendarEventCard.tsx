import React from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";
import { FinancialCalendarEvent } from "../types";
import { formatCurrency } from "../../../utils/formatters";
import { getCategoryStyles, getSmartCountdown } from "./CalendarHelpers";

interface CalendarEventCardProps {
  event: FinancialCalendarEvent;
  onSelectEvent?: (event: FinancialCalendarEvent) => void;
  onAction?: (id: string, action: "PAY" | "DISMISS" | "COMPLETE" | "SNOOZE" | "ARCHIVE") => void;
  compact?: boolean;
}

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({
  event,
  onSelectEvent,
  onAction,
  compact = false,
}) => {
  const styles = getCategoryStyles(event.category);
  const countdown = getSmartCountdown(event.date);
  const isPaid = event.status === "PAID" || event.status === "COMPLETED";

  if (compact) {
    return (
      <div
        onClick={() => onSelectEvent && onSelectEvent(event)}
        className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700 transition-all flex items-center justify-between group cursor-pointer shadow-md"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2.5 rounded-xl ${styles.bg} ${styles.text} border ${styles.border} shrink-0`}>
            {styles.icon}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-100 truncate group-hover:text-indigo-300 transition-colors">
              {event.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
              <span className={`font-semibold ${event.status === "DUE_TODAY" ? "text-rose-400 font-bold" : ""}`}>
                {countdown}
              </span>
              {event.accountName && <span>• {event.accountName}</span>}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0 pl-3">
          {event.amount && (
            <div className={`text-xs font-extrabold ${event.direction === "INCOMING" ? "text-emerald-400" : "text-slate-100"}`}>
              {event.direction === "INCOMING" ? "+" : ""}{formatCurrency(event.amount)}
            </div>
          )}
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${styles.badge} mt-0.5 inline-block`}>
            {styles.label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelectEvent && onSelectEvent(event)}
      className={`p-5 rounded-3xl bg-slate-950/80 hover:bg-slate-900/90 border transition-all duration-200 shadow-xl space-y-4 cursor-pointer group relative overflow-hidden ${
        event.status === "DUE_TODAY"
          ? "border-rose-500/40 ring-1 ring-rose-500/20"
          : isPaid
          ? "border-slate-800 opacity-80"
          : "border-slate-800/90 hover:border-indigo-500/40"
      }`}
    >
      {/* Ambient background glow for high priority */}
      {event.priority === "HIGH" && !isPaid && (
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      )}

      {/* Card Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-3 rounded-2xl ${styles.bg} ${styles.text} border ${styles.border} shadow-lg shrink-0`}>
            {styles.icon}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${styles.badge}`}>
                {styles.label}
              </span>

              {event.priority === "HIGH" && (
                <span className="text-[10px] font-extrabold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                  🔴 HIGH
                </span>
              )}

              {event.isAutoDebit && (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                  Auto Debit
                </span>
              )}
            </div>

            <h4 className="text-base font-bold text-slate-100 font-sans tracking-tight mt-1 group-hover:text-indigo-300 transition-colors line-clamp-1">
              {event.title}
            </h4>
          </div>
        </div>

        {/* Amount & Direct Status */}
        <div className="text-right shrink-0">
          {event.amount && (
            <div
              className={`text-lg font-extrabold font-sans tracking-tight ${
                event.direction === "INCOMING" ? "text-emerald-400" : "text-slate-100"
              }`}
            >
              {event.direction === "INCOMING" ? "+" : ""}{formatCurrency(event.amount)}
            </div>
          )}

          <div className="flex items-center justify-end gap-1 mt-1 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span
              className={
                event.status === "DUE_TODAY"
                  ? "text-rose-400 font-bold"
                  : event.status === "OVERDUE"
                  ? "text-rose-500 font-bold"
                  : isPaid
                  ? "text-emerald-400"
                  : "text-slate-300"
              }
            >
              {isPaid ? "Paid & Settled" : countdown}
            </span>
          </div>
        </div>
      </div>

      {/* Description / Notes if any */}
      {event.description && (
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
          {event.description}
        </p>
      )}

      {/* Footer Info & Quick CTA Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          {event.accountName && (
            <span className="font-semibold text-slate-300 truncate max-w-[200px]">
              {event.institutionName ? `${event.institutionName} • ` : ""}{event.accountName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isPaid && onAction && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(event.id, "PAY");
                }}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{event.direction === "INCOMING" ? "Claim" : "Pay Now"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(event.id, "DISMISS");
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold border border-slate-800 transition-all cursor-pointer"
              >
                Dismiss
              </button>
            </>
          )}

          {isPaid && (
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
              <span>Completed</span>
            </div>
          )}

          <button
            type="button"
            className="p-1.5 rounded-xl text-slate-500 group-hover:text-slate-300 transition-colors"
            aria-label="View event details"
            tabIndex={-1}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
