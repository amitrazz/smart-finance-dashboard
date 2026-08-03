import React, { useState } from "react";
import { FinancialCalendarEvent } from "../../types";
import { CalendarEventCard } from "../CalendarEventCard";
import { formatCurrency } from "../../../../utils/formatters";
import { Clock, Calendar as CalendarIcon } from "lucide-react";

interface DayScheduleViewProps {
  events: FinancialCalendarEvent[];
  onSelectEvent: (event: FinancialCalendarEvent) => void;
  onAction: (id: string, action: "PAY" | "DISMISS" | "COMPLETE" | "SNOOZE" | "ARCHIVE") => void;
}

export const DayScheduleView: React.FC<DayScheduleViewProps> = ({
  events,
  onSelectEvent,
  onAction,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);

  const dayEvents = events.filter((e) => e.date === selectedDate || e.status === "DUE_TODAY");

  let dayIncoming = 0;
  let dayOutgoing = 0;

  dayEvents.forEach((evt) => {
    const val = parseFloat(evt.amount?.amount || "0");
    if (evt.direction === "INCOMING") {
      dayIncoming += val;
    } else {
      dayOutgoing += val;
    }
  });

  return (
    <div className="space-y-6">
      {/* Day Schedule Header Bar */}
      <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-100 font-sans">Detailed Schedule for {selectedDate}</h3>
              <p className="text-xs text-slate-400">Detailed breakdown of commitments & expected funds</p>
            </div>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
          />
        </div>

        {/* Day Cash Summary Bar */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400">Day Outgoing</span>
            <span className="text-sm font-extrabold text-rose-400">
              {formatCurrency({ amount: dayOutgoing.toFixed(2), currency: "INR" })}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400">Day Incoming</span>
            <span className="text-sm font-extrabold text-emerald-400">
              {formatCurrency({ amount: dayIncoming.toFixed(2), currency: "INR" })}
            </span>
          </div>
        </div>
      </div>

      {/* Events List */}
      {dayEvents.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-950/80 border border-slate-800 text-center space-y-3">
          <CalendarIcon className="w-10 h-10 text-slate-500 mx-auto" />
          <h4 className="text-base font-bold text-slate-200">No Events Scheduled</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are no financial events scheduled on {selectedDate}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dayEvents.map((evt) => (
            <CalendarEventCard
              key={evt.id}
              event={evt}
              onSelectEvent={onSelectEvent}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </div>
  );
};
