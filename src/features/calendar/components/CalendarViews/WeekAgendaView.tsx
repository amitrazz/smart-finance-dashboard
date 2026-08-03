import React from "react";
import { FinancialCalendarEvent } from "../../types";
import { CalendarEventCard } from "../CalendarEventCard";
import { Calendar as CalendarIcon } from "lucide-react";

interface WeekAgendaViewProps {
  events: FinancialCalendarEvent[];
  onSelectEvent: (event: FinancialCalendarEvent) => void;
  onAction: (id: string, action: "PAY" | "DISMISS" | "COMPLETE" | "SNOOZE" | "ARCHIVE") => void;
}

export const WeekAgendaView: React.FC<WeekAgendaViewProps> = ({
  events,
  onSelectEvent,
  onAction,
}) => {
  // Sort events chronologically by date
  const sorted = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="p-12 rounded-3xl bg-slate-950/80 border border-slate-800 text-center space-y-3">
        <CalendarIcon className="w-10 h-10 text-slate-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-200">No WeeklyDues</h3>
        <p className="text-xs text-slate-400">There are no financial events scheduled for this week agenda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Weekly Financial Agenda</h3>
        <span className="text-xs text-slate-400">{sorted.length} Total Events</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((evt) => (
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
