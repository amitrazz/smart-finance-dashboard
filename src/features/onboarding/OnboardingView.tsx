import React, { useState, useEffect } from "react";
import {
  useBootstrapOnboarding,
  useCompleteOnboardingStep,
  useOnboardingProgress,
  useAccounts,
  useLoans,
  useHoldings,
  useGoals,
  useBudgets,
  useDashboard,
} from "../../hooks/useFinanceQueries";
import { useUIStore } from "../../store/useUIStore";
import {
  Landmark,
  CreditCard,
  Building2,
  TrendingUp,
  Home,
  ShieldCheck,
  Wallet,
  PieChart,
  Target,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Layers,
} from "lucide-react";

interface BankAccountForm {
  bank: string;
  name: string;
  type: string;
  currentBalance: number;
  balanceAsOfDate: string;
}

interface CreditCardForm {
  issuer: string;
  name: string;
  creditLimit: number;
  currentOutstanding: number;
  statementDay: number;
  dueDay: number;
  autoPay: boolean;
}

interface LoanForm {
  name: string;
  lender: string;
  type: string;
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  emiAmount: number;
  emiFrequency: string;
  nextEmiDate: string;
  remainingTenure: number;
  notes: string;
}

interface InvestmentForm {
  type: string;
  name: string;
  quantity: number;
  currentValue: number;
}

interface PhysicalAssetForm {
  name: string;
  type: string;
  estimatedValue: number;
  purchaseYear: number;
  notes: string;
}

interface InsuranceForm {
  provider: string;
  policyName: string;
  policyType: string;
  coverageAmount: number;
  premiumAmount: number;
  renewalDate: string;
  notes: string;
}

interface GoalForm {
  name: string;
  category: string;
  targetAmount: number;
  targetDate: string;
  currentSavedAmount: number;
}

const STEP_ENUM_MAP: Record<number, string> = {
  1: "CASH_BANK_ACCOUNTS",
  2: "CREDIT_CARDS",
  3: "LOANS_EMIS",
  4: "INVESTMENTS",
  5: "PHYSICAL_ASSETS",
  6: "INSURANCE",
  7: "INCOME",
  8: "MONTHLY_EXPENSES",
  9: "FINANCIAL_GOALS",
  10: "DATA_IMPORT",
};

