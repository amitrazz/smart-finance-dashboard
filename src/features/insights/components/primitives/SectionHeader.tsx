import React from "react";
import { ArrowRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  /** One line on what this section answers. Sections state; they don't lecture. */
  description?: string;
  /** Handoff to the module that owns this domain. */
  link?: { label: string; onClick: () => void };
  /** Filters, selectors or a count — anything that belongs beside the title. */
  actions?: React.ReactNode;
  id?: string;
  as?: "h2" | "h3";
  className?: string;
}

/**
 * One heading treatment for the whole workspace.
 *
 * Deliberately quiet: `text-sm` semibold, not the bold `text-base` the old
 * panels used. A section title is a signpost, and it was competing with the
 * figures underneath it for first read. The handoff link is slate until hover
 * for the same reason — nine emerald "View all →" links on one page taught the
 * eye to look at navigation instead of at money.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  link,
  actions,
  id,
  as: Heading = "h2",
  className = "",
}) => (
  <div className={`flex flex-wrap items-start justify-between gap-x-4 gap-y-2 ${className}`}>
    <div className="min-w-0 space-y-1">
      <Heading id={id} className="text-sm font-semibold tracking-tight text-slate-100">
        {title}
      </Heading>
      {description && (
        <p className="max-w-2xl text-xs leading-relaxed text-slate-500">{description}</p>
      )}
    </div>

    {(actions || link) && (
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        {link && (
          <button
            type="button"
            onClick={link.onClick}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
          >
            {link.label}
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
      </div>
    )}
  </div>
);
