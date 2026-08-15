/**
 * The Financial Story: the workspace's answer to "just tell me how I'm doing".
 *
 * ## What this is allowed to do
 *
 * Arrange figures the backend already reported into sentences. Nothing here
 * computes a financial quantity — every number in a story segment is a `Money`
 * or a percentage lifted directly from a mapped view model, which in turn came
 * from a backend snapshot. `mapChanges` supplies the movements, and it derives
 * only differences between two reported figures.
 *
 * ## What this must never do
 *
 * **Explain causes.** The data supports "income rose while spending fell"; it
 * does not support "you saved more *because* you ate out less". Every sentence
 * here is a conjunction, never a causal claim — `while`, `and`, `that left`,
 * never `because`, `due to`, `driven by`.
 *
 * **Predict.** No sentence extrapolates a trend forward. Projections come from
 * the backend forecast endpoint and are labelled as projections where shown.
 *
 * **Leak amounts.** A story is not a string. It is a list of segments, and money
 * lands in a `money` segment that renders through `<Money>` — so "hide amounts"
 * masks the narrative exactly as it masks the metrics. Formatting a rupee figure
 * into a sentence with template interpolation would put an unmaskable amount in
 * the DOM, which is the one thing privacy mode exists to prevent.
 */
import { Money } from "../../../types";
import { FinancialChange } from "../api/insightsMappers";
import { CashFlowAnalytics, NetWorthAnalytics } from "../types/insightsTypes";
import { formatExplicitPeriod, shortPeriodLabel } from "./insightsFormat";

export type StorySegment =
  | { kind: "text"; text: string }
  | { kind: "money"; value: Money }
  /**
   * `signed` distinguishes a *level* from a *movement*. A movement's direction
   * is already carried by the verb ("fell by 19.8 pts"), so its magnitude reads
   * unsigned; a level has no verb to carry it, and printing −69.8% as "69.8%"
   * inverts the fact. Visual QA caught exactly that: "Your savings rate fell by
   * 19.8 pts, to 69.8%" — describing a catastrophic rate as a healthy one.
   */
  | { kind: "percent"; value: number; unit: "%" | "pts"; signed?: boolean };

export interface StorySentence {
  id: string;
  segments: StorySegment[];
}

export type StoryVerdict = "improved" | "weakened" | "mixed" | "steady";

export interface FinancialStory {
  verdict: StoryVerdict;
  /** One line, stated plainly. The only sentence a reader in a hurry will read. */
  headline: StorySentence;
  /** Supporting movements, largest first. Never more than four. */
  detail: StorySentence[];
  /** What the comparison is against. Always shown — a change with no baseline is not a change. */
  basis: string;
  // Supporting context counts
  urgentActionsCount?: number;
  areasWorseningCount?: number;
  positiveChangesCount?: number;
  healthRating?: string;
}

const text = (t: string): StorySegment => ({ kind: "text", text: t });
const money = (value: Money): StorySegment => ({ kind: "money", value });
const percent = (value: number, unit: "%" | "pts" = "%", signed = false): StorySegment => ({
  kind: "percent",
  value,
  unit,
  signed,
});

/** Sign is carried by the sentence's verb ("rose"/"fell"), so figures read as magnitudes. */
function absolute(amount: Money): Money {
  const parsed = Math.abs(Number(amount.amount));
  return { amount: parsed.toFixed(2), currency: amount.currency };
}

function amountOf(change: FinancialChange | undefined): number | null {
  if (!change?.amount) return null;
  const parsed = Number(change.amount.amount);
  return Number.isFinite(parsed) ? parsed : null;
}

const VERDICT_HEADLINE: Record<StoryVerdict, string> = {
  improved: "Your financial position improved this period.",
  weakened: "Your financial position weakened this period.",
  mixed: "Your financial position moved in both directions this period.",
  steady: "Your financial position held steady this period.",
};

