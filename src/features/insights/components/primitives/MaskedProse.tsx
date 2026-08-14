import React from "react";
import { useUIStore } from "../../../../store/useUIStore";
import { maskAmountsInProse } from "../../utils/maskAmounts";

/**
 * Backend prose, rendered inside privacy mode.
 *
 * Rule explanations and suggested actions are sentences with amounts already
 * formatted into them, so they cannot go through `<Money>`. This is the seam
 * where they join the privacy layer instead. See `maskAmountsInProse` for what
 * is masked and what is deliberately left alone.
 */
export const MaskedProse: React.FC<{ text: string; className?: string }> = ({
  text,
  className = "",
}) => {
  const moneyVisible = useUIStore((s) => s.moneyVisible);
  return <span className={className}>{moneyVisible ? text : maskAmountsInProse(text)}</span>;
};
