import React, { useState } from "react";
import { X, Building2, CheckCircle2 } from "lucide-react";
import { useCreateInstitution } from "../../../hooks/useFinanceQueries";

interface AddInstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddInstitutionModal: React.FC<AddInstitutionModalProps> = ({ isOpen, onClose }) => {
  const createInstitutionMutation = useCreateInstitution();

  const [name, setName] = useState("");
  const [type, setType] = useState("BANK");
  const [countryCode, setCountryCode] = useState("IN");
  const [logoUrl, setLogoUrl] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createInstitutionMutation.mutate(
      {
        name,
        type,
        countryCode,
        logoUrl: logoUrl || undefined,
      },
      {
        onSuccess: () => {
          onClose();
          setName("");
          setLogoUrl("");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Add Financial Institution</h3>
              <p className="text-xs text-slate-400">Create a new bank, brokerage, or financial institution entity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createInstitutionMutation.isError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            {(createInstitutionMutation.error as Error)?.message || "Failed to create institution. Please try again."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Institution Name</label>
            <input
              type="text"
              required
              placeholder="e.g. My Local Co-operative Bank"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Institution Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="BANK">Bank</option>
                <option value="BROKER">Stock Broker</option>
                <option value="NBFC">NBFC / Lender</option>
                <option value="CREDIT_CARD">Credit Card Issuer</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Country Code</label>
              <input
                type="text"
                required
                maxLength={2}
                placeholder="IN"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 uppercase placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Logo URL (Optional)</label>
            <input
              type="url"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createInstitutionMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
            >
              {createInstitutionMutation.isPending ? "Creating..." : <><CheckCircle2 className="w-4 h-4" /> Save Institution</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
