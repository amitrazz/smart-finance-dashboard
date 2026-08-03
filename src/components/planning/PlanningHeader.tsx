import React from "react";
import { ChevronRight } from "lucide-react";

interface PlanningHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string[];
  actions?: React.ReactNode;
}

export const PlanningHeader: React.FC<PlanningHeaderProps> = ({ title, subtitle, breadcrumb, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="space-y-1 min-w-0">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3" aria-hidden="true" />}
              <span className={i === breadcrumb.length - 1 ? "text-slate-300" : ""}>{crumb}</span>
            </span>
          ))}
        </nav>
      )}
      <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight truncate">{title}</h1>
      {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

export default PlanningHeader;
