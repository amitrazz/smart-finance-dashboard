import React, { useState } from "react";
import { Settings, Save } from "lucide-react";
import { useUIStore } from "../../../store/useUIStore";

export const SettingsView: React.FC = () => {
  const { showToast } = useUIStore();
  const [benchmark, setBenchmark] = useState("NIFTY 50 TRI");
  const [taxSlab, setTaxSlab] = useState("30%");
  const [techLimit, setTechLimit] = useState(20);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Investment settings updated successfully", "success");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-100 text-sm">Investment Preferences & Allocation Guardrails</h3>
          <p className="text-xs text-slate-400">Configure benchmark indices, tax brackets, and concentration alerts</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-6 shadow-xl">
        {/* Benchmark Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Default Performance Benchmark Index</label>
          <select
            value={benchmark}
            onChange={(e) => setBenchmark(e.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
          >
            <option value="NIFTY 50 TRI">NIFTY 50 TRI (Top 50 Indian Large Caps)</option>
            <option value="NIFTY 500 TRI">NIFTY 500 TRI (Broad Indian Market)</option>
            <option value="SENSEX TRI">BSE SENSEX TRI</option>
            <option value="S&P 500">S&P 500 (US Equity Benchmark)</option>
          </select>
        </div>

        {/* Income Tax Bracket */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Personal Income Tax Bracket (For STCG / Dividend Tax)</label>
          <select
            value={taxSlab}
            onChange={(e) => setTaxSlab(e.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
          >
            <option value="30%">30% Slab (Highest Bracket)</option>
            <option value="20%">20% Slab</option>
            <option value="15%">15% Slab</option>
            <option value="0%">0% Tax Free</option>
          </select>
        </div>

        {/* Concentration Alert Limit */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Sector Concentration Warning Ceiling ({techLimit}%)
          </label>
          <input
            type="range"
            min="10"
            max="50"
            value={techLimit}
            onChange={(e) => setTechLimit(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <p className="text-xs text-slate-400">Trigger warning when any sector weight exceeds {techLimit}%</p>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Save className="w-4 h-4" /> Save Preferences
        </button>
      </form>
    </div>
  );
};
