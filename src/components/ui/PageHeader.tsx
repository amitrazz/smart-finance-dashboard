import React from "react";
import { Button, ButtonProps } from "./Button";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  /** Primary Action object */
  primaryAction?: {
    label: string;
    onClick: () => void;
    leftIcon?: React.ReactNode;
    isLoading?: boolean;
    loadingText?: string;
    variant?: ButtonProps["variant"];
    disabled?: boolean;
  };
  /** Secondary Actions */
  secondaryActions?: Array<{
    id: string;
    label: string;
    onClick: () => void;
    leftIcon?: React.ReactNode;
    variant?: ButtonProps["variant"];
  }>;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  primaryAction,
  secondaryActions,
  children,
}) => {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Action Group: Desktop Top-Right */}
        {(primaryAction || secondaryActions) && (
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {secondaryActions?.map((sec) => (
              <Button
                key={sec.id}
                variant={sec.variant || "neutral"}
                hierarchy="outline"
                size="md"
                leftIcon={sec.leftIcon}
                onClick={sec.onClick}
              >
                {sec.label}
              </Button>
            ))}
            {primaryAction && (
              <Button
                variant={primaryAction.variant || "primary"}
                hierarchy="filled"
                size="md"
                leftIcon={primaryAction.leftIcon}
                isLoading={primaryAction.isLoading}
                loadingText={primaryAction.loadingText}
                disabled={primaryAction.disabled}
                onClick={primaryAction.onClick}
              >
                {primaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>

      {children}

      {/* Action Group: Mobile Sticky Bottom CTA */}
      {primaryAction && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800 flex items-center justify-end gap-3 shadow-2xl">
          {secondaryActions?.map((sec) => (
            <Button
              key={sec.id}
              variant={sec.variant || "neutral"}
              hierarchy="outline"
              size="md"
              leftIcon={sec.leftIcon}
              onClick={sec.onClick}
              className="flex-1"
            >
              {sec.label}
            </Button>
          ))}
          <Button
            variant={primaryAction.variant || "primary"}
            hierarchy="filled"
            size="md"
            fullWidth={!secondaryActions?.length}
            leftIcon={primaryAction.leftIcon}
            isLoading={primaryAction.isLoading}
            loadingText={primaryAction.loadingText}
            disabled={primaryAction.disabled}
            onClick={primaryAction.onClick}
            className={secondaryActions?.length ? "flex-1" : ""}
          >
            {primaryAction.label}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PageHeader;
