import React, { useState } from "react";
import {
  CreditCard as CreditCardIcon,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Info,
  ChevronDown,
} from "lucide-react";
import { useCreateCreditCard } from "../hooks/useCreditCardQueries";
import { useAccounts } from "../../../hooks/useFinanceQueries";
import { CardNetwork, CardType, CreateCreditCardInput } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";

interface AddCreditCardWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddCreditCardWizard: React.FC<AddCreditCardWizardProps> = ({ isOpen, onClose }) => {
  const createCardMutation = useCreateCreditCard();
  const { data: accounts = [] } = useAccounts();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Step 1: Basic Info
  const [issuer, setIssuer] = useState("");
  const [name, setName] = useState("");
  const [network, setNetwork] = useState<CardNetwork>("VISA");
  const [cardType, setCardType] = useState<CardType>("REWARDS");
  const [last4Digits, setLast4Digits] = useState("");
  const [currency, setCurrency] = useState("INR");

  // Step 2: Current Card Position
  const [creditLimit, setCreditLimit] = useState("");
  const [currentOutstanding, setCurrentOutstanding] = useState("");
  const [availableCredit, setAvailableCredit] = useState("");
  const [statementBalance, setStatementBalance] = useState("");
  const [minimumDue, setMinimumDue] = useState("");
  const [billingCycleDay, setBillingCycleDay] = useState(5);
  const [paymentDueDay, setPaymentDueDay] = useState(25);
  const [nextDueDate, setNextDueDate] = useState("");
  const [interestRate, setInterestRate] = useState("42.0");

  // Step 3: Payment Setup
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [autoPay, setAutoPay] = useState(false);

