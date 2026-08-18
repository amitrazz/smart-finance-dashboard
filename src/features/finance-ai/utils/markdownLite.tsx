import React from "react";

/**
 * A deliberately small, dependency-free renderer for assistant prose.
 *
 * The backend's answers are grounded financial narration (see
 * docs/19-finance-agent.md, docs/20-finance-plans.md) — short paragraphs,
 * occasional bullet lists, bold figures — never arbitrary rich documents. A
 * full Markdown engine (tables, raw HTML passthrough, footnotes) is more
 * surface area than that content ever uses, and every one of those features
 * is a potential XSS vector if the model ever echoes attacker-supplied text
 * back (e.g. from an imported statement description). This renderer only
 * ever produces React elements from a fixed, known-safe set — there is no
 * `dangerouslySetInnerHTML` anywhere in this file, so there is nothing to
 * sanitize: unrecognised syntax just prints as literal text.
 *
 * Supported: paragraphs, **bold**, *italic*, `inline code`, `- `/`* ` bullet
 * lists, `1. ` numbered lists, and `[text](https://...)` links (only
 * http/https URLs are ever turned into an `<a>`; anything else — including
 * `javascript:`/`data:` — renders as plain text).
 */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Order matters: links first (so `**` inside link text doesn't get split
  // first), then code spans (so `*`/`_` inside code isn't reinterpreted),
  // then bold, then italic.
  const nodes: React.ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const key = `${keyPrefix}-${i++}`;
    if (match[1] !== undefined && match[2] !== undefined) {
      nodes.push(
        <a
          key={key}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="underline decoration-slate-600 underline-offset-2 hover:decoration-slate-400"
        >
          {match[1]}
        </a>,
      );
    } else if (match[3] !== undefined) {
      nodes.push(
        <code key={key} className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[0.85em]">
          {match[3]}
        </code>,
      );
    } else if (match[4] !== undefined) {
      nodes.push(
        <strong key={key} className="font-semibold text-slate-100">
          {match[4]}
        </strong>,
      );
    } else if (match[5] !== undefined) {
      nodes.push(
        <em key={key} className="italic">
          {match[5]}
        </em>,
      );
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

type Block =
  | { kind: "paragraph"; text: string }
  | { kind: "bullet-list"; items: string[] }
  | { kind: "numbered-list"; items: string[] };

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] | null = null;
  let listKind: "bullet-list" | "numbered-list" | null = null;

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      blocks.push({ kind: "paragraph", text: paragraphLines.join(" ").trim() });
      paragraphLines = [];
    }
  };
  const flushList = () => {
    if (listItems && listItems.length > 0 && listKind) {
      blocks.push({ kind: listKind, items: listItems });
    }
    listItems = null;
    listKind = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const bulletMatch = /^[-*]\s+(.*)$/.exec(line);
    const numberedMatch = /^\d+[.)]\s+(.*)$/.exec(line);

    if (bulletMatch) {
      flushParagraph();
      if (listKind !== "bullet-list") flushList();
      listKind = "bullet-list";
      listItems = listItems ?? [];
      listItems.push(bulletMatch[1]);
    } else if (numberedMatch) {
      flushParagraph();
      if (listKind !== "numbered-list") flushList();
      listKind = "numbered-list";
      listItems = listItems ?? [];
      listItems.push(numberedMatch[1]);
    } else if (line === "") {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraphLines.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

export const MarkdownLite: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const blocks = parseBlocks(text ?? "");
  if (blocks.length === 0) return null;

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        const key = `block-${index}`;
        if (block.kind === "paragraph") {
          return (
            <p key={key} className={index > 0 ? "mt-2" : undefined}>
              {renderInline(block.text, key)}
            </p>
          );
        }
        const ListTag = block.kind === "bullet-list" ? "ul" : "ol";
        return (
          <ListTag
            key={key}
            className={`${index > 0 ? "mt-2" : ""} ${block.kind === "bullet-list" ? "list-disc" : "list-decimal"} space-y-1 pl-5`}
          >
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>{renderInline(item, `${key}-${itemIndex}`)}</li>
            ))}
          </ListTag>
        );
      })}
    </div>
  );
};

export default MarkdownLite;
