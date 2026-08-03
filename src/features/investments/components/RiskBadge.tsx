import React from "react";
import { ShieldAlert, ShieldCheck, Shield } from "lucide-react";
import { RiskMetric, RiskLevel } from "../types/investmentTypes";

interface RiskBadgeProps {
  riskScore?: number;
  category?: RiskMetric["riskCategory"] | RiskLevel;
  size?: "sm" | "md" | "lg";
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ riskScore, category, size = "md" }) => {
  let badgeColor = "bg-slate-800 text-slate-300 border-slate-700";
  let Icon = Shield;
  let label = category || "Moderate";

  const catStr = String(category || "").toUpperCase();

  if (riskScore !== undefined) {
    if (riskScore < 35) {
      badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      Icon = ShieldCheck;
      label = `Low Risk (${riskScore}/100)`;
    } else if (riskScore < 70) {
      badgeColor = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      Icon = Shield;
      label = `Balanced Risk (${riskScore}/100)`;
    } else {
      badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
      Icon = ShieldAlert;
      label = `High Risk (${riskScore}/100)`;
    }
  } else if (catStr.includes("CONSERVATIVE") || catStr.includes("LOW")) {
    badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    Icon = ShieldCheck;
  } else if (catStr.includes("HIGH") || catStr.includes("AGGRESSIVE")) {
    badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    Icon = ShieldAlert;
  }

  const sizeClass =
    size === "sm"
      ? "text-[10px] px-2 py-0.5"
      : size === "lg"
        ? "text-xs px-3 py-1.5 font-bold"
        : "text-xs px-2.5 py-1 font-semibold";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${badgeColor} ${sizeClass}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
};
