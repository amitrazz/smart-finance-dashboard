import React from "react";
import { useCalendar } from "../../hooks/useFinanceQueries";
import { formatCurrency } from "../../utils/formatters";
import { CalendarItem } from "../../types";
import { Calendar as CalendarIcon, AlertTriangle, RefreshCw } from "lucide-react";

export const NotificationsView: React.FC = () => {
  const { data: calendarResponse = [], isLoading, isError, error, refetch } = useCalendar();
  const calendarItems: CalendarItem[] = Array.isArray(calendarResponse)
    ? calendarResponse
    : (calendarResponse as unknown as { data: CalendarItem[] })?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="h-44 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to Load Calendar Alerts</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not retrieve upcoming financial calendar events."}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Unified Financial Calendar & Notification Center</h2>
        <p className="text-xs text-slate-400">
          Upcoming bill due dates, Loan EMIs, Mutual Fund SIP installments, and FD maturity alerts
        </p>
      </div>

      {/* Calendar Timeline */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-slate-100">Upcoming Financial Events (Next 30 Days)</h3>
        {calendarItems.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
            <CalendarIcon className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">No Upcoming Events</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              There are no bills, EMIs, or SIPs due in the next 30 days.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {calendarItems.map((item: CalendarItem) => (
              <div key={item.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      item.type === "EMI"
                        ? "bg-rose-500/10 text-rose-400"
                        : item.type === "SIP"
                        ? "bg-indigo-500/10 text-indigo-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">{item.title}</h4>
                    <p className="text-xs text-slate-400">Due Date: {item.date} • Type: {item.type}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-extrabold text-slate-100 text-sm">{formatCurrency(item.amount)}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
