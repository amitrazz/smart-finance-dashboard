import React from "react";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type ButtonVariant = "primary" | "success" | "warning" | "danger" | "neutral" | "info";
export type ButtonHierarchy = "filled" | "outline" | "ghost" | "text";
export type ButtonSize = "lg" | "md" | "sm" | "icon" | "fab";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The semantic intent of the action */
  variant?: ButtonVariant;
  /** Visual weight in the hierarchy */
  hierarchy?: ButtonHierarchy;
  /** Size variant */
  size?: ButtonSize;
  /** Whether the action is in progress */
  isLoading?: boolean;
  /** Progress label shown during loading, e.g. "Saving..." */
  loadingText?: string;
  /** Icon component rendered before label */
  leftIcon?: React.ReactNode;
  /** Icon component rendered after label */
  rightIcon?: React.ReactNode;
  /** Expand button to 100% of parent width */
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      hierarchy = "filled",
      size = "md",
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      type = "button",
      className,
      ...props
    },
    ref
  ) => {
    // ------------------------------------------------------------------------
    // Variant + Hierarchy Base Matrix
    // ------------------------------------------------------------------------
    const variantStyles: Record<ButtonVariant, Record<ButtonHierarchy, string>> = {
      primary: {
        filled:
          "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-lg shadow-blue-600/20 border border-blue-500/30 focus-visible:ring-blue-500",
        outline:
          "border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 active:bg-blue-500/20 focus-visible:ring-blue-500",
        ghost:
          "text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 active:bg-blue-500/20 focus-visible:ring-blue-500",
        text:
          "text-blue-400 hover:text-blue-300 hover:underline p-0 focus-visible:ring-blue-500",
      },
      success: {
        filled:
          "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 border border-emerald-500/30 focus-visible:ring-emerald-500",
        outline:
          "border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 active:bg-emerald-500/20 focus-visible:ring-emerald-500",
        ghost:
          "text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 active:bg-emerald-500/20 focus-visible:ring-emerald-500",
        text:
          "text-emerald-400 hover:text-emerald-300 hover:underline p-0 focus-visible:ring-emerald-500",
      },
      warning: {
        filled:
          "bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white shadow-lg shadow-amber-600/20 border border-amber-500/30 focus-visible:ring-amber-500",
        outline:
          "border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 active:bg-amber-500/20 focus-visible:ring-amber-500",
        ghost:
          "text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 active:bg-amber-500/20 focus-visible:ring-amber-500",
        text:
          "text-amber-400 hover:text-amber-300 hover:underline p-0 focus-visible:ring-amber-500",
      },
      danger: {
        filled:
          "bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-lg shadow-rose-600/20 border border-rose-500/30 focus-visible:ring-rose-500",
        outline:
          "border border-rose-500/50 text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20 focus-visible:ring-rose-500",
        ghost:
          "text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 active:bg-rose-500/20 focus-visible:ring-rose-500",
        text:
          "text-rose-400 hover:text-rose-300 hover:underline p-0 focus-visible:ring-rose-500",
      },
      neutral: {
        filled:
          "bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 shadow-md border border-slate-700/60 focus-visible:ring-slate-400",
        outline:
          "border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100 active:bg-slate-800/80 focus-visible:ring-slate-400",
        ghost:
          "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 active:bg-slate-800 focus-visible:ring-slate-400",
        text:
          "text-slate-400 hover:text-slate-200 hover:underline p-0 focus-visible:ring-slate-400",
      },
      info: {
        filled:
          "bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white shadow-lg shadow-sky-600/20 border border-sky-500/30 focus-visible:ring-sky-400",
        outline:
          "border border-sky-500/50 text-sky-400 hover:bg-sky-500/10 active:bg-sky-500/20 focus-visible:ring-sky-400",
        ghost:
          "text-sky-400 hover:bg-sky-500/10 hover:text-sky-300 active:bg-sky-500/20 focus-visible:ring-sky-400",
        text:
          "text-sky-400 hover:text-sky-300 hover:underline p-0 focus-visible:ring-sky-400",
      },
    };

    // ------------------------------------------------------------------------
    // Size Classes Matrix
    // ------------------------------------------------------------------------
    const sizeStyles: Record<ButtonSize, string> = {
      lg: "h-11 px-5 text-sm font-semibold rounded-2xl gap-2.5 min-h-[44px]",
      md: "h-9 px-4 text-xs font-semibold rounded-xl gap-2 min-h-[38px] sm:min-h-[36px]",
      sm: "h-7.5 px-3 text-xs font-medium rounded-lg gap-1.5 min-h-[32px]",
      icon: "h-9 w-9 p-0 rounded-xl justify-center items-center shrink-0 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]",
      fab: "h-12 px-5 text-sm font-bold rounded-full gap-2.5 shadow-2xl min-h-[48px]",
    };

    const isDisabled = disabled || isLoading;

    const baseClasses = clsx(
      "inline-flex items-center justify-center font-sans tracking-wide transition-all duration-150 ease-in-out cursor-pointer select-none",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
      "active:scale-[0.98]",
      isDisabled && "opacity-50 pointer-events-none cursor-not-allowed active:scale-100 shadow-none",
      fullWidth && "w-full",
      sizeStyles[size],
      hierarchy !== "text" && variantStyles[variant][hierarchy],
      hierarchy === "text" && variantStyles[variant].text,
      className
    );

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        className={twMerge(baseClasses)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            <span>{loadingText || children || "Loading..."}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children && <span>{children}</span>}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
