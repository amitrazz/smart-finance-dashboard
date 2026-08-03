import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { preferencesSchema, PreferencesFormValues } from "../schemas/onboardingSchemas";
import { useSubmitPreferences } from "../hooks/useOnboarding";
import { Sliders, Calendar, DollarSign, ArrowRight, Briefcase, Clock, Check } from "lucide-react";
import { OnboardingPreferencesInput } from "../../../types";

interface PreferencesStepProps {
  initialData?: OnboardingPreferencesInput;
  baseCurrency?: string;
  onSuccess: () => void;
}

const PAY_FREQUENCIES = [
  { key: "MONTHLY", label: "Monthly", desc: "Paid once a month", icon: "🗓️" },
  { key: "BI_WEEKLY", label: "Bi-Weekly", desc: "Paid every two weeks", icon: "⚡" },
  { key: "WEEKLY", label: "Weekly", desc: "Paid every week", icon: "🔄" },
  { key: "CUSTOM", label: "Custom / Variable", desc: "Freelance or variable", icon: "🎯" },
];

const FISCAL_MONTHS = [
  { value: 1, label: "January (Jan–Dec)" },
  { value: 4, label: "April (Apr–Mar)" },
  { value: 7, label: "July (Jul–Jun)" },
  { value: 10, label: "October (Oct–Sep)" },
];

export const PreferencesStep: React.FC<PreferencesStepProps> = ({
  initialData,
  baseCurrency = "INR",
  onSuccess,
}) => {
  const submitPreferences = useSubmitPreferences();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      fiscalYearStartMonth: initialData?.fiscalYearStartMonth || 4,
      primaryIncomeSourceName: initialData?.primaryIncomeSourceName || "Primary Salary",
      payFrequency: initialData?.payFrequency || "MONTHLY",
      payDay: initialData?.payDay || 1,
      monthlyAmount: initialData?.monthlyAmount || "85000.00",
      currency: initialData?.currency || baseCurrency,
    },
  });

  const selectedFrequency = watch("payFrequency");

  const onSubmit = (data: PreferencesFormValues) => {
    submitPreferences.mutate(data, {
      onSuccess: () => {
        onSuccess();
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center justify-center sm:justify-start gap-2">
          <Sliders className="w-6 h-6 text-purple-400" />
          <span>Financial Preferences & Income</span>
        </h2>
        <p className="text-slate-400 text-sm">
          Customize how pFOS calculates your fiscal year, cash flow budget, and payday schedule.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Income Frequency Preset Cards */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Income Frequency</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PAY_FREQUENCIES.map((freq) => {
              const isSelected = selectedFrequency === freq.key;
              return (
                <button
                  key={freq.key}
                  type="button"
                  onClick={() => setValue("payFrequency", freq.key as PreferencesFormValues["payFrequency"])}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                    isSelected
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/50"
                      : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="text-xl mb-1">{freq.icon}</div>
                  <div className="text-xs font-bold">{freq.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{freq.desc}</div>
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

        {/* Primary Income Source & Monthly Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Income Source Name */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <label htmlFor="primaryIncomeSourceName" className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <span>Income Source</span>
            </label>
            <input
              id="primaryIncomeSourceName"
              type="text"
              placeholder="e.g. Acme Corp Salary"
              {...register("primaryIncomeSourceName")}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs"
            />
          </div>

          {/* Amount */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <label htmlFor="monthlyAmount" className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Est. Monthly Income</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-xs font-bold text-slate-500">{baseCurrency}</span>
              <input
                id="monthlyAmount"
                type="number"
                step="0.01"
                placeholder="85000.00"
                {...register("monthlyAmount")}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs"
              />
            </div>
            {errors.monthlyAmount && <p className="text-xs text-rose-400">{errors.monthlyAmount.message}</p>}
          </div>
        </div>

        {/* Salary Payday & Fiscal Year Start */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Salary Pay Day */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <label htmlFor="payDay" className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Payday (Day of Month)</span>
            </label>
            <select
              id="payDay"
              {...register("payDay", { valueAsNumber: true })}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-xs"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                  {day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"} of every month
                </option>
              ))}
            </select>
          </div>

          {/* Fiscal Year Start */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <label htmlFor="fiscalYearStartMonth" className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Fiscal Year Start</span>
            </label>
            <select
              id="fiscalYearStartMonth"
              {...register("fiscalYearStartMonth", { valueAsNumber: true })}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-xs"
            >
              {FISCAL_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitPreferences.isPending}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitPreferences.isPending ? (
              <span>Saving Preferences...</span>
            ) : (
              <>
                <span>Save Preferences & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