export const OnboardingView: React.FC = () => {
  const {
    setActiveTab,
    setOnboardingCurrentStep,
    completedStepIds,
    markStepCompleted,
    setCompletedStepIds,
  } = useUIStore();
  const { data: onboardingProgress } = useOnboardingProgress();
  const { data: existingAccounts } = useAccounts();
  const { data: existingLoans } = useLoans();
  const { data: existingHoldings } = useHoldings();
  const { data: existingGoals } = useGoals();

  const bootstrapMutation = useBootstrapOnboarding();
  const completeStepMutation = useCompleteOnboardingStep();

  const [currentStep, setCurrentStepState] = useState<number>(1);

  const setCurrentStep = (stepOrFn: number | ((prev: number) => number)) => {
    setCurrentStepState((prev) => {
      const nextStep = typeof stepOrFn === "function" ? stepOrFn(prev) : stepOrFn;
      setOnboardingCurrentStep(nextStep);
      return nextStep;
    });
  };

  // Form states
  const [bankAccounts, setBankAccounts] = useState<BankAccountForm[]>([
    {
      bank: "",
      name: "",
      type: "SAVINGS",
      currentBalance: 0,
      balanceAsOfDate: new Date().toISOString().split("T")[0],
    },
  ]);

  const [creditCards, setCreditCards] = useState<CreditCardForm[]>([]);
  const [loans, setLoans] = useState<LoanForm[]>([]);
  const [investments, setInvestments] = useState<InvestmentForm[]>([]);
  const [physicalAssets, setPhysicalAssets] = useState<PhysicalAssetForm[]>([]);
  const [insurancePolicies, setInsurancePolicies] = useState<InsuranceForm[]>([]);
  const [primaryIncome, setPrimaryIncome] = useState<number>(0);
  const [salaryFrequency, setSalaryFrequency] = useState<string>("MONTHLY");
  const [monthlyExpenses, setMonthlyExpenses] = useState<{ [category: string]: number }>({
    Housing: 0,
    Food: 0,
    Transportation: 0,
    Utilities: 0,
    Entertainment: 0,
    Shopping: 0,
    Healthcare: 0,
    Education: 0,
    Other: 0,
  });
  const [goals, setGoals] = useState<GoalForm[]>([]);
  const [dataImportChoice, setDataImportChoice] = useState<string>("SKIP");

  const { data: existingBudgets } = useBudgets();
  const { data: dashboardData } = useDashboard();

  // Auto-populate form from existing backend data whenever accounts/loans/holdings/goals/budgets/dashboard query updates
  useEffect(() => {
    if (Array.isArray(existingAccounts) && existingAccounts.length > 0) {
      const bankItems: BankAccountForm[] = [];
      const cardItems: CreditCardForm[] = [];

      existingAccounts.forEach((acc) => {
        const bal = parseFloat(acc.currentBalance?.amount || "0");
        if (acc.type === "CREDIT_CARD") {
          cardItems.push({
            issuer: acc.institution?.name || acc.name,
            name: acc.name,
            creditLimit: 100000,
            currentOutstanding: bal,
            statementDay: 1,
            dueDay: 20,
            autoPay: false,
          });
        } else {
          bankItems.push({
            bank: acc.institution?.name || acc.name,
            name: acc.name,
            type: acc.type || "SAVINGS",
            currentBalance: bal,
            balanceAsOfDate: new Date().toISOString().split("T")[0],
          });
        }
      });

      if (bankItems.length > 0) setBankAccounts(bankItems);
      if (cardItems.length > 0) setCreditCards(cardItems);
    }

    if (Array.isArray(existingLoans) && existingLoans.length > 0) {
      const loanItems: LoanForm[] = existingLoans.map((l) => ({
        name: l.name,
        lender: l.lenderName || "",
        type: "HOME",
        originalAmount: parseFloat(l.principalAmount?.amount || "0"),
        currentBalance: parseFloat(l.outstandingBalance?.amount || "0"),
        interestRate: l.interestRate || 0,
        emiAmount: parseFloat(l.emiAmount?.amount || "0"),
        emiFrequency: "MONTHLY",
        nextEmiDate: l.nextDueDate || new Date().toISOString().split("T")[0],
        remainingTenure: l.remainingTenureMonths || 12,
        notes: "",
      }));
      setLoans(loanItems);
    }

    if (Array.isArray(existingHoldings) && existingHoldings.length > 0) {
      const holdingsItems: InvestmentForm[] = existingHoldings.map((h) => ({
        type: h.assetClass || "MUTUAL_FUND",
        name: h.securityName || h.symbol || "",
        quantity: h.quantity || 0,
        currentValue: parseFloat(h.currentValue?.amount || "0"),
      }));
      setInvestments(holdingsItems);
    }

    if (Array.isArray(existingGoals) && existingGoals.length > 0) {
      const goalItems: GoalForm[] = existingGoals.map((g) => {
        const gObj = g as unknown as Record<string, unknown>;
        return {
          name: g.name,
          category: (gObj.category as string) || "EMERGENCY",
          targetAmount: parseFloat(g.targetAmount?.amount || "0"),
          targetDate: (gObj.targetDate as string) || "",
          currentSavedAmount: parseFloat((gObj.currentSavedAmount as { amount?: string })?.amount || "0"),
        };
      });
      setGoals(goalItems);
    }

    if (dashboardData?.monthlyIncome?.amount) {
      const inc = parseFloat(dashboardData.monthlyIncome.amount) || 0;
      if (inc > 0) setPrimaryIncome(inc);
    }

    if (existingBudgets) {
      const budgetList = Array.isArray(existingBudgets) ? existingBudgets : [existingBudgets];
      const expMap: { [cat: string]: number } = {
        Housing: 0,
        Food: 0,
        Transportation: 0,
        Utilities: 0,
        Entertainment: 0,
        Shopping: 0,
        Healthcare: 0,
        Education: 0,
        Other: 0,
      };
      let updated = false;

      budgetList.forEach((b: unknown) => {
        const bObj = b as { lines?: Array<{ categoryName?: string; limitAmount?: { amount?: string } }> };
        if (Array.isArray(bObj.lines)) {
          bObj.lines.forEach((line) => {
            if (line.categoryName && line.limitAmount?.amount) {
              const val = parseFloat(line.limitAmount.amount) || 0;
              if (val > 0) {
                expMap[line.categoryName] = val;
                updated = true;
              }
            }
          });
        }
      });
      if (updated) setMonthlyExpenses(expMap);
    }
  }, [existingAccounts, existingLoans, existingHoldings, existingGoals, existingBudgets, dashboardData]);

  // Sync backend completed steps into frontend completedStepIds store
  useEffect(() => {
    if (onboardingProgress?.steps) {
      onboardingProgress.steps.forEach((s) => {
        if (s.completed) {
          const stepEntry = Object.entries(STEP_ENUM_MAP).find(
            ([enumKey]) => STEP_ENUM_MAP[Number(enumKey)] === s.id
          );
          if (stepEntry) {
            markStepCompleted(Number(stepEntry[0]));
          }
        }
      });
    }
  }, [onboardingProgress, markStepCompleted]);

  // Load saved draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pf_onboarding_draft");
      if (saved) {
        const draft = JSON.parse(saved);
        if (Array.isArray(draft.bankAccounts)) setBankAccounts(draft.bankAccounts);
        if (Array.isArray(draft.creditCards)) setCreditCards(draft.creditCards);
        if (Array.isArray(draft.loans)) setLoans(draft.loans);
        if (Array.isArray(draft.investments)) setInvestments(draft.investments);
        if (Array.isArray(draft.physicalAssets)) setPhysicalAssets(draft.physicalAssets);
        if (Array.isArray(draft.insurancePolicies)) setInsurancePolicies(draft.insurancePolicies);
        if (typeof draft.primaryIncome === "number") setPrimaryIncome(draft.primaryIncome);
        if (draft.salaryFrequency) setSalaryFrequency(draft.salaryFrequency);
        if (draft.monthlyExpenses) setMonthlyExpenses(draft.monthlyExpenses);
        if (Array.isArray(draft.goals)) setGoals(draft.goals);
        if (typeof draft.currentStep === "number") setCurrentStep(draft.currentStep);
        if (draft.dataImportChoice) setDataImportChoice(draft.dataImportChoice);
        if (Array.isArray(draft.completedStepIds)) setCompletedStepIds(draft.completedStepIds);
      }
    } catch {
      // Ignore parse error
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save progress draft on every change
  useEffect(() => {
    try {
      const draft = {
        bankAccounts,
        creditCards,
        loans,
        investments,
        physicalAssets,
        insurancePolicies,
        primaryIncome,
        salaryFrequency,
        monthlyExpenses,
        goals,
        currentStep,
        dataImportChoice,
        completedStepIds,
      };
      localStorage.setItem("pf_onboarding_draft", JSON.stringify(draft));
    } catch {
      // Ignore storage error
    }
  }, [
    bankAccounts,
    creditCards,
    loans,
    investments,
    physicalAssets,
    insurancePolicies,
    primaryIncome,
    salaryFrequency,
    monthlyExpenses,
    goals,
    currentStep,
    dataImportChoice,
    completedStepIds,
  ]);

  // Calculations for dynamic Net Worth preview sidebar
  const totalCash = bankAccounts.reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
  const totalInvestments = investments.reduce((sum, i) => sum + (Number(i.currentValue) || 0), 0);
  const totalAssets = physicalAssets.reduce((sum, p) => sum + (Number(p.estimatedValue) || 0), 0);
  const sumAssets = totalCash + totalInvestments + totalAssets;

  const totalCreditCardDebt = creditCards.reduce((sum, c) => sum + (Number(c.currentOutstanding) || 0), 0);
  const totalLoanDebt = loans.reduce((sum, l) => sum + (Number(l.currentBalance) || 0), 0);
  const sumLiabilities = totalCreditCardDebt + totalLoanDebt;

  const estimatedNetWorth = sumAssets - sumLiabilities;

  const modules = [
    { id: 1, title: "Cash & Bank", icon: Landmark, desc: "Bank balances" },
    { id: 2, title: "Credit Cards", icon: CreditCard, desc: "Outstanding cards" },
    { id: 3, title: "Loans & EMIs", icon: Building2, desc: "Active liabilities" },
    { id: 4, title: "Investments", icon: TrendingUp, desc: "Stocks, MFs, FDs" },
    { id: 5, title: "Physical Assets", icon: Home, desc: "Property & valuables" },
    { id: 6, title: "Insurance", icon: ShieldCheck, desc: "Policies & renewals" },
    { id: 7, title: "Income", icon: Wallet, desc: "Monthly salary" },
    { id: 8, title: "Expenses", icon: PieChart, desc: "Category budgets" },
    { id: 9, title: "Goals", icon: Target, desc: "Financial targets" },
    { id: 10, title: "Data Import", icon: FileSpreadsheet, desc: "Connect or skip" },
  ];

  const handleFinishOnboarding = () => {
    const payload = {
      cashAccounts: bankAccounts,
      creditCards,
      loans,
      investments,
      physicalAssets,
      insurancePolicies,
      income: {
        primaryIncome,
        salaryFrequency,
      },
      monthlyExpenses: Object.entries(monthlyExpenses).map(([category, estimatedAmount]) => ({
        category,
        estimatedAmount,
      })),
      goals,
      dataImportChoice,
    };

    bootstrapMutation.mutate(payload, {
      onSuccess: () => {
        try {
          localStorage.removeItem("pf_onboarding_draft");
        } catch {
          // Ignore local storage deletion errors
        }
        setCompletedStepIds([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        setActiveTab("dashboard");
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" /> Conversational Financial Onboarding
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
              Let's understand where you are today.
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              We're capturing your current financial position — opening balances, active loans, holdings, and goals. No need to import years of past transaction history. Setup takes 5–10 minutes and every step is optional.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleFinishOnboarding}
              disabled={bootstrapMutation.isPending}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{bootstrapMutation.isPending ? "Saving Setup..." : "Finish Setup & Launch OS"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stepper Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const isActive = currentStep === mod.id;
          const isCompleted =
            completedStepIds.includes(mod.id) ||
            Boolean(onboardingProgress?.steps?.find((s) => s.id === STEP_ENUM_MAP[mod.id])?.completed);

          return (
            <button
              key={mod.id}
              onClick={() => setCurrentStep(mod.id)}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                isActive
                  ? "bg-indigo-600/20 border-indigo-500 text-slate-100 shadow-lg shadow-indigo-950/40"
                  : isCompleted
                  ? "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                  : "bg-slate-900/30 border-slate-800/60 text-slate-500 hover:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold opacity-60">Step {mod.id}</span>
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                )}
              </div>
              <div>
                <p className="text-xs font-bold truncate">{mod.title}</p>
                <p className="text-[10px] opacity-70 truncate">{mod.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Content Layout (Form + Realtime Net Worth Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step Forms (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
            {/* Step Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  {React.createElement(modules[currentStep - 1].icon, { className: "w-6 h-6" })}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100">
                    Step {currentStep}: {modules[currentStep - 1].title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {modules[currentStep - 1].desc} • Optional, add items or skip.
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {currentStep} / 10
              </span>
            </div>

            {/* STEP 1: CASH & BANK ACCOUNTS */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  {bankAccounts.map((account, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 relative">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                          Bank Account #{idx + 1}
                        </h4>
                        {bankAccounts.length > 1 && (
                          <button
                            onClick={() => setBankAccounts(bankAccounts.filter((_, i) => i !== idx))}
                            className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Bank Name</label>
                          <input
                            type="text"
                            value={account.bank}
                            onChange={(e) => {
                              const copy = [...bankAccounts];
                              copy[idx].bank = e.target.value;
                              setBankAccounts(copy);
                            }}
                            placeholder="e.g. HDFC Bank, SBI, ICICI"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Account Display Name</label>
                          <input
                            type="text"
                            value={account.name}
                            onChange={(e) => {
                              const copy = [...bankAccounts];
                              copy[idx].name = e.target.value;
                              setBankAccounts(copy);
                            }}
                            placeholder="e.g. Primary Savings, Salary Account"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Account Type</label>
                          <select
                            value={account.type}
                            onChange={(e) => {
                              const copy = [...bankAccounts];
                              copy[idx].type = e.target.value;
                              setBankAccounts(copy);
                            }}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="SAVINGS">Savings Account</option>
                            <option value="CURRENT">Current Account</option>
                            <option value="CASH">Physical Cash</option>
                            <option value="WALLET">Digital Wallet</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Current Balance (₹)</label>
                          <input
                            type="number"
                            value={account.currentBalance || ""}
                            onChange={(e) => {
                              const copy = [...bankAccounts];
                              copy[idx].currentBalance = parseFloat(e.target.value) || 0;
                              setBankAccounts(copy);
                            }}
                            placeholder="Opening balance"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setBankAccounts([
                      ...bankAccounts,
                      {
                        bank: "",
                        name: "New Account",
                        type: "SAVINGS",
                        currentBalance: 0,
                        balanceAsOfDate: new Date().toISOString().split("T")[0],
                      },
                    ])
                  }
                  className="w-full py-3 rounded-2xl border border-dashed border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-indigo-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Another Bank Account
                </button>
              </div>
            )}

            {/* STEP 2: CREDIT CARDS */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  {creditCards.map((card, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                          Credit Card #{idx + 1}
                        </h4>
                        {creditCards.length > 0 && (
                          <button
                            onClick={() => setCreditCards(creditCards.filter((_, i) => i !== idx))}
                            className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Card Issuer</label>
                          <input
                            type="text"
                            value={card.issuer}
                            onChange={(e) => {
                              const copy = [...creditCards];
                              copy[idx].issuer = e.target.value;
                              setCreditCards(copy);
                            }}
                            placeholder="e.g. HDFC, ICICI, Amex"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Card Name</label>
                          <input
                            type="text"
                            value={card.name}
                            onChange={(e) => {
                              const copy = [...creditCards];
                              copy[idx].name = e.target.value;
                              setCreditCards(copy);
                            }}
                            placeholder="e.g. Regalia Gold, Infinia"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Total Credit Limit (₹)</label>
                          <input
                            type="number"
                            value={card.creditLimit || ""}
                            onChange={(e) => {
                              const copy = [...creditCards];
                              copy[idx].creditLimit = parseFloat(e.target.value) || 0;
                              setCreditCards(copy);
                            }}
                            placeholder="Total limit"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Current Outstanding (₹)</label>
                          <input
                            type="number"
                            value={card.currentOutstanding || ""}
                            onChange={(e) => {
                              const copy = [...creditCards];
                              copy[idx].currentOutstanding = parseFloat(e.target.value) || 0;
                              setCreditCards(copy);
                            }}
                            placeholder="Starting liability balance"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-rose-400 font-bold text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Statement Day of Month</label>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={card.statementDay}
                            onChange={(e) => {
                              const copy = [...creditCards];
                              copy[idx].statementDay = parseInt(e.target.value) || 1;
                              setCreditCards(copy);
                            }}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Due Day of Month</label>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={card.dueDay}
                            onChange={(e) => {
                              const copy = [...creditCards];
                              copy[idx].dueDay = parseInt(e.target.value) || 20;
                              setCreditCards(copy);
                            }}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setCreditCards([
                      ...creditCards,
                      {
                        issuer: "",
                        name: "New Credit Card",
                        creditLimit: 100000,
                        currentOutstanding: 0,
                        statementDay: 1,
                        dueDay: 20,
                        autoPay: false,
                      },
                    ])
                  }
                  className="w-full py-3 rounded-2xl border border-dashed border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-indigo-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Another Credit Card
                </button>
              </div>
            )}

            {/* STEP 3: EXISTING LOANS & EMIS */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    <strong>Starting Position Mode:</strong> You do not need to enter historical EMIs. The system will start your loan schedule from its current outstanding balance and generate future EMIs starting from the next due date.
                  </p>
                </div>

                <div className="space-y-4">
                  {loans.map((loan, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                          Loan #{idx + 1}
                        </h4>
                        {loans.length > 0 && (
                          <button
                            onClick={() => setLoans(loans.filter((_, i) => i !== idx))}
                            className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Loan Name</label>
                          <input
                            type="text"
                            value={loan.name}
                            onChange={(e) => {
                              const copy = [...loans];
                              copy[idx].name = e.target.value;
                              setLoans(copy);
                            }}
                            placeholder="e.g. Home Loan, Car EMI"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Lender Bank/Institution</label>
                          <input
                            type="text"
                            value={loan.lender}
                            onChange={(e) => {
                              const copy = [...loans];
                              copy[idx].lender = e.target.value;
                              setLoans(copy);
                            }}
                            placeholder="e.g. SBI, HDFC, Bajaj Finserv"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Loan Type</label>
                          <select
                            value={loan.type}
                            onChange={(e) => {
                              const copy = [...loans];
                              copy[idx].type = e.target.value;
                              setLoans(copy);
                            }}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="HOME">Home Loan</option>
                            <option value="PERSONAL">Personal Loan</option>
                            <option value="AUTO">Vehicle / Auto Loan</option>
                            <option value="EDUCATION">Education Loan</option>
                            <option value="GOLD">Gold Loan</option>
                            <option value="BUSINESS">Business Loan</option>
                            <option value="OTHER">Other Loan</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Current Outstanding Balance (₹)</label>
                          <input
                            type="number"
                            value={loan.currentBalance || ""}
                            onChange={(e) => {
                              const copy = [...loans];
                              copy[idx].currentBalance = parseFloat(e.target.value) || 0;
                              setLoans(copy);
                            }}
                            placeholder="Current balance remaining"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-rose-400 font-bold text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Monthly EMI Amount (₹)</label>
                          <input
                            type="number"
                            value={loan.emiAmount || ""}
                            onChange={(e) => {
                              const copy = [...loans];
                              copy[idx].emiAmount = parseFloat(e.target.value) || 0;
                              setLoans(copy);
                            }}
                            placeholder="Monthly repayment amount"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Next EMI Due Date</label>
                          <input
                            type="date"
                            value={loan.nextEmiDate}
                            onChange={(e) => {
                              const copy = [...loans];
                              copy[idx].nextEmiDate = e.target.value;
                              setLoans(copy);
                            }}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setLoans([
                      ...loans,
                      {
                        name: "New Loan",
                        lender: "Lender Bank",
                        type: "PERSONAL",
                        originalAmount: 100000,
                        currentBalance: 80000,
                        interestRate: 11,
                        emiAmount: 3500,
                        emiFrequency: "MONTHLY",
                        nextEmiDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
                        remainingTenure: 24,
                        notes: "",
                      },
                    ])
                  }
                  className="w-full py-3 rounded-2xl border border-dashed border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-indigo-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Another Active Loan
                </button>
              </div>
            )}

            {/* STEP 4: INVESTMENTS */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  {investments.map((inv, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                          Holding #{idx + 1}
                        </h4>
                        {investments.length > 0 && (
                          <button
                            onClick={() => setInvestments(investments.filter((_, i) => i !== idx))}
                            className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Asset Class / Type</label>
                          <select
                            value={inv.type}
                            onChange={(e) => {
                              const copy = [...investments];
                              copy[idx].type = e.target.value;
                              setInvestments(copy);
                            }}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="MUTUAL_FUND">Mutual Funds</option>
                            <option value="STOCK">Stocks / Equity</option>
                            <option value="ETF">ETFs</option>
                            <option value="PPF">PPF (Public Provident Fund)</option>
                            <option value="EPF">EPF (Employee Provident Fund)</option>
                            <option value="NPS">NPS (National Pension System)</option>
                            <option value="FIXED_DEPOSIT">Fixed Deposits (FD)</option>
                            <option value="BOND">Bonds / Debentures</option>
                            <option value="CRYPTO">Crypto</option>
                            <option value="GOLD">Digital / SGB Gold</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Holding Name / Security</label>
                          <input
                            type="text"
                            value={inv.name}
                            onChange={(e) => {
                              const copy = [...investments];
                              copy[idx].name = e.target.value;
                              setInvestments(copy);
                            }}
                            placeholder="e.g. Parag Parikh Flexi Cap, Reliance, PPF Account"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Units / Quantity (Optional)</label>
                          <input
                            type="number"
                            value={inv.quantity || ""}
                            onChange={(e) => {
                              const copy = [...investments];
                              copy[idx].quantity = parseFloat(e.target.value) || 0;
                              setInvestments(copy);
                            }}
                            placeholder="Quantity"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Current Estimated Value (₹)</label>
                          <input
                            type="number"
                            value={inv.currentValue || ""}
                            onChange={(e) => {
                              const copy = [...investments];
                              copy[idx].currentValue = parseFloat(e.target.value) || 0;
                              setInvestments(copy);
                            }}
                            placeholder="Total current valuation"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setInvestments([
                      ...investments,
                      {
                        type: "MUTUAL_FUND",
                        name: "New Fund / Holding",
                        quantity: 100,
                        currentValue: 50000,
                      },
                    ])
                  }
                  className="w-full py-3 rounded-2xl border border-dashed border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-indigo-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Another Holding
                </button>
              </div>
            )}

            {/* STEP 5: PHYSICAL ASSETS */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  {physicalAssets.map((asset, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                          Physical Asset #{idx + 1}
                        </h4>
                        {physicalAssets.length > 0 && (
                          <button
                            onClick={() => setPhysicalAssets(physicalAssets.filter((_, i) => i !== idx))}
                            className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Asset Name</label>
                          <input
                            type="text"
                            value={asset.name}
                            onChange={(e) => {
                              const copy = [...physicalAssets];
                              copy[idx].name = e.target.value;
                              setPhysicalAssets(copy);
                            }}
                            placeholder="e.g. 3BHK Flat, Honda City 2022"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Asset Type</label>
                          <select
                            value={asset.type}
                            onChange={(e) => {
                              const copy = [...physicalAssets];
                              copy[idx].type = e.target.value;
                              setPhysicalAssets(copy);
                            }}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="REAL_ESTATE">House / Real Estate / Land</option>
                            <option value="VEHICLE">Vehicle / Car / Bike</option>
                            <option value="JEWELRY">Physical Gold & Jewellery</option>
                            <option value="ELECTRONICS">High Value Electronics</option>
                            <option value="OTHER">Other Valuable Asset</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Estimated Current Value (₹)</label>
                          <input
                            type="number"
                            value={asset.estimatedValue || ""}
                            onChange={(e) => {
                              const copy = [...physicalAssets];
                              copy[idx].estimatedValue = parseFloat(e.target.value) || 0;
                              setPhysicalAssets(copy);
                            }}
                            placeholder="Estimated market valuation"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Purchase Year (Optional)</label>
                          <input
                            type="number"
                            value={asset.purchaseYear || ""}
                            onChange={(e) => {
                              const copy = [...physicalAssets];
                              copy[idx].purchaseYear = parseInt(e.target.value) || 2022;
                              setPhysicalAssets(copy);
                            }}
                            placeholder="e.g. 2021"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setPhysicalAssets([
                      ...physicalAssets,
                      {
                        name: "New Asset",
                        type: "VEHICLE",
                        estimatedValue: 500000,
                        purchaseYear: 2023,
                        notes: "",
                      },
                    ])
                  }
                  className="w-full py-3 rounded-2xl border border-dashed border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-indigo-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Another Asset
                </button>
              </div>
            )}

            {/* STEP 6: INSURANCE */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  {insurancePolicies.map((ins, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                          Policy #{idx + 1}
                        </h4>
                        {insurancePolicies.length > 0 && (
                          <button
                            onClick={() => setInsurancePolicies(insurancePolicies.filter((_, i) => i !== idx))}
                            className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Insurance Provider</label>
                          <input
                            type="text"
                            value={ins.provider}
                            onChange={(e) => {
                              const copy = [...insurancePolicies];
                              copy[idx].provider = e.target.value;
                              setInsurancePolicies(copy);
                            }}
                            placeholder="e.g. HDFC ERGO, Star Health, LIC"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Policy Name</label>
                          <input
                            type="text"
                            value={ins.policyName}
                            onChange={(e) => {
                              const copy = [...insurancePolicies];
                              copy[idx].policyName = e.target.value;
                              setInsurancePolicies(copy);
                            }}
                            placeholder="e.g. Health Optima, Term Life Plan"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Policy Type</label>
                          <select
                            value={ins.policyType}
                            onChange={(e) => {
                              const copy = [...insurancePolicies];
                              copy[idx].policyType = e.target.value;
                              setInsurancePolicies(copy);
                            }}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="HEALTH">Health Insurance</option>
                            <option value="LIFE">Term / Life Insurance</option>
                            <option value="VEHICLE">Vehicle Insurance</option>
                            <option value="PROPERTY">Property / Home Insurance</option>
                            <option value="TRAVEL">Travel Insurance</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Total Coverage Amount (₹)</label>
                          <input
                            type="number"
                            value={ins.coverageAmount || ""}
                            onChange={(e) => {
                              const copy = [...insurancePolicies];
                              copy[idx].coverageAmount = parseFloat(e.target.value) || 0;
                              setInsurancePolicies(copy);
                            }}
                            placeholder="e.g. 1000000"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Annual Premium Amount (₹)</label>
                          <input
                            type="number"
                            value={ins.premiumAmount || ""}
                            onChange={(e) => {
                              const copy = [...insurancePolicies];
                              copy[idx].premiumAmount = parseFloat(e.target.value) || 0;
                              setInsurancePolicies(copy);
                            }}
                            placeholder="Annual premium"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Next Renewal Date</label>
                          <input
                            type="date"
                            value={ins.renewalDate}
                            onChange={(e) => {
                              const copy = [...insurancePolicies];
                              copy[idx].renewalDate = e.target.value;
                              setInsurancePolicies(copy);
                            }}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setInsurancePolicies([
                      ...insurancePolicies,
                      {
                        provider: "",
                        policyName: "New Policy",
                        policyType: "HEALTH",
                        coverageAmount: 500000,
                        premiumAmount: 15000,
                        renewalDate: "2027-06-01",
                        notes: "",
                      },
                    ])
                  }
                  className="w-full py-3 rounded-2xl border border-dashed border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-indigo-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Another Policy
                </button>
              </div>
            )}

            {/* STEP 7: INCOME */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    Primary Income Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Primary Monthly Income (₹)</label>
                      <input
                        type="number"
                        value={primaryIncome || ""}
                        onChange={(e) => setPrimaryIncome(parseFloat(e.target.value) || 0)}
                        placeholder="Expected monthly take-home"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Income Frequency</label>
                      <select
                        value={salaryFrequency}
                        onChange={(e) => setSalaryFrequency(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="BIWEEKLY">Bi-Weekly</option>
                        <option value="ANNUAL">Annual / Annualized</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 8: MONTHLY EXPENSES */}
            {currentStep === 8 && (
              <div className="space-y-6">
                <p className="text-xs text-slate-400">
                  Provide estimated monthly spending across major categories to initialize your cash-flow forecasting and budgeting baseline.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(monthlyExpenses).map(([category, amount]) => (
                    <div key={category} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4">
                      <span className="text-xs font-semibold text-slate-200">{category}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-500">₹</span>
                        <input
                          type="number"
                          value={amount || 0}
                          onChange={(e) => {
                            setMonthlyExpenses({
                              ...monthlyExpenses,
                              [category]: parseFloat(e.target.value) || 0,
                            });
                          }}
                          className="w-28 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs text-right font-bold focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 9: FINANCIAL GOALS */}
            {currentStep === 9 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  {goals.map((g, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                          Goal #{idx + 1}
                        </h4>
                        {goals.length > 0 && (
                          <button
                            onClick={() => setGoals(goals.filter((_, i) => i !== idx))}
                            className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Goal Name</label>
                          <input
                            type="text"
                            value={g.name}
                            onChange={(e) => {
                              const copy = [...goals];
                              copy[idx].name = e.target.value;
                              setGoals(copy);
                            }}
                            placeholder="e.g. Emergency Fund, House Down Payment"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Goal Category</label>
                          <select
                            value={g.category}
                            onChange={(e) => {
                              const copy = [...goals];
                              copy[idx].category = e.target.value;
                              setGoals(copy);
                            }}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="EMERGENCY">Emergency Fund</option>
                            <option value="HOUSE">House Purchase</option>
                            <option value="VACATION">Vacation / Travel</option>
                            <option value="RETIREMENT">Retirement</option>
                            <option value="EDUCATION">Education</option>
                            <option value="OTHER">Custom Goal</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Target Amount (₹)</label>
                          <input
                            type="number"
                            value={g.targetAmount || ""}
                            onChange={(e) => {
                              const copy = [...goals];
                              copy[idx].targetAmount = parseFloat(e.target.value) || 0;
                              setGoals(copy);
                            }}
                            placeholder="Target amount"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Current Saved Amount (₹)</label>
                          <input
                            type="number"
                            value={g.currentSavedAmount || ""}
                            onChange={(e) => {
                              const copy = [...goals];
                              copy[idx].currentSavedAmount = parseFloat(e.target.value) || 0;
                              setGoals(copy);
                            }}
                            placeholder="Amount saved so far"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setGoals([
                      ...goals,
                      {
                        name: "New Milestone Goal",
                        category: "VACATION",
                        targetAmount: 150000,
                        targetDate: "2027-12-31",
                        currentSavedAmount: 30000,
                      },
                    ])
                  }
                  className="w-full py-3 rounded-2xl border border-dashed border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-indigo-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Another Goal
                </button>
              </div>
            )}

            {/* STEP 10: DATA IMPORT */}
            {currentStep === 10 && (
              <div className="space-y-6">
                <p className="text-xs text-slate-400">
                  Optional automated transaction & statement imports. Imported transactions will reconcile cleanly with your newly created opening balances without creating duplicate balances.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: "CONNECT_BANK", title: "Connect Bank Account", desc: "Open Banking / Account Aggregator API sync" },
                    { id: "UPLOAD_CSV", title: "Upload CSV Statement", desc: "Import bank or broker spreadsheet CSVs" },
                    { id: "UPLOAD_PDF", title: "Upload PDF Statement", desc: "AI parsing of bank or credit card PDFs" },
                    { id: "SKIP", title: "Skip for Now", desc: "Finish position setup now, import later anytime" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setDataImportChoice(opt.id)}
                      className={`p-5 rounded-2xl border text-left transition-all space-y-2 ${
                        dataImportChoice === opt.id
                          ? "bg-indigo-600/20 border-indigo-500 text-slate-100 shadow-lg"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-100">{opt.title}</h4>
                        {dataImportChoice === opt.id && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <p className="text-xs text-slate-400">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer Buttons */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-6">
              <button
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all flex items-center gap-1.5 disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div className="flex items-center gap-3">
                {currentStep < 10 && (
                  <button
                    onClick={() => setCurrentStep((prev) => Math.min(10, prev + 1))}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition-all"
                  >
                    Skip Step
                  </button>
                )}

                {currentStep < 10 ? (
                  <button
                    onClick={() => {
                      markStepCompleted(currentStep);
                      const stepEnum = STEP_ENUM_MAP[currentStep];
                      if (stepEnum) {
                        completeStepMutation.mutate(stepEnum);
                      }
                      setCurrentStep((prev) => Math.min(10, prev + 1));
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                  >
                    <span>Save & Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinishOnboarding}
                    disabled={bootstrapMutation.isPending}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{bootstrapMutation.isPending ? "Finalizing Setup..." : "Complete Setup & Launch OS"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Realtime Live Net Worth Preview Sidebar (Right Column) */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-indigo-500/20 shadow-xl space-y-6 sticky top-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" /> Realtime Position Preview
              </h3>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Live Calculation
              </span>
            </div>

            {/* Estimated Net Worth Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-500/30 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Net Worth</p>
              <h2 className="text-2xl font-black text-emerald-400">
                ₹{estimatedNetWorth.toLocaleString("en-IN")}
              </h2>
              <p className="text-[11px] text-slate-400">
                Opening position calculated from added assets minus liabilities.
              </p>
            </div>

            {/* Assets Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Total Assets</span>
                <span className="text-emerald-400 font-extrabold">₹{sumAssets.toLocaleString("en-IN")}</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400 p-2 rounded-xl bg-slate-950/40">
                  <span>Cash & Bank Balances ({bankAccounts.length})</span>
                  <span className="text-slate-200 font-semibold">₹{totalCash.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-400 p-2 rounded-xl bg-slate-950/40">
                  <span>Investments ({investments.length})</span>
                  <span className="text-slate-200 font-semibold">₹{totalInvestments.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-400 p-2 rounded-xl bg-slate-950/40">
                  <span>Physical Assets ({physicalAssets.length})</span>
                  <span className="text-slate-200 font-semibold">₹{totalAssets.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Liabilities Breakdown */}
            <div className="space-y-3 border-t border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Total Liabilities</span>
                <span className="text-rose-400 font-extrabold">₹{sumLiabilities.toLocaleString("en-IN")}</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400 p-2 rounded-xl bg-slate-950/40">
                  <span>Credit Card Outstanding ({creditCards.length})</span>
                  <span className="text-slate-200 font-semibold">₹{totalCreditCardDebt.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-400 p-2 rounded-xl bg-slate-950/40">
                  <span>Active Loans Balance ({loans.length})</span>
                  <span className="text-slate-200 font-semibold">₹{totalLoanDebt.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Summary Highlights */}
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-indigo-300">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Day 1 Insights Ready
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Completing this 5-10 min setup automatically initializes your Financial Health Score, Net Worth breakdown, and EMI calendar!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
