import React, { useState } from "react";
import {
  useSelfIdentifiers,
  useCreateSelfIdentifier,
  useToggleSelfIdentifier,
} from "../../hooks/useFinanceQueries";
import { Fingerprint, PlusCircle, RefreshCw } from "lucide-react";

// Lets a user register their own UPI VPAs so a self-transfer (money moving
// between two of their own accounts, e.g. via UPI) is recognized on import
// and categorized "Transfer" instead of counting as income/expense — even
// when the other account was never added to pFOS, which is the one case
// TransferExecutionService's transfer-pair linking can't catch on its own.
export const SelfIdentifiersCard: React.FC = () => {
  const { data: identifiers = [], isLoading } = useSelfIdentifiers();
  const createMutation = useCreateSelfIdentifier();
  const toggleMutation = useToggleSelfIdentifier();

  const [vpa, setVpa] = useState("");
  const [label, setLabel] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = vpa.trim();
    if (!trimmed) return;
    createMutation.mutate(
      { vpa: trimmed, label: label.trim() || undefined },
      {
        onSuccess: () => {
          setVpa("");
          setLabel("");
        },
      },
    );
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
      <div>
        <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-cyan-400" /> Self-Transfer UPI IDs
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Register your own UPI VPA — or just your phone number/handle with no "@" to cover every
          UPI app it's used on at once (the same number gets a different VPA per app). A bank
          statement import whose narration matches one of these is filed as an internal transfer,
          not income or spend.
        </p>
      </div>

      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">VPA or phone number</label>
          <input
            type="text"
            value={vpa}
            onChange={(e) => setVpa(e.target.value)}
            placeholder="9663581090@pzw or 9663581090"
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none placeholder:text-slate-600"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Label (optional)</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="My HDFC UPI"
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none placeholder:text-slate-600"
          />
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending || !vpa.trim()}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createMutation.isPending ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <PlusCircle className="w-3.5 h-3.5" />
          )}
          Register
        </button>
      </form>

      <div className="space-y-2 pt-1">
        {isLoading ? (
          <div className="h-10 bg-slate-800/50 rounded-xl animate-pulse" />
        ) : identifiers.length === 0 ? (
          <p className="text-xs text-slate-500">
            No self-transfer VPAs registered yet — every UPI credit currently counts toward income
            unless it's already categorized as a transfer.
          </p>
        ) : (
          identifiers.map((identifier) => (
            <div
              key={identifier.id}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 border border-slate-800"
            >
              <div className="min-w-0">
                <p className="text-sm font-mono text-slate-200 truncate">{identifier.vpa}</p>
                {identifier.label && (
                  <p className="text-[11px] text-slate-500 truncate">{identifier.label}</p>
                )}
              </div>
              {/* Status label and the toggle action are visually and
                  semantically separate — a clickable pill that reads
                  "Active" is easy to misread as "click to confirm/activate"
                  when it actually disables on click. */}
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[11px] font-bold ${
                    identifier.enabled ? "text-emerald-300" : "text-slate-500"
                  }`}
                >
                  {identifier.enabled ? "Active" : "Disabled"}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={identifier.enabled}
                  aria-label={
                    identifier.enabled
                      ? `Disable self-transfer identifier ${identifier.vpa}`
                      : `Enable self-transfer identifier ${identifier.vpa}`
                  }
                  title={identifier.enabled ? "Turn off" : "Turn on"}
                  onClick={() =>
                    toggleMutation.mutate({ id: identifier.id, enabled: !identifier.enabled })
                  }
                  disabled={toggleMutation.isPending}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    identifier.enabled ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      identifier.enabled ? "translate-x-[18px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
