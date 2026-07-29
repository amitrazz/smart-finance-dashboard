import React from "react";
import { useUIStore, NavTab } from "../../store/useUIStore";
import { useAuthStore } from "../../store/useAuthStore";
import {
  LayoutDashboard,
  Landmark,
  ArrowUpRight,
  UploadCloud,
  PiggyBank,
  PieChart,
  ShieldAlert,
  Target,
  BarChart3,
  Lightbulb,
  Bell,
  Settings,
  Sparkles,
  CheckCircle2,
  LogOut,
} from "lucide-react";

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useUIStore();
  const { user, logout } = useAuthStore();

  const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "onboarding", label: "Setup Checklist", icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />, badge: "2/4" },
    { id: "accounts", label: "Accounts & Cash", icon: <Landmark className="w-5 h-5" /> },
    { id: "transactions", label: "Transactions", icon: <ArrowUpRight className="w-5 h-5" /> },
    { id: "imports", label: "File Import Wizard", icon: <UploadCloud className="w-5 h-5" />, badge: "CSV/PDF" },
    { id: "budgets", label: "Budgets & Spend", icon: <PiggyBank className="w-5 h-5" /> },
    { id: "investments", label: "Investments", icon: <PieChart className="w-5 h-5" /> },
    { id: "loans", label: "Loans & Debt", icon: <ShieldAlert className="w-5 h-5" /> },
    { id: "goals", label: "Financial Goals", icon: <Target className="w-5 h-5" /> },
    { id: "analytics", label: "Analytics & Trends", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "insights", label: "Insights & Health", icon: <Lightbulb className="w-5 h-5" />, badge: "AI" },
    { id: "notifications", label: "Calendar & Alerts", icon: <Bell className="w-5 h-5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 dark:bg-slate-900/90 border-r border-slate-800 flex flex-col h-screen sticky top-0 backdrop-blur-xl z-30 select-none">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Sparkles className="w-6 h-6 text-slate-950 font-bold" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-slate-100 tracking-tight leading-tight">Monarch OS</h1>
          <p className="text-xs text-emerald-400 font-medium">Personal Finance Platform</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-950/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? "text-emerald-400" : "text-slate-400"}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout Button */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-200 truncate">{user?.name || user?.email?.split("@")[0] || "User"}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email || "Authenticated User"}</p>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
