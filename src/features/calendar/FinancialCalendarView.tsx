import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Search,
  Zap,
  Bell,
  FileText,
  RotateCcw,
} from "lucide-react";
import { useUIStore } from "../../store/useUIStore";
import {
  CalendarViewMode,
  CalendarFilterCategory,
  NotificationCenterSubTab,
  FinancialCalendarEvent,
} from "./types";
import { useFinancialCalendar, useMarkEventAction } from "./hooks/useFinancialCalendar";
import { CalendarSmartInsights } from "./components/CalendarSmartInsights";
import { UpcomingTimelineView } from "./components/CalendarViews/UpcomingTimelineView";
import { MonthCalendarView } from "./components/CalendarViews/MonthCalendarView";
import { WeekAgendaView } from "./components/CalendarViews/WeekAgendaView";
import { DayScheduleView } from "./components/CalendarViews/DayScheduleView";
import { CalendarEventDetailDrawer } from "./components/CalendarEventDetailDrawer";
import { NotificationsTabFeed } from "./components/NotificationsTabFeed";

const FILTER_PILLS: { key: CalendarFilterCategory; label: string }[] = [
  { key: "ALL", label: "All Events" },
  { key: "CREDIT_CARDS", label: "💳 Credit Cards" },
  { key: "EMI", label: "🏦 Loan EMIs" },
  { key: "INVESTMENTS", label: "📈 SIP Installments" },
  { key: "SUBSCRIPTION", label: "🔄 Subscriptions" },
  { key: "GOALS", label: "🎯 Goal Targets" },
  { key: "UNREAD", label: "Due Today" },
];

export const FinancialCalendarView: React.FC = () => {
  const { activeSubTab: globalSubTab } = useUIStore();
  const [activeSubTab, setActiveSubTab] = useState<NotificationCenterSubTab>("CALENDAR");
  const [viewMode, setViewMode] = useState<CalendarViewMode>("UPCOMING");
  const [activeFilter, setActiveFilter] = useState<CalendarFilterCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<FinancialCalendarEvent | null>(null);

  // Sync global deep route sub-item into category filter
  useEffect(() => {
    if (globalSubTab) {
      switch (globalSubTab) {
        case "cc-due-dates":
          setActiveFilter("CREDIT_CARDS");
          break;
        case "emis-due":
          setActiveFilter("EMI");
          break;
        case "sips":
          setActiveFilter("INVESTMENTS");
          break;
        case "renewals":
          setActiveFilter("SUBSCRIPTION");
          break;
        case "upcoming-bills":
        default:
          setActiveFilter("ALL");
          break;
      }
    }
  }, [globalSubTab]);

  const { data: events = [], isLoading, refetch } = useFinancialCalendar({
    filter: activeFilter,
    search: searchQuery,
  });

  const markActionMutation = useMarkEventAction();

  const handleAction = (id: string, action: "PAY" | "DISMISS" | "COMPLETE" | "SNOOZE" | "ARCHIVE") => {
    markActionMutation.mutate({ id, action });
  };

  return (
    <div className="space-y-8 w-full pb-12">
      {/* Top Header & Section Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-slate-100 font-sans tracking-tight">
              Unified Financial Calendar & Notification Center
            </h2>
            <span className="text-[10px] font-extrabold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 uppercase tracking-widest">
              Live Timeline
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Personal financial timeline tracking credit card dues, loan EMIs, SIP installments, subscriptions & goal target dates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search events, loans, cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-44 sm:w-56 transition-all"
            />
          </div>

          <button
            onClick={() => refetch()}
            type="button"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
            title="Refresh Timeline"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Sub-Tab Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab("CALENDAR")}
            type="button"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === "CALENDAR"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-1 ring-indigo-400/40"
                : "bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Financial Calendar & Dues</span>
          </button>

          <button
            onClick={() => setActiveSubTab("SMART_ACTIONS")}
            type="button"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === "SMART_ACTIONS"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-1 ring-indigo-400/40"
                : "bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Smart Action Center</span>
          </button>

          <button
            onClick={() => setActiveSubTab("SYSTEM_ALERTS")}
            type="button"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === "SYSTEM_ALERTS"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-1 ring-indigo-400/40"
                : "bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>System Notifications</span>
          </button>

          <button
            onClick={() => setActiveSubTab("ACTIVITY")}
            type="button"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === "ACTIVITY"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-1 ring-indigo-400/40"
                : "bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Activity & Imports</span>
          </button>
        </div>

        {/* View Mode Switcher (Month / Week / Day / Upcoming) */}
        {activeSubTab === "CALENDAR" && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode("UPCOMING")}
              type="button"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "UPCOMING" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setViewMode("MONTH")}
              type="button"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "MONTH" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode("WEEK")}
              type="button"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "WEEK" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode("DAY")}
              type="button"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "DAY" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Day
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeSubTab === "CALENDAR" ? (
        <div className="space-y-6">
          {/* Smart Insights Header Banner */}
          <CalendarSmartInsights />

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {FILTER_PILLS.map((pill) => (
              <button
                key={pill.key}
                onClick={() => setActiveFilter(pill.key)}
                type="button"
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeFilter === pill.key
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-1 ring-indigo-400/40"
                    : "bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Render Calendar View Mode */}
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-28 bg-slate-950/80 rounded-3xl border border-slate-800" />
              <div className="h-28 bg-slate-950/80 rounded-3xl border border-slate-800" />
              <div className="h-28 bg-slate-950/80 rounded-3xl border border-slate-800" />
            </div>
          ) : viewMode === "UPCOMING" ? (
            <UpcomingTimelineView
              events={events}
              onSelectEvent={(evt) => setSelectedEvent(evt)}
              onAction={handleAction}
            />
          ) : viewMode === "MONTH" ? (
            <MonthCalendarView
              events={events}
              onSelectEvent={(evt) => setSelectedEvent(evt)}
              onAction={handleAction}
            />
          ) : viewMode === "WEEK" ? (
            <WeekAgendaView
              events={events}
              onSelectEvent={(evt) => setSelectedEvent(evt)}
              onAction={handleAction}
            />
          ) : (
            <DayScheduleView
              events={events}
              onSelectEvent={(evt) => setSelectedEvent(evt)}
              onAction={handleAction}
            />
          )}
        </div>
      ) : (
        <NotificationsTabFeed activeSubTab={activeSubTab} />
      )}

      {/* Slide-over Event Detail Drawer */}
      <CalendarEventDetailDrawer
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onAction={handleAction}
      />
    </div>
  );
};
