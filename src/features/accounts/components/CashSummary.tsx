import React from "react";

import { Account, CreditCard as CreditCardType, Money } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";
import {
  DollarSign, Landmark, Wallet, ShieldAlert, CreditCard,
} from "lucide-react";

interface CashSummaryProps {
  accounts: Account[];
  creditCards?: CreditCardType[];
}

const moneyToNumber = (v?: Money | string | number): number => {
  if (v == null) return 0;
  if (typeof v === "object") return parseFloat(v.amount || "0") || 0;
  return parseFloat(String(v)) || 0;
};

export const CashSummary: React.FC<CashSummaryProps> = ({ accounts, creditCards = [] }) => {
  // Credit cards are a separate backend resource (`/finance/credit-cards`) — they are
  // never returned by `/finance/accounts`, so outstanding balance must come from the
  // dedicated credit card list rather than filtering `accounts` by type.
  const liquid = accounts.filter((a) => ["CHECKING", "SAVINGS", "CASH", "WALLET"].includes(a.type));

  const totalLiquid = liquid.reduce((s, a) => s + parseFloat(a.currentBalance?.amount || "0"), 0);
  const totalCredit = creditCards.reduce((s, c) => s + moneyToNumber(c.currentOutstanding), 0);
  const netCash = totalLiquid - totalCredit;

  const items = [
    {
      label: "Total Liquid Cash",
      value: formatCurrency(totalLiquid, "INR"),
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
      accent: "text-emerald-400",
    },
    {
      label: "Bank Accounts",
      value: `${accounts.filter((a) => ["CHECKING", "SAVINGS"].includes(a.type)).length} accounts`,
      icon: <Landmark className="w-5 h-5 text-indigo-400" />,
      accent: "text-indigo-400",
    },
    {
      label: "Wallets & Cash",
      value: formatCurrency(
        accounts.filter((a) => a.type === "WALLET" || a.type === "CASH").reduce((s, a) => s + parseFloat(a.currentBalance?.amount || "0"), 0),
        "INR"
      ),
      icon: <Wallet className="w-5 h-5 text-amber-400" />,
      accent: "text-amber-400",
    },
    {
      label: "Credit Outstanding",
      value: formatCurrency(totalCredit, "INR"),
      icon: <CreditCard className="w-5 h-5 text-purple-400" />,
      accent: "text-purple-400",
    },
    {
      label: "Net Cash Position",
      value: formatCurrency(netCash, "INR"),
      icon: <ShieldAlert className={`w-5 h-5 ${netCash >= 0 ? "text-emerald-400" : "text-rose-400"}`} />,
      accent: netCash >= 0 ? "text-emerald-400" : "text-rose-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 backdrop-blur-xl transition-colors space-y-3"
        >
          <div className="p-2.5 rounded-xl bg-slate-800/80 w-fit">{item.icon}</div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide leading-tight">{item.label}</p>
            <p className={`text-sm font-extrabold mt-0.5 ${item.accent}`}>{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
