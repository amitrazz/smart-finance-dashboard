import React from "react";
import { Money } from "../../../../components/common/Money";
import { FinancialStory as Story, StorySegment, StoryVerdict } from "../../utils/financialStory";
import { Tone, TONE_CHIP } from "../primitives/tone";

const VERDICT_TONE: Record<StoryVerdict, Tone> = {
  improved: "positive",
  weakened: "negative",
  mixed: "warning",
  steady: "neutral",
};

const VERDICT_LABEL: Record<StoryVerdict, string> = {
  improved: "Improved",
  weakened: "Weakened",
  mixed: "Mixed",
  steady: "Steady",
};

/**
 * Money renders through `<Money>` so the narrative masks under "hide amounts"
 * exactly as the metrics do. Percentages are not masked: a rate is not a
 * balance, and hiding it would remove the sentence's meaning without protecting
 * anything a shoulder-surfer could spend.
 */
const Segment: React.FC<{ segment: StorySegment }> = ({ segment }) => {
  switch (segment.kind) {
    case "money":
      return (
        <span className="font-semibold tabular-nums text-slate-100">
          <Money value={segment.value} fractionDigits={0} />
        </span>
      );
    case "percent":
      return (
        <span className="font-semibold tabular-nums text-slate-100">
          {/* U+2212 MINUS SIGN, not a hyphen: it aligns with digits and reads as a sign. */}
          {segment.signed && segment.value < 0 ? "−" : ""}
          {Math.abs(segment.value).toFixed(1)}
          {segment.unit === "pts" ? " pts" : "%"}
        </span>
      );
    default:
      return <>{segment.text}</>;
  }
};

const Sentence: React.FC<{ segments: StorySegment[] }> = ({ segments }) => (
  <>
    {segments.map((segment, i) => (
      <Segment key={i} segment={segment} />
    ))}
  </>
);

/**
 * The signature capability: the state of someone's finances, in sentences.
 *
 * This exists because the honest alternative — eleven charts and a reader who
 * has to do the interpretation — is what the workspace was, and interpreting
 * eleven charts is a skill, not a product feature. Every figure in here is a
 * backend figure and every claim is a comparison, never a cause (see
 * `buildFinancialStory`).
 *
 * It reads first and largest on the page, above the metric row, because it is
 * the only element that answers the question people actually arrive with.
 */
export const FinancialStory: React.FC<{ story: Story }> = ({ story }) => {
  const tone = VERDICT_TONE[story.verdict];

  return (
    <div className="space-y-3">
      <span
        className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TONE_CHIP[tone]}`}
      >
        {VERDICT_LABEL[story.verdict]}
      </span>

      <p className="text-lg font-semibold leading-snug tracking-tight text-slate-50 sm:text-xl">
        <Sentence segments={story.headline.segments} />
      </p>

      {story.detail.length > 0 && (
        <div className="max-w-2xl space-y-1.5">
          {story.detail.map((sentence) => (
            <p key={sentence.id} className="text-sm leading-relaxed text-slate-300">
              <Sentence segments={sentence.segments} />
            </p>
          ))}
        </div>
      )}

      <p className="text-[11px] text-slate-500">{story.basis}</p>
    </div>
  );
};
