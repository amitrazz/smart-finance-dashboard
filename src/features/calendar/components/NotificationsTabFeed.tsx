import React from "react";
import { NotificationCenterSubTab } from "../types";
import { SmartActionCenter } from "../../actions/SmartActionCenter";
import { Bell, FileSpreadsheet, CheckCircle2 } from "lucide-react";

interface NotificationsTabFeedProps {
  activeSubTab: NotificationCenterSubTab;
}

export const NotificationsTabFeed: React.FC<NotificationsTabFeedProps> = ({ activeSubTab }) => {
  if (activeSubTab === "SMART_ACTIONS") {
    return <SmartActionCenter />;
  }

  if (activeSubTab === "SYSTEM_ALERTS") {
    return (
      <div className="space-y-4">
        <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">System & Security Notifications</h3>
              <p className="text-xs text-slate-400">Account login alerts, password changes & system maintenance</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-200">Successful Sign In</h4>
                <p className="text-xs text-slate-400">New login detected from macOS (Chrome) • Today at 22:30</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
              <Bell className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-200">Weekly Backup Completed</h4>
                <p className="text-xs text-slate-400">Encrypted financial vault snapshot saved successfully.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeSubTab === "ACTIVITY") {
    return (
      <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">Import & Sync Activity Log</h3>
            <p className="text-xs text-slate-400">Bank statement parsing, CSV uploads & transaction sync history</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <div>
              <h4 className="text-xs font-bold text-slate-200">HDFC_July2026_Statement.csv</h4>
              <p className="text-xs text-slate-400">42 transactions committed • 100% confidence match</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Committed
          </span>
        </div>
      </div>
    );
  }

  return null;
};
