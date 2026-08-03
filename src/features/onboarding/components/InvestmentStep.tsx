import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { investmentSchema, InvestmentFormValues } from "../schemas/onboardingSchemas";
import { useSubmitInvestment, useSkipStep } from "../hooks/useOnboarding";
import { TrendingUp, PieChart, Landmark, Coins, DollarSign, ArrowRight, Check, FastForward, Sparkles } from "lucide-react";
import { OnboardingInvestmentInput } from "../../../types";

interface InvestmentStepProps {
  initialData?: OnboardingInvestmentInput;
  baseCurrency?: string;
  onSuccess: () => void;
  onSkip: () => void;
}

const ASSET_CLASSES = [
  { key: "MUTUAL_FUND", label: "Mutual Funds", icon: PieChart, desc: "SIP & Equity/Debt funds" },
  { key: "STOCK", label: "Stocks / Equity", icon: TrendingUp, desc: "Direct stock holdings" },
  { key: "ETF", label: "ETFs", icon: TrendingUp, desc: "Index & sector ETFs" },
  { key: "PPF", label: "PPF / Provident", icon: Landmark, desc: "Public Provident Fund" },
  { key: "NPS", label: "NPS / Pension", icon: Landmark, desc: "National Pension Scheme" },
  { key: "EPF", label: "EPF", icon: Landmark, desc: "Employee Provident Fund" },
  { key: "FD", label: "Fixed Deposits", icon: Landmark, desc: "Bank FDs & RDs" },
  { key: "GOLD", label: "Gold & SGB", icon: Coins, desc: "Physical / Sovereign Gold" },
  { key: "CRYPTO", label: "Crypto Assets", icon: Sparkles, desc: "Digital assets" },
];

export const InvestmentStep: React.FC<InvestmentStepProps> = ({
  initialData,
  baseCurrency = "INR",
  onSuccess,
  onSkip,
}) => {
  const submitInvestment = useSubmitInvestment();
  const skipStep = useSkipStep();
  const [hasInvestments, setHasInvestments] = useState<boolean | null>(initialData ? true : null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      symbol: initialData?.symbol || "INFY",
      securityName: initialData?.securityName || "Infosys Ltd",
      assetClass: initialData?.assetClass || "STOCK",
      currency: initialData?.currency || baseCurrency,
      units: initialData?.units || "10",
      costBasis: initialData?.costBasis || "15000.00",
      currentValue: initialData?.currentValue || "18500.00",
      purchaseDate: initialData?.purchaseDate || "2024-04-01",
    },
  });

  const selectedAssetClass = watch("assetClass");

  const handleSkip = () => {
    skipStep.mutate("INVESTMENT", {
      onSuccess: () => {
        onSkip();
      },
    });
  };

  const onSubmit = (data: InvestmentFormValues) => {
    submitInvestment.mutate(data, {
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
          <TrendingUp className="w-6 h-6 text-emerald-400" />
          <span>Do you already have investments?</span>
        </h2>
        <p className="text-slate-400 text-sm">
          Track mutual funds, equities, FDs, gold, and retirement funds to build your net worth chart.
        </p>
      </div>

      {hasInvestments === null && (
        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <TrendingUp className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-200">Track portfolio growth & holdings</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              If you don't hold investments yet or want to import them later via CSV, feel free to skip.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => setHasInvestments(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Yes, Add Investment Holding</span>
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

      {hasInvestments === true && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Asset Class Cards Grid */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Asset Class
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ASSET_CLASSES.map((ac) => {
                const isSelected = selectedAssetClass === ac.key;
                const IconComp = ac.icon;
                return (
                  <button
                    key={ac.key}
                    type="button"
                    onClick={() => {
                      setValue("assetClass", ac.key as InvestmentFormValues["assetClass"]);
                      if (ac.key === "STOCK") {
                        setValue("symbol", "INFY");
                        setValue("securityName", "Infosys Ltd");
                      } else if (ac.key === "MUTUAL_FUND") {
                        setValue("symbol", "HDFCTOP100");
                        setValue("securityName", "HDFC Top 100 Fund");
                      } else {
                        setValue("symbol", ac.key);
                        setValue("securityName", `${ac.label} Account`);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all relative ${
                      isSelected
                        ? "bg-emerald-500/20 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500/50"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <IconComp className="w-4 h-4 mb-1 text-emerald-400" />
                    <div className="text-xs font-bold">{ac.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{ac.desc}</div>
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 p-0.5 rounded-full bg-emerald-500 text-slate-950">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Investment Name & Ticker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="securityName" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Investment / Security Name
              </label>
              <input
                id="securityName"
                type="text"
                placeholder="e.g. Infosys Ltd or Parag Parikh Flexi Cap"
                {...register("securityName")}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs"
              />
              {errors.securityName && <p className="text-xs text-rose-400">{errors.securityName.message}</p>}
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="symbol" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Symbol / Ticker (Optional)
              </label>
              <input
                id="symbol"
                type="text"
                placeholder="e.g. INFY"
                {...register("symbol")}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs"
              />
            </div>
          </div>

          {/* Cost Basis & Current Value Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cost Basis */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="costBasis" className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <span>Total Invested (Cost Basis)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-xs font-bold text-slate-500">{baseCurrency}</span>
                <input
                  id="costBasis"
                  type="number"
                  step="0.01"
                  placeholder="15000.00"
                  {...register("costBasis")}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs"
                />
              </div>
              {errors.costBasis && <p className="text-xs text-rose-400">{errors.costBasis.message}</p>}
            </div>

            {/* Current Market Value */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label htmlFor="currentValue" className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Est. Current Market Value</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-xs font-bold text-slate-500">{baseCurrency}</span>
                <input
                  id="currentValue"
                  type="number"
                  step="0.01"
                  placeholder="18500.00"
                  {...register("currentValue")}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs"
                />
              </div>
              {errors.currentValue && <p className="text-xs text-rose-400">{errors.currentValue.message}</p>}
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
              disabled={submitInvestment.isPending}
              className="w-2/3 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitInvestment.isPending ? (
                <span>Saving Holding...</span>
              ) : (
                <>
                  <span>Save Investment & Continue</span>
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
