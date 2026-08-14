import { IntelligenceItem } from "../../api/intelligenceModel";
import { Tone } from "../primitives/tone";

/**
 * How a feed item announces itself.
 *
 * Nature first, severity second — "is this a problem or an opening?" is the
 * question a reader answers before "how bad?". The label is always a word, never
 * a colour alone, so the distinction survives greyscale, a monochrome printout
 * and colour-blindness.
 *
 * Lives apart from the card because both the card and the detail drawer badge
 * the same item, and two copies of this mapping would eventually disagree about
 * what "high" looks like.
 */
export function itemBadge(item: IntelligenceItem): { label: string; tone: Tone } {
  if (item.nature === "opportunity") return { label: "Opportunity", tone: "info" };
  if (item.nature === "housekeeping") return { label: "Housekeeping", tone: "neutral" };
  switch (item.severity) {
    case "CRITICAL":
      return { label: "Critical", tone: "negative" };
    case "HIGH":
      return { label: "High", tone: "negative" };
    case "MEDIUM":
      return { label: "Medium", tone: "warning" };
    default:
      return { label: "Low", tone: "neutral" };
  }
}
