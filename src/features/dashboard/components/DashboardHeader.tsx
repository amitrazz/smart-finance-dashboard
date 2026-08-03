import React from "react";
import { Bell } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { useUIStore } from "../../../store/useUIStore";

export const DashboardHeader: React.FC = () => {
  const { user } = useAuthStore();
  const { setActiveTab } = useUIStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const rawName = user?.name || user?.email?.split("@")[0] || "Amit";
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-sans tracking-tight">
            {getGreeting()}, {displayName} 👋
          </h1>
          <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-widest">
            Live OS
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Here's your real-time financial snapshot and daily command center.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab("notifications")}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Bell className="w-4 h-4 text-indigo-400" />
          <span>Calendar & Alerts</span>
        </button>
      </div>
    </div>
  );
};
