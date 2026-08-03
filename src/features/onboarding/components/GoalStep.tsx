import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { goalSchema, GoalFormValues } from "../schemas/onboardingSchemas";
import { useSubmitGoal, useSkipStep } from "../hooks/useOnboarding";
import { Target, ShieldCheck, Palmtree, Home, GraduationCap, Car, Sparkles, ArrowRight, Check, FastForward, DollarSign, Calendar } from "lucide-react";
import { OnboardingGoalInput } from "../../../types";

interface GoalStepProps {
  initialData?: OnboardingGoalInput;
  baseCurrency?: string;
  onSuccess: () => void;
  onSkip: () => void;
}

const SAVING_GOALS = [
  { key: "EMERGENCY_FUND", label: "Emergency Fund", icon: ShieldCheck, desc: "3-6 months essential runway", defaultAmount: "600000.00" },
  { key: "VACATION", label: "Dream Vacation", icon: Palmtree, desc: "Travel & holiday fund", defaultAmount: "150000.00" },
  { key: "HOUSE", label: "House Downpayment", icon: Home, desc: "Property purchase", defaultAmount: "1000000.00" },
  { key: "RETIREMENT", label: "Retirement Corpus", icon: Target, desc: "FI/RE target savings", defaultAmount: "10000000.00" },
  { key: "EDUCATION", label: "Education Fund", icon: GraduationCap, desc: "Higher ed or kids", defaultAmount: "500000.00" },
  { key: "CAR", label: "New Car", icon: Car, desc: "Vehicle purchase", defaultAmount: "800000.00" },
  { key: "CUSTOM", label: "Custom Goal", icon: Sparkles, desc: "Personal target", defaultAmount: "250000.00" },
];

export const GoalStep: React.FC<GoalStepProps> = ({
  initialData,
  baseCurrency = "INR",
  onSuccess,
  onSkip,
}) => {
  const submitGoal = useSubmitGoal();
  const skipStep = useSkipStep();
  const [hasGoal, setHasGoal] = useState<boolean | null>(initialData ? true : null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: initialData?.name || "6-Month Emergency Fund",
      type: initialData?.type || "EMERGENCY_FUND",
      priority: initialData?.priority || "HIGH",
      targetAmount: initialData?.targetAmount || "600000.00",
      currency: initialData?.currency || baseCurrency,
      targetDate: initialData?.targetDate || "2027-12-31",
    },
  });

  const selectedGoalType = watch("type");

  const handleSkip = () => {
    skipStep.mutate("GOAL", {
      onSuccess: () => {
        onSkip();
      },
    });
  };

  const onSubmit = (data: GoalFormValues) => {
    submitGoal.mutate(data, {
      onSuccess: () => {
        onSuccess();
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-[11px] font-semibold">
          <span>Optional Step</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-100 flex items-center justify-center sm:justify-start gap-2">
          <Target className="w-6 h-6 text-indigo-400" />
          <span>What are you saving for?</span>
        </h2>
        <p className="text-slate-400 text-sm">
          Set up dedicated targets for your emergency runway, travel, house downpayment, or retirement.
        </p>
      </div>

      {hasGoal === null && (
        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <Target className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-200">Track financial goals & milestones</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              If you want to configure your goals later, you can skip this step.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => setHasGoal(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Yes, Create Saving Goal</span>
            </button>

            <button
              type="button"
              disabled={skipStep.isPending}
              onClick={handleSkip}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700/60"
            >
              <FastForward className="w-4 h-4" />
              <span>Skip for Now</span>
            </button>
          </div>
        </div>
      )}

      {hasGoal === true && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Visual Cards Grid */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Goal Category
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SAVING_GOALS.map((sg) => {
                const isSelected = selectedGoalType === sg.key;
                const IconComp = sg.icon;
                return (
                  <button
                    key={sg.key}
                    type="button"
                    onClick={() => {
                      setValue("type", sg.key as GoalFormValues["type"]);
                      setValue("name", sg.label);
                      setValue("targetAmount", sg.defaultAmount);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all relative ${
                      isSelected
                        ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/50"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <IconComp className="w-4 h-4 mb-1 text-indigo-400" />
                    <div className="text-xs font-bold">{sg.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{sg.desc}</div>
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 p-0.5 rounded-full bg-indigo-500 text-slate-950">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal Title */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <label htmlFor="goalName" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Goal Name
            </label>
            <input
              id="goalName"
              type="text"
              placeholder="e.g. Emergency Fund or House Deposit"
              {...register("name")}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs"
            />
            {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
          </div>

          {/* Target Amount & Target Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Amount */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="targetAmount" className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Target Savings Amount</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-xs font-bold text-slate-500">{baseCurrency}</span>
                <input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  placeholder="600000.00"
                  {...register("targetAmount")}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs"
                />
              </div>
              {errors.targetAmount && <p className="text-xs text-rose-400">{errors.targetAmount.message}</p>}
            </div>

            {/* Target Date */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="targetDate" className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Target Target Date</span>
              </label>
              <input
                id="targetDate"
                type="date"
                {...register("targetDate")}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-xs"
              />
              {errors.targetDate && <p className="text-xs text-rose-400">{errors.targetDate.message}</p>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              disabled={skipStep.isPending}
              onClick={handleSkip}
              className="w-1/3 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all border border-slate-700/60"
            >
              Skip Step
            </button>

            <button
              type="submit"
              disabled={submitGoal.isPending}
              className="w-2/3 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitGoal.isPending ? (
                <span>Saving Goal...</span>
              ) : (
                <>
                  <span>Save Goal & Review</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
