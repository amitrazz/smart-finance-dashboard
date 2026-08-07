/**
 * navTabTokens — CSS variable-backed Tailwind class strings for navigation
 * tab / filter pill / view toggle selected states.
 *
 * These map to the `--nav-tab-*` CSS custom properties defined in theme.css
 * and registered as Tailwind color utilities in tailwind.config.js.
 *
 * Usage:
 *   import { NAV_TAB_L2 } from "@/styles/navTabTokens";
 *   className={`... ${isActive ? NAV_TAB_L2 : "text-slate-400 ..."}`}
 *
 * To retheme all tabs app-wide: update --nav-tab-l2-* variables in theme.css.
 *
 * Level 1 (primary sub-nav solid pill) uses inline Tailwind utilities:
 *   bg-nav-tab-l1-bg text-nav-tab-l1-fg shadow-nav-tab-l1-shadow
 */

/** Level 2 — Detail tabs, view toggles, and filter pills (translucent outline) */
export const NAV_TAB_L2 =
  "bg-nav-tab-l2-bg text-nav-tab-l2-fg border border-nav-tab-l2-border shadow-sm";
