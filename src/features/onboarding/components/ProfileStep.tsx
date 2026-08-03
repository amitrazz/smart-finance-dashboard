import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileFormValues } from "../schemas/onboardingSchemas";
import { useSubmitProfile } from "../hooks/useOnboarding";
import { User, Globe, DollarSign, Clock, ArrowRight, Search, Check, Sparkles } from "lucide-react";
import { OnboardingProfileInput } from "../../../types";

interface ProfileStepProps {
  initialData?: OnboardingProfileInput;
  onSuccess: () => void;
}

const COUNTRIES = [
  { code: "IN", name: "India", currency: "INR", flag: "🇮🇳", timezone: "Asia/Kolkata" },
  { code: "US", name: "United States", currency: "USD", flag: "🇺🇸", timezone: "America/New_York" },
  { code: "GB", name: "United Kingdom", currency: "GBP", flag: "🇬🇧", timezone: "Europe/London" },
  { code: "CA", name: "Canada", currency: "CAD", flag: "🇨🇦", timezone: "America/Toronto" },
  { code: "AU", name: "Australia", currency: "AUD", flag: "🇦🇺", timezone: "Australia/Sydney" },
  { code: "DE", name: "Germany", currency: "EUR", flag: "🇩🇪", timezone: "Europe/Berlin" },
  { code: "SG", name: "Singapore", currency: "SGD", flag: "🇸🇬", timezone: "Asia/Singapore" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", flag: "🇦🇪", timezone: "Asia/Dubai" },
  { code: "JP", name: "Japan", currency: "JPY", flag: "🇯🇵", timezone: "Asia/Tokyo" },
];

const CURRENCIES = [
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "AED", name: "UAE Dirham", symbol: "AED" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
];

export const ProfileStep: React.FC<ProfileStepProps> = ({ initialData, onSuccess }) => {
  const submitProfile = useSubmitProfile();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: initialData?.displayName || "",
      country: initialData?.country || "IN",
      baseCurrency: initialData?.baseCurrency || "INR",
      timezone: initialData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
      locale: initialData?.locale || "en-US",
    },
  });

  const currentCountryCode = watch("country");
  const currentCurrencyCode = watch("baseCurrency");

  const [countrySearch, setCountrySearch] = useState("");

  const filteredCountries = COUNTRIES.filter(
    (c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleCountrySelect = (countryCode: string) => {
    const selected = COUNTRIES.find((c) => c.code === countryCode);
    if (selected) {
      setValue("country", selected.code);
      setValue("baseCurrency", selected.currency);
      setValue("timezone", selected.timezone);
    }
  };

  const handleAutoDetect = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setValue("timezone", tz);
    } catch {
      // ignore
    }
  };

  const onSubmit = (data: ProfileFormValues) => {
    submitProfile.mutate(data, {
      onSuccess: () => {
        onSuccess();
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center justify-center sm:justify-start gap-2">
          <User className="w-6 h-6 text-indigo-400" />
          <span>Complete Your Profile</span>
        </h2>
        <p className="text-slate-400 text-sm">
          Let’s set up your display name, country, primary currency, and timezone.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Full Name */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <label htmlFor="displayName" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Full Display Name
          </label>
          <input
            id="displayName"
            type="text"
            placeholder="e.g. Amit Kumar"
            {...register("displayName")}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
          />
          {errors.displayName && <p className="text-xs text-rose-400">{errors.displayName.message}</p>}
        </div>

        {/* Country Selector */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>Country</span>
            </label>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search country..."
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {filteredCountries.map((c) => {
              const isSelected = currentCountryCode === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCountrySelect(c.code)}
                  className={`flex items-center justify-between p-3 rounded-xl text-left border transition-all text-xs font-medium ${
                    isSelected
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-200"
                      : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{c.flag}</span>
                    <span className="truncate">{c.name}</span>
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>
          {errors.country && <p className="text-xs text-rose-400">{errors.country.message}</p>}
        </div>

        {/* Currency & Timezone Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Base Currency */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Base Currency</span>
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto">
              {CURRENCIES.map((c) => {
                const isSelected = currentCurrencyCode === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setValue("baseCurrency", c.code)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold">{c.code}</div>
                    <div className="text-[10px] text-slate-400">{c.symbol}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timezone */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="timezone" className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Timezone</span>
              </label>
              <button
                type="button"
                onClick={handleAutoDetect}
                className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Auto-detect
              </button>
            </div>
            <input
              id="timezone"
              type="text"
              {...register("timezone")}
              placeholder="Asia/Kolkata"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-xs"
            />
            {errors.timezone && <p className="text-xs text-rose-400">{errors.timezone.message}</p>}
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitProfile.isPending}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitProfile.isPending ? (
              <span>Saving Profile...</span>
            ) : (
              <>
                <span>Save Profile & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
