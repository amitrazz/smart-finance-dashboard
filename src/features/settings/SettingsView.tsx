import React, { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "../../hooks/useFinanceQueries";
import { useUIStore } from "../../store/useUIStore";
import { useAuthStore } from "../../store/useAuthStore";
import { User, Globe, Save, RefreshCw, AlertTriangle } from "lucide-react";

export const SettingsView: React.FC = () => {
  const { data: settings, isLoading, isError, error, refetch } = useSettings();
  const updateSettingsMutation = useUpdateSettings();
  const { showToast } = useUIStore();
  const { user } = useAuthStore();

  const [currency, setCurrency] = useState("INR");
  const [locale, setLocale] = useState("en-IN");
  const [efMonths, setEfMonths] = useState(6);

  useEffect(() => {
    if (settings) {
      setCurrency(settings.baseCurrency || "INR");
      setLocale(settings.locale || "en-IN");
      setEfMonths(settings.emergencyFundMonthsTarget || 6);
    }
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(
      {
        baseCurrency: currency,
        locale,
        emergencyFundMonthsTarget: efMonths,
      },
      {
        onSuccess: () => {
          showToast("User Settings updated successfully!", "success");
        },
      }
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

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">User Settings & Preferences</h2>
        <p className="text-xs text-slate-400">Configure base currency, locale, emergency fund target, and notification channels</p>
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

        {/* Submit */}
        <button
          type="submit"
          disabled={updateSettingsMutation.isPending}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          {updateSettingsMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Preferences
        </button>
      </form>
    </div>
  );
};
