import React, { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "../../hooks/useFinanceQueries";
import { useActionPreferences, useUpdateActionPreferences, useActionCategories } from "../actions/hooks/useSmartActions";
import { useUIStore } from "../../store/useUIStore";
import { useAuthStore } from "../../store/useAuthStore";
import { ActionPriority } from "../../types";
import { User, Globe, Save, RefreshCw, AlertTriangle, Zap, Bell, Moon, Shield, Download, Database } from "lucide-react";
import { SelfIdentifiersCard } from "./SelfIdentifiersCard";

export const SettingsView: React.FC = () => {
  const { activeSubTab } = useUIStore();
  const { data: settings, isLoading, isError, error, refetch } = useSettings();
  const updateSettingsMutation = useUpdateSettings();
  const { data: actionPrefs } = useActionPreferences();
  const updateActionPrefsMutation = useUpdateActionPreferences();
  const { data: categoryCounts } = useActionCategories();
  const { user } = useAuthStore();

  const [currency, setCurrency] = useState("INR");
  const [locale, setLocale] = useState("en-IN");
  const [efMonths, setEfMonths] = useState(6);

  // Action preferences state
  const [mutedCategories, setMutedCategories] = useState<string[]>([]);
  const [quietHoursStart, setQuietHoursStart] = useState<number | null>(null);
  const [quietHoursEnd, setQuietHoursEnd] = useState<number | null>(null);
  const [notifyMinPriority, setNotifyMinPriority] = useState<ActionPriority>("MEDIUM");

  useEffect(() => {
    if (settings) {
      setCurrency(settings.baseCurrency || "INR");
      setLocale(settings.locale || "en-IN");
      setEfMonths(settings.emergencyFundMonthsTarget || 6);
    }
  }, [settings]);

  useEffect(() => {
    if (actionPrefs) {
      setMutedCategories(actionPrefs.mutedCategories || []);
      setQuietHoursStart(actionPrefs.quietHoursStart ?? null);
      setQuietHoursEnd(actionPrefs.quietHoursEnd ?? null);
      setNotifyMinPriority(actionPrefs.notifyMinPriority || "MEDIUM");
    }
  }, [actionPrefs]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    updateSettingsMutation.mutate({
      baseCurrency: currency,
      locale,
      emergencyFundMonthsTarget: efMonths,
    });

    updateActionPrefsMutation.mutate({
      mutedCategories,
      quietHoursStart,
      quietHoursEnd,
      notifyMinPriority,
    });
  };

  const toggleMutedCategory = (catName: string) => {
    setMutedCategories((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="h-44 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4 max-w-3xl">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to Load Settings</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not retrieve user preferences."}
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

  const allAvailableCategories = Array.from(
    new Set([
      "PAYMENT",
      "INCOME",
      "SPENDING",
      "SAVINGS",
      "INVESTMENT",
      "CREDIT",
      "GOALS",
      "DATA_QUALITY",
      "OPPORTUNITY",
      ...(Array.isArray(categoryCounts) ? categoryCounts.map((c) => c.category) : []),
    ])
  );

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">User Settings & Master Preferences</h2>
        <p className="text-xs text-slate-400">
          {activeSubTab
            ? `Setting Section: ${activeSubTab.replace("-", " ").toUpperCase()}`
            : "Configure display settings, benchmarks, categories, security, and export data"}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" /> User Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                disabled
                value={user?.name || "User"}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || "user@example.com"}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-sm cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Currency & Financial Preferences */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" /> Currency & Benchmark Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Base Display Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Locale Format</label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
              >
                <option value="en-IN">en-IN (Lakhs/Crores)</option>
                <option value="en-US">en-US (Thousands/Millions)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Emergency Target (Months)</label>
              <input
                type="number"
                value={efMonths}
                onChange={(e) => setEfMonths(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Smart Action Center Preferences */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> Notifications & Smart Action Rules
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Muted Action Categories
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {allAvailableCategories.map((cat) => {
                  const isMuted = mutedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleMutedCategory(cat)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                        isMuted
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {isMuted ? `Muted: ${cat}` : cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-indigo-400" /> Min Priority Threshold
                </label>
                <select
                  value={notifyMinPriority}
                  onChange={(e) => setNotifyMinPriority(e.target.value as ActionPriority)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
                >
                  <option value="CRITICAL">CRITICAL only</option>
                  <option value="HIGH">HIGH and above</option>
                  <option value="MEDIUM">MEDIUM and above</option>
                  <option value="LOW">LOW and above</option>
                  <option value="INFO">All (INFO and above)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-amber-400" /> Quiet Hours Start
                </label>
                <select
                  value={quietHoursStart ?? ""}
                  onChange={(e) => setQuietHoursStart(e.target.value !== "" ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
                >
                  <option value="">Off (No Quiet Hours)</option>
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option key={h} value={h}>
                      {h === 0 ? "12 AM (Midnight)" : h < 12 ? `${h} AM` : h === 12 ? "12 PM (Noon)" : `${h - 12} PM`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-amber-400" /> Quiet Hours End
                </label>
                <select
                  value={quietHoursEnd ?? ""}
                  onChange={(e) => setQuietHoursEnd(e.target.value !== "" ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
                >
                  <option value="">Off (No Quiet Hours)</option>
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option key={h} value={h}>
                      {h === 0 ? "12 AM (Midnight)" : h < 12 ? `${h} AM` : h === 12 ? "12 PM (Noon)" : `${h - 12} PM`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Data Export & Backup Controls */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-400" /> Data Backup & Security Export
          </h3>
          <p className="text-xs text-slate-400">
            Download your full financial ledger data as JSON or encrypted backup archive.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled
              title="Data export isn't available yet — no backend endpoint exists"
              className="px-4 py-2 rounded-xl bg-slate-800/50 text-slate-500 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" /> Export Data (JSON)
            </button>
            <button
              type="button"
              disabled
              title="Encrypted backup isn't available yet — no backend endpoint exists"
              className="px-4 py-2 rounded-xl bg-purple-600/10 text-purple-300/50 border border-purple-500/20 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed"
            >
              <Shield className="w-3.5 h-3.5 text-purple-400/50" /> Create Encrypted Backup
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={updateSettingsMutation.isPending || updateActionPrefsMutation.isPending}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          {updateSettingsMutation.isPending || updateActionPrefsMutation.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save All Preferences
        </button>
      </form>

      {/* Self-transfer identifiers — a standalone section, not part of the
          form above: each add/toggle saves immediately via its own mutation
          rather than waiting on "Save All Preferences". */}
      <SelfIdentifiersCard />
    </div>
  );
};
