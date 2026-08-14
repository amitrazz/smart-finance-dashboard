import React, { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface ContextOption {
  id: string;
  label: string;
  /** One line on what this option shows. Rendered in the list, not in the trigger. */
  hint?: string;
}

interface ContextSelectorProps {
  /** Accessible name, e.g. "Analytics domain". Not rendered unless `showLabel`. */
  label: string;
  value: string;
  options: ContextOption[];
  onChange: (id: string) => void;
  showLabel?: boolean;
  className?: string;
}

/**
 * "Which of these am I looking at" — as a choice, not as a second navigation bar.
 *
 * Nine analytics domains used to occupy a full-width scrolling pill row under
 * the section tabs, which made picking a domain look like navigating to a new
 * place, cost a row of vertical space on every page, and hid options four
 * through nine off the right edge on a laptop.
 *
 * As a listbox, all nine are visible at once with their hints, the trigger states
 * the current domain in one line, and the page below starts a row higher.
 *
 * Implements the listbox keyboard contract in full: arrows move the active
 * option, Enter/Space commits, Escape closes and returns focus, Home/End jump to
 * the ends, and the open list receives focus on the current selection.
 */
export const ContextSelector: React.FC<ContextSelectorProps> = ({
  label,
  value,
  options,
  onChange,
  showLabel = false,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, options.findIndex((o) => o.id === value)),
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const listboxId = useId();
  const labelId = useId();

  const selected = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const commit = (index: number) => {
    onChange(options[index].id);
    close();
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    const last = options.length - 1;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i === last ? 0 : i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i === 0 ? last : i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(last);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(activeIndex);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        close(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {showLabel && (
        <span id={labelId} className="mb-1 block text-[11px] font-medium text-slate-500">
          {label}
        </span>
      )}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={showLabel ? undefined : label}
        aria-labelledby={showLabel ? labelId : undefined}
        onClick={() => {
          setActiveIndex(Math.max(0, options.findIndex((o) => o.id === value)));
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setActiveIndex(Math.max(0, options.findIndex((o) => o.id === value)));
            setOpen(true);
          }
        }}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-left text-sm font-medium text-slate-100 transition-colors hover:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 sm:w-56"
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          className="absolute left-0 z-50 mt-1 max-h-[22rem] w-full min-w-[16rem] overflow-y-auto rounded-lg border border-slate-800 bg-slate-900 p-1 shadow-2xl sm:w-72"
        >
          {options.map((option, index) => {
            const isSelected = option.id === value;
            return (
              <li
                key={option.id}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                onClick={() => commit(index)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex cursor-pointer items-start gap-2 rounded-md px-2.5 py-2 text-left focus:outline-none ${
                  index === activeIndex ? "bg-slate-800" : ""
                }`}
              >
                <Check
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                    isSelected ? "text-sky-400" : "text-transparent"
                  }`}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span
                    className={`block text-xs font-medium ${
                      isSelected ? "text-slate-100" : "text-slate-300"
                    }`}
                  >
                    {option.label}
                  </span>
                  {option.hint && (
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
                      {option.hint}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
