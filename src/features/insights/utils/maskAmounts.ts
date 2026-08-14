/**
 * Amounts a rule wrote into a sentence, masked with everything else.
 *
 * Found in visual QA of privacy mode: every *rendered* figure masked correctly,
 * and then a card underneath read "Interest charged was ₹3,870 against a
 * 3-month average of ₹3,120". Backend explanations arrive as prose with the
 * amounts already formatted in, so they never passed through `<Money>` and the
 * privacy toggle had no hold on them — the largest, most specific figures on the
 * page stayed on screen precisely when the user had asked for them to be hidden.
 *
 * The mask is applied to the string *before* it reaches the DOM, so the amount
 * is absent from the document rather than painted over: hidden DOM text is one
 * of the leak paths privacy has to close, and a CSS mask would leave the figure
 * in the page source and in the accessibility tree.
 *
 * Percentages, months and counts are deliberately untouched. A rate is not a
 * balance, and masking "24% above baseline" would destroy the sentence's meaning
 * while protecting nothing a shoulder-surfer could spend.
 */

/**
 * The written forms this catches, in the order they appear in real rule prose:
 *
 * - `₹3,870`, `₹ 3870.50`, `-₹45,230`, `₹1,25,00,000` (Indian grouping)
 * - `Rs. 45,230`, `Rs45230`, `INR 45,230`
 * - `45,230 INR` — the suffixed form, which no prefix pattern would catch
 *
 * It is a *secondary* defence and is documented as one. The primary defence is
 * that every figure the frontend renders itself goes through `<Money>`, and
 * that QA fixtures carry synthetic amounts — a regex over natural language can
 * never be complete, and building a monetary-language parser to chase the last
 * case would be a large amount of machinery guarding a surface the backend
 * should not be putting amounts into in the first place.
 */
const CURRENCY_PREFIXED = /(?:-|−)?\s?(?:₹|Rs\.?|INR)\s?\d[\d,]*(?:\.\d+)?/gi;
const CURRENCY_SUFFIXED = /(?:-|−)?\s?\d[\d,]*(?:\.\d+)?\s?(?:INR|Rs\.?)\b/gi;

const MASK = "₹••••••";

export function maskAmountsInProse(text: string): string {
  return text.replace(CURRENCY_PREFIXED, MASK).replace(CURRENCY_SUFFIXED, MASK);
}
