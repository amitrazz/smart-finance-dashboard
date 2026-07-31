import React, { useState } from "react";
import { X, TrendingUp, CheckCircle2 } from "lucide-react";
import { useCreateTrade } from "../../../hooks/useFinanceQueries";

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTradeModal: React.FC<AddTradeModalProps> = ({ isOpen, onClose }) => {
  const createTradeMutation = useCreateTrade();

  const [symbol, setSymbol] = useState("");
  const [securityName, setSecurityName] = useState("");
  const [isin, setIsin] = useState("");
  const [assetClass, setAssetClass] = useState("EQUITY");
  const [exchangeCode, setExchangeCode] = useState("NSE");
  const [currency, setCurrency] = useState("INR");
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [fees, setFees] = useState("0.00");
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().split("T")[0]);

  if (!isOpen) return null;

  const totalAmount = (parseFloat(quantity || "0") * parseFloat(price || "0")).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTradeMutation.mutate(
      {
        symbol: symbol.toUpperCase(),
        securityName,
        isin,
        assetClass,
        exchangeCode,
        currency,
        type,
        quantity: parseFloat(quantity) || 0,
        price: { amount: price, currency },
        totalAmount: { amount: totalAmount, currency },
        amount: totalAmount,
        fees,
        tradeDate,
      } as unknown as Partial<import("../../../types").Trade>,
      {
        onSuccess: () => {
          onClose();
          setSymbol("");
          setSecurityName("");
          setIsin("");
          setQuantity("");
          setPrice("");
          setFees("0.00");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Record Investment Trade</h3>
              <p className="text-xs text-slate-400">Manual buy/sell entry for equities, MFs, and holdings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createTradeMutation.isError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            {(createTradeMutation.error as Error)?.message || "Failed to record trade. Please try again."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Trade Type</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setType("BUY")}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    type === "BUY" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setType("SELL")}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    type === "SELL" ? "bg-rose-500 text-white shadow" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  SELL
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Asset Class</label>
              <select
                value={assetClass}
                onChange={(e) => setAssetClass(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="EQUITY">Equity</option>
                <option value="MUTUAL_FUND">Mutual Fund</option>
                <option value="GOLD">Gold / SGB</option>
                <option value="FIXED_INCOME">Fixed Income</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Symbol</label>
              <input
                type="text"
                required
                placeholder="e.g. INFY"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 uppercase placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">ISIN (Optional)</label>
              <input
                type="text"
                placeholder="e.g. INF209K01157"
                value={isin}
                onChange={(e) => setIsin(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Security / Fund Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Infosys Limited"
              value={securityName}
              onChange={(e) => setSecurityName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Exchange</label>
              <input
                type="text"
                placeholder="NSE"
                value={exchangeCode}
                onChange={(e) => setExchangeCode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
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
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Trade Date</label>
              <input
                type="date"
                required
                value={tradeDate}
                onChange={(e) => setTradeDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Quantity</label>
              <input
                type="number"
                step="any"
                required
                placeholder="10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Price / Unit</label>
              <input
                type="number"
                step="any"
                required
                placeholder="1500.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fees & Taxes</label>
              <input
                type="number"
                step="any"
                placeholder="20.00"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Computed Total Amount:</span>
            <span className="text-sm font-bold text-slate-100">{currency} {totalAmount}</span>
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
              disabled={createTradeMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
            >
              {createTradeMutation.isPending ? "Submitting..." : <><CheckCircle2 className="w-4 h-4" /> Save Trade</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
