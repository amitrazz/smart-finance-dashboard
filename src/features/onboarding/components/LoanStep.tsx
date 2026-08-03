import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loanSchema, LoanFormValues } from "../schemas/onboardingSchemas";
import { useSubmitLoan, useSkipStep } from "../hooks/useOnboarding";
import { Home, Car, GraduationCap, User, Coins, Briefcase, ArrowRight, Check, FastForward, Percent, Calendar, DollarSign } from "lucide-react";
import { OnboardingLoanInput } from "../../../types";

interface LoanStepProps {
  initialData?: OnboardingLoanInput;
  baseCurrency?: string;
  onSuccess: () => void;
  onSkip: () => void;
}

const LOAN_TYPES = [
  { key: "HOME", label: "Home Loan", icon: Home, desc: "Mortgage / Housing" },
  { key: "VEHICLE", label: "Vehicle Loan", icon: Car, desc: "Auto / Two-wheeler" },
  { key: "EDUCATION", label: "Education Loan", icon: GraduationCap, desc: "Student / Higher ed" },
  { key: "PERSONAL", label: "Personal Loan", icon: User, desc: "Unsecured personal" },
  { key: "GOLD", label: "Gold Loan", icon: Coins, desc: "Secured gold loan" },
  { key: "OTHER", label: "Other Loan", icon: Briefcase, desc: "Business / Other" },
];

export const LoanStep: React.FC<LoanStepProps> = ({
  initialData,
  baseCurrency = "INR",
  onSuccess,
  onSkip,
}) => {
  const submitLoan = useSubmitLoan();
  const skipStep = useSkipStep();
  const [hasLoan, setHasLoan] = useState<boolean | null>(initialData ? true : null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      name: initialData?.name || "HDFC Home Loan",
      type: initialData?.type || "HOME",
      currency: initialData?.currency || baseCurrency,
      principalAmount: initialData?.principalAmount || "2500000.00",
      interestRate: initialData?.interestRate || "8.5",
      tenureMonths: initialData?.tenureMonths || 240,
      startDate: initialData?.startDate || "2026-01-01",
    },
  });

  const selectedType = watch("type");

  const handleSkip = () => {
    skipStep.mutate("LOAN", {
      onSuccess: () => {
        onSkip();
      },
    });
  };

  const onSubmit = (data: LoanFormValues) => {
    submitLoan.mutate(data, {
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
          <Home className="w-6 h-6 text-rose-400" />
          <span>Are you currently paying any loans?</span>
        </h2>
        <p className="text-slate-400 text-sm">
          Track home mortgages, vehicle loans, and personal EMIs to accurately calculate your Debt-to-Income ratio.
        </p>
      </div>

      {hasLoan === null && (
        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
            <Home className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-200">Track active loans & EMIs</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              If you have no outstanding loans or prefer to set them up later, skip this step.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => setHasLoan(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Yes, I Have Active Loans</span>
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

      {hasLoan === true && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Loan Type Selection */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Select Loan Category
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {LOAN_TYPES.map((lt) => {
                const isSelected = selectedType === lt.key;
                const IconComp = lt.icon;
                return (
                  <button
                    key={lt.key}
                    type="button"
                    onClick={() => {
                      setValue("type", lt.key as LoanFormValues["type"]);
                      setValue("name", `${lt.label} - Primary`);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                      isSelected
                        ? "bg-rose-600/20 border-rose-500 text-white shadow-lg ring-1 ring-rose-500/50"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <IconComp className="w-5 h-5 mb-1 text-rose-400" />
                    <div className="text-xs font-bold">{lt.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{lt.desc}</div>
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 p-0.5 rounded-full bg-rose-500 text-slate-950">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loan Name */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <label htmlFor="loanName" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Loan Name / Lender
            </label>
            <input
              id="loanName"
              type="text"
              placeholder="e.g. Home Loan - HDFC Bank"
              {...register("name")}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-xs"
            />
            {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
          </div>

          {/* Principal & Interest Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Principal */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="principalAmount" className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-rose-400" />
                <span>Principal Loan Amount</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-xs font-bold text-slate-500">{baseCurrency}</span>
                <input
                  id="principalAmount"
                  type="number"
                  step="0.01"
                  placeholder="2500000.00"
                  {...register("principalAmount")}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-xs"
                />
              </div>
              {errors.principalAmount && <p className="text-xs text-rose-400">{errors.principalAmount.message}</p>}
            </div>

            {/* Interest Rate */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="interestRate" className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-purple-400" />
                <span>Annual Interest Rate (%)</span>
              </label>
              <input
                id="interestRate"
                type="number"
                step="0.1"
                placeholder="8.5"
                {...register("interestRate")}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-xs"
              />
              {errors.interestRate && <p className="text-xs text-rose-400">{errors.interestRate.message}</p>}
            </div>
          </div>

          {/* Tenure & Start Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tenure */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="tenureMonths" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Tenure (Months)
              </label>
              <input
                id="tenureMonths"
                type="number"
                placeholder="240"
                {...register("tenureMonths", { valueAsNumber: true })}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-xs"
              />
            </div>

            {/* Start Date */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="startDate" className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Loan Start Date</span>
              </label>
              <input
                id="startDate"
                type="date"
                {...register("startDate")}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs"
              />
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
              disabled={submitLoan.isPending}
              className="w-2/3 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitLoan.isPending ? (
                <span>Saving Loan...</span>
              ) : (
                <>
                  <span>Save Loan & Continue</span>
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
