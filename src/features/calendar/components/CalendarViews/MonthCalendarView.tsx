import React, { useState } from "react";
import { FinancialCalendarEvent } from "../../types";
import { CalendarEventCard, getCategoryStyles } from "../CalendarEventCard";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface MonthCalendarViewProps {
  events: FinancialCalendarEvent[];
  onSelectEvent: (event: FinancialCalendarEvent) => void;
  onAction: (id: string, action: "PAY" | "DISMISS" | "COMPLETE" | "SNOOZE" | "ARCHIVE") => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const MonthCalendarView: React.FC<MonthCalendarViewProps> = ({
  events,
  onSelectEvent,
  onAction,
}) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed (7 = August)

  const monthName = currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  // Map events by date (YYYY-MM-DD)
  const eventsByDateMap = new Map<string, FinancialCalendarEvent[]>();
  events.forEach((evt) => {
    const key = evt.date;
    if (!eventsByDateMap.has(key)) {
      eventsByDateMap.set(key, []);
    }
    eventsByDateMap.get(key)!.push(evt);
  });

  const selectedDayEvents = selectedDay ? eventsByDateMap.get(selectedDay) || [] : [];

  return (
    <div className="space-y-6">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-extrabold text-white font-sans">{monthName}</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            type="button"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const now = new Date();
              setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelectedDay(null);
            }}
            type="button"
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            type="button"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7-Column Calendar Grid */}
      <div className="rounded-3xl bg-slate-950/80 border border-slate-800/90 overflow-hidden shadow-2xl">
        {/* Weekday Labels */}
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/60 text-center py-2.5 text-xs font-bold text-slate-400">
          {WEEKDAYS.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 auto-rows-fr gap-px bg-slate-800/40">
          {/* Empty cells before start of month */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-slate-950/40 min-h-[90px] p-2" />
          ))}

          {/* Actual days of month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const dayEvts = eventsByDateMap.get(dateStr) || [];
            const isSelected = selectedDay === dateStr;
            const isTodayCell =
              dayNum === today.getDate() && month === today.getMonth() && year === today.getFullYear();

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDay(dateStr)}
                className={`bg-slate-950 min-h-[100px] p-2 flex flex-col justify-between transition-all cursor-pointer group hover:bg-slate-900/80 ${
                  isSelected ? "ring-2 ring-indigo-500 z-10 bg-slate-900" : ""
                }`}
              >
                {/* Date Number Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                      isTodayCell
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-slate-300 group-hover:text-white"
                    }`}
                  >
                    {dayNum}
                  </span>

                  {dayEvts.length > 0 && (
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                      {dayEvts.length}
                    </span>
                  )}
                </div>

                {/* Event Indicator Badges */}
                <div className="space-y-1 mt-1 overflow-hidden">
                  {dayEvts.slice(0, 2).map((evt) => {
                    const st = getCategoryStyles(evt.category);
                    return (
                      <div
                        key={evt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(evt);
                        }}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded truncate border ${st.badge} hover:brightness-125 transition-all`}
                        title={evt.title}
                      >
                        {evt.title}
                      </div>
                    );
                  })}
                  {dayEvts.length > 2 && (
                    <div className="text-[9px] text-slate-500 font-bold pl-1">
                      +{dayEvts.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda Drawer */}
      {selectedDay && (
        <div className="p-6 rounded-3xl bg-slate-950/90 border border-indigo-500/30 space-y-4 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Events for {selectedDay}
            </h4>
            <span className="text-xs text-slate-400">{selectedDayEvents.length} Events</span>
          </div>

          {selectedDayEvents.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No financial events scheduled for this day.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDayEvents.map((evt) => (
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
      )}
    </div>
  );
};
