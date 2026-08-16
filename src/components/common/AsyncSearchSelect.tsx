import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2, X } from "lucide-react";

interface AsyncSearchSelectProps<T> {
  id?: string;
  value?: string;
  valueLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  items: T[];
  isFetching?: boolean;
  onSearch: (debouncedQuery: string) => void;
  onSelect: (item: T) => void;
  onClear?: () => void;
  getOptionKey: (item: T) => string;
  renderOption: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

/**
 * Generic searchable combobox for API-backed "pick one" dropdowns
 * (accounts, categories, merchants, goals, budgets, ...). Debounces input
 * 250ms before calling `onSearch`, which the caller feeds into its own
 * `useX({ search })` React Query hook — this component only owns the
 * open/closed + typed-query UI, not the fetch itself. Extracted from
 * InstitutionPicker, which now wraps this instead of duplicating it.
 */
export function AsyncSearchSelect<T>({
  id,
  value,
  valueLabel,
  placeholder = "Search…",
  disabled,
  icon,
  items,
  isFetching,
  onSearch,
  onSelect,
  onClear,
  getOptionKey,
  renderOption,
  emptyMessage = "No matches",
}: AsyncSearchSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => onSearch(query.trim()), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: T) => {
    onSelect(item);
    setQuery("");
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear?.();
    setQuery("");
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={id ? `${id}-listbox` : undefined}
        aria-labelledby={id ? `${id}-label` : undefined}
        className={`flex items-center gap-2 w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-sm transition-colors cursor-text ${
          isOpen ? "border-emerald-500" : "border-slate-800"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={() => !disabled && setIsOpen(true)}
      >
        {icon}
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
        {value && onClear && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear selection"
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
          {items.length === 0 ? (
            <li className="px-3.5 py-3 text-xs text-slate-500">{isFetching ? "Searching…" : emptyMessage}</li>
          ) : (
            items.map((item) => {
              const key = getOptionKey(item);
              return (
                <li key={key} role="option" aria-selected={key === value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors ${
                      key === value
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "text-slate-200 hover:bg-slate-800/70"
                    }`}
                  >
                    {renderOption(item)}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

export default AsyncSearchSelect;
