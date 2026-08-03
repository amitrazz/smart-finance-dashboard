import React, { useEffect, useRef, useState } from "react";
import { Building2, ChevronDown, Loader2, X } from "lucide-react";
import { useInstitutions } from "../../hooks/useFinanceQueries";
import { FinancialInstitution } from "../../types";

interface InstitutionPickerProps {
  value?: string;
  valueLabel?: string;
  onChange: (institutionId: string | undefined, institution?: FinancialInstitution) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Searchable institution combobox backed by GET /finance/institutions?search=&limit=100
 * (useInstitutions). Used everywhere an institution/lender/issuer needs to be
 * selected — account, credit card, and loan create/edit forms — instead of a
 * plain <select> (which silently truncates once there are more institutions
 * than fit inline) or a hardcoded quick-pick list.
 */
export const InstitutionPicker: React.FC<InstitutionPickerProps> = ({
  value,
  valueLabel,
  onChange,
  placeholder = "Search banks, brokers, institutions…",
  disabled,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data: institutions = [], isFetching } = useInstitutions({
    search: debouncedQuery || undefined,
    limit: 100,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (inst: FinancialInstitution) => {
    onChange(inst.id, inst);
    setQuery("");
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined, undefined);
    setQuery("");
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={id ? `${id}-listbox` : undefined}
        className={`flex items-center gap-2 w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-sm transition-colors cursor-text ${
          isOpen ? "border-emerald-500" : "border-slate-800"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
        {isOpen ? (
          <input
            id={id}
            autoFocus
            type="text"
            disabled={disabled}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={valueLabel || placeholder}
            className="flex-1 min-w-0 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        ) : (
          <span className={`flex-1 min-w-0 truncate ${valueLabel ? "text-slate-100" : "text-slate-500"}`}>
            {valueLabel || placeholder}
          </span>
        )}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear institution selection"
            className="p-0.5 rounded text-slate-500 hover:text-slate-300 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {isFetching ? (
          <Loader2 className="w-4 h-4 text-slate-500 animate-spin shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
        )}
      </div>

      {isOpen && !disabled && (
        <ul
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="absolute z-20 mt-1.5 w-full max-h-64 overflow-y-auto rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5"
        >
          {institutions.length === 0 ? (
            <li className="px-3.5 py-3 text-xs text-slate-500">
              {isFetching ? "Searching…" : "No matching institutions"}
            </li>
          ) : (
            institutions.map((inst) => (
              <li key={inst.id} role="option" aria-selected={inst.id === value}>
                <button
                  type="button"
                  onClick={() => handleSelect(inst)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors ${
                    inst.id === value
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-slate-200 hover:bg-slate-800/70"
                  }`}
                >
                  {inst.logoUrl ? (
                    <img src={inst.logoUrl} alt="" className="w-5 h-5 rounded object-contain shrink-0" />
                  ) : (
                    <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <span className="truncate">{inst.name}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default InstitutionPicker;
