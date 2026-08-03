import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountSchema, AccountFormValues } from "../schemas/onboardingSchemas";
import { useSubmitAccount } from "../hooks/useOnboarding";
import { Landmark, Wallet, Building2, CreditCard as CardIcon, ArrowRight, Check, DollarSign } from "lucide-react";
import { OnboardingAccountInput } from "../../../types";

interface BankAccountStepProps {
  initialData?: OnboardingAccountInput;
  baseCurrency?: string;
  onSuccess: () => void;
}

const ACCOUNT_TYPES = [
  { key: "SAVINGS", label: "Savings Account", desc: "Primary liquid savings", icon: Landmark, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { key: "CURRENT", label: "Salary / Checking", desc: "Daily spending & salary", icon: Building2, color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10" },
  { key: "CASH", label: "Cash Wallet", desc: "Physical cash in hand", icon: Wallet, color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { key: "WALLET", label: "Digital Wallet", desc: "Paytm, PayPal, Apple Pay", icon: CardIcon, color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
];

const POPULAR_INSTITUTIONS = [
  "HDFC Bank",
  "ICICI Bank",
  "State Bank of India",
  "Axis Bank",
  "Kotak Mahindra",
  "Chase",
  "Bank of America",
  "Revolut",
  "Other / Cash",
];

export const BankAccountStep: React.FC<BankAccountStepProps> = ({
  initialData,
  baseCurrency = "INR",
  onSuccess,
}) => {
  const submitAccount = useSubmitAccount();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: initialData?.name || "Primary Savings",
      type: initialData?.type || "SAVINGS",
      currency: initialData?.currency || baseCurrency,
      openingBalance: initialData?.openingBalance || "25000.00",
    },
  });

  const selectedType = watch("type");
  const currentName = watch("name");

  const onSubmit = (data: AccountFormValues) => {
    submitAccount.mutate(data, {
      onSuccess: () => {
        onSuccess();
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center justify-center sm:justify-start gap-2">
          <Landmark className="w-6 h-6 text-emerald-400" />
          <span>Add Your Primary Bank Account</span>
        </h2>
        <p className="text-slate-400 text-sm">
          Connect or manually add your first liquid cash account to track your starting net worth.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Large Account Type Selection Cards */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Select Account Type
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACCOUNT_TYPES.map((item) => {
              const isSelected = selectedType === item.key;
              const IconComp = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setValue("type", item.key as AccountFormValues["type"]);
                    if (currentName === "Primary Savings" || currentName === "Primary Checking" || currentName === "Cash Wallet" || currentName === "Digital Wallet") {
                      if (item.key === "SAVINGS") setValue("name", "HDFC Savings");
                      else if (item.key === "CURRENT") setValue("name", "Salary Checking Account");
                      else if (item.key === "CASH") setValue("name", "Cash Wallet");
                      else if (item.key === "WALLET") setValue("name", "Digital Wallet");
                    }
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 relative ${
                    isSelected
                      ? "bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500/50 shadow-xl"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className={`p-2.5 rounded-xl border ${item.color} shrink-0`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{item.label}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 p-0.5 rounded-full bg-indigo-500 text-slate-950">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Account Name & Institution Quick Pick */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="space-y-2">
            <label htmlFor="accountName" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Account Label / Name
            </label>
            <input
              id="accountName"
              type="text"
              placeholder="e.g. HDFC Salary Savings"
              {...register("name")}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs"
            />
            {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Institution Quick Pick
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_INSTITUTIONS.map((inst) => (
                <button
                  key={inst}
                  type="button"
                  onClick={() => setValue("name", inst === "Other / Cash" ? "Cash Wallet" : `${inst} ${selectedType}`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 hover:border-slate-600 transition-all"
                >
                  + {inst}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Opening Balance Entry */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="openingBalance" className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Current Opening Balance</span>
            </label>
            <span className="text-[11px] text-slate-400">Default is 0.00</span>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-3 text-xs font-bold text-slate-500">{baseCurrency}</span>
            <input
              id="openingBalance"
              type="number"
              step="0.01"
              placeholder="25000.00"
              {...register("openingBalance")}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs"
            />
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitAccount.isPending}
            className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitAccount.isPending ? (
              <span>Adding Account...</span>
            ) : (
              <>
                <span>Save Bank Account & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
