import React, { useState } from "react";
import { X, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { useCreateBudget } from "../hooks/useBudgetQueries";
import { useCategories } from "../../../hooks/useFinanceQueries";
import { Budget, BudgetPeriod } from "../../../types";

interface BudgetWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetWizardModal: React.FC<BudgetWizardModalProps> = ({ isOpen, onClose }) => {
  const { data: allCategories = [] } = useCategories();
  const categories = allCategories.filter((c) => (c.type ?? c.kind) === "EXPENSE");
  const createMutation = useCreateBudget();

  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 4;

  // Step 1: Basics
  const [name, setName] = useState("August Household Budget");
  const [period, setPeriod] = useState<BudgetPeriod>("MONTHLY");
  const [currency, setCurrency] = useState("INR");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().substring(0, 10);
  });

  // Step 2: Amount
  const [totalLimit, setTotalLimit] = useState("120000");
  const [carryForwardEnabled, setCarryForwardEnabled] = useState(true);
  const [autoAdjustEnabled, setAutoAdjustEnabled] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);

  // Step 3: Category Allocations — real categories, keyed by real categoryId.
  const [categoryAllocations, setCategoryAllocations] = useState<Record<string, number>>({});

  if (!isOpen) return null;

  const handleNext = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = () => {
    const allocations = Object.entries(categoryAllocations)
      .filter(([, amt]) => amt > 0)
      .map(([categoryId, amt]) => ({ categoryId, allocatedAmount: String(amt) }));

    const payload: Partial<Budget> & { allocations?: Array<{ categoryId: string; allocatedAmount: string }> } = {
      name,
      period,
      currency,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      totalLimit: { amount: totalLimit, currency },
      carryForwardEnabled,
      autoAdjustEnabled,
      notificationEnabled,
      allocations,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        onClose();
        setStep(1);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header & Step Indicator */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              Step {step} of {TOTAL_STEPS} • {step === 1 ? "Basics" : step === 2 ? "Amount" : step === 3 ? "Allocations" : "Review"}
            </span>
            <h3 className="text-xl font-extrabold text-slate-100 mt-0.5">Budget Plan Wizard</h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full h-1.5 bg-slate-950">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Step 1: Basics & Template Selection */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Choose Budget Template Preset</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: "custom", label: "Custom Setup", desc: "Define your own limits & categories from scratch." },
                    { id: "50-30-20", label: "50 / 30 / 20 Rule", desc: "50% Needs, 30% Wants, 20% Financial Goals." },
                    { id: "zero-based", label: "Zero-Based Budget", desc: "Allocate every rupee of your income to a target." },
                    { id: "minimalist", label: "Minimalist Essentials", desc: "Focus strictly on fixed living costs & safety buffer." },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        if (tpl.id === "50-30-20") {
                          setTotalLimit("150000");
                          setName("50/30/20 Household Plan");
                        } else if (tpl.id === "zero-based") {
                          setTotalLimit("120000");
                          setName("Zero-Based Monthly Plan");
                        } else if (tpl.id === "minimalist") {
                          setTotalLimit("80000");
                          setName("Essential Living Budget");
                        }
                      }}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left transition-all cursor-pointer group"
                    >
                      <p className="text-xs font-bold text-slate-100 group-hover:text-emerald-400">{tpl.label}</p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{tpl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Budget Plan Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. August Household Budget"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Period Frequency</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Amount */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Total Monthly Budget Limit (₹)</label>
                <input
                  type="number"
                  value={totalLimit}
                  onChange={(e) => setTotalLimit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-slate-100">Auto Carry Forward</p>
                    <p className="text-[11px] text-slate-400">Rolls unspent balance into the next period automatically.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={carryForwardEnabled}
                    onChange={(e) => setCarryForwardEnabled(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-slate-100">Auto Adjust Caps</p>
                    <p className="text-[11px] text-slate-400">Dynamically balances category caps based on spending velocity.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoAdjustEnabled}
                    onChange={(e) => setAutoAdjustEnabled(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-slate-100">Threshold Notifications</p>
                    <p className="text-[11px] text-slate-400">Sends alerts when reaching 80% and 100% of category caps.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationEnabled}
                    onChange={(e) => setNotificationEnabled(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Category Allocations */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-300">Category Cap Allocations (optional — you can also set these later)</p>

              {categories.length === 0 ? (
                <p className="text-xs text-slate-500 p-4 text-center">No expense categories available yet.</p>
              ) : (
                <div className="space-y-4">
                  {categories.slice(0, 8).map((cat) => {
                    const val = categoryAllocations[cat.id] || 0;
                    return (
                      <div key={cat.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-100">{cat.name}</span>
                          <span className="text-emerald-400">₹{val.toLocaleString()}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="50000"
                          step="1000"
                          value={val}
                          onChange={(e) =>
                            setCategoryAllocations({
                              ...categoryAllocations,
                              [cat.id]: Number(e.target.value),
                            })
                          }
                          className="w-full accent-emerald-500"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/20 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Budget Name:</span>
                  <span className="font-bold text-slate-100">{name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Period:</span>
                  <span className="font-bold text-emerald-400">{period}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Spend Limit:</span>
                  <span className="font-extrabold text-slate-100">₹{Number(totalLimit).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Auto Carry Forward:</span>
                  <span className="font-bold text-slate-200">{carryForwardEnabled ? "Enabled" : "Disabled"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
          <button
            disabled={step === 1}
            onClick={handleBack}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <span>Next</span> <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Check className="w-4 h-4" /> <span>Save & Activate Plan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