/**
 * Reads the verdict off the movements themselves — all of them.
 *
 * The first version read net worth, and stopped. Visual QA caught what that
 * produces on real data: a headline reading "Your financial position improved
 * this period" directly above "spending rose ₹53,165", "that left a shortfall of
 * ₹1,87,322" and "your savings rate fell by 19.8 points". Net worth had risen
 * because assets were revalued while the month's cash flow collapsed, and the
 * headline — the one line a reader in a hurry takes away — reported the good
 * half and hid the rest.
 *
 * So the verdict is now a vote across every movement, weighted by nothing:
 * each is simply favourable or not, and disagreement is reported as
 * disagreement. "Mixed" is the honest answer far more often than either
 * extreme, and it is the one answer that makes a reader look at the detail
 * beneath it.
 */
function verdictOf(changes: Map<string, FinancialChange>): StoryVerdict {
  const movements = [...changes.values()]
    .map((change) => {
      const value = change.points ?? amountOf(change);
      if (value === null || value === 0) return null;
      return value > 0 === change.upIsGood;
    })
    .filter((favourable): favourable is boolean => favourable !== null);

  if (movements.length === 0) return "steady";

  const favourable = movements.filter(Boolean).length;
  const adverse = movements.length - favourable;

  if (favourable > 0 && adverse > 0) return "mixed";
  return favourable > 0 ? "improved" : "weakened";
}

