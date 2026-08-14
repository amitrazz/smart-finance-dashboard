/**
 * Shared Recharts configuration.
 *
 * Lives apart from the chart components so every plot in the workspace reads
 * from one axis and grid definition — the previous charts each re-declared
 * their own stroke colours, tick sizes and ₹-formatting, and had drifted.
 */
import { useReducedMotion } from "framer-motion";
import { useUIStore } from "../../../../store/useUIStore";

/**
 * Recharts' entry animations, honouring the OS setting.
 *
 * Every series in the workspace spreads these, so "reduced motion" covers the
 * charts as well as the page transitions — a 1.5s line-draw is exactly the kind
 * of motion the setting exists to suppress, and it is also why a chart can look
 * empty for the first second on a slow machine.
 */
export function useChartAnimation() {
  const prefersReducedMotion = useReducedMotion();
  return {
    isAnimationActive: !prefersReducedMotion,
    animationDuration: prefersReducedMotion ? 0 : 600,
  } as const;
}

export const CHART_AXIS = {
  stroke: "#475569",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

export const CHART_GRID = {
  stroke: "#1e293b",
  strokeDasharray: "3 3",
  vertical: false,
} as const;

/** Compact Indian-numbering axis labels. Masked whenever privacy mode is on. */
export function useCompactMoneyAxis(currency = "INR") {
  const moneyVisible = useUIStore((s) => s.moneyVisible);
  return (value: number) => {
    if (!moneyVisible) return "•••";
    const symbol = currency === "INR" ? "₹" : "";
    const abs = Math.abs(value);
    const sign = value < 0 ? "−" : "";
    if (abs >= 1e7) return `${sign}${symbol}${(abs / 1e7).toFixed(1)}Cr`;
    if (abs >= 1e5) return `${sign}${symbol}${(abs / 1e5).toFixed(1)}L`;
    if (abs >= 1e3) return `${sign}${symbol}${Math.round(abs / 1e3)}k`;
    return `${sign}${symbol}${abs}`;
  };
}
