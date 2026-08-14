/**
 * Semantic tone — what a figure *means*, never which module it came from.
 *
 * Two rules follow from this, and the whole workspace depends on both:
 *
 * 1. **Direction is not meaning.** Up is good for net worth and bad for debt;
 *    down is good for spending and bad for income. Every caller states
 *    `upIsGood` and lets `directionalTone` decide the colour, so no component
 *    has to remember the polarity of the domain it happens to be rendering.
 *
 * 2. **Colour is never the only carrier.** Tone always accompanies a sign, a
 *    word or an arrow. Nothing here is legible only to someone who can
 *    distinguish emerald from rose.
 *
 * The brand accent is deliberately absent. Emerald means "this improved", not
 * "this is pFOS" — the moment the accent doubles as a financial signal, a
 * decorative highlight starts reading as good news.
 */
export type Tone = "positive" | "negative" | "warning" | "info" | "neutral";

/** Value text. */
export const TONE_TEXT: Record<Tone, string> = {
  positive: "text-emerald-400",
  negative: "text-rose-400",
  warning: "text-amber-400",
  info: "text-sky-400",
  neutral: "text-slate-400",
};

/** Small labelled pill. */
export const TONE_CHIP: Record<Tone, string> = {
  positive: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  negative: "border-rose-500/25 bg-rose-500/10 text-rose-300",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  info: "border-sky-500/25 bg-sky-500/10 text-sky-300",
  neutral: "border-slate-700 bg-slate-800/60 text-slate-300",
};

/**
 * Left rule on a card. Severity survives greyscale printing as a position and a
 * label, so the rule is reinforcement rather than the signal itself.
 */
export const TONE_RULE: Record<Tone, string> = {
  positive: "border-l-emerald-500/70",
  negative: "border-l-rose-500/70",
  warning: "border-l-amber-500/70",
  info: "border-l-sky-500/70",
  neutral: "border-l-slate-700",
};

/** Fill for bars, dots and flow segments. */
export const TONE_FILL: Record<Tone, string> = {
  positive: "bg-emerald-500",
  negative: "bg-rose-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
  neutral: "bg-slate-600",
};

/** Chart stroke/fill hexes, so SVG and DOM never drift apart. */
export const TONE_HEX: Record<Tone, string> = {
  positive: "#34d399",
  negative: "#fb7185",
  warning: "#fbbf24",
  info: "#38bdf8",
  neutral: "#64748b",
};

/**
 * Turns a movement into a tone, given the polarity of the measure.
 *
 * `null`/`0` is neutral, not positive: no movement is not an improvement, and
 * an unknown movement is not a movement.
 */
export function directionalTone(
  value: number | null | undefined,
  upIsGood: boolean,
): Tone {
  if (value === null || value === undefined || value === 0) return "neutral";
  return value > 0 === upIsGood ? "positive" : "negative";
}
