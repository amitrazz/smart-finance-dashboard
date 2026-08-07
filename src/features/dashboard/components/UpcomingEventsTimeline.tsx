import React from "react";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, ShieldCheck, CheckCircle2, Clock, Zap, Loader2 } from "lucide-react";
import { useUpcomingEvents, useMarkEventAction } from "../../calendar/hooks/useFinancialCalendar";
import { formatCurrency } from "../../../utils/formatters";
import { useUIStore } from "../../../store/useUIStore";
import { FinancialCalendarEvent } from "../../calendar/types";

export const UpcomingEventsTimeline: React.FC = () => {
  const { data: upcomingEvents = [], isLoading } = useUpcomingEvents(4);
  const markActionMutation = useMarkEventAction();
  const { setActiveTab } = useUIStore();

  const handleAction = (id: string, action: "PAY" | "DISMISS" | "COMPLETE" | "SNOOZE" | "ARCHIVE") => {
    markActionMutation.mutate({ id, action });
  };

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6 h-full flex flex-col justify-between w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-md">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100 font-sans tracking-tight">
              Upcoming Dues & Timeline
            </h3>
            <p className="text-xs text-slate-400">Scheduled EMIs, credit cards & subscriptions</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("notifications")}
          type="button"
          className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>Full Calendar</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
        </button>
      </div>

      {/* Timeline Items List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse flex-1">
          <div className="h-16 bg-slate-950 rounded-2xl border border-slate-800" />
          <div className="h-16 bg-slate-950 rounded-2xl border border-slate-800" />
        </div>
      ) : upcomingEvents.length === 0 ? (
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-2 flex-1 flex flex-col justify-center items-center">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="text-xs text-slate-300 font-bold">No Dues Pending</p>
          <p className="text-[11px] text-slate-400">All recurring commitments are up to date.</p>
        </div>
      ) : (
        <div className="space-y-3 flex-1 flex flex-col justify-center">
          {upcomingEvents.map((evt: FinancialCalendarEvent) => (
            <motion.div
              key={evt.id}
              whileHover={{ x: 2 }}
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
            >
              {/* Event Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-100 truncate">{evt.title}</span>
                    <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                      {evt.date}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{evt.notes || evt.description || "Scheduled Outflow"}</p>
                </div>
              </div>

              {/* Amount & Actions Row */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-900 shrink-0">
                {evt.amount && (
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-slate-100 whitespace-nowrap">
                      {formatCurrency(evt.amount)}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleAction(evt.id, "PAY")}
                    disabled={markActionMutation.isPending}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {markActionMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Pay</span>
                  </button>

                  <button
                    onClick={() => handleAction(evt.id, "SNOOZE")}
                    disabled={markActionMutation.isPending}
                    aria-label="Snooze"
                    className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Snooze"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
