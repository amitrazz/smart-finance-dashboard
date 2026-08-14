import React from "react";

type SurfaceLevel = "flat" | "raised" | "inset";

interface SurfaceProps {
  level?: SurfaceLevel;
  className?: string;
  children: React.ReactNode;
}

/**
 * The only container in the workspace.
 *
 * The previous chrome had four visually distinct box treatments — glass panels
 * with `backdrop-blur-xl` and `shadow-xl`, gradient-accented KPI tiles,
 * `rounded-3xl` sections and `rounded-2xl` rows — often nested two or three
 * deep. Every one of them competed with the number inside it, and a card inside
 * a card inside a panel gave the reader three borders to parse before reaching a
 * figure.
 *
 * Three levels replace all of it, and they are allowed to nest exactly once:
 *
 * - `flat`    — the default page-level container. A hairline and nothing else.
 * - `raised`  — for the one thing on a page that should read first.
 * - `inset`   — a row or tile *inside* a `flat`. Never contains another Surface.
 *
 * No gradients, no blur, no glow. Hierarchy comes from type and space.
 */
const LEVELS: Record<SurfaceLevel, string> = {
  flat: "rounded-xl border border-slate-800/80 bg-slate-900/40",
  raised: "rounded-xl border border-slate-800 bg-slate-900/80",
  inset: "rounded-lg border border-slate-800/60 bg-slate-950/40",
};

export const Surface: React.FC<SurfaceProps> = ({
  level = "flat",
  className = "",
  children,
}) => <div className={`${LEVELS[level]} ${className}`}>{children}</div>;
