import React from "react";
import { X, ChevronRight } from "lucide-react";
import { useUIStore } from "../../../store/useUIStore";

export interface NavCategoryConfig {
  id: string;
  label: string;
  defaultSubTab: string;
  icon: React.FC<{ className?: string }>;
  subTabs: { id: string; label: string }[];
}

interface InvestmentsMobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: NavCategoryConfig[];
  currentSubTab: string;
}

export const InvestmentsMobileNavDrawer: React.FC<InvestmentsMobileNavDrawerProps> = ({
  isOpen,
  onClose,
  categories,
  currentSubTab,
}) => {
  const { setActiveSubTab } = useUIStore();

  if (!isOpen) return null;

  const handleSubTabSelect = (subTabId: string) => {
    setActiveSubTab(subTabId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100">Investments Navigation</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 overflow-y-auto space-y-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isCatActive = cat.subTabs.some((s) => s.id === currentSubTab);

            return (
              <div key={cat.id} className="space-y-1.5">
                <div
                  onClick={() => handleSubTabSelect(cat.defaultSubTab)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors ${
                    isCatActive ? "bg-indigo-600/10 text-indigo-300 font-bold border border-indigo-500/20" : "bg-slate-950/60 text-slate-300 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs">{cat.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>

                {/* Sub-items */}
                <div className="pl-6 space-y-1">
                  {cat.subTabs.map((sub) => {
                    const isSubActive = currentSubTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleSubTabSelect(sub.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          isSubActive
                            ? "text-emerald-400 font-bold bg-emerald-500/10"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                        }`}
                      >
                        • {sub.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