  // Step 4: Advanced
  const [annualFee, setAnnualFee] = useState("");
  const [joiningFee, setJoiningFee] = useState("");
  const [openedDate, setOpenedDate] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const resetForm = () => {
    setCurrentStep(1);
    setIssuer("");
    setName("");
    setNetwork("VISA");
    setCardType("REWARDS");
    setLast4Digits("");
    setCurrency("INR");
    setCreditLimit("");
    setCurrentOutstanding("");
    setAvailableCredit("");
    setStatementBalance("");
    setMinimumDue("");
    setBillingCycleDay(5);
    setPaymentDueDay(25);
    setNextDueDate("");
    setInterestRate("42.0");
    setPaymentAccountId("");
    setAutoPay(false);
    setAnnualFee("");
    setJoiningFee("");
    setOpenedDate("");
    setNotes("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateCreditCardInput = {
      name: name || `${issuer} ${network} Card`,
      issuer,
      network,
      cardType,
      last4Digits,
      maskedNumber: last4Digits ? `•••• •••• •••• ${last4Digits}` : undefined,
      currency,
      creditLimit: creditLimit || "0",
      currentOutstanding: currentOutstanding || "0",
      availableCredit: availableCredit || String(parseFloat(creditLimit || "0") - parseFloat(currentOutstanding || "0")),
      statementBalance: statementBalance || "0",
      minimumDue: minimumDue || "0",
      billingCycleDay,
      statementDay: billingCycleDay,
      paymentDueDay,
      dueDay: paymentDueDay,
      nextDueDate: nextDueDate || undefined,
      interestRate,
      paymentAccountId: paymentAccountId || undefined,
      autoPay,
      annualFee: annualFee || undefined,
      joiningFee: joiningFee || undefined,
      openedDate: openedDate || undefined,
      notes: notes || undefined,
    };

    createCardMutation.mutate(payload, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
      {[
        { step: 1, label: "Basic Info" },
        { step: 2, label: "Position" },
        { step: 3, label: "Payment Setup" },
        { step: 4, label: "Advanced" },
        { step: 5, label: "Review" },
      ].map((s) => (
        <div key={s.step} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              currentStep === s.step
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-500/50"
                : currentStep > s.step
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-slate-800 text-slate-500"
            }`}
          >
            {currentStep > s.step ? <Check className="w-3.5 h-3.5" /> : s.step}
          </div>
          <span
            className={`text-xs font-semibold hidden sm:inline ${
              currentStep === s.step ? "text-slate-100" : "text-slate-500"
            }`}
          >
            {s.label}
          </span>
          {s.step < 5 && <ChevronRight className="w-3 h-3 text-slate-700 hidden sm:inline" />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <CreditCardIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Add Current Credit Card Position</h3>
              <p className="text-xs text-slate-400">Step {currentStep} of 5 • Onboard existing credit card status</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {renderStepIndicator()}

          {/* STEP 1: BASIC INFORMATION */}
          {currentStep === 1 && (
            <form id="step-1-form" onSubmit={handleNext} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Card Issuer / Bank *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC Bank, Amex, ICICI, Axis"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Card Name / Nickname *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Regalia Gold, Infinia, Amazon Pay"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Network</label>
                  <select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value as CardNetwork)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="VISA">Visa</option>
                    <option value="MASTERCARD">Mastercard</option>
                    <option value="AMEX">American Express</option>
                    <option value="RUPAY">RuPay</option>
                    <option value="DINERS">Diners Club</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Card Type</label>
                  <select
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value as CardType)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="REWARDS">Rewards</option>
                    <option value="CASHBACK">Cashback</option>
                    <option value="TRAVEL">Travel</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="SECURED">Secured</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Last 4 Digits *</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    placeholder="e.g. 4321"
                    value={last4Digits}
                    onChange={(e) => setLast4Digits(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </form>
          )}

          {/* STEP 2: CURRENT CARD POSITION */}
          {currentStep === 2 && (
            <form id="step-2-form" onSubmit={handleNext} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3 text-xs text-indigo-300">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  Enter your card's current active balances as per your banking mobile app or latest credit card statement.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Total Credit Limit *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 300000"
                    value={creditLimit}
                    onChange={(e) => {
                      setCreditLimit(e.target.value);
                      if (currentOutstanding) {
                        setAvailableCredit(String(Math.max(0, parseFloat(e.target.value || "0") - parseFloat(currentOutstanding || "0"))));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Total Outstanding *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 45000"
                    value={currentOutstanding}
                    onChange={(e) => {
                      setCurrentOutstanding(e.target.value);
                      if (creditLimit) {
                        setAvailableCredit(String(Math.max(0, parseFloat(creditLimit || "0") - parseFloat(e.target.value || "0"))));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Available Credit</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 255000"
                    value={availableCredit}
                    onChange={(e) => setAvailableCredit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Latest Statement Balance</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 35000"
                    value={statementBalance}
                    onChange={(e) => setStatementBalance(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Minimum Amount Due</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 1750"
                    value={minimumDue}
                    onChange={(e) => setMinimumDue(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Billing Cycle Day (Statement Day)</label>
                  <select
                    value={billingCycleDay}
                    onChange={(e) => setBillingCycleDay(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Day {d} of month
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Due Day</label>
                  <select
                    value={paymentDueDay}
                    onChange={(e) => setPaymentDueDay(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Day {d} of month
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Interest Rate (APR % p.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="42.0"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Next Payment Due Date (Optional)</label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </form>
          )}

          {/* STEP 3: PAYMENT SETUP */}
          {currentStep === 3 && (
            <form id="step-3-form" onSubmit={handleNext} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Default Payment Account (Bank Account)
                </label>
                <select
                  value={paymentAccountId}
                  onChange={(e) => setPaymentAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">-- Select Linked Bank Account --</option>
                  {accounts
                    .filter((a) => a.type !== "CREDIT_CARD" && a.type !== "LOAN")
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type}) - Bal: {formatCurrency(a.currentBalance)}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Used for single-click bill settlements and auto-debit payments.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-100">Auto-Pay Enabled</p>
                  <p className="text-xs text-slate-400">Automatically debit bank account on payment due date</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPay}
                    onChange={(e) => setAutoPay(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </form>
          )}

          {/* STEP 4: ADVANCED SETTINGS */}
          {currentStep === 4 && (
            <form id="step-4-form" onSubmit={handleNext} className="space-y-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-slate-100 transition-colors"
              >
                <span>Advanced Fee & Notes Configuration</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              </button>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Annual Fee</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 2500"
                      value={annualFee}
                      onChange={(e) => setAnnualFee(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Joining Fee</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 1000"
                      value={joiningFee}
                      onChange={(e) => setJoiningFee(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Opened Date</label>
                  <input
                    type="date"
                    value={openedDate}
                    onChange={(e) => setOpenedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notes & Benefits</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Complimentary lounge access, 4x reward points on dining..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </form>
          )}

          {/* STEP 5: REVIEW SUMMARY */}
          {currentStep === 5 && (
            <form id="step-5-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 space-y-1">
                <p className="font-bold text-sm text-indigo-200">Review Credit Card Position Summary</p>
                <p>Verify all details before registering this card in your Personal Finance OS dashboard.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block">Card Name:</span>
                  <span className="font-bold text-slate-100">{name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Issuer / Bank:</span>
                  <span className="font-bold text-slate-100">{issuer}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Network & Type:</span>
                  <span className="font-bold text-slate-100">{network} • {cardType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Last 4 Digits:</span>
                  <span className="font-mono font-bold text-slate-100">•••• {last4Digits}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Credit Limit:</span>
                  <span className="font-bold text-slate-100">₹{parseFloat(creditLimit || "0").toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Current Outstanding:</span>
                  <span className="font-bold text-indigo-300">₹{parseFloat(currentOutstanding || "0").toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Billing Cycle:</span>
                  <span className="font-bold text-slate-100">Day {billingCycleDay} of month</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Due:</span>
                  <span className="font-bold text-slate-100">Day {paymentDueDay} of month</span>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={currentStep === 1 ? handleClose : handleBack}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            {currentStep === 1 ? "Cancel" : <><ChevronLeft className="w-4 h-4" /> Back</>}
          </button>

          {currentStep < 5 ? (
            <button
              type="submit"
              form={`step-${currentStep}-form`}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              form="step-5-form"
              disabled={createCardMutation.isPending}
              className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              {createCardMutation.isPending ? "Saving..." : <><Check className="w-4 h-4" /> Complete & Save Card</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
