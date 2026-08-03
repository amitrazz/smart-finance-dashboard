import React, { useState } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Building2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "../../../utils/formatters";
import { useCreateLoan } from "../hooks/useLoanQueries";
import { useAccounts, useInstitutions } from "../../../hooks/useFinanceQueries";
import { CreateLoanInput, LoanType, LoanInterestType } from "../../../types";

interface CreateLoanWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateLoanWizardModal: React.FC<CreateLoanWizardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Form State - Current Position Priority
  const [formData, setFormData] = useState<CreateLoanInput>({
    name: "",
    type: "HOME",
    lenderName: "",
    currency: "INR",
    outstandingPrincipal: "",
    monthlyEmi: "",
    remainingTenureMonths: 12,
    nextDueDate: new Date().toISOString().split("T")[0],
    interestRate: "8.5",
    interestType: "FIXED",
    paymentFrequency: "MONTHLY",
    autoDebit: false,
    accountId: "",
    institutionId: "",
    // Advanced fields
    principalAmount: "",
    tenureMonths: undefined,
    loanNumber: "",
    startDate: "",
    purpose: "",
    notes: "",
  });

  const createLoanMutation = useCreateLoan();
  const { data: accounts = [] } = useAccounts();
  const { data: institutions = [] } = useInstitutions();

  if (!isOpen) return null;

  const handleChange = (key: keyof CreateLoanInput, value: CreateLoanInput[keyof CreateLoanInput]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (step < 4) setStep((s) => (s + 1) as 1 | 2 | 3 | 4);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const principalAmt =
      formData.principalAmount && parseFloat(formData.principalAmount) > 0
        ? formData.principalAmount
        : formData.outstandingPrincipal;

    const tenure =
      formData.tenureMonths && formData.tenureMonths > 0
        ? formData.tenureMonths
        : formData.remainingTenureMonths;

    const startDt = formData.startDate || formData.nextDueDate || new Date().toISOString().split("T")[0];

    const payload: CreateLoanInput = {
      ...formData,
      principalAmount: principalAmt,
      tenureMonths: tenure,
      startDate: startDt,
      // Clean optional empty strings
      lenderName: formData.lenderName || undefined,
      institutionId: formData.institutionId || undefined,
      accountId: formData.accountId || undefined,
      loanNumber: formData.loanNumber || undefined,
      purpose: formData.purpose || undefined,
      notes: formData.notes || undefined,
    };

    createLoanMutation.mutate(payload, {
      onSuccess: () => {
        onClose();
        setStep(1);
      },
    });
  };

  const isStep1Valid = Boolean(formData.name && formData.type && formData.currency);
  const isStep2Valid = Boolean(
    parseFloat(formData.outstandingPrincipal) > 0 &&
    parseFloat(formData.monthlyEmi) > 0 &&
    formData.remainingTenureMonths > 0 &&
    formData.nextDueDate &&
    parseFloat(formData.interestRate) >= 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-100 font-sans tracking-tight">Record Loan Account</h2>
              <p className="text-xs text-slate-400">Current Position Onboarding Wizard (Step {step} of 4)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950/60 text-center text-xs font-bold">
          {[
            { s: 1, label: "Basic Info" },
            { s: 2, label: "Current Position" },
            { s: 3, label: "Payment Account" },
            { s: 4, label: "Review & Save" },
          ].map(({ s, label }) => (
            <div
              key={s}
              className={`py-3 border-b-2 transition-all ${
                step === s
                  ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                  : step > s
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-500"
              }`}
            >
              Step {s}: {label}
            </div>
          ))}
        </div>

        {/* Wizard Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1.5">Loan Nickname *</label>
                  <input
                    type="text"
                    placeholder="e.g. Home Loan - HDFC"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1.5">Lender Institution</label>
                  <select
                    value={formData.institutionId || formData.lenderName || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matchedInst = institutions.find((inst) => inst.id === val || inst.name === val);
                      if (matchedInst) {
                        setFormData((prev) => ({
                          ...prev,
                          institutionId: matchedInst.id,
                          lenderName: matchedInst.name,
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          institutionId: "",
                          lenderName: val,
                        }));
                      }
                    }}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="">-- Select Lender Bank / Institution --</option>
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name}
                      </option>
                    ))}
                    <optgroup label="Popular Lenders">
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="Axis Bank">Axis Bank</option>
                      <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                      <option value="Bank of Baroda">Bank of Baroda</option>
                      <option value="Punjab National Bank (PNB)">Punjab National Bank (PNB)</option>
                      <option value="Tata Capital">Tata Capital</option>
                      <option value="Bajaj Finance">Bajaj Finance</option>
                      <option value="L&T Finance">L&T Finance</option>
                      <option value="Aditya Birla Capital">Aditya Birla Capital</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1.5">Loan Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleChange("type", e.target.value as LoanType)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="HOME">Home Loan</option>
                    <option value="VEHICLE">Vehicle / Auto Loan</option>
                    <option value="PERSONAL">Personal Loan</option>
                    <option value="EDUCATION">Education Loan</option>
                    <option value="GOLD">Gold Loan</option>
                    <option value="MORTGAGE">Property Mortgage</option>
                    <option value="BUSINESS">Business Loan</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1.5">Currency *</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleChange("currency", e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Current Position (Core Workflow) */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Current Position Model:</strong> Enter your current outstanding balance and monthly EMI. You don't need to dig up original contract paperwork.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1.5">Remaining Balance *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 1500000"
                    value={formData.outstandingPrincipal}
                    onChange={(e) => handleChange("outstandingPrincipal", e.target.value)}
                    required
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1.5">Monthly EMI Amount *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 24500"
                    value={formData.monthlyEmi}
                    onChange={(e) => handleChange("monthlyEmi", e.target.value)}
                    required
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 placeholder-slate-500 focus:border-indigo-500 outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1.5">Remaining EMIs (Months) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 120"
                    value={formData.remainingTenureMonths}
                    onChange={(e) => handleChange("remainingTenureMonths", parseInt(e.target.value, 10) || 0)}
                    required
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1.5">Next EMI Due Date *</label>
                  <input
                    type="date"
                    value={formData.nextDueDate}
                    onChange={(e) => handleChange("nextDueDate", e.target.value)}
                    required
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1.5">Interest Rate (% APR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 8.5"
                    value={formData.interestRate}
                    onChange={(e) => handleChange("interestRate", e.target.value)}
                    required
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 placeholder-slate-500 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1.5">Interest Type</label>
                  <select
                    value={formData.interestType}
                    onChange={(e) => handleChange("interestType", e.target.value as LoanInterestType)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="FIXED">Fixed Rate</option>
                    <option value="FLOATING">Floating / Variable Rate</option>
                    <option value="MIXED">Mixed Rate</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="autoDebitToggle"
                  checked={formData.autoDebit}
                  onChange={(e) => handleChange("autoDebit", e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="autoDebitToggle" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Auto-debit active on bank account
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Account Linkage */}
          {step === 3 && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-400">
                Link a bank account for automated EMI deduction when recording payments.
              </p>

              <div className="space-y-2">
                <label className="text-slate-300 font-semibold block">Select Linked Bank Account</label>
                {accounts.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs text-center">
                    No bank accounts available. You can complete loan setup without a linked account.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div
                      onClick={() => handleChange("accountId", "")}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        !formData.accountId
                          ? "bg-indigo-500/10 border-indigo-500 text-slate-100"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span>No Account Linkage</span>
                      {!formData.accountId && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                    </div>

                    {accounts.map((acc) => (
                      <div
                        key={acc.id}
                        onClick={() => handleChange("accountId", acc.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          formData.accountId === acc.id
                            ? "bg-indigo-500/10 border-indigo-500 text-slate-100"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-200">{acc.name}</div>
                          <div className="text-[11px] text-slate-400">{acc.type} • {acc.currency}</div>
                        </div>
                        {formData.accountId === acc.id && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Review & Collapsed Advanced Section */}
          {step === 4 && (
            <div className="space-y-6 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="font-bold text-slate-100 border-b border-slate-800 pb-2">Loan Summary Review</h3>

                <div className="grid grid-cols-2 gap-3 text-slate-300">
                  <div><span className="text-slate-400">Nickname:</span> <strong className="text-white">{formData.name}</strong></div>
                  <div><span className="text-slate-400">Lender:</span> <strong className="text-white">{formData.lenderName || "—"}</strong></div>
                  <div><span className="text-slate-400">Type:</span> <strong className="text-white">{formData.type}</strong></div>
                  <div><span className="text-slate-400">Interest Rate:</span> <strong className="text-amber-400">{formData.interestRate}% ({formData.interestType})</strong></div>
                  <div><span className="text-slate-400">Remaining Balance:</span> <strong className="text-white">{formatCurrency({ amount: formData.outstandingPrincipal, currency: formData.currency })}</strong></div>
                  <div><span className="text-slate-400">Monthly EMI:</span> <strong className="text-emerald-400">{formatCurrency({ amount: formData.monthlyEmi, currency: formData.currency })}</strong></div>
                  <div><span className="text-slate-400">Remaining Tenure:</span> <strong className="text-white">{formData.remainingTenureMonths} months</strong></div>
                  <div><span className="text-slate-400">Next Due Date:</span> <strong className="text-purple-400">{formData.nextDueDate}</strong></div>
                </div>
              </div>

              {/* Collapsed Advanced Section */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full p-3.5 text-left font-bold text-slate-300 hover:text-white flex items-center justify-between cursor-pointer"
                >
                  <span>Advanced Contract Details (Optional)</span>
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAdvanced && (
                  <div className="p-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Original Principal Amount</label>
                      <input
                        type="number"
                        placeholder="Original sanction amount"
                        value={formData.principalAmount}
                        onChange={(e) => handleChange("principalAmount", e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Loan Account Number</label>
                      <input
                        type="text"
                        placeholder="e.g. LN-889412"
                        value={formData.loanNumber}
                        onChange={(e) => handleChange("loanNumber", e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Original Start Date</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleChange("startDate", e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Loan Purpose / Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Home renovation"
                        value={formData.notes}
                        onChange={(e) => handleChange("notes", e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Controls Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                disabled={step === 1 ? !isStep1Valid : step === 2 ? !isStep2Valid : false}
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={createLoanMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{createLoanMutation.isPending ? "Creating..." : "Save Loan Account"}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
