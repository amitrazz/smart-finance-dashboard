import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { creditCardSchema, CreditCardFormValues } from "../schemas/onboardingSchemas";
import { useSubmitCreditCard, useSkipStep } from "../hooks/useOnboarding";
import { CreditCard, Calendar, DollarSign, ArrowRight, Check, FastForward } from "lucide-react";
import { OnboardingCreditCardInput } from "../../../types";

interface CreditCardStepProps {
  initialData?: OnboardingCreditCardInput;
  baseCurrency?: string;
  onSuccess: () => void;
  onSkip: () => void;
}

export const CreditCardStep: React.FC<CreditCardStepProps> = ({
  initialData,
  baseCurrency = "INR",
  onSuccess,
  onSkip,
}) => {
  const submitCard = useSubmitCreditCard();
  const skipStep = useSkipStep();
  const [wantsCard, setWantsCard] = useState<boolean | null>(initialData ? true : null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreditCardFormValues>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      issuer: initialData?.issuer || "HDFC Bank",
      nickname: initialData?.nickname || "HDFC Regalia",
      lastFourDigits: initialData?.lastFourDigits || "",
      currency: initialData?.currency || baseCurrency,
      creditLimit: initialData?.creditLimit || "200000.00",
      currentOutstanding: initialData?.currentOutstanding || "0.00",
      availableCredit: initialData?.availableCredit || "200000.00",
      statementBalance: initialData?.statementBalance || "0.00",
      minimumDue: initialData?.minimumDue || "0.00",
      billingCycleDay: initialData?.billingCycleDay || 5,
      paymentDueDay: initialData?.paymentDueDay || 25,
      nextDueDate: initialData?.nextDueDate || "",
    },
  });

  const creditLimit = watch("creditLimit");
  const currentOutstanding = watch("currentOutstanding");

  const handleLimitOrOutstandingChange = (limit: string, outstanding: string) => {
    const avail = Math.max(0, parseFloat(limit || "0") - parseFloat(outstanding || "0"));
    setValue("availableCredit", avail.toFixed(2));
  };

  const handleSkip = () => {
    skipStep.mutate("CREDIT_CARD", {
      onSuccess: () => {
        onSkip();
      },
    });
  };

  const onSubmit = (data: CreditCardFormValues) => {
    submitCard.mutate(data, {
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
          <CreditCard className="w-6 h-6 text-purple-400" />
          <span>Do you use a Credit Card?</span>
        </h2>
        <p className="text-slate-400 text-sm">
          Tracking credit card limits and statement due dates prevents late fees and improves credit utilization insights.
        </p>
      </div>

      {wantsCard === null && (
        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-200">Add your active credit cards</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              If you don't use credit cards or want to add them later, you can skip this step now.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => setWantsCard(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Yes, Add Credit Card</span>
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

      {wantsCard === true && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Card Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="issuer" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Issuing Bank
              </label>
              <input
                id="issuer"
                type="text"
                placeholder="e.g. HDFC Bank"
                {...register("issuer")}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-xs"
              />
              {errors.issuer && <p className="text-xs text-rose-400">{errors.issuer.message}</p>}
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="nickname" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Card Name / Nickname
              </label>
              <input
                id="nickname"
                type="text"
                placeholder="e.g. HDFC Regalia Black"
                {...register("nickname")}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-xs"
              />
              {errors.nickname && <p className="text-xs text-rose-400">{errors.nickname.message}</p>}
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="lastFourDigits" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Last 4 Digits
              </label>
              <input
                id="lastFourDigits"
                type="text"
                maxLength={4}
                placeholder="4321"
                {...register("lastFourDigits")}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-xs"
              />
              {errors.lastFourDigits && <p className="text-xs text-rose-400">{errors.lastFourDigits.message}</p>}
            </div>
          </div>

          {/* Limits & Outstanding Balance Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Credit Limit */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="creditLimit" className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-purple-400" />
                <span>Total Credit Limit</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-xs font-bold text-slate-500">{baseCurrency}</span>
                <input
                  id="creditLimit"
                  type="number"
                  step="0.01"
                  placeholder="200000.00"
                  {...register("creditLimit")}
                  onBlur={(e) => handleLimitOrOutstandingChange(e.target.value, currentOutstanding)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-xs"
                />
              </div>
              {errors.creditLimit && <p className="text-xs text-rose-400">{errors.creditLimit.message}</p>}
            </div>

            {/* Current Outstanding */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="currentOutstanding" className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-rose-400" />
                <span>Current Outstanding Balance</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-xs font-bold text-slate-500">{baseCurrency}</span>
                <input
                  id="currentOutstanding"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("currentOutstanding")}
                  onBlur={(e) => handleLimitOrOutstandingChange(creditLimit, e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-xs"
                />
              </div>
              {errors.currentOutstanding && <p className="text-xs text-rose-400">{errors.currentOutstanding.message}</p>}
            </div>
          </div>

          {/* Available Credit / Statement Balance / Minimum Due */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="availableCredit" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Available Credit
              </label>
              <input
                id="availableCredit"
                type="number"
                step="0.01"
                {...register("availableCredit")}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-xs"
              />
              {errors.availableCredit && <p className="text-xs text-rose-400">{errors.availableCredit.message}</p>}
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="statementBalance" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Latest Statement Balance
              </label>
              <input
                id="statementBalance"
                type="number"
                step="0.01"
                {...register("statementBalance")}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-xs"
              />
              {errors.statementBalance && <p className="text-xs text-rose-400">{errors.statementBalance.message}</p>}
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="minimumDue" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Minimum Amount Due
              </label>
              <input
                id="minimumDue"
                type="number"
                step="0.01"
                {...register("minimumDue")}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-xs"
              />
              {errors.minimumDue && <p className="text-xs text-rose-400">{errors.minimumDue.message}</p>}
            </div>
          </div>

          {/* Billing & Due Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Billing Cycle Day */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="billingCycleDay" className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Statement Cut-off Day</span>
              </label>
              <select
                id="billingCycleDay"
                {...register("billingCycleDay", { valueAsNumber: true })}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-xs"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    Day {day} of month
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Due Day */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="paymentDueDay" className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-rose-400" />
                <span>Payment Due Day</span>
              </label>
              <select
                id="paymentDueDay"
                {...register("paymentDueDay", { valueAsNumber: true })}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-xs"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    Day {day} of month
                  </option>
                ))}
              </select>
            </div>

            {/* Next Due Date */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="nextDueDate" className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-rose-400" />
                <span>Next Payment Due Date</span>
              </label>
              <input
                id="nextDueDate"
                type="date"
                {...register("nextDueDate")}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-xs"
              />
              {errors.nextDueDate && <p className="text-xs text-rose-400">{errors.nextDueDate.message}</p>}
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
              disabled={submitCard.isPending}
              className="w-2/3 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitCard.isPending ? (
                <span>Saving Card...</span>
              ) : (
                <>
                  <span>Save Credit Card & Continue</span>
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
