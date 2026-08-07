import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Eye, Pencil, Copy, Download, Archive, Trash2, ExternalLink } from "lucide-react";
import { Button } from "./Button";

export interface MenuItemOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "danger" | "warning";
  disabled?: boolean;
  onClick: () => void;
}

export interface ActionOverflowMenuProps {
  items: MenuItemOption[];
  ariaLabel?: string;
  align?: "left" | "right";
}

export const ActionOverflowMenu: React.FC<ActionOverflowMenuProps> = ({
  items,
  ariaLabel = "More options",
  align = "right",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const getDefaultIcon = (id: string) => {
    switch (id.toLowerCase()) {
      case "view":
      case "details":
        return <Eye className="w-3.5 h-3.5" />;
      case "edit":
        return <Pencil className="w-3.5 h-3.5" />;
      case "duplicate":
      case "copy":
        return <Copy className="w-3.5 h-3.5" />;
      case "export":
      case "download":
        return <Download className="w-3.5 h-3.5" />;
      case "archive":
        return <Archive className="w-3.5 h-3.5" />;
      case "delete":
      case "remove":
        return <Trash2 className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <ExternalLink className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <Button
        variant="neutral"
        hierarchy="ghost"
        size="icon"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <MoreVertical className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 w-44 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 space-y-0.5 animate-in fade-in-50 zoom-in-95 duration-150 ${
            align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"
          }`}
          role="menu"
        >
          {items.map((item) => {
            const isDanger = item.variant === "danger" || item.id === "delete" || item.id === "remove";
            return (
              <button
                key={item.id}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setIsOpen(false);
                  item.onClick();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDanger
                    ? "text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20"
                    : "text-slate-300 hover:bg-slate-800 hover:text-slate-100 active:bg-slate-800/80"
                }`}
              >
                <span className="shrink-0">{item.icon || getDefaultIcon(item.id)}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActionOverflowMenu;
