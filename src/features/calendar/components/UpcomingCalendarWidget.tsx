import React from "react";
import { useUpcomingEvents } from "../hooks/useFinancialCalendar";
import { CalendarEventCard } from "./CalendarEventCard";
import { useUIStore } from "../../../store/useUIStore";
import { Calendar as CalendarIcon, ArrowRight, ShieldCheck } from "lucide-react";

export const UpcomingCalendarWidget: React.FC = () => {
  const { data: upcomingEvents = [], isLoading } = useUpcomingEvents(4);
  const { setActiveTab } = useUIStore();

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-md">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100 font-sans tracking-tight">Upcoming Dues & Timeline</h3>
            <p className="text-xs text-slate-400 mt-0.5">Bills, EMIs, SIPs & Salary expectations</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("notifications")}
          type="button"
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700/60 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span>View Calendar</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
        </button>
      </div>

      {/* Events List Stack */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-14 bg-slate-950/80 rounded-2xl border border-slate-800" />
          <div className="h-14 bg-slate-950/80 rounded-2xl border border-slate-800" />
          <div className="h-14 bg-slate-950/80 rounded-2xl border border-slate-800" />
        </div>
      ) : upcomingEvents.length === 0 ? (
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-2">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="text-xs text-slate-300 font-bold">No Dues Pending</p>
          <p className="text-[11px] text-slate-400">You're all caught up for the next few days.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingEvents.map((evt) => (
            <CalendarEventCard
              key={evt.id}
              event={evt}
              onSelectEvent={() => setActiveTab("notifications")}
              compact={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};
