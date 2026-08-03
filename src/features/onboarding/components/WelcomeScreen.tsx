import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Clock, ArrowRight, Zap } from "lucide-react";

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      className="max-w-3xl mx-auto space-y-8 py-4"
    >
      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-950 border border-indigo-500/20 p-8 md:p-12 shadow-2xl text-center space-y-6">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Next-Generation Financial Intelligence</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white font-sans">
            Welcome to <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">pFOS</span>
          </h1>
          <p className="text-xl font-medium text-slate-300">
            Your Personal Finance Operating System
          </p>
        </div>

        {/* Description */}
        <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
          Let’s build your financial workspace. In less than 5 minutes, we’ll aggregate your cash, investments, debts, and savings goals into a single intelligent dashboard.
        </p>

        {/* Key Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">5-10 Minutes</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Quick progressive setup</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">100% Private</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Bank-grade security & privacy</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">Resumable Setup</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Save progress anytime</p>
            </div>
          </div>
        </div>

        {/* Primary CTA Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onStart}
            type="button"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-base shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
