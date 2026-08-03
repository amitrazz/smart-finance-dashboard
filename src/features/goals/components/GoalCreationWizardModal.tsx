import React, { useState } from "react";
import { useCreateGoal } from "../hooks/useGoalQueries";
import { useAccounts } from "../../../hooks/useFinanceQueries";
import { GoalType, GoalPriority, RiskProfile } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Building,
} from "lucide-react";

interface GoalCreationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoalCreationWizardModal: React.FC<GoalCreationWizardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const createGoalMutation = useCreateGoal();
  const { data: accounts = [] } = useAccounts();

  // Step 1: Basic Info
  const [name, setName] = useState("");
  const [type, setType] = useState<GoalType>("VACATION");
  const [priority, setPriority] = useState<GoalPriority>("MEDIUM");
  const [targetAmount, setTargetAmount] = useState("500000");
  const [currency] = useState("INR");
  const [targetDate, setTargetDate] = useState("2028-12-31");

  // Step 2: Financial Planning
  const [currentCorpus, setCurrentCorpus] = useState("0");
  const [monthlyContribution, setMonthlyContribution] = useState("10000");
  const [expectedReturnRate, setExpectedReturnRate] = useState("12");
  const [inflationRate, setInflationRate] = useState("6");
  const [riskProfile, setRiskProfile] = useState<RiskProfile>("MODERATE");
  const [autoContributionEnabled, setAutoContributionEnabled] = useState(false);

  // Step 3: Link Assets
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // Step 4: Milestones
  const [milestones, setMilestones] = useState<Array<{ name: string; targetAmount: string; targetDate: string }>>([
    { name: "25% Milestone", targetAmount: "125000", targetDate: "2026-12-31" },
    { name: "50% Milestone", targetAmount: "250000", targetDate: "2027-06-30" },
    { name: "75% Milestone", targetAmount: "375000", targetDate: "2027-12-31" },
    { name: "100% Final Target", targetAmount: "500000", targetDate: "2028-12-31" },
  ]);
  const [customMilestoneName, setCustomMilestoneName] = useState("");
  const [customMilestoneAmount, setCustomMilestoneAmount] = useState("");
  const [customMilestoneDate, setCustomMilestoneDate] = useState("");

  if (!isOpen) return null;

  const toggleAssetSelection = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddCustomMilestone = () => {
    if (!customMilestoneName || !customMilestoneAmount || !customMilestoneDate) return;
    setMilestones((prev) => [
      ...prev,
      { name: customMilestoneName, targetAmount: customMilestoneAmount, targetDate: customMilestoneDate },
    ]);
    setCustomMilestoneName("");
    setCustomMilestoneAmount("");
    setCustomMilestoneDate("");
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    createGoalMutation.mutate(
      {
        name,
        type,
        priority,
        targetAmount,
        currency,
        targetDate,
        currentCorpus,
        monthlyContribution,
        expectedReturnRate,
        inflationRate,
        riskProfile,
        autoContributionEnabled,
        linkedAssetIds: selectedAssetIds,
        milestones,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-100">Goal Creation Wizard</h2>
            </div>
            <p className="text-xs text-slate-400">Step {currentStep} of 6</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicator Bar */}
        <div className="w-full bg-slate-950 flex border-b border-slate-800/80 overflow-x-auto scrollbar-none">
          {[
            { step: 1, label: "Goal" },
            { step: 2, label: "Target" },
            { step: 3, label: "Planning" },
            { step: 4, label: "Linked Assets" },
            { step: 5, label: "Milestones" },
            { step: 6, label: "Review DTO" },
          ].map((item) => (
            <div
              key={item.step}
              className={`flex-1 min-w-[90px] text-center py-2 text-[10px] font-bold border-r border-slate-800 last:border-r-0 ${
                currentStep === item.step
                  ? "bg-emerald-500/10 text-emerald-400 border-b-2 border-b-emerald-400"
                  : currentStep > item.step
                  ? "text-slate-300"
                  : "text-slate-600"
              }`}
            >
              {item.step}. {item.label}
            </div>
          ))}
        </div>

        {/* Step Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {/* STEP 1: Goal Basic Information & Template Selection */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Choose Goal Template Preset</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: "custom", label: "Custom Goal", desc: "Build a personalized goal from scratch.", name: "", type: "CUSTOM", amount: "500000" },
                    { id: "retire", label: "Retirement Corpus", desc: "Long-term financial independence fund.", name: "Retirement Freedom Fund", type: "RETIREMENT", amount: "25000000" },
                    { id: "home", label: "Dream Home", desc: "Down payment & property corpus.", name: "Dream Home Down Payment", type: "HOUSE", amount: "15000000" },
                    { id: "emergency", label: "Emergency Fund", desc: "6 months of liquid living expenses.", name: "6-Month Emergency Shield", type: "EMERGENCY_FUND", amount: "1000000" },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        if (tpl.name) setName(tpl.name);
                        if (tpl.type) setType(tpl.type as GoalType);
                        if (tpl.amount) setTargetAmount(tpl.amount);
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">Goal Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Retirement Corpus 2040 or Dream Home"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Goal Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as GoalType)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none"
                  >
                    <option value="EMERGENCY_FUND">Emergency Fund</option>
                    <option value="RETIREMENT">Retirement</option>
                    <option value="HOUSE">House / Property</option>
                    <option value="CAR">Car / Vehicle</option>
                    <option value="VACATION">Vacation & Travel</option>
                    <option value="WEDDING">Wedding</option>
                    <option value="EDUCATION">Education</option>
                    <option value="CHILD_EDUCATION">Child Education</option>
                    <option value="BUSINESS">Business / Venture</option>
                    <option value="INVESTMENT_CORPUS">Investment Corpus</option>
                    <option value="PASSIVE_INCOME">Passive Income</option>
                    <option value="DEBT_FREE">Debt Free</option>
                    <option value="INSURANCE_CORPUS">Insurance Corpus</option>
                    <option value="MEDICAL_FUND">Medical Fund</option>
                    <option value="CUSTOM">Custom Goal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as GoalPriority)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Target Amount & Date */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Currency</label>
                  <input
                    type="text"
                    disabled
                    value={currency}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Completion Date *</label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Financial Planning */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Current Corpus (₹)</label>
                  <input
                    type="number"
                    value={currentCorpus}
                    onChange={(e) => setCurrentCorpus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Contribution (₹)</label>
                  <input
                    type="number"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Expected Return (% p.a.)</label>
                  <input
                    type="number"
                    value={expectedReturnRate}
                    onChange={(e) => setExpectedReturnRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Inflation Rate (%)</label>
                  <input
                    type="number"
                    value={inflationRate}
                    onChange={(e) => setInflationRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Risk Profile</label>
                  <select
                    value={riskProfile}
                    onChange={(e) => setRiskProfile(e.target.value as RiskProfile)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none"
                  >
                    <option value="CONSERVATIVE">Conservative</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="AGGRESSIVE">Aggressive</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-slate-200">Auto Contribution</p>
                  <p className="text-[11px] text-slate-400">Automate recurring monthly contributions via SIP/Auto-Debit</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoContributionEnabled}
                  onChange={(e) => setAutoContributionEnabled(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Link Assets */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Select existing accounts or investments (Mutual Funds, Stocks, Cash) to link with this goal:
              </p>

              {accounts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-950 rounded-2xl">
                  No accounts found. You can link accounts later in Goal Details.
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts.map((acc) => {
                    const isSelected = selectedAssetIds.includes(acc.id);
                    return (
                      <div
                        key={acc.id}
                        onClick={() => toggleAssetSelection(acc.id)}
                        className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                            : "bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Building className="w-5 h-5" />
                          <div>
                            <p className="font-bold text-xs">{acc.name}</p>
                            <p className="text-[11px] text-slate-400">{acc.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-xs">{formatCurrency(acc.currentBalance)}</span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 accent-emerald-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Milestones */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">Define milestone targets for corpus progression:</p>

              <div className="space-y-2">
                {milestones.map((m, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{m.name}</p>
                      <p className="text-[11px] text-slate-400">Date: {m.targetDate}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-400">₹{m.targetAmount}</span>
                      <button onClick={() => handleRemoveMilestone(i)} className="text-slate-400 hover:text-rose-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Milestone */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                <p className="font-bold text-xs text-slate-200">+ Add Custom Milestone</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Milestone Name"
                    value={customMilestoneName}
                    onChange={(e) => setCustomMilestoneName(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100"
                  />
                  <input
                    type="number"
                    placeholder="Amount (₹)"
                    value={customMilestoneAmount}
                    onChange={(e) => setCustomMilestoneAmount(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100"
                  />
                  <input
                    type="date"
                    value={customMilestoneDate}
                    onChange={(e) => setCustomMilestoneDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomMilestone}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs hover:bg-slate-700"
                >
                  Add Milestone
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Review Backend DTO */}
          {currentStep === 6 && (
            <div className="space-y-4 text-xs">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-slate-100 border-b border-slate-800 pb-2 flex items-center justify-between">
                  <span>Backend DTO Payload Preview</span>
                  <span className="text-[10px] font-mono text-emerald-400">CreateGoalInput</span>
                </h3>

                <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-200 overflow-x-auto">
{JSON.stringify(
  {
    name,
    type,
    priority,
    targetAmount,
    currency,
    targetDate,
    currentCorpus,
    monthlyContribution,
    expectedReturnRate,
    inflationRate,
    riskProfile,
    autoContributionEnabled,
    linkedAssetIds: selectedAssetIds,
    milestones,
  },
  null,
  2
)}
                </pre>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                Backend engine will instantiate FinancialGoal aggregate, initialize milestones, and compute projected health score.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {currentStep < 6 ? (
            <button
              disabled={currentStep === 1 && !name}
              onClick={() => setCurrentStep((s) => Math.min(6, s + 1))}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={createGoalMutation.isPending}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25"
            >
              <Check className="w-4 h-4" /> Confirm & Create Goal
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