export function buildFinancialStory(input: {
  netWorth: NetWorthAnalytics | null;
  cashFlow: CashFlowAnalytics | null;
  changes: FinancialChange[];
  attentionCount?: number;
  healthRating?: string;
}): FinancialStory | null {
  const { cashFlow, changes, attentionCount, healthRating } = input;

  // A story is a comparison. With nothing to compare against there is no story,
  // and the caller renders "not enough history" instead of a paragraph of
  // present-tense figures dressed up as a narrative.
  if (changes.length === 0) return null;

  const byId = new Map(changes.map((c) => [c.id, c]));
  const verdict = verdictOf(byId);

  // Compute counts
  const movements = [...byId.values()]
    .map((change) => {
      const value = change.points ?? amountOf(change);
      if (value === null || value === 0) return null;
      return value > 0 === change.upIsGood;
    })
    .filter((favourable): favourable is boolean => favourable !== null);

  const positiveChangesCount = movements.filter(Boolean).length;
  const areasWorseningCount = movements.filter((x) => !x).length;
  const urgentActionsCount = attentionCount ?? 0;

  // Build the headline dynamically
  let headlineText = "";
  if (urgentActionsCount > 0) {
    headlineText = "Your finances need attention.";
  } else if (verdict === "weakened" || healthRating === "CRITICAL" || healthRating === "POOR") {
    headlineText = "Your financial position is under pressure.";
  } else if (verdict === "improved") {
    headlineText = "Your finances are improving.";
  } else if (verdict === "steady") {
    headlineText = "Your financial position held steady this period.";
  } else {
    headlineText = "Your financial position is mixed.";
  }

  const detail: StorySentence[] = [];

  // 1. Income against spending — the two movements that produce everything else.
  const income = byId.get("income");
  const spending = byId.get("spending");
  const incomeValue = amountOf(income);
  const spendingValue = amountOf(spending);

  if (income?.amount && spending?.amount && incomeValue !== null && spendingValue !== null) {
    // A movement of exactly zero is not a rise of ₹0. Visual QA caught the
    // first version rendering "Income rose ₹0 (0.0%)", which reads as a
    // rounding error in the data rather than as a flat month.
    const incomeClause: StorySegment[] =
      incomeValue === 0
        ? [text("Income was unchanged")]
        : [
            text(incomeValue > 0 ? "Income rose " : "Income fell "),
            money(absolute(income.amount)),
            ...(income.percent !== null && income.percent !== 0
              ? [text(" ("), percent(income.percent), text(")")]
              : []),
          ];

    const spendingClause: StorySegment[] =
      spendingValue === 0
        ? [text(" while spending was unchanged")]
        : [
            text(spendingValue > 0 ? " while spending rose " : " while spending fell "),
            money(absolute(spending.amount)),
            ...(spending.percent !== null && spending.percent !== 0
              ? [text(" ("), percent(spending.percent), text(")")]
              : []),
          ];

    // Both flat is not worth a sentence — the verdict already said "steady".
    if (incomeValue !== 0 || spendingValue !== 0) {
      detail.push({
        id: "income-vs-spending",
        segments: [...incomeClause, ...spendingClause, text(".")],
      });
    }
  }

  // 2. What that left. A measured figure from the snapshot, not income minus spending.
  if (cashFlow?.netCashFlow) {
    const net = Number(cashFlow.netCashFlow.amount);
    detail.push({
      id: "net-cash-flow",
      segments: [
        text(net >= 0 ? "That left " : "That left a shortfall of "),
        money(absolute(cashFlow.netCashFlow)),
        text(net >= 0 ? " of net cash flow." : " between what came in and what went out."),
      ],
    });
  }

  // 3. Savings rate, in points — a rate moving is not a rate's percentage moving.
  const savings = byId.get("savings-rate");
  if (savings?.points !== null && savings?.points !== undefined && savings.points !== 0) {
    detail.push({
      id: "savings-rate",
      segments: [
        text(savings.points > 0 ? "Your savings rate improved by " : "Your savings rate fell by "),
        percent(Math.abs(savings.points), "pts"),
        // Signed: this is the *level* the rate landed at, and a negative rate
        // printed without its sign says the opposite of what happened.
        ...(cashFlow?.savingsRatePercent !== null && cashFlow?.savingsRatePercent !== undefined
          ? [text(", to "), percent(cashFlow.savingsRatePercent, "%", true)]
          : []),
        text("."),
      ],
    });
  }

  // 4. The largest adverse movement, named. Stated as the movement it is — the
  //    data does not support calling it a cause of anything else.
  const adverse = changes
    .filter((change) => {
      const value = change.points ?? amountOf(change);
      return value !== null && value !== 0 && value > 0 !== change.upIsGood;
    })
    .sort((a, b) => Math.abs(amountOf(b) ?? b.points ?? 0) - Math.abs(amountOf(a) ?? a.points ?? 0))[0];

  if (adverse && adverse.id !== "spending") {
    const value = amountOf(adverse);
    detail.push({
      id: "largest-adverse",
      segments: [
        text(`The largest adverse movement was ${adverse.label.toLowerCase()}, `),
        ...(value !== null && adverse.amount
          ? [text(value > 0 ? "up " : "down "), money(absolute(adverse.amount))]
          : [
              text(
                (adverse.points ?? 0) > 0 ? "up " : "down ",
              ),
              percent(Math.abs(adverse.points ?? 0), "pts"),
            ]),
        text("."),
      ],
    });
  }

  const previousPeriod =
    cashFlow && cashFlow.history.length >= 2
      ? shortPeriodLabel(cashFlow.history[cashFlow.history.length - 2].month)
      : null;
  const currentPeriod = cashFlow ? shortPeriodLabel(cashFlow.period) : null;

  return {
    verdict,
    headline: { id: "headline", segments: [text(headlineText)] },
    detail: detail.slice(0, 4),
    basis:
      cashFlow?.periodStart && cashFlow?.periodEnd
        ? `Measured for the period ${formatExplicitPeriod(cashFlow.periodStart, cashFlow.periodEnd)} compared to the previous period.`
        : previousPeriod && currentPeriod
          ? `Measured between two recorded periods, ${previousPeriod} and ${currentPeriod}.`
          : "Measured between the two most recent recorded snapshots.",
    urgentActionsCount,
    areasWorseningCount,
    positiveChangesCount,
    healthRating,
  };
}
