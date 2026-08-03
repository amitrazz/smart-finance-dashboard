import React from "react";
import { FinancialCalendarEvent } from "../../types";
import { CalendarEventCard } from "../CalendarEventCard";
import { CheckCircle2 } from "lucide-react";

interface UpcomingTimelineViewProps {
  events: FinancialCalendarEvent[];
  onSelectEvent: (event: FinancialCalendarEvent) => void;
  onAction: (id: string, action: "PAY" | "DISMISS" | "COMPLETE" | "SNOOZE" | "ARCHIVE") => void;
}

export const UpcomingTimelineView: React.FC<UpcomingTimelineViewProps> = ({
  events,
  onSelectEvent,
  onAction,
}) => {
  if (!events || events.length === 0) {
    return (
      <div className="p-12 rounded-3xl bg-slate-950/80 border border-slate-800 text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-lg">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-100 font-sans">You're all caught up!</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Nothing due today or in your active filter. Your next financial event is scheduled for later this month.
          </p>
        </div>
      </div>
    );
  }

  // Group events by human-friendly timeframe
  const todayEvents: FinancialCalendarEvent[] = [];
  const tomorrowEvents: FinancialCalendarEvent[] = [];
  const thisWeekEvents: FinancialCalendarEvent[] = [];
  const nextWeekEvents: FinancialCalendarEvent[] = [];
  const laterEvents: FinancialCalendarEvent[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  events.forEach((evt) => {
    const evtDate = new Date(evt.date);
    evtDate.setHours(0, 0, 0, 0);
    const diffTime = evtDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 0) {
      todayEvents.push(evt);
    } else if (diffDays === 1) {
      tomorrowEvents.push(evt);
    } else if (diffDays > 1 && diffDays <= 7) {
      thisWeekEvents.push(evt);
    } else if (diffDays > 7 && diffDays <= 14) {
      nextWeekEvents.push(evt);
    } else {
      laterEvents.push(evt);
    }
  });

  const renderGroupSection = (title: string, colorTag: string, groupEvents: FinancialCalendarEvent[]) => {
    if (groupEvents.length === 0) return null;

    return (
      <div className="space-y-4">
        {/* Section Header Line */}
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full border text-xs font-extrabold uppercase tracking-widest ${colorTag}`}>
            {title}
          </span>
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-xs font-semibold text-slate-500">{groupEvents.length} {groupEvents.length === 1 ? "Event" : "Events"}</span>
        </div>

        {/* Event Cards Stack */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupEvents.map((evt) => (
            <CalendarEventCard
              key={evt.id}
              event={evt}
              onSelectEvent={onSelectEvent}
              onAction={onAction}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {renderGroupSection("TODAY", "bg-rose-500/10 text-rose-400 border-rose-500/30", todayEvents)}
      {renderGroupSection("Tomorrow", "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", tomorrowEvents)}
      {renderGroupSection("This Week", "bg-indigo-500/10 text-indigo-400 border-indigo-500/30", thisWeekEvents)}
      {renderGroupSection("Next Week", "bg-purple-500/10 text-purple-400 border-purple-500/30", nextWeekEvents)}
      {renderGroupSection("Later This Month", "bg-slate-800 text-slate-300 border-slate-700", laterEvents)}
    </div>
  );
};
